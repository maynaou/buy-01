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

  /**
   * The access token's `sub` claim — the user id the backend authorises
   * against (`authentication.getName()`). Needed for the avatar upload URL,
   * since the profile response does not carry the id.
   *
   * Reads the payload only; the signature is verified by the gateway.
   */
  getUserId(): string | null {
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

      if (payload && typeof payload === 'object' && 'sub' in payload) {
        const sub = (payload as { sub: unknown }).sub;
        return typeof sub === 'string' ? sub : null;
      }

      return null;
    } catch {
      return null;
    }
  }
}
