import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import mobileAds, {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  MaxAdContentRating,
} from "react-native-google-mobile-ads";

// 광고 유닛 ID (iOS 및 Android 플랫폼 별로 설정)
const rewardAdUnitId = Platform.select({
  ios: "ca-app-pub-8843457940870268/8353725634",
  android: "ca-app-pub-8843457940870268/4768632018",
  default: "",
});

// 테스트 ID
const testRewardAdUnitId = Platform.select({
  ios: "ca-app-pub-3940256099942544/1712485313",
  android: "ca-app-pub-3940256099942544/5224354917",
  default: "",
});

// 개발 모드에서는 테스트 ID를 사용합니다.
const REWARD_AD_UNIT_ID = __DEV__ ? testRewardAdUnitId : rewardAdUnitId;

// 광고 표시 관련 키
const LAST_AD_SHOWN_KEY = "@MicroHabit:lastAdShown";
const DAILY_AD_COUNT_KEY = "@MicroHabit:dailyAdCount";
const HABIT_ACTION_COUNT_KEY = "@MicroHabit:habitActionCount";

// 습관 추가/수정 액션 누적 카운트를 저장하는 키
const HABIT_ACTION_INTERVAL = 5; // 5회마다 광고 표시

// 마지막으로 광고를 표시한 시간을 저장합니다.
export const saveLastAdShownTime = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(LAST_AD_SHOWN_KEY, new Date().toISOString());
  } catch (error) {
    console.error("마지막 광고 시간 저장 중 오류 발생:", error);
  }
};

// 마지막으로 광고를 표시한 시간을 가져옵니다.
export const getLastAdShownTime = async (): Promise<Date | null> => {
  try {
    const lastShownTimeStr = await AsyncStorage.getItem(LAST_AD_SHOWN_KEY);
    if (!lastShownTimeStr) return null;
    return new Date(lastShownTimeStr);
  } catch (error) {
    console.error("마지막 광고 시간 가져오기 중 오류 발생:", error);
    return null;
  }
};

// 오늘의 광고 표시 횟수를 가져옵니다.
export const getDailyAdCount = async (): Promise<number> => {
  try {
    const todayKey = new Date().toISOString().split("T")[0];
    const dailyCountString = await AsyncStorage.getItem(`${DAILY_AD_COUNT_KEY}:${todayKey}`);
    return dailyCountString ? parseInt(dailyCountString, 10) : 0;
  } catch (error) {
    console.error("오늘의 광고 횟수 가져오기 중 오류 발생:", error);
    return 0;
  }
};

// 오늘의 광고 표시 횟수를 업데이트합니다.
export const updateDailyAdCount = async (): Promise<number> => {
  try {
    const todayKey = new Date().toISOString().split("T")[0];
    const currentCount = await getDailyAdCount();
    const newCount = currentCount + 1;
    await AsyncStorage.setItem(`${DAILY_AD_COUNT_KEY}:${todayKey}`, newCount.toString());
    return newCount;
  } catch (error) {
    console.error("오늘의 광고 횟수 업데이트 중 오류 발생:", error);
    return 0;
  }
};

// 습관 추가/수정 누적 카운트를 가져옵니다.
export const getHabitActionCount = async (): Promise<number> => {
  try {
    const countString = await AsyncStorage.getItem(HABIT_ACTION_COUNT_KEY);
    return countString ? parseInt(countString, 10) : 0;
  } catch (error) {
    console.error("습관 액션 카운트 가져오기 중 오류 발생:", error);
    return 0;
  }
};

// 습관 추가/수정 누적 카운트를 증가시킵니다.
export const incrementHabitActionCount = async (): Promise<number> => {
  try {
    const currentCount = await getHabitActionCount();
    const newCount = currentCount + 1;
    await AsyncStorage.setItem(HABIT_ACTION_COUNT_KEY, newCount.toString());
    return newCount;
  } catch (error) {
    console.error("습관 액션 카운트 업데이트 중 오류 발생:", error);
    return 0;
  }
};

// 습관 추가/수정 시 광고를 보여야 하는지 확인합니다.
export const shouldShowAdForHabitAction = async (): Promise<boolean> => {
  const currentCount = await getHabitActionCount();
  return currentCount > 0 && currentCount % HABIT_ACTION_INTERVAL === 0;
};

// 광고가 로드되었는지 확인합니다.
let rewardAdLoaded = false;
let rewardAd: RewardedAd | null = null;

// 광고 SDK를 초기화합니다.
export const initializeAds = async (): Promise<boolean> => {
  try {
    await mobileAds().initialize();

    // 광고 콘텐츠 등급 설정
    await mobileAds().setRequestConfiguration({
      maxAdContentRating: MaxAdContentRating.PG,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    });

    console.log("광고 SDK가 초기화되었습니다.");
    return true;
  } catch (error) {
    console.error("광고 SDK 초기화 중 오류 발생:", error);
    return false;
  }
};

// 리워드 광고를 미리 로드합니다.
export const preloadRewardAd = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!REWARD_AD_UNIT_ID) {
      console.error("리워드 광고 유닛 ID가 정의되지 않았습니다.");
      resolve(false);
      return;
    }

    rewardAd = RewardedAd.createForAdRequest(REWARD_AD_UNIT_ID);

    const unsubscribeLoaded = rewardAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log("리워드 광고가 로드되었습니다.");
      rewardAdLoaded = true;
      unsubscribeLoaded();
      resolve(true);
    });

    const unsubscribeFailedToLoad = rewardAd.addAdEventListener(AdEventType.ERROR, (error) => {
      console.error("리워드 광고 로드 실패:", error);
      unsubscribeFailedToLoad();
      resolve(false);
    });

    rewardAd.load();
  });
};

// 리워드 광고를 표시합니다.
export const showRewardAd = (): Promise<boolean> => {
  return new Promise(async (resolve) => {
    if (!rewardAd || !rewardAdLoaded) {
      console.log("리워드 광고가 로드되지 않았습니다. 다시 로드합니다.");
      const loaded = await preloadRewardAd();
      if (!loaded) {
        resolve(false);
        return;
      }
    }

    if (!rewardAd) {
      resolve(false);
      return;
    }

    const unsubscribeEarned = rewardAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, async () => {
      console.log("사용자가 리워드를 획득했습니다");

      // 광고 표시 시간 및 횟수 업데이트
      await saveLastAdShownTime();
      await updateDailyAdCount();

      unsubscribeEarned();
      rewardAdLoaded = false;
      rewardAd = null;

      // 바로 다음 광고를 미리 로드
      preloadRewardAd();

      resolve(true);
    });

    const unsubscribeClosed = rewardAd.addAdEventListener(AdEventType.CLOSED, () => {
      console.log("리워드 광고가 닫혔습니다.");
      unsubscribeClosed();
      rewardAdLoaded = false;
      rewardAd = null;

      // 광고가 닫히면 다음 광고를 미리 로드
      preloadRewardAd();

      // 어떤 경우든 광고가 닫히면 처리를 계속 진행
      resolve(true);
    });

    const unsubscribeOpened = rewardAd.addAdEventListener(AdEventType.OPENED, () => {
      console.log("리워드 광고가 열렸습니다.");
      unsubscribeOpened();
    });

    rewardAd.show();
  });
};

// 일일 광고 최대 표시 횟수 (필요 시 제한 설정)
export const MAX_DAILY_AD_COUNT = 10;

// 광고 쿨다운 시간 (분)
export const AD_COOLDOWN_MINUTES = 30;

// 사용자에게 광고를 표시할 수 있는지 확인합니다.
export const canShowAdForAction = async (): Promise<boolean> => {
  try {
    // 일일 광고 횟수 제한 확인
    const currentCount = await getDailyAdCount();
    if (currentCount >= MAX_DAILY_AD_COUNT) {
      return false;
    }

    // 마지막 광고 표시 시간 확인 (쿨다운)
    const lastShownTime = await getLastAdShownTime();
    if (lastShownTime) {
      const now = new Date();
      const minutesSinceLastAd = (now.getTime() - lastShownTime.getTime()) / (1000 * 60);
      if (minutesSinceLastAd < AD_COOLDOWN_MINUTES) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("광고 표시 가능 여부 확인 중 오류:", error);
    return false;
  }
};
