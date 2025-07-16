import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { useState, useEffect } from "react";
import {
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Image } from "expo-image";
import { getThumbnailAsync } from "expo-video-thumbnails";

export default function WorkoutVideo({
  autoplay = false,
  item_id,
}: {
  autoplay?: boolean;
  item_id?: string;
}) {
  const [clicked, setClicked] = useState(false);
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(
    null
  );

  useEffect(() => {
    const getServerThumbnail = () => {
      if (item_id) {
        const serverThumbnail = `https://pilatesstream.s7design.de/Items/${item_id}/Images/Primary?fillHeight=396&fillWidth=223&quality=96`;
        setGeneratedThumbnail(serverThumbnail);
        return;
      }
    };

    getServerThumbnail();
  }, [item_id]);

  const player = useVideoPlayer(
    `${process.env.EXPO_PUBLIC_STREAM}/videos/${item_id}/main.m3u8?api_key=${process.env.EXPO_PUBLIC_STREAM_API_KEY}`,
    (player) => {
      player.muted = true;
      player.loop = autoplay;

      if (autoplay) {
        player.play();
        setClicked(true);
      }
    }
  );

  useEffect(() => {
    if (clicked && Platform.OS === "ios") {
      player.play();
    }
  }, [clicked]);

  const thumbnailToUse = generatedThumbnail;

  return Platform.OS === "ios" ? (
    <TouchableWithoutFeedback
      onPress={() => {
        setClicked(true);
      }}
    >
      <View style={styles.contentContainer}>
        {!clicked && thumbnailToUse && (
          <Image
            source={{ uri: thumbnailToUse }}
            style={[
              styles.playOverlay,
              { position: "absolute", zIndex: 2, top: 0, borderRadius: 10 },
            ]}
            contentFit="cover"
          />
        )}

        {!clicked && (
          <View style={styles.playOverlay}>
            <Ionicons name="play" size={52} color="#fff" />
          </View>
        )}

        <VideoView
          style={styles.video}
          player={player}
          allowsFullscreen
          allowsPictureInPicture
          contentFit="cover"
        />
      </View>
    </TouchableWithoutFeedback>
  ) : (
    <View style={styles.contentContainer}>
      <VideoView
        style={styles.video}
        player={player}
        allowsFullscreen
        allowsPictureInPicture
        contentFit="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },
  video: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    zIndex: 1,
  },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
    pointerEvents: "none",
  },
});
