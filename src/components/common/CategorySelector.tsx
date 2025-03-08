import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Category } from "../../types";
import { useTheme } from "../../themes/ThemeContext";

interface CategorySelectorProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
}

export function CategorySelector({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategorySelectorProps): React.ReactElement {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // 선택된 카테고리 찾기
  useEffect(() => {
    const category = categories.find((c) => c.id === selectedCategoryId);
    setSelectedCategory(category || null);
  }, [selectedCategoryId, categories]);

  // 카테고리 선택 핸들러
  const handleSelectCategory = (categoryId: string) => {
    onSelectCategory(categoryId);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.selector, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectorContent}>
          {selectedCategory ? (
            <>
              <View style={[styles.categoryIcon, { backgroundColor: selectedCategory.color }]}>
                <Ionicons name={selectedCategory.icon as any} size={16} color="white" />
              </View>
              <Text style={[styles.categoryText, { color: theme.text }]}>{selectedCategory.name}</Text>
            </>
          ) : (
            <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>카테고리 선택</Text>
          )}
        </View>
        <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <SafeAreaView style={styles.modalContainer}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>카테고리 선택</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <FlatList
                data={categories}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.categoryItem,
                      item.id === selectedCategoryId && [styles.selectedItem, { backgroundColor: theme.primaryLight }],
                    ]}
                    onPress={() => handleSelectCategory(item.id)}
                  >
                    <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
                      <Ionicons name={item.icon as any} size={20} color="white" />
                    </View>
                    <Text
                      style={[
                        styles.categoryItemText,
                        { color: theme.text },
                        item.id === selectedCategoryId && { fontWeight: "bold" },
                      ]}
                    >
                      {item.name}
                    </Text>
                    {item.id === selectedCategoryId && <Ionicons name="checkmark" size={20} color={theme.primary} />}
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.categoryList}
              />
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const { height: screenHeight } = Dimensions.get("window");

const styles = StyleSheet.create({
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 8,
  },
  selectorContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  categoryText: {
    fontSize: 16,
  },
  placeholderText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    zIndex: 1000,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 0 : 20,
    maxHeight: screenHeight * 0.7,
    minHeight: screenHeight * 0.3,
    zIndex: 1001,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  categoryList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  selectedItem: {
    borderRadius: 8,
  },
  categoryItemText: {
    fontSize: 16,
    flex: 1,
  },
});
