import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { RegisterRequest } from '../../features/auth/models/register-request';
import { LoginRequest } from '../../features/auth/models/login-request'
import { AuthResponse } from '../../features/auth/models/auth-response'
import { TokenService } from './token';

@Injectable({
  providedIn: 'root'
})

export class AuthService {

  private http = inject(HttpClient);
  private tokenService = inject(TokenService);

  private readonly authUrl = `${environment.apiUrl}/api/auth`;

  private authenticatedSignal = signal(this.tokenService.isAuthenticated());

  readonly isAuthenticated = this.authenticatedSignal.asReadonly();

  register(request: RegisterRequest) {
    return this.http.post(`${this.authUrl}/register`, request,
      { responseType: 'text' }
    );
  }


  login(request: LoginRequest) {
    return this.http.post<AuthResponse>(
      `${this.authUrl}/login`,
      request
    );
  }

  logout(): void {
    this.tokenService.clearTokens();
    this.authenticatedSignal.set(false);
  }

  setAuthenticated(): void {
    this.authenticatedSignal.set(true);
  }
} 