import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import moment from "moment";
import DateTimePicker from '@react-native-community/datetimepicker';

interface DatePickerModalProps {
  isVisible: boolean;
  selectedDate: string;
  onClose: (event: GestureResponderEvent) => void;
  onSubmit: (minute: number) => void;
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isVisible,
  selectedDate,
  onClose,
  onSubmit,
}) => {
  const [date, setDate] = useState(new Date())


  return (
    <Modal visible={isVisible} animationType="slide" transparent={false}>
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {selectedDate
              ? moment(selectedDate).format("ddd, MMM D")
              : "Select Date"}
          </Text>
          <TouchableOpacity onPress={() => {}}>
            <Ionicons name="add-circle-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <DateTimePicker mode="time" display="default" value={new Date()} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    width: "100%",
    height: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomColor: "#E5E5E5",
    backgroundColor: "#eaf4f3",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
});

export default DatePickerModal;
