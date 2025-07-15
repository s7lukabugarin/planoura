import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import moment from "moment";
import UntilModal from "./UntilModal";
import { untilValueFunction } from "@/helpers/untilValueFunction";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useColorScheme } from "@/hooks/useColorScheme";

export type RepeatValues = "never" | "daily" | "weekly" | "monthly";

interface RepeatValueOption {
  value: RepeatValues;
  label: string;
}

const REPEAT_OPTIONS: RepeatValueOption[] = [
  { value: "never", label: "Never" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const INTERVAL_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}`,
}));

interface TimePatternModalProps {
  isVisible: boolean;
  selectedDate: string;
  onClose: (event: GestureResponderEvent) => void;
  onSubmit: (
    selectedPattern: RepeatValues,
    interval?: number,
    untilDate?: Date
  ) => void;
}

const TimePatternModal: React.FC<TimePatternModalProps> = ({
  isVisible,
  selectedDate,
  onClose,
  onSubmit,
}) => {
  const [selectedPattern, setSelectedPattern] = useState<RepeatValues>("never");
  const [interval, setInterval] = useState(1);
  const [untilDaily, setUntilDaily] = useState<Date | "default">("default");
  const [untilModalVisible, setUntilModalVisible] = useState(false);

  const colorScheme = useColorScheme();
  const mainTextColor = useThemeColor({}, "mainText");
  const mainColor = useThemeColor({}, "main");

  const untilDate =
    untilDaily === "default"
      ? moment(selectedDate).add(3, "months").toDate()
      : untilDaily;

  const handleUntilChange = (newDate: Date | "default") => {
    setUntilDaily(newDate);
  };

  const getDailyRepeatText = () => {
    const formattedUntilDate = moment(untilDate).format("ddd, MMM D, YYYY");
    if (interval === 1) {
      return `Repeats daily until ${formattedUntilDate}`;
    } else if (interval === 2) {
      return `Repeats every other day until ${formattedUntilDate}`;
    } else {
      return `Repeats every ${interval} days until ${formattedUntilDate}`;
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, backgroundColor: mainColor, paddingBottom: 40 }}>
        <View
          style={{
            ...styles.overlayHeader,
            backgroundColor: colorScheme === "dark" ? "#15413c" : "#e6f7f5",
          }}
        >
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-outline" size={28} color={mainTextColor} />
          </TouchableOpacity>
          <View style={styles.headerTextWrapper}>
            <View>
              <ThemedText type="subtitle" style={styles.headerText}>
                Repeat
              </ThemedText>
            </View>
          </View>
          <TouchableOpacity
            style={{ marginLeft: "auto" }}
            onPress={() => {
              onSubmit(selectedPattern, interval, untilDate);
            }}
          >
            <Ionicons name="checkmark" size={24} color={mainTextColor} />
          </TouchableOpacity>
        </View>
        <Dropdown
          options={REPEAT_OPTIONS}
          selectedValue={selectedPattern}
          onSelect={setSelectedPattern}
          placeholder="Frequency"
        />
        {selectedPattern === "never" && (
          <View style={styles.pickerWrapper}>
            <ThemedText
              style={{
                // color: "#747474",
                fontSize: 15,
                color:
                  colorScheme === "dark"
                    ? "rgba(255, 255, 255, 0.55)"
                    : "rgba(0, 0, 0, 0.4)",
              }}
            >
              This event will never repeat
            </ThemedText>
          </View>
        )}
        {selectedPattern !== "never" && (
          <Dropdown
            options={INTERVAL_OPTIONS.map((option) => {
              return {
                ...option,
                label: `${option.label} ${
                  selectedPattern === "daily"
                    ? option.value === 1
                      ? "day"
                      : "days"
                    : ""
                } ${
                  selectedPattern === "weekly"
                    ? option.value === 1
                      ? "week"
                      : "weeks"
                    : ""
                } ${
                  selectedPattern === "monthly"
                    ? option.value === 1
                      ? "month"
                      : "months"
                    : ""
                }`.trim(),
              };
            })}
            selectedValue={interval}
            onSelect={setInterval}
            placeholder="Interval"
          />
        )}
        {selectedPattern !== "never" && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.pickerWrapper}
            onPress={() => {
              if (selectedPattern === "daily") {
                setUntilModalVisible(true);
              }
            }}
          >
            <ThemedText
              style={{
                ...styles.placeholderText,
                color:
                  colorScheme === "dark"
                    ? "rgba(255, 255, 255, 0.55)"
                    : "rgba(0, 0, 0, 0.4)",
              }}
            >
              Until
            </ThemedText>
            <ThemedText style={styles.selectedValue}>
              {selectedPattern === "daily" &&
                untilValueFunction(selectedPattern, untilDaily)}
            </ThemedText>
          </TouchableOpacity>
        )}
        {selectedPattern !== "never" && (
          <View style={styles.pickerWrapper}>
            <ThemedText
              style={{
                ...styles.placeholderText,
                color:
                  colorScheme === "dark"
                    ? "rgba(255, 255, 255, 0.55)"
                    : "rgba(0, 0, 0, 0.4)",
              }}
            >
              {getDailyRepeatText()}
            </ThemedText>
          </View>
        )}
      </View>
      {selectedPattern !== "never" && (
        <UntilModal
          isVisible={untilModalVisible}
          untilDateProp={untilDate}
          untilDaily={untilDaily}
          onClose={() => setUntilModalVisible(false)}
          onSubmit={(untilDateArg) => {
            setUntilModalVisible(false);
            handleUntilChange(untilDateArg);
          }}
          selectedDate={selectedDate}
          selectedPattern={selectedPattern}
        />
      )}
    </Modal>
  );
};
interface DropdownProps<T> {
  options: { value: T; label: string }[];
  selectedValue: T;
  onSelect: (value: T) => void;
  placeholder: string;
}

const Dropdown = <T,>({
  options,
  selectedValue,
  onSelect,
  placeholder,
}: DropdownProps<T>) => {
  const colorScheme = useColorScheme();
  const mainTextColor = useThemeColor({}, "mainText");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedLabel =
    options.find((option) => option.value === selectedValue)?.label ||
    placeholder;

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleSelect = (value: T) => {
    onSelect(value);
    setIsDropdownOpen(false);
  };

  const dropdownAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isDropdownOpen) {
      Animated.timing(dropdownAnimation, {
        toValue: 1,
        useNativeDriver: true,
        duration: 200,
      }).start();
    } else {
      Animated.timing(dropdownAnimation, {
        toValue: 0,
        useNativeDriver: true,
        duration: 150,
      }).start();
    }
  }, [isDropdownOpen]);

  return (
    <>
      <View style={styles.dropdownContainer}>
        <TouchableOpacity style={styles.pickerWrapper} onPress={toggleDropdown}>
          <ThemedText
            style={{
              ...styles.placeholderText,
              color:
                colorScheme === "dark"
                  ? "rgba(255, 255, 255, 0.55)"
                  : "rgba(0, 0, 0, 0.4)",
            }}
          >
            {placeholder}
          </ThemedText>
          <View style={{
            flexDirection: "row",
            gap: 8,
            alignItems: "center"
          }}>
            <ThemedText
              style={{
                ...styles.selectedValue,
              }}
            >
              {selectedLabel}
            </ThemedText>
            <Ionicons
              name="chevron-down-outline"
              size={16}
              color={mainTextColor}
            />
          </View>
        </TouchableOpacity>
        {isDropdownOpen && (
          <Animated.View
            style={[
              styles.dropdownMenu,
              {
                opacity: dropdownAnimation,
                transform: [
                  {
                    scale: dropdownAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
                zIndex: 100,
              },
            ]}
          >
            {options.map((option) => (
              <TouchableOpacity
                key={String(option.value)}
                style={styles.dropdownItem}
                onPress={() => handleSelect(option.value)}
              >
                <Text style={styles.dropdownItemText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}
      </View>
      {isDropdownOpen && (
        <TouchableWithoutFeedback onPress={() => setIsDropdownOpen(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    // backgroundColor: "red"
  },
  overlayHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingBottom: 15,
    paddingTop: 50,
    // borderBottomWidth: 1,
    // borderBottomColor: "#E5E5E5",
    // backgroundColor: "#eaf4f3",
  },
  headerTextWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: 30,
    marginRight: "auto",
  },
  headerText: {
    fontSize: 20,
    lineHeight: 26,
  },
  dropdownMenu: {
    position: "absolute",
    top: 0,
    left: "50%",
    backgroundColor: "#fff",
    elevation: 1,
    zIndex: 50,
    minWidth: "45%",
    transformOrigin: "top left",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dropdownItemTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  dropdownItemText: {
    color: "#333",
    fontSize: 16,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#07CFB1",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerWrapper: {
    display: "flex",
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  dropdownContainer: {
    position: "relative",
    // backgroundColor: "red"
    // zIndex: 1000,
  },
  placeholderText: {
    // color: "#747474",
    fontSize: 15,
  },
  selectedValue: {
    // color: "#000",
    fontSize: 15,
    fontFamily: "Default-Regular",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
  },
  dropdownModalContainer: {
    // flex: 1,
    // justifyContent: "center",
    // alignItems: "center",
  },
});

export default TimePatternModal;
