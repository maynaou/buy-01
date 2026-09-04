import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, retry, throwError, timer } from 'rxjs';

import { MediaService } from '../../../core/services/media';
import { ProductService } from '../../../core/services/product';
import { Product, ProductRequest } from '../models/product';
import { ProductImage } from '../models/product-image';
import { NotificationError } from '../../../core/services/notification-error';

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
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './seller-dashboard.html',
  styleUrl: './seller-dashboard.scss',
})
export class SellerDashboard {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private mediaService = inject(MediaService);
  private router = inject(Router);
  private notificationError = inject(NotificationError);
  

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

  // Mirrors the backend ProductDTO constraints.
  productForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    description: [
      '',
      [Validators.required, Validators.minLength(10), Validators.maxLength(500)],
    ],
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
    this.productForm.reset({ name: '', description: '', price: null, quantity: null });
    this.openForm();
  }

  startEdit(product: Product): void {
    this.editingId.set(product.id);
    this.editingImages.set(product.imagePaths ?? []);
    this.productForm.reset({
      name: product.name,
      description: product.description,
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

    const request: ProductRequest = {
      name: this.productForm.value.name!.trim(),
      description: this.productForm.value.description!.trim(),
      price: Number(this.productForm.value.price),
      quantity: Number(this.productForm.value.quantity),
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


        const message = error.status === 403
            ? 'You are not allowed to save this product.'
            : error.status === 400
              ? 'The server rejected these details. Please review the fields.'
              : 'Could not save the product. Please try again.'
        this.notificationError.show(message,'red')

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
        this.notificationError.show(`“${product.name}” was deleted.`,'green');
      },
      error: (error: HttpErrorResponse) => {
        this.deleting.set(null);
        this.deleteTarget.set(null);
          const message = error.status === 403
            ? 'You can only delete your own products.'
            : 'Could not delete the product. Please try again.';
          this.notificationError.show(message,'red');   
      },
    });
  }


  coverImage(product: Product): string | null {
    return product.imagePaths?.[0] ?? null;
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

        this.notificationError.show(message,'red')
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
    this.notificationError.show(message,'green')
  }
}
