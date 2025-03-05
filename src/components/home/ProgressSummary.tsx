import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { HabitSummary } from "../../types";

interface ProgressSummaryProps {
  summary: HabitSummary;
}

export function ProgressSummary({ summary }: ProgressSummaryProps): React.ReactElement {
  const { total, completed, completionRate } = summary;

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <AnimatedCircularProgress
          size={120}
          width={12}
          fill={completionRate}
          tintColor="#007AFF"
          backgroundColor="#f0f0f0"
          rotation={0}
          lineCap="round"
        >
          {() => (
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressPercentage}>{Math.round(completionRate)}%</Text>
              <Text style={styles.progressLabel}>완료</Text>
            </View>
          )}
        </AnimatedCircularProgress>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{total}</Text>
          <Text style={styles.statLabel}>전체</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{completed}</Text>
          <Text style={styles.statLabel}>완료</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{total - completed}</Text>
          <Text style={styles.statLabel}>미완료</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
    margin: 16,
    marginTop: 8,
    shadowColor: "#000",
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
    color: "#007AFF",
  },
  progressLabel: {
    fontSize: 14,
    color: "#666",
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
    color: "#333",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#eee",
  },
});
