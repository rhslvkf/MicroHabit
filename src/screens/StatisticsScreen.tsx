import React, { useState, useEffect, useCallback, useMemo } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, MainTabParamList } from "../navigation/types";
import { LineChart, BarChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../themes/ThemeContext";
import { getHabits, getCategories } from "../utils/storage";
import {
  calculateDailyCompletionRates,
  calculateHabitCompletionRates,
  calculateWeeklyStats,
  calculateWeeklyTrend,
  calculateCategoryCompletionRates,
} from "../utils/statistics";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Statistics">,
  NativeStackScreenProps<RootStackParamList>
>;

export function StatisticsScreen({ navigation }: Props): React.ReactElement {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [dailyRates, setDailyRates] = useState<
    { date: string; formattedDate: string; shortDate: string; rate: number }[]
  >([]);
  const [habitRates, setHabitRates] = useState<{ id: string; title: string; completionRate: number; streak: number }[]>(
    []
  );
  const [weeklyStats, setWeeklyStats] = useState<{ totalCompletions: number; completionRate: number; bestDay: any }>({
    totalCompletions: 0,
    completionRate: 0,
    bestDay: { formattedDate: "", completions: 0 },
  });
  const [weeklyTrend, setWeeklyTrend] = useState<{ week: string; rate: number }[]>([]);
  const [categoryStats, setCategoryStats] = useState<{ category: any; completionRate: number; habitCount: number }[]>(
    []
  );
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "habits" | "categories">("daily");
  const screenWidth = Dimensions.get("window").width;

  const loadStatistics = useCallback(async () => {
    setIsLoading(true);
    try {
      const habits = await getHabits();
      const categories = await getCategories();

      if (habits.length > 0) {
        setDailyRates(calculateDailyCompletionRates(habits));
        setHabitRates(calculateHabitCompletionRates(habits));
        setWeeklyStats(calculateWeeklyStats(habits));
        setWeeklyTrend(calculateWeeklyTrend(habits));
        setCategoryStats(calculateCategoryCompletionRates(habits, categories));
      }
    } catch (error) {
      console.error("통계 데이터 로드 오류:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatistics();

    // 화면에 포커스가 올 때마다 통계 다시 로드
    const unsubscribe = navigation.addListener("focus", loadStatistics);
    return unsubscribe;
  }, [navigation, loadStatistics]);

  // 일별 완료율 차트 데이터
  const dailyChartData = {
    labels: dailyRates.map((item) => item.formattedDate),
    datasets: [
      {
        data: dailyRates.map((item) => item.rate),
        color: (opacity = 1) => theme.primary,
        strokeWidth: 2,
      },
    ],
    legend: ["일별 완료율(%)"],
  };

  // 주간 추세 차트 데이터
  const weeklyChartData = {
    labels: weeklyTrend.map((item) => item.week),
    datasets: [
      {
        data: weeklyTrend.map((item) => item.rate),
        color: (opacity = 1) => theme.accent,
      },
    ],
  };

  // 탭 전환 핸들러
  const handleTabChange = (tab: "daily" | "weekly" | "habits" | "categories") => {
    setActiveTab(tab);
  };

  // 습관 선택 핸들러 - 해당 습관의 상세 정보 화면으로 이동
  const handleHabitSelect = (habitId: string) => {
    // 여기에 습관 상세 화면으로 이동하는 로직 추가
    console.log(`Selected habit: ${habitId}`);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>통계 데이터를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top"]}>
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>습관 통계</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "daily" && [styles.activeTab, { backgroundColor: theme.primary }]]}
          onPress={() => handleTabChange("daily")}
        >
          <Text style={[styles.tabText, { color: activeTab === "daily" ? "white" : theme.textSecondary }]}>일별</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "weekly" && [styles.activeTab, { backgroundColor: theme.primary }]]}
          onPress={() => handleTabChange("weekly")}
        >
          <Text style={[styles.tabText, { color: activeTab === "weekly" ? "white" : theme.textSecondary }]}>주간</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "habits" && [styles.activeTab, { backgroundColor: theme.primary }]]}
          onPress={() => handleTabChange("habits")}
        >
          <Text style={[styles.tabText, { color: activeTab === "habits" ? "white" : theme.textSecondary }]}>
            습관별
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "categories" && [styles.activeTab, { backgroundColor: theme.primary }]]}
          onPress={() => handleTabChange("categories")}
        >
          <Text style={[styles.tabText, { color: activeTab === "categories" ? "white" : theme.textSecondary }]}>
            카테고리
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {activeTab === "daily" && (
          <View style={styles.chartSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>최근 7일 완료율</Text>
            {dailyRates.length > 0 ? (
              <LineChart
                data={dailyChartData}
                width={screenWidth - 40}
                height={220}
                chartConfig={{
                  backgroundColor: theme.card,
                  backgroundGradientFrom: theme.card,
                  backgroundGradientTo: theme.card,
                  decimalPlaces: 0,
                  color: (opacity = 1) => theme.text,
                  labelColor: (opacity = 1) => theme.textSecondary,
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: theme.primary,
                  },
                }}
                bezier
                style={{
                  borderRadius: 16,
                  padding: 10,
                  marginVertical: 8,
                  backgroundColor: theme.card,
                }}
              />
            ) : (
              <View style={[styles.emptyChart, { backgroundColor: theme.card }]}>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>표시할 데이터가 없습니다</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === "weekly" && (
          <View style={styles.chartSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>주간 완료율 추세</Text>

            {weeklyTrend.length > 0 ? (
              <BarChart
                data={weeklyChartData}
                width={screenWidth - 40}
                height={220}
                yAxisLabel=""
                yAxisSuffix="%"
                chartConfig={{
                  backgroundColor: theme.card,
                  backgroundGradientFrom: theme.card,
                  backgroundGradientTo: theme.card,
                  decimalPlaces: 0,
                  color: (opacity = 1) => theme.accent,
                  labelColor: (opacity = 1) => theme.textSecondary,
                  barPercentage: 0.6,
                }}
                style={{
                  borderRadius: 16,
                  padding: 10,
                  marginVertical: 8,
                  backgroundColor: theme.card,
                }}
              />
            ) : (
              <View style={[styles.emptyChart, { backgroundColor: theme.card }]}>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>표시할 데이터가 없습니다</Text>
              </View>
            )}

            <View style={[styles.statCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.statTitle, { color: theme.text }]}>이번 주 통계</Text>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>완료한 습관</Text>
                  <Text style={[styles.statValue, { color: theme.text }]}>{weeklyStats.totalCompletions}회</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>완료율</Text>
                  <Text style={[styles.statValue, { color: theme.text }]}>{weeklyStats.completionRate}%</Text>
                </View>
              </View>
              <View style={styles.bestDayContainer}>
                <Text style={[styles.bestDayLabel, { color: theme.textSecondary }]}>가장 많이 완료한 날:</Text>
                <Text style={[styles.bestDayValue, { color: theme.text }]}>
                  {weeklyStats.bestDay.formattedDate} ({weeklyStats.bestDay.completions}회)
                </Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === "habits" && (
          <View style={styles.chartSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>습관별 완료율 (최근 30일)</Text>

            {habitRates.length > 0 ? (
              <View style={styles.habitList}>
                {habitRates.map((habit, index) => (
                  <TouchableOpacity
                    key={habit.id}
                    style={[styles.habitItem, { backgroundColor: theme.card }]}
                    onPress={() => handleHabitSelect(habit.id)}
                  >
                    <View style={styles.habitInfo}>
                      <Text style={[styles.habitTitle, { color: theme.text }]}>
                        {index + 1}. {habit.title}
                      </Text>
                      <View style={styles.habitStats}>
                        <View style={styles.habitStat}>
                          <Text style={[styles.habitStatLabel, { color: theme.textSecondary }]}>완료율</Text>
                          <Text style={[styles.habitStatValue, { color: theme.text }]}>{habit.completionRate}%</Text>
                        </View>
                        <View style={styles.habitStat}>
                          <Text style={[styles.habitStatLabel, { color: theme.textSecondary }]}>연속 달성일</Text>
                          <Text style={[styles.habitStatValue, { color: theme.text }]}>{habit.streak}일</Text>
                        </View>
                      </View>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: theme.divider }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            backgroundColor: theme.primary,
                            width: `${habit.completionRate}%`,
                          },
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={[styles.emptyChart, { backgroundColor: theme.card }]}>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>표시할 데이터가 없습니다</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === "categories" && (
          <View style={styles.chartSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>카테고리별 완료율 (최근 30일)</Text>

            {categoryStats.length > 0 ? (
              <View style={styles.habitList}>
                {categoryStats.map((stat, index) => (
                  <View key={stat.category.id} style={[styles.habitItem, { backgroundColor: theme.card }]}>
                    <View style={styles.habitInfo}>
                      <View style={styles.categoryHeader}>
                        <View style={[styles.categoryIcon, { backgroundColor: stat.category.color }]}>
                          <Ionicons name={stat.category.icon as any} size={18} color="white" />
                        </View>
                        <Text style={[styles.habitTitle, { color: theme.text }]}>
                          {index + 1}. {stat.category.name}
                        </Text>
                      </View>
                      <View style={styles.habitStats}>
                        <View style={styles.habitStat}>
                          <Text style={[styles.habitStatLabel, { color: theme.textSecondary }]}>완료율</Text>
                          <Text style={[styles.habitStatValue, { color: theme.text }]}>{stat.completionRate}%</Text>
                        </View>
                        <View style={styles.habitStat}>
                          <Text style={[styles.habitStatLabel, { color: theme.textSecondary }]}>습관 수</Text>
                          <Text style={[styles.habitStatValue, { color: theme.text }]}>{stat.habitCount}개</Text>
                        </View>
                      </View>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: theme.divider }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            backgroundColor: stat.category.color,
                            width: `${stat.completionRate}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.emptyChart, { backgroundColor: theme.card }]}>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>표시할 데이터가 없습니다</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  tabContainer: {
    flexDirection: "row",
    padding: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 20,
    marginHorizontal: 4,
  },
  activeTab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  chartSection: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  chart: {
    borderRadius: 16,
    padding: 10,
    marginVertical: 8,
  },
  emptyChart: {
    height: 220,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 8,
  },
  emptyText: {
    fontSize: 16,
  },
  statCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  bestDayContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  bestDayLabel: {
    fontSize: 14,
    marginRight: 4,
  },
  bestDayValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  habitList: {
    marginTop: 4,
  },
  habitItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  habitInfo: {
    marginBottom: 12,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  habitStats: {
    flexDirection: "row",
  },
  habitStat: {
    marginRight: 24,
  },
  habitStatLabel: {
    fontSize: 12,
  },
  habitStatValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
});
