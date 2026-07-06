/** YouTube Data API v3 request/response shapes used by this module (subset). */

export interface YouTubeVideoInsertBody {
  snippet: {
    title: string;
    description: string;
    tags?: string[];
    categoryId?: string;
    defaultLanguage?: string;
  };
  status: {
    privacyStatus: 'public' | 'unlisted' | 'private';
    selfDeclaredMadeForKids?: boolean;
    publishAt?: string;
  };
}

export interface YouTubeVideoResource {
  id: string;
  snippet?: { title: string };
  status?: { uploadStatus: string; privacyStatus: string };
}

export interface YouTubeChannelResource {
  id: string;
  snippet?: { title: string };
}
