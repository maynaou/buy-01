import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth';
import { NotificationError } from '../../../core/services/notification-error';
import { RegisterRequest } from '../models/register-request';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notificationError = inject(NotificationError);
  private router = inject(Router)

  registerForm = this.fb.group({
    username: ['', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(20),
      Validators.pattern(/^[a-zA-Z0-9_]+$/)
    ]],

    email: ['', [
      Validators.required,
      Validators.email
    ]],

    password: ['', [
      Validators.required,
      Validators.minLength(6)
    ]],

    role: ['CLIENT' as 'CLIENT' | 'SELLER', Validators.required]
  });

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const request: RegisterRequest = {
      username: this.registerForm.value.username!,
      email: this.registerForm.value.email!,
      password: this.registerForm.value.password!,
      role: this.registerForm.value.role!
    };

    this.authService.register(request).subscribe({
      next: (response) => {
        this.notificationError.show(response, 'green');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1000);
      },
      error: (error) => {  
           const errorBody = JSON.parse(error.error);
           this.notificationError.show(errorBody.message, 'red');
      }
    });
  }
}