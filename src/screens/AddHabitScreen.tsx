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
import { addHabit, getCategories } from "../utils/storage";
import { getTodayISOString } from "../utils/date";
import { useTheme } from "../themes/ThemeContext";
import { CategorySelector } from "../components/common/CategorySelector";
import { NotificationSelector } from "../components/common/NotificationSelector";

type Props = NativeStackScreenProps<RootStackParamList, "AddHabit">;

export function AddHabitScreen({ navigation }: Props): React.ReactElement {
  const { theme } = useTheme();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("other"); // 기본 카테고리는 '기타'
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<NotificationSetting | undefined>(undefined);

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

  const handleAddHabit = async () => {
    // 제목 입력 검증
    if (!title.trim()) {
      Alert.alert("알림", "습관 제목을 입력해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);

      const today = getTodayISOString();

      const newHabit: Habit = {
        id: Date.now().toString(), // 간단하게 고유 ID 생성
        title: title.trim(),
        description: description.trim() || undefined,
        isCompleted: false,
        createdAt: today,
        completedDates: [],
        categoryId: categoryId,
        notification: notification,
      };

      await addHabit(newHabit);

      // 습관 추가 후 홈 화면으로 이동
      navigation.goBack();
    } catch (error) {
      // 중복 습관 이름에 대한 에러 메시지 구분
      if (error instanceof Error && error.message.includes("같은 이름의 습관이 이미 존재")) {
        Alert.alert("알림", error.message);
      } else {
        Alert.alert("오류", "습관을 추가하는 중 오류가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 알림 설정 변경 처리
  const handleNotificationChange = (notificationSetting: NotificationSetting | null) => {
    setNotification(notificationSetting || undefined);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>새로운 습관 추가</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              작은 습관으로 더 나은 내일을 만들어보세요
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
                placeholder="예: 물 2리터 마시기"
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
                placeholder="습관에 대한 상세 내용이나 목표를 적어보세요"
                placeholderTextColor={theme.textDisabled}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <NotificationSelector notificationSetting={notification} onChange={handleNotificationChange} />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => navigation.goBack()}
              disabled={isSubmitting}
            >
              <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>취소</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: theme.primary },
                (!title.trim() || isSubmitting) && { backgroundColor: theme.textDisabled },
              ]}
              onPress={handleAddHabit}
              disabled={!title.trim() || isSubmitting}
            >
              <Text style={styles.addButtonText}>{isSubmitting ? "추가 중..." : "습관 추가하기"}</Text>
            </TouchableOpacity>
          </View>
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
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginRight: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  addButton: {
    flex: 2,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginLeft: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "white",
  },
});
