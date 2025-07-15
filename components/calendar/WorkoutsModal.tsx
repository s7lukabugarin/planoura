import React, { createRef, useCallback, useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
  ScrollView,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableWithoutFeedback,
} from "react-native";
import Modal from "react-native-modal";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import WorkoutVideo from "./WorkoutVideo";
import { useTags } from "@/context/tagsContext";
import { useExercises } from "@/context/excersisesContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useColorScheme } from "@/hooks/useColorScheme";
import { convertSeconds } from "@/helpers/convertSeconds";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DraggableFlatList from "react-native-draggable-flatlist";
import {
  ExerciseGroup,
  getAllExercicesGroups,
  getAllExercisesForGroup,
} from "@/api/exercices";
import { useFocusEffect } from "expo-router";

const TOUCH_SLOP = 5;
const TIME_TO_ACTIVATE_PAN = 400;

interface WorkoutsModalProps {
  isVisible: boolean;
  selectedDate: string;
  summaryVisible: boolean;
  onClose: (selectedWorkouts: string[]) => void;
  onSubmit: (selectedWorkouts: string[]) => void;
  children?: React.ReactNode;
  workouts?: any;
}

const WorkoutsModal: React.FC<WorkoutsModalProps> = ({
  isVisible,
  selectedDate,
  onClose,
  onSubmit,
  summaryVisible,
  children,
  workouts
}) => {
  const [groups, setGroups] = useState<ExerciseGroup[] | null>(null);
  const [groupsLoading, setGroupsLoading] = useState(false);

  const [exercises, setExercises] = useState<any>(null);
  const [exercisesLoading, setExercisesLoading] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState<ExerciseGroup | null>(
    null
  );

  const [filters, setFilters] = useState<{
    visible: boolean;
    filterName: "" | "selectedExercises" | "availableExercises";
  }>({
    visible: false,
    filterName: "",
  });

  const [selectedAvailableExercisesTags, setSelectedAvailableExercisesTags] =
    useState([]);
  const [selectedSelectedExercisesTags, setSelectedSelectedExercisesTags] =
    useState([]);

  const [searchValSelected, setSearchValSelected] = useState("");
  const [searchValAvailable, setSearchValAvailable] = useState("");

  const colorScheme = useColorScheme();

  const mainTextColor = useThemeColor({}, "mainText");
  const mainColor = useThemeColor({}, "main");

  const { exerciseTagsPerGroup, fetchExerciseTagsPerGroup } = useTags();

  const [selectedExercises, setSelectedExercises] = useState<Array<any>>([]);

  const fetchGroups = async () => {
    try {
      setGroupsLoading(true);
      const result = await getAllExercicesGroups();

      result && setGroups(result);
    } catch (error) {
    } finally {
      setGroupsLoading(false);
    }
  };

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

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
      fetchExerciseTagsPerGroup();
      if (workouts && workouts.length > 0) {
        setSelectedExercises(workouts)
      }
    }, [workouts])
  );

  useFocusEffect(
    useCallback(() => {
      if (selectedGroup) {
        fetchExercisesForGroup();
      } else {
        setExercises(null);
        // setExercisesLoading(true);
      }
    }, [selectedGroup])
  );

  const toggleWorkoutSelection = (workout: any) => {
    setSelectedExercises((prevSelected) => {
      // Check if the workout is already selected
      const isSelected = prevSelected.some(
        (item) => item.name === workout.name
      );

      // If the workout is selected, remove it, otherwise add it
      if (isSelected) {
        return prevSelected.filter((item) => item.name !== workout.name);
      } else {
        return [...prevSelected, workout];
      }
    });
  };

  const handleSubmit = () => {
    onSubmit(selectedExercises);
  };

  const totalAvailableExercises = exercises?.filter((exercise: any) => {
    return !selectedExercises?.map((e) => e.id)?.includes(exercise.id);
  });

  const filteredSelectedExercises = selectedExercises
    ?.filter((exercise) =>
      selectedSelectedExercisesTags?.length
        ? exercise.exercise_tags.some((tag: any) =>
            selectedSelectedExercisesTags
              ?.map((t: any) => t.name)
              .includes(tag.name)
          )
        : true
    )
    ?.filter((exercise) =>
      exercise.name?.toLowerCase().includes(searchValSelected?.toLowerCase())
    );

  const filteredAvailableExercises = totalAvailableExercises
    ?.filter((exercise: any) =>
      selectedAvailableExercisesTags?.length
        ? exercise.exercise_tags.some((tag: any) =>
            selectedAvailableExercisesTags
              ?.map((t: any) => t.name)
              .includes(tag.name)
          )
        : true
    )
    ?.filter((exercise: any) =>
      exercise.name?.toLowerCase().includes(searchValAvailable?.toLowerCase())
    );
  const removeExercise = (id: number) => {
    setSelectedExercises((prevState) => [
      ...prevState.filter((e) => e.id !== id),
    ]);
  };

  const handleTagSelection = (tag: any) => {
    if (!filters.filterName) return;

    const setSelectedTags =
      filters.filterName === "availableExercises"
        ? setSelectedAvailableExercisesTags
        : setSelectedSelectedExercisesTags;

    setSelectedTags((prevState: any) => {
      const isSelected = prevState.some((t: any) => t.id === tag.id);

      return isSelected
        ? prevState.filter((t: any) => t.id !== tag.id)
        : [...prevState, tag];
    });
  };

  const selectedTags =
    filters.filterName === "availableExercises"
      ? selectedAvailableExercisesTags
      : selectedSelectedExercisesTags;

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
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => {
            removeExercise(item.id);
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

  const renderExercisesSelection = () => {
    return (
      <View
        style={{
          ...styles.formContainer,
          backgroundColor: mainColor,
          alignItems: "flex-start",
        }}
      >
        {selectedExercises && selectedExercises?.length > 0 && (
          <View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <ThemedText type="defaultSemiBold">Selected Exercises</ThemedText>
              <View style={styles.filterContainer}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.filterButton}
                  onPress={() => {
                    setFilters((prevState) => ({
                      ...prevState,
                      visible: true,
                      filterName: "selectedExercises",
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
                value={searchValSelected}
                onChangeText={(text) => {
                  setSearchValSelected(text);
                }}
              />
              {searchValSelected?.length > 0 && (
                <TouchableOpacity
                  style={{
                    position: "absolute",
                    right: 10,
                    top: 18,
                  }}
                  onPress={() => {
                    setSearchValSelected("");
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
            {selectedSelectedExercisesTags &&
              selectedSelectedExercisesTags.length > 0 && (
                <View
                  style={{
                    ...styles.filtersContainer,
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 0,
                  }}
                >
                  {selectedSelectedExercisesTags.map((t: any) => {
                    return (
                      <TouchableOpacity
                        style={styles.filterTag}
                        key={t.id}
                        activeOpacity={0.7}
                        onPress={() => {
                          setSelectedSelectedExercisesTags((prevState) =>
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
            {filteredSelectedExercises?.length > 0 && (
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
                {filteredSelectedExercises?.length === selectedExercises?.length
                  ? `${filteredSelectedExercises?.length} ${
                      filteredSelectedExercises?.length === 1
                        ? "exercise"
                        : "exercises"
                    }`
                  : `${filteredSelectedExercises?.length} of ${
                      selectedExercises?.length
                    } ${
                      selectedExercises?.length === 1 ? "exercise" : "exercises"
                    }`}
              </ThemedText>
            )}
            {false ? (
              <ActivityIndicator
                size="large"
                style={{ marginTop: 40 }}
                color={"#12a28d"}
              />
            ) : filteredSelectedExercises &&
              filteredSelectedExercises?.length > 0 ? (
              <View
                style={{
                  maxHeight: filteredSelectedExercises?.length * 180,
                  // pointerEvents: isDragEnabled ? "auto" : "none"
                }}
              >
                <DraggableFlatList
                  dragHitSlop={{ top: -10, left: -10 }}
                  // dragHitSlop={{ right: -(300 * 0.95 - 20) }}
                  key={`${filters.visible}-${summaryVisible}`}
                  data={filteredSelectedExercises}
                  renderItem={renderSelectedExercise}
                  keyExtractor={(item) => item.id.toString()}
                  dragItemOverflow={true}
                  scrollEnabled={true}
                  onDragEnd={({ data }) => {
                    setSelectedExercises((prevState) => {
                      const newOrderMap = new Map(
                        data.map((exercise, index) => [exercise.id, index])
                      );

                      const newFullList = [...prevState].sort((a, b) => {
                        const indexA =
                          newOrderMap.get(a.id) ?? selectedExercises.indexOf(a);
                        const indexB =
                          newOrderMap.get(b.id) ?? selectedExercises.indexOf(b);
                        return indexA - indexB;
                      });

                      return newFullList;
                    });
                  }}
                />
              </View>
            ) : (
              <ThemedText
                type="subtitle"
                style={{
                  fontSize: 14,
                  paddingTop:
                    selectedSelectedExercisesTags &&
                    selectedSelectedExercisesTags?.length > 0
                      ? 10
                      : 0,
                }}
              >
                No Results{" "}
                {selectedSelectedExercisesTags || searchValSelected
                  ? "For Applied Filters"
                  : ""}
              </ThemedText>
            )}
          </View>
        )}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {selectedGroup && (
            <ThemedText type="defaultSemiBold">Available Exercises</ThemedText>
          )}
          {selectedGroup && (
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() =>
                  setFilters((prevState) => ({
                    ...prevState,
                    visible: true,
                    filterName: "availableExercises",
                  }))
                }
              >
                <Ionicons name={"funnel-outline"} size={24} color="#12a28d" />
              </TouchableOpacity>
            </View>
          )}
        </View>
        {filteredSelectedExercises?.length !== exercises?.length &&
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
                value={searchValAvailable}
                onChangeText={(text) => {
                  setSearchValAvailable(text);
                }}
              />
              {searchValAvailable?.length > 0 && (
                <TouchableOpacity
                  style={{
                    position: "absolute",
                    right: 10,
                    top: 18,
                  }}
                  onPress={() => {
                    setSearchValAvailable("");
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
        {selectedAvailableExercisesTags &&
          selectedAvailableExercisesTags?.length > 0 &&
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
              {selectedAvailableExercisesTags?.map((t: any) => {
                return (
                  <TouchableOpacity
                    style={styles.filterTag}
                    key={t.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedAvailableExercisesTags((prevState) =>
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
        {filteredAvailableExercises?.length > 0 && selectedGroup && (
          <ThemedText
            type="smallest"
            style={{
              color:
                colorScheme === "dark"
                  ? "rgb(160, 160, 160)"
                  : "rgb(51, 51, 51)",
              paddingBottom: 5,
              textAlign: "right",
              marginLeft: "auto",
            }}
          >
            {filteredAvailableExercises?.length ===
            totalAvailableExercises?.length
              ? `${filteredAvailableExercises?.length} ${
                  filteredAvailableExercises?.length === 1
                    ? "exercise"
                    : "exercises"
                }`
              : `${filteredAvailableExercises?.length} of ${
                  totalAvailableExercises?.length
                } ${
                  totalAvailableExercises?.length === 1
                    ? "exercise"
                    : "exercises"
                }`}
          </ThemedText>
        )}
        {selectedGroup ? (
          exercisesLoading ? (
            <ActivityIndicator
              size="large"
              style={{ marginTop: 40, marginHorizontal: "auto" }}
              color={"#12a28d"}
            />
          ) : filteredAvailableExercises &&
            filteredAvailableExercises?.length > 0 ? (
            <View style={{ width: "100%" }}>
              {filteredAvailableExercises?.map(
                (exercise: any, index: number) => {
                  const {
                    name,
                    videos,
                    duration_in_seconds,
                    exercise_tags,
                    images,
                  } = exercise;

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
                        setSelectedExercises((prevState) => [
                          ...prevState,
                          exercise,
                        ]);
                        // setExercisesByDay((prevState) => {
                        //   const selectedDayExercises =
                        //     prevState[selectedDay]?.push(exercise);
                        //   prevState[selectedDay];
                        //   return {
                        //     ...prevState,
                        //     selectedDay: selectedDayExercises,
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
                            {convertSeconds(Number(duration_in_seconds))
                              .minutes > 0
                              ? ` ${
                                  convertSeconds(Number(duration_in_seconds))
                                    .minutes
                                } min`
                              : ""}
                            {convertSeconds(Number(duration_in_seconds))
                              .seconds > 0
                              ? ` ${
                                  convertSeconds(Number(duration_in_seconds))
                                    .seconds
                                } sec`
                              : ""}
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
                  selectedAvailableExercisesTags &&
                  selectedAvailableExercisesTags.length > 0
                    ? 10
                    : 0,
              }}
            >
              No Results{" "}
              {(selectedAvailableExercisesTags &&
                selectedAvailableExercisesTags.length > 0) ||
              searchValAvailable
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
          <ScrollView style={{ width: "100%" }}>
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
                      backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
                      borderColor:
                        colorScheme === "dark"
                          ? "rgba(100, 100, 100, 1)"
                          : "rgb(233, 233, 233)",
                      shadowColor: colorScheme === "dark" ? "#fff" : "#393939",
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
        {/* {exercisesLoading ? (
          <ActivityIndicator
            size="large"
            style={{ marginTop: 40, marginHorizontal: "auto" }}
            color={"#12a28d"}
          />
        ) : filteredAvailableExercises &&
          filteredAvailableExercises?.length > 0 ? (
          <View style={{ width: "100%" }}>
            {filteredAvailableExercises?.map((exercise: any, index: number) => {
              const {
                name,
                videos,
                duration_in_seconds,
                exercise_tags,
                images,
              } = exercise;

              const thumbnailImage =
                images?.find((img: any) => img.id === exercise.thumbnail_image)
                  ?.file_path ?? images?.[0]?.file_path;

              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  key={index}
                  style={{
                    ...styles.workoutWrapper,
                    paddingRight: 40,
                    backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
                    borderColor:
                      colorScheme === "dark"
                        ? "rgba(100, 100, 100, 1)"
                        : "rgb(233, 233, 233)",
                    shadowColor: colorScheme === "dark" ? "#fff" : "#393939",
                    elevation: colorScheme === "dark" ? 2 : 1.1,
                  }}
                  onPress={() => {
                    setSelectedExercises((prevState) => [
                      ...prevState,
                      exercise,
                    ]);
                    // setExercisesByDay((prevState) => {
                    //   const selectedDayExercises =
                    //     prevState[selectedDay]?.push(exercise);
                    //   prevState[selectedDay];
                    //   return {
                    //     ...prevState,
                    //     selectedDay: selectedDayExercises,
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
                        {convertSeconds(Number(duration_in_seconds)).minutes > 0
                          ? ` ${
                              convertSeconds(Number(duration_in_seconds))
                                .minutes
                            } min`
                          : ""}
                        {convertSeconds(Number(duration_in_seconds)).seconds > 0
                          ? ` ${
                              convertSeconds(Number(duration_in_seconds))
                                .seconds
                            } sec`
                          : ""}
                      </ThemedText>
                    </View>
                    <View style={styles.tagsContainer}>
                      {exercise_tags.map((tag: any, tagIndex: number) => (
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
                              color:
                                colorScheme === "dark" ? "#e3e3e3" : "#000000",
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
            })}
          </View>
        ) : (
          <ThemedText
            type="subtitle"
            style={{
              // paddingLeft: 20,
              fontSize: 14,
              paddingTop:
                selectedAvailableExercisesTags &&
                selectedAvailableExercisesTags.length > 0
                  ? 10
                  : 0,
            }}
          >
            No Results{" "}
            {(selectedAvailableExercisesTags &&
              selectedAvailableExercisesTags.length > 0) ||
            searchValAvailable
              ? "For Applied Filters"
              : ""}
          </ThemedText>
        )} */}
      </View>
    );
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={() => {
        onClose(selectedExercises)
      }}
      onBackButtonPress={() => {
        onClose(selectedExercises)
      }}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      useNativeDriver
      hideModalContentWhileAnimating
      backdropOpacity={0.5}
      statusBarTranslucent
      style={{ margin: 0 }}
    >
      {children}
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
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-undo-outline" size={28} color="#fff" />
          </TouchableOpacity>
        )}
        <View
          style={{
            ...styles.overlayHeader,
            backgroundColor: colorScheme === "dark" ? "#15413c" : "#e6f7f5",
          }}
        >
          <TouchableOpacity
            onPress={(e) => {
              onClose(selectedExercises);
              setSelectedExercises([]);
              setSelectedGroup(null);
            }}
          >
            <Ionicons name="arrow-back" size={24} color={mainTextColor} />
          </TouchableOpacity>
          <View style={styles.headerTextWrapper}>
            <View>
              <ThemedText type="title" style={styles.headerText}>
                Exercises Selection
              </ThemedText>
            </View>
          </View>
          <TouchableOpacity
            style={styles.successIcon}
            onPress={() => {
              // setWorkoutsModalVisible(true);
              handleSubmit();
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
            nestedScrollEnabled={true}
            data={[renderExercisesSelection()]}
            renderItem={({ item }) => item}
            keyExtractor={(_, index) => index.toString()}
          />
        </GestureHandlerRootView>
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
                {exerciseTagsPerGroup?.map((tagGroup: any, index: number) => {
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
                })}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  workoutImage: {
    width: "100%",
    height: "100%",
  },
  successIcon: {
    paddingHorizontal: 8,
    marginLeft: "auto",
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
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
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
    backgroundColor: "rgba(4, 178, 190, 0.38)",
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
  },
  filterTagSelected: {
    backgroundColor: "#07CFB1",
    borderColor: "#07CFB1",
  },
  filterText: {
    fontSize: 14,
    lineHeight: 16,
    // textTransform: "capitalize"
  },
  filterTextSelected: {
    color: "#fff",
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
  checkbox: {},
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
  headerText: {
    fontSize: 20,
    lineHeight: 26,
  },
  filterContainer: {
    position: "relative",
  },
  filtersContainer: {
    flexDirection: "row",
    marginTop: 20,
    flexWrap: "wrap",
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
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    left: 10,
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
  input: {
    flexGrow: 1,
    maxWidth: "90%",
    height: 50,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  formContainer: {
    paddingVertical: 20,
    paddingHorizontal: 18,
    paddingRight: 30,
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
  },
  removeButton: {
    position: "absolute",
    top: -6,
    right: -6,
    padding: 10,
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
  fakeModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999999, // Higher for subsequent modals
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
});

export default WorkoutsModal;
