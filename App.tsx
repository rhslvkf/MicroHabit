import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { ThemeProvider, useTheme } from "./src/themes/ThemeContext";
import { registerForPushNotificationsAsync, cancelAllNotifications } from "./src/utils/notifications";
import { rescheduleAllHabitNotifications } from "./src/utils/storage";
import * as Notifications from "expo-notifications";
import { initializeAds, preloadRewardAd } from "./src/utils/ads";

// StatusBar를 테마에 맞게 설정하는 컴포넌트
function ThemedStatusBar() {
  const { mode } = useTheme();
  return <StatusBar style={mode === "dark" ? "light" : "dark"} />;
}

// 앱 내용을 감싸는 컴포넌트
const AppContent = () => {
  // 알림 및 광고 초기화
  useEffect(() => {
    // 알림 초기화 및 필요한 경우만 재설정
    async function initNotifications() {
      try {
        console.log("알림 초기화 시작...");

        // 알림 권한 요청
        const token = await registerForPushNotificationsAsync();

        if (token) {
          console.log("알림 권한 획득됨");

          // 기존에 예약된 알림 로깅
          try {
            const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
            console.log(`현재 스케줄된 알림 ${existingNotifications.length}개 확인됨`);

            if (existingNotifications.length > 0) {
              existingNotifications.forEach((notification, index) => {
                console.log(`기존 알림 ${index + 1}: ID=${notification.identifier}`);
              });
            }
          } catch (checkError) {
            console.error("기존 알림 확인 중 오류:", checkError);
          }

          // 알림 초기화 시 무조건 재설정하도록 변경
          console.log("알림 전체 재설정 시작");
          await rescheduleAllHabitNotifications();

          // 재설정 후 알림 상태 로깅
          try {
            const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
            console.log(`알림 재설정 완료: ${scheduledNotifications.length}개 알림 예약됨`);
          } catch (logError) {
            console.error("알림 재설정 후 로깅 중 오류:", logError);
          }
        } else {
          console.log("알림 권한 없음 - 사용자가 거부했거나 권한을 설정하지 않음");
        }
      } catch (error) {
        console.error("알림 초기화 오류:", error);
      }
    }

    // 광고 SDK 초기화
    async function initAdsSdk() {
      try {
        const initialized = await initializeAds();
        if (initialized) {
          // 리워드 광고 미리 로드
          await preloadRewardAd();
        }
      } catch (error) {
        console.error("광고 초기화 오류:", error);
      }
    }

    initNotifications();
    initAdsSdk();

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
