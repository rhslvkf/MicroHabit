import React, { useState, useEffect } from "react";
import { View, Modal, StyleSheet, TouchableOpacity, Text, Alert } from "react-native";
import { useTheme } from "../../themes/ThemeContext";
import { NotificationSelector } from "../common/NotificationSelector";
import { NotificationSetting } from "../../types";
import { Ionicons } from "@expo/vector-icons";

interface NotificationEditModalProps {
  visible: boolean;
  habitId: string;
  habitTitle: string;
  notificationSetting?: NotificationSetting;
  onClose: () => void;
  onSave: (habitId: string, setting: NotificationSetting | null) => void;
}

export function NotificationEditModal({
  visible,
  habitId,
  habitTitle,
  notificationSetting,
  onClose,
  onSave,
}: NotificationEditModalProps) {
  const { theme } = useTheme();
  const [currentSetting, setCurrentSetting] = useState<NotificationSetting | null>(
    notificationSetting ? { ...notificationSetting } : null
  );

  // notification 설정이 변경될 때마다 현재 설정 업데이트
  useEffect(() => {
    if (notificationSetting) {
      setCurrentSetting({ ...notificationSetting });
    } else {
      // 기본 설정
      setCurrentSetting({
        enabled: false,
        time: "08:00",
        days: [],
      });
    }
  }, [notificationSetting, visible]);

  const handleChange = (setting: NotificationSetting | null) => {
    setCurrentSetting(setting);
  };

  const handleSave = () => {
    // 알림이 활성화되어 있는데 요일이 선택되지 않은 경우 저장하지 않음
    if (currentSetting?.enabled && currentSetting.days.length === 0) {
      Alert.alert(
        "요일 선택 필요",
        "알림을 활성화하려면 적어도 하나 이상의 요일을 선택해야 합니다. 요일을 선택하거나 알림을 비활성화해주세요.",
        [{ text: "확인", style: "default" }]
      );
      return;
    }

    onSave(habitId, currentSetting);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={[styles.header, { borderBottomColor: theme.divider }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>알림 설정</Text>
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Text style={[styles.saveButtonText, { color: theme.primary }]}>저장</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={[styles.habitTitle, { color: theme.text }]}>{habitTitle}</Text>
            <NotificationSelector notificationSetting={currentSetting || undefined} onChange={handleChange} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 30,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  closeButton: {
    padding: 8,
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    padding: 16,
  },
  habitTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
});
