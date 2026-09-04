import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { UpdateProfileRequest, UserProfile } from '../../features/profile/models/user-profile';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);

  private readonly usersUrl = `${environment.apiUrl}/api/users`;

  getProfile() {
    return this.http.get<UserProfile>(`${this.usersUrl}/me`);
  }

  updateProfile(request: UpdateProfileRequest) {
    return this.http.put<UserProfile>(`${this.usersUrl}/me`, request);
  }
}
