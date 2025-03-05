import AsyncStorage from "@react-native-async-storage/async-storage";
import { Habit } from "../types";
import { ThemeMode } from "../themes/types";

const HABITS_STORAGE_KEY = "@MicroHabit:habits";
const THEME_STORAGE_KEY = "microhabit_theme";

/**
 * 모든 습관 데이터를 로컬 저장소에서 불러옵니다.
 */
export async function getHabits(): Promise<Habit[]> {
  try {
    const habitsJson = await AsyncStorage.getItem(HABITS_STORAGE_KEY);
    return habitsJson ? JSON.parse(habitsJson) : [];
  } catch (error) {
    console.error("습관 데이터를 불러오는 중 오류 발생:", error);
    return [];
  }
}

/**
 * 습관 데이터를 로컬 저장소에 저장합니다.
 */
export async function saveHabits(habits: Habit[]): Promise<void> {
  try {
    await AsyncStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits));
  } catch (error) {
    console.error("습관 데이터를 저장하는 중 오류 발생:", error);
  }
}

/**
 * 새로운 습관을 추가합니다.
 */
export async function addHabit(habit: Habit): Promise<void> {
  const habits = await getHabits();
  await saveHabits([...habits, habit]);
}

/**
 * 기존 습관을 수정합니다.
 */
export async function updateHabit(updatedHabit: Habit): Promise<void> {
  const habits = await getHabits();
  const updatedHabits = habits.map((habit) => (habit.id === updatedHabit.id ? updatedHabit : habit));
  await saveHabits(updatedHabits);
}

/**
 * 습관을 삭제합니다.
 */
export async function deleteHabit(habitId: string): Promise<void> {
  const habits = await getHabits();
  const filteredHabits = habits.filter((habit) => habit.id !== habitId);
  await saveHabits(filteredHabits);
}

/**
 * 습관의 완료 상태를 토글합니다.
 */
export async function toggleHabitCompletion(id: string, date: string): Promise<Habit[]> {
  const habits = await getHabits();
  const updatedHabits = habits.map((habit) => {
    if (habit.id === id) {
      const isCompleted = !habit.isCompleted;
      const completedDates = isCompleted
        ? [...habit.completedDates, date]
        : habit.completedDates.filter((d) => d !== date);

      return { ...habit, isCompleted, completedDates };
    }
    return habit;
  });

  await saveHabits(updatedHabits);
  return updatedHabits;
}

/**
 * 특정 날짜의 습관 완료 상태를 계산합니다.
 */
export function calculateCompletionStatus(
  habits: Habit[],
  date: string
): {
  total: number;
  completed: number;
  completionRate: number;
} {
  const total = habits.length;
  const completed = habits.filter((habit) => habit.completedDates.includes(date)).length;

  const completionRate = total > 0 ? (completed / total) * 100 : 0;

  return {
    total,
    completed,
    completionRate,
  };
}

// 테마 모드 저장
export async function saveThemeMode(themeMode: ThemeMode): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, themeMode);
  } catch (error) {
    console.error("테마 모드 저장 오류:", error);
  }
}

// 테마 모드 로드
export async function getThemeMode(): Promise<ThemeMode | null> {
  try {
    const themeMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    return themeMode as ThemeMode | null;
  } catch (error) {
    console.error("테마 모드 로드 오류:", error);
    return null;
  }
}
