export interface ColumnStat {
  name: string;
  dtype: "numeric" | "categorical" | "datetime";
  missing: number;
  missing_pct: number;
  unique: number;
  mean?: number;
  min?: number | string;
  max?: number | string;
  std?: number;
  median?: number;
  top_values?: { value: string; count: number }[];
}

export interface Profile {
  total_rows: number;
  total_columns: number;
  missing_values: number;
  missing_pct: number;
  duplicate_rows: number;
  numeric_columns: number;
  categorical_columns: number;
  datetime_columns: number;
  health_score: number;
  numeric_column_names: string[];
  categorical_column_names: string[];
  datetime_column_names: string[];
  column_stats: ColumnStat[];
}

export interface Charts {
  line?: { x_label: string; y_label: string; data: { x: string | number; y: number }[] };
  bar?: { category_label: string; value_label: string; data: { name: string; value: number }[] };
  pie?: { label: string; data: { name: string; value: number }[] };
  histogram?: { label: string; data: { bucket: string; count: number }[] };
  correlation?: { columns: string[]; matrix: number[][] };
  scatter?: { x_label: string; y_label: string; data: { x: number; y: number }[] };
}

export interface UploadResponse {
  dataset_id: string;
  filename: string;
  profile: Profile;
  charts: Charts;
  insights: string[];
}

export interface PreviewResponse {
  columns: string[];
  rows: string[][];
  total: number;
  page: number;
  page_size: number;
}

export interface ReportData {
  title: string;
  executive_summary: string;
  key_insights: string[];
  recommendations: string[];
  risks: string[];
  next_steps: string[];
  stats: Record<string, number>;
}

export interface RecentDataset {
  id: string;
  filename: string;
  rows: number;
  columns: number;
  uploaded_at: string;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  return res.json();
}

export const api = {
  async upload(file: File): Promise<UploadResponse> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    return handle(res);
  },

  async getDataset(id: string): Promise<UploadResponse> {
    const res = await fetch(`/api/dataset/${id}`);
    return handle(res);
  },

  async preview(id: string, page = 1, pageSize = 25, search = ""): Promise<PreviewResponse> {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize), search });
    const res = await fetch(`/api/dataset/${id}/preview?${params.toString()}`);
    return handle(res);
  },

  async chat(id: string, question: string): Promise<{ answer: string }> {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset_id: id, question }),
    });
    return handle(res);
  },

  async report(id: string): Promise<ReportData> {
    const res = await fetch(`/api/dataset/${id}/report`);
    return handle(res);
  },

  reportPdfUrl(id: string) {
    return `/api/dataset/${id}/report/pdf`;
  },

  downloadCleanUrl(id: string) {
    return `/api/dataset/${id}/download`;
  },

  sampleUrl() {
    return `/api/sample`;
  },

  async recent(): Promise<{ datasets: RecentDataset[] }> {
    const res = await fetch("/api/recent");
    return handle(res);
  },
};
