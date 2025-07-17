import {
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useNavigation } from "@react-navigation/native";
import { router, useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "@/context/authContext";
import { useCallback, useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { uploadProfileImage } from "@/api/media";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColor } from "@/hooks/useThemeColor";
import Toast from "react-native-toast-message";
import Constants from "expo-constants";
import {
  Client,
  createClient,
  getAllClients,
  updateClient,
} from "@/api/clients";
import CachedImage from "@/components/CachedImage";
import { normalizeAsset } from "@/helpers/normalizeAsset";
import { waitUntilAvailable } from "@/helpers/waitUntilAvailable";

type ClientAction = "create" | "edit" | null;

export default function ClientsScreen() {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [clientCreateLoading, setClientCreateLoading] = useState(false);

  const colorScheme = useColorScheme();

  const mainTextColor = useThemeColor({}, "mainText");
  const mainColor = useThemeColor({}, "main");
  const [modalVisible, setModalVisible] = useState(false);

  const [clientAction, setClientAction] = useState<ClientAction>(null);

  const [clientId, setClientId] = useState<number | null>(null);
  const [clientFirstName, setClientFirstName] = useState("");
  const [clientLastName, setClientLastName] = useState("");
  const [profileImage, setProfileImage] = useState<any>(null);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);

  const [createClientErrors, setCreateClientErrors] = useState({
    first_name: "",
    last_name: "",
  });

  const validateField = (field: "first_name" | "last_name", value: string) => {
    const newErrors = { ...createClientErrors };

    switch (field) {
      case "first_name":
        newErrors.first_name = value.trim() ? "" : "First name is required.";
        break;
      case "last_name":
        newErrors.last_name = value.trim() ? "" : "Last name is required.";
        break;
      default:
        break;
    }

    setCreateClientErrors(newErrors);
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { first_name: "", last_name: "" };

    // Validate Title
    if (!clientFirstName.trim()) {
      newErrors.first_name = "First name is required.";
      isValid = false;
    }

    if (!clientLastName.trim()) {
      newErrors.last_name = "Last name is required.";
      isValid = false;
    }

    setCreateClientErrors(newErrors);
    return isValid;
  };

  const [searchVal, setSearchVal] = useState("");

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
    const uploaded = await uploadProfileImage(normalized);

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
          Clients
        </ThemedText>
      </View>
      <View style={styles.filterContainer}>
        <View
          style={{
            ...styles.filterButton,
            opacity: 0,
          }}
        >
          <Ionicons name={"funnel-outline"} size={22} color="#fff" />
        </View>
      </View>
    </View>
  );

  const fetchClients = async () => {
    try {
      setLoading(true);
      const result = await getAllClients();

      setClients(result);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchClients();
    }, [])
  );
  const filteredClients = clients?.filter((client) =>
    `${client.first_name?.toLowerCase()} ${client.last_name?.toLowerCase()}`?.includes(
      searchVal.toLowerCase()
    )
  );

  const profileImages: Record<string, any> = {
    "model1.jpg": require("@/assets/images/model1.jpg"),
    "model2.jpg": require("@/assets/images/model2.jpg"),
  };

  const editProfileImage = profileImages.hasOwnProperty(profileImage);

  const renderClientForm = (mode: ClientAction) => {
    return (
      <View style={styles.formContainer}>
        <View style={styles.profileImageContainer}>
          <View
          // activeOpacity={0.7}
          >
            <View
              style={{
                position: "relative",
              }}
            >
              {profileImage ? (
                <CachedImage
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
              validateField("first_name", text);
            }}
          />
          {createClientErrors.first_name ? (
            <ThemedText style={styles.errorText}>
              {createClientErrors.first_name}
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
              validateField("last_name", text);
            }}
          />
          {createClientErrors.last_name ? (
            <ThemedText style={styles.errorText}>
              {createClientErrors.last_name}
            </ThemedText>
          ) : null}
        </View>
      </View>
    );
  };

  const resetFields = () => {
    setProfileImage(null);
    setClientFirstName("");
    setClientLastName("");
    setClientId(null);
    setCreateClientErrors({
      first_name: "",
      last_name: "",
    });
  };

  const openCreateClientModal = () => {
    resetFields();
    setClientAction("create");
    setModalVisible(true);
  };

  const openEditClientModal = (client: Client) => {
    setClientFirstName(client.first_name);
    setClientLastName(client.last_name);
    setProfileImage(client.profile_image);
    client.id && setClientId(client.id);
    setClientAction("edit");
    setModalVisible(true);
  };

  const handleClientCreate = async () => {
    try {
      const dataToSend = {
        first_name: clientFirstName,
        last_name: clientLastName,
        profile_image_id: profileImage?.id,
      };

      const createdClient = await createClient(
        dataToSend,
        setClientCreateLoading
      );

      if (createdClient) {
        setModalVisible(false);
        resetFields();
        fetchClients();
        setTimeout(() => {
          Toast.show({
            type: "success",
            text1: "Client created.",
            position: "top",
          });
        }, 500);
      }
    } catch (error) {
      console.error("Error in create client handler:", error);
    }
  };

  const handleClientUpdate = async () => {
    try {
      if (clientId) {
        const dataToSend = {
          first_name: clientFirstName,
          last_name: clientLastName,
          profile_image_id: profileImage?.id,
        };

        const createdClient = await updateClient(
          dataToSend,
          clientId,
          setClientCreateLoading
        );

        if (createdClient) {
          setModalVisible(false);
          resetFields();
          fetchClients();
          setTimeout(() => {
            Toast.show({
              type: "success",
              text1: "Client created.",
              position: "top",
            });
          }, 500);
        }
      }
    } catch (error) {
      console.error("Error in create client handler:", error);
    }
  };

  return (
    <View
      style={{
        ...styles.safeArea,
        backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
      }}
    >
      {renderHeader()}
      <TouchableOpacity
        style={styles.addButton}
        onPress={openCreateClientModal}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
      <View
        style={{
          ...styles.inputWrapper,
          paddingHorizontal: 10,
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

      {filteredClients && filteredClients?.length > 0 && (
        <ThemedText
          type="smallest"
          style={{
            color:
              colorScheme === "dark" ? "rgb(160, 160, 160)" : "rgb(51, 51, 51)",
            paddingTop: 20,
            paddingRight: 10,
            paddingBottom: 5,
            textAlign: "right",
          }}
        >
          {filteredClients?.length === clients?.length
            ? `${filteredClients.length} ${
                filteredClients.length === 1 ? "client" : "clients"
              }`
            : `${filteredClients.length} of ${clients?.length} ${
                clients?.length === 1 ? "client" : "clients"
              }`}
        </ThemedText>
      )}
      <ScrollView>
        <View style={{ flex: 1, paddingBottom: 120 }}>
          {loading ? (
            <ActivityIndicator
              size="large"
              style={{ marginTop: 40 }}
              color={"#12a28d"}
            />
          ) : filteredClients && filteredClients.length > 0 ? (
            filteredClients.map((client, index: number) => {
              return (
                <View
                  key={index}
                  style={{
                    ...styles.workoutWrapper,
                    backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
                    borderBottomWidth: 0.5,
                    borderColor:
                      colorScheme === "dark"
                        ? "rgba(80, 80, 80, 1)"
                        : "rgb(200, 200, 200)",
                    // shadowColor: colorScheme === "dark" ? "#fff" : "#393939",
                    // elevation: colorScheme === "dark" ? 2 : 1.1,
                  }}
                  // onPress={() => {
                  //   router.push({
                  //     pathname: "/single-workout",
                  //     params: { exerciseId: String(client.id) },
                  //   });
                  // }}
                >
                  <View
                    style={{
                      position: "absolute",
                      top: "50%",
                      transform: "translate(0, -50%)",
                      right: -10,
                      zIndex: 10,
                    }}
                  >
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        openEditClientModal(client);
                      }}
                      style={{
                        padding: 20,
                      }}
                    >
                      <Ionicons
                        name="document-text-outline"
                        size={20}
                        color="#12a28d"
                      />
                    </TouchableOpacity>
                  </View>
                  <View
                    style={{
                      ...styles.workoutImageWrapper,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {client.profile_image ? (
                      <Image
                        source={
                          // @ts-ignore
                          { uri: client.profile_image?.file_path }
                        }
                        style={styles.workoutImage}
                      />
                    ) : (
                      <Ionicons name="person" size={50} color="#12a28d" />
                    )}
                  </View>
                  <View style={styles.workoutInfo}>
                    <ThemedText
                      type={"smaller"}
                      style={{ fontFamily: "Default-Medium" }}
                    >
                      {client.first_name} {client.last_name}
                    </ThemedText>
                  </View>
                </View>
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
                  {clientAction === "edit" ? "Edit Client" : "New Client"}
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
                if (clientAction === "edit") {
                  if (validateForm()) {
                    handleClientUpdate();
                  }
                } else {
                  if (validateForm()) {
                    handleClientCreate();
                  }
                }
              }}
            >
              {clientCreateLoading ? (
                <ActivityIndicator
                  size="small"
                  // style={{ marginTop: 40 }}
                  color={"#12a28d"}
                />
              ) : (
                <Ionicons
                  name="add-circle-outline"
                  size={24}
                  color={mainTextColor}
                />
              )}
            </TouchableOpacity>
          </View>
          <ScrollView nestedScrollEnabled={true}>
            {renderClientForm(clientAction)}
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
