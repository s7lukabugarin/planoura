import React, { createRef, useEffect, useState } from "react";
import {
  Modal,
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
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTags } from "@/context/tagsContext";
import { useExercises } from "@/context/excersisesContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useColorScheme } from "@/hooks/useColorScheme";
import { convertSeconds } from "@/helpers/convertSeconds";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DraggableFlatList from "react-native-draggable-flatlist";

interface WorkoutDisplayModalProps {
  isVisible: boolean;
  onClose: (event: GestureResponderEvent) => void;
  fetchedClass?: any;
  classLoading?: boolean;
}

const WorkoutDisplayModal: React.FC<WorkoutDisplayModalProps> = ({
  isVisible,
  onClose,
  fetchedClass,
  classLoading,
}) => {
  const [filters, setFilters] = useState<{
    visible: boolean;
    filterName: "" | "selectedExercises" | "availableExercises";
  }>({
    visible: false,
    filterName: "",
  });

  const colorScheme = useColorScheme();

  const mainTextColor = useThemeColor({}, "mainText");
  const mainColor = useThemeColor({}, "main");

  const { fetchTags, tags, exerciseTagsPerGroup } = useTags();
  const { fetchExercises, loading } = useExercises();

  useEffect(() => {
    fetchTags();
    fetchExercises();
  }, []);

  const totalAvailableExercises = fetchedClass?.exercises;

  const renderExercises = () => {
    return (
      <View
        style={{
          ...styles.formContainer,
          backgroundColor: mainColor,
          alignItems: "flex-start",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <ThemedText type="subtitle">Exercises</ThemedText>
        </View>
        {!classLoading && fetchedClass?.exercises?.length > 0 && (
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
            {fetchedClass?.exercises?.length === totalAvailableExercises?.length
              ? `${fetchedClass?.exercises?.length} ${
                  fetchedClass?.exercises?.length === 1
                    ? "exercise"
                    : "exercises"
                }`
              : `${fetchedClass?.exercises?.length} of ${
                  totalAvailableExercises?.length
                } ${
                  totalAvailableExercises?.length === 1
                    ? "exercise"
                    : "exercises"
                }`}
          </ThemedText>
        )}
        {classLoading ? (
          <ActivityIndicator
            size="large"
            style={{ marginTop: 40, marginHorizontal: "auto" }}
            color={"#12a28d"}
          />
        ) : fetchedClass?.exercises && fetchedClass?.exercises?.length > 0 ? (
          <View style={{ width: "100%" }}>
            {fetchedClass?.exercises.map((exercise: any, index: number) => {
              const {
                name,
                videos,
                duration_in_seconds,
                exercise_tags,
                images,
                thumbnail_image
              } = exercise;

              const exerciseTags = tags?.filter((tag: any) =>
                exercise_tags.includes(tag.id)
              );

              const thumbnailImage =
                images?.find((img: any) => img.id === exercise.thumbnail_image)
                  ?.file_path ?? images?.[0]?.file_path;

              return (
                <View
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
                >
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
                        {convertSeconds(Number(duration_in_seconds)).hours > 0
                          ? ` ${
                              convertSeconds(Number(duration_in_seconds)).hours
                            } h`
                          : ""}
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
                      {exerciseTags?.map((tag: any, tagIndex: number) => {
                        return (
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
                        );
                      })}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <ThemedText
            type="subtitle"
            style={{
              // paddingLeft: 20,
              fontSize: 14,
              paddingTop: 0,
            }}
          >
            No Results{" "}
          </ThemedText>
        )}
      </View>
    );
  };

  return (
    <>
      <Modal
        visible={isVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={onClose}
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
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-outline" size={24} color={mainTextColor} />
            </TouchableOpacity>
            <View style={styles.headerTextWrapper}>
              <View>
                <ThemedText type="title" style={styles.headerText}>
                  Workout Info
                </ThemedText>
              </View>
            </View>
          </View>
          <ScrollView style={{ paddingTop: 20, paddingBottom: 40}}>
            <View
              style={{
                ...styles.inputWrapper,
                marginBottom: 0,
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
                value={fetchedClass?.name}
                editable={false}
              />
            </View>
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
                        value={fetchedClass?.description}
                        multiline
                        numberOfLines={4}
                        editable={false}
                      />
                    </View>
            {renderExercises()}
            {/* <FlatList
              nestedScrollEnabled={true}
              data={[renderExercises()]}
              renderItem={({ item }) => item}
              keyExtractor={(_, index) => index.toString()}
              style={{
                paddingBottom: 40
              }}
            /> */}
          </ScrollView>
        </View>
      </Modal>
    </>
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
  backButton: {
    position: "absolute",
    top: 68,
    left: 20,
    zIndex: 1,
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
  circleIcon: {
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: "#12a28d",
  },
});

export default WorkoutDisplayModal;
