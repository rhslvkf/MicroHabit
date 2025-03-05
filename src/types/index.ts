export interface Habit {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  createdAt: string;
  completedDates: string[]; // ISO 날짜 문자열 배열
}

export interface HabitSummary {
  total: number;
  completed: number;
  completionRate: number;
}
