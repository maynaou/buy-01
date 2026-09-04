import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../core/services/auth';
import { TokenService } from '../../core/services/token';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private authService = inject(AuthService);
  private tokenService = inject(TokenService);
  private router = inject(Router);

  readonly isAuthenticated = this.authService.isAuthenticated;

  readonly isSeller = computed(() => this.isAuthenticated() && this.tokenService.isSeller());

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
