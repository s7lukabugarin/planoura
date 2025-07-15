import { Alert, Platform } from "react-native";
import axios from "axios";
import { getTokens, refreshTokens } from "./auth";
import Toast from "react-native-toast-message";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem   from "expo-file-system";
import * as ImagePicker from "expo-image-picker";

export interface ImageItemResponse {
  id: number;
  is_public: boolean;
  title: string;
  description: string;
  file_path: string;
  item_id: string;
  local_file_name: string;
  thumbnail: boolean;
  created_by: number;
}

export const uploadImage = async (
  file: any,
  setLoading?: (state: boolean) => void
): Promise<any> => {
  const [fileName, fileExtension] = file.fileName?.split(".");
  try {
    setLoading?.(true);
    const { accessToken } = await getTokens();

    const formData = new FormData();

    const fullFileName = `${fileName}_${Date.now().toLocaleString()}.${fileExtension}`;

    // @ts-ignore
    formData.append("image_file", {
      uri: file.uri,
      type: file.mimeType,
      name: fullFileName,
    });

    formData.append(
      "image_json_data",
      JSON.stringify({
        title: fullFileName,
        is_public: true,
        description: "slika test",
        thumbnail: false,
      })
    );

    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/image-upload/`,
      formData,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error("Failed to upload image:", {
        status: error.response.status,
        data: error.response.data,
      });

      if (error.response.status === 401) {
        const refreshVal = await refreshTokens();

        if (refreshVal) {
          return uploadImage(file, setLoading); // Retry request
        } else {
          return;
        }
      }
    } else {
      console.error("An error occurred during image upload:", error.message);
    }

    Alert.alert("Error", "Failed to upload image. Please try again.");
    return null;
  } finally {
    setLoading?.(false);
  }
};

export const uploadProfileImage = async (
  file: any,
  setLoading?: (state: boolean) => void
): Promise<any> => {
  const [fileName, fileExtension] = file.fileName?.split(".");
  try {
    setLoading?.(true);
    const { accessToken } = await getTokens();

    const formData = new FormData();

    const fullFileName = `${fileName}_${Date.now().toLocaleString()}.${fileExtension}`;

    // @ts-ignore
    formData.append("image_file", {
      uri: file.uri,
      type: file.mimeType,
      name: fullFileName,
    });

    formData.append(
      "image_json_data",
      JSON.stringify({
        title: fullFileName,
        is_public: true,
        description: "slika test",
        thumbnail: false,
      })
    );

    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/set-profile-image/`,
      formData,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error("Failed to upload image:", {
        status: error.response.status,
        data: error.response.data,
      });

      if (error.response.status === 401) {
        const refreshVal = await refreshTokens();

        if (refreshVal) {
          return uploadImage(file, setLoading); // Retry request
        } else {
          return;
        }
      }
    } else {
      console.error("An error occurred during image upload:", error.message);
    }

    Alert.alert("Error", "Failed to upload image. Please try again.");
    return null;
  } finally {
    setLoading?.(false);
  }
};

const getUploadableUri = async (asset: ImagePicker.ImagePickerAsset) => {
  if (Platform.OS !== "ios" || asset.uri.startsWith("file://")) return asset.uri;

  // 1) probaj direktno iz MediaLibrary-ja
  // @ts-ignore
  const info = await MediaLibrary.getAssetInfoAsync(asset.id);
  if (info.localUri) return info.localUri;

  // 2) fallback – kopiraj u cache
  const ext   = (asset.fileName?.split(".").pop() ?? "mov").toLowerCase();
  const temp  = `${FileSystem.cacheDirectory}${Date.now()}.${ext}`;
  await FileSystem.copyAsync({ from: asset.uri, to: temp });
  return temp;
};

/** Vadi ime + mime; dodaje default ako fali */
const getNameAndMime = (asset: ImagePicker.ImagePickerAsset) => {
  let name = asset.fileName ?? `video-${Date.now()}.mov`;
  if (!/\.\w+$/.test(name)) name += ".mov";

  const ext  = name.split(".").pop()!.toLowerCase();
  const type =
    ext === "mp4"
      ? "video/mp4"
      : ext === "mov"
      ? "video/quicktime"
      : "application/octet-stream";

  return { name, type, ext };
};

export const uploadVideo = async (
  asset: ImagePicker.ImagePickerAsset,
  setLoading?: (v: boolean) => void
): Promise<any> => {
  setLoading?.(true);

  try {
    // ① pripremi fajl
    const uri               = await getUploadableUri(asset);
    const { name, type, ext } = getNameAndMime(asset);
    const stampedName       =
      `${name.replace(/\.[^/.]+$/, "")}_${Date.now()}.${ext}`;

    // ② složi FormData
    const formData = new FormData();
    formData.append("video_file", { uri, name: stampedName, type } as any);
    formData.append(
      "video_json_data",
      JSON.stringify({
        title: stampedName,
        is_public: true,
        description: "uploaded from Expo",
      })
    );

    // ③ pošalji
    const { accessToken } = await getTokens();
    const res = await axios.post(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/video-upload/`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
      }
    );

    return res.data;      // { id, item_id, ... }
  } catch (err: any) {
    if (err.response?.status === 401) {
      if (await refreshTokens()) {
        return uploadVideo(asset, setLoading); // retry once
      }
    }
    console.error("Video upload failed:", err?.response ?? err.message);
    Alert.alert("Error", "Failed to upload video. Please try again.");
    return null;
  } finally {
    setLoading?.(false);
  }
};

export const fetchAllImages = async (
  setLoading?: (state: boolean) => void
): Promise<Array<ImageItemResponse> | null> => {
  try {
    setLoading?.(true);
    const { accessToken } = await getTokens();

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/get-images-media-library-by-coach/`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    return data;
  } catch (error: any) {
    if (error.response) {
      console.error("Failed to fetch images:", {
        status: error.response.status,
        data: error.response.data,
      });

      if (error.response.status === 401) {
        const refreshVal = await refreshTokens();

        if (refreshVal) {
          return uploadImage(setLoading); // Retry request
        } else {
          return null;
        }
      }
    } else {
      console.error("An error occurred during image upload:", error.message);
    }

    Toast.show({
      type: "error",
      text1: "Failed to upload image. Please try again.",
      position: "top",
    });

    return null;
  } finally {
    setLoading?.(false);
  }
};

export const fetchAllVideos = async (
  setLoading?: (state: boolean) => void
): Promise<Array<ImageItemResponse> | null> => {
  try {
    setLoading?.(true);
    const { accessToken } = await getTokens();

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/get-videos-media-library-by-coach/`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    return data;
  } catch (error: any) {
    if (error.response) {
      console.error("Failed to fetch videos:", {
        status: error.response.status,
        data: error.response.data,
      });

      if (error.response.status === 401) {
        const refreshVal = await refreshTokens();

        if (refreshVal) {
          return uploadImage(setLoading); // Retry request
        } else {
          return null;
        }
      }
    } else {
      console.error("An error occurred during image upload:", error.message);
    }

    Toast.show({
      type: "error",
      text1: "Failed to upload image. Please try again.",
      position: "top",
    });

    return null;
  } finally {
    setLoading?.(false);
  }
};
