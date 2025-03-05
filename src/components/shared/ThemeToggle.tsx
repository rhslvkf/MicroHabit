import React from "react";
import { TouchableOpacity, StyleSheet, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../themes/ThemeContext";

interface ThemeToggleProps {
  compact?: boolean;
}

export function ThemeToggle({ compact = false }: ThemeToggleProps): React.ReactElement {
  const { mode, toggleTheme, theme } = useTheme();

  const isDark = mode === "dark";

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.card }, compact ? styles.compactContainer : null]}
      onPress={toggleTheme}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={isDark ? "moon" : "sunny"}
          size={compact ? 20 : 24}
          color={isDark ? "#FFD700" : "#FF9500"} // 다크모드: 금색, 라이트모드: 주황색
        />
      </View>

      {!compact && <Text style={[styles.text, { color: theme.text }]}>{isDark ? "다크 모드" : "라이트 모드"}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  compactContainer: {
    padding: 8,
    borderRadius: 20,
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: "500",
  },
});
