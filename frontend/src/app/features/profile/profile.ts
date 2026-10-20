import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';

import { MediaService } from '../../core/services/media';
import { TokenService } from '../../core/services/token';
import { UserService } from '../../core/services/user';
import { OrderService } from '../../core/services/order';
import { UserProfile } from './models/user-profile';
import { NotificationError } from '../../core/services/notification-error';
import { Order } from '../checkout/models/order';

/** Spring Boot's default `spring.servlet.multipart.max-file-size`. */
const MAX_AVATAR_BYTES = 1024 * 1024;

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly mediaService = inject(MediaService);
  private readonly tokenService = inject(TokenService);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);

  readonly profile = signal<UserProfile | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal('');
  readonly saveError = signal('');
  readonly savedMessage = signal('');
  private readonly notificationError = inject(NotificationError);


  readonly avatarUrl = signal<string | null>(null);
  readonly pendingPreviewUrl = signal<string | null>(null);
  readonly uploading = signal(false);
  readonly pendingFileName = signal('');

  private pendingFile: File | null = null;
  private readonly destroyRef = inject(DestroyRef);

  readonly isSeller = computed(() => this.profile()?.role === 'SELLER');

  // ── Client Analytics ────────────────────────────────────────────────────────
  /** All buyer orders (loaded on init for CLIENT accounts) */
  readonly myOrders = signal<Order[]>([]);
  readonly ordersLoading = signal(false);

  readonly totalSpent = computed(() =>
    this.myOrders()
      .filter((o) => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + (o.total || 0), 0)
  );

  readonly totalOrdersCount = computed(() => this.myOrders().length);
  readonly deliveredCount = computed(
    () => this.myOrders().filter((o) => o.status === 'DELIVERED').length
  );

  /** Top 5 most bought products (by quantity across DELIVERED orders) */
  readonly topBoughtProducts = computed(() => {
    const map = new Map<string, { name: string; quantity: number; spent: number }>();
    this.myOrders()
      .filter((o) => o.status === 'DELIVERED')
      .flatMap((o) => o.items)
      .forEach((item) => {
        const existing = map.get(item.productId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.spent += item.unitPrice * item.quantity;
        } else {
          map.set(item.productId, {
            name: item.productName,
            quantity: item.quantity,
            spent: item.unitPrice * item.quantity,
          });
        }
      });
    return [...map.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  });

  profileForm = this.fb.group({
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern(/^\w+$/),
      ],
    ],
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.clearPendingPreview());
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.loadError.set('');

    this.userService.getProfile().subscribe({
      next: (profile) => {
        this.applyProfile(profile);
        this.loading.set(false);
        // Load orders only for CLIENT accounts (for analytics)
        if (profile.role === 'CLIENT') {
          this.loadClientOrders();
        }
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);

        if (error.status === 401) {
          this.router.navigate(['/login']);
          
          this.notificationError.show(error.error.message, 'red')
          return;
        }

        this.loadError.set('Unable to load your profile. Please try again.');
      },
    });
  }

  private loadClientOrders(): void {
    this.ordersLoading.set(true);
    this.orderService.getMyOrders().subscribe({
      next: (orders) => {
        this.myOrders.set(orders);
        this.ordersLoading.set(false);
      },
      error: () => {
        this.ordersLoading.set(false);
        // Silent fail — analytics are optional, don't break the profile page
      },
    });
  }

  onSubmit(): void {
    const current = this.profile();
    if (!current || this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.saveError.set('');
    this.savedMessage.set('');

    this.userService
      .updateProfile({
        username: this.profileForm.value.username!,
        email: this.profileForm.value.email!,
        // Role is not editable here: send back what the server already has.
        role: current.role,
      })
      .subscribe({
        next: (profile) => {
          this.applyProfile(profile);
          this.saving.set(false);
          this.savedMessage.set('Profile updated.');
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.saveError.set(
            error.status === 409
              ? 'That username or email is already taken.'
              : 'Could not save your profile. Please try again.',
          );
        },
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.pendingFile = null;
    this.pendingFileName.set('');
    this.clearPendingPreview();

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.notificationError.show('Please choose an image file.','red')
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
       this.notificationError.show('Image is larger than 1 MB. Please choose a smaller one..', 'red');
      return;
    }

    this.pendingFile = file;
    this.pendingFileName.set(file.name);
    this.pendingPreviewUrl.set(URL.createObjectURL(file));
  }

  uploadAvatar(): void {
    const file = this.pendingFile;
    if (!file || this.uploading()) {
      return;
    }

    const userId = this.tokenService.getUserId();
    if (!userId) {
      this.notificationError.show('Could not identify your account. Please sign in again.', 'red')
      return;
    }

    this.uploading.set(true);

    this.mediaService.uploadAvatar(userId, file).subscribe({
      next: (response) => {
        this.avatarUrl.set(response.imagePath);
        this.uploading.set(false);
        this.pendingFile = null;
        this.pendingFileName.set('');
        this.clearPendingPreview();
        this.notificationError.show('Avatar updated.','green')
      },
      error: (error: HttpErrorResponse) => {
        this.uploading.set(false);
        const message = error.status === 403
            ? 'You are not allowed to change this avatar.'
            : 'Upload failed. Please try again.'
        this.notificationError.show(message, 'red')
      },
    });
  }

  private applyProfile(profile: UserProfile): void {
    this.profile.set(profile);
    this.avatarUrl.set(profile.avatar?.trim() ? profile.avatar : null);
    this.profileForm.patchValue({
      username: profile.username,
      email: profile.email,
    });
  }

  private clearPendingPreview(): void {
    const previewUrl = this.pendingPreviewUrl();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      this.pendingPreviewUrl.set(null);
    }
  }


  removeImage(): void {
      this.clearPendingPreview();
      this.pendingPreviewUrl.set(null);
      this.uploading.set(false);
      this.pendingFile = null;
      this.pendingFileName.set('');
  }
}
