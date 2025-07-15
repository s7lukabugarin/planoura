import {
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
  ScrollView,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  SafeAreaView,
  Keyboard,
  // Image
} from "react-native";
// import { Image } from "expo-image";
import CachedImage from "@/components/CachedImage";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import React, { useCallback, useEffect, useState } from "react";
import { useExercises } from "@/context/excersisesContext";
import WorkoutVideo from "@/components/calendar/WorkoutVideo";
import { useTags } from "@/context/tagsContext";
import { useFocusEffect, useRouter } from "expo-router";
import {
  createExercise,
  CreateExerciseData,
  ExerciseGroup,
  ExerciseTag,
  getAllExercicesGroups,
  getAllExercisesForGroup,
} from "@/api/exercices";
import * as ImagePicker from "expo-image-picker";
import {
  fetchAllImages,
  fetchAllVideos,
  ImageItemResponse,
  uploadImage,
  uploadVideo,
} from "@/api/media";
import Toast from "react-native-toast-message";
import { useIsFocused } from "@react-navigation/native";
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
import Constants from "expo-constants";
import { convertToSeconds } from "@/helpers/convertMinutesToSeconds";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "@/context/authContext";
import Button from "@/components/Button";
import { Image } from "expo-image";
import { normalizeAsset } from "@/helpers/normalizeAsset";
import { waitUntilAvailable } from "@/helpers/waitUntilAvailable";

export default function ExcerciseScreen({ navigation }: any) {
  const [editorFocused, setEditorFocused] = useState(false);

  const [iosPickerVisible, setIosPickerVisible] = useState(false);

  const [selectedFormGroup, setSelectedFormGroup] = useState<number | null>(
    null
  );

  const [exercises, setExercises] = useState<any>(null);
  const [exercisesLoading, setExercisesLoading] = useState(false);
  const [groups, setGroups] = useState<ExerciseGroup[] | null>(null);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ExerciseGroup | null>(
    null
  );
  const [showTooltip, setShowTooltip] = useState(false);

  const colorScheme = useColorScheme();

  const mainTextColor = useThemeColor({}, "mainText");
  const mainColor = useThemeColor({}, "main");

  const customFont = `
    ${PoppinsRegular}
    * {
        font-family: 'Default-Regular', sans-serif;
        font-size: 12px;
        color: ${mainTextColor};
    }
    p, li {
        font-size: 15px;
    }
    `;

  const editorCss = `
  * {
    background-color: transparent;
    color: ${mainTextColor};
    overlow-y: auto;
  }
  blockquote {
    border-left: 3px solid #babaca;
    padding-left: 1rem;
  }
  .highlight-background {
    background-color: #474749;
  }
`;

  const editor = useEditorBridge({
    // theme: darkEditorTheme,
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
    initialContent: "",
    onChange: async () => {
      const content = await editor.getHTML();

      const stringifiedContent = String(content);
      validateField("description", stringifiedContent);

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

  const isFocused = useIsFocused();

  const { userId } = useAuth();

  const router = useRouter();

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

  const [createExerciseVisible, setCreateExerciseVisible] = useState(false);
  const [createExerciseLoading, setCreateExerciseLoading] = useState(false);
  const [filtersModalVisible, setFiltersModalVisible] = useState(false);

  const [searchVal, setSearchVal] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);

  const [exerciseTitle, setExerciseTitle] = useState("");
  const [exerciseDescription, setExerciseDescription] = useState("");
  const [exerciseDuration, setExerciseDuration] = useState("");

  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<
    { id: string; thumbnail: boolean; uri: string }[]
  >([]);
  const [uploadedImage, setUploadedImage] = useState<{
    id: string;
    thumbnail: boolean;
    uri: string;
  } | null>(null);

  const [createExerciseSelectedTags, setCreateExerciseSelectedTags] = useState<
    ExerciseTag[]
  >([]);

  const [videoUploadLoading, setVideoUploadLoading] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<
    { id: string; thumbnail: boolean; uri: string; item_id: string }[]
  >([]);

  const [createExerciseErrors, setCreateExerciseErrors] = useState({
    title: "",
    description: "",
    group: "",
  });

  const { fetchExerciseTagsPerGroup, exerciseTagsPerGroup } = useTags();

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
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      if (selectedGroup) {
        fetchExercisesForGroup();
      } else {
        setExercises(null);
        setExercisesLoading(true);
      }
    }, [selectedGroup])
  );

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

  const validateField = (
    field: "title" | "description" | "group",
    value: string
  ) => {
    const newErrors = { ...createExerciseErrors };

    switch (field) {
      case "title":
        newErrors.title = value.trim() ? "" : "Title is required.";
        break;
      case "description":
        newErrors.description =
          value.trim() === "<p></p>" || value.trim() === ""
            ? "Description is required."
            : "";
        break;
      case "group":
        newErrors.group = value ? "" : "Group is required.";
        break;
      default:
        break;
    }

    setCreateExerciseErrors(newErrors);
  };

  const renderHeader = () => (
    <View
      style={{
        ...styles.header,
        backgroundColor: colorScheme === "dark" ? "#212121" : "#12a28d",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
        <CachedImage
          source={require("@/assets/images/splash-logo-white.png")}
          style={{
            ...styles.logoStyles,
          }}
        />
        <ThemedText
          type="subtitle"
          style={{ color: "#fff", paddingTop: 8, fontSize: 18 }}
        >
          Exercises
        </ThemedText>
      </View>
      {selectedGroup && !exercisesLoading && (
        <View style={styles.filterContainer}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.filterButton}
            onPress={() => setFiltersModalVisible(true)}
          >
            <Ionicons name={"funnel-outline"} size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

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
      } catch(err: any) {
        console.error(err);
      } finally {
        setVideoUploadLoading(false);
      }
    } else {
      console.warn("Nepodržani tip fajla:", asset.type);
    }
  };

  const removeImage = (id: string) => {
    setSelectedImages((prev) => {
      // Find the image to be removed
      const removedImage = prev.find((image) => image.id === id);
      // Filter out the image
      const updatedImages = prev.filter((image) => image.id !== id);

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
    const newErrors = { title: "", description: "", group: "" };

    // Validate Title
    if (!exerciseTitle.trim()) {
      newErrors.title = "Title is required.";
      isValid = false;
    }

    if (
      !exerciseDescription.trim() ||
      exerciseDescription.trim() === "<p></p>"
    ) {
      newErrors.description = "Description is required.";
      isValid = false;
    }

    if (!selectedFormGroup) {
      newErrors.group = "Group is required.";
      isValid = false;
    }

    setCreateExerciseErrors(newErrors);
    return isValid;
  };

  const createExerciseHandler = async () => {
    if (selectedFormGroup) {
      const thumbnail = selectedImages?.find((image) => image.thumbnail)?.id;
      const dataToSend: CreateExerciseData = {
        name: exerciseTitle,
        description: exerciseDescription,
        duration_in_seconds: convertToSeconds(Number(exerciseDuration)),
        exercise_tags: createExerciseSelectedTags?.map((t) => t.id),
        images: selectedImages?.map((image) => ({
          id: Number(image.id),
          thumbnail: image.thumbnail,
        })),
        videos: selectedVideos?.map((video) => ({
          id: Number(video.id),
        })),
        is_public: true,
        exercise_group: selectedFormGroup,
        thumbnail_image: thumbnail ? Number(thumbnail) : null,
      };

      const createdExercise = await createExercise(
        dataToSend,
        setCreateExerciseLoading
      );

      if (createdExercise) {
        setCreateExerciseVisible(false);
        fetchExercisesForGroup();
        // fetchExercises();
        setTimeout(() => {
          Toast.show({
            type: "success",
            text1: "Exercise created.",
            position: "top",
          });
        }, 500);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = editor._subscribeToEditorStateUpdate?.((state) => {
      setEditorFocused(state.isFocused);
    });

    return () => {
      // Ako vrati unsubscribe funkciju
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [editor]);

  const renderCreateExerciseForm = (
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
                position: "relative",
              }}
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
                    onValueChange={(value) => {
                      setSelectedFormGroup(value);
                      validateField("group", String(value));
                    }}
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
              {createExerciseErrors.group ? (
                <ThemedText
                  style={{
                    ...styles.errorText,
                    color: colorScheme === "dark" ? "#FF6B6B" : "#FA5A5A",
                  }}
                >
                  {createExerciseErrors.group}
                </ThemedText>
              ) : null}
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
              {createExerciseErrors.title ? (
                <ThemedText
                  style={{
                    ...styles.errorText,
                    color: colorScheme === "dark" ? "#FF6B6B" : "#FA5A5A",
                  }}
                >
                  {createExerciseErrors.title}
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
              minHeight: 250,
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
                width: "100%",
                backgroundColor: "transparent",
              }}
            />
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.keyboardAvoidingView}
            >
              <Toolbar editor={editor} hidden={false} />
            </KeyboardAvoidingView>
          </SafeAreaView>
          {createExerciseErrors.description ? (
            <ThemedText
              style={{
                ...styles.errorText,
                bottom: 40,
                color: colorScheme === "dark" ? "#FF6B6B" : "#FA5A5A",
              }}
            >
              {createExerciseErrors.description}
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
            <View style={styles.inputWrapper}>
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
                }}
                editable={!finalFormVisible}
              />
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

              {/* {createExerciseErrors.description ? (
            <ThemedText style={styles.errorText}>
              {createExerciseErrors.description}
            </ThemedText>
          ) : null} */}
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
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  width: "100%",
                }}
              >
                {selectedImages.map((image) => {
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
                            prevState.map((img) => ({
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
                        onPress={() => removeImage(image.id)}
                      >
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color={colorScheme === "dark" ? "#FF6B6B" : "#FA5A5A"}
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
                    {selectedVideos.map((video) => {
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
                const createExerciseSelectedTagsIds =
                  createExerciseSelectedTags.map((tag: any) => tag.id);
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
                                setCreateExerciseSelectedTags((prevState) => {
                                  const createExerciseSelectedTagsIds =
                                    prevState.map((tag) => tag.id);
                                  if (
                                    createExerciseSelectedTagsIds.includes(
                                      tag.id
                                    )
                                  ) {
                                    return prevState.filter(
                                      (t) => t.id !== tag.id
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
                                    createExerciseSelectedTagsIds.includes(
                                      tag.id
                                    )
                                      ? "checkbox"
                                      : "square-outline"
                                  }
                                  size={24}
                                  color={
                                    createExerciseSelectedTagsIds.includes(
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

  const filteredExercises = exercises
    ?.filter((exercise: any) =>
      selectedTags.length
        ? exercise.exercise_tags.some((tag: any) =>
            selectedTags.map((t: any) => t.name).includes(tag.name)
          )
        : true
    )
    ?.filter((exercise: any) =>
      exercise.name.toLowerCase().includes(searchVal.toLowerCase())
    );

  const resetFields = () => {
    setExerciseTitle("");
    setExerciseDescription("");
    setExerciseDuration("");
    setCreateExerciseSelectedTags([]);
    setSelectedImages([]);
    setSelectedVideos([]);
    setSelectedFormGroup(null);
    setCreateExerciseErrors({
      title: "",
      description: "",
      group: "",
    });
  };

  const toggleTooltip = () => setShowTooltip((prevState) => !prevState);

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
          opacity: 0.2,
          alignItems: "center",
          justifyContent: "center",
          // backgroundColor: "red"
        }}
      >
        {colorScheme === "dark" ? (
          <Image
            source={require("@/assets/images/splash-logo-white.png")}
            style={{
              width: "100%",
              height: "50%",
              // height: "50%",
              objectFit: "cover",
            }}
          />
        ) : (
          <Image
            source={require("@/assets/images/logo-veci.png")}
            style={{
              width: "100%",
              height: "50%",
              // height: "50%",
              objectFit: "cover",
            }}
          />
        )}
      </View> */}
      {renderHeader()}
      {selectedGroup && !exercisesLoading && (
        <TouchableOpacity
          style={{
            ...styles.addButton,
            right: "auto",
            left: 20,
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

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setCreateExerciseVisible(true);
          resetFields();
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
      {selectedGroup ? (
        exercisesLoading ? (
          <ActivityIndicator
            size="large"
            style={{ marginTop: 40 }}
            color={"#12a28d"}
          />
        ) : (
          <>
            <View>
              <ThemedText
                type="defaultSemiBold"
                style={{
                  marginHorizontal: 10,
                  marginTop: 20,
                  marginBottom: 10,
                  fontSize: 16,
                }}
              >
                {selectedGroup.name}
              </ThemedText>
            </View>
            <View
              style={{
                ...styles.inputWrapper,
                marginBottom: 0,
                paddingHorizontal: 15,
                paddingLeft: 10,
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
                value={searchVal}
                onChangeText={(text) => {
                  setSearchVal(text);
                }}
              />
              {searchVal.length > 0 && (
                <TouchableOpacity
                  style={{
                    position: "absolute",
                    right: 10,
                    top: 18,
                  }}
                  onPress={() => {
                    setSearchVal("");
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
            {selectedTags && selectedTags.length > 0 && (
              <View
                style={{
                  ...styles.filtersContainer,
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                {selectedTags.map((t: any) => {
                  return (
                    <TouchableOpacity
                      style={{
                        ...styles.filterTag,
                        borderColor:
                          colorScheme === "dark"
                            ? "rgb(80, 80, 80)"
                            : "rgb(221, 221, 221)",
                      }}
                      key={t.id}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedTags((prevState) =>
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
            {filteredExercises?.length > 0 && (
              <ThemedText
                type="smallest"
                style={{
                  color:
                    colorScheme === "dark"
                      ? "rgb(160, 160, 160)"
                      : "rgb(51, 51, 51)",
                  paddingTop: selectedTags.length > 0 ? 10 : 20,
                  paddingRight: 10,
                  paddingBottom: 5,
                  textAlign: "right",
                }}
              >
                {filteredExercises?.length === exercises?.length
                  ? `${filteredExercises.length} ${
                      filteredExercises.length === 1 ? "exercise" : "exercises"
                    }`
                  : `${filteredExercises.length} of ${exercises?.length} ${
                      exercises?.length === 1 ? "exercise" : "exercises"
                    }`}
              </ThemedText>
            )}

            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingBottom: 120 }}
              ListEmptyComponent={
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
              }
              ListHeaderComponent={
                exercisesLoading ? (
                  <ActivityIndicator
                    size="large"
                    style={{ marginTop: 40 }}
                    color="#12a28d"
                  />
                ) : null
              }
              initialNumToRender={8}
              maxToRenderPerBatch={6}
              windowSize={10}
              renderItem={({ item, index }) => {
                const {
                  name,
                  videos,
                  duration_in_seconds,
                  exercise_tags,
                  images,
                  created_by,
                  is_public,
                  status,
                } = item;

                const { hours, minutes, seconds } = convertSeconds(
                  Number(duration_in_seconds)
                );

                const video = videos[0]?.file_path;

                const thumbnailImage =
                  images?.find((img: any) => img.id === item.thumbnail_image)
                    ?.file_path ?? images?.[0]?.file_path;

                const statusMap = {
                  1: "public",
                  2: "private",
                  3: "review",
                } as const;

                type StatusKey = keyof typeof statusMap;

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
                      router.push({
                        pathname: "/single-workout",
                        params: { exerciseId: String(item.id) },
                      });
                    }}
                  >
                    <View
                      style={{
                        position: "absolute",
                        top: "50%",
                        transform: [{ translateY: -10 }],
                        right: 0,
                        pointerEvents: "none",
                      }}
                    >
                      <Ionicons
                        name="chevron-forward-outline"
                        size={20}
                        color={mainTextColor}
                      />
                    </View>
                    <View style={styles.workoutImageWrapper}>
                      <CachedImage
                        source={
                          thumbnailImage
                            ? { uri: thumbnailImage }
                            : require("@/assets/images/splash-logo.png")
                        }
                        style={styles.workoutImage}
                        contentFit="cover"
                        // fallbackSource={require('@/assets/images/splash-logo.png')}
                      />
                    </View>
                    <View style={styles.workoutInfo}>
                      <ThemedText
                        type="smaller"
                        style={{ fontFamily: "Default-Medium" }}
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

                      <View style={styles.tagsContainer}>
                        <View style={{ width: "100%" }}>
                          <View
                            style={{
                              alignSelf: "flex-start",
                            }}
                          >
                            {statusMap[status as StatusKey] === "public" ? (
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
                                  Private
                                  {statusMap[status as StatusKey] ===
                                    "review" && ` - In Review`}
                                </ThemedText>
                              </View>
                            )}
                          </View>
                        </View>
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
              }}
            />
          </>
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
          <View style={{ flex: 1, paddingBottom: 120 }}>
            <ThemedText
              type="defaultSemiBold"
              style={{
                marginHorizontal: 10,
                marginTop: 20,
                marginBottom: 10,
                fontSize: 16,
              }}
            >
              Select Group
            </ThemedText>
            {groupsLoading ? (
              <ActivityIndicator
                size="large"
                style={{ marginTop: 40 }}
                color={"#12a28d"}
              />
            ) : (
              groups?.map((group, index) => {
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
              })
            )}
          </View>
        </ScrollView>
      ) : (
        <View></View>
      )}

      <Modal
        visible={createExerciseVisible}
        animationType="slide"
        onRequestClose={() => {
          setCreateExerciseVisible(false);
        }}
        statusBarTranslucent
        // transparent
      >
        <View style={{ flex: 1, backgroundColor: mainColor }}>
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
                  zIndex: 99,
                  backgroundColor:
                    colorScheme === "dark"
                      ? "rgba(0, 0, 0, 0.65)"
                      : "rgba(0, 0, 0, 0.4)",
                }}
              />
            </TouchableWithoutFeedback>
          )}
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
                    {/* <Ionicons
                        name="close-outline"
                        size={24}
                        color={mainTextColor}
                      /> */}
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
          <View
            style={{
              ...styles.overlayHeader,
              backgroundColor: colorScheme === "dark" ? "#15413c" : "#e6f7f5",
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setCreateExerciseVisible(false);
              }}
            >
              <Ionicons name="close-outline" size={28} color={mainTextColor} />
            </TouchableOpacity>
            <View style={styles.headerTextWrapper}>
              {/* <View> */}
              <ThemedText type="title" style={styles.headerText}>
                New Private
                {"\n"}Exercise
              </ThemedText>
              <View style={styles.question}>
                <TouchableWithoutFeedback onPress={toggleTooltip}>
                  <Ionicons
                    name="help-circle-outline"
                    size={24}
                    color={mainTextColor}
                  />
                </TouchableWithoutFeedback>

                {showTooltip && (
                  <View style={styles.tooltip}>
                    <ThemedText style={styles.tooltipText}>
                      This is where you can create a new personalized exercise.
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.successIcon}
              onPress={() => {
                if (validateForm()) {
                  createExerciseHandler();
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
              {createExerciseLoading ? (
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
            {renderCreateExerciseForm()}
          </ScrollView>
        </View>
        <Toast />
      </Modal>
      {filtersModalVisible && (
        <TouchableWithoutFeedback onPress={() => setFiltersModalVisible(false)}>
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
        transparent
        visible={filtersModalVisible}
        animationType="slide"
        onRequestClose={() => setFiltersModalVisible(false)}
        statusBarTranslucent
      >
        {filtersModalVisible && (
          <TouchableWithoutFeedback
            onPress={() => setFiltersModalVisible(false)}
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
                onPress={() => setFiltersModalVisible(false)}
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
                    tagGroup.exercise_tags_set &&
                    tagGroup.exercise_tags_set.length > 0 && (
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
                          {tagGroup.exercise_tags_set?.map((tag: any) => {
                            return (
                              <TouchableOpacity
                                key={tag.id}
                                activeOpacity={0.7}
                                style={{ flexDirection: "row", gap: 4 }}
                                onPress={() => {
                                  setSelectedTags((prevState: any) => {
                                    const selectedTagsIds = prevState.map(
                                      (tag: any) => tag.id
                                    );
                                    if (selectedTagsIds.includes(tag.id)) {
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
                                      selectedTagsIds.includes(tag.id)
                                        ? "checkbox"
                                        : "square-outline"
                                    }
                                    size={24}
                                    color={
                                      selectedTagsIds.includes(tag.id)
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
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* <Modal
        transparent
        visible={mediaLibraryModalParams.visible}
        presentationStyle="overFullScreen"
        animationType="slide"
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
                backgroundColor: colorScheme === "dark" ? "#212121" : mainColor,
              }}
            >
              <TouchableOpacity
                style={{
                  ...styles.closeButton,
                  marginBottom: 15,
                }}
                onPress={() =>
                  setMediaLibraryModalParams((prevState) => ({
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
         
            </View>
          </View>
        </View>
      </Modal> */}
    </View>
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
        (selectedImage) => String(selectedImage.id) === item.id
      );

      if (isAlreadySelected) {
        // Remove the image
        const updatedSelection = prevSelected.filter(
          (selectedImage) => String(selectedImage.id) !== item.id
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
          { id: item.id, thumbnail: false, uri: item?.file_path },
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
      <CachedImage
        source={{ uri: item?.file_path }}
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          // borderRadius: 6,
        }}
      />
      <View style={styles.imageSelected}>
        {selectedImages?.map((image) => String(image.id)).includes(item.id) && (
          <View style={styles.imageSelectedFill}></View>
        )}
      </View>
      {selectedImages?.map((image) => String(image.id)).includes(item.id) && (
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
      keyExtractor={(item) => item.id.toString()}
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
          if (selectedVideos?.map((v) => v.id).includes(item.id)) return;
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
          <CachedImage
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
          {selectedVideos?.map((video) => video.id).includes(item.id) && (
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
              .includes(item.id)
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
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{
        paddingBottom: 60,
        flexGrow: 1,
        overflow: "hidden",
      }}
    />
  );
};

const styles = StyleSheet.create({
  tooltip: {
    position: "absolute",
    top: 30,
    left: -80,
    width: 180,
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 6,
    zIndex: 10,
  },
  tooltipText: {
    color: "#fff",
    fontSize: 12,
  },
  question: {
    position: "absolute",
    top: 14,
    right: -50,
  },
  safeArea: {
    flex: 1,
    // backgroundColor: "#fff",
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
  },
  logoStyles: {
    width: 52,
    height: 40,
  },
  workoutWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
    borderRadius: 10,
    marginHorizontal: 10,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 1.1,
    borderWidth: 0.2,
    position: "relative",
    paddingRight: 10,
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
  },
  filtersContainer: {
    flexDirection: "row",
    marginTop: 20,
    flexWrap: "wrap",
    paddingHorizontal: 10,
  },
  filterTag: {
    borderWidth: 1,
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
    backgroundColor: "#c",
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
    position: "relative",
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
    position: "relative",
  },
  formContainer: {
    paddingVertical: 20,
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
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
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
    // color: "red",
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
    top: -5,
    right: 0,
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
  selectPickerWrapper: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    height: 46,
    position: "relative",
    width: "89%",
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
    paddingRight: 30,
    width: "100%",
    textAlign: "right",
    color: "#000000",
    fontSize: 12,
    textTransform: "capitalize",
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
});
