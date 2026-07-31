from __future__ import annotations

import io
import os
import tempfile

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

from data_store import store
from utils.ai import answer_question
from utils.analysis import generate_charts, generate_insights, load_dataframe, profile_dataset
from utils.report import build_report, render_pdf

load_dotenv()

app = FastAPI(title="DataSage AI API", version="1.0.0")

origins = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _get_dataset_or_404(dataset_id: str):
    ds = store.get(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found. Upload a file first.")
    return ds


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/recent")
def recent():
    return {"datasets": store.recent()}


@app.get("/api/sample")
def sample_dataset():
    """Serve a bundled demo CSV so judges can try the app without a file."""
    path = os.path.join(os.path.dirname(__file__), "sample_data", "sample_sales.csv")
    return FileResponse(path, filename="sample_sales.csv", media_type="text/csv")


@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    content = await file.read()
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (25MB max).")
    try:
        df = load_dataframe(file.filename, content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    ds = store.add(file.filename, df)
    ds.profile = profile_dataset(df)
    ds.charts = generate_charts(df, ds.profile)
    ds.insights = generate_insights(df, ds.profile)

    return {
        "dataset_id": ds.id,
        "filename": ds.filename,
        "profile": ds.profile,
        "charts": ds.charts,
        "insights": ds.insights,
    }


@app.get("/api/dataset/{dataset_id}")
def get_dataset(dataset_id: str):
    ds = _get_dataset_or_404(dataset_id)
    return {
        "dataset_id": ds.id,
        "filename": ds.filename,
        "profile": ds.profile,
        "charts": ds.charts,
        "insights": ds.insights,
    }


@app.get("/api/dataset/{dataset_id}/preview")
def preview(dataset_id: str, page: int = 1, page_size: int = 25, search: str = ""):
    ds = _get_dataset_or_404(dataset_id)
    df = ds.df
    if search:
        mask = df.astype(str).apply(lambda col: col.str.contains(search, case=False, na=False)).any(axis=1)
        df = df[mask]
    total = len(df)
    start = (page - 1) * page_size
    end = start + page_size
    page_df = df.iloc[start:end].fillna("")
    return {
        "columns": list(page_df.columns),
        "rows": page_df.astype(str).values.tolist(),
        "total": total,
        "page": page,
        "page_size": page_size,
    }


class ChatRequest(BaseModel):
    dataset_id: str
    question: str


@app.post("/api/chat")
def chat(req: ChatRequest):
    ds = _get_dataset_or_404(req.dataset_id)
    answer = answer_question(req.question, ds.df, ds.profile, ds.insights)
    return {"answer": answer}


@app.get("/api/dataset/{dataset_id}/download")
def download_clean(dataset_id: str):
    ds = _get_dataset_or_404(dataset_id)
    clean_df = ds.df.drop_duplicates().copy()
    buf = io.StringIO()
    clean_df.to_csv(buf, index=False)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=cleaned_{ds.filename.rsplit('.',1)[0]}.csv"},
    )


@app.get("/api/dataset/{dataset_id}/report")
def report_json(dataset_id: str):
    ds = _get_dataset_or_404(dataset_id)
    report = build_report(ds.df, ds.profile, ds.insights, ds.filename)
    return report


@app.get("/api/dataset/{dataset_id}/report/pdf")
def report_pdf(dataset_id: str):
    ds = _get_dataset_or_404(dataset_id)
    report = build_report(ds.df, ds.profile, ds.insights, ds.filename)
    tmp_path = os.path.join(tempfile.gettempdir(), f"datasage_report_{dataset_id}.pdf")
    render_pdf(report, tmp_path)
    return FileResponse(tmp_path, filename="DataSage_Report.pdf", media_type="application/pdf")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
