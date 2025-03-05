import React from "react";
import { View, StyleSheet, Animated } from "react-native";

interface ProgressBarProps {
  progress: number; // 0-100 사이의 값
}

export function ProgressBar({ progress }: ProgressBarProps): React.ReactElement {
  // 진행률을 0-100 사이로 제한
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  // 애니메이션 효과를 위해 진행률을 퍼센트로 변환 (0-1 사이의 값)
  const progressPercent = clampedProgress / 100;

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <View
          style={[styles.progress, { width: `${clampedProgress}%` }, clampedProgress === 100 ? styles.completed : null]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  background: {
    height: 12,
    backgroundColor: "#E9E9E9",
    borderRadius: 6,
    overflow: "hidden",
  },
  progress: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 6,
  },
  completed: {
    backgroundColor: "#34C759",
  },
});
