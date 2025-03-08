import AsyncStorage from "@react-native-async-storage/async-storage";
import { Habit, Category, DEFAULT_CATEGORIES, NotificationSetting } from "../types";
import { ThemeMode } from "../themes/types";
import { cancelHabitNotifications, scheduleHabitNotification } from "./notifications";

const HABITS_STORAGE_KEY = "@MicroHabit:habits";
const THEME_STORAGE_KEY = "microhabit_theme";
const CATEGORIES_STORAGE_KEY = "@MicroHabit:categories";

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
 * 새로운 습관을 추가합니다. 이름이 중복되면 에러를 발생시킵니다.
 */
export async function addHabit(habit: Habit): Promise<void> {
  const habits = await getHabits();

  // 중복된 이름이 있는지 확인
  const isDuplicate = habits.some(
    (existingHabit) => existingHabit.title.trim().toLowerCase() === habit.title.trim().toLowerCase()
  );

  if (isDuplicate) {
    throw new Error("같은 이름의 습관이 이미 존재합니다!");
  }

  await saveHabits([...habits, habit]);
}

/**
 * 기존 습관을 수정합니다. 이름이 중복되면 에러를 발생시킵니다.
 */
export async function updateHabit(updatedHabit: Habit): Promise<void> {
  const habits = await getHabits();

  // 중복된 이름이 있는지 확인 (자기 자신 제외)
  const isDuplicate = habits.some(
    (existingHabit) =>
      existingHabit.id !== updatedHabit.id && // 자기 자신은 제외
      existingHabit.title.trim().toLowerCase() === updatedHabit.title.trim().toLowerCase()
  );

  if (isDuplicate) {
    throw new Error("같은 이름의 습관이 이미 존재합니다!");
  }

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
  const shortDate = date.split("T")[0]; // YYYY-MM-DD 형식으로 변환

  const updatedHabits = habits.map((habit) => {
    if (habit.id === id) {
      // 해당 날짜가 이미 완료되었는지 확인
      const dateIndex = habit.completedDates.findIndex((d) => d.split("T")[0] === shortDate);
      const newCompletedDates = [...habit.completedDates];

      if (dateIndex === -1) {
        // 완료되지 않은 경우 추가
        newCompletedDates.push(date);
      } else {
        // 이미 완료된 경우 제거
        newCompletedDates.splice(dateIndex, 1);
      }

      // 오늘 날짜에 대한 완료 상태만 isCompleted에 반영
      const isCompleted = newCompletedDates.some((d) => d.split("T")[0] === shortDate);

      return {
        ...habit,
        isCompleted,
        completedDates: newCompletedDates,
      };
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

  // 'YYYY-MM-DD' 형식으로 짧은 날짜 변환
  const shortDate = date.split("T")[0];

  // 완료된 습관 수를 계산할 때 날짜 시간 부분을 제외하고 비교
  const completed = habits.filter((habit) => habit.completedDates.some((d) => d.split("T")[0] === shortDate)).length;

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

/**
 * 카테고리 목록을 불러옵니다. 저장된 데이터가 없으면 기본 카테고리를 반환합니다.
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const categoriesJson = await AsyncStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!categoriesJson) {
      // 기본 카테고리가 저장되어 있지 않으면 저장 후 반환
      await saveCategories(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    return JSON.parse(categoriesJson);
  } catch (error) {
    console.error("카테고리 목록을 불러오는 중 오류 발생:", error);
    return DEFAULT_CATEGORIES;
  }
}

/**
 * 카테고리 목록을 저장합니다.
 */
export async function saveCategories(categories: Category[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error("카테고리 목록을 저장하는 중 오류 발생:", error);
  }
}

/**
 * 새 카테고리를 추가합니다.
 */
export async function addCategory(category: Category): Promise<void> {
  const categories = await getCategories();

  // 중복된 ID 체크
  if (categories.some((c) => c.id === category.id)) {
    throw new Error("이미 존재하는 카테고리 ID입니다.");
  }

  // 중복된 이름 체크
  if (categories.some((c) => c.name.toLowerCase() === category.name.toLowerCase())) {
    throw new Error("이미 존재하는 카테고리 이름입니다.");
  }

  await saveCategories([...categories, category]);
}

/**
 * 카테고리를 수정합니다.
 */
export async function updateCategory(updatedCategory: Category): Promise<void> {
  const categories = await getCategories();

  // 기본 카테고리(default) 수정 금지
  const defaultCategoryIds = DEFAULT_CATEGORIES.map((c) => c.id);
  if (defaultCategoryIds.includes(updatedCategory.id)) {
    throw new Error("기본 카테고리는 수정할 수 없습니다.");
  }

  // 중복된 이름 체크 (자기 자신 제외)
  if (
    categories.some((c) => c.id !== updatedCategory.id && c.name.toLowerCase() === updatedCategory.name.toLowerCase())
  ) {
    throw new Error("이미 존재하는 카테고리 이름입니다.");
  }

  const updatedCategories = categories.map((category) =>
    category.id === updatedCategory.id ? updatedCategory : category
  );

  await saveCategories(updatedCategories);
}

/**
 * 카테고리를 삭제합니다. 해당 카테고리의 습관들은 '기타' 카테고리로 이동합니다.
 */
export async function deleteCategory(categoryId: string): Promise<void> {
  const categories = await getCategories();
  const habits = await getHabits();

  // 기본 카테고리 삭제 금지
  const defaultCategoryIds = DEFAULT_CATEGORIES.map((c) => c.id);
  if (defaultCategoryIds.includes(categoryId)) {
    throw new Error("기본 카테고리는 삭제할 수 없습니다.");
  }

  // 해당 카테고리의 습관들을 '기타' 카테고리로 이동
  const updatedHabits = habits.map((habit) => {
    if (habit.categoryId === categoryId) {
      return { ...habit, categoryId: "other" };
    }
    return habit;
  });

  // 카테고리 목록에서 삭제
  const filteredCategories = categories.filter((category) => category.id !== categoryId);

  // 변경사항 저장
  await saveHabits(updatedHabits);
  await saveCategories(filteredCategories);
}

/**
 * 특정 카테고리의 습관 목록을 필터링하여 반환합니다.
 */
export function filterHabitsByCategory(habits: Habit[], categoryId: string | null): Habit[] {
  if (!categoryId) return habits;
  return habits.filter((habit) => habit.categoryId === categoryId);
}

/**
 * 각 카테고리별 습관 수를 계산합니다.
 */
export function countHabitsByCategory(habits: Habit[]): { [categoryId: string]: number } {
  const counts: { [categoryId: string]: number } = {};

  habits.forEach((habit) => {
    if (!counts[habit.categoryId]) {
      counts[habit.categoryId] = 0;
    }
    counts[habit.categoryId]++;
  });

  return counts;
}

/**
 * 습관에 알림 설정 추가
 */
export async function updateHabitNotification(
  habitId: string,
  notificationSetting: NotificationSetting | null
): Promise<void> {
  const habits = await getHabits();
  const habit = habits.find((h) => h.id === habitId);

  if (!habit) {
    throw new Error("습관을 찾을 수 없습니다.");
  }

  // 기존 알림 취소
  if (habit.notification?.enabled) {
    await cancelHabitNotifications(habitId);
  }

  // 알림 설정이 null이면 알림 제거
  if (!notificationSetting) {
    const updatedHabit = { ...habit, notification: undefined };
    await updateHabit(updatedHabit);
    return;
  }

  // 새 알림 예약
  if (notificationSetting.enabled) {
    const [hours, minutes] = notificationSetting.time.split(":").map(Number);

    const notificationIds = await scheduleHabitNotification(habit, {
      hour: hours,
      minute: minutes,
      repeats: true,
      weekdays: notificationSetting.days.length > 0 ? notificationSetting.days : undefined,
    });

    // 예약된 알림 ID 저장
    const updatedNotification = {
      ...notificationSetting,
      notificationIds,
    };

    const updatedHabit = { ...habit, notification: updatedNotification };
    await updateHabit(updatedHabit);
  } else {
    // 알림 비활성화
    const updatedHabit = { ...habit, notification: notificationSetting };
    await updateHabit(updatedHabit);
  }
}

/**
 * 모든 습관의 알림 다시 예약
 * 앱 실행 시 호출하여 알림 설정 복원
 */
export async function rescheduleAllHabitNotifications(): Promise<void> {
  const habits = await getHabits();

  for (const habit of habits) {
    if (habit.notification?.enabled) {
      const [hours, minutes] = habit.notification.time.split(":").map(Number);

      await cancelHabitNotifications(habit.id);

      const notificationIds = await scheduleHabitNotification(habit, {
        hour: hours,
        minute: minutes,
        repeats: true,
        weekdays: habit.notification.days.length > 0 ? habit.notification.days : undefined,
      });

      // 예약된 알림 ID 업데이트
      const updatedNotification = {
        ...habit.notification,
        notificationIds,
      };

      const updatedHabit = { ...habit, notification: updatedNotification };
      const otherHabits = habits.filter((h) => h.id !== habit.id);
      await saveHabits([...otherHabits, updatedHabit]);
    }
  }
}
