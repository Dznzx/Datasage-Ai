from __future__ import annotations

import os
from typing import Any

import pandas as pd

from utils.ai import _get_client, _context_summary


def build_report(df: pd.DataFrame, profile: dict[str, Any], insights: list[str], filename: str) -> dict[str, Any]:
    numeric_cols = profile["numeric_column_names"]
    categorical_cols = profile["categorical_column_names"]

    recommendations = []
    risks = []
    next_steps = [
        "Validate the findings above with a domain expert before acting on them.",
        "Automate this report to run on every new data refresh.",
        "Track the flagged KPIs on a recurring dashboard.",
    ]

    if profile["missing_pct"] > 10:
        risks.append(f"{profile['missing_pct']}% missing data could bias averages and totals — clean before decisions.")
        recommendations.append("Prioritise a data-cleaning pass on columns with the highest missing rates.")
    if profile["duplicate_rows"] > 0:
        risks.append(f"{profile['duplicate_rows']} duplicate rows may double-count totals.")
        recommendations.append("Deduplicate records before reporting totals to stakeholders.")
    if numeric_cols and categorical_cols:
        recommendations.append(
            f"Double down on top-performing {categorical_cols[0]} segments identified in the insights above."
        )
    if not recommendations:
        recommendations.append("Data quality is solid — focus next on deeper segmentation and cohort analysis.")
    if not risks:
        risks.append("No major data-quality risks detected in this pass.")

    exec_summary = (
        f"This report analyses '{filename}', containing {profile['total_rows']} rows and "
        f"{profile['total_columns']} columns. Overall dataset health scores {profile['health_score']}/100. "
        f"{insights[0] if insights else ''}"
    ).strip()

    ai_narrative = None
    client = _get_client()
    if client:
        try:
            summary = _context_summary(df, profile, insights)
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You write concise, executive-ready business report summaries. Max 120 words."},
                    {"role": "user", "content": f"Write an executive summary paragraph from this dataset summary:\n{summary}"},
                ],
                temperature=0.4,
                max_tokens=250,
            )
            ai_narrative = resp.choices[0].message.content.strip()
        except Exception:
            ai_narrative = None

    return {
        "title": f"Data Analysis Report — {filename}",
        "executive_summary": ai_narrative or exec_summary,
        "key_insights": insights,
        "recommendations": recommendations,
        "risks": risks,
        "next_steps": next_steps,
        "stats": {
            "total_rows": profile["total_rows"],
            "total_columns": profile["total_columns"],
            "health_score": profile["health_score"],
            "missing_pct": profile["missing_pct"],
            "duplicate_rows": profile["duplicate_rows"],
        },
    }


def render_pdf(report: dict[str, Any], output_path: str) -> str:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem, Table, TableStyle

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("TitleX", parent=styles["Title"], textColor=colors.HexColor("#0B0F1A"))
    h2 = ParagraphStyle("H2", parent=styles["Heading2"], textColor=colors.HexColor("#128A72"), spaceBefore=16)
    body = ParagraphStyle("BodyX", parent=styles["BodyText"], leading=16)

    doc = SimpleDocTemplate(output_path, pagesize=A4, topMargin=2 * cm, bottomMargin=2 * cm)
    story = [
        Paragraph(report["title"], title_style),
        Spacer(1, 12),
        Paragraph("Executive Summary", h2),
        Paragraph(report["executive_summary"], body),
        Paragraph("Key Insights", h2),
        ListFlowable([ListItem(Paragraph(i, body)) for i in report["key_insights"]], bulletType="bullet"),
        Paragraph("Business Recommendations", h2),
        ListFlowable([ListItem(Paragraph(i, body)) for i in report["recommendations"]], bulletType="bullet"),
        Paragraph("Potential Risks", h2),
        ListFlowable([ListItem(Paragraph(i, body)) for i in report["risks"]], bulletType="bullet"),
        Paragraph("Next Steps", h2),
        ListFlowable([ListItem(Paragraph(i, body)) for i in report["next_steps"]], bulletType="bullet"),
        Paragraph("Dataset Stats", h2),
    ]

    stats = report["stats"]
    table_data = [["Metric", "Value"]] + [[k.replace("_", " ").title(), str(v)] for k, v in stats.items()]
    table = Table(table_data, colWidths=[8 * cm, 6 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0B0F1A")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F4F6F8")]),
            ]
        )
    )
    story.append(table)

    doc.build(story)
    return output_path
