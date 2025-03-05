import React from "react";
import { StyleSheet, Text, View, FlatList } from "react-native";
import { Habit } from "../../types";
import { HabitItem } from "./HabitItem";

interface HabitsListProps {
  habits: Habit[];
  onToggleHabit: (id: string) => void;
  onEditHabit: (habit: Habit) => void;
}

export function HabitsList({ habits, onToggleHabit, onEditHabit }: HabitsListProps): React.ReactElement {
  if (habits.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          등록된 습관이 없습니다.{"\n"}
          새로운 습관을 추가해 보세요!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={habits}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <HabitItem habit={item} onToggle={onToggleHabit} onLongPress={onEditHabit} />}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
});
