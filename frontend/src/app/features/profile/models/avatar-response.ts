/** Mirrors the media-service `MediaDTO` returned when an avatar is uploaded. */
export interface AvatarResponse {
  imagePath: string;
  entityId: string;
  mediaType: string;
}
