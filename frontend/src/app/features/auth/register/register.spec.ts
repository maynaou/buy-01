import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Register } from './register';
import { AuthService } from '../../../core/services/auth';
import { NotificationError } from '../../../core/services/notification-error';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  let authService: jasmine.SpyObj<AuthService>;
  let notificationError: jasmine.SpyObj<NotificationError>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>(
      'AuthService',
      ['register'],
    );

    notificationError = jasmine.createSpyObj<NotificationError>(
      'NotificationError',
      ['show'],
    );

    router = jasmine.createSpyObj<Router>(
      'Router',
      ['navigate'],
    );

    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: NotificationError,
          useValue: notificationError,
        },
        {
          provide: Router,
          useValue: router,
        },
      ],
    })
      .overrideComponent(Register, {
        set: {
          template: '',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with CLIENT as the default role', () => {
    expect(component.registerForm.value).toEqual({
      username: '',
      email: '',
      password: '',
      role: 'CLIENT',
    });
  });

  it('should have an invalid form initially', () => {
    expect(component.registerForm.invalid).toBeTrue();
  });

  // --------------------------------------------------
  // Username validation
  // --------------------------------------------------

  it('should require a username', () => {
    const username = component.registerForm.controls.username;

    username.setValue('');

    expect(username.hasError('required')).toBeTrue();
  });

  it('should reject a username shorter than 3 characters', () => {
    const username = component.registerForm.controls.username;

    username.setValue('ab');

    expect(username.hasError('minlength')).toBeTrue();
  });

  it('should accept a username with exactly 3 characters', () => {
    const username = component.registerForm.controls.username;

    username.setValue('abc');

    expect(username.hasError('minlength')).toBeFalse();
  });

  it('should reject a username longer than 20 characters', () => {
    const username = component.registerForm.controls.username;

    username.setValue('a'.repeat(21));

    expect(username.hasError('maxlength')).toBeTrue();
  });

  it('should accept a username with exactly 20 characters', () => {
    const username = component.registerForm.controls.username;

    username.setValue('a'.repeat(20));

    expect(username.hasError('maxlength')).toBeFalse();
  });

  it('should reject a username containing special characters', () => {
    const username = component.registerForm.controls.username;

    username.setValue('test-user');

    expect(username.hasError('pattern')).toBeTrue();
  });

  it('should reject a username containing spaces', () => {
    const username = component.registerForm.controls.username;

    username.setValue('test user');

    expect(username.hasError('pattern')).toBeTrue();
  });

  it('should accept a username containing letters, numbers and underscore', () => {
    const username = component.registerForm.controls.username;

    username.setValue('Test_User123');

    expect(username.valid).toBeTrue();
  });

  // --------------------------------------------------
  // Email validation
  // --------------------------------------------------

  it('should require an email', () => {
    const email = component.registerForm.controls.email;

    email.setValue('');

    expect(email.hasError('required')).toBeTrue();
  });

  it('should reject an invalid email', () => {
    const email = component.registerForm.controls.email;

    email.setValue('invalid-email');

    expect(email.hasError('email')).toBeTrue();
  });

  it('should accept a valid email', () => {
    const email = component.registerForm.controls.email;

    email.setValue('test@gmail.com');

    expect(email.valid).toBeTrue();
  });

  // --------------------------------------------------
  // Password validation
  // --------------------------------------------------

  it('should require a password', () => {
    const password = component.registerForm.controls.password;

    password.setValue('');

    expect(password.hasError('required')).toBeTrue();
  });

  it('should reject a password shorter than 6 characters', () => {
    const password = component.registerForm.controls.password;

    password.setValue('12345');

    expect(password.hasError('minlength')).toBeTrue();
  });

  it('should accept a password with exactly 6 characters', () => {
    const password = component.registerForm.controls.password;

    password.setValue('123456');

    expect(password.hasError('minlength')).toBeFalse();
  });

  // --------------------------------------------------
  // Role validation
  // --------------------------------------------------

  it('should require a role', () => {
    const role = component.registerForm.controls.role;

    role.setValue(null);

    expect(role.hasError('required')).toBeTrue();
  });

  it('should accept CLIENT as a role', () => {
    const role = component.registerForm.controls.role;

    role.setValue('CLIENT');

    expect(role.valid).toBeTrue();
  });

  it('should accept SELLER as a role', () => {
    const role = component.registerForm.controls.role;

    role.setValue('SELLER');

    expect(role.valid).toBeTrue();
  });

  // --------------------------------------------------
  // onSubmit - invalid form
  // --------------------------------------------------

  it('should mark all controls as touched when the form is invalid', () => {
    const markAllAsTouchedSpy = spyOn(
      component.registerForm,
      'markAllAsTouched',
    );

    component.onSubmit();

    expect(markAllAsTouchedSpy).toHaveBeenCalled();
  });

  it('should not call AuthService.register when the form is invalid', () => {
    component.registerForm.setValue({
      username: '',
      email: '',
      password: '',
      role: 'CLIENT',
    });

    component.onSubmit();

    expect(authService.register).not.toHaveBeenCalled();
  });

  // --------------------------------------------------
  // onSubmit - successful registration
  // --------------------------------------------------

  it('should call AuthService.register with the correct request', () => {
    authService.register.and.returnValue(
      of('Registration successful'),
    );

    component.registerForm.setValue({
      username: 'test_user',
      email: 'test@gmail.com',
      password: 'password123',
      role: 'CLIENT',
    });

    component.onSubmit();

    expect(authService.register).toHaveBeenCalledTimes(1);

    expect(authService.register).toHaveBeenCalledWith({
      username: 'test_user',
      email: 'test@gmail.com',
      password: 'password123',
      role: 'CLIENT',
    });
  });

  it('should show a success notification after successful registration', () => {
    authService.register.and.returnValue(
      of('Registration successful'),
    );

    component.registerForm.setValue({
      username: 'test_user',
      email: 'test@gmail.com',
      password: 'password123',
      role: 'CLIENT',
    });

    component.onSubmit();

    expect(notificationError.show).toHaveBeenCalledTimes(1);

    expect(notificationError.show).toHaveBeenCalledWith(
      'Registration successful',
      'green',
    );
  });

  it('should navigate to the login page after successful registration', () => {
    jasmine.clock().install();

    authService.register.and.returnValue(
      of('Registration successful'),
    );

    component.registerForm.setValue({
      username: 'test_user',
      email: 'test@gmail.com',
      password: 'password123',
      role: 'CLIENT',
    });

    component.onSubmit();

    expect(router.navigate).not.toHaveBeenCalled();

    jasmine.clock().tick(999);

    expect(router.navigate).not.toHaveBeenCalled();

    jasmine.clock().tick(1);

    expect(router.navigate).toHaveBeenCalledTimes(1);

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should register a SELLER correctly', () => {
    authService.register.and.returnValue(
      of('Registration successful'),
    );

    component.registerForm.setValue({
      username: 'seller_123',
      email: 'seller@gmail.com',
      password: 'password123',
      role: 'SELLER',
    });

    component.onSubmit();

    expect(authService.register).toHaveBeenCalledWith({
      username: 'seller_123',
      email: 'seller@gmail.com',
      password: 'password123',
      role: 'SELLER',
    });
  });

  // --------------------------------------------------
  // onSubmit - registration error
  // --------------------------------------------------

  it('should show the backend error message when registration fails', () => {
    const error = {
      error: JSON.stringify({
        message: 'Email already exists',
      }),
    };

    authService.register.and.returnValue(
      throwError(() => error),
    );

    component.registerForm.setValue({
      username: 'test_user',
      email: 'test@gmail.com',
      password: 'password123',
      role: 'CLIENT',
    });

    component.onSubmit();

    expect(notificationError.show).toHaveBeenCalledTimes(1);

    expect(notificationError.show).toHaveBeenCalledWith(
      'Email already exists',
      'red',
    );
  });

  it('should not navigate when registration fails', () => {
    const error = {
      error: JSON.stringify({
        message: 'Email already exists',
      }),
    };

    authService.register.and.returnValue(
      throwError(() => error),
    );

    component.registerForm.setValue({
      username: 'test_user',
      email: 'test@gmail.com',
      password: 'password123',
      role: 'CLIENT',
    });

    component.onSubmit();

    expect(router.navigate).not.toHaveBeenCalled();
  });
});
