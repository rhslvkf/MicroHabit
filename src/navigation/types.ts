import { Habit } from "../types";

export type RootStackParamList = {
  Home: undefined;
  AddHabit: undefined;
  EditHabit: { habit: Habit };
};
