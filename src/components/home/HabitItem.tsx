import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Habit, Category } from "../../types";
import { useTheme } from "../../themes/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { getCategories } from "../../utils/storage";

interface HabitItemProps {
  habit: Habit;
  onToggle: (id: string) => void;
  onLongPress: (habit: Habit) => void;
}

export function HabitItem({ habit, onToggle, onLongPress }: HabitItemProps): React.ReactElement {
  const { theme } = useTheme();
  const [category, setCategory] = React.useState<Category | null>(null);

  // 카테고리 정보 로드
  React.useEffect(() => {
    const loadCategory = async () => {
      try {
        const categories = await getCategories();
        const matchedCategory = categories.find((c) => c.id === habit.categoryId);
        if (matchedCategory) {
          setCategory(matchedCategory);
        }
      } catch (error) {
        console.error("카테고리 로드 오류:", error);
      }
    };

    loadCategory();
  }, [habit.categoryId]);

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
          {category && (
            <View style={styles.categoryContainer}>
              <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                <Ionicons name={category.icon as any} size={12} color="white" />
              </View>
              <Text style={[styles.categoryName, { color: category.color }]}>{category.name}</Text>
            </View>
          )}
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
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  categoryIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: "500",
  },
});
