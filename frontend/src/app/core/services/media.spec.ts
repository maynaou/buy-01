import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { MediaService } from './media';
import { environment } from '../../../environments/environment';

describe('MediaService', () => {
  let service: MediaService;
  let httpTestingController: HttpTestingController;

  const mediaUrl = `${environment.apiUrl}/api/media`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MediaService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(MediaService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('uploadAvatar', () => {
    it('should send a POST request with the file', () => {
      const userId = 'user-123';
      const file = new File(['content'], 'avatar.png', { type: 'image/png' });

      service.uploadAvatar(userId, file).subscribe();

      const req = httpTestingController.expectOne(`${mediaUrl}/avatar/${userId}`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body.get('imgUrl')).toBe(file);

      req.flush({ imgUrl: 'https://cdn.example.com/avatar-123.png' });
    });
  });

  describe('uploadProductImages', () => {
    it('should send a POST request with the files and productId', () => {
      const productId = 'prod-456';
      const files = [
        new File(['a'], 'image1.png', { type: 'image/png' }),
        new File(['b'], 'image2.png', { type: 'image/png' }),
      ];

      service.uploadProductImages(productId, files).subscribe();

      const req = httpTestingController.expectOne(`${mediaUrl}/image`);

      expect(req.request.method).toBe('POST');
      expect(req.request.body.getAll('imgUrl').length).toBe(2);
      expect(req.request.body.get('productId')).toBe(productId);

      req.flush([]);
    });
  });
});