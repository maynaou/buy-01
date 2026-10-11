import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

import { Product } from '../models/product';
import { TokenService } from '../../../core/services/token';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-product-gallery',
  imports: [CurrencyPipe],
  templateUrl: './product-gallery.html',
  styleUrl: './product-gallery.scss',
  host: {
    '(document:keydown.escape)': 'galleryClosed.emit()',
    '(document:keydown.arrowright)': 'next()',
    '(document:keydown.arrowleft)': 'previous()',
  },
})
export class ProductGallery {
  readonly product = input.required<Product>();

  readonly galleryClosed = output<void>();

  readonly currentIndex = signal(0);

  readonly images = computed(() => this.product().imagePaths ?? []);

  readonly currentImage = computed(() => this.images()[this.currentIndex()] ?? null);

  readonly hasMultiple = computed(() => this.images().length > 1);

  readonly addToCart = output<{ productId: string; quantity: number }>();

    readonly authService = inject(AuthService);
  

  private readonly tokenService = inject(TokenService);
readonly isClient = computed(
  () => this.authService.isAuthenticated() && this.tokenService.isClient()
);
  

  readonly quantity = signal(1);

  addProductToCart(): void {
    if (this.product().quantity <= 0) return;

  this.addToCart.emit({
    productId: this.product().id,
    quantity: this.quantity(),
  });
}

  constructor() {
    // Reopening on a different product must start from its first image.
    effect(() => {
      this.product();
      this.currentIndex.set(0);
      // this.quantity.set(1);
    });
  }

  select(index: number): void {
    this.currentIndex.set(index);
  }

  next(): void {
    const total = this.images().length;
    if (total > 1) {
      this.currentIndex.update((index) => (index + 1) % total);
    }
  }

  previous(): void {
    const total = this.images().length;
    if (total > 1) {
      this.currentIndex.update((index) => (index - 1 + total) % total);
    }
  }
}
