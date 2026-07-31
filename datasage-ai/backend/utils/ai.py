"""
Natural-language chat over a dataset.

If OPENAI_API_KEY is set, questions are answered by an LLM grounded with
a compact statistical summary of the dataset (never the raw rows, to
keep prompts small and avoid ever leaking full data verbatim). If no key
is configured, a rule-based responder handles the common hackathon-demo
question patterns so the app still works fully offline.
"""
from __future__ import annotations

import os
import re
from typing import Any

import numpy as np
import pandas as pd

_client = None


def _get_client():
    global _client
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    if _client is None:
        from openai import OpenAI

        _client = OpenAI(api_key=api_key)
    return _client


def _context_summary(df: pd.DataFrame, profile: dict[str, Any], insights: list[str]) -> str:
    lines = [
        f"Rows: {profile['total_rows']}, Columns: {profile['total_columns']}",
        f"Numeric columns: {', '.join(profile['numeric_column_names']) or 'none'}",
        f"Categorical columns: {', '.join(profile['categorical_column_names']) or 'none'}",
        f"Missing data: {profile['missing_pct']}%, Duplicate rows: {profile['duplicate_rows']}",
        "Known insights:",
    ]
    lines += [f"- {i}" for i in insights]
    for stat in profile["column_stats"][:12]:
        if stat["dtype"] == "numeric":
            lines.append(f"Column '{stat['name']}': mean={stat.get('mean')}, min={stat.get('min')}, max={stat.get('max')}")
        elif stat["dtype"] == "categorical" and stat.get("top_values"):
            tops = ", ".join(f"{t['value']} ({t['count']})" for t in stat["top_values"])
            lines.append(f"Column '{stat['name']}' top values: {tops}")
    return "\n".join(lines)


def answer_question(question: str, df: pd.DataFrame, profile: dict[str, Any], insights: list[str]) -> str:
    client = _get_client()
    if client:
        try:
            summary = _context_summary(df, profile, insights)
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are DataSage AI, a sharp, concise data analyst. Answer using ONLY the "
                            "dataset summary provided. Be specific with numbers when you have them, and "
                            "say clearly when something can't be determined from the summary. Keep answers "
                            "under 120 words unless asked for a full report."
                        ),
                    },
                    {"role": "user", "content": f"Dataset summary:\n{summary}\n\nQuestion: {question}"},
                ],
                temperature=0.4,
                max_tokens=350,
            )
            return resp.choices[0].message.content.strip()
        except Exception as e:  # fall through to heuristic responder
            return _heuristic_answer(question, df, profile, insights) + f"\n\n(AI provider unavailable, used built-in analysis: {e})"

    return _heuristic_answer(question, df, profile, insights)


def _find_col(q: str, candidates: list[str]) -> str | None:
    tokens = [t.strip(",.?!'\"") for t in q.split()]
    for c in candidates:
        if c.lower() in tokens:
            return c
    for c in candidates:
        if c.lower() in q:
            return c
    return None


def _heuristic_answer(question: str, df: pd.DataFrame, profile: dict[str, Any], insights: list[str]) -> str:
    q = question.lower().strip()
    numeric_cols = profile["numeric_column_names"]
    categorical_cols = profile["categorical_column_names"]
    datetime_cols = profile["datetime_column_names"]
    find_col = lambda candidates: _find_col(q, candidates)

    # Summarize
    if any(w in q for w in ["summarize", "summary", "overview"]):
        return (
            f"This dataset has {profile['total_rows']} rows and {profile['total_columns']} columns "
            f"({profile['numeric_columns']} numeric, {profile['categorical_columns']} categorical). "
            f"Data health score is {profile['health_score']}/100 with {profile['missing_pct']}% missing values "
            f"and {profile['duplicate_rows']} duplicate rows. Key finding: {insights[0] if insights else 'no major anomalies found.'}"
        )

    # Forecast / predict
    if any(w in q for w in ["predict", "forecast", "next month", "next quarter", "next week"]):
        target_num = find_col(numeric_cols)
        return _forecast_answer(df, profile, target_num)

    # Discontinue / worst performer
    if "discontinue" in q or "worst" in q or "underperform" in q:
        if numeric_cols and categorical_cols:
            cat_col = find_col(categorical_cols) or categorical_cols[0]
            num_col = find_col(numeric_cols) or numeric_cols[0]
            grouped = df.groupby(cat_col)[num_col].mean().sort_values()
            if len(grouped):
                worst = grouped.index[0]
                return (
                    f"Based on average {num_col}, '{worst}' is the weakest performer in {cat_col} "
                    f"({round(float(grouped.iloc[0]), 2)} vs. dataset average {round(float(df[num_col].mean()), 2)}). "
                    "Worth reviewing before any decision, since this is based on averages alone."
                )
        return "I need at least one numeric and one categorical column to rank performers."

    # Highest / top by category
    if any(w in q for w in ["highest", "top", "best", "most"]):
        target_num = find_col(numeric_cols) or (numeric_cols[0] if numeric_cols else None)
        target_cat = find_col(categorical_cols) or (categorical_cols[0] if categorical_cols else None)
        if target_num and target_cat:
            grouped = df.groupby(target_cat)[target_num].sum().sort_values(ascending=False)
            if len(grouped):
                return f"'{grouped.index[0]}' has the highest total {target_num}: {round(float(grouped.iloc[0]), 2)}."
        if target_num:
            idx = df[target_num].idxmax()
            return f"The highest {target_num} is {round(float(df.loc[idx, target_num]), 2)} at row {idx}."
        return "I couldn't find a numeric column to rank — try naming one from your dataset."

    # Lowest / bottom
    if any(w in q for w in ["lowest", "bottom", "least", "minimum"]):
        target_num = find_col(numeric_cols) or (numeric_cols[0] if numeric_cols else None)
        target_cat = find_col(categorical_cols) or (categorical_cols[0] if categorical_cols else None)
        if target_num and target_cat:
            grouped = df.groupby(target_cat)[target_num].sum().sort_values()
            if len(grouped):
                return f"'{grouped.index[0]}' has the lowest total {target_num}: {round(float(grouped.iloc[0]), 2)}."
        return "I couldn't find enough columns to answer that — try naming a specific column."

    # Trend / explain
    if any(w in q for w in ["trend", "explain", "growth", "decline", "change over time"]):
        trend_insight = next((i for i in insights if "%" in i and ("increased" in i or "dropped" in i)), None)
        return trend_insight or "No clear time-based trend was detected — this dataset may not have a usable date column, or the metric is flat."

    # Outliers
    if "outlier" in q or "anomal" in q:
        outlier_insight = next((i for i in insights if "outlier" in i.lower()), None)
        return outlier_insight or "No significant outliers were detected using the IQR method on the primary numeric column."

    # Correlation
    if "correlat" in q or "relationship" in q:
        corr_insight = next((i for i in insights if "correlated" in i.lower()), None)
        return corr_insight or "No strong correlations (|r| ≥ 0.5) were found between the numeric columns."

    # Missing / quality
    if "missing" in q or "quality" in q or "clean" in q:
        return f"{profile['missing_values']} missing values ({profile['missing_pct']}%) and {profile['duplicate_rows']} duplicate rows across the dataset."

    # KPI request
    if "kpi" in q:
        kpis = [f"Rows: {profile['total_rows']}", f"Health score: {profile['health_score']}/100"]
        if numeric_cols:
            col = numeric_cols[0]
            kpis.append(f"Avg {col}: {round(float(df[col].mean()), 2)}")
            kpis.append(f"Total {col}: {round(float(df[col].sum()), 2)}")
        return " | ".join(kpis)

    # Fallback: try to match a column name mentioned directly
    mentioned = find_col(numeric_cols + categorical_cols + datetime_cols)
    if mentioned and mentioned in numeric_cols:
        s = df[mentioned].describe()
        return f"'{mentioned}' ranges from {round(float(s['min']),2)} to {round(float(s['max']),2)}, averaging {round(float(s['mean']),2)}."
    if mentioned and mentioned in categorical_cols:
        top = df[mentioned].value_counts().head(1)
        return f"The most frequent value in '{mentioned}' is '{top.index[0]}' ({int(top.iloc[0])} occurrences)."

    return (
        "I can help with trends, top/bottom performers, outliers, correlations, forecasts, and summaries. "
        "Try: \"Which " + (categorical_cols[0] if categorical_cols else "category") + " has the highest "
        + (numeric_cols[0] if numeric_cols else "value") + "?\""
    )


def _forecast_answer(df: pd.DataFrame, profile: dict[str, Any], target_col: str | None = None) -> str:
    numeric_cols = profile["numeric_column_names"]
    datetime_cols = profile["datetime_column_names"]
    if not numeric_cols:
        return "I need a numeric column to forecast — none was found in this dataset."

    y_col = target_col or numeric_cols[0]
    if datetime_cols:
        x_col = datetime_cols[0]
        tmp = df[[x_col, y_col]].dropna().sort_values(x_col)
    else:
        tmp = df[[y_col]].dropna().reset_index()
        tmp.columns = ["_idx", y_col]

    if len(tmp) < 4:
        return "Not enough data points to build a reliable forecast (need at least 4)."

    y = tmp[y_col].values.astype(float)
    x = np.arange(len(y))
    slope, intercept = np.polyfit(x, y, 1)
    next_val = slope * len(y) + intercept
    trend_word = "rise" if slope > 0 else "fall"
    pct_change = round((slope / (abs(y.mean()) or 1)) * 100, 2)
    return (
        f"Using a simple linear trend on {y_col}, the next period is projected to be about "
        f"{round(float(next_val), 2)} — a continued {trend_word} of roughly {abs(pct_change)}% per period. "
        "This is a lightweight linear estimate, not a full forecasting model — treat it as directional."
    )
