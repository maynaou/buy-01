import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Login } from './login';
import { AuthService } from '../../../core/services/auth';
import { TokenService } from '../../../core/services/token';
import { NotificationError } from '../../../core/services/notification-error';
import { AuthResponse } from '../models/auth-response';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  let authService: jasmine.SpyObj<AuthService>;
  let tokenService: jasmine.SpyObj<TokenService>;
  let router: jasmine.SpyObj<Router>;
  let notificationError: jasmine.SpyObj<NotificationError>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>(
      'AuthService',
      ['login', 'setAuthenticated'],
    );

    tokenService = jasmine.createSpyObj<TokenService>(
      'TokenService',
      ['setTokens'],
    );

    router = jasmine.createSpyObj<Router>(
      'Router',
      ['navigate'],
    );

    notificationError = jasmine.createSpyObj<NotificationError>(
      'NotificationError',
      ['show'],
    );

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: TokenService,
          useValue: tokenService,
        },
        {
          provide: Router,
          useValue: router,
        },
        {
          provide: NotificationError,
          useValue: notificationError,
        },
      ],
    })
      .overrideComponent(Login, {
        set: {
          template: '',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the login form with empty values', () => {
    expect(component.loginForm.value).toEqual({
      identifier: '',
      password: '',
    });
  });

  it('should have an invalid form initially', () => {
    expect(component.loginForm.invalid).toBeTrue();
  });

  it('should require the identifier', () => {
    const identifier = component.loginForm.controls.identifier;

    identifier.setValue('');

    expect(identifier.hasError('required')).toBeTrue();
  });

  it('should accept a valid identifier', () => {
    const identifier = component.loginForm.controls.identifier;

    identifier.setValue('test@gmail.com');

    expect(identifier.valid).toBeTrue();
  });

  it('should require the password', () => {
    const password = component.loginForm.controls.password;

    password.setValue('');

    expect(password.hasError('required')).toBeTrue();
  });

  it('should accept a valid password', () => {
    const password = component.loginForm.controls.password;

    password.setValue('password123');

    expect(password.valid).toBeTrue();
  });

  it('should mark all controls as touched when the form is invalid', () => {
    const markAllAsTouchedSpy = spyOn(
      component.loginForm,
      'markAllAsTouched',
    );

    component.onSubmit();

    expect(markAllAsTouchedSpy).toHaveBeenCalled();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should not call login when the form is invalid', () => {
    component.loginForm.setValue({
      identifier: '',
      password: '',
    });

    component.onSubmit();

    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should call AuthService.login with the correct request', () => {
    const response: AuthResponse = {
      acces_Token: 'access-token',
      refresh_Token: 'refresh-token',
    };

    authService.login.and.returnValue(of(response));

    component.loginForm.setValue({
      identifier: 'test@gmail.com',
      password: 'password123',
    });

    component.onSubmit();

    expect(authService.login).toHaveBeenCalledTimes(1);

    expect(authService.login).toHaveBeenCalledWith({
      identifier: 'test@gmail.com',
      password: 'password123',
    });
  });

  it('should save the tokens after successful login', () => {
    const response: AuthResponse = {
      acces_Token: 'access-token',
      refresh_Token: 'refresh-token',
    };

    authService.login.and.returnValue(of(response));

    component.loginForm.setValue({
      identifier: 'test@gmail.com',
      password: 'password123',
    });

    component.onSubmit();

    expect(tokenService.setTokens).toHaveBeenCalledTimes(1);

    expect(tokenService.setTokens).toHaveBeenCalledWith(
      'access-token',
      'refresh-token',
    );
  });

  it('should set the user as authenticated after successful login', () => {
    const response: AuthResponse = {
      acces_Token: 'access-token',
      refresh_Token: 'refresh-token',
    };

    authService.login.and.returnValue(of(response));

    component.loginForm.setValue({
      identifier: 'test@gmail.com',
      password: 'password123',
    });

    component.onSubmit();

    expect(authService.setAuthenticated).toHaveBeenCalledTimes(1);
  });

  it('should show a success notification after successful login', () => {
    const response: AuthResponse = {
      acces_Token: 'access-token',
      refresh_Token: 'refresh-token',
    };

    authService.login.and.returnValue(of(response));

    component.loginForm.setValue({
      identifier: 'test@gmail.com',
      password: 'password123',
    });

    component.onSubmit();

    expect(notificationError.show).toHaveBeenCalledWith(
      'User registered successfully',
      'green',
    );
  });

  it('should navigate to the home page after successful login', () => {
    jasmine.clock().install();

    const response: AuthResponse = {
      acces_Token: 'access-token',
      refresh_Token: 'refresh-token',
    };

    authService.login.and.returnValue(of(response));

    component.loginForm.setValue({
      identifier: 'test@gmail.com',
      password: 'password123',
    });

    component.onSubmit();

    expect(router.navigate).not.toHaveBeenCalled();

    jasmine.clock().tick(999);

    expect(router.navigate).not.toHaveBeenCalled();

    jasmine.clock().tick(1);

    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should show the backend error message when login fails', () => {
    const error = {
      error: {
        message: 'Invalid credentials',
      },
    };

    authService.login.and.returnValue(
      throwError(() => error),
    );

    component.loginForm.setValue({
      identifier: 'test@gmail.com',
      password: 'wrong-password',
    });

    component.onSubmit();

    expect(notificationError.show).toHaveBeenCalledTimes(1);

    expect(notificationError.show).toHaveBeenCalledWith(
      'Invalid credentials',
      'red',
    );
  });

  it('should not save tokens when login fails', () => {
    const error = {
      error: {
        message: 'Invalid credentials',
      },
    };

    authService.login.and.returnValue(
      throwError(() => error),
    );

    component.loginForm.setValue({
      identifier: 'test@gmail.com',
      password: 'wrong-password',
    });

    component.onSubmit();

    expect(tokenService.setTokens).not.toHaveBeenCalled();
  });

  it('should not authenticate the user when login fails', () => {
    const error = {
      error: {
        message: 'Invalid credentials',
      },
    };

    authService.login.and.returnValue(
      throwError(() => error),
    );

    component.loginForm.setValue({
      identifier: 'test@gmail.com',
      password: 'wrong-password',
    });

    component.onSubmit();

    expect(authService.setAuthenticated).not.toHaveBeenCalled();
  });

  it('should not navigate when login fails', () => {
    const error = {
      error: {
        message: 'Invalid credentials',
      },
    };

    authService.login.and.returnValue(
      throwError(() => error),
    );

    component.loginForm.setValue({
      identifier: 'test@gmail.com',
      password: 'wrong-password',
    });

    component.onSubmit();

    expect(router.navigate).not.toHaveBeenCalled();
  });
});
