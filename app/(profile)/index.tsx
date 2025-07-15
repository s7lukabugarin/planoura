import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/authContext";
import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { uploadProfileImage } from "@/api/media";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColor } from "@/hooks/useThemeColor";
import Constants from "expo-constants";
import Button from "@/components/Button";
import { deleteUser, updateCurrentUser, UpdateUserInterface } from "@/api/auth";
import Toast from "react-native-toast-message";
import { normalizeAsset } from "@/helpers/normalizeAsset";
import { waitUntilAvailable } from "@/helpers/waitUntilAvailable";
import CachedImage from "@/components/CachedImage";

export default function ClientsScreen() {
  const [deleteUserLoading, setDeleteUserLoading] = useState(false);

  const colorScheme = useColorScheme();

  const [editUserLoading, setEditUserLoading] = useState(false);

  const mainTextColor = useThemeColor({}, "mainText");
  const mainColor = useThemeColor({}, "main");

  const [modalVisible, setModalVisible] = useState(false);

  const [clientFirstName, setClientFirstName] = useState("");
  const [clientLastName, setClientLastName] = useState("");
  const [profileImage, setProfileImage] = useState<any>(null);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);

  const [searchVal, setSearchVal] = useState("");

  const { logout, userInfo, handleUserInfoUpdate } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (result.canceled || !result.assets || !result.assets[0]) return;

    const asset = result.assets[0];
    const normalized = normalizeAsset(asset); // koristi tvoj helper

    setImageUploadLoading(true);

    try {
      const uploaded = await uploadProfileImage(
        normalized,
        setImageUploadLoading
      );

      if (!uploaded || !uploaded.file_path) throw new Error("Upload failed");

      await waitUntilAvailable(uploaded.file_path);

      const uriWithBuster = `${uploaded.file_path}?t=${Date.now()}`;

      setProfileImage({
        ...uploaded,
        id: uploaded.id,
        file_path: uriWithBuster,
      });
    } catch (error) {
      console.error("Image upload failed", error);
    } finally {
      setImageUploadLoading(false);
    }
  };

  useEffect(() => {
    handleUserInfoUpdate && handleUserInfoUpdate();
  }, []);

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
          My Profile
        </ThemedText>
      </View>
      <View style={styles.filterContainer}>
        <View
          style={{
            ...styles.filterButton,
            opacity: 0,
          }}
          // onPress={() => setFiltersModalVisible(true)}
        >
          <Ionicons name={"funnel-outline"} size={22} color="#fff" />
        </View>
      </View>
    </View>
  );

  const openUserEditModal = () => {
    userInfo?.first_name && setClientFirstName(userInfo?.first_name);
    userInfo?.last_name && setClientLastName(userInfo?.last_name);
    userInfo?.profile_image && setProfileImage(userInfo?.profile_image as any);
    setModalVisible(true);
  };

  const renderProfileForm = () => {
    return (
      <View style={styles.formContainer}>
        <View style={styles.profileImageContainer}>
          <View
            style={{
              position: "relative",
            }}
          >
            {profileImage ? (
              <Image
                source={{
                  uri: profileImage?.file_path,
                }}
                style={styles.profileImage}
              />
            ) : (
              <View
                style={{
                  ...styles.profileImagePlaceholder,
                  backgroundColor:
                    colorScheme === "dark" ? "#07211e" : "#f3fbfa",
                }}
              >
                <Ionicons name="person" size={50} color="#12a28d" />
              </View>
            )}

            <View
              style={{
                ...styles.profileImagePlusIcon,
                backgroundColor:
                  colorScheme === "dark"
                    ? "rgba(0, 0, 0, 0.9)"
                    : "rgba(255, 255, 255, 0.9)",
              }}
            >
              <TouchableOpacity activeOpacity={0.7} onPress={pickImage}>
                {imageUploadLoading ? (
                  <ActivityIndicator size="small" color={"#12a28d"} />
                ) : profileImage ? (
                  <Ionicons name="create-outline" size={24} color="#12a28d" />
                ) : (
                  <Ionicons name="add-circle" size={24} color="#12a28d" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View
          style={{
            ...styles.inputWrapper,
            marginBottom: 0,
          }}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="person-outline" size={20} color={mainTextColor} />
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
            placeholder="First Name"
            placeholderTextColor={
              colorScheme === "dark"
                ? "rgb(170, 170, 170)"
                : "rgb(105, 105, 105)"
            }
            value={clientFirstName}
            onChangeText={(text) => {
              setClientFirstName(text);
              // validateField("title", text);
            }}
          />
          {/* {createExerciseErrors.title ? (
              <ThemedText style={styles.errorText}>
                {createExerciseErrors.title}
              </ThemedText>
            ) : null} */}
        </View>
        <View
          style={{
            ...styles.inputWrapper,
            marginBottom: 0,
          }}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="people-outline" size={20} color={mainTextColor} />
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
            placeholder="Last Name"
            placeholderTextColor={
              colorScheme === "dark"
                ? "rgb(170, 170, 170)"
                : "rgb(105, 105, 105)"
            }
            value={clientLastName}
            onChangeText={(text) => {
              setClientLastName(text);
              // validateField("title", text);
            }}
          />
        </View>
      </View>
    );
  };

  const editUserHandler = async () => {
    const dataToSend: UpdateUserInterface = {
      first_name: clientFirstName,
      last_name: clientLastName,
    };

    if (profileImage && profileImage.id) {
      dataToSend.profile_image_id = profileImage.id;
    }

    const res = await updateCurrentUser(dataToSend, setEditUserLoading);

    if (res) {
      setModalVisible(false);
      Toast.show({
        type: "success",
        text1: "Profile successfully updated",
      });

      handleUserInfoUpdate && handleUserInfoUpdate();
    }
  };

  return (
    // <TouchableOpacity style={{ marginTop: 100 }} onPress={() => handleLogout()}>
    //   <ThemedText>Logout</ThemedText>
    // </TouchableOpacity>
    <View
      style={{
        ...styles.safeArea,
        backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
      }}
    >
      {renderHeader()}

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View
          style={{
            flex: 1,
            padding: 20,
          }}
        >
          <View
            style={{
              paddingBottom: 40,
            }}
          >
            <View style={styles.profileImageContainer}>
              <View
              // activeOpacity={0.7}
              >
                <View
                  style={{
                    position: "relative",
                  }}
                >
                  {userInfo?.profile_image ? (
                    <CachedImage
                      source={{
                        uri: (userInfo?.profile_image as any)?.file_path,
                      }}
                      style={styles.profileImage}
                    />
                  ) : (
                    <View
                      style={{
                        ...styles.profileImagePlaceholder,
                        backgroundColor:
                          colorScheme === "dark" ? "#07211e" : "#f3fbfa",
                      }}
                    >
                      <Ionicons name="person" size={50} color="#12a28d" />
                    </View>
                  )}

                  {/* <View
                    style={{
                      ...styles.profileImagePlusIcon,
                      backgroundColor:
                        colorScheme === "dark"
                          ? "rgba(0, 0, 0, 0.9)"
                          : "rgba(255, 255, 255, 0.9)",
                    }}
                  >
                    <TouchableOpacity activeOpacity={0.7} onPress={pickImage}>
                      {imageUploadLoading ? (
                        <ActivityIndicator size="small" color={"#12a28d"} />
                      ) : profileImage ? (
                        <Ionicons
                          name="create-outline"
                          size={24}
                          color="#12a28d"
                        />
                      ) : (
                        <Ionicons name="add-circle" size={24} color="#12a28d" />
                      )}
                    </TouchableOpacity>
                  </View> */}
                </View>
              </View>
            </View>
            <View
              style={{
                ...styles.inputWrapper,
                marginBottom: 0,
              }}
            >
              <View style={styles.iconWrapper}>
                <Ionicons
                  name="person-outline"
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
                placeholder="First Name"
                placeholderTextColor={
                  colorScheme === "dark"
                    ? "rgb(170, 170, 170)"
                    : "rgb(105, 105, 105)"
                }
                value={userInfo?.first_name}
                editable={false}
              />
            </View>
            <View
              style={{
                ...styles.inputWrapper,
                marginBottom: 0,
              }}
            >
              <View style={styles.iconWrapper}>
                <Ionicons
                  name="people-outline"
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
                placeholder="Last Name"
                placeholderTextColor={
                  colorScheme === "dark"
                    ? "rgb(170, 170, 170)"
                    : "rgb(105, 105, 105)"
                }
                value={userInfo?.last_name}
                editable={false}
              />
            </View>
            <View
              style={{
                ...styles.inputWrapper,
                marginBottom: 0,
              }}
            >
              <View style={styles.iconWrapper}>
                <Ionicons name="mail-outline" size={20} color={mainTextColor} />
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
                placeholder="Last Name"
                placeholderTextColor={
                  colorScheme === "dark"
                    ? "rgb(170, 170, 170)"
                    : "rgb(105, 105, 105)"
                }
                value={userInfo?.email}
                editable={false}
              />
            </View>
            <Button
              text={"Edit profile"}
              buttonStyle={{
                backgroundColor: "#12a28d",
                // width: "60%",
                marginTop: 20,
              }}
              onPress={() => {
                setModalVisible(true);
                openUserEditModal();
              }}
            />
          </View>

          <View
            style={{
              borderTopWidth: 1,
              borderTopColor:
                colorScheme === "dark"
                  ? "rgba(100, 100, 100, 1)"
                  : "rgb(233, 233, 233)",
              paddingTop: 40,
              marginTop: 0,
            }}
          >
            <Button
              buttonStyle={{
                backgroundColor: "transparent",
                borderColor: "#12a28d",
                borderWidth: 1,
              }}
              icon={
                <Ionicons color="#12a28d" name="log-out-outline" size={24} />
              }
              text="Logout"
              textColor="#12a28d"
              onPress={() => handleLogout()}
            />
            <Button
              buttonStyle={{
                backgroundColor: "transparent",
                borderColor: "#ed232f",
                borderWidth: 1,
                marginTop: 14,
              }}
              loading={deleteUserLoading}
              icon={<Ionicons color="#ed232f" name="trash-outline" size={24} />}
              text="Delete profile"
              textColor="#ed232f"
              onPress={() => {
                if (userInfo?.email) {
                  Alert.alert(
                    "Are you sure?",
                    "This action will permanently delete your profile.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () =>
                          deleteUser(userInfo.email, setDeleteUserLoading),
                      },
                    ]
                  );
                }
              }}
            />
            {/* <TouchableOpacity
              activeOpacity={0.7}
              style={{
                ...styles.inputWrapper,
                paddingLeft: 10,
                paddingRight: 20,
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
              }}
              onPress={() => handleLogout()}
            >
              <View style={styles.iconWrapper}>
                <Ionicons
                  name="log-out-outline"
                  size={22}
                  color={colorScheme === "dark" ? "#ed232f" : "#ed232f"}
                />
              </View>
              <ThemedText style={{ marginLeft: 6, fontSize: 15 }}>
                Logout
              </ThemedText>
              <View style={{ marginLeft: "auto" }}>
                <Ionicons
                  name="chevron-forward-outline"
                  size={20}
                  color={mainTextColor}
                />
              </View>
            </TouchableOpacity> */}
            {/* <TouchableOpacity
            activeOpacity={0.7}
            style={{
              ...styles.inputWrapper,
              paddingLeft: 20,
              paddingRight: 30,
              paddingVertical: 20,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View style={styles.iconWrapper}>
              <Ionicons
                name="trash-outline"
                size={24}
                color={colorScheme === "dark" ? "#ed232f" : "#ed232f"}
              />
            </View>
            <ThemedText style={{ marginLeft: 10, color: "#ed232f" }}>Delete Account</ThemedText>
            <View style={{ marginLeft: "auto" }}>
              <Ionicons
                name="chevron-forward-outline"
                size={20}
                color={"#ed232f"}
              />
            </View>
          </TouchableOpacity> */}
          </View>
        </View>
      </ScrollView>
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent
      >
        <View style={{ flex: 1, backgroundColor: mainColor }}>
          <View
            style={{
              ...styles.overlayHeader,
              backgroundColor: colorScheme === "dark" ? "#15413c" : "#e6f7f5",
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
              }}
            >
              <Ionicons name="close-outline" size={28} color={mainTextColor} />
            </TouchableOpacity>
            <View style={styles.headerTextWrapper}>
              <View>
                <ThemedText type="title" style={styles.headerText}>
                  {"Edit Profile"}
                </ThemedText>
              </View>
            </View>
            <TouchableOpacity
              style={styles.successIcon}
              onPress={() => {
                editUserHandler();
              }}
            >
              {editUserLoading ? (
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
            {renderProfileForm()}
          </ScrollView>
        </View>
      </Modal>
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
  },
  logoStyles: {
    width: 52,
    height: 40,
  },
  workoutWrapper: {
    flexDirection: "row",
    alignItems: "center",
    // marginBottom: 15,
    backgroundColor: "#f7fbfb",
    borderRadius: 10,
    marginHorizontal: 10,
    // shadowColor: "#000",
    // shadowOpacity: 0.1,
    // shadowRadius: 5,
    // elevation: 1.1,
    // borderWidth: 0.2,
    // borderColor: "#E5E5E5",
    position: "relative",
    paddingRight: 10,
  },
  checkbox: {
    // position: "absolute",
    // left: -30,
  },
  workoutImageWrapper: {
    flex: 0.8,
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
    backgroundColor: "#E0F7FA",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 7,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    color: "#2e9daa",
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
    color: "#333",
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
    borderRadius: 24,
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
    backgroundColor: "rgba(46, 161, 174, 1)",
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
  selectedTag: {
    backgroundColor: "rgba(46, 161, 174, 1)",
  },
  selectedTagText: {
    color: "#fff",
  },
  uploadButton: {
    backgroundColor: "#12a28d",
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
    borderColor: "rgba(46, 161, 174, 1)",
    borderRadius: 8,
    backgroundColor: "rgba(46, 161, 174, 0.05)",
    display: "flex",
    alignItems: "center",
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
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
  },
  profileImage: {
    width: 130,
    height: 130,
    borderRadius: 24,
  },
  profileImagePlaceholder: {
    width: 130,
    height: 130,
    borderRadius: 24,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImagePlusIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    borderRadius: 999,
    padding: 4,
  },
});
