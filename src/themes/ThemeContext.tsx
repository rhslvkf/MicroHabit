import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useColorScheme } from "react-native";
import { ThemeColors, ThemeMode, ThemeContext as ThemeContextType } from "./types";
import { lightTheme, darkTheme } from "./colors";
import { getThemeMode, saveThemeMode } from "../utils/storage";

// 기본 테마 컨텍스트 값
const defaultThemeContext: ThemeContextType = {
  theme: lightTheme,
  mode: "light",
  toggleTheme: () => {},
  setThemeMode: () => {},
};

// 테마 컨텍스트 생성
const ThemeContext = createContext<ThemeContextType>(defaultThemeContext);

// 테마 컨텍스트 프로바이더 Props
interface ThemeProviderProps {
  children: ReactNode;
}

// 테마 프로바이더 컴포넌트
export function ThemeProvider({ children }: ThemeProviderProps): React.ReactElement {
  // 시스템 테마 모드
  const systemColorScheme = useColorScheme();

  // 현재 테마 모드 상태
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");

  // 현재 테마 색상
  const [theme, setTheme] = useState<ThemeColors>(lightTheme);

  // 테마 전환 함수
  const toggleTheme = () => {
    const newMode = themeMode === "light" ? "dark" : "light";
    setThemeMode(newMode);
    saveThemeMode(newMode);
  };

  // 특정 테마로 변경하는 함수
  const handleSetThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    saveThemeMode(mode);
  };

  // 앱 시작 시 저장된 테마 로드
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await getThemeMode();

      // 저장된 테마가 있으면 사용, 없으면 시스템 테마 사용
      const themeToUse = savedTheme || (systemColorScheme as ThemeMode) || "light";
      setThemeMode(themeToUse);
    };

    loadTheme();
  }, [systemColorScheme]);

  // 테마 모드에 따라 테마 색상 변경
  useEffect(() => {
    setTheme(themeMode === "dark" ? darkTheme : lightTheme);
  }, [themeMode]);

  // 컨텍스트 값
  const contextValue: ThemeContextType = {
    theme,
    mode: themeMode,
    toggleTheme,
    setThemeMode: handleSetThemeMode,
  };

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

// 테마 훅
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
