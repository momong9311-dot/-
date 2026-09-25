// 키오스크·현황판이 화면에 그리는 모든 문구와 메뉴는 이 컬렉션에서 나온다.
// 하드코딩된 텍스트 대신 설정 화면에서 편집 → 게시하면 화면이 바뀐다.

export type LanguageCode = "ko" | "en" | "ja" | "zh";

export interface Language {
  id: string;
  code: LanguageCode;
  label: string;
  visible: boolean;
}

export type DesignerStatus = "available" | "closed";

export interface Designer {
  id: string;
  name: string;
  role: string;
  /** data URL 또는 이미지 경로. 없으면 이니셜로 표시 */
  photo?: string;
  status: DesignerStatus;
  visible: boolean;
  /** '지정 안함' 같은 자동 배정 항목 */
  isAny?: boolean;
}

export interface Service {
  id: string;
  ko: string;
  en: string;
  thumbnail?: string;
  visible: boolean;
  /** 3WAY 상담처럼 강조할 시그니처 항목 */
  signature?: boolean;
}

export type OptionalServiceIcon = "coffee" | "hanger" | "bag" | "sparkle";

export interface OptionalService {
  id: string;
  title: string;
  description: string;
  icon: OptionalServiceIcon;
  visible: boolean;
  signature?: boolean;
}

export interface CopySettings {
  welcomeEyebrow: string;
  welcomeHeadline: string;
  welcomeCopy: string;
  supportingWords: string;
  reservationHeadline: string;
  reservationCopy: string;
  purposeHeadline: string;
  purposeCopy: string;
  designerHeadline: string;
  designerCopy: string;
  completeHeadline: string;
  completeCopy: string;
  brandMessage: string;
  optionalHeadline: string;
  optionalCopy: string;
  footerMessage: string;
  /** 첫 화면 배경 사진 (data URL). 없으면 기본 그라데이션 */
  heroImage?: string;
}

export interface ButtonLabels {
  start: string;
  checkReservation: string;
  walkIn: string;
  walkInSub: string;
  consultOnly: string;
  consultOnlySub: string;
  next: string;
  back: string;
  home: string;
  moreServices: string;
  skipOptional: string;
}

export interface WaitSettings {
  defaultWaitMinutes: number;
  numberPrefix: string;
  numberDigits: number;
  autoReturnSeconds: number;
}

export interface KioskConfig {
  salonName: string;
  descriptor: string;
  languages: Language[];
  designers: Designer[];
  services: Service[];
  optionalServices: OptionalService[];
  copy: CopySettings;
  buttons: ButtonLabels;
  wait: WaitSettings;
}

export type DateFormat = "en-long" | "ko-long" | "dot";
export type SortRule = "reservationTime" | "checkInTime";
export type CompletedOrder = "recentFirst" | "reservationTime";

export interface DisplaySettings {
  dateFormat: DateFormat;
  showCompleted: boolean;
  waitingLabel: string;
  completedLabel: string;
}

export interface BoardSettings {
  /** 'all' 또는 디자이너 id */
  defaultFilter: string;
  sortRule: SortRule;
  keepCompleted: boolean;
  completedOrder: CompletedOrder;
}

export interface BoardConfig {
  display: DisplaySettings;
  board: BoardSettings;
}

/** 설정 전체. draft 를 편집하고 게시하면 published 로 복사된다 */
export interface AppConfig {
  kiosk: KioskConfig;
  board: BoardConfig;
}

/** 상태는 두 가지뿐이다 */
export type CustomerStatus = "waiting" | "completed";
export type VisitType = "first" | "return";

export interface Customer {
  id: string;
  customerName: string;
  designerId: string;
  /** "HH:mm" */
  reservationTime: string;
  serviceIds: string[];
  status: CustomerStatus;
  ticket: string;
  checkInAt: number;
  completedAt?: number;
  visitType?: VisitType;
  memo?: string;
  optionalServiceIds?: string[];
}

export interface Reservation {
  id: string;
  phone: string;
  customerName: string;
  designerId: string;
  reservationTime: string;
  serviceIds: string[];
}
