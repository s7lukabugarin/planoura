import {
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
  StatusBar,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from "react-native";
import Modal from "react-native-modal";
import { Image } from "expo-image";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useCallback, useEffect, useState } from "react";
import { useExercises } from "@/context/excersisesContext";
import { useTags } from "@/context/tagsContext";
import { useRouter } from "expo-router";
import {
  Exercise,
  ExerciseGroup,
  getAllExercicesGroups,
  getAllExercisesForGroup,
} from "@/api/exercices";
import Toast, { ErrorToast } from "react-native-toast-message";
import { useIsFocused } from "@react-navigation/native";
import DraggableFlatList from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
// import { courses } from "@/dummyData/courses";
import { useCourses } from "@/context/coursesContext";
import { createCourse, CreateCourseData } from "@/api/courses";
import { useAuth } from "@/context/authContext";
import { cloneDeep } from "lodash";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { convertSeconds } from "@/helpers/convertSeconds";
import Constants from "expo-constants";
import Button from "@/components/Button";

type Difficulty = {
  id: number;
  name: string;
};

const difficultyOptions: { label: string; value: string }[] = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
];

const visibilityOptions = [
  { label: "Public", value: "public" },
  { label: "Private", value: "private" },
];

export default function CoursesScreen({ navigation }: any) {
  const [iosDifficultyPickerVisible, setIosDifficultyPickerVisible] =
    useState(false);

  const colorScheme = useColorScheme();

  const [exercises, setExercises] = useState<any>(null);
  const [exercisesLoading, setExercisesLoading] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState<ExerciseGroup | null>(
    null
  );
  const [groupsLoading, setGroupsLoading] = useState(null);
  const [groups, setGroups] = useState<ExerciseGroup[] | null>(null);

  const mainTextColor = useThemeColor({}, "mainText");
  const mainColor = useThemeColor({}, "main");

  const { userId } = useAuth();

  const [emptyDays, setEmptyDays] = useState<any>([]);

  const isFocused = useIsFocused();

  const [summaryVisible, setSummaryVisible] = useState(false);

  const [originalOrder, setOriginalOrder] = useState<Exercise[]>([]);

  const [selectedDay, setSelectedDay] = useState(1);
  const [exercisesByDay, setExercisesByDay] = useState<{
    [key: number]: Exercise[];
  }>({});
  const [selectedExercisesForDayTags, setSelectedExercisesForDayTags] =
    useState([]);

  const [
    selectedAvailableExercisesForDayTags,
    setSelectedAvailableExercisesForDayTags,
  ] = useState([]);

  const router = useRouter();

  const [createCourseVisible, setCreateCourseVisible] = useState(false);
  const [createCourseLoading, setCreateCourseLoading] = useState(false);

  const [filters, setFilters] = useState<{
    visible: boolean;
    filterName: "" | "exercisesForDay" | "availableExercisesForDay" | "courses";
  }>({
    visible: false,
    filterName: "",
  });

  const [searchValCourses, setSearchValCourses] = useState("");
  const [searchValForDay, setSearchValForDay] = useState("");
  const [searchValAvailableForDay, setSearchValAvailableForDay] = useState("");

  const [selectedVisibility, setSelectedVisibility] = useState<any[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<
    Difficulty[]
  >([]);

  const [courseTitle, setCourseTitle] = useState("");
  const [difficultyState, setDifficultyState] = useState("");
  const [tempDifficulty, setTempDifficulty] = useState(difficultyState);

  const [courseDays, setCourseDays] = useState("");

  const [createCourseErrors, setCreateCourseErrors] = useState({
    title: "",
    difficulty: "",
    courseDays: "",
  });

  const { fetchExercises } = useExercises();
  const { fetchCourses, courses, loading: coursesLoading } = useCourses();
  const {
    // fetchTags, tags,
    fetchExerciseTagsPerGroup,
    exerciseTagsPerGroup,
  } = useTags();

  const handleVisibilitySelection = (option: any) => {
    const selectedValues = selectedVisibility.map((v) => v.value);

    if (selectedValues.includes(option.value)) {
      setSelectedVisibility((prevState) =>
        prevState.filter((item) => item.value !== option.value)
      );
    } else {
      setSelectedVisibility((prevState) => [...prevState, option]);
    }
  };

  const getCourseVisibility = (course: any) => {
    return Number(userId) === Number(course.created_by) ? "private" : "public";
  };

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
    fetchCourses();
    // fetchExercises();
    // fetchTags();
    // fetchExerciseTagsPerGroup();
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

  const totalExercisesForSelectedDay =
    (exercisesByDay && exercisesByDay[selectedDay]) || [];

  const filteredExercisesForSelectedDay = totalExercisesForSelectedDay
    ?.filter((exercise) =>
      selectedExercisesForDayTags?.length
        ? exercise.exercise_tags.some((tag) =>
            selectedExercisesForDayTags
              ?.map((t: any) => t.name)
              .includes(tag.name)
          )
        : true
    )
    ?.filter((exercise) =>
      exercise.name?.toLowerCase().includes(searchValForDay?.toLowerCase())
    );

  const totalAvailableExercisesForDay = exercises?.filter((exercise: any) => {
    return !totalExercisesForSelectedDay
      ?.map((e) => e.id)
      ?.includes(exercise.id);
  });

  const filteredAvailableExercisesForDay = totalAvailableExercisesForDay
    ?.filter((exercise: any) =>
      selectedAvailableExercisesForDayTags?.length
        ? exercise.exercise_tags.some((tag: any) =>
            selectedAvailableExercisesForDayTags
              ?.map((t: any) => t.name)
              .includes(tag.name)
          )
        : true
    )
    ?.filter((exercise: any) =>
      exercise.name
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
    if (totalExercisesForSelectedDay?.length > 0 && !originalOrder?.length) {
      setOriginalOrder(totalExercisesForSelectedDay);
    }
  }, [totalExercisesForSelectedDay]);

  useEffect(() => {
    if (courseDays && !isNaN(parseInt(courseDays))) {
      initializeDaysState(parseInt(courseDays));
    }
  }, [courseDays]);

  const validateField = (
    field: "title" | "difficulty" | "courseDays",
    value: string
  ) => {
    const newErrors = { ...createCourseErrors };

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

    setCreateCourseErrors(newErrors);
  };

  const createCourseHandler = async () => {
    try {
      const safeExercisesByDay = cloneDeep(exercisesByDay);

      const formattedCourseDays = Object.keys(safeExercisesByDay)
        .filter((dayKey) => !isNaN(parseInt(dayKey, 10)))
        .map((dayNumber) => ({
          day_number: parseInt(dayNumber, 10),
          exercise_ids: Array.isArray(safeExercisesByDay[Number(dayNumber)])
            ? safeExercisesByDay[Number(dayNumber)].map(
                (exercise) => exercise.id
              )
            : [],
        }));

      const dataToSend = {
        // created_by: Number(userId) || 1,
        title: courseTitle,
        difficulty: difficultyState,
        number_of_days: Number(courseDays),
        days: formattedCourseDays,
      };

      const createdCourse = await createCourse(
        // @ts-ignore
        dataToSend,
        setCreateCourseLoading
      );

      if (createdCourse) {
        setSummaryVisible(false);
        setCreateCourseVisible(false);
        fetchCourses();
        setTimeout(() => {
          Toast.show({
            type: "success",
            text1: "Course created.",
            position: "top",
          });
        }, 500);
      }
    } catch (error) {
      console.error("Error in createCourseHandler:", error);
    }
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
          source={require("@/assets/images/splash-logo-white.png")}
          style={styles.logoStyles}
        />
        <ThemedText
          type="subtitle"
          style={{ color: "#fff", paddingTop: 8, fontSize: 18 }}
        >
          Classes
        </ThemedText>
      </View>
      <View style={styles.filterContainer}>
        {difficulties && difficulties?.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={{
              ...styles.filterButton,
              left: 10,
            }}
            onPress={() =>
              setFilters((prevState) => ({
                ...prevState,
                visible: true,
                filterName: "courses",
              }))
            }
          >
            <Ionicons name={"funnel-outline"} size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

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

    if (!exercisesByDay || Object.keys(exercisesByDay)?.length === 0) {
      // newErrors.exercisesByDay = "Exercises per day are required.";
      isValid = false;
    } else {
      const emptyDays = Object.entries(exercisesByDay).filter(
        ([_, exercises]) => exercises?.length === 0
      );

      const mappedEmptyDays = emptyDays.map(([day]) => day);

      setEmptyDays(mappedEmptyDays);

      if (emptyDays?.length > 0) {
        Toast.show({
          type: "error",
          text1: `Each day must have at least one exercise. Empty days: ${emptyDays
            .map(([day]) => day)
            .join(", ")}`,
          position: "top",
        });
        isValid = false;
      }
    }

    setCreateCourseErrors(newErrors);
    return isValid;
  };

  const getDifficultyLabel = (value: string): string => {
    const option = difficultyOptions.find((item) => item.value === value);
    return option ? option.label : "";
  };

  const removeExerciseFromDay = (exerciseId: number, day: number) => {
    setExercisesByDay((prev) => ({
      ...prev,
      [day]: prev[day].filter((ex) => ex.id !== exerciseId),
    }));
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
          {Array.from({ length: numberOfDays }, (_, i) => i + 1).map((day) => (
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

  const renderExerciseForDayItem = ({
    item,
    drag,
    isActive,
    shorter,
    day,
  }: any) => {
    const thumbnailImage =
      item.images?.find((img: any) => img.id === item.thumbnail_image)
        ?.file_path ?? item?.images?.[0]?.file_path;

    const { hours, minutes, seconds } = convertSeconds(
      Number(item.duration_in_seconds)
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
        onLongPress={drag}
      >
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => {
            if (day) {
              removeExerciseFromDay(item.id, day);
            } else {
              removeExerciseFromDay(item.id, selectedDay);
            }
            // const day = shorter ? selectedDay : selectedDay;
            // removeExerciseFromDay(item.id, day);
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
              {hours > 0 ? ` ${hours}h` : ""}
              {minutes > 0 ? ` ${minutes}min` : ""}
              {seconds > 0 ? ` ${seconds}sec` : ""}
            </ThemedText>
          </View>
          {!shorter && (
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
                activeOpacity={0.7}
                style={styles.filterButton}
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
              // paddingHorizontal: 15,
              // paddingLeft: 10,
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
            selectedExercisesForDayTags?.length > 0 && (
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
                        {t.name}
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
                maxHeight: filteredExercisesForSelectedDay?.length * 180,
              }}
            >
              <DraggableFlatList
                dragHitSlop={{ top: -10, left: -10 }}
                key={`${filters.visible}-${summaryVisible}`}
                data={filteredExercisesForSelectedDay}
                renderItem={renderExerciseForDayItem}
                keyExtractor={(item) => item.id.toString()}
                dragItemOverflow={true}
                onDragEnd={({ data }) => {
                  setExercisesByDay((prevExercises) => {
                    const fullList = prevExercises[selectedDay] || [];

                    const newOrderMap = new Map(
                      data.map((exercise, index) => [exercise.id, index])
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
            //         paddingRight: 40,
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
                  selectedExercisesForDayTags?.length > 0
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
            paddingBottom: 40,
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
            {selectedGroup && (
              <ThemedText type="defaultSemiBold">
                Available Exercises
              </ThemedText>
            )}
            {selectedGroup && (
              <View style={styles.filterContainer}>
                <TouchableOpacity
                  style={styles.filterButton}
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
            selectedAvailableExercisesForDayTags?.length > 0 &&
            selectedGroup && (
              <View
                style={{
                  ...styles.filtersContainer,
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 6,
                  marginTop: 0,
                }}
              >
                {selectedAvailableExercisesForDayTags.map((t: any) => {
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
                        {t.name}
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
          {filteredAvailableExercisesForDay?.length > 0 && selectedGroup && (
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
                {filteredAvailableExercisesForDay.map(
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
                    fontSize: 16,
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
                          {group.name}
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
      <View
        style={{
          width: "100%",
        }}
      >
        {Object.entries(exercisesByDay).map(([day, exercises]) => {
          return (
            exercises &&
            exercises?.length > 0 && (
              <View key={day}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    marginBottom: 8,
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
                      paddingTop: selectedDifficulties?.length > 0 ? 10 : 20,
                      paddingRight: 10,
                      paddingBottom: 5,
                      textAlign: "right",
                    }}
                  >
                    Total Duration:{" "}
                    {exercises
                      ?.map((e) => e.duration_in_seconds)
                      ?.reduce((acc, num) => acc + num, 0)}{" "}
                    min
                  </ThemedText>
                </View>
                <DraggableFlatList
                  dragHitSlop={{ top: -10, left: -10 }}
                  key={`${filters.visible}-${summaryVisible}`}
                  data={exercises}
                  renderItem={(obj) => {
                    return renderExerciseForDayItem({
                      ...obj,
                      shorter: true,
                      day,
                    });
                  }}
                  keyExtractor={(item) => item.id.toString()}
                  dragItemOverflow={true}
                  onDragEnd={({ data }) => {
                    setExercisesByDay((prevExercises) => {
                      const fullList = prevExercises[Number(day)] || [];

                      const newOrderMap = new Map(
                        data.map((exercise, index) => [exercise.id, index])
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
                        [day]: newFullList,
                      };
                    });
                  }}
                />
                {/* {exercises.map((exercise: Exercise, index: number) => {
                  const thumbnailImage = exercise.images?.find(
                    (img: any) => img.id === exercise.thumbnail_image
                  )?.file_path;
                  return (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      key={exercise.id}
                      style={{
                        ...styles.workoutWrapper,
                        paddingRight: 40,
                      }}
                    >
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeExerciseFromDay(exercise.id)}
                      >
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color="#f84c4cd2"
                        />
                      </TouchableOpacity>
                      <View
                        style={{
                          position: "absolute",
                          top: "50%",
                          right: -15,
                          transform: "translate(0, -50%)",
                          padding: 20,
                        }}
                      >
                        <Ionicons
                          name="reorder-four-outline"
                          size={24}
                          color="#555"
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
                            color: "#000",
                            fontFamily: "Default-Medium",
                          }}
                        >
                          {exercise.name}
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
                            color="rgba(22, 22, 22, 1)"
                          />
                          <ThemedText
                            type="smaller"
                            style={{
                              marginLeft: 3,
                              color: "#000",
                              fontSize: 12,
                              lineHeight: 15,
                              paddingTop: 3,
                            }}
                          >
                            {exercise.duration_in_seconds} min
                          </ThemedText>
                        </View>
         
                      </View>
                    </TouchableOpacity>
                  );
                })} */}
              </View>
            )
          );
        })}
      </View>
    );
  };

  const renderCreateCourseForm = (finalFormVisible?: boolean) => {
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
                paddingRight: 30,
              }}
            >
              {courseTitle}
            </ThemedText>
          )}
          {createCourseErrors.title ? (
            <ThemedText
              style={{
                ...styles.errorText,
                color: colorScheme === "dark" ? "#FF6B6B" : "#FA5A5A",
              }}
            >
              {createCourseErrors.title}
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
                onPress={() => {
                  setTempDifficulty(
                    difficultyState || difficultyOptions[0].value
                  );
                  setIosDifficultyPickerVisible(true);
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
                      paddingRight: 30,
                    }}
                  >
                    {difficultyState && getDifficultyLabel(difficultyState)}
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

                  <View
                    style={{
                      backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
                      padding: 20,
                      paddingBottom: 40,
                    }}
                  >
                    <Picker
                      selectedValue={tempDifficulty}
                      onValueChange={(itemValue) => {
                        setTempDifficulty(itemValue); // Only update temp value
                      }}
                    >
                      {difficultyOptions.map((option) => (
                        <Picker.Item
                          key={option.value}
                          label={option.label}
                          value={option.value}
                        />
                      ))}
                    </Picker>

                    {/* Done button to confirm selection */}
                    <Button
                      buttonStyle={{
                        backgroundColor: "#12a28d",
                      }}
                      onPress={() => {
                        setDifficultyState(tempDifficulty); // Commit the temp value
                        validateField("difficulty", tempDifficulty);
                        setIosDifficultyPickerVisible(false);
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
                {difficultyOptions.map((option) => (
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
          {createCourseErrors.difficulty ? (
            <ThemedText
              style={{
                ...styles.errorText,
                color: colorScheme === "dark" ? "#FF6B6B" : "#FA5A5A",
              }}
            >
              {createCourseErrors.difficulty}
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
            <ThemedText
              style={{
                ...styles.pickerValue,
                color: mainTextColor,
                paddingRight: 30,
              }}
            >
              {courseDays}
            </ThemedText>
          )}
          {createCourseErrors.courseDays ? (
            <ThemedText
              style={{
                ...styles.errorText,
                color: colorScheme === "dark" ? "#FF6B6B" : "#FA5A5A",
              }}
            >
              {createCourseErrors.courseDays}
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

  const filteredCourses = courses
    ?.filter((course) =>
      selectedDifficulties?.length
        ? selectedDifficulties
            .map((d: Difficulty) => d.name)
            .includes(course.difficulty)
        : true
    )
    .filter((course) =>
      selectedVisibility?.length
        ? selectedVisibility
            .map((v: any) => v.value)
            .includes(getCourseVisibility(course))
        : true
    )
    .filter((course) =>
      course.title?.toLowerCase().includes(searchValCourses?.toLowerCase())
    );

  const difficulties: Difficulty[] = Object.values(
    courses.reduce<Record<string, Difficulty>>((acc, course, index) => {
      if (!acc[course.difficulty]) {
        acc[course.difficulty] = { id: index + 1, name: course.difficulty };
      }
      return acc;
    }, {})
  );

  const resetFields = () => {
    setCourseTitle("");
    setCourseDays("");
    setDifficultyState("");
    setSelectedExercisesForDayTags([]);
    setSelectedAvailableExercisesForDayTags([]);
    setSearchValForDay("");
    setSearchValAvailableForDay("");
    setExercisesByDay({});

    setCreateCourseErrors({
      title: "",
      difficulty: "",
      courseDays: "",
    });

    setEmptyDays([]);
  };

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

  return (
    <View
      style={{
        ...styles.safeArea,
        backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
      }}
    >
      {/* <View
        style={{
          position: "absolute",
          flex: 1,
          width: "100%",
          height: Dimensions.get("window").height,
          opacity: 0.04,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          source={require("@/assets/images/logo-veci.png")}
          style={{
            width: "100%",
            height: "50%",
            objectFit: "cover",
          }}
        />
      </View> */}
      {renderHeader()}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setCreateCourseVisible(true);
          resetFields();
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
      <View
        style={{
          ...styles.inputWrapper,
          marginBottom: 0,
          paddingHorizontal: 15,
          paddingLeft: 10,
        }}
      >
        <View style={styles.iconWrapper}>
          <Ionicons name="search-outline" size={20} color={mainTextColor} />
        </View>
        <TextInput
          style={{
            ...styles.input,
            borderColor:
              colorScheme === "dark" ? "rgb(80, 80, 80)" : "rgb(204, 204, 204)",
            color: mainTextColor,
          }}
          placeholder="Search"
          placeholderTextColor={
            colorScheme === "dark" ? "rgb(170, 170, 170)" : "rgb(105, 105, 105)"
          }
          value={searchValCourses}
          onChangeText={(text) => {
            setSearchValCourses(text);
          }}
        />
        {searchValCourses?.length > 0 && (
          <TouchableOpacity
            style={{
              position: "absolute",
              right: 10,
              top: 18,
            }}
            onPress={() => {
              setSearchValCourses("");
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
      {((selectedDifficulties && selectedDifficulties.length > 0) ||
        (selectedVisibility && selectedVisibility.length > 0)) && (
        <View
          style={{
            ...styles.filtersContainer,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          {selectedDifficulties &&
            selectedDifficulties.length > 0 &&
            selectedDifficulties.map((d: any) => {
              return (
                <TouchableOpacity
                  style={styles.filterTag}
                  key={d.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedDifficulties((prevState) =>
                      prevState.filter((sd: any) => sd.id !== d.id)
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
                    {d.name}
                  </ThemedText>
                  <Ionicons
                    name="close-circle"
                    size={17}
                    color={colorScheme === "dark" ? "#FF6B6B" : "#FA5A5A"}
                  />
                </TouchableOpacity>
              );
            })}
          {selectedVisibility &&
            selectedVisibility.length > 0 &&
            selectedVisibility.map((v: any) => {
              return (
                <TouchableOpacity
                  style={styles.filterTag}
                  key={v.value}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedVisibility((prevState) =>
                      prevState.filter((sv: any) => sv.value !== v.value)
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
                    {v.label}
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
      {filteredCourses?.length > 0 && (
        <ThemedText
          type="smallest"
          style={{
            color:
              colorScheme === "dark" ? "rgb(160, 160, 160)" : "rgb(51, 51, 51)",
            paddingTop:
              selectedDifficulties.length > 0 || selectedVisibility.length > 0
                ? 10
                : 20,
            paddingRight: 10,
            paddingBottom: 5,
            textAlign: "right",
          }}
        >
          {filteredCourses.length === courses.length
            ? `${filteredCourses.length} ${
                filteredCourses.length === 1 ? "class" : "classes"
              }`
            : `${filteredCourses.length} of ${courses.length} ${
                courses.length === 1 ? "class" : "classes"
              }`}
        </ThemedText>
      )}
      <ScrollView>
        <View style={{ flex: 1, paddingBottom: 120 }}>
          {coursesLoading ? (
            <ActivityIndicator
              size="large"
              style={{ marginTop: 40 }}
              color={"#12a28d"}
            />
          ) : filteredCourses && filteredCourses.length > 0 ? (
            filteredCourses.map((course, index: number) => {
              const { title, difficulty, number_of_days, created_by } = course;

              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  key={index}
                  style={{
                    ...styles.workoutWrapper,
                    marginHorizontal: 10,
                    backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
                    borderColor:
                      colorScheme === "dark"
                        ? "rgba(100, 100, 100, 1)"
                        : "rgb(233, 233, 233)",
                    shadowColor: colorScheme === "dark" ? "#fff" : "#393939",
                    elevation: colorScheme === "dark" ? 2 : 1.1,
                  }}
                  onPress={() => {
                    router.push({
                      pathname: "/single-course",
                      params: { courseId: String(course.id) },
                    });
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
                      type={"smaller"}
                      style={{ fontFamily: "Default-Medium" }}
                    >
                      {title}
                    </ThemedText>
                    <View
                      style={{
                        marginTop: 8,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={{
                          ...styles.tag,
                          backgroundColor:
                            colorScheme === "dark" ? "#15413c" : "#00ffe119",
                        }}
                      >
                        <Ionicons
                          name="stats-chart-outline"
                          size={14}
                          color={colorScheme === "dark" ? "#e3e3e3" : "#222222"}
                        />
                        <ThemedText
                          type="smaller"
                          style={{
                            ...styles.tagText,
                            color:
                              colorScheme === "dark" ? "#e3e3e3" : "#222222",
                          }}
                        >
                          {difficulty}
                        </ThemedText>
                      </View>
                      <View
                        style={{
                          ...styles.tag,
                          backgroundColor:
                            colorScheme === "dark"
                              ? "#212121"
                              : "rgb(237, 239, 242)",
                          // backgroundColor: "rgb(237, 239, 242)",
                        }}
                      >
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color={
                            colorScheme === "dark"
                              ? "#e3e3e3"
                              : "rgb(31, 41, 55)"
                          }
                        />
                        <ThemedText
                          type="smaller"
                          style={{
                            ...styles.tagText,
                            color:
                              colorScheme === "dark"
                                ? "#e3e3e3"
                                : "rgb(31, 41, 55)",
                          }}
                        >
                          {number_of_days} {number_of_days > 1 ? "days" : "day"}
                        </ThemedText>
                      </View>
                      {userId === created_by ? (
                        <View
                          style={{
                            ...styles.tag,
                            backgroundColor:
                              colorScheme === "dark"
                                ? "#212121"
                                : "rgb(237, 239, 242)",
                            // backgroundColor: "rgb(237, 239, 242)",
                          }}
                        >
                          <Ionicons
                            name="person-outline"
                            size={14}
                            color={
                              colorScheme === "dark"
                                ? "#e3e3e3"
                                : "rgb(31, 41, 55)"
                            }
                          />
                          <ThemedText
                            type="smaller"
                            style={{
                              ...styles.tagText,
                              color:
                                colorScheme === "dark"
                                  ? "#e3e3e3"
                                  : "rgb(31, 41, 55)",
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
                              colorScheme === "dark"
                                ? "#212121"
                                : "rgb(237, 239, 242)",
                            // backgroundColor: "rgb(237, 239, 242)",
                          }}
                        >
                          <Ionicons
                            name="person-outline"
                            size={14}
                            color={
                              colorScheme === "dark"
                                ? "#e3e3e3"
                                : "rgb(31, 41, 55)"
                            }
                          />
                          <ThemedText
                            type="smaller"
                            style={{
                              ...styles.tagText,
                              color:
                                colorScheme === "dark"
                                  ? "#e3e3e3"
                                  : "rgb(31, 41, 55)",
                            }}
                          >
                            Public
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
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
          )}
        </View>
      </ScrollView>
      <Modal
        isVisible={createCourseVisible}
        onBackdropPress={() => setCreateCourseVisible(false)}
        onBackButtonPress={() => setCreateCourseVisible(false)}
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
              onPress={() => {
                setCreateCourseVisible(false);
              }}
            >
              <Ionicons name="close-outline" size={28} color={mainTextColor} />
            </TouchableOpacity>
            <View style={styles.headerTextWrapper}>
              <View>
                <ThemedText type="title" style={styles.headerText}>
                  New Class
                </ThemedText>
              </View>
            </View>
            <TouchableOpacity
              style={styles.successIcon}
              onPress={() => {
                if (validateForm()) {
                  // setCreateCourseVisible(false);
                  setSummaryVisible(true);
                }
              }}
            >
              <Ionicons
                name="arrow-forward-outline"
                size={24}
                color={mainTextColor}
              />
            </TouchableOpacity>
          </View>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <FlatList
              data={[renderCreateCourseForm()]}
              renderItem={({ item }) => item}
              keyExtractor={(_, index) => index.toString()}
            />
          </GestureHandlerRootView>
          {createCourseVisible && (
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
          <View style={{ flex: 1, width: "100%", backgroundColor: mainColor }}>
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
                  left: -10,
                }}
                onPress={() => {
                  if (validateForm()) {
                    createCourseHandler();
                  }
                }}
              >
                {createCourseLoading ? (
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
                data={[renderCreateCourseForm(true)]}
                renderItem={({ item }) => item}
                keyExtractor={(_, index) => index.toString()}
              />
            </GestureHandlerRootView>
          </View>
          <Toast />
        </Modal>
      </Modal>
      {filters.visible && (
        <TouchableWithoutFeedback
          onPress={() =>
            setFilters((prevState) => ({ ...prevState, visible: true }))
          }
        >
          <View
            style={{
              ...styles.modalOverlay,
              backgroundColor:
                colorScheme === "dark"
                  ? "rgba(0, 0, 0, 0.65)"
                  : "rgba(0, 0, 0, 0.4)",
            }}
          />
        </TouchableWithoutFeedback>
      )}

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
                backgroundColor: colorScheme === "dark" ? "#212121" : mainColor,
              }}
            >
              <TouchableOpacity
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
                  <View>
                    {/* Difficulty Filter */}
                    <View style={{ marginBottom: 20 }}>
                      <ThemedText
                        type="subtitle"
                        style={{
                          marginBottom: 8,
                          fontSize: 14,
                        }}
                      >
                        Difficulty
                      </ThemedText>
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 20,
                          flexWrap: "wrap",
                        }}
                      >
                        {difficulties?.map((difficulty) => (
                          <TouchableOpacity
                            key={difficulty.name}
                            activeOpacity={0.7}
                            style={{ flexDirection: "row", gap: 4 }}
                            onPress={() => {
                              const ids = selectedDifficulties?.map(
                                (d) => d.id
                              );

                              if (ids?.includes(difficulty.id)) {
                                setSelectedDifficulties((prevState) =>
                                  prevState.filter(
                                    (item) => item.id !== difficulty.id
                                  )
                                );
                              } else {
                                setSelectedDifficulties((prevState) => [
                                  ...prevState,
                                  difficulty,
                                ]);
                              }
                            }}
                          >
                            <View style={styles.checkbox}>
                              <Ionicons
                                name={
                                  selectedDifficulties
                                    ?.map((d) => d.id)
                                    ?.includes(difficulty.id)
                                    ? "checkbox"
                                    : "square-outline"
                                }
                                size={24}
                                color={
                                  selectedDifficulties
                                    ?.map((d) => d.id)
                                    ?.includes(difficulty.id)
                                    ? "#12a28d"
                                    : mainTextColor
                                }
                              />
                            </View>
                            <ThemedText
                              style={{
                                textTransform: "capitalize",
                                fontSize: 12,
                              }}
                            >
                              {difficulty.name}
                            </ThemedText>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Visibility Filter */}
                    <View>
                      <ThemedText
                        type="subtitle"
                        style={{
                          marginBottom: 8,
                          fontSize: 14,
                        }}
                      >
                        Visibility
                      </ThemedText>
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 20,
                          flexWrap: "wrap",
                        }}
                      >
                        {visibilityOptions?.map((option) => (
                          <TouchableOpacity
                            key={option.value}
                            activeOpacity={0.7}
                            style={{ flexDirection: "row", gap: 4 }}
                            onPress={() => handleVisibilitySelection(option)}
                          >
                            <View style={styles.checkbox}>
                              <Ionicons
                                name={
                                  selectedVisibility
                                    ?.map((v) => v.value)
                                    ?.includes(option.value)
                                    ? "checkbox"
                                    : "square-outline"
                                }
                                size={24}
                                color={
                                  selectedVisibility
                                    ?.map((v) => v.value)
                                    ?.includes(option.value)
                                    ? "#12a28d"
                                    : mainTextColor
                                }
                              />
                            </View>
                            <ThemedText
                              style={{
                                textTransform: "capitalize",
                                fontSize: 12,
                              }}
                            >
                              {option.label}
                            </ThemedText>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                ) : (
                  exerciseTagsPerGroup?.map((tagGroup: any, index: number) => {
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
      </Modal>
      {/* <Modal
        visible={summaryVisible}
        animationType="slide"
        onRequestClose={() => {
          setSummaryVisible(false);
        }}
        statusBarTranslucent
      >
        
      </Modal> */}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    position: "relative",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
    paddingTop: (Constants?.statusBarHeight ?? 0) + 10,
    // borderBottomWidth: 1,
    // borderBottomColor: "#E5E5E5",
    // backgroundColor: "#eaf4f3",
  },
  logoStyles: {
    width: 52,
    height: 40,
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
    // borderColor: "#E5E5E5",
    position: "relative",
    paddingRight: 10,
    // paddingVertical: 2
  },
  checkbox: {
    // position: "absolute",
    // left: -30,
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
  submitButton: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 1,
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
  filtersContainer: {
    flexDirection: "row",
    marginTop: 20,
    flexWrap: "wrap",
    paddingHorizontal: 10,
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
  formContainer: {
    paddingVertical: 20,
    paddingHorizontal: 18,
    paddingRight: 30,
    flexDirection: "column",
    alignItems: "center",
    paddingBottom: 80,
  },
  input: {
    flexGrow: 1,
    maxWidth: "90%",
    height: 50,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
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
  errorText: {
    fontSize: 10,
    position: "absolute",
    bottom: -4,
    right: 0,
    pointerEvents: "none",
    userSelect: "none",
    zIndex: 1,
  },
  selectedTag: {
    backgroundColor: "#12a28d",
  },
  selectedTagText: {
    color: "#fff",
  },
  uploadButton: {
    backgroundColor: "#2ea1ae",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  previewImage: {
    width: 80,
    height: 80,
    marginRight: 4,
    borderRadius: 6,
  },
  imageContainer: {
    position: "relative",
    marginTop: 10,
  },
  removeButton: {
    position: "absolute",
    top: -6,
    right: -6,
    padding: 10,
  },
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
  workoutImage: {
    width: "100%",
    height: "100%",
  },
  filterContainer: {
    position: "relative",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    left: 10,
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
  scrollContent: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
  filterOption: {
    fontSize: 16,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  successIcon: {
    paddingHorizontal: 8,
    marginLeft: "auto",
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
  keyboardAvoidingView: {
    position: "absolute",
    width: "100%",
    bottom: 0,
    // transform: "translate(0, 100%)",
    zIndex: 10,
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
  dropdownIcon: {
    position: "absolute",
    bottom: 12,
    right: 0,
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
  inputLabel: {
    fontSize: 14,
    color: "#666",
    position: "absolute",
    top: 10,
    left: 40,
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
    backgroundColor: "#12a28d",
  },
  dayTabInactive: {
    backgroundColor: "#2dd4be14",
  },
  dayTabText: {
    fontSize: 14,
    fontFamily: "Default-Medium",
    lineHeight: 15,
  },
  dayTabTextActive: {
    // color: "#FFFFFF",
  },
  dayTabTextInactive: {
    // color: "#707070",
  },
  dayTabTextError: {
    color: "red",
  },
  rowItem: {
    height: 100,
    width: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  doneButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  doneButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
