import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/services/auth';
import { ProductService } from '../../core/services/product';
import {
  Product,
  ProductCategory,
  PRODUCT_CATEGORIES,
  productCategoryLabel,
} from '../products/models/product';
import { ProductGallery } from '../products/product-gallery/product-gallery';
import { NotificationError } from '../../core/services/notification-error';
import { CartService } from '../../core/services/cart';
import { TokenService } from '../../core/services/token';
import { CatalogSearchState } from '../../core/services/catalog-search-state';

@Component({
  selector: 'app-home',
  imports: [CurrencyPipe, FormsModule, ProductGallery],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly productService = inject(ProductService);
  readonly authService = inject(AuthService);
  private readonly notificationError = inject(NotificationError);
  private readonly cartService = inject(CartService);
  private readonly catalogSearchState = inject(CatalogSearchState);

  // home.ts
private readonly tokenService = inject(TokenService);
readonly isClient = computed(
  () => this.authService.isAuthenticated() && this.tokenService.isClient()
);
  

  readonly products = signal<Product[]>([]);
  readonly currentPage = signal(0);
  readonly pageSize = 10;
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly visiblePageNumbers = computed(() => {
    const total = this.totalPages();
    const start = Math.max(0, Math.min(this.currentPage() - 2, total - 5));
    const end = Math.min(total, start + 5);
    return Array.from({ length: end - start }, (_, index) => start + index);
  });
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly searchTerm = signal('');
  readonly hasSearched = signal(false);
  readonly searchPanelOpen = this.catalogSearchState.isOpen;
  readonly productCategories = PRODUCT_CATEGORIES;
  readonly categoryFilter = signal<ProductCategory | null>(null);
  readonly minPriceFilter = signal('');
  readonly maxPriceFilter = signal('');
  readonly filterError = signal('');

  readonly selectedProduct = signal<Product | null>(null);

  constructor() {
    this.loadProducts();
    this.catalogSearchState.close();

    if (this.isClient()) {
        this.cartService.getCart().subscribe();
    }
  }

  loadProducts(
    retryOnAuthError = true,
    page = this.currentPage(),
    keyword = '',
    category: ProductCategory | null = null,
    minPrice?: number,
    maxPrice?: number,
  ): void {
    this.loading.set(true);
    this.errorMessage.set('');

    const hasFilters =
      keyword.length > 0 ||
      category !== null ||
      minPrice !== undefined ||
      maxPrice !== undefined;
    const request = hasFilters
      ? this.productService.searchProducts(
          keyword,
          category,
          page,
          this.pageSize,
          minPrice,
          maxPrice,
        )
      : this.productService.getProducts(page, this.pageSize);

    request.subscribe({
      next: (result) => {
        this.products.set(result.content);
        this.currentPage.set(result.page);
        this.totalElements.set(result.totalElements);
        this.totalPages.set(result.totalPages);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);

        // The catalogue is public, but the gateway still rejects a stale JWT
        // that the interceptor attaches. Drop the bad token and retry once
        // as an anonymous request so products still load.
        if ((error.status === 401 || error.status === 403) && retryOnAuthError) {
          this.authService.logout();
          this.loadProducts(false, page, keyword, category, minPrice, maxPrice);
          console.log(error);
          
           this.notificationError.show(error.error.message, 'red')
          return;
        }

        this.errorMessage.set('Unable to load products. Please try again.');
      },
    });
  }

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onCategoryInput(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.categoryFilter.set(value ? (value as ProductCategory) : null);
  }

  onMinPriceInput(event: Event): void {
    this.minPriceFilter.set((event.target as HTMLInputElement).value);
  }

  onMaxPriceInput(event: Event): void {
    this.maxPriceFilter.set((event.target as HTMLInputElement).value);
  }

  searchProducts(): void {
    const keyword = this.searchTerm().trim();
    const minPrice = this.parsePrice(this.minPriceFilter());
    const maxPrice = this.parsePrice(this.maxPriceFilter());
    this.filterError.set('');

    if (minPrice === null || maxPrice === null) {
      this.filterError.set('Enter a valid price between 0 and 999,999.99.');
      return;
    }
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      this.filterError.set('The minimum price must be less than or equal to the maximum price.');
      return;
    }

    this.searchTerm.set(keyword);
    this.currentPage.set(0);
    this.hasSearched.set(
      keyword.length > 0 ||
        this.categoryFilter() !== null ||
        minPrice !== undefined ||
        maxPrice !== undefined,
    );
    this.catalogSearchState.close();
    this.loadProducts(true, 0, keyword, this.categoryFilter(), minPrice, maxPrice);
  }

  retryCurrentPage(): void {
    const minPrice = this.parsePrice(this.minPriceFilter());
    const maxPrice = this.parsePrice(this.maxPriceFilter());
    this.loadProducts(
      true,
      this.currentPage(),
      this.searchTerm().trim(),
      this.categoryFilter(),
      minPrice ?? undefined,
      maxPrice ?? undefined,
    );
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.categoryFilter.set(null);
    this.minPriceFilter.set('');
    this.maxPriceFilter.set('');
    this.hasSearched.set(false);
    this.filterError.set('');
    this.catalogSearchState.close();
    this.currentPage.set(0);
    this.loadProducts(true, 0);
  }

  goToPage(page: number): void {
    if (this.loading() || page < 0 || page >= this.totalPages()) return;

    const minPrice = this.parsePrice(this.minPriceFilter());
    const maxPrice = this.parsePrice(this.maxPriceFilter());
    if (minPrice === null || maxPrice === null) {
      this.filterError.set('Enter a valid price between 0 and 999,999.99.');
      this.catalogSearchState.open();
      return;
    }
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      this.filterError.set('The minimum price must be less than or equal to the maximum price.');
      this.catalogSearchState.open();
      return;
    }

    this.filterError.set('');
    this.currentPage.set(page);
    this.loadProducts(
      true,
      page,
      this.searchTerm().trim(),
      this.categoryFilter(),
      minPrice,
      maxPrice,
    );
  }

  private parsePrice(value: string): number | undefined | null {
    if (!value.trim()) return undefined;
    const price = Number(value);
    return Number.isFinite(price) && price >= 0 && price <= 999999.99
      ? price
      : null;
  }



// Add to cart from a product card
onAddToCart(product: Product, event: MouseEvent): void {
  event.stopPropagation();

 console.log('Adding product to cart:', product.id);

  this.cartService.addToCart({
    productId: product.id,
    quantity: 1,
  }).subscribe({
    next: () => {
      this.notificationError.show('Product added to cart', 'green');


    },
    error: (error) => {
      console.error('+++++++++++++', error);
      this.notificationError.show('Unable to add product to cart', 'red');
    },
  });
}

// Add to cart from the product gallery
addToCartFromGallery(event: {
  productId: string;
  quantity: number;
}): void {
  this.cartService.addToCart(event).subscribe({
    next: () => {
      console.log('Product added to cart');
      this.notificationError.show('Product added to cart', 'green');
       this.selectedProduct.set(null);
    },
    error: (error) => {
      console.error('Unable to add product to cart', error);
      this.notificationError.show('Unable to add product to cart', 'red');

    },
  });
}

  openGallery(product: Product): void {
    this.selectedProduct.set(product);
  }

  closeGallery(): void {
    this.selectedProduct.set(null);
  }

  coverImage(product: Product): string | null {
    return product.imagePaths?.[0] ?? null;
  }

  imageCount(product: Product): number {
    return product.imagePaths?.length ?? 0;
  }

  categoryLabel(category: ProductCategory | null | undefined): string {
    return productCategoryLabel(category);
  }


// ✅ Get the actual quantity in the customer's cart.
getCartQuantity(productId: string): number {
  const item = this.cartService.cart()?.items?.find(
    (item) => item.productId === productId
  );
  return item?.quantity ?? 0;
}
// ✅ Check whether the maximum available stock has been reached.
isStockReached(product: Product): boolean {
  if (product.quantity <= 0) return true;
  return this.getCartQuantity(product.id) >= product.quantity;
}
}
