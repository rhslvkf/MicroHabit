import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { ThemeProvider, useTheme } from "./src/themes/ThemeContext";
import { registerForPushNotificationsAsync } from "./src/utils/notifications";
import { rescheduleAllHabitNotifications } from "./src/utils/storage";
import * as Notifications from "expo-notifications";

// StatusBar를 테마에 맞게 설정하는 컴포넌트
function ThemedStatusBar() {
  const { mode } = useTheme();
  return <StatusBar style={mode === "dark" ? "light" : "dark"} />;
}

// 앱 내용을 감싸는 컴포넌트
function AppContent() {
  // 앱 시작 시 알림 초기화
  useEffect(() => {
    const initNotifications = async () => {
      try {
        // 알림 권한 요청
        await registerForPushNotificationsAsync();

        // 기존 알림 다시 예약
        await rescheduleAllHabitNotifications();

        // 알림 클릭 이벤트 핸들러
        const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
          console.log("알림 수신:", notification);
        });

        const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
          const habitId = response.notification.request.content.data.habitId;
          console.log("알림 응답:", habitId);
          // 여기서 필요한 경우 특정 화면으로 이동하거나 액션을 수행할 수 있음
        });

        return () => {
          Notifications.removeNotificationSubscription(notificationListener);
          Notifications.removeNotificationSubscription(responseListener);
        };
      } catch (error) {
        console.error("알림 초기화 오류:", error);
      }
    };

    initNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemedStatusBar />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
