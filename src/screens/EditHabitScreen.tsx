import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { Habit, Category, NotificationSetting } from "../types";
import { updateHabit, deleteHabit, getHabits, getCategories, updateHabitNotification } from "../utils/storage";
import { useTheme } from "../themes/ThemeContext";
import { CategorySelector } from "../components/common/CategorySelector";
import { NotificationSelector } from "../components/common/NotificationSelector";
import { incrementHabitActionCount, shouldShowAdForHabitAction, showRewardAd } from "../utils/ads";

type Props = NativeStackScreenProps<RootStackParamList, "EditHabit">;

export function EditHabitScreen({ route, navigation }: Props): React.ReactElement {
  const { theme } = useTheme();
  const { habit } = route.params;
  const [title, setTitle] = useState(habit.title);
  const [description, setDescription] = useState(habit.description || "");
  const [categoryId, setCategoryId] = useState(habit.categoryId || "other");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationSetting | undefined>(habit.notification);

  // 카테고리 목록 로드
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const loadedCategories = await getCategories();
        setCategories(loadedCategories);
      } catch (error) {
        console.error("카테고리 목록 로드 오류:", error);
      }
    };

    loadCategories();
  }, []);

  const handleUpdateHabit = async () => {
    // 제목 입력 검증
    if (!title.trim()) {
      Alert.alert("알림", "습관 제목을 입력해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);

      // 액션 카운트 증가
      const count = await incrementHabitActionCount();
      console.log(`습관 추가/수정 카운트: ${count}`);

      // 5회마다 광고 표시
      const showAd = await shouldShowAdForHabitAction();

      if (showAd) {
        // 광고 표시 시 사용자에게 묻지 않고 바로 광고 표시
        setIsAdLoading(true);
        const adShown = await showRewardAd();
        setIsAdLoading(false);

        if (adShown) {
          // 광고가 성공적으로 표시된 후 습관 수정
          await saveHabitChanges();
        } else {
          // 광고 표시 실패 시 재시도 요청
          Alert.alert("광고 로드 실패", "광고를 불러오는 중 문제가 발생했습니다. 다시 시도해 주세요.", [
            {
              text: "확인",
              onPress: () => setIsSubmitting(false),
            },
          ]);
        }
      } else {
        // 광고 표시 조건이 아니면 바로 습관 수정
        await saveHabitChanges();
      }
    } catch (error) {
      console.error("습관 수정 중 오류 발생:", error);

      // 중복 습관 이름에 대한 에러 메시지 구분
      if (error instanceof Error && error.message.includes("같은 이름의 습관이 이미 존재")) {
        Alert.alert("알림", error.message);
      } else {
        Alert.alert("오류", "습관을 수정하는 중 오류가 발생했습니다.");
      }
      setIsSubmitting(false);
    }
  };

  // 실제 습관 변경사항 저장 로직
  const saveHabitChanges = async () => {
    try {
      const updatedHabit: Habit = {
        ...habit,
        title: title.trim(),
        description: description.trim() || undefined,
        categoryId: categoryId,
        notification: notification,
      };

      // 기존 알림 설정과 새 알림 설정 비교
      const notificationChanged = JSON.stringify(habit.notification) !== JSON.stringify(notification);

      // 습관 정보 먼저 업데이트
      await updateHabit(updatedHabit);

      // 알림 설정이 변경되었으면 알림 업데이트
      if (notificationChanged) {
        await updateHabitNotification(habit.id, notification || null);
      }

      // 습관 수정 후 홈 화면으로 이동
      navigation.goBack();
    } catch (error) {
      throw error;
    }
  };

  // 알림 설정 변경 처리
  const handleNotificationChange = (notificationSetting: NotificationSetting | null) => {
    // 로컬 상태만 업데이트하고 실제 알림 스케줄링은 저장 버튼 클릭 시 수행
    setNotification(notificationSetting || undefined);
  };

  const handleDeleteHabit = () => {
    Alert.alert(
      "습관 삭제",
      "정말 이 습관을 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteHabit(habit.id);
              navigation.goBack();
            } catch (error) {
              console.error("습관 삭제 중 오류 발생:", error);
              Alert.alert("오류", "습관을 삭제하는 중 오류가 발생했습니다.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>습관 수정하기</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              습관의 정보를 수정하고 관리하세요
            </Text>
          </View>

          <View style={[styles.form, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>습관 이름</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={title}
                onChangeText={setTitle}
                placeholder="습관 이름"
                placeholderTextColor={theme.textDisabled}
                maxLength={50}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>카테고리</Text>
              <CategorySelector
                categories={categories}
                selectedCategoryId={categoryId}
                onSelectCategory={setCategoryId}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>설명 (선택사항)</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder="습관에 대한 설명"
                placeholderTextColor={theme.textDisabled}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={200}
              />
            </View>

            <View style={styles.inputContainer}>
              <NotificationSelector notificationSetting={notification} onChange={handleNotificationChange} />
            </View>
          </View>

          <View style={[styles.statsContainer, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
            <Text style={[styles.statsTitle, { color: theme.text }]}>습관 통계</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.primary }]}>
                  {habit.completedDates.filter((date) => {
                    // 오늘 날짜까지 연속으로 완료된 날짜 계산
                    const today = new Date().toISOString().split("T")[0];
                    return date <= today;
                  }).length % 30}{" "}
                  일
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>현재 스트릭</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.primary }]}>{habit.completedDates.length}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>완료 횟수</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.primary }]}>
                  {Math.floor(habit.completedDates.length / 10) * 10} 일
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>최고 기록</Text>
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: theme.primary },
                (isSubmitting || isAdLoading) && { backgroundColor: theme.textDisabled },
              ]}
              onPress={handleUpdateHabit}
              disabled={!title.trim() || isSubmitting || isAdLoading}
            >
              <Text style={styles.saveButtonText}>
                {isSubmitting ? "저장 중..." : isAdLoading ? "광고 로딩 중..." : "저장하기"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => navigation.goBack()}
              disabled={isSubmitting || isAdLoading}
            >
              <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>취소</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.deleteButton,
              {
                backgroundColor: theme.error,
                opacity: isSubmitting || isAdLoading ? 0.5 : 1,
              },
            ]}
            onPress={handleDeleteHabit}
            disabled={isSubmitting || isAdLoading}
          >
            <Text style={styles.deleteButtonText}>이 습관 삭제하기</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  form: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  statsContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  saveButton: {
    flex: 2,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginRight: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "white",
  },
  cancelButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginLeft: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  deleteButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "white",
  },
});
