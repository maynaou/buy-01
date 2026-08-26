import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { LoginRequest } from '../models/login-request';
import { TokenService } from '../../../core/services/token';
import { NotificationError } from '../../../core/services/notification-error';


@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private tokenService = inject(TokenService);
  private router = inject(Router);
  private notificationError = inject(NotificationError);


  loginForm = this.fb.group({
    identifier: ['', Validators.required],
    password: ['', Validators.required]
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const request: LoginRequest = {
      identifier: this.loginForm.value.identifier!,
      password: this.loginForm.value.password!
    };

    this.authService.login(request).subscribe({
      next: (response) => {
        this.tokenService.setTokens(
          response.acces_Token,
          response.refresh_Token
        );
        this.authService.setAuthenticated();
        this.notificationError.show('User registered successfully', 'green');

        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1000);
      },
      error: (error) => {
           this.notificationError.show(error.error.message, 'red');
      }
    });
  }
}