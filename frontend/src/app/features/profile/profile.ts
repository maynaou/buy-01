import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { MediaService } from '../../core/services/media';
import { TokenService } from '../../core/services/token';
import { UserService } from '../../core/services/user';
import { UserProfile } from './models/user-profile';

/** Spring Boot's default `spring.servlet.multipart.max-file-size`. */
const MAX_AVATAR_BYTES = 1024 * 1024;

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private mediaService = inject(MediaService);
  private tokenService = inject(TokenService);
  private router = inject(Router);

  readonly profile = signal<UserProfile | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal('');
  readonly saveError = signal('');
  readonly savedMessage = signal('');

  readonly avatarUrl = signal<string | null>(null);
  readonly uploading = signal(false);
  readonly avatarError = signal('');
  readonly avatarMessage = signal('');
  readonly pendingFileName = signal('');

  private pendingFile: File | null = null;

  /** Only sellers manage an avatar. */
  readonly isSeller = computed(() => this.profile()?.role === 'SELLER');

  // Mirrors the backend UserDTO constraints.
  profileForm = this.fb.group({
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern(/^[a-zA-Z0-9_]+$/),
      ],
    ],
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.loadError.set('');

    this.userService.getProfile().subscribe({
      next: (profile) => {
        this.applyProfile(profile);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);

        // A 401 here means the interceptor could not refresh the session.
        if (error.status === 401) {
          this.router.navigate(['/login']);
          return;
        }

        this.loadError.set('Unable to load your profile. Please try again.');
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

    this.avatarError.set('');
    this.avatarMessage.set('');
    this.pendingFile = null;
    this.pendingFileName.set('');

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.avatarError.set('Please choose an image file.');
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      this.avatarError.set('Image is larger than 1 MB. Please choose a smaller one.');
      return;
    }

    this.pendingFile = file;
    this.pendingFileName.set(file.name);
  }

  uploadAvatar(): void {
    const file = this.pendingFile;
    if (!file || this.uploading()) {
      return;
    }

    const userId = this.tokenService.getUserId();
    if (!userId) {
      this.avatarError.set('Could not identify your account. Please sign in again.');
      return;
    }

    this.uploading.set(true);
    this.avatarError.set('');
    this.avatarMessage.set('');

    this.mediaService.uploadAvatar(userId, file).subscribe({
      next: (response) => {
        // Use the returned URL right away: the user service picks the change up
        // asynchronously through the avatar event.
        this.avatarUrl.set(response.imagePath);
        this.uploading.set(false);
        this.pendingFile = null;
        this.pendingFileName.set('');
        this.avatarMessage.set('Avatar updated.');
      },
      error: (error: HttpErrorResponse) => {
        this.uploading.set(false);
        this.avatarError.set(
          error.status === 403
            ? 'You are not allowed to change this avatar.'
            : 'Upload failed. Please try again.',
        );
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
}
