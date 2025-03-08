import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { formatDateToKorean, getTodayISOString } from "../../utils/date";
import { useTheme } from "../../themes/ThemeContext";

interface DateHeaderProps {
  date?: string;
}

export function DateHeader({ date }: DateHeaderProps): React.ReactElement {
  const { theme } = useTheme();

  // 항상 최신 날짜를 사용하도록 useMemo 사용
  const formattedDate = useMemo(() => {
    // date가 없거나 오늘 날짜가 아니라면 오늘 날짜 사용
    const today = getTodayISOString();
    const dateToUse = date || today;
    return formatDateToKorean(dateToUse);
  }, [date]);

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
