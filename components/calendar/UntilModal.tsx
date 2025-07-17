import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import moment from "moment";
import { untilValueFunction } from "@/helpers/untilValueFunction";
import { CalendarList, DateData } from "react-native-calendars";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useColorScheme } from "@/hooks/useColorScheme";

type RepeatValues = "daily" | "weekly" | "monthly";

const RANGE = 24;

interface UntilModalProps {
  isVisible: boolean;
  onClose: (event: GestureResponderEvent) => void;
  onSubmit: (untilDate: Date | "default") => void;
  untilDateProp: Date;
  selectedPattern: RepeatValues;
  untilDaily: Date | "default";
  selectedDate: string;
}

const UntilModal: React.FC<UntilModalProps> = ({
  isVisible,
  onClose,
  onSubmit,
  untilDateProp,
  selectedPattern,
  untilDaily,
  selectedDate,
}) => {
  const mainTextColor = useThemeColor({}, "mainText");
  const mainColor = useThemeColor({}, "main");
  const colorScheme = useColorScheme();

  const [selectedOption, setSelectedOption] = useState<"default" | "specific">(
    "default"
  );

  const [untilDate, setUntilDate] = useState<Date>(untilDateProp);

  const markedDates = useMemo(() => {
    if (!untilDate) return {};

    return {
      [moment(untilDate).format("YYYY-MM-DD")]: {
        selected: true,
        selectedColor: "#07CFB1",
        selectedTextColor: "#fff",
      },
    };
  }, [untilDate]);

  useEffect(() => {
    setSelectedOption(untilDaily === "default" ? "default" : "specific");
    setUntilDate(untilDateProp);
  }, []);

  const onDayPress = useCallback((day: DateData) => {
    setUntilDate(new Date(day.dateString));
  }, []);

  const calendarKey = `calendar-${isVisible}-${moment(
    untilDate
  ).toISOString()}`;

  const calendarTheme = useMemo(
    () => ({
      arrowColor: "#12a28d",
      todayTextColor: "#12a28d",
      monthTextColor: mainTextColor,
      selectedDayBackgroundColor: "transparent",
      selectedDayTextColor: mainTextColor,
      calendarBackground: mainColor,
      dayTextColor: mainTextColor,
      textDisabledColor: colorScheme === "dark" ? "#555" : "#ccc",
      selectedTextColor: mainTextColor,
    }),
    [colorScheme, mainColor]
  );

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
                Repeat until
              </ThemedText>
              <ThemedText style={{ fontSize: 12, lineHeight: 13 }}>
                {moment(untilDate).format("ddd, MMM D, YYYY")}
              </ThemedText>
            </View>
          </View>
          <TouchableOpacity
            style={{ marginLeft: "auto" }}
            onPress={() => {
              if (selectedOption === "default") {
                onSubmit("default");
              } else {
                onSubmit(untilDate);
              }
            }}
          >
            <Ionicons name="add-circle-outline" size={24} color={mainTextColor} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.pickerWrapper}
          onPress={() => {
            setSelectedOption("default");
            setUntilDate(moment(selectedDate).add(3, "months").toDate());
          }}
        >
          <ThemedText style={styles.placeholderText}>
            {untilValueFunction(selectedPattern)}
          </ThemedText>
          <View style={styles.radioCircle}>
            {selectedOption === "default" && (
              <View style={styles.radioCircleSelected} />
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.pickerWrapper}
          onPress={() => {
            setSelectedOption("specific");
          }}
        >
          <ThemedText style={styles.placeholderText}>Specific date</ThemedText>
          <View style={styles.radioCircle}>
            {selectedOption === "specific" && (
              <View style={styles.radioCircleSelected} />
            )}
          </View>
        </TouchableOpacity>
        {isVisible && selectedOption === "specific" && (
          <CalendarList
            testID="untilModalCalendar"
            key={calendarKey}
            // key={isVisible ? moment(untilDate).toISOString() : "default"}
            current={moment(untilDate).format("YYYY-MM-DD")}
            pastScrollRange={RANGE}
            futureScrollRange={RANGE}
            markedDates={markedDates}
            onDayPress={onDayPress}
            theme={{
              ...calendarTheme,
            }}
          />
        )}
      </View>
    </Modal>
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
    lineHeight: 29,
  },
  pickerWrapper: {
    display: "flex",
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  placeholderText: {
    fontSize: 15,
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
  radioCircleSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#07CFB1",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -6 }, { translateY: -6 }],
  },
  submitButton: {},
});

export default UntilModal;
