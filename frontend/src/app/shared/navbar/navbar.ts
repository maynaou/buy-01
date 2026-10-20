import { Component, computed, effect, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../core/services/auth';
import { TokenService } from '../../core/services/token';
import { CartService } from '../../core/services/cart';
import { CatalogSearchState } from '../../core/services/catalog-search-state';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private readonly authService = inject(AuthService);
  private readonly tokenService = inject(TokenService);
  private readonly cartService = inject(CartService);
  readonly catalogSearchState = inject(CatalogSearchState);
  private readonly router = inject(Router);

  readonly isAuthenticated = this.authService.isAuthenticated;

  readonly isSeller = computed(() => this.isAuthenticated() && this.tokenService.isSeller());
  readonly isClient = computed(() => this.isAuthenticated() && this.tokenService.isClient());
  readonly cartCount = this.cartService.cartCount;

  constructor() {
    effect(() => {
      if (this.isClient()) {
        this.cartService.refreshCartCount();
      }
    });
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  openCatalogSearch(): void {
    if (this.router.url.split('?')[0] === '/') {
      this.catalogSearchState.toggle();
    } else {
      this.catalogSearchState.open();
      this.router.navigateByUrl('/');
    }
  }
}
