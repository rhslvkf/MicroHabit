import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Habit } from "../../types";

interface HabitItemProps {
  habit: Habit;
  onToggle: (id: string) => void;
  onLongPress: (habit: Habit) => void;
}

export function HabitItem({ habit, onToggle, onLongPress }: HabitItemProps): React.ReactElement {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.container}
      onPress={() => onToggle(habit.id)}
      onLongPress={() => onLongPress(habit)}
      delayLongPress={500}
    >
      <View style={styles.contentContainer}>
        <View style={[styles.checkbox, habit.isCompleted && styles.checkboxChecked]}>
          {habit.isCompleted && <View style={styles.checkmark} />}
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, habit.isCompleted && styles.titleCompleted]}>{habit.title}</Text>
          {habit.description && <Text style={styles.description}>{habit.description}</Text>}
        </View>

        <Text style={styles.editHint}>길게 눌러서 편집</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#007AFF",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#007AFF",
  },
  checkmark: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "white",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  titleCompleted: {
    textDecorationLine: "line-through",
    color: "#888",
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  editHint: {
    fontSize: 12,
    color: "#999",
    marginLeft: 8,
  },
});
