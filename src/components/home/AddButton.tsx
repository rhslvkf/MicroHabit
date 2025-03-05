import React from "react";
import { StyleSheet, TouchableOpacity, View, Text, Platform } from "react-native";

interface AddButtonProps {
  onPress: () => void;
}

export function AddButton({ onPress }: AddButtonProps): React.ReactElement {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.button}>
        <Text style={styles.plus}>+</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    right: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  button: {
    backgroundColor: "#007AFF",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  plus: {
    fontSize: 32,
    color: "white",
    marginTop: -2, // 수직 정렬 미세 조정
  },
});
