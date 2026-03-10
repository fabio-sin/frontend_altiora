import { Injectable, signal, computed } from '@angular/core';
import { UserProfile } from '../models/user.model';

const SESSION_KEY = 'altiora_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<UserProfile | null>(this._loadFromStorage());

  readonly user     = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  login(profile: UserProfile): void {
    this._user.set(profile);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(profile));
  }

  logout(): void {
    this._user.set(null);
    sessionStorage.removeItem(SESSION_KEY);
  }

  /** HTTP headers required by the backend for /chat and /search */
  getHeaders(): Record<string, string> {
    const u = this._user();
    if (!u) return {};
    return {
      'x-user-name':               u.name,
      'x-user-email':              u.email,
      'x-user-department':         u.department,
      'x-user-max-classification': u.maxClassification,
    };
  }

  /** Minimal header for /session endpoints */
  getSessionHeader(): Record<string, string> {
    const u = this._user();
    if (!u) return {};
    return { 'x-user-email': u.email };
  }

  private _loadFromStorage(): UserProfile | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as UserProfile) : null;
    } catch {
      return null;
    }
  }
}
