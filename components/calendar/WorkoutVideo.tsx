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

export default function WorkoutVideo({
  autoplay = false,
  item_id,
  thumbnail,
}: {
  autoplay?: boolean;
  item_id?: string;
  thumbnail?: string;
}) {
  const [clicked, setClicked] = useState(false);
  const mainTextColor = useThemeColor({}, "mainText");

  const player = useVideoPlayer(
    `${process.env.EXPO_PUBLIC_STREAM}/videos/${item_id}/main.m3u8?api_key=${process.env.EXPO_PUBLIC_STREAM_API_KEY}`,
    (player) => {
      player.muted = true;
      player.loop = autoplay;

      if (autoplay) {
        player.play();
        setClicked(true); // hide thumbnail when autoplay is enabled
      }
    }
  );

  useEffect(() => {
    if (clicked && Platform.OS === "ios") {
      player.play();
    }
  }, [clicked]);

  return Platform.OS === "ios" ? (
    <TouchableWithoutFeedback
      onPress={() => {
        setClicked(true);
      }}
    >
      <View style={styles.contentContainer}>
        {!clicked && thumbnail && (
          <Image
            source={{ uri: thumbnail }}
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
