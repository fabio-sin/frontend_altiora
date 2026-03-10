// ── Mirrors app/models.py ────────────────────────────────────────────────────

export interface CVResult {
  filename: string;
  filepath: string;
  text: string;
  score: number;
  classification: string;
  modified_by: string;
}

export interface ChatRequest {
  query: string;
  top_k?: number;
}

/** POST /chat response */
export interface ChatResponse {
  query: string;
  answer: string;
  sources: CVResult[];
  applied_classification: string;
}

/** GET /session response */
export interface SessionHistory {
  email: string;
  exchanges: number;
  history: { role: 'user' | 'assistant'; content: string }[];
}
