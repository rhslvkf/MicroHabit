import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { formatDateToKorean } from "../../utils/date";
import { useTheme } from "../../themes/ThemeContext";

interface DateHeaderProps {
  date?: string;
}

export function DateHeader({ date }: DateHeaderProps): React.ReactElement {
  const { theme } = useTheme();
  const formattedDate = formatDateToKorean(date);

  return (
    <View style={[styles.container, { borderBottomColor: theme.divider }]}>
      <Text style={[styles.date, { color: theme.text }]}>{formattedDate}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderBottomWidth: 1,
  },
  date: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
