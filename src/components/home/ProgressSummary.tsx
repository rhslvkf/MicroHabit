import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { HabitSummary } from "../../types";
import { useTheme } from "../../themes/ThemeContext";

interface ProgressSummaryProps {
  summary: HabitSummary;
}

export function ProgressSummary({ summary }: ProgressSummaryProps): React.ReactElement {
  const { theme } = useTheme();
  const { total, completed, completionRate } = summary;

  return (
    <View style={[styles.container, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
      <View style={styles.progressContainer}>
        <AnimatedCircularProgress
          size={120}
          width={12}
          fill={completionRate}
          tintColor={theme.primary}
          backgroundColor={theme.divider}
          rotation={0}
          lineCap="round"
        >
          {() => (
            <View style={styles.progressTextContainer}>
              <Text style={[styles.progressPercentage, { color: theme.primary }]}>{Math.round(completionRate)}%</Text>
              <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>완료</Text>
            </View>
          )}
        </AnimatedCircularProgress>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text }]}>{total}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>전체</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.divider }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text }]}>{completed}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>완료</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.divider }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text }]}>{total - completed}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>미완료</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    margin: 16,
    marginTop: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  progressTextContainer: {
    alignItems: "center",
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: "bold",
  },
  progressLabel: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
});
