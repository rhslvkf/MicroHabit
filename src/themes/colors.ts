import { ThemeColors } from "./types";

export const lightTheme: ThemeColors = {
  // 배경색
  background: "#FFFFFF",
  card: "#F9F9F9",
  surface: "#FFFFFF",

  // 텍스트색
  text: "#000000",
  textSecondary: "#666666",
  textDisabled: "#999999",

  // 기본색상
  primary: "#007AFF",
  primaryLight: "#E5F2FF",
  secondary: "#5856D6",
  accent: "#FF9500",

  // 상태색상
  success: "#34C759",
  warning: "#FF9500",
  error: "#FF3B30",
  disabled: "#DDDDDD",

  // 경계선, 구분선
  border: "#E5E5EA",
  divider: "#EEEEEE",

  // 기타
  shadow: "rgba(0, 0, 0, 0.1)",
  overlay: "rgba(0, 0, 0, 0.4)",

  // 특별 컴포넌트 색상
  habitComplete: "#34C759",
  habitIncomplete: "#FF3B30",
};

export const darkTheme: ThemeColors = {
  // 배경색
  background: "#121212",
  card: "#1E1E1E",
  surface: "#252525",

  // 텍스트색
  text: "#FFFFFF",
  textSecondary: "#AAAAAA",
  textDisabled: "#666666",

  // 기본색상
  primary: "#0A84FF",
  primaryLight: "#0A3256",
  secondary: "#6E6CD8",
  accent: "#FF9F0A",

  // 상태색상
  success: "#30D158",
  warning: "#FFB340",
  error: "#FF453A",
  disabled: "#444444",

  // 경계선, 구분선
  border: "#383838",
  divider: "#2C2C2C",

  // 기타
  shadow: "rgba(0, 0, 0, 0.3)",
  overlay: "rgba(0, 0, 0, 0.6)",

  // 특별 컴포넌트 색상
  habitComplete: "#30D158",
  habitIncomplete: "#FF453A",
};
