import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  FlatList,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import Modal from "react-native-modal";
import { Image } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Exercise,
  ExerciseGroup,
  getAllExercicesGroups,
  getAllExercisesForGroup,
} from "@/api/exercices";
import { useTags } from "@/context/tagsContext";
import Toast, { ErrorToast } from "react-native-toast-message";
import { useExercises } from "@/context/excersisesContext";
import { useAuth } from "@/context/authContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Picker } from "@react-native-picker/picker";
import DraggableFlatList from "react-native-draggable-flatlist";
import { editCourse, getCourseById } from "@/api/courses";
import { cloneDeep } from "lodash";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useColorScheme } from "@/hooks/useColorScheme";
import { convertSeconds } from "@/helpers/convertSeconds";
import Button from "@/components/Button";

const difficultyOptions: { label: string; value: string }[] = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
  { label: "Expert", value: "expert" },
];

export default function SingleCourse() {
  const colorScheme = useColorScheme();

  const [iosDifficultyPickerVisible, setIosDifficultyPickerVisible] =
    useState(false);

  const [exercises, setExercises] = useState<any>(null);
  const [exercisesLoading, setExercisesLoading] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState<ExerciseGroup | null>(
    null
  );
  const [groupsLoading, setGroupsLoading] = useState(null);
  const [groups, setGroups] = useState<ExerciseGroup[] | null>(null);

  const mainTextColor = useThemeColor({}, "mainText");
  const mainColor = useThemeColor({}, "main");
  const navigation = useNavigation();
  const { courseId } = useLocalSearchParams();

  const [summaryVisible, setSummaryVisible] = useState(false);

  const router = useRouter();

  const { userId } = useAuth();

  const [course, setCourse] = useState<any>(null);

  const [emptyDays, setEmptyDays] = useState<any>([]);

  const [originalOrder, setOriginalOrder] = useState<Exercise[]>([]);

  const [selectedDay, setSelectedDay] = useState(1);
  const [exercisesByDay, setExercisesByDay] = useState<{
    [key: number]: Exercise[];
  }>({});
  const [selectedExercisesForDayTags, setSelectedExercisesForDayTags] =
    useState([]);

  const [editFormVisible, setEditFormVisible] = useState(false);
  const [editCourseLoading, setEditCourseLoading] = useState(false);
  const [getCourseLoading, setGetCourseLoading] = useState(false);

  const [filters, setFilters] = useState<{
    visible: boolean;
    filterName: "" | "exercisesForDay" | "availableExercisesForDay" | "courses";
  }>({
    visible: false,
    filterName: "",
  });

  const [searchValForDay, setSearchValForDay] = useState("");
  const [searchValAvailableForDay, setSearchValAvailableForDay] = useState("");

  const [
    selectedAvailableExercisesForDayTags,
    setSelectedAvailableExercisesForDayTags,
  ] = useState([]);

  const {
    // fetchTags, tags,
    fetchExerciseTagsPerGroup,
    exerciseTagsPerGroup,
  } = useTags();

  const [courseTitle, setCourseTitle] = useState("");
  const [difficultyState, setDifficultyState] = useState<any>(null);
  const [courseDays, setCourseDays] = useState("");

  const [tempDifficulty, setTempDifficulty] = useState(difficultyState);

  const [editCourseErrors, setEditCourseErrors] = useState({
    title: "",
    difficulty: "",
    courseDays: "",
  });

  const { fetchExercises } = useExercises();

  const validateField = (
    field: "title" | "difficulty" | "courseDays",
    value: string
  ) => {
    const newErrors = { ...editCourseErrors };

    switch (field) {
      case "title":
        newErrors.title = value.trim() ? "" : "Title is required.";
        break;
      case "difficulty":
        newErrors.difficulty = value.trim() ? "" : "Difficulty is required.";
        break;
      case "courseDays":
        newErrors.courseDays = value.trim()
          ? ""
          : "Number of days is required.";
        break;
      default:
        break;
    }

    setEditCourseErrors(newErrors);
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { title: "", difficulty: "", courseDays: "" };

    if (!courseTitle.trim()) {
      newErrors.title = "Title is required.";
      isValid = false;
    }

    if (!difficultyState) {
      newErrors.difficulty = "Difficulty is required.";
      isValid = false;
    }

    if (!courseDays) {
      newErrors.courseDays = "Number of days is required.";
      isValid = false;
    }

    if (!exercisesByDay || Object.keys(exercisesByDay).length === 0) {
      // newErrors.exercisesByDay = "Exercises per day are required.";
      isValid = false;
    } else {
      const emptyDays = Object.entries(exercisesByDay).filter(
        ([_, exercises]) => exercises.length === 0
      );

      const mappedEmptyDays = emptyDays?.map(([day]) => day);

      setEmptyDays(mappedEmptyDays);

      if (emptyDays.length > 0) {
        Toast.show({
          type: "error",
          text1: `Each day must have at least one exercise. Empty days: ${emptyDays
            ?.map(([day]) => day)
            .join(", ")}`,
          position: "top",
        });
        isValid = false;
      }
    }

    setEditCourseErrors(newErrors);
    return isValid;
  };

  const getDifficultyLabel = (value: string): string => {
    const option = difficultyOptions.find((item) => item.value === value);
    return option ? option.label : "";
  };

  const isFocused = useIsFocused();

  const fetchGroups = async () => {
    try {
      const result = await getAllExercicesGroups();

      result && setGroups(result);
    } catch (error) {
    } finally {
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [isFocused]);

  const fetchExercisesForGroup = async () => {
    if (selectedGroup) {
      setExercisesLoading(true);
      try {
        const result = await getAllExercisesForGroup(selectedGroup.id);

        result && setExercises(result?.[0]?.exercise_set);
      } catch (error) {
      } finally {
        setExercisesLoading(false);
      }
    }
  };

  useEffect(() => {
    if (selectedGroup) {
      fetchExercisesForGroup();
    } else {
      setExercises(null);
      setExercisesLoading(true);
    }
  }, [selectedGroup]);

  useEffect(() => {
    setCourseTitle(course?.title ?? "");
    setCourseDays(String(course?.number_of_days));
    fetchExerciseTagsPerGroup();

    const foundDifficulty = difficultyOptions?.find(
      (d) => d.value === course?.difficulty
    )?.value;

    foundDifficulty && setDifficultyState(foundDifficulty);

    if (course && course.days) {
      // Transform the array of days into an object keyed by day_number
      const formattedExercisesByDay = course.days.reduce(
        (acc: any, day: any) => {
          // Ensure day_number is a number
          const dayKey = Number(day.day_number);
          // Set the exercises for that day (or an empty array if not defined)
          acc[dayKey] = day.exercises || [];
          return acc;
        },
        {} as { [key: number]: Exercise[] }
      );

      setExercisesByDay(formattedExercisesByDay);
    }
  }, [course]);

  const generateUniqueKey = (exercise: any, index: number, day: number) => {
    // Koristi kombinaciju exercise ID, day-a i indeksa za jedinstveni key
    const exerciseId = exercise?.exercise?.id || exercise?.id;
    return `${day}-${exerciseId}-${index}`;
  };

  const fetchCourse = async () => {
    try {
      const fetchedCourse = await getCourseById(
        Number(courseId),
        setGetCourseLoading
      );

      setCourse(fetchedCourse);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Something went wrong.",
        position: "top",
      });
    }
  };

  //   TEMP
  useEffect(() => {
    fetchCourse();
    fetchExercises();
  }, []);

  const totalExercisesForSelectedDay =
    (exercisesByDay && exercisesByDay[selectedDay]) || [];

  const filteredExercisesForSelectedDay = totalExercisesForSelectedDay
    ?.filter((exercise) =>
      selectedExercisesForDayTags?.length
        ? // @ts-ignore
          exercise?.exercise?.exercise_tags.some((tag: any) =>
            selectedExercisesForDayTags
              ?.map((t: any) => t?.name)
              .includes(tag?.name)
          )
        : true
    )
    ?.filter((exercise) =>
      // @ts-ignore
      exercise?.exercise?.name
        ?.toLowerCase()
        .includes(searchValForDay?.toLowerCase())
    );
  const totalAvailableExercisesForDay = exercises?.filter((exercise: any) => {
    return !totalExercisesForSelectedDay
      // @ts-ignore
      ?.map((e) => e?.exercise?.id)
      ?.includes(exercise.id);
  });

  const filteredAvailableExercisesForDay = totalAvailableExercisesForDay
    ?.filter((exercise: any) =>
      selectedAvailableExercisesForDayTags?.length
        ? exercise.exercise_tags.some((tag: any) =>
            selectedAvailableExercisesForDayTags
              ?.map((t: any) => t?.name)
              .includes(tag?.name)
          )
        : true
    )
    ?.filter((exercise: any) =>
      exercise?.name
        ?.toLowerCase()
        .includes(searchValAvailableForDay?.toLowerCase())
    );

  const initializeDaysState = (numberOfDays: number) => {
    setExercisesByDay((prevExercises) => {
      const newState: { [key: number]: Exercise[] } = {};

      for (let i = 1; i <= numberOfDays; i++) {
        newState[i] = prevExercises[i] ?? []; // Keep existing exercises if the day exists
      }

      return newState;
    });
  };

  useEffect(() => {
    if (totalExercisesForSelectedDay?.length > 0 && !originalOrder.length) {
      setOriginalOrder(totalExercisesForSelectedDay);
    }
  }, [totalExercisesForSelectedDay]);

  useEffect(() => {
    if (courseDays && !isNaN(parseInt(courseDays))) {
      initializeDaysState(parseInt(courseDays));
    }
  }, [courseDays]);

  const editCourseHandler = async () => {
    try {
      const safeExercisesByDay = cloneDeep(exercisesByDay);

      const formattedCourseDays = Object.keys(safeExercisesByDay)
        .filter((dayKey) => !isNaN(parseInt(dayKey, 10)))
        .map((dayKey) => {
          const dayNumber = parseInt(dayKey, 10);
          const exercises = safeExercisesByDay[dayNumber] || [];

          const existingDay = course?.days?.find(
            (day: any) => Number(day.day_number) === dayNumber
          );

          const formattedExercises = exercises
            .map((ex: any, index: number) => {
              const existingExerciseEntry = existingDay?.exercises?.find(
                (e: any) =>
                  e.exercise_id === ex?.exercise?.id ||
                  e.exercise?.id === ex?.exercise?.id
              );

              return {
                ...(existingExerciseEntry?.id && {
                  id: existingExerciseEntry.id,
                }),
                exercise_id: ex?.exercise?.id,
                order: index + 1,
              };
            })
            .filter((ex) => ex.exercise_id); // Skip invalid ones

          return {
            day_number: dayNumber,
            ...(existingDay?.id && { id: existingDay.id }),
            exercises: formattedExercises,
          };
        });

      const dataToSend = {
        title: courseTitle,
        difficulty: difficultyState,
        number_of_days: Number(courseDays),
        days: formattedCourseDays,
      };

      const createdCourse = await editCourse(
        course.id,
        // @ts-ignore
        dataToSend,
        setEditCourseLoading
      );

      if (createdCourse) {
        setSummaryVisible(false);
        setEditFormVisible(false);
        fetchCourse();
        setTimeout(() => {
          Toast.show({
            type: "success",
            text1: "Course updated.",
            position: "top",
          });
        }, 500);
      }
    } catch (error) {
      console.error("Error in editCourseHandler:", error);
    }
  };

  const renderDayTabs = () => {
    if (!courseDays || isNaN(parseInt(courseDays))) return null;

    const numberOfDays = parseInt(courseDays);

    return (
      <View style={styles.daysTabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScrollView}
        >
          {Array.from({ length: numberOfDays }, (_, i) => i + 1)?.map((day) => (
            <TouchableOpacity
              key={day}
              onPress={() => setSelectedDay(day)}
              activeOpacity={0.7}
              style={[
                styles.dayTab,
                selectedDay === day
                  ? styles.dayTabActive
                  : {
                      backgroundColor:
                        colorScheme === "dark"
                          ? "rgba(255, 255, 255, 0.2)"
                          : "#2dd4be14",
                    },
              ]}
            >
              <ThemedText
                style={[
                  styles.dayTabText,
                  emptyDays?.includes(String(day))
                    ? {
                        color: colorScheme === "dark" ? "#FF6B6B" : "#FA5A5A",
                      }
                    : selectedDay === day
                    ? {
                        color: "#fff",
                      }
                    : styles.dayTabTextInactive,
                ]}
              >
                Day {day}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const addExerciseToDay = (exercise: Exercise) => {
    setExercisesByDay((prevExercises: any) => {
      const currentExercises = prevExercises[selectedDay] || [];
      // Za edit mode, potrebno je sačuvati exercise u istom formatu kao što backend vraća
      const exerciseToAdd = course
        ? { exercise: exercise } // Edit mode - wrappuj u 'exercise' objekat
        : exercise; // Create mode - koristi direktno

      return {
        ...prevExercises,
        [selectedDay]: [...currentExercises, exerciseToAdd],
      };
    });

    // Ukloni iz dostupnih vežbi
    setExercises((prevExercises: Exercise[]) =>
      prevExercises?.filter((e) => e.id !== exercise.id)
    );
  };

  const removeExerciseFromDay = (exerciseId: number, day: number) => {
    setExercisesByDay((prev) => ({
      ...prev,
      [day]: prev[day].filter((ex) => {
        // Get the exercise ID either directly or from the nested exercise object
        const exId = ex.id;
        // @ts-ignore
        const nestedExId = ex.exercise?.id;

        // Only keep exercises that don't match the ID we want to remove
        return exId !== exerciseId && nestedExId !== exerciseId;
      }),
    }));
  };

  const renderExerciseForDayItem = ({
    item,
    drag,
    isActive,
    shorter,
    day,
  }: any) => {
    const exercise = item?.exercise || item;
    const exerciseName = exercise?.name;
    const exerciseDuration = exercise?.duration_in_seconds;
    const thumbnailImage =
      item.exercise?.images?.find(
        (img: any) => img.id === item.exercise?.thumbnail_image
      )?.file_path ?? item?.images?.[0]?.file_path;

    const { hours, minutes, seconds } = convertSeconds(
      Number(exerciseDuration)
    );

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
            paddingRight: 30,
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
        onLongPress={drag}
      >
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => {
            if (day) {
              removeExerciseFromDay(exercise?.id, day);
            } else {
              removeExerciseFromDay(exercise?.id, selectedDay);
            }
          }}
        >
          <Ionicons
            name="close-circle"
            size={shorter ? 16 : 18}
            color={colorScheme === "dark" ? "#FF6B6B" : "#FA5A5A"}
          />
        </TouchableOpacity>
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
            contentFit="cover"
            cachePolicy="disk"
          />
        </View>
        <View style={styles.workoutInfo}>
          <ThemedText
            type="smaller"
            style={{
              fontFamily: "Default-Medium",
            }}
          >
            {exerciseName}
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
                marginLeft: 3,
                fontSize: 12,
                lineHeight: 15,
                paddingTop: 3,
              }}
            >
              {hours > 0 ? ` ${hours}h` : ""}
              {minutes > 0 ? ` ${minutes}min` : ""}
              {seconds > 0 ? ` ${seconds}sec` : ""}
            </ThemedText>
          </View>
          {!shorter && (
            <View style={styles.tagsContainer}>
              {item.exercise?.exercise_tags?.map(
                (tag: any, tagIndex: number) => (
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
                        fontSize: 11,
                      }}
                    >
                      {tag?.name}
                    </ThemedText>
                  </View>
                )
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderExercisesForDay = () => {
    return (
      courseDays && (
        <View style={{ paddingTop: 15 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <ThemedText type="defaultSemiBold">
              Day {selectedDay} Exercises
            </ThemedText>
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={styles.filterButton}
                activeOpacity={0.7}
                onPress={() => {
                  setFilters((prevState) => ({
                    ...prevState,
                    visible: true,
                    filterName: "exercisesForDay",
                  }));
                }}
              >
                <Ionicons name={"funnel-outline"} size={24} color="#12a28d" />
              </TouchableOpacity>
            </View>
          </View>
          <View
            style={{
              ...styles.inputWrapper,
              marginBottom: 20,
            }}
          >
            <View style={styles.iconWrapper}>
              <Ionicons name="search-outline" size={20} color={mainTextColor} />
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
              placeholder="Search"
              placeholderTextColor={
                colorScheme === "dark"
                  ? "rgb(170, 170, 170)"
                  : "rgb(105, 105, 105)"
              }
              value={searchValForDay}
              onChangeText={(text) => {
                setSearchValForDay(text);
              }}
            />
            {searchValForDay?.length > 0 && (
              <TouchableOpacity
                style={{
                  position: "absolute",
                  right: 10,
                  top: 18,
                }}
                onPress={() => {
                  setSearchValForDay("");
                }}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colorScheme === "dark" ? "#FF6B6B" : "#FA5A5A"}
                />
              </TouchableOpacity>
            )}
          </View>
          {selectedExercisesForDayTags &&
            selectedExercisesForDayTags.length > 0 && (
              <View
                style={{
                  ...styles.filtersContainer,
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 6,
                  marginTop: 0,
                }}
              >
                {selectedExercisesForDayTags?.map((t: any) => {
                  return (
                    <TouchableOpacity
                      style={styles.filterTag}
                      key={t.id}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedExercisesForDayTags((prevState) =>
                          prevState.filter((st: any) => st.id !== t.id)
                        );
                      }}
                    >
                      <ThemedText
                        style={{
                          ...styles.filterText,
                          textTransform: "capitalize",
                          fontSize: 12,
                        }}
                      >
                        {t?.name}
                      </ThemedText>
                      <Ionicons
                        name="close-circle"
                        size={17}
                        color={colorScheme === "dark" ? "#FF6B6B" : "#FA5A5A"}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          {filteredExercisesForSelectedDay?.length > 0 && (
            <ThemedText
              type="smallest"
              style={{
                color:
                  colorScheme === "dark"
                    ? "rgb(160, 160, 160)"
                    : "rgb(51, 51, 51)",
                paddingBottom: 5,
                textAlign: "right",
              }}
            >
              {filteredExercisesForSelectedDay?.length ===
              totalExercisesForSelectedDay?.length
                ? `${filteredExercisesForSelectedDay?.length} ${
                    filteredExercisesForSelectedDay?.length === 1
                      ? "exercise"
                      : "exercises"
                  }`
                : `${filteredExercisesForSelectedDay?.length} of ${
                    totalExercisesForSelectedDay?.length
                  } ${
                    totalExercisesForSelectedDay?.length === 1
                      ? "exercise"
                      : "exercises"
                  }`}
            </ThemedText>
          )}
          {false ? (
            <ActivityIndicator
              size="large"
              style={{ marginTop: 40 }}
              color={"#12a28d"}
            />
          ) : filteredExercisesForSelectedDay &&
            filteredExercisesForSelectedDay?.length > 0 ? (
            <View
              style={{
                maxHeight: filteredExercisesForSelectedDay?.length * 190,
              }}
            >
              <DraggableFlatList
                dragHitSlop={{ top: -10, left: -10 }}
                key={`${filters.visible}-${summaryVisible}`}
                data={filteredExercisesForSelectedDay}
                renderItem={renderExerciseForDayItem}
                // @ts-ignore
                keyExtractor={(item) => item.exercise?.id?.toString()}
                dragItemOverflow={true}
                onDragEnd={({ data }) => {
                  setExercisesByDay((prevExercises) => {
                    const fullList = prevExercises[selectedDay] || [];

                    const newOrderMap = new Map(
                      data?.map((exercise, index) => [exercise.id, index])
                    );

                    const newFullList = [...fullList].sort((a, b) => {
                      const indexA =
                        newOrderMap.get(a.id) ?? fullList.indexOf(a);
                      const indexB =
                        newOrderMap.get(b.id) ?? fullList.indexOf(b);
                      return indexA - indexB;
                    });

                    return {
                      ...prevExercises,
                      [selectedDay]: newFullList,
                    };
                  });
                }}
              />
            </View>
          ) : (
            // filteredExercisesForSelectedDay?.map((exercise, index: number) => {
            //   const {
            //     name,
            //     videos,
            //     duration_in_seconds,
            //     exercise_tags,
            //     images,
            //   } = exercise;

            //   const video = videos[0]?.file_path;

            //   const thumbnailImage = images?.find(
            //     (img: any) => img.id === exercise.thumbnail_image
            //   )?.file_path;
            //   return (
            //     <View
            //       key={index}
            //       style={{
            //         ...styles.workoutWrapper,
            //         paddingRight: 30,
            //         // marginLeft: 10
            //       }}
            //     >
            //       <View
            //         style={{
            //           position: "absolute",
            //           top: "50%",
            //           right: 5,
            //           transform: "translate(0, -50%)",
            //         }}
            //       >
            //         <TouchableWithoutFeedback>
            //           <Ionicons
            //             name="reorder-four-outline"
            //             size={24}
            //             color="#555"
            //           />
            //         </TouchableWithoutFeedback>
            //       </View>
            //       <TouchableOpacity
            //         style={styles.removeButton}
            //         onPress={() => removeExerciseFromDay(exercise.id)}
            //       >
            //         <Ionicons name="close-circle" size={20} color="#f84c4cd2" />
            //       </TouchableOpacity>
            //       <View style={styles.workoutImageWrapper}>
            //         <Image
            //           source={
            //             thumbnailImage
            //               ? { uri: thumbnailImage }
            //               : require("@/assets/images/splash-logo.png")
            //           }
            //           style={styles.workoutImage}
            //         />
            //       </View>
            //       <View style={styles.workoutInfo}>
            //         <ThemedText
            //           type={"smaller"}
            //           style={{
            //             color: "#000",
            //             fontFamily: "Default-Medium",
            //           }}
            //         >
            //           {name}
            //         </ThemedText>
            //         <View
            //           style={{
            //             marginTop: 6,
            //             flexDirection: "row",
            //             alignItems: "center",
            //           }}
            //         >
            //           <Ionicons
            //             name="time-outline"
            //             size={18}
            //             color="rgba(22, 22, 22, 1)"
            //           />
            //           <ThemedText
            //             type="smaller"
            //             style={{
            //               marginLeft: 3,
            //               color: "#000",
            //               // lineHeight: 20,
            //               fontSize: 12,
            //               lineHeight: 15,
            //               paddingTop: 3,
            //             }}
            //           >
            //             {duration_in_seconds} min
            //           </ThemedText>
            //         </View>
            //         <View style={styles.tagsContainer}>
            //           {exercise_tags.map((tag: any, tagIndex: number) => (
            //             <View key={tagIndex} style={styles.tag}>
            //               <ThemedText type="smaller" style={styles.tagText}>
            //                 {tag.name}
            //               </ThemedText>
            //             </View>
            //           ))}
            //         </View>
            //       </View>
            //     </View>
            //   );
            // })
            <ThemedText
              type="subtitle"
              style={{
                fontSize: 14,
                paddingTop:
                  selectedExercisesForDayTags &&
                  selectedExercisesForDayTags.length > 0
                    ? 10
                    : 0,
              }}
            >
              No Results{" "}
              {selectedExercisesForDayTags || searchValForDay
                ? "For Applied Filters"
                : ""}
            </ThemedText>
          )}
        </View>
      )
    );
  };

  const renderAvailableExercisesForDay = () => {
    return (
      courseDays && (
        <View
          style={{
            paddingBottom: 10,
            paddingTop:
              filteredExercisesForSelectedDay &&
              filteredExercisesForSelectedDay?.length > 0
                ? 15
                : 15,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <ThemedText type="defaultSemiBold">Available Exercises</ThemedText>
            {selectedGroup && (
              <View style={styles.filterContainer}>
                <TouchableOpacity
                  style={styles.filterButton}
                  activeOpacity={0.7}
                  onPress={() =>
                    setFilters((prevState) => ({
                      ...prevState,
                      visible: true,
                      filterName: "availableExercisesForDay",
                    }))
                  }
                >
                  <Ionicons name={"funnel-outline"} size={24} color="#12a28d" />
                </TouchableOpacity>
              </View>
            )}
          </View>
          {filteredExercisesForSelectedDay?.length !== exercises?.length &&
            selectedGroup && (
              <View
                style={{
                  ...styles.inputWrapper,
                  marginBottom: 20,
                }}
              >
                <View style={styles.iconWrapper}>
                  <Ionicons
                    name="search-outline"
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
                  placeholder="Search"
                  placeholderTextColor={
                    colorScheme === "dark"
                      ? "rgb(170, 170, 170)"
                      : "rgb(105, 105, 105)"
                  }
                  value={searchValAvailableForDay}
                  onChangeText={(text) => {
                    setSearchValAvailableForDay(text);
                  }}
                />
                {searchValAvailableForDay?.length > 0 && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: 18,
                    }}
                    onPress={() => {
                      setSearchValAvailableForDay("");
                    }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={colorScheme === "dark" ? "#FF6B6B" : "#FA5A5A"}
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}
          {selectedAvailableExercisesForDayTags &&
            selectedAvailableExercisesForDayTags.length > 0 && (
              <View
                style={{
                  ...styles.filtersContainer,
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 6,
                  marginTop: 0,
                }}
              >
                {selectedAvailableExercisesForDayTags?.map((t: any) => {
                  return (
                    <TouchableOpacity
                      style={styles.filterTag}
                      key={t.id}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedAvailableExercisesForDayTags((prevState) =>
                          prevState.filter((st: any) => st.id !== t.id)
                        );
                      }}
                    >
                      <ThemedText
                        style={{
                          ...styles.filterText,
                          textTransform: "capitalize",
                          fontSize: 12,
                        }}
                      >
                        {t?.name}
                      </ThemedText>
                      <Ionicons
                        name="close-circle"
                        size={17}
                        color={colorScheme === "dark" ? "#FF6B6B" : "#FA5A5A"}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          {filteredAvailableExercisesForDay?.length > 0 && (
            <ThemedText
              type="smallest"
              style={{
                color:
                  colorScheme === "dark"
                    ? "rgb(160, 160, 160)"
                    : "rgb(51, 51, 51)",
                paddingBottom: 5,
                textAlign: "right",
              }}
            >
              {filteredAvailableExercisesForDay?.length ===
              totalAvailableExercisesForDay?.length
                ? `${filteredAvailableExercisesForDay?.length} ${
                    filteredAvailableExercisesForDay?.length === 1
                      ? "exercise"
                      : "exercises"
                  }`
                : `${filteredAvailableExercisesForDay?.length} of ${
                    totalAvailableExercisesForDay?.length
                  } ${
                    totalAvailableExercisesForDay?.length === 1
                      ? "exercise"
                      : "exercises"
                  }`}
            </ThemedText>
          )}

          {/* {loading ? (
            <ActivityIndicator
              size="large"
              style={{ marginTop: 40 }}
              color={"#12a28d"}
            />
          ) : filteredAvailableExercisesForDay &&
            filteredAvailableExercisesForDay?.length > 0 ? (
            <View>
              {filteredAvailableExercisesForDay.map(
                (exercise, index: number) => {
                  const {
                    name,
                    videos,
                    duration_in_seconds,
                    exercise_tags,
                    images,
                  } = exercise;

                  const { hours, minutes, seconds } = convertSeconds(
                    Number(duration_in_seconds)
                  );

                  const thumbnailImage =
                    images?.find(
                      (img: any) => img.id === exercise.thumbnail_image
                    )?.file_path ?? images?.[0]?.file_path;
                  return (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      key={index}
                      style={{
                        ...styles.workoutWrapper,
                        paddingRight: 30,
                        backgroundColor:
                          colorScheme === "dark" ? "#000" : "#fff",
                        borderColor:
                          colorScheme === "dark"
                            ? "rgba(100, 100, 100, 1)"
                            : "rgb(233, 233, 233)",
                        shadowColor:
                          colorScheme === "dark" ? "#fff" : "#393939",
                        elevation: colorScheme === "dark" ? 2 : 1.1,
                      }}
                      onPress={() => {
                        setExercisesByDay((prevState) => {
                          const selectedDayExercises =
                            prevState[selectedDay]?.push(exercise);

                          prevState[selectedDay];

                          return {
                            ...prevState,
                            selectedDay: selectedDayExercises,
                          };
                        });

                        if (emptyDays?.includes(String(selectedDay))) {
                          setEmptyDays((prevState: any) =>
                            prevState.filter((d: any) => d != selectedDay)
                          );
                        }
                      }}
                    >
                      <View
                        style={{
                          position: "absolute",
                          top: "50%",
                          right: 5,
                          transform: "translate(0, -50%)",
                        }}
                      >
                        <Ionicons
                          name="add-circle-outline"
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
                          contentFit="cover"
                          cachePolicy="disk"
                          
                        />
                      </View>
                      <View style={styles.workoutInfo}>
                        <ThemedText
                          type={"smaller"}
                          style={{
                            fontFamily: "Default-Medium",
                          }}
                        >
                          {name}
                        </ThemedText>
                        <View
                          style={{
                            marginTop: 6,
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          <Ionicons
                            name="time-outline"
                            size={18}
                            color={mainTextColor}
                          />
                          <ThemedText
                            type="smaller"
                            style={{
                              fontSize: 12,
                              lineHeight: 15,
                            }}
                          >
                            {hours > 0 ? ` ${hours}h` : ""}
                            {minutes > 0 ? ` ${minutes}min` : ""}
                            {seconds > 0 ? ` ${seconds}sec` : ""}
                          </ThemedText>
                        </View>
                        <View style={styles.tagsContainer}>
                          {exercise_tags.map((tag: any, tagIndex: number) => (
                            <View
                              key={tagIndex}
                              style={{
                                ...styles.tag,
                                backgroundColor:
                                  colorScheme === "dark"
                                    ? "#15413c"
                                    : "#00ffe119",
                              }}
                            >
                              <ThemedText
                                type="smaller"
                                style={{
                                  ...styles.tagText,
                                  color:
                                    colorScheme === "dark"
                                      ? "#e3e3e3"
                                      : "#000000",
                                  fontSize: 11,
                                }}
                              >
                                {tag.name}
                              </ThemedText>
                            </View>
                          ))}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }
              )}
            </View>
          ) : (
            <ThemedText
              type="subtitle"
              style={{
                // paddingLeft: 20,
                fontSize: 14,
                paddingTop:
                  selectedAvailableExercisesForDayTags &&
                  selectedAvailableExercisesForDayTags.length > 0
                    ? 10
                    : 0,
              }}
            >
              No Results{" "}
              {(selectedAvailableExercisesForDayTags &&
                selectedAvailableExercisesForDayTags.length > 0) ||
              searchValAvailableForDay
                ? "For Applied Filters"
                : ""}
            </ThemedText>
          )} */}
          {selectedGroup ? (
            exercisesLoading ? (
              <ActivityIndicator
                size="large"
                style={{ marginTop: 40 }}
                color={"#12a28d"}
              />
            ) : filteredAvailableExercisesForDay &&
              filteredAvailableExercisesForDay.length > 0 ? (
              <View>
                {filteredAvailableExercisesForDay?.map(
                  (exercise: any, index: number) => {
                    const {
                      name,
                      videos,
                      duration_in_seconds,
                      exercise_tags,
                      images,
                    } = exercise;

                    const { hours, minutes, seconds } = convertSeconds(
                      Number(duration_in_seconds)
                    );

                    const thumbnailImage =
                      images?.find(
                        (img: any) => img.id === exercise.thumbnail_image
                      )?.file_path ?? images?.[0]?.file_path;
                    return (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        key={index}
                        style={{
                          ...styles.workoutWrapper,
                          paddingRight: 40,
                          backgroundColor:
                            colorScheme === "dark" ? "#000" : "#fff",
                          borderColor:
                            colorScheme === "dark"
                              ? "rgba(100, 100, 100, 1)"
                              : "rgb(233, 233, 233)",
                          shadowColor:
                            colorScheme === "dark" ? "#fff" : "#393939",
                          elevation: colorScheme === "dark" ? 2 : 1.1,
                        }}
                        onPress={() => {
                          addExerciseToDay(exercise);
                          // setExercisesByDay((prevState: any) => {
                          //   const existing = prevState[selectedDay] || [];
                          //   return {
                          //     ...prevState,
                          //     [selectedDay]: [...existing, { exercise }], // correct wrapping
                          //   };
                          // });

                          // if (emptyDays?.includes(String(selectedDay))) {
                          //   setEmptyDays((prevState: any) =>
                          //     prevState.filter((d: any) => d != selectedDay)
                          //   );
                          // }
                        }}
                      >
                        <View
                          style={{
                            position: "absolute",
                            top: "50%",
                            right: 5,
                            transform: "translate(0, -50%)",
                          }}
                        >
                          <Ionicons
                            name="add-circle-outline"
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
                            type={"smaller"}
                            style={{
                              fontFamily: "Default-Medium",
                            }}
                          >
                            {name}
                          </ThemedText>
                          <View
                            style={{
                              marginTop: 6,
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <Ionicons
                              name="time-outline"
                              size={18}
                              color={mainTextColor}
                            />
                            <ThemedText
                              type="smaller"
                              style={{
                                fontSize: 12,
                                lineHeight: 15,
                              }}
                            >
                              {hours > 0 ? ` ${hours}h` : ""}
                              {minutes > 0 ? ` ${minutes}min` : ""}
                              {seconds > 0 ? ` ${seconds}sec` : ""}
                            </ThemedText>
                          </View>
                          <View style={styles.tagsContainer}>
                            {exercise_tags?.map(
                              (tag: any, tagIndex: number) => (
                                <View
                                  key={tagIndex}
                                  style={{
                                    ...styles.tag,
                                    backgroundColor:
                                      colorScheme === "dark"
                                        ? "#15413c"
                                        : "#00ffe119",
                                  }}
                                >
                                  <ThemedText
                                    type="smaller"
                                    style={{
                                      ...styles.tagText,
                                      color:
                                        colorScheme === "dark"
                                          ? "#e3e3e3"
                                          : "#000000",
                                    }}
                                  >
                                    {tag?.name}
                                  </ThemedText>
                                </View>
                              )
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>
            ) : (
              <ThemedText
                type="subtitle"
                style={{
                  // paddingLeft: 20,
                  fontSize: 14,
                  paddingTop:
                    selectedAvailableExercisesForDayTags &&
                    selectedAvailableExercisesForDayTags.length > 0
                      ? 10
                      : 0,
                }}
              >
                No Results{" "}
                {(selectedAvailableExercisesForDayTags &&
                  selectedAvailableExercisesForDayTags.length > 0) ||
                searchValAvailableForDay
                  ? "For Applied Filters"
                  : ""}
              </ThemedText>
            )
          ) : (
              groupsLoading ? (
                <ActivityIndicator
                  size="large"
                  style={{ marginTop: 40 }}
                  color={"#12a28d"}
                />
              ) : (
                groups && groups.length > 0
              )
            ) ? (
            <ScrollView>
              <View style={{ flex: 1 }}>
                <ThemedText
                  type="defaultSemiBold"
                  style={{
                    marginBottom: 10,
                    fontSize: 15,
                    marginTop: 20,
                  }}
                >
                  Select Group
                </ThemedText>
                {groups?.map((group, index) => {
                  return (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      key={index}
                      style={{
                        ...styles.workoutWrapper,
                        backgroundColor:
                          colorScheme === "dark" ? "#000" : "#fff",
                        borderColor:
                          colorScheme === "dark"
                            ? "rgba(100, 100, 100, 1)"
                            : "rgb(233, 233, 233)",
                        shadowColor:
                          colorScheme === "dark" ? "#fff" : "#393939",
                        elevation: colorScheme === "dark" ? 2 : 1.1,
                      }}
                      onPress={() => {
                        setSelectedGroup(group);
                        // router.setParams({ group: group?.id })
                      }}
                    >
                      <View
                        style={{
                          position: "absolute",
                          top: "50%",
                          transform: "translate(0, -50%)",
                          right: 10,
                          pointerEvents: "none",
                        }}
                      >
                        <Ionicons
                          name="chevron-forward-outline"
                          size={20}
                          color={mainTextColor}
                        />
                      </View>
                      <View style={styles.workoutInfo}>
                        <ThemedText
                          type={"defaultSemiBold"}
                          style={{ marginBottom: 5, fontSize: 15 }}
                        >
                          {group?.name}
                        </ThemedText>
                        <ThemedText type={"smaller"}>
                          {group.description}
                        </ThemedText>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          ) : (
            <View></View>
          )}
        </View>
      )
    );
  };

  const renderCoursesSummary = () => {
    return (
      <ScrollView
        style={{ paddingHorizontal: 10, paddingTop: 20, width: "100%" }}
      >
        {Object.entries(exercisesByDay).map(([day, exercises]) => {
          const { hours, minutes, seconds } = convertSeconds(
            exercises
              // @ts-ignore
              ?.map(
                (e) =>
                  // @ts-ignore
                  e?.exercise?.duration_in_seconds ||
                  e?.duration_in_seconds ||
                  0
              )
              .reduce((acc, num) => acc + num, 0)
          );

          return (
            exercises &&
            exercises.length > 0 && (
              <View key={`day-${day}`}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    marginBottom: 3,
                  }}
                >
                  <ThemedText
                    type="subtitle"
                    style={{
                      fontSize: 14,
                      marginTop: 20,
                    }}
                  >
                    Day {day} Exercises
                  </ThemedText>
                  <ThemedText
                    type="smallest"
                    style={{
                      paddingTop: 20,
                      paddingRight: 10,
                      paddingBottom: 5,
                      textAlign: "right",
                    }}
                  >
                    Total Duration: {hours > 0 ? ` ${hours}h` : ""}
                    {minutes > 0 ? ` ${minutes}min` : ""}
                    {seconds > 0 ? ` ${seconds}sec` : ""}
                  </ThemedText>
                </View>
                <DraggableFlatList
                  dragHitSlop={{ top: -10, left: -10 }}
                  key={`day-${day}-${filters.visible}-${summaryVisible}-${exercises.length}`}
                  data={exercises}
                  renderItem={(obj) => {
                    return renderExerciseForDayItem({
                      ...obj,
                      shorter: true,
                      day: Number(day),
                    });
                  }}
                  keyExtractor={(item, index) =>
                    generateUniqueKey(item, index, Number(day))
                  }
                  dragItemOverflow={true}
                  onDragEnd={({ data }) => {
                    setExercisesByDay((prevExercises) => ({
                      ...prevExercises,
                      [Number(day)]: data,
                    }));
                  }}
                />
              </View>
            )
          );
        })}
      </ScrollView>
    );
  };

  const renderEditCourseForm = (finalFormVisible?: boolean) => {
    return (
      <View
        style={{
          ...styles.formContainer,
          backgroundColor: mainColor,
        }}
      >
        <View
          style={{
            ...styles.inputWrapper,
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
            value={!finalFormVisible ? courseTitle : ""}
            onChangeText={(text) => {
              setCourseTitle(text);
              validateField("title", text);
            }}
            editable={!finalFormVisible}
          />
          {finalFormVisible && (
            <ThemedText
              style={{
                ...styles.pickerValue,
                color: mainTextColor,
              }}
            >
              {courseTitle}
            </ThemedText>
          )}
          {editCourseErrors.title ? (
            <ThemedText
              style={{
                ...styles.errorText,
                color: colorScheme === "dark" ? "#FF6B6B" : "#FA5A5A",
              }}
            >
              {editCourseErrors.title}
            </ThemedText>
          ) : null}
        </View>
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
            Difficulty
          </ThemedText>
          <View style={styles.iconWrapper}>
            <Ionicons
              name="stats-chart-outline"
              size={20}
              color={colorScheme === "dark" ? "#e3e3e3" : "#222222"}
            />
          </View>

          {Platform.OS === "ios" ? (
            <>
              <TouchableWithoutFeedback
                onPress={() =>
                  !finalFormVisible && setIosDifficultyPickerVisible(true)
                }
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
                    {difficultyState && getDifficultyLabel(difficultyState)}
                  </ThemedText>
                  {!finalFormVisible && (
                    <Ionicons
                      name="chevron-down-outline"
                      size={14}
                      color="#666"
                      style={styles.dropdownIcon}
                    />
                  )}
                </View>
              </TouchableWithoutFeedback>

              <Modal
                isVisible={iosDifficultyPickerVisible}
                onBackdropPress={() => setIosDifficultyPickerVisible(false)}
                onBackButtonPress={() => setIosDifficultyPickerVisible(false)}
                animationIn="slideInUp"
                animationOut="slideOutDown"
                useNativeDriver
                hideModalContentWhileAnimating
                backdropOpacity={0.5}
                statusBarTranslucent
                style={{ margin: 0 }}
              >
                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                  {/* Backdrop that closes on tap outside */}
                  <TouchableWithoutFeedback
                    onPress={() => setIosDifficultyPickerVisible(false)}
                  >
                    <View style={{ flex: 1 }} />
                  </TouchableWithoutFeedback>

                  {/* Picker container - not wrapped in TouchableWithoutFeedback */}
                  <View
                    style={{
                      backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
                      padding: 20,
                    }}
                  >
                    <Picker
                      selectedValue={tempDifficulty}
                      onValueChange={setTempDifficulty}
                    >
                      {difficultyOptions?.map((option) => (
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
                        setDifficultyState(tempDifficulty);
                        validateField("difficulty", tempDifficulty);
                        setIosDifficultyPickerVisible(false);
                      }}
                      text="Select"
                    ></Button>
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
                  paddingRight: finalFormVisible ? 10 : 40,
                  color: mainTextColor,
                }}
              >
                {difficultyState && getDifficultyLabel(difficultyState)}
              </ThemedText>
              <Picker
                selectedValue={difficultyState}
                onValueChange={(val) => {
                  setDifficultyState(val);
                  val && validateField("difficulty", val);
                }}
                enabled={!finalFormVisible}
                style={[
                  styles.picker,
                  {
                    fontSize: 10,
                    opacity: 0.0001,
                  },
                ]}
              >
                {difficultyOptions?.map((option) => (
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
          {editCourseErrors.difficulty ? (
            <ThemedText
              style={{
                ...styles.errorText,
                color: colorScheme === "dark" ? "#FF6B6B" : "#FA5A5A",
              }}
            >
              {editCourseErrors.difficulty}
            </ThemedText>
          ) : null}
        </View>
        <View style={styles.inputWrapper}>
          <View style={styles.iconWrapper}>
            <Ionicons name="calendar-outline" size={20} color={mainTextColor} />
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
            keyboardType="numeric"
            placeholder="Number of days"
            placeholderTextColor={
              colorScheme === "dark"
                ? "rgb(170, 170, 170)"
                : "rgb(105, 105, 105)"
            }
            value={!finalFormVisible ? courseDays : ""}
            onChangeText={(text) => {
              setCourseDays(text);
              validateField("courseDays", text);
            }}
            onBlur={() => {}}
            editable={!finalFormVisible}
          />
          {finalFormVisible && (
            <ThemedText style={{ ...styles.pickerValue, color: mainTextColor }}>
              {courseDays}
            </ThemedText>
          )}
          {editCourseErrors.courseDays ? (
            <ThemedText
              style={{
                ...styles.errorText,
                color: colorScheme === "dark" ? "#FF6B6B" : "#FA5A5A",
              }}
            >
              {editCourseErrors.courseDays}
            </ThemedText>
          ) : null}
        </View>
        {!finalFormVisible && (
          <View>
            {renderDayTabs()}
            {totalExercisesForSelectedDay &&
              totalExercisesForSelectedDay?.length > 0 &&
              renderExercisesForDay()}
            {renderAvailableExercisesForDay()}
          </View>
        )}
        {finalFormVisible && renderCoursesSummary()}
      </View>
    );
  };
  //   const fetchCourse = async () => {
  //     try {
  //       const fetchedExercise = await getExerciseById(
  //         Number(exerciseId),
  //         setGetExerciseLoading
  //       );

  //       setExercise(fetchedExercise);
  //     } catch (error) {
  //       Toast.show({
  //         type: "error",
  //         text1: "Something went wrong.",
  //         position: "top",
  //       });
  //     }
  //   };

  useEffect(() => {
    // fetchCourse();
  }, []);
  const handleTagSelection = (tag: any) => {
    if (!filters.filterName) return;

    const setSelectedTags =
      filters.filterName === "exercisesForDay"
        ? setSelectedExercisesForDayTags
        : setSelectedAvailableExercisesForDayTags;

    setSelectedTags((prevState: any) => {
      const isSelected = prevState.some((t: any) => t.id === tag.id);

      return isSelected
        ? prevState.filter((t: any) => t.id !== tag.id)
        : [...prevState, tag];
    });
  };

  const selectedTags =
    filters.filterName === "exercisesForDay"
      ? selectedExercisesForDayTags
      : selectedAvailableExercisesForDayTags;

  return getCourseLoading ? (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: mainColor,
        height: "100%",
      }}
    >
      <ActivityIndicator
        size="large"
        // style={{ marginTop: 40 }}
        color={"#12a28d"}
      />
    </View>
  ) : (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/courses-bg.png")}
          style={styles.loginImage}
        />
      }
      overlay={
        <View style={styles.overlay}>
          {Number(course?.created_by) === Number(userId) && (
            <TouchableOpacity
              style={styles.editIconWrapper}
              activeOpacity={0.7}
              onPress={() => {
                setEditFormVisible(true);
              }}
            >
              <Ionicons name="create-outline" size={26} color="white" />
            </TouchableOpacity>
          )}
        </View>
      }
      logo={
        <Image
          source={require("@/assets/images/splash-logo.png")}
          style={styles.logoStyles}
        />
      }
      overlayText={
        <View style={styles.overlayTextContainer}>
          <ThemedText
            type="title"
            style={{ textAlign: "center", color: "#e3e3e3" }}
          >
            {course?.title}
          </ThemedText>
        </View>
      }
      contentStyles={{
        backgroundColor: mainColor,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back-outline" size={24} color={mainTextColor} />
      </TouchableOpacity>
      <View
        style={{
          marginLeft: "auto",
          //   justifyContent: "flex-end",
          alignItems: "flex-end",
          ...styles.courseDetails,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            marginBottom: 6,
            justifyContent: "flex-end",
            maxWidth: 300,
          }}
        >
          <View
            style={{
              ...styles.tag,
              backgroundColor: colorScheme === "dark" ? "#15413c" : "#00ffe119",
            }}
          >
            <Ionicons
              name="stats-chart-outline"
              size={18}
              color={colorScheme === "dark" ? "#e3e3e3" : "#222222"}
            />
            <ThemedText
              type="smaller"
              style={{
                ...styles.tagText,
                color: colorScheme === "dark" ? "#e3e3e3" : "#222222",
              }}
            >
              {course?.difficulty}
            </ThemedText>
          </View>
          <View
            style={{
              ...styles.tag,
              backgroundColor:
                colorScheme === "dark" ? "#212121" : "rgb(237, 239, 242)",
              // backgroundColor: "rgb(237, 239, 242)",
            }}
          >
            <Ionicons
              name="time-outline"
              size={18}
              color={colorScheme === "dark" ? "#e3e3e3" : "rgb(31, 41, 55)"}
            />
            <ThemedText
              type="smaller"
              style={{
                ...styles.tagText,
                color: colorScheme === "dark" ? "#e3e3e3" : "rgb(31, 41, 55)",
              }}
            >
              {String(course?.number_of_days)}{" "}
              {course?.number_of_days > 1 ? "days" : "day"}
            </ThemedText>
          </View>
          {userId === course?.created_by ? (
            <View
              style={{
                ...styles.tag,
                backgroundColor:
                  colorScheme === "dark" ? "#212121" : "rgb(237, 239, 242)",
                // backgroundColor: "rgb(237, 239, 242)",
              }}
            >
              <Ionicons
                name="person-outline"
                size={14}
                color={colorScheme === "dark" ? "#e3e3e3" : "rgb(31, 41, 55)"}
              />
              <ThemedText
                type="smaller"
                style={{
                  ...styles.tagText,
                  color: colorScheme === "dark" ? "#e3e3e3" : "rgb(31, 41, 55)",
                }}
              >
                Private
              </ThemedText>
            </View>
          ) : (
            <View
              style={{
                ...styles.tag,
                backgroundColor:
                  colorScheme === "dark" ? "#212121" : "rgb(237, 239, 242)",
                // backgroundColor: "rgb(237, 239, 242)",
              }}
            >
              <Ionicons
                name="person-outline"
                size={14}
                color={colorScheme === "dark" ? "#e3e3e3" : "rgb(31, 41, 55)"}
              />
              <ThemedText
                type="smaller"
                style={{
                  ...styles.tagText,
                  color: colorScheme === "dark" ? "#e3e3e3" : "rgb(31, 41, 55)",
                }}
              >
                Public
              </ThemedText>
            </View>
          )}
        </View>
      </View>
      <View
        style={{
          paddingTop: 30,
          paddingBottom: 40,
        }}
      >
        <ThemedText type="subtitle">Class Exercises</ThemedText>
        {course?.days?.map((courseDay: any, i: number) => {
          return (
            <View
              style={{
                marginTop: 20,
              }}
              key={i}
            >
              <ThemedText
                type="subtitle"
                style={{ fontSize: 16, paddingBottom: 10 }}
              >
                Day {courseDay.day_number}
              </ThemedText>
              {courseDay?.exercises &&
                courseDay?.exercises.length > 0 &&
                courseDay?.exercises?.map((exercise: any, index: number) => {
                  const {
                    name,
                    videos,
                    duration_in_seconds,
                    exercise_tags,
                    images,
                  } = exercise.exercise;

                  const thumbnailImage =
                    images?.find(
                      (img: any) => img.id === exercise.thumbnail_image
                    )?.file_path ?? images?.[0]?.file_path;

                  const { hours, minutes, seconds } = convertSeconds(
                    Number(duration_in_seconds)
                  );

                  return (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      key={index}
                      style={{
                        ...styles.workoutWrapper,
                        backgroundColor:
                          colorScheme === "dark" ? "#000" : "#fff",
                        borderColor:
                          colorScheme === "dark"
                            ? "rgba(100, 100, 100, 1)"
                            : "rgb(233, 233, 233)",
                        shadowColor:
                          colorScheme === "dark" ? "#fff" : "#393939",
                        elevation: colorScheme === "dark" ? 2 : 1.1,
                      }}
                      onPress={() => {
                        router.push({
                          pathname: "/single-workout",
                          params: { exerciseId: String(exercise.exercise?.id) },
                        });
                      }}
                    >
                      <View
                        style={{
                          position: "absolute",
                          top: "50%",
                          transform: "translate(0, -50%)",
                          right: 0,
                          pointerEvents: "none",
                        }}
                      >
                        <Ionicons
                          name="chevron-forward-outline"
                          size={18}
                          color={mainTextColor}
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
                          contentFit="cover"
                          cachePolicy="disk"
                        />
                      </View>
                      <View style={styles.workoutInfo}>
                        <ThemedText
                          type={"smaller"}
                          style={{
                            fontFamily: "Default-Medium",
                          }}
                        >
                          {name}
                        </ThemedText>
                        <View
                          style={{
                            marginTop: 6,
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          <Ionicons
                            name="time-outline"
                            size={18}
                            color={mainTextColor}
                          />
                          <ThemedText
                            type="smaller"
                            style={{
                              fontSize: 12,
                              lineHeight: 15,
                            }}
                          >
                            {hours > 0 ? ` ${hours}h` : ""}
                            {minutes > 0 ? ` ${minutes}min` : ""}
                            {seconds > 0 ? ` ${seconds}sec` : ""}
                          </ThemedText>
                        </View>
                        <View style={styles.tagsContainer}>
                          {exercise_tags?.map((tag: any, tagIndex: number) => (
                            <View
                              key={tagIndex}
                              style={{
                                ...styles.tag,
                                backgroundColor:
                                  colorScheme === "dark"
                                    ? "#15413c"
                                    : "#00ffe119",
                              }}
                            >
                              <ThemedText
                                type="smaller"
                                style={{
                                  ...styles.tagText,
                                  color:
                                    colorScheme === "dark"
                                      ? "#e3e3e3"
                                      : "#000000",
                                  fontSize: 11,
                                }}
                              >
                                {tag?.name}
                              </ThemedText>
                            </View>
                          ))}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </View>
          );
        })}
      </View>
      <Modal
        isVisible={editFormVisible}
        onBackdropPress={() => setEditFormVisible(false)}
        onBackButtonPress={() => setEditFormVisible(false)}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        useNativeDriver
        hideModalContentWhileAnimating
        backdropOpacity={0.5}
        statusBarTranslucent
        style={{ margin: 0 }}
      >
        <View style={{ flex: 1, backgroundColor: mainColor }}>
          {selectedGroup && !exercisesLoading && (
            <TouchableOpacity
              style={{
                ...styles.addButton,
                right: "auto",
                left: 20,
                bottom: 40,
              }}
              onPress={() => {
                setSelectedGroup(null);
                // setSearchVal("");
                // setSelectedTags([])
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-undo-outline" size={28} color="#fff" />
            </TouchableOpacity>
          )}
          {filters.visible && (
            <TouchableWithoutFeedback
              onPress={() => {
                setFilters((prevState) => ({
                  ...prevState,
                  visible: false,
                }));
              }}
            >
              <View
                style={{
                  ...styles.modalOverlay,
                  zIndex: 99999,
                }}
              />
            </TouchableWithoutFeedback>
          )}
          <View
            style={{
              ...styles.overlayHeader,
              backgroundColor: colorScheme === "dark" ? "#15413c" : "#e6f7f5",
            }}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setEditFormVisible(false);
              }}
            >
              <Ionicons name="close-outline" size={28} color={mainTextColor} />
            </TouchableOpacity>
            <View style={styles.headerTextWrapper}>
              <View>
                <ThemedText type="title" style={styles.headerText}>
                  Edit Class
                </ThemedText>
              </View>
            </View>
            <TouchableOpacity
              style={styles.successIcon}
              onPress={() => {
                if (validateForm()) {
                  setSummaryVisible(true);
                }
              }}
            >
              {editCourseLoading ? (
                <ActivityIndicator
                  size="small"
                  // style={{ marginTop: 40 }}
                  color={"#12a28d"}
                />
              ) : (
                <Ionicons
                  name="arrow-forward-outline"
                  size={24}
                  color={mainTextColor}
                />
              )}
            </TouchableOpacity>
          </View>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <FlatList
              data={[renderEditCourseForm()]}
              renderItem={({ item }) => item}
              keyExtractor={(_, index) => index.toString()}
            />
          </GestureHandlerRootView>
          {editFormVisible && (
            <Toast
              config={{
                error: (props) => (
                  <ErrorToast {...props} text1NumberOfLines={2} />
                ),
              }}
            />
          )}
        </View>
        <Modal
          isVisible={filters.visible}
          onBackdropPress={() =>
            setFilters((prevState) => ({ ...prevState, visible: false }))
          }
          onBackButtonPress={() =>
            setFilters((prevState) => ({ ...prevState, visible: false }))
          }
          animationIn="slideInUp"
          animationOut="slideOutDown"
          useNativeDriver
          hideModalContentWhileAnimating
          backdropOpacity={0.5}
          statusBarTranslucent
          style={{ margin: 0 }}
        >
          {filters.visible && (
            <TouchableWithoutFeedback
              onPress={() =>
                setFilters((prevState) => ({ ...prevState, visible: false }))
              }
            >
              <View
                style={{
                  ...styles.modalOverlay,
                  backgroundColor: "transparent",
                }}
              />
            </TouchableWithoutFeedback>
          )}

          <View style={StyleSheet.absoluteFill}>
            <View style={styles.modalContainer}>
              <View
                style={{
                  ...styles.modalContent,
                  backgroundColor:
                    colorScheme === "dark" ? "#212121" : mainColor,
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{
                    ...styles.closeButton,
                    marginBottom: 0,
                  }}
                  onPress={() =>
                    setFilters((prevState) => ({
                      ...prevState,
                      visible: false,
                    }))
                  }
                >
                  <Ionicons
                    name="close-outline"
                    size={24}
                    color={mainTextColor}
                  />
                </TouchableOpacity>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                  {filters.filterName === "courses" ? (
                    <View></View>
                  ) : (
                    exerciseTagsPerGroup?.map(
                      (tagGroup: any, index: number) => {
                        const selectedTagsIds = selectedTags.map(
                          (tag: any) => tag.id
                        );

                        return (
                          tagGroup.exercise_tags_set?.length > 0 && (
                            <View key={tagGroup.id}>
                              <ThemedText
                                type="subtitle"
                                style={{
                                  marginBottom: 8,
                                  fontSize: 14,
                                  textTransform: "capitalize",
                                }}
                              >
                                {tagGroup?.name}
                              </ThemedText>
                              <View
                                style={{
                                  flexDirection: "row",
                                  columnGap: 20,
                                  rowGap: 10,
                                  marginBottom:
                                    exerciseTagsPerGroup.length - 1 !== index
                                      ? 20
                                      : 0,
                                  flexWrap: "wrap",
                                }}
                              >
                                {tagGroup.exercise_tags_set?.map((tag: any) => (
                                  <TouchableOpacity
                                    key={tag.id}
                                    activeOpacity={0.7}
                                    style={{ flexDirection: "row", gap: 4 }}
                                    onPress={() => handleTagSelection(tag)}
                                  >
                                    <View style={styles.checkbox}>
                                      <Ionicons
                                        name={
                                          selectedTagsIds.includes(tag.id)
                                            ? "checkbox"
                                            : "square-outline"
                                        }
                                        size={24}
                                        color={
                                          selectedTagsIds.includes(tag.id)
                                            ? "#12a28d"
                                            : "#888"
                                        }
                                      />
                                    </View>
                                    <ThemedText
                                      style={{
                                        textTransform: "capitalize",
                                        fontSize: 12,
                                      }}
                                    >
                                      {tag?.name}
                                    </ThemedText>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                          )
                        );
                      }
                    )
                  )}
                </ScrollView>
              </View>
            </View>
          </View>
        </Modal>
        <Modal
          isVisible={summaryVisible}
          onBackdropPress={() => setSummaryVisible(false)}
          onBackButtonPress={() => setSummaryVisible(false)}
          animationIn="slideInUp"
          animationOut="slideOutDown"
          useNativeDriver
          hideModalContentWhileAnimating
          backdropOpacity={0.5}
          statusBarTranslucent
          style={{ margin: 0 }}
        >
          <View style={{ flex: 1, backgroundColor: mainColor, width: "100%" }}>
            {filters.visible && (
              <TouchableWithoutFeedback
                onPress={() => {
                  setFilters((prevState) => ({
                    ...prevState,
                    visible: false,
                  }));
                }}
              >
                <View
                  style={{
                    ...styles.modalOverlay,
                    zIndex: 99999,
                  }}
                />
              </TouchableWithoutFeedback>
            )}
            <View
              style={{
                ...styles.overlayHeader,
                backgroundColor: colorScheme === "dark" ? "#15413c" : "#e6f7f5",
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setSummaryVisible(false);
                }}
              >
                <Ionicons
                  name="arrow-back-outline"
                  size={28}
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
                  left: -7,
                }}
                onPress={() => {
                  if (validateForm()) {
                    editCourseHandler();
                  }
                }}
              >
                {editCourseLoading ? (
                  <ActivityIndicator size="small" color={"#12a28d"} />
                ) : (
                  <Ionicons
                    name="add-circle-outline"
                    size={24}
                    color={mainTextColor}
                  />
                )}
              </TouchableOpacity>
            </View>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <FlatList
                data={[renderEditCourseForm(true)]}
                renderItem={({ item }) => item}
                keyExtractor={(_, index) => index.toString()}
              />
            </GestureHandlerRootView>
          </View>
          <Toast />
        </Modal>
      </Modal>
      {/* <Modal
        transparent
        visible={filters.visible}
        // animationType="slide"
        onRequestClose={() =>
          setFilters((prevState) => ({ ...prevState, visible: false }))
        }
        // statusBarTranslucent
      >
        {filters.visible && (
          <TouchableWithoutFeedback
            onPress={() =>
              setFilters((prevState) => ({ ...prevState, visible: false }))
            }
          >
            <View
              style={{
                ...styles.modalOverlay,
                backgroundColor: "transparent",
              }}
            />
          </TouchableWithoutFeedback>
        )}

        <View style={StyleSheet.absoluteFill}>
          <View style={styles.modalContainer}>
            <View
              style={{
                ...styles.modalContent,
                backgroundColor: colorScheme === "dark" ? "#212121" : mainColor,
              }}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                style={{
                  ...styles.closeButton,
                  marginBottom: 0,
                }}
                onPress={() =>
                  setFilters((prevState) => ({ ...prevState, visible: false }))
                }
              >
                <Ionicons
                  name="close-outline"
                  size={24}
                  color={mainTextColor}
                />
              </TouchableOpacity>

              <ScrollView contentContainerStyle={styles.scrollContent}>
                {filters.filterName === "courses" ? (
                  <View></View>
                ) : (
                  exerciseTagsPerGroup?.map((tagGroup: any, index: number) => {
                    const selectedTagsIds = selectedTags?.map(
                      (tag: any) => tag.id
                    );

                    return (
                      tagGroup.exercise_tags_set?.length > 0 && (
                        <View key={tagGroup.id}>
                          <ThemedText
                            type="subtitle"
                            style={{
                              marginBottom: 8,
                              fontSize: 14,
                              textTransform: "capitalize",
                            }}
                          >
                            {tagGroup.name}
                          </ThemedText>
                          <View
                            style={{
                              flexDirection: "row",
                              columnGap: 20,
                              rowGap: 10,
                              marginBottom:
                                exerciseTagsPerGroup.length - 1 !== index
                                  ? 20
                                  : 0,
                              flexWrap: "wrap",
                            }}
                          >
                            {tagGroup.exercise_tags_set?.map((tag: any) => (
                              <TouchableOpacity
                                key={tag.id}
                                activeOpacity={0.7}
                                style={{ flexDirection: "row", gap: 4 }}
                                onPress={() => handleTagSelection(tag)}
                              >
                                <View style={styles.checkbox}>
                                  <Ionicons
                                    name={
                                      selectedTagsIds.includes(tag.id)
                                        ? "checkbox"
                                        : "square-outline"
                                    }
                                    size={24}
                                    color={
                                      selectedTagsIds.includes(tag.id)
                                        ? "#12a28d"
                                        : "#888"
                                    }
                                  />
                                </View>
                                <ThemedText
                                  style={{
                                    textTransform: "capitalize",
                                    fontSize: 12,
                                  }}
                                >
                                  {tag.name}
                                </ThemedText>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      )
                    );
                  })
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal> */}
      {/* <Modal
        visible={summaryVisible}
        animationType="slide"
        onRequestClose={() => {
          setSummaryVisible(false);
        }}
        statusBarTranslucent
      >
        <View style={{ flex: 1, backgroundColor: mainColor }}>
          {filters.visible && (
            <TouchableWithoutFeedback
              onPress={() => {
                setFilters((prevState) => ({
                  ...prevState,
                  visible: false,
                }));
              }}
            >
              <View
                style={{
                  ...styles.modalOverlay,
                  zIndex: 99999,
                }}
              />
            </TouchableWithoutFeedback>
          )}
          <View
            style={{
              ...styles.overlayHeader,
              backgroundColor: colorScheme === "dark" ? "#15413c" : "#e6f7f5",
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setSummaryVisible(false);
              }}
            >
              <Ionicons
                name="arrow-back-outline"
                size={28}
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
              style={styles.successIcon}
              onPress={() => {
                if (validateForm()) {
                  editCourseHandler();
                }
              }}
            >
              {editCourseLoading ? (
                <ActivityIndicator size="small" color={"#12a28d"} />
              ) : (
                <Ionicons
                  name="checkmark-outline"
                  size={32}
                  color={mainTextColor}
                />
              )}
            </TouchableOpacity>
          </View>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <FlatList
              data={[renderEditCourseForm(true)]}
              renderItem={({ item }) => item}
              keyExtractor={(_, index) => index.toString()}
            />
          </GestureHandlerRootView>
        </View>
        <Toast />
      </Modal> */}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  containerWrapper: {
    backgroundColor: "white",
    flex: 1,
  },
  backButton: {
    position: "absolute",
    top: 0,
    left: 20,
    zIndex: 1,
  },
  courseDetails: {
    position: "absolute",
    top: 0,
    right: 20,
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
  },
  workoutInfo: {
    flex: 2.5,
    justifyContent: "center",
    paddingLeft: 10,
    paddingVertical: 10,
  },
  container: {
    paddingTop: 30,
    // flexGrow: 1,
    // alignItems: "center",
    // paddingHorizontal: 20,
    // paddingVertical: 40,
    // paddingTop: 120,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
  },
  input: {
    flexGrow: 1,
    maxWidth: "90%",
    height: 50,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  passwordContainer: {
    position: "relative",
    justifyContent: "center",
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
    top: 15,
  },
  errorText: {
    color: "red",
    fontSize: 10,
    position: "absolute",
    bottom: -4,
    right: 0,
    pointerEvents: "none",
    userSelect: "none",
  },
  // inputLabel: {
  //   alignSelf: "flex-start",
  //   marginBottom: 0,
  //   color: "rgba(0, 0, 0, 0.6)",
  //   paddingLeft: 12,
  //   fontSize: 13,
  //   lineHeight: 15,
  // },
  inputLabel: {
    fontSize: 14,
    color: "#666",
    position: "absolute",
    top: 10,
    left: 40,
  },
  loginImage: {
    height: "100%",
    width: "100%",
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  logoStyles: {
    width: 55,
    height: 46,
    position: "absolute",
    top: 30,
    left: 30,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 178, 190, 0.5)",
  },
  overlayTextContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
    paddingHorizontal: 10,
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    justifyContent: "center",
  },
  expandText: {
    color: "#12a28d",
    fontSize: 16,
    marginRight: 6,
  },
  workoutImagesWrapper: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
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
    fontSize: 13,
    color: "#12a28d",
  },
  editIconWrapper: {
    borderRadius: 999,
    // padding: 8,
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: 40,
    right: 10,
    zIndex: 999999,
    backgroundColor: "#12a28d",
  },
  overlayHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingBottom: 15,
    paddingTop: 50,
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
  formContainer: {
    paddingVertical: 20,
    paddingHorizontal: 18,
    paddingRight: 30,
    paddingBottom: 80,
    flexDirection: "column",
    alignItems: "center",
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
  selectedTag: {
    backgroundColor: "#12a28d",
  },
  selectedTagText: {
    color: "#fff",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    width: "100%",
  },
  checkbox: {},
  successIcon: {
    paddingHorizontal: 8,
    marginLeft: "auto",
  },
  // pickerWrapper: {
  //   paddingVertical: 15,
  //   borderWidth: 1,
  //   borderStyle: "dashed",
  //   borderColor: "rgba(46, 161, 174, 1)",
  //   borderRadius: 8,
  //   backgroundColor: "rgba(46, 161, 174, 0.05)",
  //   display: "flex",
  //   alignItems: "center",
  // },
  pickerWrapper: {
    // borderRadius: 5,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    height: 46,
    position: "relative",
    flexGrow: 1,
    maxWidth: "90%",
    // width: "90%"
  },
  imageContainer: {
    position: "relative",
    marginTop: 10,
  },
  previewImage: {
    width: 80,
    height: 80,
    marginRight: 4,
    borderRadius: 6,
  },
  removeButton: {
    position: "absolute",
    top: -6,
    right: -6,
    padding: 10,
  },
  imageSelected: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: "50%",
    borderWidth: 2,
    borderColor: "rgba(46, 161, 174, 1)",
  },
  imageSelectedFill: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 10,
    height: 10,
    backgroundColor: "rgba(46, 161, 174, 1)",
    borderRadius: "50%",
  },
  selectedImageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(46, 161, 174, 0.5)",
    zIndex: 99,
    // borderRadius: 6,
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
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 15,
    maxHeight: "70%",
  },
  closeButton: {
    alignSelf: "flex-end",
    marginBottom: 10,
  },
  keyboardAvoidingView: {
    position: "absolute",
    width: "100%",
    bottom: 0,
    zIndex: 10,
  },
  workoutWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#f7fbfb",
    borderRadius: 10,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 1.1,
    // borderWidth: 1,
    // borderColor: "#E5E5E5",
    position: "relative",
    paddingRight: 10,
    borderWidth: 0.2,
  },
  workoutImageWrapper: {
    flex: 1.5,
    height: "100%",
    overflow: "hidden",
    borderRadius: 10,
    aspectRatio: "1/1",
  },
  workoutImage: {
    width: "100%",
    height: "100%",
  },
  pickerValue: {
    position: "absolute",
    bottom: 6,
    paddingRight: 10,
    width: "100%",
    textAlign: "right",
    color: "#000000",
    fontSize: 14,
    textTransform: "capitalize",
    pointerEvents: "none",
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
  dropdownIcon: {
    position: "absolute",
    bottom: 12,
    right: 0,
  },
  daysTabsContainer: {
    marginTop: 15,
    marginBottom: 10,
    height: 40,
    minWidth: "100%",
  },
  tabsScrollView: {
    // paddingHorizontal: 15,
  },
  dayTab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 9,
    minWidth: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dayTabActive: {
    backgroundColor: "#12a28d", // Your teal color
  },
  dayTabInactive: {
    backgroundColor: "#2dd4be14", // Light gray
  },
  dayTabText: {
    fontSize: 14,
    fontFamily: "Default-Medium",
    lineHeight: 15,
  },
  dayTabTextActive: {
    color: "#FFFFFF",
  },
  dayTabTextInactive: {
    // color: "#707070",
  },
  dayTabTextError: {
    color: "red",
  },
  filterTag: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 15,
    paddingRight: 5,
    flexDirection: "row",
    gap: 3,
    alignItems: "center",
    // marginHorizontal: 5,
  },
  filterTagSelected: {
    backgroundColor: "#12a28d",
    borderColor: "#12a28d",
  },
  filterText: {
    fontSize: 14,
    lineHeight: 16,
    // textTransform: "capitalize"
  },
  filterTextSelected: {
    color: "#fff",
  },
  filtersContainer: {
    flexDirection: "row",
    marginTop: 20,
    flexWrap: "wrap",
    paddingHorizontal: 10,
  },
  filterContainer: {
    position: "relative",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  scrollContent: {
    paddingBottom: 20,
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
  doneButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  doneButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
