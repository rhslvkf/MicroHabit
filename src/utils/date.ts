/**
 * 현재 날짜를 ISO 형식 문자열로 반환합니다.
 */
export function getTodayISOString(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

/**
 * 날짜를 한국어 형식으로 포맷팅합니다.
 * 예: "2023년 5월 15일 (월)"
 */
export function formatDateToKorean(dateString?: string): string {
  const date = dateString ? new Date(dateString) : new Date();

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
  const weekDay = weekDays[date.getDay()];

  return `${year}년 ${month}월 ${day}일 (${weekDay})`;
}

/**
 * 오늘 날짜인지 확인합니다.
 */
export function isToday(dateString: string): boolean {
  const today = getTodayISOString();
  return dateString === today;
}
