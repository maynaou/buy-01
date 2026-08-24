export type Role = 'CLIENT' | 'SELLER';

/** Mirrors the backend `UserDTO` returned by GET/PUT /api/users/me. */
export interface UserProfile {
  username: string;
  email: string;
  role: Role;
  /** Kept in sync by the avatar events; never writable through PUT /me. */
  avatar?: string | null;
}

/** Body accepted by PUT /api/users/me — every field is required server-side. */
export interface UpdateProfileRequest {
  username: string;
  email: string;
  role: Role;
}
