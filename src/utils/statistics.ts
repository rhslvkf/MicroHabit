import { Habit } from "../types";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  subDays,
  subWeeks,
  isWithinInterval,
  isSameDay,
} from "date-fns";
import { ko } from "date-fns/locale";
import { Category } from "../types";

/**
 * 특정 기간 동안의 일별 완료율을 계산합니다.
 */
export function calculateDailyCompletionRates(
  habits: Habit[],
  days: number = 7 // 기본값은 최근 7일
): { date: string; formattedDate: string; shortDate: string; rate: number }[] {
  const today = new Date();
  const result = [];

  // 최근 N일 동안의 일별 완료율 계산
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    const dateString = format(date, "yyyy-MM-dd'T'00:00:00.000'Z'");
    const shortDate = dateString.split("T")[0];

    // 해당 날짜의 완료율 계산
    const total = habits.length;
    const completed = habits.filter((habit) => habit.completedDates.some((d) => d.split("T")[0] === shortDate)).length;

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    result.push({
      date: dateString,
      formattedDate: format(date, "M/d(E)", { locale: ko }),
      shortDate,
      rate,
    });
  }

  return result;
}

/**
 * 습관별 완료율을 계산합니다.
 */
export function calculateHabitCompletionRates(
  habits: Habit[],
  days: number = 30 // 기본값은 최근 30일
): { id: string; title: string; completionRate: number; streak: number }[] {
  const today = new Date();
  const startDate = subDays(today, days - 1);

  return habits
    .map((habit) => {
      // 해당 기간의 완료 일수 계산
      const completedDaysInPeriod = habit.completedDates.filter((dateStr) => {
        const date = new Date(dateStr);
        return isWithinInterval(date, { start: startDate, end: today });
      }).length;

      // 연속 달성일 계산
      let streak = 0;
      let currentDate = today;
      let consecutiveDays = 0;

      while (consecutiveDays < 100) {
        // 무한 루프 방지를 위한 상한값 설정
        const dateStr = format(currentDate, "yyyy-MM-dd");
        const isCompleted = habit.completedDates.some((d) => isSameDay(new Date(d), currentDate));

        if (isCompleted) {
          streak++;
          currentDate = subDays(currentDate, 1);
        } else {
          break;
        }
        consecutiveDays++;
      }

      return {
        id: habit.id,
        title: habit.title,
        completionRate: days > 0 ? Math.round((completedDaysInPeriod / days) * 100) : 0,
        streak,
      };
    })
    .sort((a, b) => b.completionRate - a.completionRate); // 완료율 내림차순 정렬
}

/**
 * 이번 주 전체 완료 통계를 계산합니다.
 */
export function calculateWeeklyStats(habits: Habit[]): {
  totalCompletions: number;
  completionRate: number;
  bestDay: { date: string; formattedDate: string; completions: number };
} {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // 월요일부터 시작
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  let totalCompletions = 0;
  let bestDay = { date: "", formattedDate: "", completions: 0 };
  let totalPossibleCompletions = habits.length * daysInWeek.length;

  // 각 날짜별 완료 수 계산
  daysInWeek.forEach((day) => {
    const dateString = format(day, "yyyy-MM-dd");
    const completionsOnDay = habits.filter((habit) =>
      habit.completedDates.some((d) => d.split("T")[0] === dateString)
    ).length;

    totalCompletions += completionsOnDay;

    if (completionsOnDay > bestDay.completions) {
      bestDay = {
        date: format(day, "yyyy-MM-dd'T'00:00:00.000'Z'"),
        formattedDate: format(day, "M월 d일 (E)", { locale: ko }),
        completions: completionsOnDay,
      };
    }
  });

  return {
    totalCompletions,
    completionRate: totalPossibleCompletions > 0 ? Math.round((totalCompletions / totalPossibleCompletions) * 100) : 0,
    bestDay,
  };
}

/**
 * 최근 4주간의 주간 완료율 추세를 계산합니다.
 */
export function calculateWeeklyTrend(habits: Habit[]): { week: string; rate: number }[] {
  const result = [];
  const today = new Date();

  for (let i = 3; i >= 0; i--) {
    const weekEnd = subDays(today, i * 7);
    const weekStart = subDays(weekEnd, 6);

    // 해당 주의 모든 날짜
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    let totalCompletions = 0;
    const totalPossible = habits.length * daysInWeek.length;

    // 각 날짜별 완료 수 합산
    daysInWeek.forEach((day) => {
      const dateString = format(day, "yyyy-MM-dd");
      const completionsOnDay = habits.filter((habit) =>
        habit.completedDates.some((d) => d.split("T")[0] === dateString)
      ).length;

      totalCompletions += completionsOnDay;
    });

    const weekLabel = i === 0 ? "이번 주" : `${i}주 전`;
    result.push({
      week: weekLabel,
      rate: totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0,
    });
  }

  return result;
}

/**
 * 카테고리별 완료율을 계산합니다.
 */
export function calculateCategoryCompletionRates(
  habits: Habit[],
  categories: Category[],
  days: number = 30 // 기본값은 최근 30일
): { category: Category; completionRate: number; habitCount: number }[] {
  const today = new Date();
  const startDate = subDays(today, days - 1);
  const result: { category: Category; completionRate: number; habitCount: number }[] = [];

  // 카테고리별 습관 그룹화
  const habitsByCategory: { [categoryId: string]: Habit[] } = {};

  habits.forEach((habit) => {
    if (!habitsByCategory[habit.categoryId]) {
      habitsByCategory[habit.categoryId] = [];
    }
    habitsByCategory[habit.categoryId].push(habit);
  });

  // 각 카테고리별 완료율 계산
  categories.forEach((category) => {
    const categoryHabits = habitsByCategory[category.id] || [];
    const habitCount = categoryHabits.length;

    if (habitCount === 0) {
      result.push({ category, completionRate: 0, habitCount: 0 });
      return;
    }

    // 해당 기간 내 모든 날짜에 대한 완료 가능한 총 횟수
    const totalPossibleCompletions = habitCount * days;

    // 실제 완료된 횟수 계산
    let totalCompletions = 0;

    categoryHabits.forEach((habit) => {
      // 해당 기간 내 완료된 날짜 수 계산
      const completedDaysInPeriod = habit.completedDates.filter((dateStr) => {
        const date = new Date(dateStr);
        return isWithinInterval(date, { start: startDate, end: today });
      }).length;

      totalCompletions += completedDaysInPeriod;
    });

    const completionRate =
      totalPossibleCompletions > 0 ? Math.round((totalCompletions / totalPossibleCompletions) * 100) : 0;

    result.push({ category, completionRate, habitCount });
  });

  // 완료율 내림차순으로 정렬
  return result.sort((a, b) => b.completionRate - a.completionRate);
}
