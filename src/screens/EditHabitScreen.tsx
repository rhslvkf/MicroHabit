import React, { useState } from "react";
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
import { Habit } from "../types";
import { updateHabit, deleteHabit } from "../utils/storage";

type Props = NativeStackScreenProps<RootStackParamList, "EditHabit">;

export function EditHabitScreen({ route, navigation }: Props): React.ReactElement {
  const { habit } = route.params;

  const [title, setTitle] = useState(habit.title);
  const [description, setDescription] = useState(habit.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateHabit = async () => {
    // 제목 입력 검증
    if (!title.trim()) {
      Alert.alert("알림", "습관 제목을 입력해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);

      const updatedHabit: Habit = {
        ...habit,
        title: title.trim(),
        description: description.trim() || undefined,
      };

      await updateHabit(updatedHabit);

      // 습관 수정 후 홈 화면으로 이동
      navigation.goBack();
    } catch (error) {
      console.error("습관 수정 중 오류 발생:", error);
      Alert.alert("오류", "습관을 수정하는 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>습관 상세 및 수정</Text>
            <Text style={styles.headerSubtitle}>{habit.createdAt.split("T")[0]} 에 생성됨</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>습관 이름</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="습관 이름을 입력하세요"
                placeholderTextColor="#999"
                maxLength={50}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>설명 (선택사항)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="습관에 대한 설명이나 이유를 적어주세요"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={200}
              />
            </View>
          </View>

          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>통계</Text>
            <View style={styles.statsContent}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{habit.completedDates.length}</Text>
                <Text style={styles.statLabel}>완료한 일수</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{habit.isCompleted ? "완료" : "미완료"}</Text>
                <Text style={styles.statLabel}>오늘 상태</Text>
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteHabit}>
              <Text style={styles.deleteButtonText}>삭제</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={isSubmitting}>
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, (!title.trim() || isSubmitting) && styles.saveButtonDisabled]}
              onPress={handleUpdateHabit}
              disabled={!title.trim() || isSubmitting}
            >
              <Text style={styles.saveButtonText}>{isSubmitting ? "저장 중..." : "저장"}</Text>
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
    backgroundColor: "#f9f9f9",
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
    color: "#333",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
  },
  form: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
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
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  statsContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  statsContent: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#FF3B30",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginRight: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "white",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#34C759",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginLeft: 8,
  },
  saveButtonDisabled: {
    backgroundColor: "#cccccc",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "white",
  },
});
