import { Image, ImageProps } from "expo-image";
import { useState } from "react";

export default function CachedImage(props: ImageProps) {
  const [error, setError] = useState(false);
  return (
    <Image
      {...props}
       source={
        error
          ? require("@/assets/images/splash-logo.png")
          : props.source
      }
      cachePolicy="memory-disk"
       onError={() => setError(true)}
    />
  );
}