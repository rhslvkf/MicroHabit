import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { Habit } from "../types";

// 알림 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 알림 권한 요청
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  // Expo Go 앱 또는 실제 디바이스에서만 알림 권한 요청
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // 권한이 없으면 요청
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // 권한이 거부되면 알림을 보낼 수 없음
    if (finalStatus !== "granted") {
      alert("알림 권한이 없어 습관 알림을 보낼 수 없습니다.");
      return;
    }

    // Expo 푸시 알림 토큰 가져오기
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: "1234567890", // 실제 프로젝트에서는 app.json의 projectId로 변경
      })
    ).data;
  } else {
    console.log("실제 디바이스가 아니므로 알림을 보낼 수 없습니다.");
  }

  // Android 채널 설정
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "기본 알림",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF5757",
    });
  }

  return token;
}

// 습관에 대한 알림 스케줄링
interface NotificationScheduleOptions {
  hour: number;
  minute: number;
  repeats: boolean;
  weekdays?: number[]; // 1: 월요일, 2: 화요일, ... 7: 일요일
}

// 알림 ID는 습관 ID + 요일로 구성 (습관 ID당 최대 7개의 알림)
export const getNotificationId = (habitId: string, weekday?: number): string => {
  return weekday ? `${habitId}-${weekday}` : habitId;
};

// 알림 스케줄링
export async function scheduleHabitNotification(habit: Habit, options: NotificationScheduleOptions): Promise<string[]> {
  // 이전 알림 취소
  await cancelHabitNotifications(habit.id);

  const scheduledIds: string[] = [];

  try {
    // 특정 요일에만 알림 설정
    if (options.weekdays && options.weekdays.length > 0) {
      for (const weekday of options.weekdays) {
        const notificationId = getNotificationId(habit.id, weekday);

        // 다음 해당 요일 찾기
        const now = new Date();
        const targetDate = new Date();
        const currentDay = now.getDay(); // 0: 일요일, 1: 월요일, ...
        const targetWeekday = weekday === 7 ? 0 : weekday; // 요일 변환 (7 -> 0: 일요일)
        const daysUntilTarget = (targetWeekday - currentDay + 7) % 7;

        targetDate.setDate(now.getDate() + daysUntilTarget);
        targetDate.setHours(options.hour);
        targetDate.setMinutes(options.minute);
        targetDate.setSeconds(0);
        targetDate.setMilliseconds(0);

        if (targetDate.getTime() <= now.getTime() && daysUntilTarget === 0) {
          // 같은 요일이고 이미 지난 시간이면 다음 주로 설정
          targetDate.setDate(targetDate.getDate() + 7);
        }

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "습관 알림",
            body: `${habit.title} 할 시간입니다!`,
            data: { habitId: habit.id },
          },
          trigger: options.repeats
            ? ({
                hour: options.hour,
                minute: options.minute,
                weekday: targetWeekday,
                repeats: true,
              } as any)
            : targetDate,
          identifier: notificationId,
        });

        scheduledIds.push(notificationId);
      }
    } else {
      // 매일 알림
      const notificationId = getNotificationId(habit.id);

      // 오늘 날짜로 계산
      const now = new Date();
      const targetDate = new Date();
      targetDate.setHours(options.hour);
      targetDate.setMinutes(options.minute);
      targetDate.setSeconds(0);
      targetDate.setMilliseconds(0);

      // 이미 지난 시간이면 다음 날로 설정
      if (targetDate.getTime() <= now.getTime()) {
        targetDate.setDate(targetDate.getDate() + 1);
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "습관 알림",
          body: `${habit.title} 할 시간입니다!`,
          data: { habitId: habit.id },
        },
        trigger: options.repeats
          ? ({
              hour: options.hour,
              minute: options.minute,
              repeats: true,
            } as any)
          : targetDate,
        identifier: notificationId,
      });

      scheduledIds.push(notificationId);
    }

    return scheduledIds;
  } catch (error) {
    console.error("알림 스케줄링 오류:", error);
    return [];
  }
}

// 습관에 대한 모든 알림 취소
export async function cancelHabitNotifications(habitId: string): Promise<void> {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const habitNotifications = scheduledNotifications.filter((notification) =>
      notification.identifier.startsWith(`${habitId}`)
    );

    for (const notification of habitNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  } catch (error) {
    console.error("알림 취소 오류:", error);
  }
}

// 모든 알림 취소
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("모든 알림 취소 오류:", error);
  }
}

// 예약된 모든 알림 가져오기
export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("예약된 알림 가져오기 오류:", error);
    return [];
  }
}

// 특정 습관의 예약된 알림 가져오기
export async function getHabitScheduledNotifications(habitId: string): Promise<Notifications.NotificationRequest[]> {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    return scheduledNotifications.filter((notification) => notification.identifier.startsWith(`${habitId}`));
  } catch (error) {
    console.error("습관 알림 가져오기 오류:", error);
    return [];
  }
}
