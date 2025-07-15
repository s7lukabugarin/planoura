import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  Platform,
  Animated,
  TouchableWithoutFeedback,
  // Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
  FlatList,
} from "react-native";
import Modal from "react-native-modal";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import {
  AgendaList,
  ExpandableCalendar,
  CalendarProvider,
  TimelineList,
  TimelineEventProps,
  CalendarUtils,
  CalendarList,
  Calendar,
} from "react-native-calendars";
import { Picker } from "@react-native-picker/picker";
import { ThemedText } from "@/components/ThemedText";
import moment from "moment";
import { UpdateSources } from "react-native-calendars/src/expandableCalendar/commons";
import groupBy from "lodash/groupBy";
import { LocationInput } from "@/components/LocationInput";
import DatePickerModal from "@/components/calendar/DatePickerModal";
import DateTimePicker from "@react-native-community/datetimepicker";
import WorkoutsModal from "@/components/calendar/WorkoutsModal";
import {
  ClassDate,
  createClass,
  CreateClassData,
  getUserClassSessions,
  getClassById,
  UpdateClassData,
} from "@/api/class";
import { calculateDuration } from "@/helpers/calculateDuration";
import { MemoizedCustomDay } from "@/components/calendar/CustomDay";
import { scheduleNotification } from "@/helpers/scheduleNotification";
import TimePatternModal from "@/components/calendar/TimePatternModal";
import DurationModal from "@/components/calendar/DurationModal";
import Toast from "react-native-toast-message";
import { Exercise } from "@/api/exercices";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useColorScheme } from "@/hooks/useColorScheme";
import DraggableFlatList from "react-native-draggable-flatlist";
import { convertSeconds } from "@/helpers/convertSeconds";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Constants from "expo-constants";
import WorkoutDisplayModal from "@/components/calendar/WorkoutDisplayModal";
import { Client, getAllClients } from "@/api/clients";
import { useCourses } from "@/context/coursesContext";
import {
  createCourseSessions,
  getCourseById,
  getCourseSessionDetails,
} from "@/api/courses";
import Button from "@/components/Button";
import WorkoutEditModal from "@/components/calendar/WorkoutEditModal";
import CourseEditModal from "@/components/calendar/CourseEditModal";

type CalendarView = "agenda" | "day" | "3day" | "month";

const RANGE = 24;
interface ViewOption {
  value: CalendarView;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const VIEW_OPTIONS: ViewOption[] = [
  { value: "agenda", label: "Agenda", icon: "list" },
  { value: "day", label: "Day", icon: "calendar-outline" },
  { value: "month", label: "Month", icon: "calendar-sharp" },
];

const alertOptions: { label: string; value: string }[] = [
  { label: "15 minutes before", value: "15" },
  { label: "30 minutes before", value: "30" },
  { label: "45 minutes before", value: "45" },
  { label: "1 hour before", value: "60" },
];

const INITIAL_TIME = { hour: 0, minutes: 0 };

export default function CalendarScreen() {
  const [locationName, setLocationName] = useState("");
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [iosSelectedTime, setIosSelectedTime] = useState(new Date());
  const [clients, setClients] = useState<Client[] | null>(null);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [courseSessionsCreateLoading, setCourseSessionsCreateLoading] =
    useState(false);

  const [createClassLoading, setCreateClassLoading] = useState(false);
  const [workoutsModalEditVisible, setWorkoutsModalEditVisible] =
    useState(false);
  const [iosPickerVisible, setIosPickerVisible] = useState(false);
  const [iosAlertPickerVisible, setIosAlertPickerVisible] = useState(false);

  const colorScheme = useColorScheme();

  const mainTextColor = useThemeColor({}, "mainText");
  const mainColor = useThemeColor({}, "main");

  const [selectedClientsFilterValues, setSelectedClientsFilterValues] =
    useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [fetchedClass, setFetchedClass] = useState<UpdateClassData | null>(
    null
  );
  const [fetchedCourse, setFetchedCourse] = useState<UpdateClassData | null>(
    null
  );
  const [fetchedClassLoading, setFetchedClassLoading] = useState(false);
  const [fetchedCourseLoading, setFetchedCourseLoading] = useState(false);

  const [errors, setErrors] = useState({ title: "", description: "" });

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

  const theme = calendarTheme;

  const [classSesssions, setClassSessions] = useState<any>(null);
  const [classSessionsAll, setClassSessionsAll] = useState<any>(null);
  const [classSesssionsLoading, setClassSessionsLoading] = useState(false);

  const [datePickerModalVisible, setDatePickerModalVisible] = useState(false);
  const [workoutsModalVisible, setWorkoutsModalVisible] = useState(false);
  const [finalFormVisible, setFinalFormVisible] = useState(false);
  const [timePatternModalVisible, setTimePatternModalVisible] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(
    moment().format("YYYY-MM-DD")
  );

  const [workoutTitle, setWorkoutTitle] = useState("");
  const [duration, setDuration] = useState({ hours: 1, minutes: 0 });
  const [durationPickerVisible, setDurationPickerVisible] = useState(false);
  const [description, setDescription] = useState("");
  const [repeatPattern, setRepeatPattern] = useState("never");
  const [alertState, setAlertState] = useState("15");
  const [tempAlertState, setTempAlertState] = useState(alertState);
  const [workouts, setWorkouts] = useState<Exercise[] | null>(null);
  const [workoutClients, setWorkoutClients] = useState<string[]>([]);
  const [workoutIsCourse, setWorkoutIsCourse] = useState(false);
  const [selectedWorkoutCourse, setSelectedWorkoutCourse] = useState("");
  const [tempSelectedCourse, setTempSelectedCourse] = useState(
    selectedWorkoutCourse
  );
  const [selectedCourseDates, setSelectedCourseDates] = useState<{
    [date: string]: string;
  }>({});

  const [firstFormVisible, setFirstFormVisible] = useState(false);
  const [editFormVisible, setEditFormVisible] = useState(false);
  const [editCourseFormVisible, setEditCourseFormVisible] = useState(false);

  const [intensity, setIntensity] = useState("low");
  const [gender, setGender] = useState("male");
  const [bodyPart, setBodyPart] = useState("arms");
  const [calendarView, setCalendarView] = useState<CalendarView>("agenda");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [dateInterval, setDateInterval] = useState<number | null>(null);
  const [untilDate, setUntilDate] = useState<Date | null>(null);

  const [location, setLocation] = useState("");

  const END_TIME = new Date();
  END_TIME.setHours(new Date().getHours() + 1);

  const { fetchCourses, courses, loading: coursesLoading } = useCourses();

  const [startTime, setStartTime] = useState<Date | null>(new Date());
  const [endTime, setEndTime] = useState<Date | null>(new Date(0, 0, 0, 1, 0));

  const [startTimeVisible, setStartTimeVisible] = useState<boolean>(false);

  const fetchClients = async () => {
    try {
      setClientsLoading(true);
      const result = await getAllClients();

      setClients(result);
    } catch (error) {
    } finally {
      setClientsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchCourses();
  }, []);

  const dropdownAnimation = useRef(new Animated.Value(0)).current;

  const resetFields = () => {
    setWorkoutTitle("");
    setDescription("");
    setWorkoutIsCourse(false);
    setSelectedWorkoutCourse("");
    setSelectedCourseDates({});
    setWorkoutClients([]);
    setErrors({
      title: "",
      description: "",
    });
  };

  const handleAddWorkout = () => {
    if (!selectedDate) return;
    setFirstFormVisible(true);
  };

  const handleCloseOverlays = () => {
    setFinalFormVisible(false);
    setIsFilterOpen(false);
    setEditFormVisible(false);
    // setTimeout(() => {
    setWorkoutsModalVisible(false);
    // setTimeout(() => {
    setFirstFormVisible(false);
    // }, 1);
    // }, 1);
  };

  const fetchClassSessions = async () => {
    setClassSessionsLoading(true);
    try {
      const result = await getUserClassSessions();

      if (result) {
        const formattedResult = [
          ...result?.class_sessions?.map((item: any) => {
            return {
              start: item.start,
              end: item.end,
              title: item.class_header?.name,
              summary: item.class_header?.description,
              color: "#eaf4f3",
              id: item.class_header?.id,
              members: item.class_header?.members,
              isCourse: false,
            };
          }),
          ...result?.course_sessions?.map((item: any) => {
            return {
              start: item.start,
              end: item.end,
              title: item.session_title,
              summary: item.session_description,
              color: "#eaf4f3",
              id: item?.id,
              members: item?.members,
              isCourse: true,
            };
          }),
        ].sort(
          (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
        );

        setClassSessions(formattedResult);
        setClassSessionsAll(formattedResult);
      } else {
        console.log("Failed to fetch Class Sesssions");
      }
    } catch (err) {
      // setError("An error occurred while fetching classSesssions.");
      console.log(err);
    } finally {
      setClassSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchClassSessions();
  }, []);

  const eventsByDate = groupBy(classSesssions, (e) =>
    CalendarUtils.getCalendarDateString(e.start)
  ) as {
    [key: string]: TimelineEventProps[];
  };

  useEffect(() => {
    Animated.timing(dropdownAnimation, {
      toValue: isFilterOpen ? 1 : 0,
      useNativeDriver: true,
      duration: isFilterOpen ? 200 : 150,
    }).start();
  }, [isFilterOpen]);

  const handleOutsideClick = () => {
    if (isFilterOpen) {
      setIsFilterOpen(false);
    }
  };

  const handleDateChange = (date: string) => {
    const currentTime = new Date();

    const startTime = new Date(date);
    startTime.setHours(currentTime.getHours(), currentTime.getMinutes(), 0, 0);

    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);

    setSelectedDate(date);
    setStartTime(startTime);
    setEndTime(endTime);
  };

  const getCurrentViewOption = () => {
    return VIEW_OPTIONS.find((option) => option.value === calendarView);
  };

  const validateField = (field: "title" | "description", value: string) => {
    const newErrors = { ...errors };

    switch (field) {
      case "title":
        newErrors.title = value?.trim() ? "" : "Title is required.";
        break;
      case "description":
        newErrors.description = value?.trim() ? "" : "Description is required.";
        break;
      default:
        break;
    }

    setErrors(newErrors);
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { title: "", description: "" };

    // Validate Title
    if (!workoutTitle?.trim()) {
      newErrors.title = "Title is required.";
      isValid = false;
    }

    if (!description?.trim()) {
      newErrors.description = "Description is required.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const renderHeader = () => (
    <View
      style={{
        ...styles.header,
        backgroundColor: colorScheme === "dark" ? "#212121" : "#12a28d",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
        <Image
          source={require("@/assets/images/splash-logo.png")}
          style={styles.logoStyles}
        />
        <ThemedText
          type="subtitle"
          style={{ color: "#fff", paddingTop: 8, fontSize: 18 }}
        >
          Schedule
        </ThemedText>
      </View>

      <View style={styles.filterContainer}>
        <View style={{ position: "relative" }}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setIsFilterOpen((prevState) => !prevState)}
          >
            <Ionicons
              name={getCurrentViewOption()?.icon || "calendar"}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
          <Animated.View
            style={[
              styles.dropdownMenu,
              {
                opacity: dropdownAnimation,
                backgroundColor: mainColor,
                transform: isFilterOpen
                  ? [
                      {
                        scale: dropdownAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ]
                  : [],
                pointerEvents: isFilterOpen ? "auto" : "none",
              },
            ]}
          >
            {VIEW_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.dropdownItem}
                activeOpacity={0.7}
                onPress={() => {
                  setCalendarView(option.value);
                  setIsFilterOpen(false);
                }}
              >
                <View style={styles.dropdownItemTextContainer}>
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={
                      calendarView === option.value ? "#12a28d" : mainTextColor
                    }
                  />
                  <ThemedText
                    style={[
                      styles.dropdownItemText,
                      calendarView === option.value &&
                        styles.dropdownItemTextActive,
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                </View>
                <View style={styles.radioCircle}>
                  {calendarView === option.value && (
                    <View style={styles.radioCircleSelected} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </View>
        <TouchableOpacity
          onPress={() => {
            setShowFilterModal(true);
          }}
        >
          <Ionicons name="funnel-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  useEffect(() => {
    const filtered =
      selectedClientsFilterValues.length === 0
        ? classSessionsAll
        : classSessionsAll.filter((session: any) =>
            session.members?.some((member: any) => {
              return selectedClientsFilterValues
                ?.map((id) => Number(id))
                .includes(member.id);
            })
          );

    setClassSessions(filtered);
  }, [selectedClientsFilterValues]);

  const toggleClientSelectionFilters = (clientId: string) => {
    setSelectedClientsFilterValues((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  const toggleClientSelectionForm = (clientId: string) => {
    setWorkoutClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  const getAlertLabel = (value: string): string => {
    const option = alertOptions.find((item) => item.value === value);
    return option ? option.label : "";
  };

  const selectedCourse = courses.find(
    (c) => Number(c.id) === Number(selectedWorkoutCourse)
  );

  const handleCourseDayPress = (day: any) => {
    const dateStr = day.dateString;
    const now = new Date();
    const selectedDate = new Date(dateStr);

    if (dateStr in selectedCourseDates) {
      const updatedDates = { ...selectedCourseDates };
      delete updatedDates[dateStr];
      setSelectedCourseDates(updatedDates);
    } else {
      if (
        selectedCourse &&
        Object.keys(selectedCourseDates).length < selectedCourse.days.length
      ) {
        const isToday = moment(selectedDate).isSame(now, "day");
        const isFuture = moment(selectedDate).isAfter(now, "day");

        if (isToday || isFuture) {
          const timeStr = moment(now).format("HH:mm");
          setSelectedCourseDates((prev) => ({ ...prev, [dateStr]: timeStr }));
        }
      }
    }
  };

  const courseMarkedDates = Object.keys(selectedCourseDates).reduce(
    (acc, date) => {
      acc[date] = {
        selected: true,
        selectedColor: "#12a28d",
        selectedTextColor: "#fff",
      };
      return acc;
    },
    {} as {
      [date: string]: {
        selected: boolean;
        selectedColor: string;
        selectedTextColor: string;
      };
    }
  );

const submitCourse = async () => {
  // First check if a course is selected
  if (!selectedWorkoutCourse) {
    Alert.alert(
      "No Class Selected",
      "Please select a class before submitting."
    );
    return;
  }

  const now = new Date();
  let hasInvalidTime = false;

  // Validate all sessions
  const validationResults = await Promise.all(
    Object.entries(selectedCourseDates).map(async ([date, time], index) => {
      if (!time) {
        hasInvalidTime = true;
        Alert.alert(
          "Missing Time",
          `Please select a time for ${moment(date).format("DD.MM.YYYY.")}`
        );
        return { date, time, isValid: false };
      }

      const startDateTime = moment(`${date} ${time}`, "YYYY-MM-DD HH:mm");
      const isToday = startDateTime.isSame(now, "day");
      const isPastTime = startDateTime.isBefore(now);

      if (isToday && isPastTime) {
        hasInvalidTime = true;
        Alert.alert(
          "Invalid Time",
          `You can't schedule session for ${moment(date).format(
            "DD.MM.YYYY."
          )} at past time ${time}.`
        );
      }
      return { date, time, isValid: !(isToday && isPastTime) };
    })
  );

  // If any validation failed, abort submission
  if (hasInvalidTime || !selectedWorkoutCourse) {
    return;
  }

  // Proceed with creating valid sessions
  const formattedSessions = await Promise.all(
    Object.entries(selectedCourseDates).map(async ([date, time], index) => {
      const courseDay = selectedCourse.days[index];
      if (!courseDay) return null;

      const courseDayId = courseDay.id;
      const startDateTime = moment(`${date} ${time}`, "YYYY-MM-DD HH:mm");

      const totalDuration = courseDay.exercises.reduce(
        (acc: number, ex: any) =>
          acc + (ex.exercise?.duration_in_seconds || 0),
        0
      );
      const endDateTime = startDateTime.clone().add(totalDuration, "seconds");

      const alertTime = startDateTime.clone().subtract(30, "minutes");

      const notificationId = await scheduleNotification(
        alertTime.toDate(),
        "Upcoming Class Reminder",
        `Your class "${workoutTitle}" starts at ${startDateTime.format(
          "HH:mm"
        )}.`
      );

      // ISPRAVKA: Koristi moment().format() umesto .toISOString() da sačuvaš lokalnu vremensku zonu
      return {
        session_title: workoutTitle,
        session_description: description,
        notification_id: notificationId,
        start: startDateTime.format("YYYY-MM-DDTHH:mm:ss"), // Lokalno vreme bez timezone konverzije
        end: endDateTime.format("YYYY-MM-DDTHH:mm:ss"),     // Lokalno vreme bez timezone konverzije
        course_day_id: courseDayId,
        members: workoutClients,
        location_name: location,
        longitude: null,
        latitude: null,
      };
    })
  );

  console.log(formattedSessions);

  try {
    const createdCourse = await createCourseSessions(
      // @ts-ignore
      formattedSessions.filter(Boolean),
      setCourseSessionsCreateLoading
    );

    if (createdCourse) {
      handleCloseOverlays();
      fetchClassSessions();
      Toast.show({
        type: "success",
        text1: "Course sessions created successfully",
        position: "top",
      });
    }
  } catch (error) {
    console.log("error", error);
    Alert.alert(
      "Error",
      "Failed to create course sessions. Please try again."
    );
  }
};

  const durationReturnVal =
    workouts &&
    convertSeconds(
      workouts
        .map((e) => e.duration_in_seconds)
        .reduce((acc, num) => acc + num, 0)
    );

  const handleTimePicked = (time: Date) => {
    if (!selectedDate) return;

    const now = new Date();
    const selectedDay = new Date(selectedDate);

    const isToday = moment(selectedDay).isSame(now, "day");
    const isPastTime = moment(time).isBefore(moment());

    if (isToday && isPastTime) {
      setStartTimeVisible(false);
      Alert.alert("Invalid Time", "You can't select a past time for today.");
      return;
    }

    const formattedTime = moment(time).format("HH:mm");

    setSelectedCourseDates((prev) => ({
      ...prev,
      [selectedDate]: formattedTime,
    }));

    setStartTimeVisible(false);
  };

  const combineDateAndTime = (date: Date | string, time: Date): Date => {
    const base = moment(date);
    const hours = moment(time).hours();
    const minutes = moment(time).minutes();
    return base
      .hours(hours)
      .minutes(minutes)
      .seconds(0)
      .milliseconds(0)
      .toDate();
  };

  useEffect(() => {
    if (fetchedClass) {
      setWorkoutTitle(fetchedClass.name);
      setDescription(fetchedClass.description);
      setLocationName(fetchedClass?.location_name ?? "");
    } else {
      setWorkoutTitle("");
      setDescription("");
      setLocationName("");
    }
  }, [fetchedClass]);

  const renderForm = (finalFormVisible?: boolean, fetchedClass?: any) => {
    // if (fetchedClass) {
    //   setWorkoutTitle(fetchedClass.name);
    // } else {
    //   setWorkoutTitle("");
    // }

    return fetchedClassLoading ? (
      <ActivityIndicator
        size="large"
        style={{ marginTop: 40 }}
        color={"#12a28d"}
      />
    ) : (
      <View style={styles.formContainer}>
        {courses &&
          courses.length > 0 &&
          !finalFormVisible &&
          !fetchedClass && (
            <>
              <View
                style={{
                  marginTop: 5,
                  marginBottom: workoutIsCourse ? 5 : 15,
                  width: "100%",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  justifyContent: "flex-start",
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{ flexDirection: "row", gap: 4, alignItems: "center" }}
                  onPress={() => {
                    setWorkoutIsCourse((prevState) => !prevState);
                    if (workoutIsCourse) {
                      setSelectedWorkoutCourse("");
                      setSelectedCourseDates({});
                    }
                  }}
                >
                  <View style={styles.checkbox}>
                    <Ionicons
                      name={workoutIsCourse ? "checkbox" : "square-outline"}
                      size={24}
                      color={workoutIsCourse ? "#12a28d" : mainTextColor}
                    />
                  </View>
                  <ThemedText
                    type="subtitle"
                    style={{
                      fontSize: 15,
                      marginLeft: 6,
                      // lineHeight: 16,
                    }}
                  >
                    Is Class
                  </ThemedText>
                </TouchableOpacity>
              </View>
              {workoutIsCourse && !fetchedClass && (
                <View style={styles.inputWrapper}>
                  <ThemedText
                    style={{
                      ...styles.inputLabel,
                      color:
                        colorScheme === "dark"
                          ? "rgb(170, 170, 170)"
                          : "rgb(105, 105, 105)",
                    }}
                  >
                    Select Class
                  </ThemedText>
                  <View style={styles.iconWrapper}>
                    <Ionicons
                      name="clipboard-outline"
                      size={20}
                      color={mainTextColor}
                    />
                  </View>

                  {Platform.OS === "ios" ? (
                    <>
                      <TouchableWithoutFeedback
                        onPress={() => {
                          setTempSelectedCourse(selectedWorkoutCourse); // Initialize with current value

                          setTempSelectedCourse(
                            selectedWorkoutCourse || courses[0]?.id
                          );
                          setIosPickerVisible(true);
                        }}
                      >
                        <View
                          style={{
                            ...styles.pickerWrapper,
                            borderColor:
                              colorScheme === "dark"
                                ? "rgb(80, 80, 80)"
                                : "rgb(204, 204, 204)",
                          }}
                        >
                          <ThemedText
                            style={{
                              ...styles.pickerValue,
                              color: mainTextColor,
                            }}
                          >
                            {
                              courses.find(
                                (c) =>
                                  Number(c.id) === Number(selectedWorkoutCourse)
                              )?.title
                            }
                          </ThemedText>
                          <Ionicons
                            name="chevron-down-outline"
                            size={14}
                            color="#666"
                            style={styles.dropdownIcon}
                          />
                        </View>
                      </TouchableWithoutFeedback>
                      <Modal
                        isVisible={iosPickerVisible}
                        onBackdropPress={() => setIosPickerVisible(false)}
                        onBackButtonPress={() => setIosPickerVisible(false)} // za Android
                        animationIn="slideInUp"
                        animationOut="slideOutDown"
                        useNativeDriver
                        hideModalContentWhileAnimating
                      >
                        <View style={{ flex: 1, justifyContent: "flex-end" }}>
                          {/* Backdrop that closes on tap outside */}
                          <TouchableWithoutFeedback
                            onPress={() => setIosPickerVisible(false)}
                          >
                            <View style={{ flex: 1 }} />
                          </TouchableWithoutFeedback>

                          <View
                            style={{
                              backgroundColor:
                                colorScheme === "dark" ? "#000" : "#fff",
                              padding: 20,
                              paddingBottom: 40,
                            }}
                          >
                            <Picker
                              selectedValue={tempSelectedCourse}
                              onValueChange={(itemValue) => {
                                setTempSelectedCourse(itemValue); // Only update temp value
                              }}
                            >
                              {courses.map((option) => (
                                <Picker.Item
                                  key={option.id}
                                  label={option.title}
                                  value={option.id}
                                />
                              ))}
                            </Picker>
                            <Button
                              buttonStyle={{
                                backgroundColor: "#12a28d",
                              }}
                              onPress={() => {
                                // If there's only one course and no selection was made, use the first course
                                if (
                                  courses.length === 1 &&
                                  !tempSelectedCourse
                                ) {
                                  setSelectedWorkoutCourse(courses[0].id);
                                  setTempSelectedCourse(courses[0].id);
                                }
                                // If a course is already selected, keep it
                                else if (
                                  selectedWorkoutCourse &&
                                  !tempSelectedCourse
                                ) {
                                  // No change needed
                                }
                                // Otherwise use the temp selection
                                else {
                                  setSelectedWorkoutCourse(tempSelectedCourse);
                                }

                                setIosPickerVisible(false);
                              }}
                              text="Select"
                            />
                          </View>
                        </View>
                      </Modal>
                    </>
                  ) : (
                    <View
                      style={{
                        ...styles.pickerWrapper,
                        borderColor:
                          colorScheme === "dark"
                            ? "rgb(80, 80, 80)"
                            : "rgb(204, 204, 204)",
                      }}
                    >
                      <ThemedText
                        style={{
                          ...styles.pickerValue,
                          color: mainTextColor,
                        }}
                      >
                        {
                          courses.find(
                            (c) =>
                              Number(c.id) === Number(selectedWorkoutCourse)
                          )?.title
                        }
                      </ThemedText>
                      <Picker
                        selectedValue={selectedWorkoutCourse}
                        onValueChange={setSelectedWorkoutCourse}
                        enabled={!finalFormVisible}
                        style={[
                          styles.picker,
                          {
                            fontSize: 10,
                            opacity: 0,
                          },
                        ]}
                      >
                        {courses.map((option) => (
                          <Picker.Item
                            key={option.id}
                            label={option.title}
                            value={option.id}
                          />
                        ))}
                      </Picker>
                      {!finalFormVisible && (
                        <Ionicons
                          name="chevron-down-outline"
                          size={14}
                          color="#666"
                          style={styles.dropdownIcon}
                        />
                      )}
                    </View>
                  )}
                </View>
              )}
              {workoutIsCourse && selectedWorkoutCourse && (
                <View
                  style={[
                    { width: "100%", marginBottom: 20 },
                    !(workoutIsCourse && selectedWorkoutCourse) && {
                      height: 0,
                      opacity: 0,
                    },
                  ]}
                  key={colorScheme}
                >
                  <Calendar
                    onDayPress={handleCourseDayPress}
                    markedDates={courseMarkedDates}
                    theme={{
                      ...calendarTheme,
                    }}
                    enableSwipeMonths
                    current={selectedDate ?? ""}
                    minDate={new Date().toISOString().split("T")[0]} // disables past dates
                    style={
                      workoutIsCourse && selectedWorkoutCourse
                        ? { height: 300 }
                        : { height: 0 }
                    }
                  />
                  <ThemedText
                    type="smallest"
                    style={{
                      color: "#12a28d",
                    }}
                  >
                    {selectedCourse &&
                      selectedCourse.days &&
                      `Select ${selectedCourse?.days?.length} date${
                        selectedCourse?.days > 1 ? "s" : ""
                      } (${Object.keys(selectedCourseDates).length} selected)`}
                  </ThemedText>
                </View>
              )}
            </>
          )}
        {workoutIsCourse &&
          selectedCourse &&
          Object.keys(selectedCourseDates).length > 0 && (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                alignItems: "flex-start",
                width: "100%",
              }}
            >
              {Object.keys(selectedCourseDates)
                .sort() // sort dates for clarity
                .map((date) => (
                  <View
                    key={date}
                    style={{
                      ...styles.inputWrapper,
                      alignItems: "flex-end",
                      width: "50%",
                    }}
                  >
                    <View
                      style={{
                        ...styles.iconWrapper,
                        alignItems: "flex-start",
                        width: 70,
                      }}
                    >
                      <ThemedText
                        type="smallest"
                        style={
                          {
                            // color: "#000",
                          }
                        }
                      >
                        {moment(date).format("DD.MM.YYYY.")}
                      </ThemedText>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={{
                        ...styles.input,
                        width: "auto",
                        flexGrow: 0,
                        marginRight: "auto",
                        marginLeft: 0,
                        height: 34,
                        minWidth: "20%",
                      }}
                      // placeholder="Enter start time"
                      // value={selectedCourseDates[date]}
                      onPress={() => {
                        setSelectedDate(date);
                        setStartTimeVisible(true);
                      }}
                      // onChangeText={(text) =>
                      //   setSelectedCourseDates((prev) => ({
                      //     ...prev,
                      //     [date]: text,
                      //   }))
                      // }
                    >
                      <TextInput
                        style={{
                          ...styles.timeInput,
                          paddingBottom: 4,
                          marginHorizontal: "auto",
                          borderColor:
                            colorScheme === "dark"
                              ? "rgb(80, 80, 80)"
                              : "rgb(204, 204, 204)",
                          color: mainTextColor,
                          pointerEvents: "none",
                        }}
                        placeholder="Date"
                        placeholderTextColor={
                          colorScheme === "dark"
                            ? "rgb(170, 170, 170)"
                            : "rgb(105, 105, 105)"
                        }
                        value={selectedCourseDates[date] || ""}
                        editable={false}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          )}
        {startTimeVisible &&
          (Platform.OS === "ios" ? (
            <Modal
              isVisible={startTimeVisible}
              onBackdropPress={() => setStartTimeVisible(false)}
              onBackButtonPress={() => setStartTimeVisible(false)} // za Android
              animationIn="slideInUp"
              animationOut="slideOutDown"
              useNativeDriver
              hideModalContentWhileAnimating
              backdropOpacity={0.5}
              style={{ margin: 0 }} // modal full screen bez margina
            >
              <TouchableWithoutFeedback
                onPress={() => setStartTimeVisible(false)}
              >
                <View style={{ flex: 1 }} />
              </TouchableWithoutFeedback>
              <View
                style={{
                  ...styles.iosTimePickerContainer,
                  backgroundColor: mainColor,
                }}
              >
                <View style={styles.iosTimePickerHeader}>
                  <TouchableOpacity
                    onPress={() => setStartTimeVisible(false)}
                    style={styles.iosTimePickerButton}
                  >
                    <ThemedText style={styles.iosTimePickerButtonText}>
                      Cancel
                    </ThemedText>
                  </TouchableOpacity>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity
                    onPress={() => {
                      const now = new Date();
                      const selectedDay =
                        selectedDate && new Date(selectedDate);
                      const isToday = moment(selectedDay).isSame(now, "day");
                      const isPastTime = moment(iosSelectedTime).isBefore(
                        moment()
                      );

                      if (isToday && isPastTime) {
                        Alert.alert(
                          "Invalid Time",
                          "You can't select a past time for today."
                        );
                        return;
                      }

                      const formattedTime =
                        moment(iosSelectedTime).format("HH:mm");

                      if (workoutIsCourse && selectedDate) {
                        setSelectedCourseDates((prev) => ({
                          ...prev,
                          [selectedDate]: formattedTime,
                        }));
                      } else {
                        if (selectedDate) {
                          const combined = combineDateAndTime(
                            selectedDate,
                            iosSelectedTime
                          );
                          setStartTime(combined);
                        }
                      }

                      setStartTimeVisible(false);
                    }}
                    style={styles.iosTimePickerButton}
                  >
                    <ThemedText style={styles.iosTimePickerButtonText}>
                      Done
                    </ThemedText>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  mode="time"
                  display="spinner"
                  value={
                    selectedDate && selectedCourseDates[selectedDate]
                      ? moment(
                          selectedCourseDates[selectedDate],
                          "HH:mm"
                        ).toDate()
                      : iosSelectedTime // Use the iOS-specific state
                  }
                  onChange={(event, time) => {
                    if (time) setIosSelectedTime(time); // Update temporary state
                  }}
                />
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              mode="time"
              display="spinner"
              value={
                selectedDate && selectedCourseDates[selectedDate]
                  ? moment(selectedCourseDates[selectedDate], "HH:mm").toDate()
                  : new Date()
              }
              onChange={(event, selectedTime) => {
                if (event.type === "dismissed") {
                  setStartTimeVisible(false);
                  return;
                }

                if (selectedTime) {
                  const now = new Date();
                  const selectedDay = selectedDate && new Date(selectedDate);
                  const isToday = moment(selectedDay).isSame(now, "day");
                  const isPastTime = moment(selectedTime).isBefore(moment());

                  if (isToday && isPastTime) {
                    Alert.alert(
                      "Invalid Time",
                      "You can't select a past time for today."
                    );
                    return;
                  }

                  const formattedTime = moment(selectedTime).format("HH:mm");

                  if (workoutIsCourse && selectedDate) {
                    setSelectedCourseDates((prev) => ({
                      ...prev,
                      [selectedDate]: formattedTime,
                    }));
                  } else {
                    if (selectedDate) {
                      const combined = combineDateAndTime(
                        selectedDate,
                        selectedTime
                      );
                      setStartTime(combined);
                    }
                    // setStartTime(selectedTime);
                  }

                  setStartTimeVisible(false);
                }
              }}
            />
          ))}
        <View
          style={{
            ...styles.inputWrapper,
            marginBottom: workoutIsCourse ? 12 : 0,
          }}
        >
          <View style={styles.iconWrapper}>
            <View style={styles.circleIcon} />
          </View>
          <TextInput
            style={{
              ...styles.input,
              borderColor:
                colorScheme === "dark"
                  ? "rgb(80, 80, 80)"
                  : "rgb(204, 204, 204)",
              color: mainTextColor,
            }}
            placeholder="Title"
            placeholderTextColor={
              colorScheme === "dark"
                ? "rgb(170, 170, 170)"
                : "rgb(105, 105, 105)"
            }
            value={workoutTitle}
            onChangeText={(text) => {
              setWorkoutTitle(text);
              validateField("title", text);
            }}
            editable={!finalFormVisible}
          />
          {errors.title ? (
            <ThemedText style={styles.errorText}>{errors.title}</ThemedText>
          ) : null}
        </View>
        {!workoutIsCourse && !fetchedClass && (
          <View
            style={{
              ...styles.timeInputWrapper,
              borderColor:
                colorScheme === "dark"
                  ? "rgb(80, 80, 80)"
                  : "rgb(204, 204, 204)",
            }}
          >
            <View style={styles.iconWrapper}>
              <Ionicons name="time-outline" size={20} color={mainTextColor} />
            </View>
            <View
              style={{
                ...styles.timeInputsContainer,
                borderColor:
                  colorScheme === "dark"
                    ? "rgb(80, 80, 80)"
                    : "rgb(204, 204, 204)",
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  !finalFormVisible && setStartTimeVisible(true);
                }}
                style={{
                  ...styles.timeInputContainer,
                  borderRightWidth: 1,
                  borderColor:
                    colorScheme === "dark"
                      ? "rgb(80, 80, 80)"
                      : "rgb(204, 204, 204)",
                }}
                activeOpacity={!finalFormVisible ? 0.7 : 1}
              >
                <ThemedText
                  style={{
                    color:
                      colorScheme === "dark"
                        ? "rgb(170, 170, 170)"
                        : "rgb(105, 105, 105)",
                    fontSize: 12,
                    lineHeight: 14,
                  }}
                >
                  Start Time
                </ThemedText>
                <TextInput
                  style={{
                    ...styles.timeInput,
                    color: mainTextColor,
                    pointerEvents: "none",
                  }}
                  placeholder="Date"
                  placeholderTextColor={
                    colorScheme === "dark"
                      ? "rgb(170, 170, 170)"
                      : "rgb(105, 105, 105)"
                  }
                  value={moment(startTime).format("ddd, MMM D, HH:mm")}
                  editable={false}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  !finalFormVisible && setDurationPickerVisible(true);
                }}
                style={{
                  ...styles.timeInputContainer,
                  paddingLeft: 10,
                }}
                activeOpacity={!finalFormVisible ? 0.7 : 1}
              >
                <ThemedText
                  style={{
                    fontSize: 12,
                    lineHeight: 14,
                    color:
                      colorScheme === "dark"
                        ? "rgb(170, 170, 170)"
                        : "rgb(105, 105, 105)",
                  }}
                >
                  Duration (HH:MM)
                </ThemedText>

                <TextInput
                  style={{
                    ...styles.timeInput,
                    color: mainTextColor,
                    pointerEvents: "none",
                  }}
                  placeholder="Time"
                  placeholderTextColor={
                    colorScheme === "dark"
                      ? "rgb(170, 170, 170)"
                      : "rgb(105, 105, 105)"
                  }
                  value={`${String(duration.hours).padStart(2, "0")}:${String(
                    duration.minutes
                  ).padStart(2, "0")}`}
                  editable={false}
                />
              </TouchableOpacity>
              {durationPickerVisible && (
                <DurationModal
                  isVisible={durationPickerVisible}
                  onClose={() => {
                    setDurationPickerVisible(false);
                  }}
                  onSubmit={(totalMinutes: any) => {
                    setDurationPickerVisible(false);

                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = totalMinutes % 60;
                    setDuration({ hours, minutes });
                  }}
                  duration={duration}
                />
              )}
            </View>
          </View>
        )}
        <View style={styles.inputWrapper}>
          <View style={styles.iconWrapper}>
            <Ionicons
              name="document-text-outline"
              size={20}
              color={mainTextColor}
            />
          </View>
          <TextInput
            style={{
              ...styles.input,
              borderColor:
                colorScheme === "dark"
                  ? "rgb(80, 80, 80)"
                  : "rgb(204, 204, 204)",
              color: mainTextColor,
            }}
            placeholder="Description"
            placeholderTextColor={
              colorScheme === "dark"
                ? "rgb(170, 170, 170)"
                : "rgb(105, 105, 105)"
            }
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              validateField("description", text);
            }}
            multiline
            numberOfLines={4}
            editable={!finalFormVisible}
          />
          {errors.description ? (
            <ThemedText style={styles.errorText}>
              {errors.description}
            </ThemedText>
          ) : null}
        </View>
        {!workoutIsCourse && !fetchedClass && (
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() => {
              !finalFormVisible && setTimePatternModalVisible(true);
            }}
            activeOpacity={!finalFormVisible ? 0.7 : 1}
          >
            <ThemedText
              style={{
                ...styles.inputLabel,
                color:
                  colorScheme === "dark"
                    ? "rgb(170, 170, 170)"
                    : "rgb(105, 105, 105)",
              }}
            >
              Repeat
            </ThemedText>
            <View style={styles.iconWrapper}>
              <Ionicons name="repeat-outline" size={20} color={mainTextColor} />
            </View>
            <View
              style={{
                ...styles.pickerWrapper,
                borderColor:
                  colorScheme === "dark"
                    ? "rgb(80, 80, 80)"
                    : "rgb(204, 204, 204)",
              }}
            >
              <ThemedText
                style={{
                  ...styles.pickerValue,
                  color: mainTextColor,
                }}
              >
                {repeatPattern}
              </ThemedText>
              <Picker
                selectedValue={repeatPattern}
                onValueChange={setRepeatPattern}
                enabled={false}
                style={[
                  styles.picker,
                  {
                    fontSize: 10,
                    opacity: 0,
                  },
                ]}
              >
                <Picker.Item label="Never" value="never" />
                <Picker.Item label="Daily" value="daily" />
                <Picker.Item label="Weekly" value="weekly" />
                <Picker.Item label="Monthly" value="monthly" />
              </Picker>
              {!finalFormVisible && (
                <Ionicons
                  name="chevron-down-outline"
                  size={14}
                  color="#666"
                  style={styles.dropdownIcon}
                />
              )}
            </View>
          </TouchableOpacity>
        )}
        {!fetchedClass && (
          <View style={styles.inputWrapper}>
            <ThemedText
              style={{
                ...styles.inputLabel,
                color:
                  colorScheme === "dark"
                    ? "rgb(170, 170, 170)"
                    : "rgb(105, 105, 105)",
              }}
            >
              Alert
            </ThemedText>
            <View style={styles.iconWrapper}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={mainTextColor}
              />
            </View>

            {Platform.OS === "ios" ? (
              <>
                <TouchableWithoutFeedback
                  disabled={finalFormVisible}
                  onPress={() => {
                    setTempAlertState(alertState); // Initialize with current value
                    setIosAlertPickerVisible(true);
                  }}
                >
                  <View
                    style={{
                      ...styles.pickerWrapper,
                      borderColor:
                        colorScheme === "dark"
                          ? "rgb(80, 80, 80)"
                          : "rgb(204, 204, 204)",
                    }}
                  >
                    <ThemedText
                      style={{
                        ...styles.pickerValue,
                        color: mainTextColor,
                      }}
                    >
                      {getAlertLabel(alertState)}
                    </ThemedText>
                    <Ionicons
                      name="chevron-down-outline"
                      size={14}
                      color="#666"
                      style={styles.dropdownIcon}
                    />
                  </View>
                </TouchableWithoutFeedback>

                <Modal
                  isVisible={iosAlertPickerVisible}
                  onBackdropPress={() => setIosAlertPickerVisible(false)}
                  onBackButtonPress={() => setIosAlertPickerVisible(false)}
                  animationIn="slideInUp"
                  animationOut="slideOutDown"
                  useNativeDriver
                  hideModalContentWhileAnimating
                  backdropOpacity={0.5}
                  style={{ margin: 0 }}
                >
                  <View style={{ flex: 1, justifyContent: "flex-end" }}>
                    {/* Backdrop that closes on tap outside */}
                    <TouchableWithoutFeedback
                      onPress={() => setIosAlertPickerVisible(false)}
                    >
                      <View style={{ flex: 1 }} />
                    </TouchableWithoutFeedback>

                    <View
                      style={{
                        backgroundColor:
                          colorScheme === "dark" ? "#000" : "#fff",
                        padding: 20,
                      }}
                    >
                      <Picker
                        selectedValue={tempAlertState}
                        onValueChange={(itemValue) => {
                          setTempAlertState(itemValue); // Only update temp value
                        }}
                      >
                        {alertOptions.map((option) => (
                          <Picker.Item
                            key={option.value}
                            label={option.label}
                            value={option.value}
                          />
                        ))}
                      </Picker>

                      <Button
                        buttonStyle={{
                          backgroundColor: "#12a28d",
                        }}
                        onPress={() => {
                          setAlertState(tempAlertState);
                          setIosAlertPickerVisible(false);
                        }}
                        text="Select"
                      />
                    </View>
                  </View>
                </Modal>
              </>
            ) : (
              <View
                style={{
                  ...styles.pickerWrapper,
                  borderColor:
                    colorScheme === "dark"
                      ? "rgb(80, 80, 80)"
                      : "rgb(204, 204, 204)",
                }}
              >
                <ThemedText
                  style={{
                    ...styles.pickerValue,
                    color: mainTextColor,
                  }}
                >
                  {getAlertLabel(alertState)}
                </ThemedText>
                <Picker
                  selectedValue={alertState}
                  onValueChange={setAlertState}
                  enabled={!finalFormVisible}
                  style={[
                    styles.picker,
                    {
                      fontSize: 10,
                      opacity: 0.0001,
                    },
                  ]}
                >
                  {alertOptions.map((option) => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                    />
                  ))}
                </Picker>
                {!finalFormVisible && (
                  <Ionicons
                    name="chevron-down-outline"
                    size={14}
                    color="#666"
                    style={styles.dropdownIcon}
                  />
                )}
              </View>
            )}
          </View>
        )}
        {!fetchedClass && (
          <LocationInput
            editable={!finalFormVisible}
            location={locationName}
            setLocation={(value) => setLocationName(value)}
          />
        )}

        {finalFormVisible
          ? clients &&
            clients.length && (
              <View style={{ marginTop: 25, marginRight: "auto" }}>
                <ThemedText
                  type="subtitle"
                  style={{
                    marginBottom: 8,
                    fontSize: 14,
                  }}
                >
                  Clients
                </ThemedText>
                <View
                  style={{
                    flexDirection: "row",
                    rowGap: 15,
                    marginBottom: 20,
                    flexWrap: "wrap",
                    alignItems: "flex-start",
                    columnGap: 20,
                  }}
                >
                  {clients?.map((client) => {
                    return finalFormVisible ? (
                      workoutClients?.includes(String(client.id)) && (
                        <View
                          key={client.id}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {client.profile_image ? (
                            <Image
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 9999,
                              }}
                              source={
                                // @ts-ignore
                                { uri: client.profile_image?.file_path }
                              }
                            />
                          ) : (
                            <Ionicons name="person" size={22} color="#12a28d" />
                          )}
                          <ThemedText
                            style={{
                              textTransform: "capitalize",
                              fontSize: 12,
                            }}
                          >
                            {client.first_name} {client.last_name}
                          </ThemedText>
                        </View>
                      )
                    ) : (
                      <View
                        key={client.id}
                        style={{ flexDirection: "row", gap: 4, width: "50%" }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {client.profile_image ? (
                            <Image
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 9999,
                              }}
                              source={
                                // @ts-ignore
                                { uri: client.profile_image?.file_path }
                              }
                            />
                          ) : (
                            <Ionicons name="person" size={22} color="#12a28d" />
                          )}
                          <ThemedText
                            style={{
                              textTransform: "capitalize",
                              fontSize: 12,
                            }}
                          >
                            {client.first_name} {client.last_name}
                          </ThemedText>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )
          : clients &&
            clients.length > 0 && (
              <View
                style={{
                  marginTop: 25,
                  marginRight: "auto",
                  marginBottom: 25,
                }}
              >
                <ThemedText
                  type="subtitle"
                  style={{
                    marginBottom: 8,
                    fontSize: 14,
                  }}
                >
                  Clients
                </ThemedText>
                <View
                  style={{
                    flexDirection: "row",
                    rowGap: 20,
                    marginBottom: 20,
                    flexWrap: "wrap",
                    alignItems: "flex-start",
                  }}
                >
                  {clients?.map((client) => {
                    return finalFormVisible ? (
                      workoutClients?.includes(String(client.id)) && (
                        <View
                          key={client.id}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {client.profile_image ? (
                            <Image
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 9999,
                              }}
                              source={
                                // @ts-ignore
                                { uri: client.profile_image?.file_path }
                              }
                            />
                          ) : (
                            <Ionicons name="person" size={22} color="#12a28d" />
                          )}
                          <ThemedText
                            style={{
                              textTransform: "capitalize",
                              fontSize: 12,
                            }}
                          >
                            {client.first_name} {client.last_name}
                          </ThemedText>
                        </View>
                      )
                    ) : (
                      <TouchableOpacity
                        key={client.id}
                        activeOpacity={0.7}
                        style={{ flexDirection: "row", gap: 4, width: "50%" }}
                        onPress={() =>
                          toggleClientSelectionForm(String(client.id))
                        }
                      >
                        <View style={styles.checkbox}>
                          <Ionicons
                            name={
                              workoutClients?.includes(String(client.id))
                                ? "checkbox"
                                : "square-outline"
                            }
                            size={24}
                            color={
                              workoutClients?.includes(String(client.id))
                                ? "#12a28d"
                                : mainTextColor
                            }
                          />
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {client.profile_image ? (
                            <Image
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 9999,
                              }}
                              source={
                                // @ts-ignore
                                { uri: client.profile_image?.file_path }
                              }
                            />
                          ) : (
                            <Ionicons name="person" size={22} color="#12a28d" />
                          )}
                          <View style={{ flex: 1, flexWrap: "wrap" }}>
                            <ThemedText
                              style={{
                                textTransform: "capitalize",
                                fontSize: 12,
                              }}
                            >
                              {client.first_name} {client.last_name}
                            </ThemedText>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

        {finalFormVisible && workouts && workouts.length > 0 && (
          <View style={{ width: "100%", marginTop: 20 }}>
            <ThemedText
              type="subtitle"
              style={{ marginBottom: 8, fontSize: 14 }}
            >
              Selected Exercises
            </ThemedText>
            <ThemedText
              type="smallest"
              style={{
                paddingRight: 10,
                paddingBottom: 5,
                textAlign: "right",
              }}
            >
              Total Duration:{" "}
              {durationReturnVal && durationReturnVal?.hours > 0
                ? ` ${durationReturnVal?.hours}h`
                : ""}
              {durationReturnVal && durationReturnVal?.minutes > 0
                ? ` ${durationReturnVal?.minutes}min`
                : ""}
              {durationReturnVal && durationReturnVal?.seconds > 0
                ? ` ${durationReturnVal?.seconds}sec`
                : ""}
            </ThemedText>
            <View
              style={{
                maxHeight: workouts.length * 180,
                // pointerEvents: isDragEnabled ? "auto" : "none"
              }}
            >
              <DraggableFlatList
                dragHitSlop={{ top: -10, left: -10 }}
                // dragHitSlop={{ right: -(300 * 0.95 - 20) }}
                key={`${finalFormVisible}`}
                data={workouts}
                renderItem={renderSelectedExercise}
                keyExtractor={(item) => item.id.toString()}
                dragItemOverflow={true}
                scrollEnabled={true}
                onDragEnd={({ data }) => {
                  setWorkouts((prevState) => {
                    const newOrderMap = new Map(
                      data.map((exercise, index) => [exercise.id, index])
                    );

                    const newFullList =
                      prevState &&
                      [...prevState].sort((a, b) => {
                        const indexA =
                          newOrderMap.get(a.id) ?? workouts.indexOf(a);
                        const indexB =
                          newOrderMap.get(b.id) ?? workouts.indexOf(b);
                        return indexA - indexB;
                      });

                    return newFullList;
                  });
                }}
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderSelectedExercise = ({
    item,
    drag,
    isActive,
    shorter,
    day,
  }: any) => {
    const thumbnailImage =
      item.images?.find((img: any) => img.id === item.thumbnail_image)
        ?.file_path ?? item?.images?.[0]?.file_path;

    return (
      <TouchableOpacity
        style={[
          styles.workoutWrapper,
          {
            backgroundColor: isActive
              ? colorScheme === "dark"
                ? "#07584c"
                : "#dbf2ee"
              : colorScheme === "dark"
              ? "#000"
              : "#fff",
            paddingRight: 40,
            marginBottom: shorter ? 10 : 15,
            borderColor:
              colorScheme === "dark"
                ? "rgba(100, 100, 100, 1)"
                : "rgb(233, 233, 233)",
            shadowColor: colorScheme === "dark" ? "#fff" : "#393939",
            elevation: colorScheme === "dark" ? 2 : 1.1,
          },
        ]}
        activeOpacity={0.8}
        onLongPress={(e) => {
          drag(e);
        }}
      >
        <View
          style={{
            position: "absolute",
            top: "50%",
            right: -17,
            transform: "translate(0, -50%)",
            padding: 20,
          }}
        >
          <Ionicons
            name="reorder-four-outline"
            size={24}
            color={colorScheme === "dark" ? "#777" : "#555"}
          />
        </View>
        <View style={styles.workoutImageWrapper}>
          <Image
            source={
              thumbnailImage
                ? { uri: thumbnailImage }
                : require("@/assets/images/splash-logo.png")
            }
            style={styles.workoutImage}
          />
        </View>
        <View style={styles.workoutInfo}>
          <ThemedText
            type="smaller"
            style={{
              fontFamily: "Default-Medium",
            }}
          >
            {item.name}
          </ThemedText>
          <View
            style={{
              marginTop: 6,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Ionicons name="time-outline" size={18} color={mainTextColor} />
            <ThemedText
              type="smaller"
              style={{
                fontSize: 12,
                lineHeight: 15,
              }}
            >
              {convertSeconds(Number(item?.duration_in_seconds)).hours > 0
                ? ` ${
                    convertSeconds(Number(item?.duration_in_seconds)).hours
                  } h`
                : ""}
              {convertSeconds(Number(item?.duration_in_seconds)).minutes > 0
                ? ` ${
                    convertSeconds(Number(item?.duration_in_seconds)).minutes
                  } min`
                : ""}
              {convertSeconds(Number(item?.duration_in_seconds)).seconds > 0
                ? ` ${
                    convertSeconds(Number(item?.duration_in_seconds)).seconds
                  } sec`
                : ""}
            </ThemedText>
          </View>
          {/* {!shorter && (
            <View style={styles.tagsContainer}>
              {item.exercise_tags.map((tag: any, tagIndex: number) => (
                <View
                  key={tagIndex}
                  style={{
                    ...styles.tag,
                    backgroundColor:
                      colorScheme === "dark" ? "#15413c" : "#00ffe119",
                  }}
                >
                  <ThemedText
                    type="smaller"
                    style={{
                      ...styles.tagText,
                      color: colorScheme === "dark" ? "#e3e3e3" : "#000000",
                    }}
                  >
                    {tag.name}
                  </ThemedText>
                </View>
              ))}
            </View>
          )} */}
        </View>
      </TouchableOpacity>
    );
  };

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const eventDate = item.date;
      const startTime = moment(item.start).format("HH:mm");
      const duration = calculateDuration(item.start, item.end);
      const eventTitle = item.title;

      return (
        <View
          style={{
            ...styles.eventCard,
            backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
            borderBottomColor:
              colorScheme === "dark"
                ? "rgba(255, 255, 255, 0.15)"
                : "rgba(0, 0, 0, 0.1)",
          }}
        >
          <View style={styles.eventDetails}>
            <View style={styles.leftSide}>
              <ThemedText style={styles.timeText}>{startTime}</ThemedText>
              <ThemedText style={styles.durationText}>{duration}</ThemedText>
            </View>
            <View style={styles.rightSide}>
              <TouchableOpacity
                style={styles.editIconWrapper}
                onPress={async () => {
                  const { start } = item;
                  const currentDate = new Date();

                  if (currentDate > new Date(start)) {
                    setWorkoutsModalEditVisible(true);
                  } else {
                    if (item.isCourse) {
                      setEditCourseFormVisible(true);
                    } else {
                      setEditFormVisible(true);
                    }
                  }
                  if (item.isCourse) {
                    try {
                      const data = await getCourseSessionDetails(
                        Number(item.id),
                        setFetchedCourseLoading
                      );

                      setFetchedCourse(data);
                    } catch (error) {
                      console.log(error);
                    }
                  } else {
                    try {
                      setFetchedClassLoading(true);

                      const data = await getClassById(Number(item.id));

                      setWorkoutTitle(data?.name);
                      setDescription(data?.description);
                      // setStartTime(new Date(data.start));
                      setFetchedClass(data);
                    } catch (error) {
                      console.log(error);
                    } finally {
                      setFetchedClassLoading(false);
                    }
                  }
                }}
              >
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color="#12a28d"
                />
              </TouchableOpacity>
              <ThemedText style={styles.eventTitle}>{eventTitle}</ThemedText>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginLeft: "auto",
                }}
              >
                {item.members?.slice(0, 3).map((client: any, index: number) => (
                  <View key={index}>
                    {client.profile_image ? (
                      <Image
                        style={{ width: 20, height: 20, borderRadius: 9999 }}
                        source={
                          // @ts-ignore
                          { uri: client.profile_image?.file_path }
                        }
                      />
                    ) : (
                      <Ionicons name="person" size={20} color="#12a28d" />
                    )}
                  </View>
                ))}
                {item.members && item.members?.length > 3 && (
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 9999,
                      backgroundColor:
                        colorScheme === "dark" ? "#3d3d3d" : "#ccc",
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                      marginLeft: 4,
                    }}
                  >
                    <ThemedText
                      style={{
                        fontSize: 10,
                        lineHeight: 18,
                        color: colorScheme === "dark" ? "#e3e3e3" : "#fff",
                      }}
                    >
                      +{item.members && item.members?.length - 3}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      );
    },
    [colorScheme]
  );

  const transformEventsForAgenda = (eventsByDate: { [key: string]: any[] }) => {
    if (!selectedDate) return;

    if (!eventsByDate[selectedDate]) return [];

    return [
      {
        title: selectedDate,
        data: eventsByDate[selectedDate],
      },
    ];
  };

  // const transformEventsForAgenda = (eventsByDate: { [key: string]: any[] }) => {
  //   const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

  //   console.log({
  //     selectedDate
  //   })

  //   return Object.keys(eventsByDate)
  //     .filter((date) => date >= today)
  //     .map((date) => {
  //       const formattedDate = moment(date, moment.ISO_8601, true).format(
  //         "dddd, MMM D, YYYY"
  //       );
  //       return {
  //         title: date,
  //         data: eventsByDate[date],
  //       };
  //     });
  // };

  const renderAgenda = () => {
    const transformedEvents = transformEventsForAgenda(eventsByDate);

    const getMarkedDates = () => {
      const markedDates: Record<string, any> = {};

      Object.keys(eventsByDate).forEach((eventDate) => {
        markedDates[eventDate] = {
          marked: true,
          dotColor: "#12a28d",
          activeOpacity: 0,
        };
      });

      return markedDates;
    };

    return (
      <View style={{ flex: 1 }} key={colorScheme}>
        {classSesssionsLoading ? (
          <View style={{ paddingTop: 80 }}>
            <ActivityIndicator size={"large"} color={"#12a28d"} />
          </View>
        ) : (
          <CalendarProvider
            date={selectedDate ?? ""}
            onDateChanged={(date: string, updateSource: UpdateSources) => {
              if (updateSource === "dayPress" || updateSource === "listDrag") {
                handleDateChange(date);
              }
            }}
          >
            <Calendar
              enableSwipeMonths={true}
              firstDay={1}
              current={selectedDate ?? ""}
              theme={theme}
              markedDates={{
                ...getMarkedDates(),
                [selectedDate || ""]: {
                  selected: true,
                  marked: getMarkedDates()?.[selectedDate || ""],
                  selectedColor: "#12a28d",
                  selectedTextColor: "#fff",
                },
              }}
              onDayPress={(day: any) => {
                handleDateChange(day.dateString);
              }}
            />
            {transformedEvents && transformedEvents.length > 0 ? (
              <AgendaList
                sections={transformedEvents}
                renderItem={renderItem}
                sectionStyle={{
                  ...styles.section,
                  borderBottomColor:
                    colorScheme === "dark"
                      ? "rgba(255, 255, 255, 0.1)"
                      : "#e5e5e5",
                  borderTopColor:
                    colorScheme === "dark"
                      ? "rgba(255, 255, 255, 0.1)"
                      : "#e5e5e5",
                  backgroundColor:
                    colorScheme === "dark" ? "#171717" : "#f9f9f9",
                  // @ts-ignore
                  color: colorScheme === "dark" ? "#7c7c7c" : "#616161",
                }}
                dayFormat="MMM d, yyyy"
                onStartShouldSetResponder={() => true}
                style={{
                  marginBottom: 60,
                }}
              />
            ) : (
              !classSesssionsLoading && (
                <ThemedText
                  type="subtitle"
                  style={{
                    paddingLeft: 20,
                    fontSize: 18,
                    paddingTop: 20,
                  }}
                >
                  No workouts for selected date
                </ThemedText>
              )
            )}
          </CalendarProvider>
        )}
      </View>
    );
  };

  const getMarkedDates = () => {
    const marked: {
      [key: string]: {
        marked: boolean;
        dots: { key: string; color: string; selectedDotColor: string }[];
        selected?: boolean;
        selectedColor?: string;
        selectedTextColor?: string;
      };
    } = {};

    Object.keys(eventsByDate).forEach((date) => {
      marked[date] = {
        marked: true,
        dots: [{ key: "training", color: "#12a28d", selectedDotColor: "#fff" }],
        ...(selectedDate === date && {
          selected: true,
          selectedColor: "#12a28d",
          selectedTextColor: "#fff",
        }),
      };
    });

    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: "#12a28d",
        selectedTextColor: "#fff",
      };
    }

    return marked;
  };

  const renderMonth = () => {
    const markedDates = getMarkedDates();

    return (
      <View style={{ flex: 1 }} key={colorScheme}>
        {classSesssionsLoading ? (
          <View style={{ paddingTop: 80 }}>
            <ActivityIndicator size={"large"} color={"#12a28d"} />
          </View>
        ) : (
          <CalendarList
            current={selectedDate ?? ""}
            pastScrollRange={RANGE}
            futureScrollRange={RANGE}
            onDayPress={(day: any) => {
              handleDateChange(day.dateString);
              setCalendarView("day");
            }}
            markedDates={markedDates}
            animateScroll={false}
            theme={{
              ...calendarTheme,
              weekVerticalMargin: 0,
            }}
            calendarHeight={500}
            dayComponent={({ date, state, marking }) => (
              <MemoizedCustomDay
                date={date}
                state={state}
                marking={marking}
                events={eventsByDate[date?.dateString ?? ""] || []}
                onDayPress={() => {
                  handleDateChange(date?.dateString ?? "");
                  setCalendarView("day");
                }}
              />
            )}
          />
        )}
      </View>
    );
  };

  const renderDay = () => {
    const getMarkedDates = () => {
      const markedDates: Record<string, any> = {};

      Object.keys(eventsByDate).forEach((eventDate) => {
        markedDates[eventDate] = {
          marked: true,
          dotColor: "#12a28d",
        };
      });

      return markedDates;
    };

    return (
      <View style={{ flex: 1 }} key={String(colorScheme)}>
        {classSesssionsLoading ? (
          <View style={{ paddingTop: 80 }}>
            <ActivityIndicator size={"large"} color={"#12a28d"} />
          </View>
        ) : (
          <CalendarProvider
            date={selectedDate ?? ""}
            onDateChanged={(date: string, updateSource: UpdateSources) => {
              if (updateSource === "dayPress" || updateSource === "listDrag") {
                handleDateChange(date);
              } else {
                return;
              }
            }}
          >
            <ExpandableCalendar
              testID="calendars"
              firstDay={1}
              // theme={{
              //   arrowColor: "#12a28d",
              //   todayTextColor: "#12a28d",
              //   monthTextColor: "#12a28d",
              //   selectedDayBackgroundColor: "transparent",
              //   selectedDayTextColor: "#000",
              // }}
              theme={calendarTheme}
              markedDates={{
                ...getMarkedDates(),
                [selectedDate || ""]: {
                  selected: true,
                  marked: getMarkedDates()?.[selectedDate || ""],
                  selectedColor: "#12a28d",
                  selectedTextColor: "#fff",
                },
              }}
              pastScrollRange={12}
              futureScrollRange={0}
              onDayPress={(day: any) => handleDateChange(day.dateString)}
            />
            {classSesssions && classSesssions.length > 0 ? (
              <TimelineList
                events={eventsByDate}
                timelineProps={{
                  async onEventPress(item) {
                    const { start } = item;
                    const currentDate = new Date();

                    if (currentDate > new Date(start)) {
                      setWorkoutsModalEditVisible(true);
                    } else {
                      // @ts-ignore
                      if (item.isCourse) {
                        setEditCourseFormVisible(true);
                      } else {
                        setEditFormVisible(true);
                      }
                    }
                    // @ts-ignore
                    if (item.isCourse) {
                      try {
                        const data = await getCourseSessionDetails(
                          Number(item.id),
                          setFetchedCourseLoading
                        );

                        setFetchedCourse(data);
                      } catch (error) {
                        console.log(error);
                      }
                    } else {
                      try {
                        setFetchedClassLoading(true);

                        const data = await getClassById(Number(item.id));

                        setWorkoutTitle(data?.name);
                        setDescription(data?.description);
                        // setStartTime(new Date(data.start));
                        setFetchedClass(data);
                      } catch (error) {
                        console.log(error);
                      } finally {
                        setFetchedClassLoading(false);
                      }
                    }
                  },
                  theme: {
                    ...calendarTheme,
                    timelineContainer: {
                      marginBottom: 80,
                    },
                    verticalLine: {
                      backgroundColor:
                        colorScheme === "dark" ? "#424242" : "#ccc",
                    },
                    line: {
                      backgroundColor:
                        colorScheme === "dark" ? "#424242" : "#ccc",
                    },
                    event: {
                      // borderColor: colorScheme === "dark" ? "#424242" : "#ccc",
                      borderWidth: 0,
                    },
                  },
                  format24h: true,
                  start: 0,
                  end: 24,
                  overlapEventsSpacing: 8,
                  rightEdgeSpacing: 24,

                  renderEvent: (event: any) => (
                    <View
                      style={{
                        padding: 8,
                        position: "absolute",
                        inset: 0,
                        backgroundColor:
                          colorScheme === "dark" ? "#15413c" : "#00ffe119",
                      }}
                    >
                      <ThemedText
                        style={{
                          color: colorScheme === "dark" ? "#e3e3e3" : "#000000",
                          fontSize: 12,
                          lineHeight: 14,
                        }}
                      >
                        {event.title}
                      </ThemedText>

                      {event.location && (
                        <ThemedText style={{ marginTop: 2 }}>
                          {event.location}
                        </ThemedText>
                      )}
                    </View>
                  ),
                }}
                scrollToFirst
                initialTime={INITIAL_TIME}
              />
            ) : (
              !classSesssionsLoading && (
                <ThemedText
                  type="subtitle"
                  style={{
                    paddingLeft: 20,
                    fontSize: 18,
                    paddingTop: 20,
                  }}
                >
                  No Results
                </ThemedText>
              )
            )}
          </CalendarProvider>
        )}
      </View>
    );
  };

  const submitClass = async () => {
    if (!startTime || !alertState) {
      Alert.alert("Start time or alert state is missing");
      return;
    }

    const now = new Date();
    const isToday = moment(startTime).isSame(now, "day");
    const isPastTime = moment(startTime).isBefore(now);

    if (isToday && isPastTime) {
      Alert.alert("Invalid Time", "You can't schedule a class in the past.");
      return;
    }

    const generateDates = async (
      selectedDate: string,
      startTime: Date,
      endTime: Date,
      dateInterval: number,
      untilDate: Date,
      alertTime: Date
    ) => {
      const dates = [];
      let currentDate = moment(selectedDate);

      while (currentDate.toDate() <= untilDate) {
        const start_class = moment(currentDate)
          .set({
            hour: startTime.getHours(),
            minute: startTime.getMinutes(),
          })
          .format("YYYY-MM-DD HH:mm");

        const end_class = moment(currentDate)
          .set({
            hour: startTime.getHours(),
            minute: startTime.getMinutes(),
          })
          .add(duration.hours, "hours")
          .add(duration.minutes, "minutes")
          .format("YYYY-MM-DD HH:mm");

        const notificationId = await scheduleNotification(
          alertTime,
          "Upcoming Class Reminder",
          `Your class "${workoutTitle}" starts at ${moment(startTime).format(
            "HH:mm"
          )}.`
        );

        dates.push({ start_class, end_class, notification_id: notificationId });
        currentDate = currentDate.add(dateInterval, "days");
      }

      return dates;
    };

    let dates: ClassDate[] = [];

    const alertTime = new Date(
      startTime.getTime() - Number(alertState) * 60 * 1000
    );

    if (repeatPattern === "never") {
      const notificationId = await scheduleNotification(
        alertTime,
        "Upcoming Class Reminder",
        `Your class "${workoutTitle}" starts at ${moment(startTime).format(
          "HH:mm"
        )}.`
      );

      const end_class = moment(startTime)
        .add(duration.hours, "hours")
        .add(duration.minutes, "minutes")
        .format("YYYY-MM-DD HH:mm");

      dates = [
        {
          start_class: moment(startTime).format("YYYY-MM-DD HH:mm"),
          end_class,
          notification_id: notificationId,
        },
      ];
    } else {
      if (selectedDate && endTime && dateInterval && untilDate) {
        dates = await generateDates(
          selectedDate,
          startTime,
          endTime,
          dateInterval,
          untilDate,
          alertTime
        );
      }
    }

    const notificationId = await scheduleNotification(
      alertTime,
      "Upcoming Class Reminder",
      `Your class "${workoutTitle}" starts at ${moment(startTime).format(
        "HH:mm"
      )}.`
    );

    const dataToSend: CreateClassData = {
      name: workoutTitle,
      description: description,
      difficulty_level: "Beginner",
      class_type: 3,
      exercises: workouts?.map((workout) => workout.id) ?? [],
      location_name: null,
      latitude: null,
      longitude: null,
      dates: dates,
      notification_id: notificationId ? notificationId : null,
      members: workoutClients?.map((clientId) => Number(clientId)) ?? [],
    };

    setCreateClassLoading(true);

    try {
      const createdClass = await createClass(dataToSend);

      if (createdClass && startTime) {
        handleCloseOverlays();
        fetchClassSessions();
        Toast.show({
          type: "success",
          text1: "Workout created successfully!",
          position: "top",
        });
      }
    } catch (error) {
      console.log("error", error);
    } finally {
      setCreateClassLoading(false);
    }
  };

  return (
    <View
      style={{
        ...styles.safeArea,
        backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
      }}
    >
      {isFilterOpen && (
        <TouchableWithoutFeedback onPress={handleOutsideClick}>
          <View
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              top: 0,
              left: 0,
              zIndex: 100,
              flex: 1,
            }}
          />
        </TouchableWithoutFeedback>
      )}
      {!firstFormVisible && renderHeader()}
      {!firstFormVisible &&
        selectedDate &&
        !moment(selectedDate).isBefore(moment(), "day") && (
          <TouchableOpacity
            style={{
              ...styles.addButton,
            }}
            onPress={() => {
              handleAddWorkout();
              resetFields();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        )}
      {calendarView === "agenda" && renderAgenda()}
      {calendarView === "day" && renderDay()}
      {calendarView === "month" && renderMonth()}
      <Modal
        isVisible={showFilterModal}
        onBackdropPress={() => setShowFilterModal(false)}
        onBackButtonPress={() => setShowFilterModal(false)}
        useNativeDriver
        hideModalContentWhileAnimating
        backdropOpacity={0.5}
        style={{ margin: 0 }}
        statusBarTranslucent
      >
        {showFilterModal && (
          <TouchableWithoutFeedback onPress={() => setShowFilterModal(false)}>
            <View
              style={{
                ...styles.modalOverlay,
              }}
            />
          </TouchableWithoutFeedback>
        )}

        <View style={StyleSheet.absoluteFill}>
          <View style={styles.modalContainerFilters}>
            <View
              style={{
                ...styles.modalContent,
                backgroundColor: colorScheme === "dark" ? "#212121" : mainColor,
              }}
            >
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Ionicons
                  name="close-outline"
                  size={24}
                  color={mainTextColor}
                />
              </TouchableOpacity>

              <ScrollView contentContainerStyle={styles.scrollContent}>
                <View>
                  <ThemedText
                    type="subtitle"
                    style={{
                      marginBottom: 3,
                      fontSize: 14,
                    }}
                  >
                    Clients
                  </ThemedText>
                  <View
                    style={{
                      flexDirection: "row",
                      rowGap: 20,
                      marginBottom: 20,
                      flexWrap: "wrap",
                    }}
                  >
                    {clients?.map((client) => {
                      return (
                        <TouchableOpacity
                          key={client.id}
                          activeOpacity={0.7}
                          style={{ flexDirection: "row", gap: 4, width: "50%" }}
                          onPress={() =>
                            toggleClientSelectionFilters(String(client.id))
                          }
                        >
                          <View style={styles.checkbox}>
                            <Ionicons
                              name={
                                selectedClientsFilterValues.includes(
                                  String(client.id)
                                )
                                  ? "checkbox"
                                  : "square-outline"
                              }
                              size={24}
                              color={
                                selectedClientsFilterValues.includes(
                                  String(client.id)
                                )
                                  ? "#12a28d"
                                  : mainTextColor
                              }
                            />
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            {client.profile_image ? (
                              <Image
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: 9999,
                                }}
                                source={
                                  // @ts-ignore
                                  { uri: client.profile_image?.file_path }
                                }
                              />
                            ) : (
                              <Ionicons
                                name="person"
                                size={22}
                                color="#12a28d"
                              />
                            )}
                            <ThemedText
                              style={{
                                textTransform: "capitalize",
                                fontSize: 12,
                              }}
                            >
                              {client.first_name} {client.last_name}
                            </ThemedText>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        isVisible={firstFormVisible}
        onBackdropPress={() => {
          handleCloseOverlays();
          setWorkouts([]);
        }}
        onBackButtonPress={() => {
          handleCloseOverlays();
          setWorkouts([]);
        }}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        useNativeDriver
        hideModalContentWhileAnimating
        style={{ margin: 0 }}
        statusBarTranslucent
      >
        <View
          style={{ flex: 1, backgroundColor: mainColor, paddingBottom: 40 }}
        >
          <View
            style={{
              ...styles.overlayHeader,
              backgroundColor: colorScheme === "dark" ? "#15413c" : "#e6f7f5",
            }}
          >
            <TouchableOpacity
              onPress={() => {
                handleCloseOverlays();
                setWorkouts([]);
              }}
            >
              <Ionicons name="close-outline" size={28} color={mainTextColor} />
            </TouchableOpacity>
            <View style={styles.headerTextWrapper}>
              <View>
                <ThemedText type="title" style={styles.headerText}>
                  New Workout
                </ThemedText>
              </View>
            </View>
            {workoutIsCourse ? (
              <TouchableOpacity
                style={styles.successIcon}
                onPress={() => {
                  if (validateForm()) {
                    submitCourse();
                  }
                  // TODO submit course
                }}
              >
                {courseSessionsCreateLoading ? (
                  <ActivityIndicator size="small" color={"#12a28d"} />
                ) : (
                  <Ionicons name="checkmark" size={24} color={mainTextColor} />
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.successIcon}
                onPress={() => {
                  if (validateForm()) {
                    setWorkoutsModalVisible(true);
                  }
                }}
              >
                <Ionicons
                  name="arrow-forward-outline"
                  size={24}
                  color={mainTextColor}
                />
              </TouchableOpacity>
            )}
            
          </View>
          <View style={styles.overlayContent}>
            <FlatList
              data={[renderForm()]}
              renderItem={({ item }) => item}
              keyExtractor={(_, index) => index.toString()}
            />
            {/* <NestableScrollContainer>{renderForm()}</NestableScrollContainer> */}
          </View>
          <DatePickerModal
            isVisible={datePickerModalVisible}
            selectedDate={selectedDate ?? ""}
            onClose={() => {
              setDatePickerModalVisible(false);
            }}
            onSubmit={() => {}}
          />
          {workoutsModalVisible && (
            <WorkoutsModal
              isVisible={workoutsModalVisible}
              selectedDate={selectedDate ?? ""}
              summaryVisible={finalFormVisible}
              onClose={(workouts) => {
                setWorkoutsModalVisible(false);
                // @ts-ignore
                setWorkouts(workouts);
              }}
              onSubmit={(workouts) => {
                // setWorkoutsModalVisible(false);
                setFinalFormVisible(true);
                // @ts-ignore
                setWorkouts(workouts);
              }}
              workouts={workouts}
            >
              {finalFormVisible && (
                <Modal
                  isVisible={finalFormVisible}
                  onBackdropPress={handleCloseOverlays}
                  onBackButtonPress={handleCloseOverlays}
                  animationIn="slideInUp"
                  animationOut="slideOutDown"
                  useNativeDriver
                  hideModalContentWhileAnimating
                  backdropOpacity={0.5}
                  style={{ margin: 0, zIndex: 2 }}
                  statusBarTranslucent
                >
                  <View style={{ flex: 1, backgroundColor: mainColor }}>
                    <View
                      style={{
                        ...styles.overlayHeader,
                        backgroundColor:
                          colorScheme === "dark" ? "#15413c" : "#e6f7f5",
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => {
                          setFinalFormVisible(false);
                        }}
                      >
                        <Ionicons
                          name="arrow-back"
                          size={24}
                          color={mainTextColor}
                        />
                      </TouchableOpacity>
                      <View style={styles.headerTextWrapper}>
                        <View>
                          <ThemedText type="title" style={styles.headerText}>
                            Summary
                          </ThemedText>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={{
                          ...styles.successIcon,
                          zIndex: 50,
                          // left: -10,
                        }}
                        onPress={() => {
                          if (finalFormVisible) {
                            submitClass();
                            // setWorkoutsModalVisible(true);
                          } else {
                            if (validateForm()) {
                              setWorkoutsModalVisible(true);
                            }
                          }
                        }}
                      >
                        {createClassLoading ? (
                          <ActivityIndicator size="small" color={"#12a28d"} />
                        ) : (
                          <Ionicons
                            name="checkmark-outline"
                            size={24}
                            color={mainTextColor}
                          />
                        )}
                      </TouchableOpacity>
                    </View>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                      <FlatList
                        data={[renderForm(true)]}
                        renderItem={({ item }) => item}
                        keyExtractor={(_, index) => index.toString()}
                      />
                    </GestureHandlerRootView>
                    {/* <ScrollView style={styles.overlayContent}>
                {renderForm(true)}
              </ScrollView> */}
                    <Toast />
                  </View>
                </Modal>
              )}
            </WorkoutsModal>
          )}

          <TimePatternModal
            isVisible={timePatternModalVisible}
            selectedDate={selectedDate ?? ""}
            onClose={() => {
              setTimePatternModalVisible(false);
            }}
            onSubmit={(selectedPatternArg, intervalArg, untilDateArg) => {
              setTimePatternModalVisible(false);

              setRepeatPattern(selectedPatternArg);

              if (intervalArg) {
                setDateInterval(intervalArg);
              } else {
                setDateInterval(null);
              }

              if (untilDateArg) {
                setUntilDate(untilDateArg);
              } else {
                setUntilDate(null);
              }
            }}
          />
        </View>
        <Toast />
      </Modal>
      <WorkoutDisplayModal
        isVisible={workoutsModalEditVisible}
        onClose={() => {
          setWorkoutsModalEditVisible(false);
        }}
        fetchedClass={fetchedClass}
        classLoading={fetchedClassLoading}
      />
      <WorkoutEditModal
        isVisible={editFormVisible}
        onClose={() => {
          setEditFormVisible(false);
        }}
        fetchedClass={fetchedClass}
        classLoading={fetchedClassLoading}
        handleSubmit={() => {
          fetchClassSessions();
        }}
        clients={clients}
      />
      <CourseEditModal
        isVisible={editCourseFormVisible}
        onClose={() => {
          setEditCourseFormVisible(false);
        }}
        fetchedClass={fetchedCourse}
        classLoading={fetchedCourseLoading}
        handleSubmit={() => {
          fetchClassSessions();
        }}
        clients={clients}
      />
      {/* <Modal
        isVisible={editFormVisible}
        onBackdropPress={handleCloseOverlays}
        onBackButtonPress={handleCloseOverlays}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        useNativeDriver
        hideModalContentWhileAnimating
        style={{ margin: 0 }}
        statusBarTranslucent
      >
        <View
          style={{ flex: 1, backgroundColor: mainColor, paddingBottom: 40 }}
        >
          <View
            style={{
              ...styles.overlayHeader,
              backgroundColor: colorScheme === "dark" ? "#15413c" : "#e6f7f5",
            }}
          >
            <TouchableOpacity onPress={handleCloseOverlays}>
              <Ionicons name="close-outline" size={28} color={mainTextColor} />
            </TouchableOpacity>
            <View style={styles.headerTextWrapper}>
              <View>
                <ThemedText type="title" style={styles.headerText}>
                  Edit Workout
                </ThemedText>
              </View>
            </View>
          </View>
          <View style={styles.overlayContent}>
            <FlatList
              data={[renderForm(false, fetchedClass)]}
              renderItem={({ item }) => item}
              keyExtractor={(_, index) => index.toString()}
            />
          </View>
        </View>
      </Modal> */}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    position: "relative",
    // paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
    paddingTop: (Constants?.statusBarHeight ?? 0) + 10,
  },
  logoStyles: {
    width: 52,
    height: 40,
  },
  filterContainer: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
    gap: 30,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  filterButtonText: {
    color: "#12a28d",
    fontSize: 16,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dropdownItemText: {
    fontSize: 16,
  },
  dropdownMenu: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#fff",
    elevation: 1,
    zIndex: 1000,
    minWidth: 190,
    transformOrigin: "top right",
  },
  dropdownItemTextActive: {
    color: "#12a28d",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#12a28d",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  radioCircleSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#12a28d",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -6 }, { translateY: -6 }],
  },
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingBottom: 80,
  },
  calendarContainer: {
    marginTop: 20,
  },
  addButton: {
    backgroundColor: "#12a28d",
    width: 54,
    height: 54,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 70,
    right: 20,
    zIndex: 10,
    opacity: 0.9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  formContainer: {
    paddingVertical: 20,
    paddingBottom: 40,
    paddingHorizontal: 18,
    paddingRight: 30,
    flexDirection: "column",
    alignItems: "center",
  },
  input: {
    flexGrow: 1,
    maxWidth: "90%",
    height: 50,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    marginLeft: "auto",
  },
  intensityContainer: { width: "100%", paddingHorizontal: 5 },
  intensityLabel: { color: "rgba(0, 0, 0, 0.6)", marginBottom: 8 },
  intensityOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 10,
    marginTop: 10,
  },
  intensityOption: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  selectedIntensityOption: {
    borderColor: "#12a28d",
    backgroundColor: "#e0f7f3",
  },
  intensityText: { color: "#666" },
  selectedIntensityText: { color: "#12a28d", fontWeight: "bold" },
  pickerContainer: {
    width: "100%",
  },
  pickerWrapper: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    height: 46,
    position: "relative",
    width: "89%",
  },
  dropdownIcon: {
    position: "absolute",
    bottom: 12,
    right: 0,
  },
  pickerValue: {
    position: "absolute",
    bottom: 6,
    paddingRight: 30,
    width: "100%",
    textAlign: "right",
    color: "#000000",
    fontSize: 12,
    textTransform: "capitalize",
  },
  picker: {
    position: "absolute",
    top: -6,
    left: 0,
    width: "100%",
    height: "100%",
    color: "#666",
    textAlign: "right",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
  },
  timeInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    width: "100%",
  },
  timeInputsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    maxWidth: "90%",
  },
  timeInput: {
    flex: 1,
    borderRadius: 50,
    flexGrow: 1,
    paddingLeft: 0,
    paddingBottom: 16,
    height: "auto",
  },
  timeInputContainer: {
    width: "50%",
    minHeight: 70,
    flexDirection: "column",
    paddingTop: 10,
  },
  inputLabel: {
    fontSize: 14,
    color: "#666",
    position: "absolute",
    top: 10,
    left: 40,
  },
  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    width: 24,
    height: 24,
  },
  circleIcon: {
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: "#12a28d",
  },
  pickerLabel: {
    marginBottom: 5,
    color: "rgba(0, 0, 0, 0.6)",
  },
  instructionText: {
    textAlign: "center",
    marginBottom: 40,
    marginTop: 40,
    color: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 20,
  },
  dropdownItemTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  agendaEmptyDate: {
    justifyContent: "center",
    alignItems: "center",
    height: 60,
    backgroundColor: "red",
  },
  agendaEmptyDateText: {
    color: "#999",
    fontSize: 14,
  },
  section: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 15,
    fontSize: 12,
    fontWeight: "normal",
    fontFamily: "Default-Regular",
    color: "#616161",
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#12a28d",
  },
  agendaItem: {
    backgroundColor: "#fff",
    padding: 8,
    paddingLeft: 15,
  },
  agendaItemText: {
    fontSize: 12,
    color: "#939393",
  },
  eventCard: {
    padding: 10,
    borderRadius: 6,
    width: "100%",
    flexDirection: "column",
    borderBottomWidth: 1,
  },
  eventHeaderText: {
    fontSize: 16,
    color: "#12a28d",
  },
  eventDetails: {
    flexDirection: "row",
  },
  leftSide: {
    padding: 4,
    minWidth: 80,
  },
  rightSide: {
    flexDirection: "row",
    alignItems: "center",

    flex: 1,
  },
  timeText: {
    fontSize: 12,
    lineHeight: 14,
  },
  durationText: {
    fontSize: 11,
    lineHeight: 13,
    marginTop: 4,
  },
  editIconWrapper: {
    borderRadius: 10,
    padding: 6,
    marginRight: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  editIcon: {
    color: "#fff",
    fontSize: 12,
  },
  eventTitle: {
    fontSize: 14,
    lineHeight: 16,
    paddingTop: 6,
  },
  overlay: {
    width: "100%",
    height: "100%",
    backgroundColor: "#fff",
    elevation: 5,
    zIndex: 9999,
  },
  overlayHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingBottom: 15,
    paddingTop: (Constants?.statusBarHeight ?? 0) + 10,
  },
  headerTextWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: 30,
    marginRight: "auto",
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: 20,
    lineHeight: 26,
  },
  overlayContent: {
    paddingBottom: 60,
  },
  successIcon: {
    paddingHorizontal: 8,
    marginLeft: "auto",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    width: "100%",
  },
  tag: {
    backgroundColor: "#e0f7f4",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 7,
    marginRight: 4,
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tagText: {
    fontSize: 11,
    color: "#12a28d",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  errorText: {
    fontSize: 10,
    position: "absolute",
    bottom: -4,
    right: 0,
    pointerEvents: "none",
    userSelect: "none",
    zIndex: 1,
    color: "red",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  clientItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderColor: "#ccc",
  },
  selectedClientItem: {
    backgroundColor: "#e6f7ff",
  },
  clientName: {
    marginLeft: 12,
    fontSize: 16,
  },
  clientImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 5,
  },
  closeButton: {
    alignSelf: "flex-end",
    marginBottom: 10,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 15,
    maxHeight: "70%",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  modalContainerFilters: {
    flex: 1,
    justifyContent: "flex-end",
  },
  checkbox: {},
  dateLabel: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  workoutWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
    backgroundColor: "#f7fbfb",
    borderRadius: 10,
    // marginHorizontal: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 1.1,
    borderWidth: 0.2,
    position: "relative",
    paddingRight: 10,
  },
  workoutImageWrapper: {
    flex: 1.5,
    height: "100%",
    overflow: "hidden",
    borderRadius: 10,
    aspectRatio: "1/1",
  },
  workoutInfo: {
    flex: 2.5,
    justifyContent: "center",
    paddingLeft: 10,
    paddingVertical: 10,
  },
  workoutImage: {
    width: "100%",
    height: "100%",
  },
  iosTimePickerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    alignItems: "center",
  },
  iosTimePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  iosTimePickerButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  iosTimePickerButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#12a28d", // iOS system blue
  },
});
