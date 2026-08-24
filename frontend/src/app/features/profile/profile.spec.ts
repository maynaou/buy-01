import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';

import { Profile } from './profile';
import { environment } from '../../../environments/environment';
import { UserProfile } from './models/user-profile';

const ME_URL = `${environment.apiUrl}/api/users/me`;
const AVATAR_URL = `${environment.apiUrl}/api/media/avatar/user-42`;

// Payload segment of a JWT whose `sub` is "user-42".
const TOKEN = `header.${btoa(JSON.stringify({ sub: 'user-42' }))}.signature`;

const SELLER: UserProfile = {
  username: 'jane_doe',
  email: 'jane@example.com',
  role: 'SELLER',
  avatar: null,
};

const CLIENT: UserProfile = {
  username: 'bob_buyer',
  email: 'bob@example.com',
  role: 'CLIENT',
  avatar: null,
};

function setup() {
  TestBed.configureTestingModule({
    imports: [Profile],
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });

  const fixture = TestBed.createComponent(Profile);
  const httpTesting = TestBed.inject(HttpTestingController);
  return { fixture, httpTesting };
}

function imageFile(name = 'avatar.png', size = 10) {
  const file = new File(['x'.repeat(size)], name, { type: 'image/png' });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

function fileChange(file: File | null): Event {
  const event = new Event('change');
  Object.defineProperty(event, 'target', { value: { files: file ? [file] : [] } });
  return event;
}

describe('Profile', () => {
  beforeEach(() => {
    localStorage.setItem('access_token', TOKEN);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should load the profile into the form', async () => {
    const { fixture, httpTesting } = setup();

    const req = httpTesting.expectOne(ME_URL);
    expect(req.request.method).toBe('GET');
    req.flush(SELLER);
    await fixture.whenStable();

    const component = fixture.componentInstance;
    expect(component.loading()).toBe(false);
    expect(component.profileForm.value.username).toBe('jane_doe');
    expect(component.profileForm.value.email).toBe('jane@example.com');
  });

  it('should show the avatar uploader for a seller', async () => {
    const { fixture, httpTesting } = setup();
    httpTesting.expectOne(ME_URL).flush(SELLER);
    await fixture.whenStable();

    expect(fixture.componentInstance.isSeller()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).querySelector('.avatar-upload')).toBeTruthy();
  });

  it('should hide the avatar uploader for a client', async () => {
    const { fixture, httpTesting } = setup();
    httpTesting.expectOne(ME_URL).flush(CLIENT);
    await fixture.whenStable();

    expect(fixture.componentInstance.isSeller()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).querySelector('.avatar-upload')).toBeNull();
    // The rest of the profile still renders for a client.
    expect(fixture.componentInstance.profileForm.value.username).toBe('bob_buyer');
  });

  it('should PUT the edited fields and keep the role unchanged', async () => {
    const { fixture, httpTesting } = setup();
    httpTesting.expectOne(ME_URL).flush(SELLER);
    await fixture.whenStable();

    const component = fixture.componentInstance;
    component.profileForm.patchValue({ email: 'new@example.com' });
    component.onSubmit();

    const req = httpTesting.expectOne(ME_URL);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      username: 'jane_doe',
      email: 'new@example.com',
      role: 'SELLER',
    });
    req.flush({ ...SELLER, email: 'new@example.com' });
    await fixture.whenStable();

    expect(component.savedMessage()).toBe('Profile updated.');
    expect(component.saving()).toBe(false);
  });

  it('should not PUT an invalid form', async () => {
    const { fixture, httpTesting } = setup();
    httpTesting.expectOne(ME_URL).flush(SELLER);
    await fixture.whenStable();

    fixture.componentInstance.profileForm.patchValue({ username: 'no' });
    fixture.componentInstance.onSubmit();

    httpTesting.expectNone(ME_URL);
  });

  it('should upload the chosen avatar to the media service', async () => {
    const { fixture, httpTesting } = setup();
    httpTesting.expectOne(ME_URL).flush(SELLER);
    await fixture.whenStable();

    const component = fixture.componentInstance;
    component.onFileSelected(fileChange(imageFile()));
    expect(component.pendingFileName()).toBe('avatar.png');

    component.uploadAvatar();

    const req = httpTesting.expectOne(AVATAR_URL);
    expect(req.request.method).toBe('POST');
    req.flush({
      imagePath: 'https://cdn.test/new-avatar.png',
      entityId: 'user-42',
      mediaType: 'AVATAR',
    });
    await fixture.whenStable();

    expect(component.avatarUrl()).toBe('https://cdn.test/new-avatar.png');
    expect(component.avatarMessage()).toBe('Avatar updated.');
    expect(component.pendingFileName()).toBe('');
  });

  it('should reject a non-image file', async () => {
    const { fixture, httpTesting } = setup();
    httpTesting.expectOne(ME_URL).flush(SELLER);
    await fixture.whenStable();

    const component = fixture.componentInstance;
    component.onFileSelected(fileChange(new File(['x'], 'notes.pdf', { type: 'application/pdf' })));

    expect(component.avatarError()).toContain('image file');
    component.uploadAvatar();
    httpTesting.expectNone(AVATAR_URL);
  });

  it('should reject a file over 1 MB', async () => {
    const { fixture, httpTesting } = setup();
    httpTesting.expectOne(ME_URL).flush(SELLER);
    await fixture.whenStable();

    const component = fixture.componentInstance;
    component.onFileSelected(fileChange(imageFile('big.png', 1024 * 1024 + 1)));

    expect(component.avatarError()).toContain('1 MB');
    component.uploadAvatar();
    httpTesting.expectNone(AVATAR_URL);
  });

  it('should surface a failed load', async () => {
    const { fixture, httpTesting } = setup();
    httpTesting.expectOne(ME_URL).flush('nope', { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect(fixture.componentInstance.loadError()).toContain('Unable to load your profile');
  });

  it('should send the user to login when the session could not be refreshed', async () => {
    const { fixture, httpTesting } = setup();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    // A 401 reaching the component means the interceptor already tried and
    // failed to refresh (this spec wires HttpClient without interceptors).
    httpTesting.expectOne(ME_URL).flush('expired', { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith(['/login']);
    expect(fixture.componentInstance.loadError()).toBe('');
  });
});
