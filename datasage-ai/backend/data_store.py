"""
In-memory dataset store.

For a 24h hackathon MVP we keep everything in process memory instead of
standing up Redis/Postgres. Each upload gets a UUID. This is NOT
persistent across server restarts and is NOT safe for multi-worker
deployments (run uvicorn with --workers 1). Swap this module out for a
real cache/DB before shipping past the hackathon.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Optional

import pandas as pd


@dataclass
class Dataset:
    id: str
    filename: str
    df: pd.DataFrame
    profile: dict[str, Any] = field(default_factory=dict)
    charts: dict[str, Any] = field(default_factory=dict)
    insights: list[str] = field(default_factory=list)
    uploaded_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


class DatasetStore:
    def __init__(self) -> None:
        self._datasets: dict[str, Dataset] = {}
        self._order: list[str] = []  # most-recent-first upload ids

    def add(self, filename: str, df: pd.DataFrame) -> Dataset:
        dataset_id = uuid.uuid4().hex[:12]
        ds = Dataset(id=dataset_id, filename=filename, df=df)
        self._datasets[dataset_id] = ds
        self._order.insert(0, dataset_id)
        self._order = self._order[:10]  # keep last 10
        return ds

    def get(self, dataset_id: str) -> Optional[Dataset]:
        return self._datasets.get(dataset_id)

    def recent(self) -> list[dict[str, Any]]:
        out = []
        for did in self._order:
            ds = self._datasets.get(did)
            if not ds:
                continue
            out.append(
                {
                    "id": ds.id,
                    "filename": ds.filename,
                    "rows": int(ds.df.shape[0]),
                    "columns": int(ds.df.shape[1]),
                    "uploaded_at": ds.uploaded_at,
                }
            )
        return out


store = DatasetStore()
