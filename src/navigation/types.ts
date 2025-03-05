import { Habit } from "../types";

export type MainTabParamList = {
  Home: undefined;
  Calendar: { selectedDate?: string } | undefined;
};

export type RootStackParamList = {
  Main: undefined;
  AddHabit: undefined;
  EditHabit: { habit: Habit };
};
