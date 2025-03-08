export interface Habit {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  createdAt: string;
  completedDates: string[]; // ISO 날짜 문자열 배열
  categoryId: string; // 카테고리 ID
  notification?: NotificationSetting; // 알림 설정
}

export interface NotificationSetting {
  enabled: boolean;
  time: string; // "HH:MM" 형식
  days: number[]; // 1(월요일) ~ 7(일요일)까지, 빈 배열이면 매일
  notificationIds?: string[]; // 예약된 알림 ID들
}

export interface HabitSummary {
  total: number;
  completed: number;
  completionRate: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string; // Ionicons 이름
}

// 기본 카테고리 목록
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "health",
    name: "건강",
    color: "#FF5757", // 빨간색
    icon: "fitness-outline",
  },
  {
    id: "study",
    name: "학습",
    color: "#47A0FF", // 파란색
    icon: "book-outline",
  },
  {
    id: "work",
    name: "업무",
    color: "#FFC947", // 노란색
    icon: "briefcase-outline",
  },
  {
    id: "mindfulness",
    name: "마음챙김",
    color: "#57C8A9", // 초록색
    icon: "leaf-outline",
  },
  {
    id: "social",
    name: "사회생활",
    color: "#B38FFF", // 보라색
    icon: "people-outline",
  },
  {
    id: "hobby",
    name: "취미",
    color: "#FF9F76", // 주황색
    icon: "color-palette-outline",
  },
  {
    id: "other",
    name: "기타",
    color: "#8E8E93", // 회색
    icon: "ellipsis-horizontal-outline",
  },
];
