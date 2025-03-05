import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, MainTabParamList } from "../navigation/types";
import { Habit, HabitSummary } from "../types";
import { getHabits, toggleHabitCompletion, saveHabits } from "../utils/storage";
import { DateHeader } from "../components/home/DateHeader";
import { ProgressSummary } from "../components/home/ProgressSummary";
import { HabitsList } from "../components/home/HabitsList";
import { AddButton } from "../components/home/AddButton";
import { getTodayISOString } from "../utils/date";
import { generateDummyHabits } from "../utils/dummyData";
import { useTheme } from "../themes/ThemeContext";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;

export function HomeScreen({ navigation }: Props): React.ReactElement {
  const { theme } = useTheme();
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

      // 오늘 날짜의 습관 완료 상태 계산
      const todayKey = todayDate.split("T")[0];
      const completedCount = loadedHabits.filter((h) => h.completedDates.some((d) => d.startsWith(todayKey))).length;

      setSummary({
        total: loadedHabits.length,
        completed: completedCount,
        completionRate: loadedHabits.length ? Math.round((completedCount / loadedHabits.length) * 100) : 0,
      });
    } catch (error) {
      console.error("Failed to load habits:", error);
    }
  };

  // 습관 완료 상태 토글
  const handleToggleHabit = async (id: string) => {
    try {
      await toggleHabitCompletion(id, todayDate);
      await loadHabits(); // 목록 다시 로드
    } catch (error) {
      console.error("Failed to toggle habit:", error);
    }
  };

  // 습관 추가 화면으로 이동
  const handleAddHabit = () => {
    navigation.navigate("AddHabit");
  };

  // 습관 편집 화면으로 이동하는 핸들러
  const handleEditHabit = useCallback(
    (habit: Habit) => {
      navigation.navigate("EditHabit", { habit });
    },
    [navigation]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top"]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.divider }]}>
        <DateHeader date={todayDate} />

        <View style={styles.progressSection}>
          <ProgressSummary summary={summary} />
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBackground, { backgroundColor: theme.divider }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${summary.completionRate}%`,
                    backgroundColor: summary.completionRate === 100 ? theme.success : theme.primary,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.habitsListContainer}>
        <HabitsList habits={habits} onToggleHabit={handleToggleHabit} onEditHabit={handleEditHabit} />
      </View>

      <AddButton onPress={handleAddHabit} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBackground: {
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
  },
  habitsListContainer: {
    flex: 1,
  },
});
