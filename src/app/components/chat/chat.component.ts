import {
  Component, inject, signal, effect,
  ViewChild, ElementRef,
  AfterViewChecked, OnDestroy
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { SpeechService } from '../../services/speech.service';
import { Message } from '../../models/message.model';
import { CVResult } from '../../models/api.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="chat-wrapper">

      <!-- ══ Messages area ══════════════════════════════════════════════════ -->
      <div class="messages-area" #messagesArea>

        @if (cs.messages().length === 0 && !cs.isBotTyping()) {
          <!-- Empty / welcome state -->
          <div class="welcome">
            <img src="assets/logo.png" class="welcome-logo" alt="Altiora" />
            <h1>Bonjour, {{ firstName() }} 👋</h1>
            <p>Posez une question sur les candidatures, les profils RH, ou dictez votre message.</p>
            <div class="suggestions">
              @for (s of suggestions; track s.label) {
                <button class="suggestion-chip" (click)="useSuggestion(s.query)">
                  {{ s.label }}
                </button>
              }
            </div>
          </div>
        } @else {
          <!-- Watermark logo -->
          <div class="watermark" aria-hidden="true">
            <img src="assets/logo.png" alt="" />
          </div>

          <!-- Message list -->
          <div class="messages-list">

            @for (msg of cs.messages(); track msg.id) {
              <div class="msg-row" [class.user]="msg.role === 'user'" [class.bot]="msg.role === 'assistant'">

                @if (msg.role === 'assistant') {
                  <div class="avatar bot-av">
                    <img src="assets/logo.png" alt="Altiora" />
                  </div>
                }

                <div class="bubble-wrap">
                  <div class="bubble" [class.user-bubble]="msg.role === 'user'">
                    @if (msg.images && msg.images.length > 0) {
                      <div class="img-row">
                        @for (img of msg.images; track img) {
                          <img [src]="img" class="thumb" alt="Image envoyée" />
                        }
                      </div>
                    }
                    <div class="bubble-text" [innerHTML]="format(msg.content)"></div>

                    <!-- Bot message actions -->
                    @if (msg.role === 'assistant') {
                      <div class="msg-actions">
                        <!-- TTS button -->
                        <button class="action-icon"
                          [class.active]="activeTtsId() === msg.id"
                          (click)="toggleTts(msg)"
                          [title]="activeTtsId() === msg.id ? 'Arrêter' : 'Lire à voix haute'">
                          @if (activeTtsId() === msg.id) {
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <rect x="6" y="5" width="4" height="14" rx="1"/>
                              <rect x="14" y="5" width="4" height="14" rx="1"/>
                            </svg>
                          } @else {
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" stroke-width="2" stroke-linecap="round">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                            </svg>
                          }
                        </button>
                        <!-- Classification badge -->
                        @if (msg.appliedClassification) {
                          <span class="classif-badge" [class.public]="msg.appliedClassification === 'public'">
                            {{ msg.appliedClassification }}
                          </span>
                        }
                      </div>

                      <!-- Sources -->
                      @if (msg.sources && msg.sources.length > 0) {
                        <div class="sources">
                          <button class="sources-toggle"
                            (click)="toggleSources(msg.id)">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" stroke-width="2" stroke-linecap="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14 2 14 8 20 8"/>
                            </svg>
                            {{ msg.sources.length }} source{{ msg.sources.length > 1 ? 's' : '' }} consultée{{ msg.sources.length > 1 ? 's' : '' }}
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
                                 [style.transform]="openSources().has(msg.id) ? 'rotate(180deg)' : 'rotate(0)'">
                              <polyline points="6 9 12 15 18 9"/>
                            </svg>
                          </button>
                          @if (openSources().has(msg.id)) {
                            <div class="sources-list">
                              @for (src of msg.sources; track src.filename) {
                                <div class="source-chip">
                                  <span class="src-name">{{ src.filename }}</span>
                                  <span class="src-score">{{ (src.score * 100).toFixed(0) }}%</span>
                                  <span class="src-classif" [class.public]="src.classification === 'public'">
                                    {{ src.classification }}
                                  </span>
                                </div>
                              }
                            </div>
                          }
                        </div>
                      }
                    }
                  </div>
                </div>

                @if (msg.role === 'user') {
                  <div class="avatar user-av">{{ initials() }}</div>
                }

              </div>
            }

            <!-- Typing indicator -->
            @if (cs.isBotTyping()) {
              <div class="msg-row bot">
                <div class="avatar bot-av">
                  <img src="assets/logo.png" alt="Altiora" />
                </div>
                <div class="bubble-wrap">
                  <div class="bubble">
                    <div class="typing">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              </div>
            }

          </div>
        }
      </div>

      <!-- ══ Input area ════════════════════════════════════════════════════ -->
      <div class="input-area">

        <!-- Pending image previews -->
        @if (pendingImages().length > 0) {
          <div class="pending-images">
            @for (img of pendingImages(); track img; let i = $index) {
              <div class="pending-thumb-wrap">
                <img [src]="img" class="pending-thumb" alt="image" />
                <button class="remove-thumb" (click)="removeImage(i)">×</button>
              </div>
            }
          </div>
        }

        <div class="input-box" [class.focused]="isFocused">
          <!-- Attach image -->
          <button class="tool-btn" (click)="fileRef.click()" title="Joindre une image">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </button>
          <input #fileRef type="file" accept="image/*" multiple
            style="display:none" (change)="onFilesSelected($event)" />

          <textarea
            #textArea
            [(ngModel)]="inputText"
            placeholder="Poser une question sur les candidatures…"
            (focus)="isFocused = true"
            (blur)="isFocused = false"
            (keydown)="onKeyDown($event)"
            (input)="autoGrow(textArea)"
            rows="1"
            class="text-input">
          </textarea>

          <div class="right-tools">
            <!-- Mic -->
            <button class="tool-btn"
              [class.recording]="speech.isListening()"
              (click)="toggleStt()"
              [title]="speech.isListening() ? 'Arrêter la dictée' : 'Dicter un message'">
              @if (speech.isListening()) {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#e74c3c">
                  <rect x="5" y="5" width="14" height="14" rx="2"/>
                </svg>
              } @else {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              }
            </button>

            <!-- Send -->
            <button class="send-btn"
              [disabled]="!canSend()"
              (click)="send()"
              title="Envoyer (Entrée)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>

        <p class="disclaimer">
          Altiora Assistant analyse uniquement les documents indexés. Résultats filtrés selon votre niveau d'accès : <strong>{{ auth.user()?.maxClassification }}</strong>.
        </p>
      </div>

    </div>
  `,
  styles: [`
    :host {
      flex: 1;
      display: flex;
      min-width: 0;
      overflow: hidden;
    }
    .chat-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #212121;
      overflow: hidden;
      min-width: 0;
      width: 100%;
    }

    /* ── Messages area ── */
    .messages-area {
      flex: 1;
      overflow-y: auto;
      position: relative;
      scroll-behavior: smooth;
    }

    /* ── Welcome ── */
    .welcome {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      padding: 24px;
      width: 100%;
      max-width: 560px;
      pointer-events: none;
    }
    .welcome-logo {
      width: 68px; height: 68px;
      object-fit: contain;
      margin-bottom: 18px;
      filter: drop-shadow(0 4px 12px rgba(46,204,113,.3));
    }
    .welcome h1 {
      font-size: 24px;
      font-weight: 600;
      color: #e8e8e8;
      margin-bottom: 8px;
    }
    .welcome p {
      font-size: 14px;
      color: #585868;
      line-height: 1.55;
      margin-bottom: 22px;
    }
    .suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
      pointer-events: all;
    }
    .suggestion-chip {
      background: #2a2a2a;
      border: 1px solid #3a3a3a;
      border-radius: 20px;
      color: #c0c0c0;
      font-size: 12.5px;
      padding: 7px 14px;
      cursor: pointer;
      font-family: inherit;
      transition: background .15s, border-color .15s, color .15s;
      &:hover { background: #323232; border-color: #2ecc71; color: #fff; }
    }

    /* ── Watermark ── */
    .watermark {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 0;
      img {
        width: 260px; height: 260px;
        object-fit: contain;
        opacity: 0.032;
      }
    }

    /* ── Messages list ── */
    .messages-list {
      position: relative;
      z-index: 1;
      padding: 28px 28px 16px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }

    /* ── Message row ── */
    .msg-row {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      &.user { flex-direction: row-reverse; }
    }

    /* ── Avatars ── */
    .avatar {
      width: 36px; height: 36px;
      border-radius: 50%;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .bot-av {
      background: #1a3a5c;
      border: 1.5px solid #224d7a;
      img { width: 22px; height: 22px; object-fit: contain; }
    }
    .user-av {
      background: linear-gradient(135deg, #1a3a5c 0%, #27ae60 100%);
      font-size: 11px;
      font-weight: 700;
      color: #fff;
    }

    /* ── Bubble ── */
    .bubble-wrap { min-width: 0; max-width: calc(100% - 54px); }
    .bubble {
      padding: 11px 15px 10px;
      font-size: 14px;
      line-height: 1.7;
      color: #e8e8e8;
    }
    .user-bubble {
      background: #2f2f2f;
      border-radius: 18px 4px 18px 18px;
      border: 1px solid #3a3a3a;
    }
    .bubble-text {
      white-space: pre-wrap;
      word-break: break-word;
    }

    /* ── Image thumbs ── */
    .img-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
    .thumb {
      max-width: 200px; max-height: 200px;
      border-radius: 10px; object-fit: cover;
      border: 1px solid #3a3a3a;
    }

    /* ── Msg actions ── */
    .msg-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
    }
    .action-icon {
      background: none;
      border: none;
      cursor: pointer;
      color: #555565;
      padding: 4px 6px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      transition: color .15s, background .15s;
      &:hover { color: #b0b0c0; background: #2a2a2a; }
      &.active { color: #2ecc71; }
    }
    .classif-badge {
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 10px;
      background: rgba(231,76,60,.12);
      border: 1px solid rgba(231,76,60,.25);
      color: #e74c3c;
      font-weight: 500;
      &.public {
        background: rgba(46,204,113,.1);
        border-color: rgba(46,204,113,.25);
        color: #2ecc71;
      }
    }

    /* ── Sources ── */
    .sources { margin-top: 8px; }
    .sources-toggle {
      display: flex;
      align-items: center;
      gap: 6px;
      background: none;
      border: 1px solid #2e2e2e;
      border-radius: 8px;
      padding: 5px 10px;
      color: #606070;
      font-size: 12px;
      cursor: pointer;
      font-family: inherit;
      transition: border-color .15s, color .15s, background .15s;
      svg { transition: transform .2s; }
      &:hover { border-color: #3a3a4a; color: #909090; background: #252525; }
    }
    .sources-list {
      margin-top: 6px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .source-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      background: #1e1e1e;
      border: 1px solid #2a2a2a;
      border-radius: 7px;
    }
    .src-name {
      flex: 1;
      font-size: 12px;
      color: #9090a0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .src-score {
      font-size: 11px;
      color: #2ecc71;
      font-weight: 600;
      flex-shrink: 0;
    }
    .src-classif {
      font-size: 10px;
      padding: 1px 6px;
      border-radius: 8px;
      background: rgba(231,76,60,.1);
      color: #e74c3c;
      flex-shrink: 0;
      &.public { background: rgba(46,204,113,.1); color: #2ecc71; }
    }

    /* ── Typing ── */
    .typing {
      display: flex;
      gap: 5px;
      padding: 4px 2px;
      span {
        width: 7px; height: 7px;
        background: #555;
        border-radius: 50%;
        animation: bounce 1.3s ease-in-out infinite;
        &:nth-child(1) { animation-delay: 0s; }
        &:nth-child(2) { animation-delay: .18s; }
        &:nth-child(3) { animation-delay: .36s; }
      }
    }
    @keyframes bounce {
      0%,80%,100% { transform: translateY(0); opacity: .4; }
      40%          { transform: translateY(-6px); opacity: 1; }
    }

    /* ── Input area ── */
    .input-area {
      padding: 12px 24px 18px;
      background: #212121;
      flex-shrink: 0;
    }
    .pending-images {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }
    .pending-thumb-wrap { position: relative; }
    .pending-thumb {
      width: 56px; height: 56px;
      border-radius: 8px; object-fit: cover;
      border: 1px solid #3a3a3a;
    }
    .remove-thumb {
      position: absolute;
      top: -6px; right: -6px;
      width: 18px; height: 18px;
      background: #e74c3c;
      border: none; border-radius: 50%;
      color: #fff; font-size: 14px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      line-height: 1;
    }

    .input-box {
      background: #2a2a2a;
      border: 1.5px solid #363636;
      border-radius: 16px;
      display: flex;
      align-items: flex-end;
      gap: 6px;
      padding: 8px 10px 8px 12px;
      transition: border-color .2s;
      &.focused { border-color: #2ecc71; }
    }
    .tool-btn {
      background: none;
      border: none;
      color: #505060;
      cursor: pointer;
      padding: 7px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      flex-shrink: 0;
      transition: color .15s, background .15s;
      &:hover { color: #b0b0c0; background: #363636; }
      &.recording { color: #e74c3c; }
    }
    .text-input {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      color: #ececec;
      font-size: 14.5px;
      line-height: 1.55;
      resize: none;
      max-height: 200px;
      overflow-y: auto;
      padding: 4px 0;
      font-family: inherit;
      &::placeholder { color: #404050; }
    }
    .right-tools {
      display: flex;
      align-items: center;
      gap: 2px;
      flex-shrink: 0;
    }
    .send-btn {
      background: #2ecc71;
      border: none;
      border-radius: 9px;
      color: #fff;
      cursor: pointer;
      width: 36px; height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background .15s, transform .1s;
      &:hover:not(:disabled) { background: #27ae60; transform: scale(1.05); }
      &:disabled { background: #222; color: #3a3a4a; cursor: default; }
    }
    .disclaimer {
      margin: 8px 0 0;
      text-align: center;
      font-size: 11px;
      color: #383848;
      strong { color: #505060; }
    }
  `]
})
export class ChatComponent implements AfterViewChecked, OnDestroy {
  cs     = inject(ChatService);
  auth   = inject(AuthService);
  speech = inject(SpeechService);
  private sanitizer = inject(DomSanitizer);

  @ViewChild('messagesArea') messagesArea!: ElementRef<HTMLElement>;

  readonly suggestions = [
    { label: "Qui a de l’expérience Python ?",          query: "Qui a de l’expérience en développement Python ?" },
    { label: "Expérience en gestion de projet ?",   query: "Quel candidat a le plus d’expérience en gestion de projet ?" },
    { label: "Profils data scientist ?",          query: "Montre-moi les profils data scientist disponibles" },
  ];

  inputText     = '';
  isFocused     = false;
  pendingImages = signal<string[]>([]);
  activeTtsId   = signal<string | null>(null);
  openSources   = signal<Set<string>>(new Set());

  private shouldScroll = false;
  private ttsInterval: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      void this.cs.messages();
      void this.cs.isBotTyping();
      this.shouldScroll = true;
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) { this.scrollToBottom(); this.shouldScroll = false; }
  }

  ngOnDestroy(): void {
    this.speech.stopSpeaking();
    this.speech.stopListening();
    if (this.ttsInterval) clearInterval(this.ttsInterval);
  }

  firstName(): string {
    return this.auth.user()?.name.split(' ')[0] ?? '';
  }

  initials(): string {
    const name = this.auth.user()?.name ?? '';
    return name.split(' ').map((w: string) => w[0] ?? '').slice(0, 2).join('').toUpperCase();
  }

  canSend(): boolean {
    return (this.inputText.trim().length > 0 || this.pendingImages().length > 0)
      && !this.cs.isBotTyping();
  }

  useSuggestion(text: string): void {
    this.inputText = text;
    this.send();
  }

  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (this.canSend()) this.send();
    }
  }

  autoGrow(el: HTMLTextAreaElement): void {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }

  onFilesSelected(e: Event): void {
    const files = (e.target as HTMLInputElement).files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        this.pendingImages.update((imgs: string[]) => [...imgs, ev.target!.result as string]);
      };
      reader.readAsDataURL(file);
    });
    (e.target as HTMLInputElement).value = '';
  }

  removeImage(index: number): void {
    this.pendingImages.update((imgs: string[]) => imgs.filter((_: string, i: number) => i !== index));
  }

  send(): void {
    if (!this.canSend()) return;
    const text   = this.inputText.trim();
    const images = [...this.pendingImages()];
    this.inputText = '';
    this.pendingImages.set([]);
    this.cs.sendMessage(text, images.length ? images : undefined);
  }

  async toggleStt(): Promise<void> {
    if (this.speech.isListening()) { this.speech.stopListening(); return; }
    try {
      const transcript = await this.speech.startListening();
      this.inputText += (this.inputText ? ' ' : '') + transcript;
    } catch { /* mic denied */ }
  }

  toggleTts(msg: Message): void {
    if (this.activeTtsId() === msg.id) {
      this.speech.stopSpeaking();
      this.activeTtsId.set(null);
      if (this.ttsInterval) { clearInterval(this.ttsInterval); this.ttsInterval = null; }
    } else {
      if (this.ttsInterval) clearInterval(this.ttsInterval);
      this.activeTtsId.set(msg.id);
      this.speech.speak(msg.content);
      this.ttsInterval = setInterval(() => {
        if (!this.speech.isSpeaking()) {
          this.activeTtsId.set(null);
          clearInterval(this.ttsInterval!);
          this.ttsInterval = null;
        }
      }, 400);
    }
  }

  toggleSources(msgId: string): void {
    this.openSources.update(s => {
      const next = new Set(s);
      next.has(msgId) ? next.delete(msgId) : next.add(msgId);
      return next;
    });
  }

  format(raw: string): SafeHtml {
    const escaped = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const html = escaped
      .replace(/```(?:\w+)?\n?([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private scrollToBottom(): void {
    const el = this.messagesArea?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
