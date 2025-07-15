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
  Alert,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import WheelPickerExpo from "react-native-wheel-picker-expo";

interface Option {
  value: number;
  label: string;
}

const HOURS_OPTIONS: Option[] = Array.from({ length: 6 }, (_, i) => ({
  value: i,
  label: `${i.toString().padStart(2, "0")}`,
}));

const MINUTES_OPTIONS: Option[] = [0, 15, 30, 45].map((minute) => ({
  value: minute,
  label: `${minute.toString().padStart(2, "0")}`,
}));

interface DurationModalProps {
  isVisible: boolean;
  onClose: (event: GestureResponderEvent) => void;
  onSubmit: (totalMinutes: number) => void;
  duration: { hours: number; minutes: number };
}

const DurationModal: React.FC<DurationModalProps> = ({
  isVisible,
  onClose,
  onSubmit,
  duration,
}) => {
  const [selectedHour, setSelectedHour] = useState(duration.hours);
  const [selectedMinute, setSelectedMinute] = useState(duration.minutes);

  const handleSubmit = () => {
    const totalMinutes = selectedHour * 60 + selectedMinute;
    if (selectedHour === 0 && selectedMinute === 0) {
      Alert.alert("Invalid duration", "Duration cannot be 00:00");
      return;
    }
    onSubmit(totalMinutes);
  };

  const initialIndexHours = HOURS_OPTIONS.findIndex(
    (option) => option.value === selectedHour
  );

  useEffect(() => {
    if (duration) {
      setSelectedHour(duration.hours);
      setSelectedMinute(duration.minutes);
    }
  }, [duration, isVisible]);

  return (
    <Modal
    visible={isVisible}
    transparent={true}
    onRequestClose={onClose}
    statusBarTranslucent
    animationType="slide" // Changed from default to match time picker
  >
    <View style={styles.modalContainer}>
      <View style={styles.innerWrapper}>
        <ThemedText style={styles.modalTitle}>Select Duration</ThemedText>

        <View style={styles.timeWheelContainer}>
          <View style={styles.wheelColumn}>
            <ThemedText style={styles.wheelLabel}>Hours</ThemedText>
            <WheelPickerExpo
              height={200}
              width={100}
              items={HOURS_OPTIONS}
              initialSelectedIndex={initialIndexHours}
              onChange={({ item }) => setSelectedHour(item.value)}
            />
          </View>
          
          <Text style={styles.timeSeparator}>:</Text>
          
          <View style={styles.wheelColumn}>
            <ThemedText style={styles.wheelLabel}>Minutes</ThemedText>
            <WheelPickerExpo
              height={200}
              width={100}
              items={MINUTES_OPTIONS}
              initialSelectedIndex={
                MINUTES_OPTIONS.findIndex(
                  (option) => option.value == selectedMinute
                ) || 0
              }
              onChange={({ item }) => setSelectedMinute(item.value)}
            />
          </View>
        </View>

        <View style={styles.modalButtonsContainer}>
          <TouchableOpacity 
            onPress={onClose}
            style={styles.modalButton}
          >
            <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleSubmit}
            style={styles.modalButton}
          >
            <ThemedText style={styles.modalButtonText}>Submit</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
          <Text style={styles.placeholderText}>{placeholder}</Text>
          <Text style={styles.selectedValue}>{selectedLabel}</Text>
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
    modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  innerWrapper: {
    width: "80%",
    minHeight: 300, // Adjusted for better proportions
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  modalTitle: {
    textAlign: "center",
    color: "#000",
    marginBottom: 30,
    fontSize: 18,
  },
  timeWheelContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  wheelColumn: {
    alignItems: "center",
  },
  wheelLabel: {
    color: "#000",
    fontSize: 14,
    marginBottom: 10,
  },
  timeSeparator: {
    fontSize: 24,
    marginHorizontal: 5,
    color: "#8d8d8d",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 20,
    marginTop: 30,
  },
  modalButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  modalButtonText: {
    textTransform: "uppercase",
    color: "#07CFB1",
    fontSize: 14,
    fontFamily: "Default-SemiBold",
  },
  container: {
    width: "100%",
  },
  overlayHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingBottom: 15,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    backgroundColor: "#eaf4f3",
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
    color: "rgba(0, 0, 0, 1)",
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
  },
  placeholderText: {
    color: "#747474",
    fontSize: 15,
  },
  selectedValue: {
    color: "#000",
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
  dropdownModalContainer: {},
 
});

export default DurationModal;
