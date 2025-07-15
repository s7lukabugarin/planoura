import { NormalizedFile } from "@/constants/types";
import { inferMime } from "./inferMime";
import * as ImagePicker from "expo-image-picker";

export   const normalizeAsset = (
    asset: ImagePicker.ImagePickerAsset
  ): NormalizedFile => {
    let { uri } = asset;
    let fileName =
      asset.fileName ?? uri.split("/").pop() ?? `upload-${Date.now()}`;
    let mimeType = asset.mimeType ?? inferMime(fileName);
    return { uri, fileName, mimeType }; // uvek string-ovi
  };