import type { AppConfig, Customer, Reservation } from "./types";

export const DEFAULT_CONFIG: AppConfig = {
  kiosk: {
    salonName: "MERCI MOMONG",
    descriptor: "HAIR CONSULTING SALON",
    languages: [
      { id: "l-ko", code: "ko", label: "한국어", visible: true },
      { id: "l-en", code: "en", label: "ENGLISH", visible: true },
      { id: "l-ja", code: "ja", label: "日本語", visible: true },
      { id: "l-zh", code: "zh", label: "中文", visible: true },
    ],
    designers: [
      { id: "d-kmn", name: "강미나", role: "대표원장", status: "available", visible: true },
      { id: "d-ys", name: "유선", role: "원장", status: "available", visible: true },
      { id: "d-hw", name: "혜원", role: "원장", status: "available", visible: true },
      { id: "d-sa", name: "서아", role: "디자이너", status: "closed", visible: false },
      {
        id: "d-any",
        name: "지정 안함",
        role: "현장 상황에 맞춰 배정됩니다.",
        status: "available",
        visible: true,
        isAny: true,
      },
    ],
    services: [
      { id: "s-cut", ko: "커트", en: "CUT", visible: true },
      { id: "s-perm", ko: "펌", en: "PERM", visible: true },
      { id: "s-color", ko: "컬러", en: "COLOR", visible: true },
      { id: "s-clinic", ko: "클리닉", en: "CLINIC", visible: true },
      { id: "s-3way", ko: "3WAY 상담", en: "CONSULTING", visible: true, signature: true },
    ],
    optionalServices: [
      { id: "o-drink", title: "음료 선택하기", description: "편안한 시간을 위해", icon: "coffee", visible: true },
      { id: "o-locker", title: "짐 보관하기", description: "소중한 옷과 가방을 안전하게", icon: "hanger", visible: true },
      { id: "o-product", title: "제품 추천받기", description: "나에게 맞는 홈케어", icon: "bag", visible: true },
      {
        id: "o-preview",
        title: "오늘의 상담 미리보기",
        description: "내 얼굴 · 컬러 · 이미지 분석",
        icon: "sparkle",
        visible: true,
        signature: true,
      },
    ],
    copy: {
      welcomeEyebrow: "DISCOVER YOUR OWN BEAUTY",
      welcomeHeadline: "Self Check-In",
      welcomeCopy: "오늘의 아름다움을\n함께 찾아볼게요.",
      supportingWords: "BEAUTY / CONFIDENCE / YOURSELF",
      reservationHeadline: "예약을\n확인할게요.",
      reservationCopy: "휴대폰 번호로 간편하게\n예약을 확인해주세요.",
      purposeHeadline: "오늘,\n어떤 변화를 원하시나요?",
      purposeCopy: "시술보다 먼저,\n오늘 원하는 방향을 선택해주세요.",
      designerHeadline: "함께할 디자이너를\n선택해주세요.",
      designerCopy: "예약하신 디자이너가 있다면\n자동으로 선택됩니다.",
      completeHeadline: "체크인이\n완료되었습니다.",
      completeCopy: "잠시만 기다려주세요.\n담당 디자이너가 곧 안내해드릴게요.",
      brandMessage: "좋은 스타일은\n나를 이해하는 것에서 시작됩니다.",
      optionalHeadline: "기다리는 동안,\n조금 더 도와드릴까요?",
      optionalCopy: "더 편안한 경험을 위해\n원하는 서비스를 선택해주세요.",
      footerMessage: "YOUR BEAUTY, YOUR DIRECTION",
    },
    buttons: {
      start: "시작하기",
      checkReservation: "예약 확인하기",
      walkIn: "예약 없이 방문했어요",
      walkInSub: "현장 접수하기",
      consultOnly: "상담만 받고 싶어요",
      consultOnlySub: "3WAY 상담하기",
      next: "다음으로",
      back: "이전으로",
      home: "홈으로 돌아가기",
      moreServices: "기다리는 동안 서비스 선택하기",
      skipOptional: "괜찮아요, 처음으로",
    },
    wait: {
      defaultWaitMinutes: 15,
      numberPrefix: "A",
      numberDigits: 2,
      autoReturnSeconds: 30,
    },
  },
  board: {
    display: {
      dateFormat: "en-long",
      showCompleted: true,
      waitingLabel: "대기",
      completedLabel: "완료",
    },
    board: {
      defaultFilter: "all",
      sortRule: "reservationTime",
      keepCompleted: true,
      completedOrder: "recentFirst",
    },
  },
};

/** 데모용 오늘 예약. 키오스크에서 이 번호로 예약 확인을 해볼 수 있다 */
export const DEFAULT_RESERVATIONS: Reservation[] = [
  {
    id: "r-1",
    phone: "01012345678",
    customerName: "한지우",
    designerId: "d-kmn",
    reservationTime: "12:00",
    serviceIds: ["s-cut", "s-3way"],
  },
  {
    id: "r-2",
    phone: "01098765432",
    customerName: "서도윤",
    designerId: "d-hw",
    reservationTime: "12:30",
    serviceIds: ["s-color"],
  },
];

function todayAt(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

export function seedCustomers(): Customer[] {
  const waiting: [string, string, string, string[], string][] = [
    ["김서연", "d-kmn", "10:30", ["s-cut", "s-3way"], "A 06"],
    ["박지민", "d-ys", "11:00", ["s-color"], "A 07"],
    ["이하늘", "d-hw", "11:30", ["s-perm"], "A 08"],
  ];
  const completed: [string, string, string, string[], string][] = [
    ["오세린", "d-ys", "08:30", ["s-cut"], "A 01"],
    ["한소희", "d-hw", "09:00", ["s-perm"], "A 02"],
    ["윤가은", "d-kmn", "09:00", ["s-color"], "A 03"],
    ["최유진", "d-kmn", "09:30", ["s-cut"], "A 04"],
    ["정수민", "d-ys", "10:00", ["s-clinic"], "A 05"],
  ];
  return [
    ...waiting.map(([customerName, designerId, reservationTime, serviceIds, ticket], i) => ({
      id: `c-w${i}`,
      customerName,
      designerId,
      reservationTime,
      serviceIds,
      ticket,
      status: "waiting" as const,
      checkInAt: todayAt(reservationTime) - 10 * 60_000,
    })),
    ...completed.map(([customerName, designerId, reservationTime, serviceIds, ticket], i) => ({
      id: `c-c${i}`,
      customerName,
      designerId,
      reservationTime,
      serviceIds,
      ticket,
      status: "completed" as const,
      checkInAt: todayAt(reservationTime) - 10 * 60_000,
      completedAt: todayAt(reservationTime) + 60 * 60_000,
    })),
  ];
}
