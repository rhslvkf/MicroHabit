import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Habit } from "../../types";
import { useTheme } from "../../themes/ThemeContext";

interface HabitItemProps {
  habit: Habit;
  onToggle: (id: string) => void;
  onLongPress: (habit: Habit) => void;
}

export function HabitItem({ habit, onToggle, onLongPress }: HabitItemProps): React.ReactElement {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.container, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
      onPress={() => onToggle(habit.id)}
      onLongPress={() => onLongPress(habit)}
      delayLongPress={500}
    >
      <View style={styles.contentContainer}>
        <View
          style={[
            styles.checkbox,
            { borderColor: theme.primary },
            habit.isCompleted && [styles.checkboxChecked, { backgroundColor: theme.primary }],
          ]}
        >
          {habit.isCompleted && <View style={styles.checkmark} />}
        </View>
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              { color: theme.text },
              habit.isCompleted && [styles.titleCompleted, { color: theme.textDisabled }],
            ]}
          >
            {habit.title}
          </Text>
          {habit.description && (
            <Text style={[styles.description, { color: theme.textSecondary }]}>{habit.description}</Text>
          )}
        </View>

        <Text style={[styles.editHint, { color: theme.textDisabled }]}>길게 눌러서 편집</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
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
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {},
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
  },
  titleCompleted: {
    textDecorationLine: "line-through",
  },
  description: {
    fontSize: 14,
    marginTop: 4,
  },
  editHint: {
    fontSize: 12,
    marginLeft: 8,
  },
});
