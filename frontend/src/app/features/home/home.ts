import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../core/services/auth';
import { ProductService } from '../../core/services/product';
import { Product } from '../products/models/product';
import { ProductGallery } from '../products/product-gallery/product-gallery';
import { NotificationError } from '../../core/services/notification-error';

@Component({
  selector: 'app-home',
  imports: [CurrencyPipe, ProductGallery],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private notificationError = inject(NotificationError);

  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly selectedProduct = signal<Product | null>(null);

  constructor() {
    this.loadProducts();
  }

  loadProducts(retryOnAuthError = true): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);

        // The catalogue is public, but the gateway still rejects a stale JWT
        // that the interceptor attaches. Drop the bad token and retry once
        // as an anonymous request so products still load.
        if ((error.status === 401 || error.status === 403) && retryOnAuthError) {
          this.authService.logout();
          this.loadProducts(false);
          console.log(error);
          
           this.notificationError.show(error.error.message, 'red')
          return;
        }

        this.errorMessage.set('Unable to load products. Please try again.');
      },
    });
  }

  openGallery(product: Product): void {
    this.selectedProduct.set(product);
  }

  closeGallery(): void {
    this.selectedProduct.set(null);
  }

  /** First image of a product, or null when it has none. */
  coverImage(product: Product): string | null {
    return product.imagePaths?.[0] ?? null;
  }

  imageCount(product: Product): number {
    return product.imagePaths?.length ?? 0;
  }
}
