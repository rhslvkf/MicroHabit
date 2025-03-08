import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Switch,
  TouchableOpacity,
  Modal,
  Platform,
  ScrollView,
  Button,
  Alert,
} from "react-native";
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
      setDays([1, 2, 3, 4, 5, 6, 7]); // 모든 요일 선택(매일)
    }
  }, [notificationSetting]);

  // 알림 활성화 상태 변경
  const handleToggleEnabled = (value: boolean) => {
    setEnabled(value);

    if (value) {
      // 알림 활성화 시 요일이 선택되어 있지 않으면 모든 요일 선택
      if (days.length === 0) {
        const allDays = [1, 2, 3, 4, 5, 6, 7];
        setDays(allDays);

        // 알림 활성화
        onChange({
          enabled: true,
          time,
          days: allDays,
        });
      } else {
        // 알림 활성화
        onChange({
          enabled: true,
          time,
          days,
        });
      }
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
    // iOS의 경우 모달이 열려있으므로 별도 처리
    if (Platform.OS === "ios") {
      // 선택한 시간을 임시 저장만 하고 onChange는 호출하지 않음
      if (selectedDate) {
        const hours = selectedDate.getHours().toString().padStart(2, "0");
        const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
        setTime(`${hours}:${minutes}`);
      }
    } else {
      // Android의 경우 선택 즉시 모달 닫기
      setShowTimePicker(false);

      if (selectedDate) {
        const hours = selectedDate.getHours().toString().padStart(2, "0");
        const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
        const newTime = `${hours}:${minutes}`;

        setTime(newTime);

        // Android에서는 선택 즉시 변경 사항 적용
        if (enabled) {
          onChange({
            enabled,
            time: newTime,
            days,
          });
        }
      }
    }
  };

  // iOS: 시간 선택 확인 버튼 처리
  const handleConfirmTime = () => {
    setShowTimePicker(false);

    // 변경 사항 적용
    if (enabled) {
      onChange({
        enabled,
        time,
        days,
      });
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

    // 모든 요일 해제 시 알림 OFF
    if (newDays.length === 0 && enabled) {
      setEnabled(false);
      onChange({
        enabled: false,
        time,
        days: newDays,
      });

      // 모든 요일 해제 시 경고 메시지
      Alert.alert(
        "알림 비활성화",
        "모든 요일이 해제되어 알림이 비활성화되었습니다. 알림을 다시 활성화하려면 요일을 선택해주세요.",
        [{ text: "확인", style: "default" }]
      );
    } else if (enabled) {
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
    // 이미 모든 요일이 선택된 경우에만 빈 배열로 변경
    const isAllSelected = days.length === 7 && days.every((day) => allDays.includes(day));
    const newDays = isAllSelected ? [] : allDays;

    setDays(newDays);

    // 모든 요일 해제 시 알림 OFF
    if (newDays.length === 0 && enabled) {
      setEnabled(false);
      onChange({
        enabled: false,
        time,
        days: newDays,
      });

      // 모든 요일 해제 시 경고 메시지
      Alert.alert(
        "알림 비활성화",
        "모든 요일이 해제되어 알림이 비활성화되었습니다. 알림을 다시 활성화하려면 요일을 선택해주세요.",
        [{ text: "확인", style: "default" }]
      );
    } else if (enabled) {
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
      return "선택 안함";
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

      {/* 알림 활성화 여부와 관계없이 항상 설정 UI 표시 */}
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
            <Text style={[styles.settingValue, { color: days.length === 0 ? theme.error : theme.primary }]}>
              {getDaysText()}
            </Text>
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

        {/* 요일이 선택되지 않았을 때 경고 메시지 표시 */}
        {enabled && days.length === 0 && (
          <View style={[styles.warningContainer, { backgroundColor: "rgba(255, 0, 0, 0.1)" }]}>
            <Ionicons name="warning-outline" size={16} color={theme.error} style={styles.warningIcon} />
            <Text style={[styles.warningText, { color: theme.error }]}>알림을 활성화하려면 요일을 선택해주세요.</Text>
          </View>
        )}
      </View>

      {Platform.OS === "ios" && showTimePicker && (
        <Modal visible={showTimePicker} transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={[styles.modalHeaderButton, { color: theme.primary }]}>취소</Text>
                </TouchableOpacity>
                <Text style={[styles.modalHeaderTitle, { color: theme.text }]}>시간 선택</Text>
                <TouchableOpacity onPress={handleConfirmTime}>
                  <Text style={[styles.modalHeaderButton, { color: theme.primary }]}>확인</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={getTimeDate()}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                // @ts-ignore - 안드로이드는 minuteInterval이 지원되지 않음
                minuteInterval={1}
                style={styles.timePicker}
              />
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === "android" && showTimePicker && (
        <DateTimePicker
          value={getTimeDate()}
          mode="time"
          is24Hour={true}
          onChange={handleTimeChange}
          // @ts-ignore - 안드로이드는 minuteInterval이 지원되지 않을 수 있지만 일부 버전에서는 지원됨
          minuteInterval={1}
        />
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
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    marginTop: 12,
    borderRadius: 6,
  },
  warningIcon: {
    marginRight: 6,
  },
  warningText: {
    fontSize: 13,
    flex: 1,
  },
});
