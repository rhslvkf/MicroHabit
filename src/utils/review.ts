import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Linking, Platform } from "react-native";
import * as StoreReview from "expo-store-review";

// 저장소 키
const HABIT_COMPLETION_COUNT_KEY = "@MicroHabit:habitCompletionCount";
const HAS_RATED_KEY = "@MicroHabit:hasRated";
const LAST_REVIEW_PROMPT_DATE_KEY = "@MicroHabit:lastReviewPromptDate";

// 리뷰 요청 기준 값
const REVIEW_THRESHOLD = 5; // 5회 완료마다 리뷰 요청
const MIN_DAYS_BETWEEN_PROMPTS = 7; // 일주일에 한 번만 리뷰 요청

// 앱 스토어 URL
const APP_STORE_ID = "여기에_앱스토어_ID_입력"; // 실제 배포 시 변경 필요
const PLAY_STORE_ID = "com.fullmoon.MicroHabit"; // 실제 패키지 명으로 변경 필요

/**
 * 습관 완료 횟수를 가져옵니다.
 */
export const getHabitCompletionCount = async (): Promise<number> => {
  try {
    const countString = await AsyncStorage.getItem(HABIT_COMPLETION_COUNT_KEY);
    return countString ? parseInt(countString, 10) : 0;
  } catch (error) {
    console.error("습관 완료 횟수 가져오기 중 오류:", error);
    return 0;
  }
};

/**
 * 습관 완료 횟수를 증가시킵니다.
 */
export const incrementHabitCompletionCount = async (): Promise<number> => {
  try {
    const currentCount = await getHabitCompletionCount();
    const newCount = currentCount + 1;
    await AsyncStorage.setItem(HABIT_COMPLETION_COUNT_KEY, newCount.toString());
    return newCount;
  } catch (error) {
    console.error("습관 완료 횟수 증가 중 오류:", error);
    return 0;
  }
};

/**
 * 사용자가 이미 리뷰를 작성했는지 확인합니다.
 */
export const hasUserRated = async (): Promise<boolean> => {
  try {
    const hasRated = await AsyncStorage.getItem(HAS_RATED_KEY);
    return hasRated === "true";
  } catch (error) {
    console.error("사용자 리뷰 상태 확인 중 오류:", error);
    return false;
  }
};

/**
 * 사용자가 리뷰를 작성했음을 저장합니다.
 */
export const markUserAsRated = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(HAS_RATED_KEY, "true");
  } catch (error) {
    console.error("사용자 리뷰 상태 저장 중 오류:", error);
  }
};

/**
 * 마지막 리뷰 요청 날짜를 가져옵니다.
 */
export const getLastReviewPromptDate = async (): Promise<Date | null> => {
  try {
    const dateString = await AsyncStorage.getItem(LAST_REVIEW_PROMPT_DATE_KEY);
    return dateString ? new Date(dateString) : null;
  } catch (error) {
    console.error("마지막 리뷰 요청 날짜 가져오기 중 오류:", error);
    return null;
  }
};

/**
 * 마지막 리뷰 요청 날짜를 저장합니다.
 */
export const saveLastReviewPromptDate = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(LAST_REVIEW_PROMPT_DATE_KEY, new Date().toISOString());
  } catch (error) {
    console.error("마지막 리뷰 요청 날짜 저장 중 오류:", error);
  }
};

/**
 * 리뷰를 요청할 수 있는지 확인합니다.
 * 1. 아직 리뷰를 작성하지 않았어야 함
 * 2. 마지막 요청 이후 MIN_DAYS_BETWEEN_PROMPTS일이 지났어야 함
 */
export const canPromptForReview = async (): Promise<boolean> => {
  // 이미 리뷰를 작성했으면 더 이상 요청하지 않음
  const rated = await hasUserRated();
  if (rated) return false;

  // 마지막 요청 이후 충분한 시간이 지났는지 확인
  const lastPrompt = await getLastReviewPromptDate();
  if (lastPrompt) {
    const daysSinceLastPrompt = (new Date().getTime() - lastPrompt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastPrompt < MIN_DAYS_BETWEEN_PROMPTS) return false;
  }

  return true;
};

/**
 * 앱 스토어로 이동하여 리뷰를 작성할 수 있게 합니다.
 */
export const openAppStoreForReview = async (): Promise<void> => {
  // 플랫폼에 따라 다른 URL 사용
  const storeUrl = Platform.select({
    ios: `https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`,
    android: `https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}&showAllReviews=true`,
    default: "",
  });

  if (storeUrl) {
    try {
      const canOpen = await Linking.canOpenURL(storeUrl);
      if (canOpen) {
        await Linking.openURL(storeUrl);
        await markUserAsRated(); // 스토어로 이동했으면 리뷰를 작성한 것으로 간주
      }
    } catch (error) {
      console.error("앱 스토어 열기 중 오류:", error);
    }
  }
};

/**
 * 리뷰 작성 요청 알림을 표시합니다.
 */
export const promptForReview = async (): Promise<void> => {
  // 스토어 ID가 유효하지 않으면 리뷰 요청 건너뛰기
  if (APP_STORE_ID === "여기에_앱스토어_ID_입력") {
    console.log("유효한 스토어 ID가 없어 리뷰 요청을 건너뜁니다.");
    return;
  }

  // 리뷰 요청 가능 여부 확인
  const canPrompt = await canPromptForReview();
  if (!canPrompt) return;

  // 마지막 요청 날짜 업데이트
  await saveLastReviewPromptDate();

  // 플랫폼에 따라 다른 방식으로 리뷰 요청
  if (Platform.OS === "ios" && StoreReview.isAvailableAsync()) {
    // iOS의 경우 시스템 리뷰 다이얼로그 사용
    try {
      await StoreReview.requestReview();
      // iOS에서는 requestReview 호출 후 사용자가 실제로 리뷰를 작성했는지 알 수 없음
      // 하지만 요청했다는 사실만으로도 충분히 유의미하므로 플래그 업데이트
      await markUserAsRated();
    } catch (error) {
      // 시스템 리뷰 다이얼로그가 실패하면 수동 다이얼로그로 폴백
      showManualReviewPrompt();
    }
  } else {
    // Android 또는 StoreReview를 사용할 수 없는 경우 수동 다이얼로그 표시
    showManualReviewPrompt();
  }
};

/**
 * 수동 리뷰 요청 알림을 표시합니다.
 */
const showManualReviewPrompt = (): void => {
  Alert.alert(
    "앱이 마음에 드시나요?",
    "마이크로 해빗을 사용해 보신 소감이 어떠신가요? 앱스토어에 리뷰를 남겨주시면 큰 힘이 됩니다!",
    [
      { text: "나중에", style: "cancel" },
      { text: "리뷰 작성하기", onPress: openAppStoreForReview },
    ],
    { cancelable: true }
  );
};

/**
 * 습관 완료 시 호출하여 카운트를 증가시키고 필요시 리뷰 요청
 */
export const trackHabitCompletion = async (): Promise<void> => {
  // 습관 완료 횟수 증가
  const count = await incrementHabitCompletionCount();

  // REVIEW_THRESHOLD의 배수일 때 리뷰 요청
  if (count % REVIEW_THRESHOLD === 0) {
    await promptForReview();
  }
};
