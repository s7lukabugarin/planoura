import React, { memo, useMemo } from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useColorScheme } from "@/hooks/useColorScheme";

const CustomDay = ({ date, state, marking, events, onDayPress }: any) => {
  const colorScheme = useColorScheme();

  const mainTextColor = useThemeColor({}, "mainText");
  const mainColor = useThemeColor({}, "main");
  const hasEvents = events && events.length > 0;

  // Memoize displayed events and remaining count
  const { displayedEvents, remainingCount } = useMemo(() => {
    const displayed = hasEvents ? events.slice(0, 2) : [];
    const remaining = hasEvents ? events.length - 2 : 0;
    return { displayedEvents: displayed, remainingCount: remaining };
  }, [events]);

  return (
    <TouchableOpacity
      onPress={onDayPress}
      style={{
        height: 80,
        justifyContent: "flex-start",
        alignItems: "center",
        padding: 4,
        // backgroundColor: state === "disabled" ? "#f5f5f5" : "#fff",
        backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
        borderWidth: 0.5,
        borderColor: colorScheme === "dark" ? "#424242" : "#ccc",
        flex: 1,
        width: "100%",
      }}
      activeOpacity={0.7}
    >
      <ThemedText
        type="smaller"
        style={{ color: state === "disabled" ? "#d9e1e8" : mainTextColor, marginTop: 4 }}
      >
        {date?.day}
      </ThemedText>

      {displayedEvents.map((event: any, index: number) => (
        <View
          key={index}
          style={{
            marginTop: 1,
            width: "100%",
            height: 14,
            backgroundColor:
                        colorScheme === "dark" ? "#15413c" : "#00ffe119",
            borderRadius: 2,
            display: "flex",
            alignItems: "flex-start",
          }}
        >
          <ThemedText
            ellipsizeMode="head"
            style={{
              color: colorScheme === "dark" ? "#e3e3e3" : "#000000",
              fontSize: 10,
              lineHeight: 12,
            }}
          >
            {event.title}
          </ThemedText>
        </View>
      ))}

      {remainingCount > 0 && (
        <Text style={{ marginTop: 2, fontSize: 10, color: "#888" }}>
          +{remainingCount} more
        </Text>
      )}
    </TouchableOpacity>
  );
};

// Memoize the component
export const MemoizedCustomDay = memo(
  CustomDay,
  (prevProps, nextProps) =>
    prevProps.date === nextProps.date &&
    prevProps.state === nextProps.state &&
    prevProps.marking === nextProps.marking &&
    JSON.stringify(prevProps.events) === JSON.stringify(nextProps.events) &&
    prevProps.onDayPress === nextProps.onDayPress
);
