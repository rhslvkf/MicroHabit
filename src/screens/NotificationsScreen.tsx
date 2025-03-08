import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, Switch, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getReadableNotificationList,
  getGlobalNotificationsEnabled,
  setGlobalNotificationsEnabled,
  cancelNotificationById,
  getHabitByNotificationIdentifier,
  getHabitNotificationSetting,
  getWeekdayText,
  getAllScheduledNotifications,
} from "../utils/notifications";
import { updateHabitNotification } from "../utils/storage";
import { useTheme } from "../themes/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import { NotificationEditModal } from "../components/notifications/NotificationEditModal";
import { NotificationSetting, Habit } from "../types";

// 알림 정보 인터페이스
interface NotificationInfo {
  title: string;
  habitId: string;
  time: string;
  weekday?: number;
  daily?: boolean;
  identifier: string;
  weekdays?: number[];
}

// 습관별 그룹화된 알림 인터페이스
interface HabitNotificationGroup {
  habitId: string;
  habitTitle: string;
  notifications: NotificationInfo[];
  notificationSetting?: NotificationSetting;
}

export function NotificationsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<NotificationInfo[]>([]);
  const [notificationGroups, setNotificationGroups] = useState<HabitNotificationGroup[]>([]);
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationInfo | null>(null);
  const [selectedHabitTitle, setSelectedHabitTitle] = useState("");
  const [selectedNotificationSetting, setSelectedNotificationSetting] = useState<NotificationSetting | null>(null);

  // 화면 포커스될 때마다 알림 목록 새로고침
  useFocusEffect(
    React.useCallback(() => {
      loadData();
      return () => {};
    }, [])
  );

  // 데이터 로드 함수
  const loadData = async () => {
    setLoading(true);
    try {
      // 전체 알림 상태 가져오기
      const enabled = await getGlobalNotificationsEnabled();
      setGlobalEnabled(enabled);

      // 모든 습관 가져오기
      const storage = require("../utils/storage");
      const allHabits: Habit[] = await storage.getHabits();

      // 모든 알림 가져오기
      const allNotifications = await getAllScheduledNotifications();
      console.log("현재 예약된 알림 수:", allNotifications.length);

      if (enabled) {
        // 가독성 높은 형태로 알림 정보 변환
        const notificationList = await getReadableNotificationList();
        console.log("알림 목록 개수:", notificationList.length);

        // 습관별 알림 정보 그룹화
        const habitNotifications: Record<string, NotificationInfo[]> = {};

        // 습관 ID별로 알림 그룹화
        for (const notification of notificationList) {
          if (!habitNotifications[notification.habitId]) {
            habitNotifications[notification.habitId] = [];
          }
          habitNotifications[notification.habitId].push(notification);
        }

        // 습관 데이터와 알림 정보 결합하여 그룹 생성
        const groups: HabitNotificationGroup[] = allHabits.map((habit: Habit) => {
          // 해당 습관의 모든 알림
          const habitAlarms = habitNotifications[habit.id] || [];

          // 해당 습관에 알림이 설정되어 있는지 확인
          const hasNotifications = habitAlarms.length > 0;

          // 습관 알림 그룹 생성
          return {
            habitId: habit.id,
            habitTitle: habit.title,
            notifications: habitAlarms,
            notificationSetting: habit.notification,
          };
        });

        setNotifications(notificationList);
        setNotificationGroups(groups);
      } else {
        // 알림 비활성화 상태에서도 모든 습관 표시
        const emptyGroups: HabitNotificationGroup[] = allHabits.map((habit: Habit) => ({
          habitId: habit.id,
          habitTitle: habit.title,
          notifications: [],
          notificationSetting: habit.notification,
        }));

        setNotifications([]);
        setNotificationGroups(emptyGroups);
      }
    } catch (error) {
      console.error("알림 데이터 로드 중 오류:", error);
      Alert.alert("오류", "알림 정보를 불러오는 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 전체 알림 토글 처리
  const handleToggleGlobalNotifications = async (value: boolean) => {
    try {
      // 먼저 UI 상태 업데이트로 즉각적인 반응 제공
      setGlobalEnabled(value);

      if (!value) {
        // 알림 비활성화 시 기존 그룹 정보는 유지하고 알림만 비활성화된 것으로 표시
        // 이렇게 하면 전체 데이터를 다시 로드하지 않아도 됨
        setNotificationGroups((prev) =>
          prev.map((group) => ({
            ...group,
            notifications: [], // 알림 비활성화 시 알림 목록은 비움
          }))
        );
      }

      // 백그라운드에서 데이터 업데이트
      await setGlobalNotificationsEnabled(value);

      // 알림 활성화 시에만 데이터 다시 로드 (비활성화 시에는 이미 위에서 UI 업데이트)
      if (value) {
        // 약간의 지연 후 알림 목록만 업데이트 (전체 화면 재로딩 방지)
        setTimeout(async () => {
          try {
            const storage = require("../utils/storage");
            const allHabits = await storage.getHabits();
            const notificationList = await getReadableNotificationList();
            setNotifications(notificationList);

            // 그룹은 유지하고 알림 정보만 업데이트
            setNotificationGroups((prev) => {
              const updatedGroups = [...prev];

              // 기존 그룹에 알림 정보 업데이트
              for (const group of updatedGroups) {
                group.notifications = notificationList.filter((n) => n.habitId === group.habitId);
              }

              return updatedGroups;
            });
          } catch (error) {
            console.error("알림 정보 업데이트 중 오류:", error);
          }
        }, 500);
      }
    } catch (error) {
      console.error("알림 전체 토글 중 오류:", error);
      Alert.alert("오류", "알림 설정을 변경하는 중 문제가 발생했습니다.");

      // 오류 발생 시 원래 상태로 되돌림
      setGlobalEnabled(!value);
    }
  };

  // 개별 알림 삭제 처리
  const handleDeleteNotification = (notification: NotificationInfo) => {
    Alert.alert("알림 삭제", `"${notification.title}" 알림을 삭제하시겠습니까?`, [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await cancelNotificationById(notification.identifier);

            // 이 알림을 사용하는 습관의 알림 설정도 업데이트
            const habit = await getHabitByNotificationIdentifier(notification.identifier);
            if (habit) {
              await updateHabitNotification(habit.id, null);
            }

            // 데이터 다시 로드
            loadData();
          } catch (error) {
            console.error("알림 삭제 중 오류:", error);
            Alert.alert("오류", "알림을 삭제하는 중 문제가 발생했습니다.");
          }
        },
      },
    ]);
  };

  // 습관의 모든 알림 삭제 처리
  const handleDeleteAllHabitNotifications = (habitId: string, habitTitle: string) => {
    Alert.alert("모든 알림 삭제", `"${habitTitle}"의 모든 알림을 삭제하시겠습니까?`, [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            // 해당 습관의 모든 알림 찾기
            const habitNotifications = notifications.filter((n) => n.habitId === habitId);

            // 알림 ID 배열
            const notificationIds = habitNotifications.map((n) => n.identifier);

            // 모든 알림 취소
            for (const id of notificationIds) {
              await cancelNotificationById(id);
            }

            // 습관의 알림 설정 업데이트
            await updateHabitNotification(habitId, null);

            // 데이터 다시 로드
            loadData();
          } catch (error) {
            console.error("습관 알림 삭제 중 오류:", error);
            Alert.alert("오류", "알림을 삭제하는 중 문제가 발생했습니다.");
          }
        },
      },
    ]);
  };

  // 알림 편집 시작
  const handleEditNotification = async (notification: NotificationInfo) => {
    try {
      // 해당 알림의 습관 정보 가져오기
      const habit = await getHabitByNotificationIdentifier(notification.identifier);

      if (!habit) {
        Alert.alert("오류", "해당 알림의 습관을 찾을 수 없습니다.");
        return;
      }

      // 현재 알림 설정 가져오기
      const notificationSetting = await getHabitNotificationSetting(habit.id);

      // 편집할 습관과 알림 설정 저장
      setSelectedNotification(notification);
      setSelectedHabitTitle(habit.title);
      setSelectedNotificationSetting(notificationSetting);

      // 모달 열기
      setEditModalVisible(true);
    } catch (error) {
      console.error("알림 편집 준비 중 오류:", error);
      Alert.alert("오류", "알림 편집을 준비하는 중 문제가 발생했습니다.");
    }
  };

  // 습관 전체 알림 편집 시작
  const handleEditHabitNotifications = async (habitId: string, habitTitle: string) => {
    try {
      // 현재 알림 설정 가져오기
      const notificationSetting = await getHabitNotificationSetting(habitId);

      // 첫 번째 알림을 선택된 알림으로 설정 (UI 용도)
      const firstNotification = notifications.find((n) => n.habitId === habitId);

      if (firstNotification) {
        // 편집할 습관과 알림 설정 저장
        setSelectedNotification(firstNotification);
        setSelectedHabitTitle(habitTitle);
        setSelectedNotificationSetting(notificationSetting);
      } else {
        // 알림이 없는 경우 가상의 알림 객체 생성
        const dummyNotification: NotificationInfo = {
          title: habitTitle,
          habitId: habitId,
          time: "",
          identifier: `dummy-${habitId}`,
        };

        setSelectedNotification(dummyNotification);
        setSelectedHabitTitle(habitTitle);
        setSelectedNotificationSetting(null);
      }

      // 모달 열기
      setEditModalVisible(true);
    } catch (error) {
      console.error("습관 알림 편집 준비 중 오류:", error);
      Alert.alert("오류", "알림 편집을 준비하는 중 문제가 발생했습니다.");
    }
  };

  // 알림 설정 저장
  const handleSaveNotificationSetting = async (habitId: string, setting: NotificationSetting | null) => {
    try {
      // 설정이 null이거나 비활성화되어 있으면 알림 삭제
      if (!setting || !setting.enabled) {
        await updateHabitNotification(habitId, null);
      } else {
        // 알림 설정 업데이트
        await updateHabitNotification(habitId, setting);
      }

      // 화면 새로고침
      setTimeout(() => {
        loadData();
      }, 500);
    } catch (error) {
      console.error("알림 설정 저장 중 오류:", error);
      Alert.alert("오류", "알림 설정을 저장하는 중 문제가 발생했습니다.");
    }
  };

  // 알림 빈도 텍스트 반환
  const getFrequencyText = (notification: NotificationInfo) => {
    // 매일 알림 먼저 처리
    if (notification.daily) {
      return "매일";
    }

    // weekday가 있는 경우 해당 요일 표시
    if (notification.weekday !== undefined) {
      return `매주 ${getWeekdayText(notification.weekday)}요일`;
    }

    // 여러 요일 알림의 경우 getHabitNotificationSetting을 통해 요일 정보 가져오기
    // 이 로직은 비동기적으로 처리해야 하지만, 현재 렌더링 함수에서는 비동기 처리가 어려움
    // 따라서 알림 정보를 로드할 때 추가 정보를 함께 가져오는 것이 좋음
    return "";
  };

  // 시간 포맷 반환
  const getTimeText = (timeString: string) => {
    // 시간이 없는 경우 처리
    if (!timeString) return "";

    try {
      const [hours, minutes] = timeString.split(" ")[1].split(":");
      return `${hours}:${minutes}`;
    } catch (e) {
      return timeString;
    }
  };

  // 습관 그룹 항목 렌더링
  const renderHabitGroupItem = ({ item }: { item: HabitNotificationGroup }) => {
    // 알림 정보 생성
    let timeText = "";
    let frequencyText = "";
    const hasNotifications = item.notifications.length > 0;
    const hasSetting = item.notificationSetting?.enabled;

    // 요일 표시 텍스트 생성
    const getDaysTextFromSetting = (setting?: NotificationSetting) => {
      if (!setting || !setting.days) return "";

      if (setting.days.length === 0 || setting.days.length === 7) {
        return "매일";
      } else {
        const dayNames = ["", "월", "화", "수", "목", "금", "토", "일"];
        return setting.days.map((day) => dayNames[day]).join(", ");
      }
    };

    // 알림 설정이 있을 경우 (실제 알림 발송 여부와 관계없이)
    if (hasSetting) {
      // 시간 표시
      timeText = item.notificationSetting?.time || "";
      if (timeText) {
        const [hours, minutes] = timeText.split(":").map(Number);
        timeText = `${hours}:${minutes.toString().padStart(2, "0")}`;
      }

      // 요일 표시 - 습관 설정 사용
      frequencyText = getDaysTextFromSetting(item.notificationSetting);
    }
    // 알림 설정은 없지만 실제 알림이 있는 경우 (비정상 상태)
    else if (hasNotifications && item.notifications.length > 0) {
      const notification = item.notifications[0];
      timeText = getTimeText(notification.time);

      if (notification.daily) {
        frequencyText = "매일";
      } else if (notification.weekday) {
        frequencyText = `${getWeekdayText(notification.weekday)}요일`;
      }
    }

    // 요약 텍스트 생성
    let summaryText = "";
    if (hasSetting && item.notificationSetting?.enabled) {
      summaryText = `${timeText} (${frequencyText})`;
    } else if (hasNotifications) {
      summaryText = `${timeText} (${frequencyText}) - 동기화 필요`;
    } else {
      summaryText = "알림 없음";
    }

    return (
      <View style={[styles.habitGroupItem, { backgroundColor: theme.card }]}>
        <View style={styles.habitHeader}>
          <View style={styles.habitTitleContainer}>
            <Text style={[styles.habitTitle, { color: theme.text }]} numberOfLines={1}>
              {item.habitTitle}
            </Text>
            <Text style={[styles.habitSummary, { color: theme.textSecondary }]}>{summaryText}</Text>
          </View>
          <View style={styles.habitActions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditHabitNotifications(item.habitId, item.habitTitle)}
            >
              <Ionicons name="create-outline" size={22} color={theme.primary} />
            </TouchableOpacity>
            {hasNotifications && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteAllHabitNotifications(item.habitId, item.habitTitle)}
              >
                <Ionicons name="trash-outline" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 헤더 */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>알림 관리</Text>
        <View style={styles.globalToggle}>
          <Text style={[styles.globalToggleLabel, { color: theme.text }]}>전체 알림</Text>
          <Switch
            value={globalEnabled}
            onValueChange={handleToggleGlobalNotifications}
            trackColor={{ false: "#d3d3d3", true: "#81b0ff" }}
            thumbColor={globalEnabled ? theme.primary : "#f4f3f4"}
          />
        </View>
      </View>

      {/* 로딩 표시 */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : notificationGroups.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>습관 데이터가 없습니다.</Text>
        </View>
      ) : (
        <FlatList
          data={notificationGroups}
          renderItem={renderHabitGroupItem}
          keyExtractor={(item) => item.habitId}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* 알림 편집 모달 */}
      {selectedNotification && (
        <NotificationEditModal
          visible={editModalVisible}
          habitId={selectedNotification.habitId}
          habitTitle={selectedHabitTitle}
          notificationSetting={selectedNotificationSetting || undefined}
          onClose={() => setEditModalVisible(false)}
          onSave={handleSaveNotificationSetting}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  globalToggle: {
    flexDirection: "row",
    alignItems: "center",
  },
  globalToggleLabel: {
    marginRight: 8,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  habitGroupItem: {
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  habitHeader: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  habitTitleContainer: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  habitSummary: {
    fontSize: 14,
  },
  habitActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    padding: 8,
    marginRight: 4,
  },
  deleteButton: {
    padding: 8,
    marginRight: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
  },
});
