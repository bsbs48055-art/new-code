/** TikTok Content Posting API (v2) request/response shapes used by this module (subset). */

export interface TikTokTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  open_id: string;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
}

export interface TikTokUserInfoResponse {
  data: { user: { open_id: string; display_name: string; avatar_url?: string } };
  error?: { code: string; message: string };
}

export interface TikTokInitVideoResponse {
  data: { publish_id: string; upload_url: string };
  error?: { code: string; message: string };
}

export interface TikTokPublishStatusResponse {
  data: { status: string; fail_reason?: string; publicaly_available_post_id?: string[] };
  error?: { code: string; message: string };
}
