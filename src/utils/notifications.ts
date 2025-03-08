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
  try {
    // 시뮬레이터나 개발 환경에서도 알림 테스트가 가능하도록 수정
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // 권한이 없으면 요청
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // 권한이 거부되면 알림을 보낼 수 없음
    if (finalStatus !== "granted") {
      console.log("알림 권한이 거부되었습니다.");
      return;
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

    return "LOCAL_NOTIFICATION_TOKEN";
  } catch (error) {
    console.log("알림 권한 요청 중 오류 발생:", error);
    return;
  }
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
    // 현재 시간 기준 + 최소 2초 이후로 설정 (즉시 알림 방지)
    const now = new Date();
    console.log(`[${habit.title}] 알림 스케줄링 시작 - 현재 시각: ${now.toLocaleString()}`);
    const minDelay = 2 * 1000; // 최소 2초 딜레이로 변경 (1분에서 2초로 줄임)

    // 특정 요일에만 알림 설정
    if (options.weekdays && options.weekdays.length > 0) {
      console.log(
        `[${habit.title}] 지정 요일 알림 설정: ${options.weekdays.join(", ")} - ${options.hour}:${options.minute}`
      );

      for (const weekday of options.weekdays) {
        const notificationId = getNotificationId(habit.id, weekday);

        // 다음 해당 요일 찾기
        const targetDate = new Date();
        const currentDay = now.getDay(); // 0: 일요일, 1: 월요일, ...
        console.log(`[${habit.title}] 현재 요일: ${currentDay}, 설정 요일: ${weekday}`);

        // NotificationScheduleOptions의 요일(1~7)을 JavaScript Date.getDay()의 요일(0~6)로 변환
        // 1(월요일) -> 1, 2(화요일) -> 2, ..., 6(토요일) -> 6, 7(일요일) -> 0
        const targetWeekday = weekday === 7 ? 0 : weekday;

        // 현재 요일이 목표 요일과 같은지 직접 비교
        if (currentDay === targetWeekday) {
          // 목표 시간 설정
          const todayTargetTime = new Date();
          todayTargetTime.setHours(options.hour, options.minute, 0, 0);

          // 현재 시간(+최소 지연)이 목표 시간보다 이후인지 비교
          if (now.getTime() + minDelay > todayTargetTime.getTime()) {
            // 다음 주로 설정 (7일 추가)
            targetDate.setDate(targetDate.getDate() + 7);
            console.log(
              `[${habit.title}] 오늘 ${options.hour}:${options.minute}은 이미 지난 시간이므로 다음 주 ${weekday}요일로 설정`
            );
          } else {
            // 오늘로 설정
            console.log(`[${habit.title}] 오늘 ${options.hour}:${options.minute}에 알림 설정`);
          }
        } else {
          // 현재 요일과 목표 요일 사이의 차이 계산
          // JavaScript Date.getDay()의 요일(0~6) 기준으로 계산
          let daysUntilTarget = (targetWeekday - currentDay + 7) % 7;
          targetDate.setDate(targetDate.getDate() + daysUntilTarget);
          console.log(`[${habit.title}] ${daysUntilTarget}일 후 ${weekday}요일에 알림 설정`);
        }

        // 날짜에 시간 설정
        targetDate.setHours(options.hour, options.minute, 0, 0);

        console.log(`[${habit.title}] 알림 예약 완료: ${targetDate.toLocaleString()}, 요일: ${weekday}`);

        // 시간 간격 기반으로 스케줄링
        const secondsUntilTrigger = Math.max(2, Math.floor((targetDate.getTime() - now.getTime()) / 1000));
        const notificationIdentifier = await Notifications.scheduleNotificationAsync({
          content: {
            title: `${habit.title} 할 시간입니다!`,
            body: habit.description || "습관을 실천하고 성장하세요.",
            data: { habitId: habit.id, weekday: weekday },
          },
          trigger: {
            type: "timeInterval",
            seconds: secondsUntilTrigger, // 최소 2초 후에 발송
          } as any,
          identifier: notificationId,
        });

        console.log(`[${habit.title}] 알림 ID: ${notificationIdentifier}, ${secondsUntilTrigger}초 후 발송`);
        scheduledIds.push(notificationId);
      }
    } else {
      // 매일 알림
      console.log(`[${habit.title}] 매일 알림 설정: ${options.hour}:${options.minute}`);
      const notificationId = getNotificationId(habit.id);

      // 다음 알림 시간 계산
      const targetDate = new Date();
      targetDate.setHours(options.hour, options.minute, 0, 0);

      // 현재 시간이 설정 시간보다 이후인 경우에만 내일로 설정
      if (now.getTime() + minDelay > targetDate.getTime()) {
        console.log(`[${habit.title}] 오늘 ${options.hour}:${options.minute}은 이미 지난 시간이므로 내일로 설정`);
        targetDate.setDate(targetDate.getDate() + 1);
      } else {
        console.log(`[${habit.title}] 오늘 ${options.hour}:${options.minute}에 알림 설정`);
      }

      console.log(`[${habit.title}] 알림 예약 완료: ${targetDate.toLocaleString()}, 매일 반복`);

      // 시간 간격 기반으로 스케줄링
      const secondsUntilTrigger = Math.max(2, Math.floor((targetDate.getTime() - now.getTime()) / 1000));
      const notificationIdentifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${habit.title} 할 시간입니다!`,
          body: habit.description || "습관을 실천하고 성장하세요.",
          data: { habitId: habit.id, daily: true },
        },
        trigger: {
          type: "timeInterval",
          seconds: secondsUntilTrigger, // 최소 2초 후에 발송
        } as any,
        identifier: notificationId,
      });

      console.log(`[${habit.title}] 알림 ID: ${notificationIdentifier}, ${secondsUntilTrigger}초 후 발송`);
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

// 테스트 알림 발송
export async function sendTestNotification(): Promise<string> {
  try {
    // 즉시 발송이 아닌 5초 후 발송으로 변경
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "테스트 알림",
        body: "알림이 정상적으로 작동합니다.",
        data: { test: true },
      },
      trigger: {
        type: "timeInterval",
        seconds: 5, // 5초 후 발송
      } as any,
      identifier: `test-${Date.now()}`,
    });

    console.log(`테스트 알림 스케줄링 완료: ${notificationId}, 5초 후 발송됩니다.`);
    return notificationId;
  } catch (error) {
    console.error("테스트 알림 발송 오류:", error);
    throw error;
  }
}
