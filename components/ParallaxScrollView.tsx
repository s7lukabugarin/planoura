import type { PropsWithChildren, ReactElement } from "react";
import {
  StyleSheet,
  useColorScheme,
  Dimensions,
  View,
  ViewStyle,
  Platform,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from "react-native-reanimated";

import { ThemedView } from "@/components/ThemedView";

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  overlay?: ReactElement;
  overlayText?: ReactElement;
  logo?: ReactElement;
  headerBackgroundColor: { dark: string; light: string };
  contentStyles?: ViewStyle;
}>;

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");
const HEADER_HEIGHT = screenHeight * 0.4;

export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
  overlay,
  logo,
  overlayText,
  contentStyles = {
    backgroundColor: "#12a28d",
  },
}: Props) {
  const colorScheme = useColorScheme() ?? "light";
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);

  const contentStylesMode = {
    ...contentStyles,
    backgroundColor: colorScheme === "dark" ? "#000" : "#fff"
  };

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [2, 1, 1]
          ),
        },
      ],
    };
  });

  return (
    <ThemedView style={{
      ...styles.container,
      backgroundColor: colorScheme === "dark" ? "#000" : "#fff"
    }}>
      <Animated.ScrollView ref={scrollRef} scrollEventThrottle={16}>
        <Animated.View
          style={[
            styles.header,
            { backgroundColor: headerBackgroundColor[colorScheme] },
            headerAnimatedStyle,
          ]}
        >
          {headerImage}
          {overlay && overlay}
          {logo && logo}
          {overlayText && overlayText}
        </Animated.View>

        <View style={[styles.contentRadius, contentStylesMode]}></View>
        <View style={[styles.content, contentStylesMode]}>{children}</View>
      </Animated.ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: screenWidth,
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    position: "relative",
    padding: 20,
    paddingBottom: 40,
    gap: 16,
    overflow: "hidden",
    minHeight: Platform.OS === "android" ? screenHeight - HEADER_HEIGHT + 30  : screenHeight - HEADER_HEIGHT,
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  contentRadius: {
    backgroundColor: "rgba(46, 161, 174, 1)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 30,
    position: "absolute",
    top: HEADER_HEIGHT - 30,
    left: 0,
    width: "100%",
  },
});
