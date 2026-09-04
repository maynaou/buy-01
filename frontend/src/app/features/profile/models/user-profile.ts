export type Role = 'CLIENT' | 'SELLER';

export interface UserProfile {
  username: string;
  email: string;
  role: Role;
  avatar?: string | null;
}

export interface UpdateProfileRequest {
  username: string;
  email: string;
  role: Role;
}
