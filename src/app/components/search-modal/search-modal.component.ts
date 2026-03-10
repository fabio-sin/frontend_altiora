import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-search-modal',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="overlay" (click)="closeOnOverlay($event)">
      <div class="modal">

        <div class="modal-head">
          <span class="modal-title">Rechercher dans les conversations</span>
          <button class="close-btn" (click)="close()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="search-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.2" stroke-linecap="round" style="color:#555;flex-shrink:0">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" [(ngModel)]="query" (input)="onInput()"
                 (keydown.escape)="close()"
                 placeholder="Rechercher dans l'historique…"
                 class="search-input" autocomplete="off" />
        </div>

        <div class="results">
          @if (!query.trim()) {
            <!-- All conversations -->
            @if (cs.hasActiveSession()) {
              <p class="results-label">Session active</p>
              <button class="result-item active-item" (click)="close()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {{ cs.sessionTitle() }}
              </button>
            }

          } @else {
            <!-- Filtered results -->
            @if (filtered().length === 0) {
              <p class="hint">Aucune conversation ne correspond à <strong>"{{ query }}"</strong></p>
            } @else {
              <p class="results-label">{{ filtered().length }} résultat(s)</p>
              @for (item of filtered(); track item.id) {
                <button class="result-item" [class.active-item]="item.id === 'session'"
                        (click)="item.id === 'session' ? close() : null">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span [innerHTML]="highlight(item.title)"></span>
                </button>
              }
            }
          }
        </div>

      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.72);
      z-index: 999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn .15s ease;
    }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    .modal {
      width: 520px;
      max-width: 92vw;
      max-height: 68vh;
      background: #272727;
      border: 1px solid #333;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 32px 80px rgba(0,0,0,.6);
      animation: slideIn .2s ease;
      overflow: hidden;
    }
    @keyframes slideIn {
      from{transform:translateY(-16px);opacity:0}
      to{transform:translateY(0);opacity:1}
    }
    .modal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px 12px;
      border-bottom: 1px solid #313131;
    }
    .modal-title { font-size: 14px; font-weight: 600; color: #e0e0e0; }
    .close-btn {
      background: none; border: none; color: #666;
      cursor: pointer; padding: 5px; border-radius: 6px;
      display: flex; transition: color .15s, background .15s;
      &:hover { color: #ccc; background: #333; }
    }
    .search-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 11px 18px;
      border-bottom: 1px solid #2e2e2e;
    }
    .search-input {
      flex: 1; background: none; border: none; outline: none;
      color: #e8e8e8; font-size: 14px; font-family: inherit;
      &::placeholder { color: #484858; }
    }
    .results {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }
    .results-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .8px;
      color: #505060;
      padding: 6px 10px 5px;
    }
    .hint {
      padding: 20px 12px;
      text-align: center;
      color: #585868;
      font-size: 13px;
      strong { color: #888; }
    }
    .result-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 9px 10px;
      background: none;
      border: none;
      border-radius: 8px;
      color: #c0c0c0;
      font-size: 13px;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      transition: background .15s;
      span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      &:hover:not(.mock-item) { background: #313131; color: #f0f0f0; }
      &.active-item { color: #fff; font-weight: 500; }
      &.mock-item { opacity: .4; cursor: default; }
    }
    :global(.hl) { color: #2ecc71; font-weight: 600; }
  `]
})
export class SearchModalComponent implements OnInit, OnDestroy {
  cs    = inject(ChatService);
  query = '';
  filtered = signal<{ id: string; title: string }[]>([]);
  private debounce: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    setTimeout(() => {
      (document.querySelector('.search-input') as HTMLInputElement | null)?.focus();
    }, 60);
  }

  ngOnDestroy(): void {
    if (this.debounce) clearTimeout(this.debounce);
  }

  onInput(): void {
    if (this.debounce) clearTimeout(this.debounce);
    const q = this.query.trim().toLowerCase();
    if (!q) { this.filtered.set([]); return; }
    this.debounce = setTimeout(() => {
      const all: { id: string; title: string }[] = [];
      if (this.cs.hasActiveSession()) {
        all.push({ id: 'session', title: this.cs.sessionTitle() });
      }
      this.filtered.set(all.filter(c => c.title.toLowerCase().includes(q)));
    }, 220);
  }

  highlight(title: string): string {
    const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    if (!this.query.trim()) return esc(title);
    const q = esc(this.query.trim()).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    return esc(title).replace(new RegExp(`(${q})`, 'gi'), '<span class="hl">$1</span>');
  }

  close(): void { this.cs.searchModalOpen.set(false); }
  closeOnOverlay(e: MouseEvent): void { if (e.target === e.currentTarget) this.close(); }
}
