import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { MediaService } from './media';
import { environment } from '../../../environments/environment';

describe('MediaService', () => {
  let service: MediaService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(MediaService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should POST the avatar as multipart form data', () => {
    const file = new File(['x'], 'avatar.png', { type: 'image/png' });
    service.uploadAvatar('user-42', file).subscribe();

    const req = httpTesting.expectOne(`${environment.apiUrl}/api/media/avatar/user-42`);
    expect(req.request.method).toBe('POST');

    const body = req.request.body as FormData;
    expect(body instanceof FormData).toBe(true);
    // Field name the media service reads.
    expect(body.get('imgUrl')).toBe(file);

    // The browser must set the multipart boundary itself.
    expect(req.request.headers.has('Content-Type')).toBe(false);

    req.flush({ imagePath: 'https://cdn.test/a.png', entityId: 'user-42', mediaType: 'AVATAR' });
  });
});
