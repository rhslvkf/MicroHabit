import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { DateHeader } from "../components/home/DateHeader";
import { HabitsList } from "../components/home/HabitsList";
import { ProgressSummary } from "../components/home/ProgressSummary";
import { AddButton } from "../components/home/AddButton";
import { Habit, HabitSummary } from "../types";
import { getHabits, toggleHabitCompletion, calculateCompletionStatus, saveHabits } from "../utils/storage";
import { getTodayISOString } from "../utils/date";
import { generateDummyHabits } from "../utils/dummyData";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props): React.ReactElement {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [summary, setSummary] = useState<HabitSummary>({
    total: 0,
    completed: 0,
    completionRate: 0,
  });
  const [todayDate] = useState(getTodayISOString());

  useEffect(() => {
    loadHabits();

    // 화면에 포커스가 올 때마다 습관 목록 다시 로드
    const unsubscribe = navigation.addListener("focus", loadHabits);
    return unsubscribe;
  }, [navigation]);

  // 습관 목록 로드 및 요약 정보 업데이트
  const loadHabits = async () => {
    try {
      let loadedHabits = await getHabits();

      // 저장된 습관이 없을 경우 더미 데이터 사용
      if (loadedHabits.length === 0) {
        loadedHabits = generateDummyHabits();
        await saveHabits(loadedHabits);
      }

      setHabits(loadedHabits);

      // 오늘의 습관 완료 상태 계산
      const todayStatus = calculateCompletionStatus(loadedHabits, todayDate);
      setSummary(todayStatus);
    } catch (error) {
      console.error("습관 데이터 로드 오류:", error);
    }
  };

  // 습관 완료 상태 토글
  const handleToggleHabit = async (id: string) => {
    try {
      const updatedHabits = await toggleHabitCompletion(id, todayDate);
      setHabits(updatedHabits);

      // 완료 상태 업데이트 후 요약 정보 갱신
      const updatedSummary = calculateCompletionStatus(updatedHabits, todayDate);
      setSummary(updatedSummary);
    } catch (error) {
      console.error("습관 상태 변경 오류:", error);
    }
  };

  // 새 습관 추가 화면으로 이동
  const handleAddHabit = () => {
    navigation.navigate("AddHabit");
  };

  // 습관 편집 화면으로 이동
  const handleEditHabit = (habit: Habit) => {
    navigation.navigate("EditHabit", { habit });
  };

  return (
    <SafeAreaView style={styles.container}>
      <DateHeader date={todayDate} />

      <View style={styles.contentContainer}>
        <ProgressSummary summary={summary} />
        <HabitsList habits={habits} onToggleHabit={handleToggleHabit} onEditHabit={handleEditHabit} />
      </View>

      <AddButton onPress={handleAddHabit} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  contentContainer: {
    flex: 1,
  },
});
