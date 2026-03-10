import { Injectable, signal, inject } from "@angular/core";
import { ApiService } from "./api.service";
import { SpeechService } from "./speech.service";
import { Message } from "../models/message.model";

@Injectable({ providedIn: "root" })
export class ChatService {
  private api = inject(ApiService);
  private speech = inject(SpeechService);

  // ── State ──────────────────────────────────────────────────────────────────
  messages = signal<Message[]>([]);
  isBotTyping = signal(false);
  isLoadingSession = signal(false);
  hasActiveSession = signal(false);
  sessionTitle = signal<string>("Session active");
  searchModalOpen = signal(false);

  /** Load existing session from backend on login */
  loadSession(): void {
    this.isLoadingSession.set(true);
    this.api.getSession().subscribe({
      next: (session) => {
        if (session.history.length > 0) {
          this.hasActiveSession.set(true);
          // Rebuild messages from history
          const msgs: Message[] = session.history.map((h, i) => ({
            id: `hist-${i}`,
            role: h.role,
            content: h.content,
            timestamp: new Date(),
          }));
          this.messages.set(msgs);
          // Use first user message as title
          const firstUser = session.history.find((h) => h.role === "user");
          if (firstUser) {
            this.sessionTitle.set(this._truncateTitle(firstUser.content));
          }
        }
        this.isLoadingSession.set(false);
      },
      error: () => {
        // Backend unreachable — start fresh, no error shown
        this.isLoadingSession.set(false);
      },
    });
  }

  /** Start a new chat — DELETE /session then clear UI */
  newChat(): void {
    this.speech.stopSpeaking(); // stop any ongoing TTS immediately
    this.api.deleteSession().subscribe({
      next: () => this._clearUI(),
      error: () => this._clearUI(), // clear UI even if backend fails
    });
  }

  /** Send a user message */
  /*
  sendMessage(content: string, images?: string[]): void {
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
      images,
      timestamp: new Date(),
    };
    this.messages.update((m) => [...m, userMsg]);
    this.isBotTyping.set(true);

    // Update session title from first message
    if (!this.hasActiveSession()) {
      this.sessionTitle.set(this._truncateTitle(content));
      this.hasActiveSession.set(true);
    }

    this.api.sendChat(content).subscribe({
      next: (resp) => {
        const botMsg: Message = {
          id: `b-${Date.now()}`,
          role: "assistant",
          content: resp.answer,
          timestamp: new Date(),
          sources: resp.sources,
          appliedClassification: resp.applied_classification,
        };
        this.messages.update((m) => [...m, botMsg]);
        this.isBotTyping.set(false);
      },
      error: (err) => {
        const status = err?.status;
        let errText =
          "Une erreur est survenue lors de la communication avec le serveur.";
        if (status === 404) {
          errText = "Aucun document pertinent trouvé pour cette question.";
        } else if (status === 0) {
          errText =
            "Impossible de joindre le serveur. Vérifiez que le backend est démarré sur `http://localhost:8000`.";
        }
        const errMsg: Message = {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: errText,
          timestamp: new Date(),
        };
        this.messages.update((m) => [...m, errMsg]);
        this.isBotTyping.set(false);
      },
    });
  }*/

  // send chat temporary (/search)
  sendMessage(content: string, images?: string[]): void {
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
      images,
      timestamp: new Date(),
    };
    this.messages.update((m) => [...m, userMsg]);
    this.isBotTyping.set(true);

    // Update session title from first message
    if (!this.hasActiveSession()) {
      this.sessionTitle.set(this._truncateTitle(content));
      this.hasActiveSession.set(true);
    }

    this.api.sendChat(content).subscribe({
      next: (resp: any) => {
        const botMsg: Message = {
          id: `b-${Date.now()}`,
          role: "assistant",
          content: resp.results
            .map(
              (r: any) =>
                `**${r.filename}** (score: ${r.score.toFixed(2)})\n${r.text}`,
            )
            .join("\n\n"),
          timestamp: new Date(),
          sources: resp.sources,
          appliedClassification: resp.applied_classification,
        };
        this.messages.update((m) => [...m, botMsg]);
        this.isBotTyping.set(false);
      },
      error: (err) => {
        const status = err?.status;
        let errText =
          "Une erreur est survenue lors de la communication avec le serveur.";
        if (status === 404) {
          errText = "Aucun document pertinent trouvé pour cette question.";
        } else if (status === 0) {
          errText =
            "Impossible de joindre le serveur. Vérifiez que le backend est démarré sur `http://localhost:8000`.";
        }
        const errMsg: Message = {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: errText,
          timestamp: new Date(),
        };
        this.messages.update((m) => [...m, errMsg]);
        this.isBotTyping.set(false);
      },
    });
  }

  private _clearUI(): void {
    this.messages.set([]);
    this.hasActiveSession.set(false);
    this.sessionTitle.set("Session active");
  }

  private _truncateTitle(text: string): string {
    const clean = text.trim().replace(/\s+/g, " ");
    return clean.length > 48 ? clean.slice(0, 48) + "…" : clean;
  }
}
