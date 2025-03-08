import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Switch, TouchableOpacity, Modal, Platform, ScrollView, Button } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../../themes/ThemeContext";
import { NotificationSetting } from "../../types";

interface NotificationSelectorProps {
  notificationSetting: NotificationSetting | undefined;
  onChange: (setting: NotificationSetting | null) => void;
}

export function NotificationSelector({ notificationSetting, onChange }: NotificationSelectorProps): React.ReactElement {
  const { theme } = useTheme();
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState("08:00");
  const [days, setDays] = useState<number[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);

  // 초기값 설정
  useEffect(() => {
    if (notificationSetting) {
      setEnabled(notificationSetting.enabled);
      setTime(notificationSetting.time);
      setDays(notificationSetting.days);
    } else {
      // 기본값 설정
      setEnabled(false);
      setTime("08:00");
      setDays([]);
    }
  }, [notificationSetting]);

  // 알림 활성화 상태 변경
  const handleToggleEnabled = (value: boolean) => {
    setEnabled(value);

    if (value) {
      // 알림 활성화
      onChange({
        enabled: true,
        time,
        days,
      });
    } else {
      // 알림 비활성화
      onChange({
        enabled: false,
        time,
        days,
      });
    }
  };

  // 시간 변경
  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === "ios");

    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, "0");
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
      const newTime = `${hours}:${minutes}`;

      setTime(newTime);

      if (enabled) {
        onChange({
          enabled,
          time: newTime,
          days,
        });
      }
    }
  };

  // 요일 선택
  const handleToggleDay = (day: number) => {
    let newDays: number[];

    if (days.includes(day)) {
      newDays = days.filter((d) => d !== day);
    } else {
      newDays = [...days, day].sort();
    }

    setDays(newDays);

    if (enabled) {
      onChange({
        enabled,
        time,
        days: newDays,
      });
    }
  };

  // 모든 요일 선택/해제
  const handleToggleAllDays = () => {
    const allDays = [1, 2, 3, 4, 5, 6, 7];
    const newDays = days.length === 7 ? [] : allDays;

    setDays(newDays);

    if (enabled) {
      onChange({
        enabled,
        time,
        days: newDays,
      });
    }
  };

  // 시간 선택기 열기
  const handleOpenTimePicker = () => {
    setShowTimePicker(true);
  };

  // 요일 선택기 열기/닫기
  const handleToggleDayPicker = () => {
    setShowDayPicker(!showDayPicker);
  };

  // 선택된 요일 텍스트
  const getDaysText = () => {
    if (days.length === 0) {
      return "매일";
    } else if (days.length === 7) {
      return "매일";
    } else {
      const dayNames = ["", "월", "화", "수", "목", "금", "토", "일"];
      return days.map((day) => dayNames[day]).join(", ");
    }
  };

  // 시간 표시
  const getTimeText = () => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "오후" : "오전";
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${period} ${displayHours}:${minutes.toString().padStart(2, "0")}`;
  };

  // 현재 시간 Date 객체
  const getTimeDate = () => {
    const date = new Date();
    const [hours, minutes] = time.split(":").map(Number);
    date.setHours(hours);
    date.setMinutes(minutes);
    return date;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: theme.text }]}>알림 설정</Text>
        <Switch
          value={enabled}
          onValueChange={handleToggleEnabled}
          trackColor={{ false: "#767577", true: theme.primary }}
          thumbColor={Platform.OS === "ios" ? undefined : "#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
        />
      </View>

      {enabled && (
        <View style={styles.settingsContainer}>
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: theme.divider }]}
            onPress={handleOpenTimePicker}
          >
            <View style={styles.settingLabelContainer}>
              <Ionicons name="time-outline" size={20} color={theme.text} style={styles.icon} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>시간</Text>
            </View>
            <Text style={[styles.settingValue, { color: theme.primary }]}>{getTimeText()}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={handleToggleDayPicker}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="calendar-outline" size={20} color={theme.text} style={styles.icon} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>요일</Text>
            </View>
            <View style={styles.dayTextContainer}>
              <Text style={[styles.settingValue, { color: theme.primary }]}>{getDaysText()}</Text>
              <Ionicons
                name={showDayPicker ? "chevron-up-outline" : "chevron-down-outline"}
                size={16}
                color={theme.primary}
                style={styles.chevron}
              />
            </View>
          </TouchableOpacity>

          {showDayPicker && (
            <View style={[styles.dayPickerContainer, { backgroundColor: theme.card }]}>
              <View style={styles.dayPickerHeader}>
                <Text style={[styles.dayPickerTitle, { color: theme.text }]}>요일 선택</Text>
                <TouchableOpacity onPress={handleToggleAllDays}>
                  <Text style={[styles.allDaysButton, { color: theme.primary }]}>
                    {days.length === 7 ? "모두 해제" : "모두 선택"}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.daysContainer}>
                {["월", "화", "수", "목", "금", "토", "일"].map((day, index) => {
                  const dayNumber = index + 1;
                  const isSelected = days.includes(dayNumber);

                  return (
                    <TouchableOpacity
                      key={dayNumber}
                      style={[styles.dayButton, isSelected && { backgroundColor: theme.primary }]}
                      onPress={() => handleToggleDay(dayNumber)}
                    >
                      <Text style={[styles.dayButtonText, { color: isSelected ? "white" : theme.text }]}>{day}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      )}

      {Platform.OS === "ios" && showTimePicker && (
        <Modal visible={showTimePicker} transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={[styles.modalHeaderButton, { color: theme.primary }]}>취소</Text>
                </TouchableOpacity>
                <Text style={[styles.modalHeaderTitle, { color: theme.text }]}>시간 선택</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={[styles.modalHeaderButton, { color: theme.primary }]}>확인</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={getTimeDate()}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                // @ts-ignore - 안드로이드는 minuteInterval이 지원되지 않음
                minuteInterval={5}
                style={styles.timePicker}
              />
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === "android" && showTimePicker && (
        <DateTimePicker value={getTimeDate()} mode="time" is24Hour={true} onChange={handleTimeChange} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
  },
  settingsContainer: {
    marginTop: 4,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 8,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  dayTextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  chevron: {
    marginLeft: 4,
  },
  dayPickerContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  dayPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dayPickerTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  allDaysButton: {
    fontSize: 14,
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalHeaderButton: {
    fontSize: 16,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  timePicker: {
    height: 200,
  },
});
