import React, { useState, useEffect, useCallback, useMemo } from "react";
import { StyleSheet, View, Text, FlatList, ScrollView, TouchableOpacity, Alert, Vibration } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, DateData } from "react-native-calendars";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, MainTabParamList } from "../navigation/types";
import { Habit, Category } from "../types";
import { getHabits, getCategories, calculateCompletionStatus, toggleHabitCompletion } from "../utils/storage";
import { formatDate, getTodayISOString } from "../utils/date";
import { useTheme } from "../themes/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Calendar">,
  NativeStackScreenProps<RootStackParamList>
>;

export function CalendarScreen({ navigation, route }: Props): React.ReactElement {
  const { theme, mode } = useTheme();
  // 전달받은 날짜 파라미터가 있으면 사용하고, 없으면 오늘 날짜 사용
  const initialDate = route.params?.selectedDate || getTodayISOString();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [markedDates, setMarkedDates] = useState<{ [date: string]: any }>({});
  const [dateHabits, setDateHabits] = useState<Habit[]>([]);
  const [themeMode, setThemeMode] = useState<string>(mode);
  const [isUpdating, setIsUpdating] = useState(false);

  // 테마 모드 변경 감지
  useEffect(() => {
    setThemeMode(mode);
  }, [mode]);

  // 습관 ID에 따라 색상 생성 (단순화를 위해 몇 가지 고정 색상 사용)
  const getHabitColor = useCallback(
    (id: string): string => {
      const colors = [theme.primary, theme.success, theme.accent, theme.error, theme.secondary];
      const index = id.charCodeAt(0) % colors.length;
      return colors[index];
    },
    [theme]
  );

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

  // 습관 체크/언체크 핸들러
  const handleToggleHabit = useCallback(
    async (habitId: string) => {
      if (isUpdating) return;

      setIsUpdating(true);
      try {
        // 진동 피드백
        Vibration.vibrate(50);

        // 습관 완료 상태 토글
        const updatedHabits = await toggleHabitCompletion(habitId, selectedDate);
        setHabits(updatedHabits);

        // 업데이트된 습관 목록으로 달력 마커 재생성
        generateMarkedDates(updatedHabits);

        // 선택된 날짜의 습관 목록 업데이트
        const shortDate = selectedDate.split("T")[0];
        const updatedDateHabits = updatedHabits.map((habit) => ({
          ...habit,
          isCompleted: habit.completedDates.some((date) => date.split("T")[0] === shortDate),
        }));
        setDateHabits(updatedDateHabits);
      } catch (error) {
        console.error("습관 상태 변경 오류:", error);
        Alert.alert("오류", "습관 상태를 변경하는 중 오류가 발생했습니다.");
      } finally {
        setIsUpdating(false);
      }
    },
    [selectedDate, isUpdating, generateMarkedDates]
  );

  // 카테고리 찾기
  const findCategory = useCallback(
    (categoryId: string): Category | undefined => {
      return categories.find((c) => c.id === categoryId);
    },
    [categories]
  );

  // 습관 데이터 로드 및 달력 마커 설정
  const loadHabits = useCallback(async (): Promise<void> => {
    try {
      const loadedHabits = await getHabits();
      setHabits(loadedHabits);
      generateMarkedDates(loadedHabits);

      // 선택된 날짜의 습관 데이터도 함께 업데이트
      const shortDate = selectedDate.split("T")[0];
      const habitsList = loadedHabits.map((habit) => ({
        ...habit,
        isCompleted: habit.completedDates.some((date) => date.split("T")[0] === shortDate),
      }));
      setDateHabits(habitsList);
    } catch (error) {
      console.error("습관 데이터 로드 오류:", error);
    }
  }, [generateMarkedDates, selectedDate]);

  // 카테고리 로드
  const loadCategories = useCallback(async (): Promise<void> => {
    try {
      const loadedCategories = await getCategories();
      setCategories(loadedCategories);
    } catch (error) {
      console.error("카테고리 로드 오류:", error);
    }
  }, []);

  // 날짜 선택 핸들러
  const handleDateSelect = useCallback(
    (date: DateData): void => {
      const today = getTodayISOString().split("T")[0];
      const selectedDateStr = date.dateString;

      // 오늘 이후 날짜는 선택 불가능하도록 처리
      if (selectedDateStr > today) {
        return;
      }

      const isoDate = `${selectedDateStr}T00:00:00.000Z`;
      setSelectedDate(isoDate);

      // 날짜가 변경되면 해당 날짜의 습관 데이터도 즉시 업데이트
      if (habits.length > 0) {
        const habitsList = habits.map((habit) => ({
          ...habit,
          isCompleted: habit.completedDates.some((d) => d.split("T")[0] === selectedDateStr),
        }));
        setDateHabits(habitsList);
      }
    },
    [habits]
  );

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

  // 선택된 날짜의 요약 정보 계산 - useMemo를 사용하여 선택된 날짜나 습관 목록이 변경될 때만 재계산
  const summary = useMemo(() => {
    if (!habits.length) {
      return { total: 0, completed: 0, rate: 0 };
    }

    const shortDate = selectedDate.split("T")[0];
    const status = calculateCompletionStatus(habits, shortDate);

    return {
      total: status.total,
      completed: status.completed,
      rate: Math.round(status.completionRate),
    };
  }, [habits, selectedDate]);

  const formattedDate = useMemo(() => formatDate(selectedDate), [selectedDate]);

  // 포커스가 변경될 때만 호출되는 별도의 이펙트
  useEffect(() => {
    const unsubscribeFocus = navigation.addListener("focus", () => {
      // 화면에 포커스가 오면 항상 최신 데이터를 로드
      loadHabits();
      loadCategories();
    });

    return unsubscribeFocus;
  }, [navigation, loadHabits, loadCategories]);

  // 초기 로드 및 포커스 이벤트 리스너 추가
  useEffect(() => {
    loadHabits();
    loadCategories();
  }, [loadHabits, loadCategories]);

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

  // 습관 아이템 렌더링 함수
  const renderHabitItem = ({ item }: { item: Habit & { isCompleted: boolean } }) => {
    // 해당 습관의 카테고리 찾기
    const category = findCategory(item.categoryId);

    return (
      <TouchableOpacity
        style={[styles.habitItem, { backgroundColor: theme.card }]}
        onPress={() => handleToggleHabit(item.id)}
        disabled={isUpdating}
        activeOpacity={0.7}
      >
        <View style={styles.habitInfo}>
          {category && (
            <View style={styles.categoryContainer}>
              <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                <Ionicons name={category.icon as any} size={12} color="white" />
              </View>
              <Text style={[styles.categoryName, { color: category.color }]}>{category.name}</Text>
            </View>
          )}
          <Text style={[styles.habitTitle, { color: theme.text }]}>{item.title}</Text>
          {item.description ? (
            <Text style={[styles.habitDescription, { color: theme.textSecondary }]}>{item.description}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={[
            styles.checkButton,
            item.isCompleted
              ? [styles.checkedButton, { backgroundColor: theme.success }]
              : [styles.uncheckedButton, { borderColor: theme.divider }],
          ]}
          onPress={() => handleToggleHabit(item.id)}
          disabled={isUpdating}
          activeOpacity={0.7}
        >
          {item.isCompleted && <Ionicons name="checkmark" size={20} color="white" />}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // 빈 목록일 때 렌더링 함수
  const renderEmptyComponent = () => (
    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>이 날에 등록된 습관이 없습니다.</Text>
  );

  // 목록의 푸터 컴포넌트 (마지막 아이템과 탭 사이 공간 제거)
  const renderFooter = () => <View style={{ height: 1 }} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          key={`calendar-container-${themeMode}`}
          style={[styles.calendarContainer, { backgroundColor: mode === "dark" ? theme.card : "#FFFFFF" }]}
        >
          <Calendar
            current={selectedDate.split("T")[0]}
            markingType="multi-dot"
            markedDates={markedDates}
            onDayPress={handleDateSelect}
            maxDate={getTodayISOString().split("T")[0]} // 오늘 이후 날짜 비활성화
            theme={{
              // 배경색상을 테마에 따라 명시적으로 설정
              backgroundColor: mode === "dark" ? theme.card : "#FFFFFF",
              calendarBackground: mode === "dark" ? theme.card : "#FFFFFF",

              // 텍스트 색상
              textSectionTitleColor: theme.textSecondary,
              textSectionTitleDisabledColor: theme.textDisabled,
              selectedDayBackgroundColor: theme.primary,
              selectedDayTextColor: "#ffffff",
              todayTextColor: theme.primary,
              dayTextColor: theme.text,
              textDisabledColor: theme.textDisabled,

              // 점 색상
              dotColor: theme.primary,
              selectedDotColor: "#ffffff",

              // 화살표 색상
              arrowColor: theme.primary,
              disabledArrowColor: theme.textDisabled,

              // 글꼴 설정
              textDayFontFamily: "System",
              textMonthFontFamily: "System",
              textDayHeaderFontFamily: "System",
              textDayFontWeight: "400",
              textMonthFontWeight: "bold",
              textDayHeaderFontWeight: "400",

              // 추가적인 테마 속성 적용
              todayBackgroundColor: mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
              agendaDayTextColor: theme.text,
              agendaDayNumColor: theme.text,
              agendaTodayColor: theme.primary,

              // 헤더 스타일시트
              "stylesheet.calendar.header": {
                header: {
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingLeft: 10,
                  paddingRight: 10,
                  marginTop: 6,
                  alignItems: "center",
                  backgroundColor: mode === "dark" ? theme.card : "#FFFFFF",
                },
                monthText: {
                  fontSize: 18,
                  fontWeight: "bold",
                  color: theme.text,
                },
                week: {
                  marginTop: 5,
                  flexDirection: "row",
                  justifyContent: "space-around",
                  backgroundColor: mode === "dark" ? theme.card : "#FFFFFF",
                  borderBottomWidth: 1,
                  borderBottomColor: theme.divider,
                  paddingBottom: 5,
                },
                dayHeader: {
                  marginTop: 2,
                  marginBottom: 2,
                  width: 32,
                  textAlign: "center",
                  fontSize: 13,
                  color: theme.textSecondary,
                },
              },

              // 기본 스타일시트
              "stylesheet.day.basic": {
                base: {
                  width: 32,
                  height: 32,
                  alignItems: "center",
                  backgroundColor: mode === "dark" ? theme.card : "#FFFFFF",
                },
                text: {
                  color: theme.text,
                  marginTop: 4,
                  fontSize: 16,
                  fontWeight: "400",
                  backgroundColor: "transparent",
                },
              },
            }}
          />
        </View>

        <View style={[styles.summaryContainer, { borderBottomColor: theme.divider }]}>
          <Text style={[styles.dateTitle, { color: theme.text }]}>{formattedDate}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>전체 습관</Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>{summary.total}개</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>완료 습관</Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>{summary.completed}개</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>완료율</Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>{summary.rate}%</Text>
            </View>
          </View>
        </View>

        <View style={styles.habitsHeaderContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>이 날의 습관</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            습관을 탭하여 완료 상태를 변경할 수 있습니다
          </Text>
        </View>

        <View style={styles.habitsListContainer}>
          {dateHabits.length > 0
            ? dateHabits.map((item) => <React.Fragment key={item.id}>{renderHabitItem({ item })}</React.Fragment>)
            : renderEmptyComponent()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  calendarContainer: {
    paddingBottom: 8,
  },
  summaryContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
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
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  habitsHeaderContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontStyle: "italic",
  },
  habitsListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  habitInfo: {
    flex: 1,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  categoryIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: "500",
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  habitDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  checkedButton: {
    // backgroundColor는 동적으로 설정됨
  },
  uncheckedButton: {
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  emptyText: {
    textAlign: "center",
    padding: 24,
    fontSize: 16,
  },
});
