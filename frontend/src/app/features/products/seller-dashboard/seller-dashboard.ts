import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, retry, throwError, timer } from 'rxjs';

import { MediaService } from '../../../core/services/media';
import { ProductService } from '../../../core/services/product';
import { OrderService, TopSellingProduct } from '../../../core/services/order';
import {
  PRODUCT_CATEGORIES,
  Product,
  ProductCategory,
  ProductRequest,
  productCategoryLabel,
} from '../models/product';
import { ProductImage } from '../models/product-image';
import { NotificationError } from '../../../core/services/notification-error';
import { Order, OrderStatus } from '../../checkout/models/order';

const MAX_IMAGE_BYTES = 1024 * 1024;

const MAX_PRICE = 999999.99;

const OWNERSHIP_RETRIES = 3;

interface PendingImage {
  file: File;
  previewUrl: string;
}


function greaterThanZero(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === '') {
    return null;
  }
  return Number(value) > 0 ? null : { greaterThanZero: true };
}

function wholeNumber(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === '') {
    return null;
  }
  return Number.isInteger(Number(value)) ? null : { wholeNumber: true };
}

@Component({
  selector: 'app-seller-dashboard',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './seller-dashboard.html',
  styleUrl: './seller-dashboard.scss',
})
export class SellerDashboard {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly mediaService = inject(MediaService);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);
  private readonly notificationError = inject(NotificationError);

  // ── Tab ────────────────────────────────────────────────────────────────────
  readonly activeTab = signal<'products' | 'orders'>('products');


  // ── Products signals ────────────────────────────────────────────────────────
  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal('');

  readonly formOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);

  /** Images already on the product being edited; read-only here. */
  readonly editingImages = signal<string[]>([]);

  readonly pendingImages = signal<PendingImage[]>([]);
  readonly imageErrors = signal<string[]>([]);

  readonly deleteTarget = signal<string | null>(null);
  readonly deleting = signal<string | null>(null);

  readonly isEditing = computed(() => this.editingId() !== null);

  readonly maxImageKb = Math.round(MAX_IMAGE_BYTES / 1024);
  readonly productCategories = PRODUCT_CATEGORIES;

  // ── Orders signals ──────────────────────────────────────────────────────────
  readonly orders = signal<Order[]>([]);
  readonly filteredOrders = signal<Order[]>([]);
  readonly ordersLoading = signal(false);
  readonly ordersError = signal('');
  readonly topProducts = signal<TopSellingProduct[]>([]);
  readonly topProductsLoading = signal(false);
  readonly topProductsError = signal('');
  readonly topProductsLoaded = signal(false);
  readonly updatingOrderId = signal<string | null>(null);
  readonly orderFilter = signal<OrderStatus | 'ALL'>('ALL');
  readonly orderSearch = signal<string>('');
  readonly orderDateFrom = signal('');
  readonly orderDateTo = signal('');

  readonly totalRevenue = computed(() =>
    this.orders()
      .filter((order) => order.status === 'DELIVERED')
      .reduce((sum, order) => sum + (order.total || 0), 0)
  );
  readonly pendingOrdersCount = computed(() =>
    this.orders().filter((order) => order.status === 'PENDING').length
  );

  /** Total units sold across all DELIVERED orders */
  readonly totalUnitsSold = computed(() =>
    this.orders()
      .filter((o) => o.status === 'DELIVERED')
      .flatMap((o) => o.items)
      .reduce((sum, item) => sum + item.quantity, 0)
  );
  readonly highestProductRevenue = computed(() =>
    Math.max(0, ...this.topProducts().map((product) => product.revenue))
  );


  // Mirrors the backend ProductDTO constraints.
  productForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    description: [
      '',
      [Validators.required, Validators.minLength(10), Validators.maxLength(500)],
    ],
    category: this.fb.control<ProductCategory | null>(null, Validators.required),
    price: [
      null as number | null,
      [Validators.required, greaterThanZero, Validators.max(MAX_PRICE)],
    ],
    quantity: [
      null as number | null,
      [Validators.required, Validators.min(0), wholeNumber],
    ],
  });

  constructor() {
    this.loadProducts();

    // Preview URLs are only valid while this component lives.
    inject(DestroyRef).onDestroy(() => this.clearPendingImages());
  }

  switchTab(tab: 'products' | 'orders'): void {
    this.activeTab.set(tab);
    if (tab === 'orders' && this.orders().length === 0 && !this.ordersLoading()) {
      this.loadSellerOrders();
    }
    if (tab === 'orders' && !this.topProductsLoaded() && !this.topProductsLoading()
        && !this.topProductsError()) {
      this.loadSellerTopProducts();
    }
  }

  loadSellerTopProducts(): void {
    this.topProductsLoading.set(true);
    this.topProductsError.set('');
    this.orderService.getSellerTopProducts().subscribe({
      next: (products) => {
        this.topProducts.set(products);
        this.topProductsLoaded.set(true);
        this.topProductsLoading.set(false);
      },
      error: () => {
        this.topProductsLoading.set(false);
        this.topProductsError.set('Unable to load best-selling products. Please try again.');
      },
    });
  }

  topProductBarWidth(revenue: number): number {
    const maximum = this.highestProductRevenue();
    return maximum > 0 ? (revenue / maximum) * 100 : 0;
  }

  loadSellerOrders(): void {
    this.ordersLoading.set(true);
    this.ordersError.set('');
    const status = this.selectedOrderStatus();
    this.orderService.getSellerOrders({
      search: this.orderSearch(),
      status,
      dateFrom: this.orderDateFrom(),
      dateTo: this.orderDateTo(),
    }).subscribe({
      next: (orders) => {
        // Dernières commandes en premier (tri décroissant par date)
        const sorted = [...orders].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.filteredOrders.set(sorted);
        if (this.hasNoActiveOrderFilters()) {
          this.orders.set(sorted);
        }
        this.ordersLoading.set(false);
      },
      error: () => {
        this.ordersLoading.set(false);
        this.ordersError.set('Unable to load orders. Please try again.');
      },
    });
  }

  private hasNoActiveOrderFilters(): boolean {
    return this.orderFilter() === 'ALL'
      && !this.orderSearch().trim()
      && !this.orderDateFrom()
      && !this.orderDateTo();
  }

  applyOrderFilters(): void {
    this.loadSellerOrders();
  }

  setOrderFilter(status: OrderStatus | 'ALL'): void {
    this.orderFilter.set(status);
    this.loadSellerOrders();
  }

  private selectedOrderStatus(): OrderStatus | undefined {
    const status = this.orderFilter();
    return status === 'ALL' ? undefined : status;
  }

  countByStatus(status: OrderStatus): number {
    return this.orders().filter((o) => o.status === status).length;
  }

  orderStatusClass(status: string): string {
    switch (status) {
      case 'PENDING':    return 'status--pending';
      case 'CONFIRMED':  return 'status--confirmed';
      case 'SHIPPED':    return 'status--shipped';
      case 'DELIVERED':  return 'status--delivered';
      case 'CANCELLED':  return 'status--cancelled';
      default:           return '';
    }
  }

  orderCardClass(status: string): string {
    return 'order-card--' + status.toLowerCase();
  }

  shortId(id: string): string {
    return id.length > 8 ? '…' + id.slice(-8) : id;
  }

  updateStatus(order: Order, nextStatus: OrderStatus): void {
    if (this.updatingOrderId() === order.id) {
      return;
    }

    this.updatingOrderId.set(order.id);
    this.orderService.updateOrderStatus(order.id, nextStatus).subscribe({
      next: (updatedOrder) => {
        this.orders.update((orders) =>
          orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
        );
        this.filteredOrders.update((orders) =>
          orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
        );
        this.updatingOrderId.set(null);
        this.notificationError.show(
          `Order #${this.shortId(order.id)} updated to ${nextStatus}.`,
          'green'
        );
        this.loadSellerOrders();
        this.loadSellerTopProducts();
      },
      error: (err) => {
        this.updatingOrderId.set(null);
        const msg = err?.error?.message || 'Failed to update order status.';
        this.notificationError.show(msg, 'red');
      },
    });
  }


  loadProducts(): void {
    this.loading.set(true);
    this.loadError.set('');

    this.productService.getMyProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);

        // A 401 here means the interceptor could not refresh the session.
        if (error.status === 401) {
          this.router.navigate(['/login']);

          this.notificationError.show(error.error.message, 'red')
          return;
        }

        this.loadError.set(
          error.status === 403
            ? 'Only seller accounts can manage products.'
            : 'Unable to load your products. Please try again.',
        );
      },
    });
  }

  startCreate(): void {
    this.editingId.set(null);
    this.editingImages.set([]);
    this.productForm.reset({
      name: '',
      description: '',
      category: null,
      price: null,
      quantity: null,
    });
    this.openForm();
  }

  startEdit(product: Product): void {
    this.editingId.set(product.id);
    this.editingImages.set(product.imagePaths ?? []);
    this.productForm.reset({
      name: product.name,
      description: product.description,
      category: product.category ?? null,
      price: product.price,
      quantity: product.quantity,
    });
    this.openForm();

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingId.set(null);
    this.editingImages.set([]);
    this.clearPendingImages();
  }

  onSubmit(): void {
    if (this.productForm.invalid || this.saving()) {
      this.productForm.markAllAsTouched();
      return;
    }

    const category = this.productForm.controls.category.value;
    if (!category) {
      this.productForm.controls.category.markAsTouched();
      return;
    }

    const request: ProductRequest = {
      name: this.productForm.value.name!.trim(),
      description: this.productForm.value.description!.trim(),
      price: Number(this.productForm.value.price),
      quantity: Number(this.productForm.value.quantity),
      category,
    };

    const editingId = this.editingId();
    const isCreate = editingId === null;

    this.saving.set(true);

    const save = isCreate
      ? this.productService.createProduct(request)
      : this.productService.updateProduct(editingId, request);

    save.subscribe({
      next: (product) => this.attachImages(product, isCreate),
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);



        let message: string;

        if (error.status === 403) {
          message = 'You are not allowed to save this product.';
        } else if (error.status === 400) {
          message = 'The server rejected these details. Please review the fields.';
        } else {
          message = 'Could not save the product. Please try again.';
        }

        this.notificationError.show(message, 'red');

      },
    });
  }


  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const chosen = Array.from(input.files ?? []);

    input.value = '';

    const rejected: string[] = [];
    const accepted: PendingImage[] = [];

    for (const file of chosen) {
      if (!file.type.startsWith('image/')) {
        rejected.push(`${file.name} is not an image.`);
        continue;
      }

      if (file.size > MAX_IMAGE_BYTES) {
        rejected.push(`${file.name} is larger than ${this.maxImageKb} KB.`);
        continue;
      }

      accepted.push({ file, previewUrl: URL.createObjectURL(file) });
    }

    this.imageErrors.set(rejected);
    if (accepted.length > 0) {
      this.pendingImages.update((images) => [...images, ...accepted]);
    }
  }

  removeImage(index: number): void {
    this.pendingImages.update((images) => {
      const target = images[index];
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return images.filter((_, i) => i !== index);
    });
  }


  askDelete(product: Product): void {
    this.deleteTarget.set(product.id);
  }

  cancelDelete(): void {
    this.deleteTarget.set(null);
  }

  confirmDelete(product: Product): void {
    if (this.deleting()) {
      return;
    }

    this.deleting.set(product.id);

    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.products.update((products) => products.filter((p) => p.id !== product.id));
        this.deleting.set(null);
        this.deleteTarget.set(null);
        this.notificationError.show(`“${product.name}” was deleted.`, 'green');
      },
      error: (error: HttpErrorResponse) => {
        this.deleting.set(null);
        this.deleteTarget.set(null);
        const message = error.status === 403
          ? 'You can only delete your own products.'
          : 'Could not delete the product. Please try again.';
        this.notificationError.show(message, 'red');
      },
    });
  }


  coverImage(product: Product): string | null {
    return product.imagePaths?.[0] ?? null;
  }

  categoryLabel(category: ProductCategory | null | undefined): string {
    return productCategoryLabel(category);
  }

  imageCount(product: Product): number {
    return product.imagePaths?.length ?? 0;
  }


  private openForm(): void {
    this.clearPendingImages();
    this.deleteTarget.set(null);
    this.formOpen.set(true);
  }

  private clearPendingImages(): void {
    for (const image of this.pendingImages()) {
      URL.revokeObjectURL(image.previewUrl);
    }
    this.pendingImages.set([]);
    this.imageErrors.set([]);
  }

  private attachImages(product: Product, isCreate: boolean): void {
    const files = this.pendingImages().map((image) => image.file);

    if (files.length === 0) {
      this.finishSave(product, isCreate, isCreate ? 'Product created.' : 'Product updated.');
      return;
    }

    this.uploadImages(product.id, files, isCreate).subscribe({
      next: (images: ProductImage[]) => {
        this.finishSave(
          { ...product, imagePaths: images.map((image) => image.imagePath) },
          isCreate,
          isCreate
            ? 'Product created and images uploaded.'
            : 'Product updated and images replaced.',
        );
      },
      error: (error: HttpErrorResponse) => {
        // The product itself saved — keep it, and scope the failure to images.
        this.finishSave(product, isCreate, '');
        const message = error.status === 403
          ? `“${product.name}” was saved, but the image upload was not authorised yet. Open Edit and upload again in a moment.`
          : `“${product.name}” was saved, but its images could not be uploaded. Open Edit to try again.`;

        this.notificationError.show(message, 'red')
      },
    });
  }

  private uploadImages(
    productId: string,
    files: File[],
    retryOwnership: boolean,
  ): Observable<ProductImage[]> {
    const upload = this.mediaService.uploadProductImages(productId, files);

    if (!retryOwnership) {
      return upload;
    }

    return upload.pipe(
      retry({
        count: OWNERSHIP_RETRIES,
        delay: (error: unknown, attempt: number) =>
          error instanceof HttpErrorResponse && error.status === 403
            ? timer(500 * attempt)
            : throwError(() => error),
      }),
    );
  }

  private finishSave(product: Product, isCreate: boolean, message: string): void {
    this.products.update((products) =>
      isCreate
        ? [product, ...products]
        : products.map((existing) => (existing.id === product.id ? product : existing)),
    );

    this.saving.set(false);
    this.closeForm();
    this.notificationError.show(message, 'green')
  }
}
