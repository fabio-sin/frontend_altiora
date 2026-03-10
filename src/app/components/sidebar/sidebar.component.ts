import { Component, inject } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  template: `
    <aside class="sidebar">

      <!-- ── Brand ── -->
      <div class="brand">
        <img src="assets/logo.png" class="brand-logo" alt="Altiora" />
        <span class="brand-name">Altiora</span>
      </div>

      <!-- ── Actions ── -->
      <div class="sidebar-actions">
        <button class="action-btn" (click)="newChat()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Nouveau chat
        </button>
        <button class="action-btn" (click)="cs.searchModalOpen.set(true)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          Rechercher des chats
        </button>
      </div>

      <!-- ── Conversations ── -->
      <div class="conv-section">
        <p class="conv-label">Session en cours</p>
        <div class="conv-list">
          @if (cs.isLoadingSession()) {
            <div class="skeleton-item"></div>
          } @else if (cs.hasActiveSession()) {
            <button class="conv-item active">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {{ cs.sessionTitle() }}
            </button>
          } @else {
            <p class="no-session">Aucune conversation en cours</p>
          }
        </div>
      </div>

      <!-- ── Footer: user info + logout ── -->
      <div class="sidebar-footer">
        <div class="user-card">
          <div class="user-avatar">{{ initials() }}</div>
          <div class="user-meta">
            <span class="user-name">{{ auth.user()?.name }}</span>
            <span class="user-dept">{{ auth.user()?.department }} · {{ auth.user()?.maxClassification }}</span>
          </div>
          <button class="logout-btn" (click)="logout()" title="Se déconnecter">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

    </aside>
  `,
  styles: [`
    :host {
      display: block;
      flex-shrink: 0;
    }
    .sidebar {
      width: 262px;
      min-width: 262px;
      height: 100vh;
      background: #171717;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #242424;
      overflow: hidden;
    }

    /* ── Brand ── */
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 14px 14px;
      border-bottom: 1px solid #242424;
    }
    .brand-logo {
      width: 30px; height: 30px;
      object-fit: contain;
      filter: drop-shadow(0 0 5px rgba(46,204,113,.3));
    }
    .brand-name {
      font-size: 15px;
      font-weight: 700;
      color: #f0f0f0;
      letter-spacing: .6px;
    }

    /* ── Action buttons ── */
    .sidebar-actions {
      padding: 10px 8px 6px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .action-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 8px 10px;
      background: none;
      border: none;
      border-radius: 8px;
      color: #c8c8c8;
      font-size: 13.5px;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      transition: background .15s;
      svg { opacity: .7; flex-shrink: 0; }
      &:hover { background: #242424; color: #fff; svg { opacity: 1; } }
    }

    /* ── Conversations ── */
    .conv-section {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      padding: 6px 8px 0;
      overflow-y: auto;
    }
    .conv-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #505060;
      padding: 6px 10px 5px;
    }
    .conv-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .conv-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 10px;
      background: none;
      border: none;
      border-radius: 8px;
      color: #b0b0b0;
      font-size: 13px;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: background .15s;
      &.active { background: #272727; color: #fff; font-weight: 500; }
      &.mock   { opacity: .45; cursor: default; }
      &:hover:not(.mock):not(.active) { background: #1f1f1f; color: #e0e0e0; }
    }
    .no-session {
      font-size: 12.5px;
      color: #404050;
      padding: 8px 10px;
      font-style: italic;
    }
    .skeleton-item {
      height: 34px;
      background: #1e1e1e;
      border-radius: 8px;
      animation: shimmer 1.6s ease-in-out infinite;
    }
    @keyframes shimmer {
      0%,100% { opacity: .3; } 50% { opacity: .6; }
    }

    /* ── Footer ── */
    .sidebar-footer {
      padding: 10px 8px 12px;
      border-top: 1px solid #242424;
    }
    .user-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 6px 8px 10px;
      border-radius: 8px;
      transition: background .15s;
      &:hover { background: #1f1f1f; }
    }
    .user-avatar {
      width: 34px; height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1a3a5c 0%, #2ecc71 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }
    .user-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .user-name {
      font-size: 13px;
      font-weight: 500;
      color: #e0e0e0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-dept {
      font-size: 10.5px;
      color: #505060;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .logout-btn {
      background: none;
      border: none;
      color: #505060;
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      flex-shrink: 0;
      transition: color .15s, background .15s;
      &:hover { color: #e74c3c; background: rgba(231,76,60,.1); }
    }
  `]
})
export class SidebarComponent {
  cs   = inject(ChatService);
  auth = inject(AuthService);

  initials(): string {
    const name = this.auth.user()?.name ?? '';
    return name.split(' ').map(w => w[0] ?? '').slice(0, 2).join('').toUpperCase();
  }

  newChat(): void {
    this.cs.newChat();
  }

  logout(): void {
    this.cs.newChat();   // clear session
    this.auth.logout();
  }
}
