import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { AuthService } from "./auth.service";
import { ChatRequest, ChatResponse, SessionHistory } from "../models/api.model";

const BASE = "/api"; // proxied to http://localhost:8000 in dev

@Injectable({ providedIn: "root" })
export class ApiService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  // ── POST /chat ─────────────────────────────────────────────────────────────
  /*sendChat(query: string, topK = 5): Observable<ChatResponse> {
    const body: ChatRequest = { query, top_k: topK };
    return this.http.post<ChatResponse>(`${BASE}/chat`, body, {
      headers: new HttpHeaders(this.auth.getHeaders()),
    });
  }*/

  // ── POST /search ─────────────────────────────────────────────────────────────
  sendChat(query: string, topK = 5): Observable<ChatResponse> {
    const body: ChatRequest = { query, top_k: topK };
    return this.http.post<any>(`${BASE}/search`, body, {
      headers: new HttpHeaders(this.auth.getHeaders()),
    });
  }

  // ── GET /session ────────────────────────────────────────────────────────────
  getSession(): Observable<SessionHistory> {
    return this.http.get<SessionHistory>(`${BASE}/session`, {
      headers: new HttpHeaders(this.auth.getSessionHeader()),
    });
  }

  // ── DELETE /session ─────────────────────────────────────────────────────────
  deleteSession(): Observable<{ status: string; email: string }> {
    return this.http.delete<{ status: string; email: string }>(
      `${BASE}/session`,
      {
        headers: new HttpHeaders(this.auth.getSessionHeader()),
      },
    );
  }

  // ── GET /health ─────────────────────────────────────────────────────────────
  health(): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(`${BASE}/health`);
  }
}
