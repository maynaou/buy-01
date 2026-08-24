import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { UserService } from './user';
import { environment } from '../../../environments/environment';
import { UserProfile } from '../../features/profile/models/user-profile';

const ME_URL = `${environment.apiUrl}/api/users/me`;

const PROFILE: UserProfile = {
  username: 'jane_doe',
  email: 'jane@example.com',
  role: 'SELLER',
  avatar: 'https://cdn.test/avatar.jpg',
};

describe('UserService', () => {
  let service: UserService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(UserService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should GET the current profile', () => {
    let received: UserProfile | undefined;
    service.getProfile().subscribe((profile) => (received = profile));

    const req = httpTesting.expectOne(ME_URL);
    expect(req.request.method).toBe('GET');
    req.flush(PROFILE);

    expect(received).toEqual(PROFILE);
  });

  it('should PUT the updated profile', () => {
    const body = { username: 'jane_doe', email: 'new@example.com', role: 'SELLER' as const };
    service.updateProfile(body).subscribe();

    const req = httpTesting.expectOne(ME_URL);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(body);
    req.flush({ ...PROFILE, email: 'new@example.com' });
  });
});
