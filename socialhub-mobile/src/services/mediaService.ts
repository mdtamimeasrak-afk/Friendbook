import * as ImagePicker from "expo-image-picker";

import { supabase } from "@/lib/supabase";
import type { StorageBucket } from "@/types/database";

export interface PickedMedia {
  uri: string;
  mimeType: string | null;
  fileName: string | null;
  width?: number;
  height?: number;
  duration?: number | null;
}

export interface UploadResult {
  url: string;
  error: string | null;
}

export const MEDIA_LIMITS = {
  maxImageBytes: 12 * 1024 * 1024, // 12 MB
  maxVideoBytes: 100 * 1024 * 1024, // 100 MB
};

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/3gpp", "video/x-msvideo"];

function isOfflineError(message: string): boolean {
  return /failed to fetch|network request failed|fetch failed|network error|timeout|connection/i.test(message);
}

function toFriendlyUploadError(message: string): string {
  if (isOfflineError(message)) {
    return "You're offline. Reconnect to publish your post.";
  }
  return message;
}

function extensionFor(mimeType: string | null, fileName: string | null): string {
  const fromMime: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/heic": "heic",
    "image/heif": "heif",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
    "video/3gpp": "3gp",
    "video/x-msvideo": "avi",
  };
  if (mimeType && fromMime[mimeType]) {
    return fromMime[mimeType];
  }
  const match = fileName?.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : "bin";
}

/**
 * Media service - pick, validate and upload media through the
 * EXISTING SocialHub storage buckets (post-images, videos, stories).
 * All buckets are public-read; only the owner can write (RLS).
 * Uploads use secure per-user paths to avoid filename collisions.
 */
export const mediaService = {
  async requestPermission(): Promise<boolean> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return permission.granted;
  },

  async pickImage(): Promise<{ media: PickedMedia | null; error: string | null }> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (result.canceled) {
      return { media: null, error: null };
    }

    const asset = result.assets[0];
    const media = {
      uri: asset.uri,
      mimeType: asset.mimeType ?? null,
      fileName: asset.fileName ?? null,
      width: asset.width,
      height: asset.height,
      duration: null,
    };

    const validationError = this.validateImage(media);
    if (validationError) {
      return { media: null, error: validationError };
    }

    return { media, error: null };
  },

  /** Camera capture - permission is requested only when the user taps "Take photo". */
  async takePhoto(): Promise<{ media: PickedMedia | null; error: string | null }> {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return { media: null, error: "Camera access is needed to take a photo." };
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (result.canceled) {
      return { media: null, error: null };
    }

    const asset = result.assets[0];
    const media = {
      uri: asset.uri,
      mimeType: asset.mimeType ?? "image/jpeg",
      fileName: asset.fileName ?? null,
      width: asset.width,
      height: asset.height,
      duration: null,
    };

    const validationError = this.validateImage(media);
    if (validationError) {
      return { media: null, error: validationError };
    }

    return { media, error: null };
  },

  async pickVideo(): Promise<{ media: PickedMedia | null; error: string | null }> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsMultipleSelection: false,
      quality: 0.9,
    });

    if (result.canceled) {
      return { media: null, error: null };
    }

    const asset = result.assets[0];
    const media = {
      uri: asset.uri,
      mimeType: asset.mimeType ?? null,
      fileName: asset.fileName ?? null,
      width: asset.width,
      height: asset.height,
      duration: asset.duration ?? null,
    };

    const validationError = this.validateVideo(media);
    if (validationError) {
      return { media: null, error: validationError };
    }

    return { media, error: null };
  },

  validateImage(media: PickedMedia): string | null {
    const mime = media.mimeType?.toLowerCase();
    if (mime && !IMAGE_TYPES.includes(mime)) {
      return "That image format isn't supported. Use JPEG, PNG or WebP.";
    }
    return null;
  },

  validateVideo(media: PickedMedia): string | null {
    const mime = media.mimeType?.toLowerCase();
    if (mime && !VIDEO_TYPES.includes(mime)) {
      return "Unsupported video format. Use MP4 or QuickTime.";
    }
    return null;
  },

  /** Builds a unique secure path: userId/timestamp-random.ext */
  buildPath(userId: string, media: PickedMedia): string {
    const random = Math.random().toString(36).slice(2, 10);
    const ext = extensionFor(media.mimeType, media.fileName);
    return `${userId}/${Date.now()}-${random}.${ext}`;
  },

  /**
   * Uploads a local file to the given bucket.
   * Progress: the Supabase JS client doesn't report upload progress,
   * so callers show an indeterminate "Uploading…" state instead.
   */
  async uploadFile(
    bucket: StorageBucket,
    path: string,
    media: PickedMedia,
    onProgress?: (fraction: number) => void
  ): Promise<UploadResult> {
    try {
      onProgress?.(0.1);
      const { error } = await supabase.storage.from(bucket).upload(path, {
        uri: media.uri,
        type: media.mimeType ?? "application/octet-stream",
        name: media.fileName ?? path,
      });
      if (error) {
        return { url: "", error: toFriendlyUploadError(error.message) };
      }
      onProgress?.(1);
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return { url: data.publicUrl, error: null };
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Upload failed.";
      return { url: "", error: toFriendlyUploadError(message) };
    }
  },

  /**
   * Best-effort deletion of an object from a public URL.
   * Used to clean up media when a post/story is deleted.
   */
  async deleteByPublicUrl(url: string, bucket: StorageBucket): Promise<void> {
    try {
      const marker = `/object/public/${bucket}/`;
      const index = url.indexOf(marker);
      if (index === -1) {
        return;
      }
      const path = decodeURIComponent(url.slice(index + marker.length).split("?")[0]);
      await supabase.storage.from(bucket).remove([path]);
    } catch {
      // Best-effort cleanup - never block the delete flow on this.
    }
  },
};