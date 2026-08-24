import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { AvatarResponse } from '../../features/profile/models/avatar-response';

@Injectable({
  providedIn: 'root',
})
export class MediaService {
  private http = inject(HttpClient);

  private readonly mediaUrl = `${environment.apiUrl}/api/media`;

  /**
   * Avatar upload is delegated to the media service, which stores the file and
   * publishes an event the user service consumes to update `User.avatar`.
   *
   * `userId` must be the JWT subject — the endpoint authorises on
   * `#userId == authentication.name`.
   */
  uploadAvatar(userId: string, file: File) {
    const body = new FormData();
    // Field name required by MediaController.uplaodAvatar.
    body.append('imgUrl', file);

    // No explicit Content-Type: the browser must set the multipart boundary.
    return this.http.post<AvatarResponse>(`${this.mediaUrl}/avatar/${userId}`, body);
  }
}
