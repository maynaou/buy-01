import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { AvatarResponse } from '../../features/profile/models/avatar-response';
import { ProductImage } from '../../features/products/models/product-image';

@Injectable({
  providedIn: 'root',
})
export class MediaService {
  private http = inject(HttpClient);

  private readonly mediaUrl = `${environment.apiUrl}/api/media`;

  uploadAvatar(userId: string, file: File) {
    const body = new FormData();
    body.append('imgUrl', file);

    return this.http.post<AvatarResponse>(`${this.mediaUrl}/avatar/${userId}`, body);
  }


  uploadProductImages(productId: string, files: File[]) {
    const body = new FormData();
    for (const file of files) {
      body.append('imgUrl', file);
    }
    body.append('productId', productId);

    return this.http.post<ProductImage[]>(`${this.mediaUrl}/image`, body);
  }
}
