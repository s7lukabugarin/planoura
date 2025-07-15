export   const inferMime = (fileName: string): string => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "heic":
        return "image/heic";
      case "mp4":
        return "video/mp4";
      case "mov":
        return "video/quicktime";
      case "m4v":
        return "video/x-m4v";
      default:
        return "application/octet-stream";
    }
  };