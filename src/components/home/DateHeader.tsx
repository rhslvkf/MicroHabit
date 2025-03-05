import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { formatDateToKorean } from "../../utils/date";

interface DateHeaderProps {
  date?: string;
}

export function DateHeader({ date }: DateHeaderProps): React.ReactElement {
  const formattedDate = formatDateToKorean(date);

  return (
    <View style={styles.container}>
      <Text style={styles.date}>{formattedDate}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  date: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
});
