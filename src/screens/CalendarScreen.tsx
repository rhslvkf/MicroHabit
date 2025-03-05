import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, DateData } from "react-native-calendars";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, MainTabParamList } from "../navigation/types";
import { Habit } from "../types";
import { getHabits, calculateCompletionStatus } from "../utils/storage";
import { formatDate, getTodayISOString } from "../utils/date";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Calendar">,
  NativeStackScreenProps<RootStackParamList>
>;

export function CalendarScreen({ navigation, route }: Props): React.ReactElement {
  // 전달받은 날짜 파라미터가 있으면 사용하고, 없으면 오늘 날짜 사용
  const initialDate = route.params?.selectedDate || getTodayISOString();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [markedDates, setMarkedDates] = useState<{ [date: string]: any }>({});
  const [dateHabits, setDateHabits] = useState<Habit[]>([]);

  // 습관 ID에 따라 색상 생성 (단순화를 위해 몇 가지 고정 색상 사용)
  const getHabitColor = useCallback((id: string): string => {
    const colors = ["#007AFF", "#34C759", "#FF9500", "#FF2D55", "#5856D6", "#AF52DE"];
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
  }, []);

  // 달력에 표시할 마커 생성
  const generateMarkedDates = useCallback(
    (habits: Habit[]): void => {
      const marks: { [date: string]: any } = {};

      // 모든 습관의 완료된 날짜 수집
      habits.forEach((habit) => {
        habit.completedDates.forEach((date) => {
          const shortDate = date.split("T")[0]; // YYYY-MM-DD 형식으로 변환

          if (!marks[shortDate]) {
            marks[shortDate] = {
              marked: true,
              dots: [],
            };
          }

          // 습관별로 다른 색상의 점 추가
          marks[shortDate].dots.push({
            key: habit.id,
            color: getHabitColor(habit.id),
          });
        });
      });

      // 오늘 날짜와 선택된 날짜 표시
      const today = getTodayISOString().split("T")[0];
      const selected = selectedDate.split("T")[0];

      if (marks[today]) {
        marks[today].selected = today === selected;
      } else {
        marks[today] = {
          selected: today === selected,
          marked: false,
        };
      }

      if (selected !== today) {
        if (marks[selected]) {
          marks[selected].selected = true;
        } else {
          marks[selected] = {
            selected: true,
            marked: false,
          };
        }
      }

      setMarkedDates(marks);
    },
    [selectedDate, getHabitColor]
  );

  // 습관 데이터 로드 및 달력 마커 설정
  const loadHabits = useCallback(async (): Promise<void> => {
    try {
      const loadedHabits = await getHabits();
      setHabits(loadedHabits);
      generateMarkedDates(loadedHabits);
    } catch (error) {
      console.error("습관 데이터 로드 오류:", error);
    }
  }, [generateMarkedDates]);

  // 날짜 선택 핸들러
  const handleDateSelect = useCallback((date: DateData): void => {
    const isoDate = `${date.dateString}T00:00:00.000Z`;
    setSelectedDate(isoDate);
  }, []);

  // 선택된 날짜의 습관 데이터 업데이트
  const updateDateHabits = useCallback((): void => {
    if (!habits.length) return;

    const shortDate = selectedDate.split("T")[0];

    // 해당 날짜에 완료 여부와 관계없이 모든 습관을 표시하되, 완료 상태 확인
    const habitsList = habits.map((habit) => ({
      ...habit,
      isCompleted: habit.completedDates.some((date) => date.split("T")[0] === shortDate),
    }));

    setDateHabits(habitsList);
  }, [habits, selectedDate]);

  // 선택된 날짜의 요약 정보 계산
  const getDateSummary = useCallback((): { total: number; completed: number; rate: number } => {
    if (!habits.length) {
      return { total: 0, completed: 0, rate: 0 };
    }

    const shortDate = selectedDate.split("T")[0];
    const status = calculateCompletionStatus(habits, shortDate);

    return {
      total: status.total,
      completed: status.completed,
      rate: Math.round(status.completionRate), // 완료율 반올림
    };
  }, [habits, selectedDate]);

  // 습관 데이터 로드 및 포커스 이벤트 리스너 추가
  useEffect(() => {
    loadHabits();

    // 화면에 포커스가 올 때마다 습관 목록 다시 로드
    const unsubscribe = navigation.addListener("focus", loadHabits);
    return unsubscribe;
  }, [navigation, loadHabits]);

  // 선택된 날짜가 변경될 때 해당 날짜의 습관 데이터 업데이트
  useEffect(() => {
    updateDateHabits();
  }, [updateDateHabits]);

  // route.params가 변경될 때 선택된 날짜 업데이트
  useEffect(() => {
    if (route.params?.selectedDate) {
      setSelectedDate(route.params.selectedDate);
    }
  }, [route.params]);

  const summary = getDateSummary();
  const formattedDate = formatDate(selectedDate);

  // 습관 아이템 렌더링 함수
  const renderHabitItem = ({ item }: { item: Habit & { isCompleted: boolean } }) => (
    <View style={styles.habitItem}>
      <View style={[styles.habitColor, { backgroundColor: getHabitColor(item.id) }]} />
      <View style={styles.habitInfo}>
        <Text style={styles.habitTitle}>{item.title}</Text>
        {item.description ? <Text style={styles.habitDescription}>{item.description}</Text> : null}
      </View>
      <View style={[styles.completionStatus, item.isCompleted ? styles.completed : styles.notCompleted]}>
        <Text style={styles.statusText}>{item.isCompleted ? "완료" : "미완료"}</Text>
      </View>
    </View>
  );

  // 빈 목록일 때 렌더링 함수
  const renderEmptyComponent = () => <Text style={styles.emptyText}>이 날에 등록된 습관이 없습니다.</Text>;

  // 목록의 푸터 컴포넌트 (마지막 아이템과 탭 사이 공간 제거)
  const renderFooter = () => <View style={{ height: 1 }} />;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.calendarContainer}>
        <Calendar
          current={selectedDate.split("T")[0]}
          markingType="multi-dot"
          markedDates={markedDates}
          onDayPress={handleDateSelect}
          theme={{
            todayTextColor: "#007AFF",
            selectedDayBackgroundColor: "#007AFF",
            arrowColor: "#007AFF",
            dotColor: "#007AFF",
            textDayFontFamily: "System",
            textMonthFontFamily: "System",
            textDayHeaderFontFamily: "System",
          }}
        />
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.dateTitle}>{formattedDate}</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>전체 습관</Text>
            <Text style={styles.summaryValue}>{summary.total}개</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>완료 습관</Text>
            <Text style={styles.summaryValue}>{summary.completed}개</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>완료율</Text>
            <Text style={styles.summaryValue}>{summary.rate}%</Text>
          </View>
        </View>
      </View>

      <View style={styles.habitsHeaderContainer}>
        <Text style={styles.sectionTitle}>이 날의 습관</Text>
      </View>

      <FlatList
        style={styles.habitsList}
        data={dateHabits}
        keyExtractor={(item) => item.id}
        renderItem={renderHabitItem}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.habitsListContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  calendarContainer: {
    paddingBottom: 8,
  },
  summaryContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  habitsHeaderContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  habitsList: {
    flex: 1,
  },
  habitsListContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 0,
  },
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F9F9F9",
    marginBottom: 8,
  },
  habitColor: {
    width: 12,
    height: 45,
    borderRadius: 6,
    marginRight: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 14,
    color: "#666",
  },
  completionStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  completed: {
    backgroundColor: "#34C759",
  },
  notCompleted: {
    backgroundColor: "#FF3B30",
  },
  statusText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 32,
    fontSize: 16,
  },
});
