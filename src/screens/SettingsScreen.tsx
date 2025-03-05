import React from "react";
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, MainTabParamList } from "../navigation/types";
import { ThemeToggle } from "../components/shared/ThemeToggle";
import { useTheme } from "../themes/ThemeContext";
import Constants from "expo-constants";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Settings">,
  NativeStackScreenProps<RootStackParamList>
>;

export function SettingsScreen({ navigation }: Props): React.ReactElement {
  const { theme, mode, toggleTheme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: theme.divider }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>설정</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>화면 설정</Text>

          <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.card }]} onPress={toggleTheme}>
            <View style={styles.settingContent}>
              <Ionicons
                name={mode === "dark" ? "moon" : "sunny"}
                size={22}
                color={theme.text}
                style={styles.settingIcon}
              />
              <Text style={[styles.settingText, { color: theme.text }]}>
                {mode === "dark" ? "다크 모드" : "라이트 모드"}
              </Text>
            </View>
            <Text style={[styles.settingStatus, { color: theme.primary }]}>{mode === "dark" ? "켜짐" : "꺼짐"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>앱 정보</Text>

          <View style={[styles.settingItem, { backgroundColor: theme.card }]}>
            <View style={styles.settingContent}>
              <Ionicons name="information-circle" size={22} color={theme.text} style={styles.settingIcon} />
              <Text style={[styles.settingText, { color: theme.text }]}>버전</Text>
            </View>
            <Text style={[styles.settingStatus, { color: theme.textSecondary }]}>
              {Constants.expoConfig?.version || "1.0.0"}
            </Text>
          </View>

          <View style={[styles.settingItem, { backgroundColor: theme.card }]}>
            <View style={styles.settingContent}>
              <Ionicons name="code-slash" size={22} color={theme.text} style={styles.settingIcon} />
              <Text style={[styles.settingText, { color: theme.text }]}>개발자</Text>
            </View>
            <Text style={[styles.settingStatus, { color: theme.textSecondary }]}>MicroHabit Team</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  card: {
    borderRadius: 8,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  settingItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingItemText: {
    fontSize: 16,
    marginLeft: 12,
  },
  settingItemValue: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
  },
  settingStatus: {
    fontSize: 14,
  },
});
