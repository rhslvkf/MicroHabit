import React from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Category } from "../../types";
import { useTheme } from "../../themes/ThemeContext";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function CategoryFilter({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryFilterProps): React.ReactElement {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={[
            styles.categoryItem,
            !selectedCategoryId && styles.selectedItem,
            { borderColor: !selectedCategoryId ? theme.primary : theme.border },
          ]}
          onPress={() => onSelectCategory(null)}
        >
          <Ionicons name="layers-outline" size={16} color={!selectedCategoryId ? theme.primary : theme.textSecondary} />
          <Text style={[styles.categoryText, { color: !selectedCategoryId ? theme.primary : theme.textSecondary }]}>
            전체
          </Text>
        </TouchableOpacity>

        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryItem,
              selectedCategoryId === category.id && styles.selectedItem,
              {
                borderColor: selectedCategoryId === category.id ? category.color : theme.border,
              },
            ]}
            onPress={() => onSelectCategory(category.id)}
          >
            <View style={[styles.iconContainer, { backgroundColor: category.color }]}>
              <Ionicons name={category.icon as any} size={14} color="white" />
            </View>
            <Text
              style={[
                styles.categoryText,
                {
                  color: selectedCategoryId === category.id ? category.color : theme.textSecondary,
                },
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  selectedItem: {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
  },
  iconContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
