import { Habit } from "../types";
import { getTodayISOString } from "./date";

export function generateDummyHabits(): Habit[] {
  const today = getTodayISOString();

  return [
    {
      id: "1",
      title: "물 2리터 마시기",
      description: "건강을 위해 매일 충분한 물을 마시자",
      isCompleted: false,
      createdAt: today,
      completedDates: [],
    },
    {
      id: "2",
      title: "아침 명상 10분",
      description: "하루를 차분하게 시작하기",
      isCompleted: false,
      createdAt: today,
      completedDates: [],
    },
    {
      id: "3",
      title: "독서 30분",
      description: "취침 전 책 읽기",
      isCompleted: false,
      createdAt: today,
      completedDates: [],
    },
    {
      id: "4",
      title: "스트레칭",
      description: "아침에 일어나서 5분 스트레칭",
      isCompleted: false,
      createdAt: today,
      completedDates: [],
    },
    {
      id: "5",
      title: "비타민 복용",
      description: "아침 식사 후 비타민 복용하기",
      isCompleted: false,
      createdAt: today,
      completedDates: [],
    },
  ];
}
