import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, MainTabParamList } from "../navigation/types";
import { Habit, HabitSummary, Category } from "../types";
import { getHabits, toggleHabitCompletion, saveHabits, getCategories, filterHabitsByCategory } from "../utils/storage";
import { DateHeader } from "../components/home/DateHeader";
import { ProgressSummary } from "../components/home/ProgressSummary";
import { HabitsList } from "../components/home/HabitsList";
import { AddButton } from "../components/home/AddButton";
import { CategoryFilter } from "../components/home/CategoryFilter";
import { getTodayISOString } from "../utils/date";
import { generateDummyHabits } from "../utils/dummyData";
import { useTheme } from "../themes/ThemeContext";
import { HabitItem } from "../components/home/HabitItem";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;

export function HomeScreen({ navigation }: Props): React.ReactElement {
  const { theme } = useTheme();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [filteredHabits, setFilteredHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [summary, setSummary] = useState<HabitSummary>({
    total: 0,
    completed: 0,
    completionRate: 0,
  });
  const getTodayDate = useCallback(() => getTodayISOString(), []);

  useEffect(() => {
    loadHabits();
    loadCategories();

    // 화면에 포커스가 올 때마다 습관 목록 다시 로드
    const unsubscribe = navigation.addListener("focus", () => {
      loadHabits();
      loadCategories();
    });
    return unsubscribe;
  }, [navigation]);

  // 카테고리 목록 로드
  const loadCategories = async () => {
    try {
      const loadedCategories = await getCategories();
      setCategories(loadedCategories);
    } catch (error) {
      console.error("카테고리 목록 로드 오류:", error);
    }
  };

  // 습관 목록 로드 및 요약 정보 업데이트
  const loadHabits = async () => {
    try {
      let loadedHabits = await getHabits();

      // 저장된 습관이 없을 경우 더미 데이터 사용
      if (loadedHabits.length === 0) {
        loadedHabits = generateDummyHabits();
        await saveHabits(loadedHabits);
      }

      // 오늘 날짜에 따라 isCompleted 상태 업데이트
      const todayKey = getTodayDate().split("T")[0];

      // 각 습관의 isCompleted 필드를 오늘 날짜 기준으로 업데이트
      const habitsWithUpdatedStatus = loadedHabits.map((habit) => ({
        ...habit,
        isCompleted: habit.completedDates.some((date) => date.split("T")[0] === todayKey),
      }));

      // 상태 업데이트된 습관 저장 및 설정
      await saveHabits(habitsWithUpdatedStatus);
      setHabits(habitsWithUpdatedStatus);

      // 카테고리 필터 적용
      const filtered = filterHabitsByCategory(habitsWithUpdatedStatus, selectedCategoryId);
      setFilteredHabits(filtered);

      // 오늘 날짜의 습관 완료 상태 계산
      const completedCount = habitsWithUpdatedStatus.filter((h) => h.isCompleted).length;

      setSummary({
        total: habitsWithUpdatedStatus.length,
        completed: completedCount,
        completionRate: habitsWithUpdatedStatus.length
          ? Math.round((completedCount / habitsWithUpdatedStatus.length) * 100)
          : 0,
      });
    } catch (error) {
      console.error("Failed to load habits:", error);
    }
  };

  // 카테고리 필터 변경 시 습관 목록 필터링
  useEffect(() => {
    if (habits.length > 0) {
      const filtered = filterHabitsByCategory(habits, selectedCategoryId);
      setFilteredHabits(filtered);
    }
  }, [selectedCategoryId, habits]);

  // 습관 완료 상태 토글
  const handleToggleHabit = async (id: string) => {
    try {
      // 매번 최신 날짜 사용
      await toggleHabitCompletion(id, getTodayDate());
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.divider }]}>
          <DateHeader date={getTodayDate()} />

          <View style={styles.progressSection}>
            <ProgressSummary summary={summary} />
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBackground, { backgroundColor: theme.divider }]}>
                <View
                  style={[styles.progressFill, { width: `${summary.completionRate}%`, backgroundColor: theme.primary }]}
                />
              </View>
            </View>
          </View>
        </View>

        <CategoryFilter
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />

        <View style={styles.habitsListContainer}>
          {filteredHabits.length > 0 ? (
            filteredHabits.map((habit) => (
              <HabitItem key={habit.id} habit={habit} onToggle={handleToggleHabit} onLongPress={handleEditHabit} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                등록된 습관이 없습니다.{"\n"}
                새로운 습관을 추가해 보세요!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <AddButton onPress={handleAddHabit} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80, // AddButton 높이보다 더 크게 하여 마지막 항목이 가려지지 않도록 함
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
    padding: 16,
    paddingTop: 8,
  },
  emptyContainer: {
    paddingVertical: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});
