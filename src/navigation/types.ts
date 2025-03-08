import { Habit } from "../types";

export type MainTabParamList = {
  Home: undefined;
  Calendar: { selectedDate?: string } | undefined;
  Settings: undefined;
  Statistics: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  AddHabit: undefined;
  EditHabit: { habit: Habit };
  Notifications: undefined;
};
