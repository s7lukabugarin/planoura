import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Text,
  Animated,
  Modal,
  TextInput,
  LayoutChangeEvent,
  ActivityIndicator,
  FlatList,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Pressable,
  Alert,
  Keyboard,
} from "react-native";
import { Image } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { useLocalSearchParams } from "expo-router";
import RenderHtml from "react-native-render-html";
import WorkoutVideo from "@/components/calendar/WorkoutVideo";
import {
  editExercise,
  EditExerciseData,
  Exercise,
  ExerciseGroup,
  ExerciseTag,
  getAllExercicesGroups,
  getExerciseById,
  submitExerciseForReview,
} from "@/api/exercices";
import Button from "@/components/Button";
import { useTags } from "@/context/tagsContext";
import * as ImagePicker from "expo-image-picker";
import {
  fetchAllImages,
  fetchAllVideos,
  ImageItemResponse,
  uploadImage,
  uploadVideo,
} from "@/api/media";
import Toast from "react-native-toast-message";
import { useExercises } from "@/context/excersisesContext";
import { useAuth } from "@/context/authContext";
import {
  RichText,
  Toolbar,
  useEditorBridge,
  TenTapStartKit,
  CoreBridge,
  PlaceholderBridge,
} from "@10play/tentap-editor";
import { PoppinsRegular } from "@/assets/fonts/PoppinsRegularJs";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useColorScheme } from "@/hooks/useColorScheme";
import { convertSeconds } from "@/helpers/convertSeconds";
import { convertToSeconds } from "@/helpers/convertMinutesToSeconds";
import { convertSecondsToMinutes } from "@/helpers/convertSecondsToMinutes";
import { Picker } from "@react-native-picker/picker";

const MAX_HEIGHT_NOT_EXPANDED = 335;

export default function SingleExercise() {
    const [editorFocused, setEditorFocused] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const colorScheme = useColorScheme();

  const mainTextColor = useThemeColor({}, "mainText");
  const mainColor = useThemeColor({}, "main");

  const customFont = `
    ${PoppinsRegular}
    * {
        font-family: 'Default-Regular', sans-serif;
        font-size: 12px;
    }
    p, li {
        font-size: 15px;
    }
    `;

  const editorCss = `
    * {
      background-color: transparent;
      color: ${mainTextColor};
    }
    blockquote {
      border-left: 3px solid #babaca;
      padding-left: 1rem;
    }
    .highlight-background {
      background-color: #474749;
    }
  `;

  const { userId } = useAuth();

  const [exercise, setExercise] = useState<Exercise | null>(null);

  const openModal = (imageUri: string) => {
    setSelectedImage(imageUri);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelectedImage(null);
    setModalVisible(false);
  };

  const editor = useEditorBridge({
    // autofocus: true,
    theme: {
      toolbar: {
        toolbarBody: {
          borderTopColor: "#C6C6C6B3",
          borderBottomColor: "#C6C6C6B3",
          backgroundColor: "transparent",
        },
        toolbarButton: {
          backgroundColor: "transparent",
        },
        iconWrapper: {
          backgroundColor: "transparent",
        },
      },
    },
    avoidIosKeyboard: true,
    initialContent: exercise?.description,
    onChange: async () => {
      const content = await editor.getHTML();

      const stringifiedContent = String(content);

      setExerciseDescription(stringifiedContent);
    },
    bridgeExtensions: [
      ...TenTapStartKit,
      CoreBridge.configureCSS(customFont),
      CoreBridge.configureCSS(editorCss),
      PlaceholderBridge.configureExtension({
        placeholder: "Description",
      }),
    ],
  });

  const [iosPickerVisible, setIosPickerVisible] = useState(false);

  const [selectedFormGroup, setSelectedFormGroup] = useState<number | null>(
    null
  );

  const [groups, setGroups] = useState<ExerciseGroup[] | null>(null);

  const [editFormVisible, setEditFormVisible] = useState(false);
  const [editExerciseLoading, setEditExerciseLoading] = useState(false);
  const [getExerciseLoading, setGetExerciseLoading] = useState(false);

  const [isExpandedDescription, setIsExpandedDescription] = useState(false);
  const [height, setHeight] = useState<number | "auto">(
    MAX_HEIGHT_NOT_EXPANDED
  );
  const [descriptionHeight, setDescriptionHeight] = useState(0);

  const {
    // fetchTags, tags,
    fetchExerciseTagsPerGroup,
    exerciseTagsPerGroup,
  } = useTags();

  const { fetchExercises } = useExercises();

  const [editExerciseErrors, setEditExerciseErrors] = useState({
    title: "",
    description: "",
  });

  const navigation = useNavigation();
  const { exerciseId } = useLocalSearchParams();
  // const exerciseParamParsed = JSON.parse(exerciseParam as string) as Exercise;

  const [mediaLibraryImages, setMediaLibraryImages] =
    useState<Array<ImageItemResponse> | null>([]);
  const [mediaLibraryImagesLoading, setMediaLibraryImagesLoading] =
    useState(false);

  const [mediaLibraryVideos, setMediaLibraryVideos] =
    useState<Array<ImageItemResponse> | null>([]);
  const [mediaLibraryVideosLoading, setMediaLibraryVideosLoading] =
    useState(false);

  const [mediaLibraryModalParams, setMediaLibraryModalParams] = useState<{
    visible: boolean;
    media: "" | "images" | "video";
  }>({
    visible: false,
    media: "",
  });

  const [exerciseTitle, setExerciseTitle] = useState("");
  const [exerciseDescription, setExerciseDescription] = useState("");
  const [exerciseDuration, setExerciseDuration] = useState("");

  const [imageUploadLoading, setImageUploadLoading] = useState(false);

  const formattedSelectedWorkoutImages =
    exercise?.images?.map((img) => ({
      uri: img?.file_path,
      thumbnail: img.thumbnail,
      id: String(img.id),
    })) ?? [];

  const [selectedImages, setSelectedImages] = useState<
    { id: string; thumbnail: boolean; uri: string }[]
  >(formattedSelectedWorkoutImages);

  const formattedSelectedWorkoutVideos =
    exercise?.videos?.map((video) => ({
      uri: video?.file_path,
      thumbnail: false,
      id: String(video.id),
      item_id: video.item_id,
    })) ?? [];

  const [videoUploadLoading, setVideoUploadLoading] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<
    { item_id: string; id: string; thumbnail: boolean; uri: string }[]
  >(formattedSelectedWorkoutVideos);

  const [editExerciseSelectedTags, setEditExerciseSelectedTags] = useState<
    ExerciseTag[]
  >(exercise?.exercise_tags ?? []);

  const featureImage =
    exercise?.images?.find((w) => w.id === exercise?.thumbnail_image)
      ?.file_path ?? exercise?.images?.[0]?.file_path;
  const videos = exercise?.videos;
  const video = exercise?.videos?.[0]?.file_path;

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setDescriptionHeight(height);
  };

  // const handleTagPress = (id: number) => {
  //   setExerciseSelectedTags((prevTags) => {
  //     if (prevTags.includes(id)) {
  //       return prevTags.filter((tagId) => tagId !== id);
  //     } else {
  //       return [...prevTags, id];
  //     }
  //   });
  // };

  const validateField = (field: "title" | "description", value: string) => {
    const newErrors = { ...editExerciseErrors };

    switch (field) {
      case "title":
        newErrors.title = value.trim() ? "" : "Title is required.";
        break;
      case "description":
        newErrors.description =
          value.trim() === "" || value.trim() === "<p></p>"
            ? "Description is required."
            : "";
        break;
      default:
        break;
    }

    setEditExerciseErrors(newErrors);
  };
  const inferMime = (fileName: string): string => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "heic":
        return "image/heic";
      case "mp4":
        return "video/mp4";
      case "mov":
        return "video/quicktime";
      case "m4v":
        return "video/x-m4v";
      default:
        return "application/octet-stream";
    }
  };

  type NormalizedFile = {
    uri: string;
    fileName: string;
    mimeType: string;
  };

  const normalizeAsset = (
    asset: ImagePicker.ImagePickerAsset
  ): NormalizedFile => {
    let { uri } = asset;
    let fileName =
      asset.fileName ?? uri.split("/").pop() ?? `upload-${Date.now()}`;
    let mimeType = asset.mimeType ?? inferMime(fileName);
    return { uri, fileName, mimeType }; // uvek string-ovi
  };

  /** Čeka da URL postane dostupan (HEAD = 200) */
  const waitUntilAvailable = async (
    url: string,
    isVideo = false,
    retries = 10,
    delayMs = 500
  ) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(
          url,
          isVideo
            ? { method: "GET", headers: { Range: "bytes=0-0" } }
            : { method: "HEAD" }
        );
        if (res.ok || res.status === 206) return;
      } catch (_) {}
      await new Promise((r) => setTimeout(r, delayMs));
    }
    throw new Error("File not available.");
  };

  const waitUntilStreamReady = async (
    itemId: string,
    retries = 20,
    delayMs = 1500
  ) => {
    const url = `${process.env.EXPO_PUBLIC_STREAM}/videos/${itemId}/main.m3u8?api_key=${process.env.EXPO_PUBLIC_STREAM_API_KEY}`;
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url, {
          method: "GET",
          headers: { Range: "bytes=0-0" },
        });
        if (res.ok || res.status === 206) return url;
      } catch (_) {}
      await new Promise((r) => setTimeout(r, delayMs));
    }
    throw new Error("Stream is still not ready.");
  };

  // ------------------- glavna funkcija -------------------

  /**
   * Selektor za slike / videe.
   * @param mediaTypes npr. ["images"], ["videos"] ili ["images","videos"]
   */
  const pickMedia = async (mediaTypes: Array<"images" | "videos">) => {
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        mediaTypes.length === 2
          ? ImagePicker.MediaTypeOptions.All
          : mediaTypes[0] === "images"
          ? ImagePicker.MediaTypeOptions.Images
          : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (pickerResult.canceled) return; // user pritisnuo ✕

    const asset = pickerResult.assets[0];

    // 2. Grananje po tipu fajla
    if (asset.type?.startsWith("image") && mediaTypes.includes("images")) {
      // --- IMAGE FLOW --------------------------------------------------------
      const normalized = normalizeAsset(asset);
      setImageUploadLoading(true);

      try {
        const uploaded = await uploadImage(normalized); // ← vaš API poziv

        // sačekaj da CDN/server stvarno servira fajl
        await waitUntilAvailable(uploaded.file_path);

        // mali cache-buster da React-Native ne izvuče stari keširani request
        const uriWithBuster = `${uploaded.file_path}?t=${Date.now()}`;

        setSelectedImages((prev) => [
          ...prev,
          {
            id: uploaded.id,
            thumbnail: prev.length === 0,
            uri: uriWithBuster,
          },
        ]);
      } finally {
        setImageUploadLoading(false);
      }
    } else if (
      asset.type?.startsWith("video") &&
      mediaTypes.includes("videos")
    ) {
      /** 1. pošalji ORIGINALNI asset ako je backendu potreban duration/size */
      setVideoUploadLoading(true);
      try {
        const uploaded = await uploadVideo(asset);

        if (uploaded) {
          const hls = await waitUntilStreamReady(uploaded.item_id);

          setSelectedVideos((prev) => [
            ...prev,
            {
              id: uploaded.id,
              item_id: uploaded.item_id,
              uri: hls,
              thumbnail: false,
            },
          ]);
        }
      } catch(err) {
        console.error(err);
      } finally {
        setVideoUploadLoading(false);
      }
    } else {
      console.warn("Nepodržani tip fajla:", asset.type);
    }
  };

  const submitExerciseForReviewHandler = async () => {
    try {
      if (exercise?.id) {
        const res = await submitExerciseForReview(
          exercise?.id,
          setReviewLoading
        );

        if (res) {
          Toast.show({
            type: "success",
            text1: "Submitted for review.",
            position: "top",
          });

          setTimeout(() => {
            navigation.goBack();
          }, 1000);
        }
      }
    } catch (error) {
      Alert.alert("Something went wrong");
    }
  };

  const removeImage = (id: number) => {
    setSelectedImages((prev) => {
      // Find the image to be removed
      const removedImage = prev.find((image) => Number(image.id) === id);
      // Filter out the image
      const updatedImages = prev.filter((image) => Number(image.id) !== id);

      // If the removed image was a thumbnail, set the first image as the new thumbnail
      if (removedImage?.thumbnail && updatedImages.length > 0) {
        updatedImages[0].thumbnail = true; // Set the first image as thumbnail
      }

      return updatedImages;
    });
  };

  const removeVideo = (id: string) => {
    setSelectedVideos((prev) => prev.filter((video) => video.id !== id));
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { title: "", description: "" };

    // Validate Title
    if (!exerciseTitle?.trim()) {
      newErrors.title = "Title is required.";
      isValid = false;
    }

    if (
      !exerciseDescription?.trim() ||
      exerciseDescription.trim() === "<p></p>"
    ) {
      newErrors.description = "Description is required.";
      isValid = false;
    }

    setEditExerciseErrors(newErrors);
    return isValid;
  };

  const { hours, minutes, seconds } = convertSeconds(
    Number(exercise?.duration_in_seconds)
  );

  const editExerciseHandler = async () => {
    if (selectedFormGroup) {
      const dataToSend: EditExerciseData = {
        id: exercise?.id!,
        name: exerciseTitle ?? "",
        description: exerciseDescription ?? "",
        duration_in_seconds: convertToSeconds(Number(exerciseDuration)),
        exercise_tags: editExerciseSelectedTags,
        images: selectedImages,
        videos: selectedVideos,
        is_public: true,
        created_by: exercise?.created_by!,
        thumbnail_image: selectedImages?.find((img) => img.thumbnail)?.id
          ? Number(selectedImages?.find((img) => img.thumbnail)?.id)
          : null,
        exercise_group: selectedFormGroup,
      };

      const updatedExercise = await editExercise(
        exercise?.id ?? 1,
        dataToSend,
        setEditExerciseLoading
      );

      if (updatedExercise) {
        setEditFormVisible(false);
        fetchExercises();
        fetchExercise();
        setTimeout(() => {
          Toast.show({
            type: "success",
            text1: "Exercise updated.",
            position: "top",
          });
        }, 500);
      }
    }
  };

  const renderEditExerciseForm = (
    finalFormVisible?: boolean,
    fetchedClass?: any
  ) => {
    return (
      <View style={{ ...styles.formContainer, backgroundColor: mainColor }}>
        <TouchableWithoutFeedback
          onPress={() => {
            if (editorFocused) {
              editor.blur(); // zatvori editor
              Keyboard.dismiss(); // zatvori tastaturu
            }
          }}
        >
          <View>
            <View
              style={{
                ...styles.inputWrapper,
                marginBottom: 12,
              }}
            >
              <ThemedText
                style={{
                  ...styles.pickerInputLabel,
                  color:
                    colorScheme === "dark"
                      ? "rgb(170, 170, 170)"
                      : "rgb(105, 105, 105)",
                }}
              >
                Group
              </ThemedText>
              <View style={styles.iconWrapper}>
                <Ionicons name="grid-outline" size={20} color={mainTextColor} />
              </View>
              {Platform.OS === "ios" ? (
                <>
                  <TouchableWithoutFeedback
                    onPress={() => setIosPickerVisible(true)}
                  >
                    <View
                      style={{
                        ...styles.selectPickerWrapper,
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
                          groups?.find(
                            (group) =>
                              Number(group.id) === Number(selectedFormGroup)
                          )?.name
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
                    visible={iosPickerVisible}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setIosPickerVisible(false)}
                  >
                    <TouchableWithoutFeedback
                      onPress={() => setIosPickerVisible(false)}
                    >
                      <View style={{ flex: 1, justifyContent: "flex-end" }}>
                        <View
                          style={{
                            backgroundColor:
                              colorScheme === "dark" ? "#000" : "#fff",
                            padding: 20,
                          }}
                        >
                          <Picker
                            selectedValue={selectedFormGroup}
                            onValueChange={(itemValue) => {
                              setSelectedFormGroup(itemValue);
                              setIosPickerVisible(false);
                            }}
                          >
                            {groups?.map((option) => (
                              <Picker.Item
                                key={option.id}
                                label={option.name}
                                value={option.id}
                              />
                            ))}
                          </Picker>
                        </View>
                      </View>
                    </TouchableWithoutFeedback>
                  </Modal>
                </>
              ) : (
                <View
                  style={{
                    ...styles.selectPickerWrapper,
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
                      groups?.find(
                        (group) =>
                          Number(group.id) === Number(selectedFormGroup)
                      )?.name
                    }
                  </ThemedText>
                  <Picker
                    selectedValue={selectedFormGroup}
                    onValueChange={setSelectedFormGroup}
                    enabled={!finalFormVisible}
                    style={[
                      styles.picker,
                      {
                        fontSize: 10,
                        opacity: 0,
                      },
                    ]}
                  >
                    {groups?.map((option) => (
                      <Picker.Item
                        key={option.id}
                        label={option.name}
                        value={option.id}
                      />
                    ))}
                  </Picker>
                  <Ionicons
                    name="chevron-down-outline"
                    size={14}
                    color="#666"
                    style={styles.dropdownIcon}
                  />
                </View>
              )}
            </View>
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
                value={exerciseTitle}
                onChangeText={(text) => {
                  setExerciseTitle(text);
                  validateField("title", text);
                }}
                editable={!finalFormVisible}
              />
              {editExerciseErrors.title ? (
                <ThemedText style={styles.errorText}>
                  {editExerciseErrors.title}
                </ThemedText>
              ) : null}
            </View>
          </View>
        </TouchableWithoutFeedback>

        <View
          style={{
            ...styles.inputWrapper,
            marginBottom: 0,
            paddingTop: 16,
          }}
        >
          <View
            style={{
              ...styles.iconWrapper,
              alignSelf: "flex-start",
              top: 4,
            }}
          >
            <Ionicons
              name="document-text-outline"
              size={20}
              color={mainTextColor}
            />
          </View>
          <SafeAreaView
            style={{
              ...styles.input,
              height: "auto",
              flex: 1,
              // paddingTop: 16,
              minHeight: 280,
              paddingBottom: 45,
              borderBottomWidth: colorScheme === "dark" ? 0 : 1,
              borderColor:
                colorScheme === "dark"
                  ? "rgb(80, 80, 80)"
                  : "rgb(204, 204, 204)",
            }}
          >
            <RichText
              editor={editor}
              style={{
                ...styles.input,
                height: "auto",
                minHeight: 50,
                // maxHeight: 200,
                width: "100%",
                backgroundColor: "transparent",
                // height: 500
              }}
            />
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.keyboardAvoidingView}
            >
              <Toolbar editor={editor} hidden={false} />
            </KeyboardAvoidingView>
          </SafeAreaView>

          {/* <TextInput
            style={{
              ...styles.input,
              height: "auto",
              minHeight: 50,
              maxHeight: 200,
            }}
            placeholder="Description"
            value={exerciseDescription}
            onChangeText={(text) => {
              setExerciseDescription(text);
              // validateField("description", text);
            }}
            multiline
            numberOfLines={8}
            editable={!finalFormVisible}
          /> */}
          {editExerciseErrors.description ? (
            <ThemedText
              style={{
                ...styles.errorText,
                bottom: 40,
                color: colorScheme === "dark" ? "#FF6B6B" : "#FA5A5A",
              }}
            >
              {editExerciseErrors.description}
            </ThemedText>
          ) : null}
        </View>
        <TouchableWithoutFeedback
          onPress={() => {
            if (editorFocused) {
              editor.blur(); // zatvori editor
              Keyboard.dismiss(); // zatvori tastaturu
            }
          }}
        >
          <View>
            <View
              style={{
                ...styles.inputWrapper,
              }}
            >
              <View style={styles.iconWrapper}>
                <Ionicons name="time-outline" size={20} color={mainTextColor} />
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
                keyboardType="decimal-pad"
                placeholder="Duration in minutes"
                placeholderTextColor={
                  colorScheme === "dark"
                    ? "rgb(170, 170, 170)"
                    : "rgb(105, 105, 105)"
                }
                value={exerciseDuration}
                onChangeText={(text) => {
                  const normalized = text.replace(",", ".");
                  setExerciseDuration(normalized);
                  // validateField("description", text);
                }}
                editable={!finalFormVisible}
              />
              {/* {editExerciseErrors.description ? (
            <ThemedText style={styles.errorText}>
              {editExerciseErrors.description}
            </ThemedText>
          ) : null} */}
              {exerciseDuration && (
                <View
                  style={{
                    position: "absolute",
                    bottom: 10,
                    right: 0,
                  }}
                >
                  <ThemedText
                    style={{
                      fontSize: 13,
                      color:
                        colorScheme === "dark"
                          ? "rgb(170, 170, 170)"
                          : "rgb(105, 105, 105)",
                    }}
                  >
                    Minutes
                  </ThemedText>
                </View>
              )}
            </View>
            <View
              style={{
                ...styles.inputWrapper,
                marginBottom: 12,
                marginTop: 12,
                columnGap: 8,
                flexWrap: "wrap",
              }}
            >
              <ThemedText
                type="subtitle"
                style={{
                  marginBottom: 5,
                  fontSize: 14,
                  width: "100%",
                }}
              >
                Images
              </ThemedText>
              <View
                style={{
                  flexDirection: "column",
                  flex: 1,
                }}
              >
                <TouchableOpacity
                  style={styles.pickerWrapper}
                  activeOpacity={0.7}
                  onPress={() => {
                    pickMedia(["images"]);
                  }}
                >
                  <Ionicons
                    name="image-outline"
                    size={36}
                    color={colorScheme === "dark" ? "#a1a1a1" : "#555"}
                  />
                  <ThemedText
                    style={{
                      color: colorScheme === "dark" ? "#a1a1a1" : "#555",
                      fontSize: 14,
                      // lineHeight:
                    }}
                    type="defaultSemiBold"
                  >
                    Upload Image
                  </ThemedText>
                  <ThemedText
                    style={{
                      color: "#777",
                      fontSize: 12,
                      lineHeight: 14,
                      textAlign: "center",
                    }}
                  >
                    Upload from your device
                  </ThemedText>
                </TouchableOpacity>
              </View>
              <View
                style={{
                  flexDirection: "column",
                  flex: 1,
                }}
              >
                <TouchableOpacity
                  style={styles.pickerWrapper}
                  activeOpacity={0.7}
                  onPress={() => {
                    setMediaLibraryModalParams((prevState) => ({
                      visible: true,
                      media: "images",
                    }));
                    // pickMedia(["images"]);
                  }}
                >
                  <Ionicons
                    name="cloud-outline"
                    size={36}
                    color={colorScheme === "dark" ? "#a1a1a1" : "#555"}
                  />
                  <ThemedText
                    style={{
                      color: colorScheme === "dark" ? "#a1a1a1" : "#555",
                      fontSize: 14,
                      // lineHeight:
                    }}
                    type="defaultSemiBold"
                  >
                    Browse Library
                  </ThemedText>
                  <ThemedText
                    style={{
                      color: "#777",
                      fontSize: 12,
                      lineHeight: 14,
                      textAlign: "center",
                      // lineHeight:
                    }}
                  >
                    Select from uploaded images
                  </ThemedText>
                </TouchableOpacity>
              </View>
              {
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    width: "100%",
                  }}
                >
                  {selectedImages?.map((image) => {
                    return (
                      <View
                        style={{
                          ...styles.imageContainer,
                        }}
                        key={image.id}
                      >
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => {
                            setSelectedImages((prevState) =>
                              prevState?.map((img) => ({
                                ...img,
                                thumbnail: img.uri === image.uri ? true : false,
                              }))
                            );
                          }}
                        >
                          <Image
                            source={{ uri: image.uri }}
                            style={{
                              ...styles.previewImage,
                              borderWidth: image.thumbnail ? 2 : 0,
                              borderColor: "#12a28d",
                            }}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => removeImage(Number(image.id))}
                        >
                          <Ionicons
                            name="close-circle"
                            size={20}
                            color={
                              colorScheme === "dark" ? "#FF6B6B" : "#FA5A5A"
                            }
                          />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                  {imageUploadLoading && (
                    <View
                      style={{
                        ...styles.imageContainer,
                        justifyContent: "center",
                        width: 60,
                      }}
                    >
                      <ActivityIndicator size="large" color={"#12a28d"} />
                    </View>
                  )}
                </View>
              }
            </View>
            <View
              style={{
                ...styles.inputWrapper,
                marginTop: 0,
                marginBottom: 12,
                columnGap: 8,
                flexWrap: "wrap",
              }}
            >
              <ThemedText
                type="subtitle"
                style={{
                  marginBottom: 5,
                  fontSize: 14,
                  width: "100%",
                }}
              >
                Videos
              </ThemedText>
              <View
                style={{
                  flexDirection: "column",
                  flex: 1,
                }}
              >
                <TouchableOpacity
                  style={styles.pickerWrapper}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (selectedVideos.length > 0) {
                      Toast.show({
                        type: "error",
                        text1: "Each exercise can have only one video.",
                        position: "top",
                      });
                    } else {
                      pickMedia(["videos"]);
                    }
                  }}
                >
                  <Ionicons
                    name="videocam-outline"
                    size={36}
                    color={colorScheme === "dark" ? "#a1a1a1" : "#555"}
                  />
                  <ThemedText
                    style={{
                      color: colorScheme === "dark" ? "#a1a1a1" : "#555",
                      fontSize: 14,
                      // lineHeight:
                    }}
                    type="defaultSemiBold"
                  >
                    Upload Video
                  </ThemedText>
                  <ThemedText
                    style={{
                      color: "#777",
                      fontSize: 12,
                      lineHeight: 14,
                      textAlign: "center",
                    }}
                  >
                    Upload from your device
                  </ThemedText>
                </TouchableOpacity>
              </View>
              <View
                style={{
                  flexDirection: "column",
                  flex: 1,
                }}
              >
                <TouchableOpacity
                  style={styles.pickerWrapper}
                  activeOpacity={0.7}
                  onPress={() => {
                    setMediaLibraryModalParams((prevState) => ({
                      visible: true,
                      media: "video",
                    }));
                    // if (selectedVideos.length > 0) {
                    //   Toast.show({
                    //     type: "error",
                    //     text1: "Each exercise can have only one video.",
                    //     position: "top",
                    //   });
                    // } else {
                    //   pickMedia(["videos"]);
                    // }
                  }}
                >
                  <Ionicons
                    name="cloud-outline"
                    size={36}
                    color={colorScheme === "dark" ? "#a1a1a1" : "#555"}
                  />
                  <ThemedText
                    style={{
                      color: colorScheme === "dark" ? "#a1a1a1" : "#555",
                      fontSize: 14,
                    }}
                    type="defaultSemiBold"
                  >
                    Browse Library
                  </ThemedText>
                  <ThemedText
                    style={{
                      color: "#777",
                      fontSize: 12,
                      lineHeight: 14,
                      textAlign: "center",
                    }}
                  >
                    Select from uploaded videos
                  </ThemedText>
                </TouchableOpacity>
              </View>
              {videoUploadLoading ? (
                <View style={{ marginTop: 20, width: "100%" }}>
                  <ActivityIndicator size="large" color={"#12a28d"} />
                  <ThemedText>video upload can take up to 3 minutes</ThemedText>
                </View>
              ) : (
                selectedVideos &&
                selectedVideos.length > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      width: "100%",
                    }}
                  >
                    {/* <Text>videos</Text> */}
                    {selectedVideos?.map((video) => {
                      return (
                        <View
                          style={{
                            ...styles.imageContainer,
                            width: "100%",
                            flex: 1,
                          }}
                          key={video.id}
                        >
                          <View style={{ height: 200, width: "100%" }}>
                            <WorkoutVideo
                              autoplay={false}
                              item_id={video.item_id}
                              thumbnail={featureImage}
                            />
                          </View>
                          <TouchableOpacity
                            style={{
                              ...styles.removeButton,
                              top: -8,
                              right: -8,
                            }}
                            onPress={() => removeVideo(video.id)}
                          >
                            <Ionicons
                              name="close-circle"
                              size={20}
                              color={
                                colorScheme === "dark" ? "#FF6B6B" : "#FA5A5A"
                              }
                            />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )
              )}
            </View>
            <View style={styles.tagsContainer}>
              {exerciseTagsPerGroup?.map((tagGroup: any, index: number) => {
                const editExerciseSelectedTagsIds =
                  editExerciseSelectedTags?.map((tag: any) => tag.id);
                return (
                  tagGroup.exercise_tags_set &&
                  tagGroup.exercise_tags_set.length > 0 && (
                    <View key={tagGroup.id}>
                      <ThemedText
                        type="subtitle"
                        style={{
                          marginBottom: 5,
                          fontSize: 14,
                          textTransform: "capitalize",
                        }}
                      >
                        {tagGroup.name}
                      </ThemedText>
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 15,
                          marginBottom:
                            exerciseTagsPerGroup.length - 1 !== index ? 20 : 0,
                          flexWrap: "wrap",
                        }}
                      >
                        {tagGroup.exercise_tags_set?.map((tag: any) => {
                          return (
                            <TouchableOpacity
                              key={tag.id}
                              activeOpacity={0.7}
                              style={{ flexDirection: "row", gap: 4 }}
                              onPress={() => {
                                setEditExerciseSelectedTags((prevState) => {
                                  const editExerciseSelectedTagsIds =
                                    prevState?.map((tag: any) => tag.id);
                                  if (
                                    editExerciseSelectedTagsIds?.includes(
                                      tag.id
                                    )
                                  ) {
                                    return prevState.filter(
                                      (t: any) => t.id !== tag.id
                                    );
                                  } else {
                                    return [...prevState, tag];
                                  }
                                });
                              }}
                            >
                              <View style={styles.checkbox}>
                                <Ionicons
                                  name={
                                    editExerciseSelectedTagsIds?.includes(
                                      tag.id
                                    )
                                      ? "checkbox"
                                      : "square-outline"
                                  }
                                  size={24}
                                  color={
                                    editExerciseSelectedTagsIds?.includes(
                                      tag.id
                                    )
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
                                {tag.name}
                              </ThemedText>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )
                );
              })}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  };

  const customTagsStyles = {
    p: {
      fontSize: 15,
      color: mainTextColor,
      lineHeight: 24,
      // marginVertical: 8,
      margin: 0,
      fontFamily: "Default-Regular",
    },
    h1: {
      fontSize: 24,
      color: "#1D3D47",
      marginBottom: 12,
    },
    h2: {
      fontSize: 20,

      color: "#1D3D47",
      marginBottom: 10,
    },
    li: {
      fontSize: 15,
      color: "rgba(0, 0, 0, 0.7)",
      fontFamily: "Default-Regular",
      marginBottom: 8,
      // p: {
      //   lineHeight: 40
      // }
    },
  };

  const toggleDescription = () => {
    setIsExpandedDescription(!isExpandedDescription);
    setHeight(isExpandedDescription ? MAX_HEIGHT_NOT_EXPANDED : "auto");
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
    fetchExerciseTagsPerGroup();
    fetchGroups();
  }, []);

  const fetchExercise = async () => {
    try {
      const fetchedExercise = await getExerciseById(
        Number(exerciseId),
        setGetExerciseLoading
      );

      setExercise(fetchedExercise);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Something went wrong.",
        position: "top",
      });
    }
  };

  useEffect(() => {
    fetchExercise();
  }, []);

  useEffect(() => {
    if (mediaLibraryModalParams.visible) {
      if (mediaLibraryModalParams.media === "images") {
        const fetchImages = async () => {
          try {
            const imagesData = await fetchAllImages(
              setMediaLibraryImagesLoading
            );

            setMediaLibraryImages(imagesData);
          } catch (err) {
            console.error(err);
          }
        };

        fetchImages();
      }

      if (mediaLibraryModalParams.media === "video") {
        const fetchVideos = async () => {
          try {
            const videosData = await fetchAllVideos(
              setMediaLibraryVideosLoading
            );

            setMediaLibraryVideos(videosData);
          } catch (err) {
            console.error(err);
          }
        };

        fetchVideos();
      }
    }
  }, [mediaLibraryModalParams.visible]);

  const setFormFields = () => {
    setExerciseTitle(exercise?.name ?? "");
    exercise?.exercise_group && setSelectedFormGroup(exercise?.exercise_group);
    setExerciseDescription(exercise?.description ?? "");
    exercise?.duration_in_seconds &&
      setExerciseDuration(
        convertSecondsToMinutes(exercise?.duration_in_seconds)?.toString() ?? ""
      );
    setEditExerciseSelectedTags(exercise?.exercise_tags ?? []);

    const formattedSelectedWorkoutImages =
      exercise?.images?.map((img: any) => ({
        ...img,
        uri: img.file_path,
        thumbnail: img.id === exercise?.thumbnail_image,
        id: String(img.id),
      })) ?? [];

    setSelectedImages(formattedSelectedWorkoutImages);

    const formattedSelectedWorkoutVideos =
      exercise?.videos?.map((video: any) => ({
        ...video,
        uri: video.file_path,
        thumbnail: false,
        id: String(video.id),
      })) ?? [];

    setSelectedVideos(formattedSelectedWorkoutVideos);
  };

  const statusMap = {
    1: "public",
    2: "private",
    3: "review",
  } as const;

  type StatusKey = keyof typeof statusMap;

  return getExerciseLoading ? (
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
          source={
            featureImage
              ? { uri: featureImage }
              : require("@/assets/images/login-image.png")
          }
          style={styles.loginImage}
        />
      }
      overlay={
        <View style={styles.overlay}>
          {/* {Number(exercise?.created_by) === Number(userId) && ( */}
          {statusMap[exercise?.status as StatusKey] === "private" && (
            <TouchableOpacity
              style={{
                ...styles.editIconWrapper,
              }}
              activeOpacity={0.7}
              onPress={() => {
                setEditFormVisible(true);
                setFormFields();
              }}
            >
              <Ionicons name="create-outline" size={26} color="white" />
            </TouchableOpacity>
          )}

          {/* )}  */}
        </View>
      }
      // logo={
      //   <Image
      //     source={require("@/assets/images/splash-logo.png")}
      //     style={styles.logoStyles}
      //   />
      // }
      overlayText={
        <View style={styles.overlayTextContainer}>
          <ThemedText
            type="title"
            style={{ textAlign: "center", color: "#e3e3e3" }}
          >
            {exercise?.name}
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
        <Ionicons name="arrow-back" size={24} color={mainTextColor} />
      </TouchableOpacity>
      <View
        style={{
          marginLeft: "auto",
          //   justifyContent: "flex-end",
          alignItems: "flex-end",
          ...styles.workoutInfo,
          marginTop: -20,
          maxWidth: "90%",
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
          <View style={{ width: "100%" }}>
            <View
              style={{
                alignSelf: "flex-end",
              }}
            >
              {statusMap[exercise?.status as StatusKey] === "public" ? (
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
                    color={
                      colorScheme === "dark" ? "#e3e3e3" : "rgb(31, 41, 55)"
                    }
                  />
                  <ThemedText
                    type="smaller"
                    style={{
                      ...styles.tagText,
                      color:
                        colorScheme === "dark" ? "#e3e3e3" : "rgb(31, 41, 55)",
                    }}
                  >
                    Public
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
                    color={
                      colorScheme === "dark" ? "#e3e3e3" : "rgb(31, 41, 55)"
                    }
                  />
                  <ThemedText
                    type="smaller"
                    style={{
                      ...styles.tagText,
                      color:
                        colorScheme === "dark" ? "#e3e3e3" : "rgb(31, 41, 55)",
                    }}
                  >
                    Private
                    {statusMap[exercise?.status as StatusKey] === "review" &&
                      ` - In Review`}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
          {exercise?.exercise_tags?.map((tag, tagIndex) => (
            <View
              key={tagIndex}
              style={{
                ...styles.tag,
                backgroundColor:
                  colorScheme === "dark" ? "#15413c" : "#00ffe119",
                marginLeft: 4,
                marginBottom: 4,
              }}
            >
              <ThemedText
                type="smaller"
                style={{
                  ...styles.tagText,
                  color: colorScheme === "dark" ? "#e3e3e3" : "#222222",
                }}
              >
                {tag.name}
              </ThemedText>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="time-outline" size={20} color={mainTextColor} />
          <ThemedText
            type="smaller"
            style={{
              // marginLeft: 6,
              lineHeight: 20,
            }}
          >
            {hours > 0 ? ` ${hours}h` : ""}
            {minutes > 0 ? ` ${minutes}min` : ""}
            {seconds > 0 ? ` ${seconds}sec` : ""}
          </ThemedText>
        </View>
      </View>
      <View style={styles.containerWrapper}>
        <ThemedText type="subtitle" style={{ paddingBottom: 10 }}>
          Group
        </ThemedText>
        <ThemedText style={{ marginBottom: 20 }}>
          {groups?.find((g) => g.id === exercise?.exercise_group)?.name}
        </ThemedText>
        <Animated.View style={{ maxHeight: height, marginBottom: 20 }}>
          <ScrollView
            contentContainerStyle={styles.container}
            onLayout={handleLayout}
          >
            <ThemedText type="subtitle" style={{ paddingBottom: 10 }}>
              Description
            </ThemedText>
            <RenderHtml
              contentWidth={400}
              source={{
                html: `${exercise?.description}`,
              }}
              tagsStyles={customTagsStyles}
              systemFonts={["Default-Regular", "Default-Bold"]}
            />
          </ScrollView>
        </Animated.View>
        {descriptionHeight > MAX_HEIGHT_NOT_EXPANDED - 2 && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={toggleDescription}
          >
            <Text style={styles.expandText}>
              {isExpandedDescription ? "Show Less" : "Show More"}
            </Text>
            <Ionicons
              name={isExpandedDescription ? "chevron-up" : "chevron-down"}
              size={20}
              color="rgba(0, 0, 0, 0.6)"
            />
          </TouchableOpacity>
        )}
        {videos && videos.length > 0 && (
          <View
            style={{
              marginBottom: 20,
            }}
          >
            <ThemedText type="subtitle" style={{ paddingBottom: 0 }}>
              Videos
            </ThemedText>
            {videos.map((video, index) => {
              return (
                <View
                  style={{
                    width: "100%",
                    // height: 200,
                    marginTop: 15,
                  }}
                  key={index}
                >
                  <WorkoutVideo
                    item_id={video.item_id}
                    thumbnail={featureImage}
                  />
                </View>
              );
            })}
          </View>
        )}
        {/* {video && (
          <View
            style={{
              marginBottom: 50,
            }}
          >
            <ThemedText
              type="subtitle"
              style={{ color: "#333", paddingBottom: 10 }}
            >
              Video
            </ThemedText>
            <View
              style={{
                width: "100%",
                height: 200,
              }}
            >
              <WorkoutVideo videoSource={video} />
            </View>
          </View>
        )} */}
        {exercise?.images && exercise?.images.length > 0 && (
          <View>
            <ThemedText type="subtitle" style={{ paddingBottom: 10 }}>
              Gallery
            </ThemedText>
            <FlatList
              data={exercise.images}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              numColumns={2}
              scrollEnabled={false} // keep outer scroll behavior
              columnWrapperStyle={{ justifyContent: "space-between" }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => openModal(item.file_path)}
                  style={{
                    width: "48%",
                    height: 200,
                    marginBottom: 12,
                    borderRadius: 8,
                  }}
                >
                  <Image
                    source={{ uri: item?.file_path }}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 8,
                      objectFit: "cover",
                    }}
                    contentFit="cover"
                    cachePolicy="disk"
                    placeholder={require("@/assets/images/splash-logo.png")}
                  />
                </TouchableOpacity>
              )}
            />
          </View>
        )}
        {statusMap[exercise?.status as StatusKey] === "private" &&
          (reviewLoading ? (
            <ActivityIndicator
              size="large"
              style={{ marginTop: 40 }}
              color={"#12a28d"}
            />
          ) : (
            <Button
              text={"Submit for a review"}
              buttonStyle={{
                backgroundColor: "#12a28d",
                marginTop: 20,
              }}
              onPress={() => {
                submitExerciseForReviewHandler();
              }}
            />
          ))}
      </View>
      <Modal
        visible={modalVisible}
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <View
          style={{
            ...styles.modalBackground,
            backgroundColor: mainColor,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Close Button */}
          <Pressable
            onPress={closeModal}
            style={{
              position: "absolute",
              top: 40, // adjust based on your design
              right: 20,
              zIndex: 1,
            }}
          >
            <Ionicons name="close-outline" size={36} color={mainTextColor} />
          </Pressable>

          {/* Image */}
          <Image
            source={{ uri: selectedImage ?? "" }}
            style={styles.fullImage}
            resizeMode="contain"
          />
        </View>
      </Modal>

      <Modal
        visible={editFormVisible}
        animationType="slide"
        onRequestClose={() => {
          setEditFormVisible(false);
        }}
        statusBarTranslucent
      >
        <Modal
          transparent
          visible={mediaLibraryModalParams.visible}
          onRequestClose={() => {
            setMediaLibraryModalParams((prevState) => ({
              ...prevState,
              visible: false,
            }));
          }}
          statusBarTranslucent
        >
          {mediaLibraryModalParams.visible && (
            <TouchableWithoutFeedback
              onPress={() =>
                setMediaLibraryModalParams((prevState) => ({
                  ...prevState,
                  visible: false,
                }))
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
            <View
              style={{
                ...styles.modalContainer,
              }}
            >
              <View
                style={{
                  ...styles.modalContent,
                  // maxHeight: "100%",
                  paddingVertical: 15,
                  backgroundColor:
                    colorScheme === "dark" ? "#212121" : mainColor,
                }}
              >
                <TouchableOpacity
                  style={{
                    ...styles.closeButton,
                    marginBottom: 15,
                  }}
                  // onPress={() =>
                  //   setMediaLibraryModalParams((prevState) => ({
                  //     ...prevState,
                  //     visible: false,
                  //   }))
                  // }
                >
                  {/* <Ionicons
                      name="close-outline"
                      size={24}
                      color={mainTextColor}
                    /> */}
                  <Button
                    text="Done"
                    buttonStyle={{
                      width: "auto",
                      backgroundColor: "#12a28d",
                    }}
                    onPress={() => {
                      setMediaLibraryModalParams((prevState) => ({
                        ...prevState,
                        visible: false,
                      }));
                    }}
                  ></Button>
                </TouchableOpacity>

                {/* <ScrollView contentContainerStyle={styles.scrollContent}> */}
                {mediaLibraryModalParams.media === "images" &&
                  (mediaLibraryImagesLoading ? (
                    <ActivityIndicator
                      size="large"
                      style={{ marginTop: 40 }}
                      color={"#12a28d"}
                    />
                  ) : (
                    <View>
                      <MediaLibraryImages
                        mediaLibraryImages={mediaLibraryImages}
                        selectedImages={selectedImages}
                        setSelectedImages={setSelectedImages}
                      />
                    </View>
                  ))}

                {mediaLibraryModalParams.media === "video" &&
                  (mediaLibraryVideosLoading ? (
                    <ActivityIndicator
                      size="large"
                      style={{ marginTop: 40 }}
                      color={"#12a28d"}
                    />
                  ) : (
                    <View>
                      <MediaLibraryVideos
                        mediaLibraryVideos={mediaLibraryVideos}
                        selectedVideos={selectedVideos}
                        setSelectedVideos={setSelectedVideos}
                      />
                    </View>
                  ))}
                {/* </ScrollView> */}
              </View>
            </View>
          </View>
        </Modal>
        {mediaLibraryModalParams?.visible && (
          <TouchableWithoutFeedback
            onPress={() => {
              setMediaLibraryModalParams((prevState) => ({
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
        <View style={{ flex: 1, backgroundColor: mainColor }}>
          <View
            style={{
              ...styles.overlayHeader,
              backgroundColor: colorScheme === "dark" ? "#15413c" : "#e6f7f5",
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setEditFormVisible(false);
              }}
            >
              <Ionicons name="close" size={28} color={mainTextColor} />
            </TouchableOpacity>
            <View style={styles.headerTextWrapper}>
              {/* <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={20} color="#fff" />
            </View> */}
              <View>
                <ThemedText type="title" style={styles.headerText}>
                  Edit Exercise
                </ThemedText>
                {/* <ThemedText
                style={{ color: "#000", fontSize: 12, lineHeight: 13 }}
              >
                username
              </ThemedText> */}
              </View>
            </View>
            <TouchableOpacity
              style={styles.successIcon}
              onPress={() => {
                if (validateForm()) {
                  editExerciseHandler();
                }
                // if (finalFormVisible) {
                //   submitClass();
                //   // setWorkoutsModalVisible(true);
                // } else {
                //   if (validateForm()) {
                //     setWorkoutsModalVisible(true);
                //   }
                // }
              }}
            >
              {editExerciseLoading ? (
                <ActivityIndicator
                  size="small"
                  // style={{ marginTop: 40 }}
                  color={"#12a28d"}
                />
              ) : (
                <Ionicons
                  name="checkmark-outline"
                  size={32}
                  color={mainTextColor}
                />
              )}
            </TouchableOpacity>
          </View>
          <ScrollView nestedScrollEnabled={true}>
            {renderEditExerciseForm()}
          </ScrollView>
        </View>
        {editFormVisible && <Toast />}
      </Modal>

      {/* <Modal
        // transparent
        backdropOpacity={0}
        isVisible={mediaLibraryModalParams.visible}
        animationIn="slideInUp"
        // onRequestClose={() => {
        //   setMediaLibraryModalParams((prevState) => ({
        //     ...prevState,
        //     visible: false,
        //   }));
        // }}
        onBackButtonPress={() => {
          setMediaLibraryModalParams((prevState) => ({
            ...prevState,
            visible: false,
          }));
        }}
        statusBarTranslucent
      >
    
      </Modal> */}
    </ParallaxScrollView>
  );
}

const MediaLibraryImages = ({
  mediaLibraryImages,
  selectedImages,
  setSelectedImages,
}: {
  mediaLibraryImages: Array<ImageItemResponse> | null;
  selectedImages: { id: string; thumbnail: boolean; uri: string }[] | null;
  setSelectedImages: React.Dispatch<
    React.SetStateAction<{ id: string; thumbnail: boolean; uri: string }[]>
  >;
}) => {
  const toggleImageSelection = (item: any) => {
    setSelectedImages((prevSelected) => {
      if (!prevSelected || prevSelected.length === 0) {
        // If the array is empty, the first item becomes the thumbnail
        return [{ id: item.id, thumbnail: true, uri: item?.file_path }];
      }

      const isAlreadySelected = prevSelected.some(
        (selectedImage) => selectedImage.id === item.id
      );

      if (isAlreadySelected) {
        // Remove the image
        const updatedSelection = prevSelected.filter(
          (selectedImage) => selectedImage.id !== item.id
        );

        // If the removed image was the thumbnail, assign thumbnail to the next item, if any
        if (item.thumbnail && updatedSelection.length > 0) {
          updatedSelection[0] = {
            ...updatedSelection[0],
            thumbnail: true,
          };
        }

        return updatedSelection;
      } else {
        // Add the image
        return [
          ...prevSelected,
          { id: item.id, thumbnail: false, uri: item.file_path },
        ];
      }
    });
  };
  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      key={item.id}
      activeOpacity={0.7}
      style={{
        flex: 1,
        // margin: 3,
        position: "relative",
      }}
      onPress={() => toggleImageSelection(item)}
    >
      <Image
        source={{ uri: item?.file_path }}
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          // borderRadius: 6,
        }}
      />
      <View style={styles.imageSelected}>
        {selectedImages?.map((image) => image.id)?.includes(item.id) && (
          <View style={styles.imageSelectedFill}></View>
        )}
      </View>
      {selectedImages?.map((image) => image.id)?.includes(item.id) && (
        <View style={styles.selectedImageOverlay}></View>
      )}
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={mediaLibraryImages?.map((img) => ({
        ...img,
        id: String(img.id),
      }))}
      numColumns={3}
      renderItem={renderItem}
      keyExtractor={(item) => item?.id.toString()}
      contentContainerStyle={{
        paddingBottom: 60,
        zIndex: -1,
      }}
    />
  );
};

const MediaLibraryVideos = ({
  mediaLibraryVideos,
  selectedVideos,
  setSelectedVideos,
}: {
  mediaLibraryVideos: Array<ImageItemResponse> | null;
  selectedVideos: { id: string; thumbnail: boolean; uri: string }[] | null;
  setSelectedVideos: React.Dispatch<
    React.SetStateAction<
      { id: string; thumbnail: boolean; uri: string; item_id: string }[]
    >
  >;
}) => {
  const [thumbnails, setThumbnails] = useState<{ [key: string]: string }>({});

  const getThumbnailUrl = (videoPath: string) => {
    const parts = videoPath.split("/");
    const itemId = parts[parts.length - 2];

    return `https://pilatesstream.s7design.de/Items/${itemId}/Images/Primary?fillHeight=396&fillWidth=223&quality=96`;
  };

  const renderItem = ({ item }: { item: any }) => {
    const thumbnailUrl = getThumbnailUrl(item?.file_path);

    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.7}
        style={{
          flex: 1,
          // margin: 3,
          position: "relative",
        }}
        onPress={() => {
          if (selectedVideos?.map((v) => v.id)?.includes(item.id)) return;
          setSelectedVideos([
            {
              id: item.id,
              thumbnail: false,
              uri: item?.file_path,
              item_id: item.item_id,
            },
          ]);
        }}
      >
        <View
          style={{
            width: "100%",
            aspectRatio: "1 / 1",
            // borderRadius: 6,
            // overflow: "hidden",
          }}
        >
          <Image
            source={{ uri: thumbnailUrl }}
            style={{ width: "100%", height: "100%", resizeMode: "cover" }}
          />
          {/* <WorkoutVideo videoSource={item.file_path} autoplay={false} /> */}
        </View>
        <View
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 9999,
          }}
        >
          <Ionicons
            name="play-circle-outline"
            size={26}
            color="rgba(255, 255, 255, 0.8)"
          />
        </View>
        <View
          style={{
            ...styles.imageSelected,
            zIndex: 9999,
          }}
        >
          {selectedVideos?.map((video) => video.id)?.includes(item.id) && (
            <View
              style={{
                ...styles.imageSelectedFill,
              }}
            ></View>
          )}
        </View>
        {/* {selectedVideos?.map((video) => video.id).includes(item.id) && ( */}
        <View
          style={{
            ...styles.selectedImageOverlay,
            backgroundColor: selectedVideos
              ?.map((video) => video.id)
              ?.includes(item.id)
              ? "rgba(46, 161, 174, 0.5)"
              : "rgba(0, 0, 0, 0.5)",
          }}
        ></View>
        {/* )} */}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={mediaLibraryVideos}
      numColumns={3}
      renderItem={renderItem}
      keyExtractor={(item) => item?.id.toString()}
      contentContainerStyle={{
        paddingBottom: 60,
        flexGrow: 1,
        overflow: "hidden",
      }}
    />
  );
};

const styles = StyleSheet.create({
  containerWrapper: {
    flex: 1,
    marginTop: -30,
    paddingBottom: 40,
  },
  backButton: {
    position: "absolute",
    top: -20,
    left: 0,
    zIndex: 1,
    padding: 20,
  },
  workoutInfo: {
    // position: "absolute",
    // top: 0,
    // right: 20,
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
  },
  container: {
    // paddingTop: 30,
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
    zIndex: -1,
  },
  inputLabel: {
    alignSelf: "flex-start",
    marginBottom: 0,
    color: "rgba(0, 0, 0, 0.6)",
    paddingLeft: 12,
    fontSize: 13,
    lineHeight: 15,
  },
  pickerInputLabel: {
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
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: 8,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tagText: {
    fontSize: 13,
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
  pickerWrapper: {
    paddingVertical: 15,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#12a28d",
    borderRadius: 8,
    backgroundColor: "rgba(46, 161, 174, 0.05)",
    display: "flex",
    alignItems: "center",
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
    top: -5,
    right: 0,
  },
  imageSelected: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: "50%",
    borderWidth: 2,
    borderColor: "#12a28d",
  },
  imageSelectedFill: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 10,
    height: 10,
    backgroundColor: "#12a28d",
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
    // transform: "translate(0, 100%)",
    zIndex: 10,
  },
  selectPickerWrapper: {
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
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "90%",
    height: "80%",
    borderRadius: 10,
  },
});
