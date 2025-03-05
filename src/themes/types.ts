export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  // 배경색
  background: string;
  card: string;
  surface: string;

  // 텍스트색
  text: string;
  textSecondary: string;
  textDisabled: string;

  // 기본색상
  primary: string;
  secondary: string;
  accent: string;

  // 상태색상
  success: string;
  warning: string;
  error: string;

  // 경계선, 구분선
  border: string;
  divider: string;

  // 기타
  shadow: string;
  overlay: string;

  // 특별 컴포넌트 색상
  habitComplete: string;
  habitIncomplete: string;
}

export interface ThemeContext {
  theme: ThemeColors;
  mode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}
