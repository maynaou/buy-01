import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  getUserId(): string | null {
    const payload = this.readPayload();
    const sub = payload?.['sub'];
    return typeof sub === 'string' ? sub : null;
  }

  getRoles(): string[] {
    const payload = this.readPayload();
    const scope = payload?.['scope'];
    return typeof scope === 'string' ? scope.split(/\s+/).filter(Boolean) : [];
  }

  isSeller(): boolean {
    return this.getRoles().includes('ROLE_SELLER');
  }

  private readPayload(): Record<string, unknown> | null {
    const token = this.getAccessToken();
    if (!token) {
      return null;
    }

    const segments = token.split('.');
    if (segments.length !== 3) {
      return null;
    }

    try {
      const base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
      const padding = (4 - (base64.length % 4)) % 4;
      const payload: unknown = JSON.parse(atob(base64 + '='.repeat(padding)));

      return payload && typeof payload === 'object'
        ? (payload as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
}
