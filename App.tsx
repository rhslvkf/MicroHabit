import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { ThemeProvider, useTheme } from "./src/themes/ThemeContext";
import { registerForPushNotificationsAsync, cancelAllNotifications } from "./src/utils/notifications";
import { rescheduleAllHabitNotifications } from "./src/utils/storage";
import * as Notifications from "expo-notifications";

// StatusBar를 테마에 맞게 설정하는 컴포넌트
function ThemedStatusBar() {
  const { mode } = useTheme();
  return <StatusBar style={mode === "dark" ? "light" : "dark"} />;
}

// 앱 내용을 감싸는 컴포넌트
const AppContent = () => {
  // 알림 초기화
  useEffect(() => {
    // 알림 초기화 및 필요한 경우만 재설정
    async function initNotifications() {
      try {
        // 알림 권한 요청
        const token = await registerForPushNotificationsAsync();

        if (token) {
          console.log("알림 권한 획득");

          // 이미 스케줄된 알림이 있는지 확인
          const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

          // 스케줄된 알림이 없는 경우에만 재설정
          if (scheduledNotifications.length === 0) {
            console.log("스케줄된 알림이 없어 알림 재설정 시작");
            await rescheduleAllHabitNotifications();
          } else {
            console.log(`이미 ${scheduledNotifications.length}개의 알림이 스케줄되어 있어 재설정 건너뜀`);
          }
        } else {
          console.log("알림 권한 없음");
        }
      } catch (error) {
        console.error("알림 초기화 오류:", error);
      }
    }

    initNotifications();

    // 알림 수신 리스너
    const notificationReceivedListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log("알림 수신:", notification);
    });

    // 알림 응답 리스너
    const notificationResponseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("알림 응답:", response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationReceivedListener);
      Notifications.removeNotificationSubscription(notificationResponseListener);
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ThemedStatusBar />
      <AppNavigator />
    </SafeAreaProvider>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
