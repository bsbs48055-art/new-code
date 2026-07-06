/** Facebook Graph API request/response shapes used by this module (subset). */

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

export interface FacebookPagesResponse {
  data: FacebookPage[];
}

export interface FacebookResumableStartResponse {
  video_id: string;
  upload_session_id: string;
  start_offset: string;
  end_offset: string;
}

export interface FacebookResumableTransferResponse {
  start_offset: string;
  end_offset: string;
}

export interface FacebookPhotoUploadResponse {
  id: string;
  post_id?: string;
}

export interface FacebookInsightsResponse {
  data: { name: string; values: { value: number }[] }[];
}
