"""
Pure pandas/numpy analysis helpers. No I/O here - everything takes a
DataFrame and returns JSON-serialisable primitives so FastAPI can hand
them straight to the frontend for Recharts to render.
"""
from __future__ import annotations

import io
import math
from typing import Any

import numpy as np
import pandas as pd


# --------------------------------------------------------------------------
# Loading
# --------------------------------------------------------------------------
def load_dataframe(filename: str, content: bytes) -> pd.DataFrame:
    name = filename.lower()
    if name.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(content))
    elif name.endswith((".xlsx", ".xls")):
        df = pd.read_excel(io.BytesIO(content))
    else:
        raise ValueError("Unsupported file type. Upload a .csv or .xlsx file.")

    if df.empty or df.shape[1] == 0:
        raise ValueError("The uploaded file has no usable data.")

    df.columns = [str(c).strip() for c in df.columns]
    df = _coerce_datetimes(df)
    return df


def _coerce_datetimes(df: pd.DataFrame) -> pd.DataFrame:
    """Best-effort detection of date-like text columns."""
    for col in df.columns:
        if df[col].dtype == object:
            sample = df[col].dropna().astype(str).head(20)
            if sample.empty:
                continue
            hits = 0
            for v in sample:
                try:
                    pd.to_datetime(v, errors="raise")
                    hits += 1
                except Exception:
                    pass
            if hits >= max(3, int(len(sample) * 0.7)):
                try:
                    df[col] = pd.to_datetime(df[col], errors="coerce")
                except Exception:
                    pass
    return df


def _clean(v: Any) -> Any:
    """Make a value JSON safe (NaN/NaT/np types -> native/None)."""
    if v is None:
        return None
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating,)):
        f = float(v)
        return None if (math.isnan(f) or math.isinf(f)) else round(f, 4)
    if isinstance(v, (pd.Timestamp,)):
        return v.isoformat()
    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
        return None
    return v


# --------------------------------------------------------------------------
# Profiling
# --------------------------------------------------------------------------
def profile_dataset(df: pd.DataFrame) -> dict[str, Any]:
    n_rows, n_cols = df.shape
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    datetime_cols = df.select_dtypes(include=["datetime64[ns]"]).columns.tolist()
    categorical_cols = [c for c in df.columns if c not in numeric_cols and c not in datetime_cols]

    missing_total = int(df.isna().sum().sum())
    missing_pct = round((missing_total / (n_rows * n_cols)) * 100, 2) if n_rows and n_cols else 0
    duplicate_rows = int(df.duplicated().sum())

    # Health score: penalise missing data, duplicates, and low column
    # variety. Purely heuristic, tuned to look sensible on typical data.
    missing_penalty = min(40, missing_pct * 1.2)
    dup_penalty = min(25, (duplicate_rows / n_rows * 100) if n_rows else 0)
    variety_bonus = 5 if (numeric_cols and categorical_cols) else 0
    health_score = max(0, min(100, round(100 - missing_penalty - dup_penalty + variety_bonus)))

    column_stats = []
    for col in df.columns:
        series = df[col]
        stat: dict[str, Any] = {
            "name": col,
            "dtype": "datetime" if col in datetime_cols else ("numeric" if col in numeric_cols else "categorical"),
            "missing": int(series.isna().sum()),
            "missing_pct": round(float(series.isna().mean()) * 100, 2),
            "unique": int(series.nunique(dropna=True)),
        }
        if col in numeric_cols:
            desc = series.describe()
            stat.update(
                {
                    "mean": _clean(desc.get("mean")),
                    "min": _clean(desc.get("min")),
                    "max": _clean(desc.get("max")),
                    "std": _clean(desc.get("std")),
                    "median": _clean(series.median()),
                }
            )
        elif col in datetime_cols:
            stat.update(
                {
                    "min": _clean(series.min()),
                    "max": _clean(series.max()),
                }
            )
        else:
            top = series.value_counts(dropna=True).head(3)
            stat["top_values"] = [{"value": str(k), "count": int(v)} for k, v in top.items()]
        column_stats.append(stat)

    return {
        "total_rows": n_rows,
        "total_columns": n_cols,
        "missing_values": missing_total,
        "missing_pct": missing_pct,
        "duplicate_rows": duplicate_rows,
        "numeric_columns": len(numeric_cols),
        "categorical_columns": len(categorical_cols),
        "datetime_columns": len(datetime_cols),
        "health_score": health_score,
        "numeric_column_names": numeric_cols,
        "categorical_column_names": categorical_cols,
        "datetime_column_names": datetime_cols,
        "column_stats": column_stats,
    }


# --------------------------------------------------------------------------
# Chart-ready data
# --------------------------------------------------------------------------
def generate_charts(df: pd.DataFrame, profile: dict[str, Any]) -> dict[str, Any]:
    numeric_cols = profile["numeric_column_names"]
    categorical_cols = profile["categorical_column_names"]
    datetime_cols = profile["datetime_column_names"]
    charts: dict[str, Any] = {}

    # ---- Line chart: trend of first numeric column over a date/index axis
    if numeric_cols:
        y_col = numeric_cols[0]
        if datetime_cols:
            x_col = datetime_cols[0]
            tmp = df[[x_col, y_col]].dropna().sort_values(x_col)
            if len(tmp) > 200:
                tmp = tmp.iloc[:: max(1, len(tmp) // 200)]
            charts["line"] = {
                "x_label": x_col,
                "y_label": y_col,
                "data": [
                    {"x": _clean(r[x_col]).split("T")[0] if isinstance(_clean(r[x_col]), str) else _clean(r[x_col]), "y": _clean(r[y_col])}
                    for _, r in tmp.iterrows()
                ],
            }
        else:
            tmp = df[y_col].dropna().reset_index(drop=True)
            if len(tmp) > 200:
                tmp = tmp.iloc[:: max(1, len(tmp) // 200)]
            charts["line"] = {
                "x_label": "Row #",
                "y_label": y_col,
                "data": [{"x": int(i), "y": _clean(v)} for i, v in tmp.items()],
            }

    # ---- Bar chart: mean of first numeric grouped by first categorical
    if numeric_cols and categorical_cols:
        cat_col, num_col = categorical_cols[0], numeric_cols[0]
        grouped = (
            df.groupby(cat_col)[num_col]
            .mean()
            .sort_values(ascending=False)
            .head(10)
        )
        charts["bar"] = {
            "category_label": cat_col,
            "value_label": f"Avg {num_col}",
            "data": [{"name": str(k), "value": _clean(v)} for k, v in grouped.items()],
        }

    # ---- Pie chart: distribution of first categorical column
    if categorical_cols:
        cat_col = categorical_cols[0]
        counts = df[cat_col].value_counts(dropna=True).head(6)
        charts["pie"] = {
            "label": cat_col,
            "data": [{"name": str(k), "value": int(v)} for k, v in counts.items()],
        }

    # ---- Histogram: distribution of first numeric column
    if numeric_cols:
        col = numeric_cols[0]
        values = df[col].dropna().values
        if len(values) > 0:
            counts, edges = np.histogram(values, bins=min(12, max(4, int(math.sqrt(len(values))))))
            charts["histogram"] = {
                "label": col,
                "data": [
                    {"bucket": f"{round(edges[i], 1)}–{round(edges[i + 1], 1)}", "count": int(counts[i])}
                    for i in range(len(counts))
                ],
            }

    # ---- Correlation heatmap
    if len(numeric_cols) >= 2:
        corr = df[numeric_cols].corr(numeric_only=True).round(2)
        charts["correlation"] = {
            "columns": numeric_cols,
            "matrix": [[_clean(v) for v in row] for row in corr.values.tolist()],
        }

    # ---- Scatter: first two numeric columns
    if len(numeric_cols) >= 2:
        x_col, y_col = numeric_cols[0], numeric_cols[1]
        tmp = df[[x_col, y_col]].dropna()
        if len(tmp) > 300:
            tmp = tmp.sample(300, random_state=42)
        charts["scatter"] = {
            "x_label": x_col,
            "y_label": y_col,
            "data": [{"x": _clean(r[x_col]), "y": _clean(r[y_col])} for _, r in tmp.iterrows()],
        }

    return charts


# --------------------------------------------------------------------------
# Rule-based insight generation (used as-is, or as grounding context for AI)
# --------------------------------------------------------------------------
def generate_insights(df: pd.DataFrame, profile: dict[str, Any]) -> list[str]:
    insights: list[str] = []
    numeric_cols = profile["numeric_column_names"]
    categorical_cols = profile["categorical_column_names"]
    datetime_cols = profile["datetime_column_names"]

    # Data quality
    if profile["missing_pct"] > 15:
        insights.append(
            f"Data quality flag: {profile['missing_pct']}% of all cells are missing — consider cleaning before deeper analysis."
        )
    if profile["duplicate_rows"] > 0:
        pct = round(profile["duplicate_rows"] / profile["total_rows"] * 100, 1)
        insights.append(f"{profile['duplicate_rows']} duplicate rows detected ({pct}% of the dataset).")

    # Trend on first numeric column over time
    if numeric_cols and datetime_cols:
        y_col, x_col = numeric_cols[0], datetime_cols[0]
        tmp = df[[x_col, y_col]].dropna().sort_values(x_col)
        if len(tmp) >= 4:
            first_half = tmp[y_col].iloc[: len(tmp) // 2].mean()
            second_half = tmp[y_col].iloc[len(tmp) // 2 :].mean()
            if first_half:
                change = round((second_half - first_half) / abs(first_half) * 100, 1)
                direction = "increased" if change > 0 else "dropped"
                if abs(change) >= 3:
                    insights.append(f"{y_col} {direction} {abs(change)}% comparing the first half of the timeline to the second half.")

    # Best/worst category by first numeric metric
    if numeric_cols and categorical_cols:
        cat_col, num_col = categorical_cols[0], numeric_cols[0]
        grouped = df.groupby(cat_col)[num_col].mean().sort_values(ascending=False)
        if len(grouped) >= 2:
            best, worst = grouped.index[0], grouped.index[-1]
            insights.append(f"'{best}' leads on average {num_col} ({_clean(grouped.iloc[0])}), while '{worst}' trails ({_clean(grouped.iloc[-1])}).")

    # Top category share
    if categorical_cols:
        cat_col = categorical_cols[0]
        counts = df[cat_col].value_counts(normalize=True, dropna=True)
        if len(counts):
            top_val, top_share = counts.index[0], round(counts.iloc[0] * 100, 1)
            insights.append(f"'{top_val}' is the most common value in {cat_col}, making up {top_share}% of records.")

    # Outliers via IQR on first numeric column
    if numeric_cols:
        col = numeric_cols[0]
        series = df[col].dropna()
        if len(series) >= 8:
            q1, q3 = series.quantile(0.25), series.quantile(0.75)
            iqr = q3 - q1
            outliers = series[(series < q1 - 1.5 * iqr) | (series > q3 + 1.5 * iqr)]
            if len(outliers) > 0:
                insights.append(f"{len(outliers)} outliers detected in {col} (values far outside the typical range).")

    # Strongest correlation pair
    if len(numeric_cols) >= 2:
        corr = df[numeric_cols].corr(numeric_only=True).abs()
        np.fill_diagonal(corr.values, 0)
        if corr.size:
            max_val = corr.values.max()
            if max_val >= 0.5:
                idx = np.unravel_index(corr.values.argmax(), corr.values.shape)
                c1, c2 = corr.columns[idx[0]], corr.columns[idx[1]]
                insights.append(f"{c1} and {c2} are strongly correlated (r={round(max_val, 2)}).")

    if not insights:
        insights.append("Dataset looks clean with no major anomalies — ready for deeper exploration.")

    return insights[:8]
