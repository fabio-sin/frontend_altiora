import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { UserProfile, Classification } from '../../models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-page">

      <!-- Background watermark -->
      <div class="bg-logo" aria-hidden="true">
        <img src="assets/logo.png" alt="" />
      </div>

      <div class="login-card">

        <!-- Logo + brand -->
        <div class="brand">
          <img src="assets/logo.png" class="logo" alt="Altiora Group" />
          <h1>Altiora <span>Assistant RH</span></h1>
          <p class="subtitle">Votre assistant intelligent d'analyse de candidatures</p>
        </div>

        <!-- Azure AD button (fake demo) -->
        <button class="azure-btn" (click)="onAzureClick()">
          <svg width="20" height="20" viewBox="0 0 23 23" fill="none">
            <path d="M1 1h10v10H1z" fill="#F25022"/>
            <path d="M12 1h10v10H12z" fill="#7FBA00"/>
            <path d="M1 12h10v10H1z"  fill="#00A4EF"/>
            <path d="M12 12h10v10H12z" fill="#FFB900"/>
          </svg>
          Se connecter avec Microsoft Azure AD
        </button>

        @if (azureToast()) {
          <div class="toast">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Azure AD non disponible en mode démo. Utilisez le formulaire ci-dessous.
          </div>
        }

        <!-- Divider -->
        <div class="divider"><span>ou remplissez le formulaire</span></div>

        <!-- Manual form -->
        <form class="form" (ngSubmit)="onSubmit()">

          <div class="field">
            <label>Nom complet</label>
            <input type="text" [(ngModel)]="form.name" name="name"
                   placeholder="ex: Jean Dupont" required />
          </div>

          <div class="field">
            <label>Adresse email</label>
            <input type="email" [(ngModel)]="form.email" name="email"
                   placeholder="ex: jean.dupont@altiora.com" required />
          </div>

          <div class="field">
            <label>Département</label>
            <select [(ngModel)]="form.department" name="department" required>
              <option value="" disabled selected>Sélectionnez votre département</option>
              <option value="RH">Ressources Humaines (RH)</option>
              <option value="FINANCE">Finance</option>
              <option value="ENGINEERING">Engineering</option>
              <option value="DIRECTION">Direction</option>
            </select>
          </div>

          <div class="field">
            <label>
              Niveau d'accès
              <span class="hint-icon" title="Détermine les documents auxquels vous avez accès">?</span>
            </label>
            <select [(ngModel)]="form.maxClassification" name="classification" required>
              <option value="" disabled selected>Sélectionnez votre niveau</option>
              <option value="public">Public — documents non sensibles</option>
              <option value="restricted">Restricted — documents confidentiels RH</option>
            </select>
          </div>

          @if (error()) {
            <p class="form-error">{{ error() }}</p>
          }

          <button type="submit" class="submit-btn" [disabled]="!isFormValid()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Accéder à l'assistant
          </button>

        </form>

        <p class="legal">
          En vous connectant, vous acceptez la politique de sécurité Altiora.<br/>
          Les données sont traitées en conformité avec la classification de vos documents.
        </p>

      </div>
    </div>
  `,
  styles: [`
    .login-page {
      width: 100vw;
      height: 100vh;
      background: #181818;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }

    /* ── Background watermark ── */
    .bg-logo {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      img {
        width: 520px;
        height: 520px;
        object-fit: contain;
        opacity: 0.03;
        filter: grayscale(20%);
      }
    }

    /* ── Card ── */
    .login-card {
      position: relative;
      z-index: 1;
      width: 420px;
      max-width: 92vw;
      background: #222;
      border: 1px solid #2e2e2e;
      border-radius: 20px;
      padding: 36px 32px 28px;
      box-shadow: 0 32px 80px rgba(0,0,0,.55);
      animation: fadeUp .3s ease;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Brand ── */
    .brand {
      text-align: center;
      margin-bottom: 26px;
    }
    .logo {
      width: 64px;
      height: 64px;
      object-fit: contain;
      margin-bottom: 14px;
      filter: drop-shadow(0 4px 14px rgba(46,204,113,.3));
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #f0f0f0;
      margin-bottom: 6px;
      span { color: #2ecc71; }
    }
    .subtitle {
      font-size: 13px;
      color: #606070;
      line-height: 1.5;
    }

    /* ── Azure AD button ── */
    .azure-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 11px 16px;
      background: #2a2a2a;
      border: 1px solid #3a3a3a;
      border-radius: 10px;
      color: #d0d0d0;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background .15s, border-color .15s;
      font-family: inherit;
      &:hover { background: #313131; border-color: #4a4a4a; }
    }

    /* ── Toast ── */
    .toast {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: #1a2a3a;
      border: 1px solid #1d4e6b;
      border-radius: 8px;
      padding: 10px 12px;
      margin-top: 10px;
      font-size: 12.5px;
      color: #7ec8e3;
      line-height: 1.45;
      svg { flex-shrink: 0; margin-top: 1px; }
    }

    /* ── Divider ── */
    .divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 20px 0 18px;
      color: #404050;
      font-size: 12px;
      &::before, &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: #2e2e2e;
      }
      span { white-space: nowrap; }
    }

    /* ── Form ── */
    .form { display: flex; flex-direction: column; gap: 14px; }
    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    label {
      font-size: 12.5px;
      font-weight: 500;
      color: #909090;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .hint-icon {
      width: 16px;
      height: 16px;
      background: #333;
      border-radius: 50%;
      font-size: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #777;
      cursor: help;
      font-style: normal;
    }
    input, select {
      background: #1a1a1a;
      border: 1.5px solid #2e2e2e;
      border-radius: 9px;
      padding: 10px 12px;
      color: #e8e8e8;
      font-size: 13.5px;
      font-family: inherit;
      outline: none;
      transition: border-color .2s;
      option { background: #1a1a1a; }
      &:focus { border-color: #2ecc71; }
      &::placeholder { color: #404050; }
    }

    .form-error {
      font-size: 12.5px;
      color: #e74c3c;
      padding: 8px 12px;
      background: rgba(231,76,60,.08);
      border: 1px solid rgba(231,76,60,.2);
      border-radius: 7px;
    }

    .submit-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 9px;
      padding: 12px;
      background: #2ecc71;
      border: none;
      border-radius: 10px;
      color: #fff;
      font-size: 14.5px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      margin-top: 4px;
      transition: background .15s, transform .1s;
      &:hover:not(:disabled) { background: #27ae60; transform: translateY(-1px); }
      &:disabled { background: #1e5c3a; color: #3a7a50; cursor: default; }
    }

    .legal {
      margin-top: 18px;
      font-size: 11px;
      color: #3a3a4a;
      text-align: center;
      line-height: 1.6;
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private chatService = inject(ChatService);

  form = {
    name:              '',
    email:             '',
    department:        '',
    maxClassification: '' as Classification | '',
  };

  error      = signal('');
  azureToast = signal(false);
  private _toastTimer: ReturnType<typeof setTimeout> | null = null;

  onAzureClick(): void {
    this.azureToast.set(true);
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => this.azureToast.set(false), 4000);
  }

  isFormValid(): boolean {
    return !!(
      this.form.name.trim() &&
      this.form.email.trim() &&
      this.form.department &&
      this.form.maxClassification
    );
  }

  onSubmit(): void {
    this.error.set('');
    if (!this.isFormValid()) {
      this.error.set('Veuillez remplir tous les champs.');
      return;
    }
    if (!this.form.email.includes('@')) {
      this.error.set('Adresse email invalide.');
      return;
    }
    const profile: UserProfile = {
      name:              this.form.name.trim(),
      email:             this.form.email.trim().toLowerCase(),
      department:        this.form.department,
      maxClassification: this.form.maxClassification as Classification,
    };
    this.authService.login(profile);
    // Load existing session from backend
    this.chatService.loadSession();
  }
}
