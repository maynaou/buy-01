
import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { UserService } from './user';
import { environment } from '../../../environments/environment';

import {
  UserProfile,
  UpdateProfileRequest,
} from '../../features/profile/models/user-profile';

describe('UserService', () => {
  let service: UserService;
  let httpTestingController: HttpTestingController;

  const usersUrl = `${environment.apiUrl}/api/users`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(UserService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  // --------------------------------------------------
  // Creation
  // --------------------------------------------------

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --------------------------------------------------
  // getProfile()
  // --------------------------------------------------

  describe('getProfile', () => {
    it('should send a GET request to the profile endpoint', () => {
      service.getProfile().subscribe();

      const req = httpTestingController.expectOne(
        `${usersUrl}/me`,
      );

      expect(req.request.method).toBe('GET');

      req.flush({
        username: 'test',
        email: 'test@example.com',
        role: 'CLIENT',
      });
    });

    it('should return the user profile', () => {
      const profile: UserProfile = {
        username: 'test',
        email: 'test@example.com',
        role: 'CLIENT',
        avatar: null,
      };

      service.getProfile().subscribe((result) => {
        expect(result).toEqual(profile);
      });

      const req = httpTestingController.expectOne(
        `${usersUrl}/me`,
      );

      req.flush(profile);
    });

    it('should return a profile with an avatar', () => {
      const profile: UserProfile = {
        username: 'test',
        email: 'test@example.com',
        role: 'CLIENT',
        avatar: 'https://example.com/avatar.jpg',
      };

      service.getProfile().subscribe((result) => {
        expect(result).toEqual(profile);
      });

      const req = httpTestingController.expectOne(
        `${usersUrl}/me`,
      );

      req.flush(profile);
    });

    it('should handle profile retrieval errors', () => {
      service.getProfile().subscribe({
        next: () => fail('Expected getProfile to fail'),
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      const req = httpTestingController.expectOne(
        `${usersUrl}/me`,
      );

      req.flush(
        { message: 'User not found' },
        {
          status: 404,
          statusText: 'Not Found',
        },
      );
    });
  });

  // --------------------------------------------------
  // updateProfile()
  // --------------------------------------------------

  describe('updateProfile', () => {
    it('should send a PUT request to the profile endpoint', () => {
      const request: UpdateProfileRequest = {
        username: 'newUsername',
        email: 'new@example.com',
        role: 'CLIENT',
      };

      service.updateProfile(request).subscribe();

      const req = httpTestingController.expectOne(
        `${usersUrl}/me`,
      );

      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);

      req.flush({
        username: 'newUsername',
        email: 'new@example.com',
        role: 'CLIENT',
      });
    });

    it('should return the updated user profile', () => {
      const request: UpdateProfileRequest = {
        username: 'newUsername',
        email: 'new@example.com',
        role: 'CLIENT',
      };

      const updatedProfile: UserProfile = {
        username: 'newUsername',
        email: 'new@example.com',
        role: 'CLIENT',
        avatar: null,
      };

      service.updateProfile(request).subscribe((result) => {
        expect(result).toEqual(updatedProfile);
      });

      const req = httpTestingController.expectOne(
        `${usersUrl}/me`,
      );

      req.flush(updatedProfile);
    });

    it('should allow SELLER as a valid role', () => {
      const request: UpdateProfileRequest = {
        username: 'seller',
        email: 'seller@example.com',
        role: 'SELLER',
      };

      service.updateProfile(request).subscribe();

      const req = httpTestingController.expectOne(
        `${usersUrl}/me`,
      );

      expect(req.request.body).toEqual(request);

      req.flush({
        username: 'seller',
        email: 'seller@example.com',
        role: 'SELLER',
      });
    });

    it('should handle profile update errors', () => {
      const request: UpdateProfileRequest = {
        username: 'newUsername',
        email: 'new@example.com',
        role: 'CLIENT',
      };

      service.updateProfile(request).subscribe({
        next: () => fail('Expected updateProfile to fail'),
        error: (error) => {
          expect(error.status).toBe(400);
        },
      });

      const req = httpTestingController.expectOne(
        `${usersUrl}/me`,
      );

      req.flush(
        { message: 'Invalid profile data' },
        {
          status: 400,
          statusText: 'Bad Request',
        },
      );
    });
  });
});
