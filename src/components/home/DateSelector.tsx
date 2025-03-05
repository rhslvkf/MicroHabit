import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDate } from "../../utils/date";

interface DateSelectorProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onCalendarPress: (date: string) => void;
}

export function DateSelector({ selectedDate, onSelectDate, onCalendarPress }: DateSelectorProps): React.ReactElement {
  // 이전 날짜로 이동
  const goToPreviousDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() - 1);
    onSelectDate(currentDate.toISOString());
  };

  // 다음 날짜로 이동
  const goToNextDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + 1);
    onSelectDate(currentDate.toISOString());
  };

  // 오늘 날짜로 이동
  const goToToday = () => {
    const today = new Date();
    onSelectDate(today.toISOString());
  };

  return (
    <View style={styles.container}>
      <View style={styles.dateControls}>
        <TouchableOpacity onPress={goToPreviousDay} style={styles.arrowButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onCalendarPress(selectedDate)} style={styles.dateDisplay}>
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          <Ionicons name="calendar" size={18} color="#007AFF" style={styles.calendarIcon} />
        </TouchableOpacity>

        <TouchableOpacity onPress={goToNextDay} style={styles.arrowButton}>
          <Ionicons name="chevron-forward" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
        <Text style={styles.todayText}>오늘</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  dateControls: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  arrowButton: {
    padding: 4,
  },
  dateDisplay: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    flex: 1,
    justifyContent: "center",
  },
  dateText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  calendarIcon: {
    marginLeft: 6,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    marginLeft: 16,
  },
  todayText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});
