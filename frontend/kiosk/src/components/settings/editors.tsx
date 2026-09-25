"use client";

import { Avatar, ImagePicker, OptionalIcon, ServiceThumb, Toggle } from "@/components/ui/primitives";
import { move, uid } from "@/lib/format";
import type {
  AppConfig,
  BoardSettings,
  ButtonLabels,
  CopySettings,
  DisplaySettings,
  KioskConfig,
  OptionalServiceIcon,
  WaitSettings,
} from "@/lib/types";
import {
  AddButton,
  DeleteButton,
  Field,
  HiddenBadge,
  ListCard,
  NumberInput,
  ReorderButtons,
  SectionTitle,
  Select,
  TextArea,
  TextInput,
} from "./fields";

export interface EditorProps {
  config: AppConfig;
  onChange: (next: AppConfig) => void;
}

function setKiosk(config: AppConfig, patch: Partial<KioskConfig>): AppConfig {
  return { ...config, kiosk: { ...config.kiosk, ...patch } };
}

/** 컬렉션 한 항목을 바꾸는 헬퍼 */
function patchAt<T>(list: T[], index: number, patch: Partial<T>): T[] {
  return list.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

// ─── 01 언어 ──────────────────────────────────────────

export function LanguageEditor({ config, onChange }: EditorProps) {
  const list = config.kiosk.languages;
  const set = (languages: typeof list) => onChange(setKiosk(config, { languages }));
  return (
    <>
      <SectionTitle
        eyebrow="01 · LANGUAGE"
        title="언어 설정"
        help="첫 화면에 보일 언어 버튼을 고르고 순서와 표시 이름을 바꿉니다. 한 개만 켜 두면 언어 버튼이 숨겨져요."
      />
      <div className="flex flex-col gap-2">
        {list.map((l, i) => (
          <ListCard key={l.id} dimmed={!l.visible}>
            <div className="flex items-center gap-4">
              <ReorderButtons index={i} length={list.length} onMove={(d) => set(move(list, i, d))} />
              <span className="eyebrow w-8 text-muted">{l.code}</span>
              <TextInput value={l.label} onChange={(label) => set(patchAt(list, i, { label }))} className="max-w-60" />
              <div className="ml-auto flex items-center gap-3">
                {!l.visible && <HiddenBadge />}
                <Toggle
                  checked={l.visible}
                  label={`${l.label} 표시`}
                  onChange={(visible) => set(patchAt(list, i, { visible }))}
                />
              </div>
            </div>
          </ListCard>
        ))}
      </div>
    </>
  );
}

// ─── 02 디자이너 ──────────────────────────────────────

export function DesignerEditor({ config, onChange, eyebrow = "02 · DESIGNERS" }: EditorProps & { eyebrow?: string }) {
  const list = config.kiosk.designers;
  const set = (designers: typeof list) => onChange(setKiosk(config, { designers }));
  return (
    <>
      <SectionTitle
        eyebrow={eyebrow}
        title="디자이너 설정"
        help="키오스크의 디자이너 선택 화면과 직원 현황판 필터에 함께 쓰입니다. 화살표로 순서를 바꿀 수 있어요."
      />
      <div className="mb-5">
        <AddButton
          onClick={() =>
            set([
              ...list.filter((d) => !d.isAny),
              { id: uid("d"), name: "새 디자이너", role: "디자이너", status: "available", visible: true },
              ...list.filter((d) => d.isAny),
            ])
          }
        >
          디자이너 추가
        </AddButton>
      </div>
      <div className="flex flex-col gap-2">
        {list.map((d, i) => (
          <ListCard key={d.id} dimmed={!d.visible}>
            <div className="flex items-start gap-4">
              <div className="pt-4">
                <ReorderButtons index={i} length={list.length} onMove={(dir) => set(move(list, i, dir))} />
              </div>
              <Avatar designer={d} size={60} />
              <div className="grid flex-1 grid-cols-2 gap-3">
                <Field label="이름">
                  <TextInput value={d.name} onChange={(name) => set(patchAt(list, i, { name }))} />
                </Field>
                <Field label={d.isAny ? "안내 문구" : "직함"}>
                  <TextInput value={d.role} onChange={(role) => set(patchAt(list, i, { role }))} />
                </Field>
                {!d.isAny && (
                  <>
                    <Field label="예약 상태">
                      <Select
                        value={d.status}
                        onChange={(status) => set(patchAt(list, i, { status }))}
                        options={[
                          { value: "available", label: "예약 가능" },
                          { value: "closed", label: "오늘 예약 마감" },
                        ]}
                      />
                    </Field>
                    <Field label="프로필 사진">
                      <ImagePicker value={d.photo} onChange={(photo) => set(patchAt(list, i, { photo }))} />
                    </Field>
                  </>
                )}
              </div>
              <div className="flex flex-col items-end gap-3 pt-7">
                <div className="flex items-center gap-2">
                  {!d.visible && <HiddenBadge />}
                  <Toggle
                    checked={d.visible}
                    label={`${d.name} 표시`}
                    onChange={(visible) => set(patchAt(list, i, { visible }))}
                  />
                </div>
                {!d.isAny && <DeleteButton onClick={() => set(list.filter((x) => x.id !== d.id))} />}
              </div>
            </div>
          </ListCard>
        ))}
      </div>
    </>
  );
}

// ─── 03 시술 메뉴 ─────────────────────────────────────

export function ServiceEditor({ config, onChange, eyebrow = "03 · SERVICES" }: EditorProps & { eyebrow?: string }) {
  const list = config.kiosk.services;
  const set = (services: typeof list) => onChange(setKiosk(config, { services }));
  return (
    <>
      <SectionTitle
        eyebrow={eyebrow}
        title="시술 메뉴 설정"
        help="키오스크의 방문 목적 화면과 현황판의 시술 이름에 쓰입니다. 시그니처로 지정한 시술은 초록 선으로 강조되고, ‘상담만 받고 싶어요’를 누르면 자동 선택돼요."
      />
      <div className="mb-5">
        <AddButton onClick={() => set([...list, { id: uid("s"), ko: "새 시술", en: "NEW", visible: true }])}>
          시술 추가
        </AddButton>
      </div>
      <div className="flex flex-col gap-2">
        {list.map((s, i) => (
          <ListCard key={s.id} dimmed={!s.visible}>
            <div className="flex items-start gap-4">
              <div className="pt-4">
                <ReorderButtons index={i} length={list.length} onMove={(dir) => set(move(list, i, dir))} />
              </div>
              <ServiceThumb service={s} size={60} />
              <div className="grid flex-1 grid-cols-2 gap-3">
                <Field label="한국어 이름">
                  <TextInput value={s.ko} onChange={(ko) => set(patchAt(list, i, { ko }))} />
                </Field>
                <Field label="영문 이름">
                  <TextInput value={s.en} onChange={(en) => set(patchAt(list, i, { en: en.toUpperCase() }))} />
                </Field>
                <Field label="썸네일">
                  <ImagePicker value={s.thumbnail} onChange={(thumbnail) => set(patchAt(list, i, { thumbnail }))} />
                </Field>
                <Field label="시그니처 강조">
                  <Toggle
                    checked={Boolean(s.signature)}
                    label="시그니처"
                    onChange={(signature) =>
                      // 시그니처는 하나만
                      set(list.map((x, j) => ({ ...x, signature: j === i ? signature : signature ? false : x.signature })))
                    }
                  />
                </Field>
              </div>
              <div className="flex flex-col items-end gap-3 pt-7">
                <div className="flex items-center gap-2">
                  {!s.visible && <HiddenBadge />}
                  <Toggle
                    checked={s.visible}
                    label={`${s.ko} 표시`}
                    onChange={(visible) => set(patchAt(list, i, { visible }))}
                  />
                </div>
                <DeleteButton onClick={() => set(list.filter((x) => x.id !== s.id))} />
              </div>
            </div>
          </ListCard>
        ))}
      </div>
    </>
  );
}

// ─── 04 브랜드 문구 ───────────────────────────────────

const COPY_FIELDS: { key: keyof CopySettings; label: string; group: string; rows?: number }[] = [
  { key: "welcomeEyebrow", label: "첫 화면 윗줄", group: "첫 화면" },
  { key: "welcomeHeadline", label: "첫 화면 헤드라인", group: "첫 화면" },
  { key: "welcomeCopy", label: "첫 화면 한국어 문구", group: "첫 화면", rows: 2 },
  { key: "supportingWords", label: "하단 단어 ( / 로 구분)", group: "첫 화면" },
  { key: "reservationHeadline", label: "예약 확인 헤드라인", group: "단계별 문구", rows: 2 },
  { key: "reservationCopy", label: "예약 확인 설명", group: "단계별 문구", rows: 2 },
  { key: "purposeHeadline", label: "방문 목적 헤드라인", group: "단계별 문구", rows: 2 },
  { key: "purposeCopy", label: "방문 목적 설명", group: "단계별 문구", rows: 2 },
  { key: "designerHeadline", label: "디자이너 선택 헤드라인", group: "단계별 문구", rows: 2 },
  { key: "designerCopy", label: "디자이너 선택 설명", group: "단계별 문구", rows: 2 },
  { key: "brandMessage", label: "완료 화면 브랜드 메시지", group: "완료 · 부가 서비스", rows: 2 },
  { key: "optionalHeadline", label: "부가 서비스 헤드라인", group: "완료 · 부가 서비스", rows: 2 },
  { key: "optionalCopy", label: "부가 서비스 설명", group: "완료 · 부가 서비스", rows: 2 },
  { key: "footerMessage", label: "하단 브랜드 메시지", group: "완료 · 부가 서비스" },
];

export function CopyEditor({ config, onChange }: EditorProps) {
  const copy = config.kiosk.copy;
  const set = (patch: Partial<CopySettings>) => onChange(setKiosk(config, { copy: { ...copy, ...patch } }));
  const groups = [...new Set(COPY_FIELDS.map((f) => f.group))];
  return (
    <>
      <SectionTitle
        eyebrow="04 · BRAND COPY"
        title="브랜드 문구 설정"
        help="줄바꿈(Enter)은 화면에서도 그대로 줄바꿈됩니다."
      />
      <div className="grid grid-cols-2 gap-4">
        <Field label="살롱 이름">
          <TextInput value={config.kiosk.salonName} onChange={(salonName) => onChange(setKiosk(config, { salonName }))} />
        </Field>
        <Field label="살롱 설명">
          <TextInput
            value={config.kiosk.descriptor}
            onChange={(descriptor) => onChange(setKiosk(config, { descriptor }))}
          />
        </Field>
        <div className="col-span-2">
          <Field label="첫 화면 배경 사진" hint="없으면 밝은 기본 배경이 쓰입니다. 세로 사진을 권장해요.">
            <ImagePicker value={copy.heroImage} maxSize={1400} onChange={(heroImage) => set({ heroImage })} />
          </Field>
        </div>
      </div>
      {groups.map((g) => (
        <div key={g} className="mt-10">
          <div className="eyebrow mb-4 border-b border-line pb-2 text-muted">{g}</div>
          <div className="grid grid-cols-2 gap-4">
            {COPY_FIELDS.filter((f) => f.group === g).map((f) => (
              <Field key={f.key} label={f.label}>
                {f.rows ? (
                  <TextArea value={copy[f.key] ?? ""} rows={f.rows} onChange={(v) => set({ [f.key]: v })} />
                ) : (
                  <TextInput value={copy[f.key] ?? ""} onChange={(v) => set({ [f.key]: v })} />
                )}
              </Field>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

// ─── 05 버튼 라벨 ─────────────────────────────────────

const BUTTON_FIELDS: { key: keyof ButtonLabels; label: string }[] = [
  { key: "start", label: "시작 버튼" },
  { key: "checkReservation", label: "예약 확인 버튼" },
  { key: "walkIn", label: "현장 접수 카드 제목" },
  { key: "walkInSub", label: "현장 접수 카드 설명" },
  { key: "consultOnly", label: "상담 카드 제목" },
  { key: "consultOnlySub", label: "상담 카드 설명" },
  { key: "next", label: "다음 버튼" },
  { key: "back", label: "이전 버튼" },
  { key: "home", label: "홈 버튼" },
  { key: "moreServices", label: "부가 서비스 링크" },
  { key: "skipOptional", label: "부가 서비스 건너뛰기" },
];

export function ButtonEditor({ config, onChange }: EditorProps) {
  const buttons = config.kiosk.buttons;
  return (
    <>
      <SectionTitle eyebrow="05 · BUTTONS" title="버튼 · 라벨 설정" help="짧고 분명할수록 좋아요." />
      <div className="grid grid-cols-2 gap-4">
        {BUTTON_FIELDS.map((f) => (
          <Field key={f.key} label={f.label}>
            <TextInput
              value={buttons[f.key]}
              onChange={(v) => onChange(setKiosk(config, { buttons: { ...buttons, [f.key]: v } }))}
            />
          </Field>
        ))}
      </div>
    </>
  );
}

// ─── 06 대기 정보 ─────────────────────────────────────

export function WaitEditor({ config, onChange }: EditorProps) {
  const wait = config.kiosk.wait;
  const copy = config.kiosk.copy;
  const set = (patch: Partial<WaitSettings>) => onChange(setKiosk(config, { wait: { ...wait, ...patch } }));
  const example = `${wait.numberPrefix} ${"3".padStart(wait.numberDigits, "0")}`.trim();
  return (
    <>
      <SectionTitle
        eyebrow="06 · WAITING"
        title="대기 정보 설정"
        help="예상 대기시간은 ‘기본 대기시간 × 해당 디자이너 앞 대기 인원(최소 1명)’으로 계산됩니다."
      />
      <div className="grid grid-cols-2 gap-6">
        <Field label="기본 대기시간">
          <NumberInput value={wait.defaultWaitMinutes} min={1} max={180} suffix="분" onChange={(defaultWaitMinutes) => set({ defaultWaitMinutes })} />
        </Field>
        <Field label="완료 화면 자동 복귀">
          <NumberInput value={wait.autoReturnSeconds} min={5} max={300} suffix="초" onChange={(autoReturnSeconds) => set({ autoReturnSeconds })} />
        </Field>
        <Field label="대기번호 앞 글자" hint={`예: ${example}`}>
          <TextInput value={wait.numberPrefix} maxLength={3} onChange={(numberPrefix) => set({ numberPrefix })} className="max-w-28" />
        </Field>
        <Field label="대기번호 자릿수">
          <NumberInput value={wait.numberDigits} min={1} max={4} suffix="자리" onChange={(numberDigits) => set({ numberDigits })} />
        </Field>
        <Field label="완료 화면 헤드라인">
          <TextArea
            value={copy.completeHeadline}
            onChange={(completeHeadline) => onChange(setKiosk(config, { copy: { ...copy, completeHeadline } }))}
          />
        </Field>
        <Field label="완료 화면 안내 문구">
          <TextArea
            value={copy.completeCopy}
            onChange={(completeCopy) => onChange(setKiosk(config, { copy: { ...copy, completeCopy } }))}
          />
        </Field>
      </div>
    </>
  );
}

// ─── 07 부가 서비스 ───────────────────────────────────

const ICON_OPTIONS: { value: OptionalServiceIcon; label: string }[] = [
  { value: "coffee", label: "음료" },
  { value: "hanger", label: "옷걸이" },
  { value: "bag", label: "쇼핑백" },
  { value: "sparkle", label: "반짝임" },
];

export function OptionalEditor({ config, onChange }: EditorProps) {
  const list = config.kiosk.optionalServices;
  const set = (optionalServices: typeof list) => onChange(setKiosk(config, { optionalServices }));
  return (
    <>
      <SectionTitle
        eyebrow="07 · OPTIONAL SERVICES"
        title="부가 서비스 설정"
        help="체크인 후 기다리는 동안 고를 수 있는 서비스입니다. 고객이 누르면 현황판의 고객 상세에 표시돼요."
      />
      <div className="mb-5">
        <AddButton
          onClick={() =>
            set([...list, { id: uid("o"), title: "새 서비스", description: "설명", icon: "sparkle", visible: true }])
          }
        >
          부가 서비스 추가
        </AddButton>
      </div>
      <div className="flex flex-col gap-2">
        {list.map((o, i) => (
          <ListCard key={o.id} dimmed={!o.visible}>
            <div className="flex items-start gap-4">
              <div className="pt-4">
                <ReorderButtons index={i} length={list.length} onMove={(dir) => set(move(list, i, dir))} />
              </div>
              <div className="flex h-14 w-14 items-center justify-center bg-stone">
                <OptionalIcon icon={o.icon} className="h-6 w-6 text-ink/70" />
              </div>
              <div className="grid flex-1 grid-cols-2 gap-3">
                <Field label="제목">
                  <TextInput value={o.title} onChange={(title) => set(patchAt(list, i, { title }))} />
                </Field>
                <Field label="설명">
                  <TextInput value={o.description} onChange={(description) => set(patchAt(list, i, { description }))} />
                </Field>
                <Field label="아이콘">
                  <Select value={o.icon} options={ICON_OPTIONS} onChange={(icon) => set(patchAt(list, i, { icon }))} />
                </Field>
                <Field label="시그니처 강조">
                  <Toggle
                    checked={Boolean(o.signature)}
                    label="시그니처"
                    onChange={(signature) => set(patchAt(list, i, { signature }))}
                  />
                </Field>
              </div>
              <div className="flex flex-col items-end gap-3 pt-7">
                <div className="flex items-center gap-2">
                  {!o.visible && <HiddenBadge />}
                  <Toggle
                    checked={o.visible}
                    label={`${o.title} 표시`}
                    onChange={(visible) => set(patchAt(list, i, { visible }))}
                  />
                </div>
                <DeleteButton onClick={() => set(list.filter((x) => x.id !== o.id))} />
              </div>
            </div>
          </ListCard>
        ))}
      </div>
    </>
  );
}

// ─── 현황판: 표시 설정 ────────────────────────────────

export function DisplayEditor({ config, onChange }: EditorProps) {
  const display = config.board.display;
  const set = (patch: Partial<DisplaySettings>) =>
    onChange({ ...config, board: { ...config.board, display: { ...display, ...patch } } });
  return (
    <>
      <SectionTitle eyebrow="03 · DISPLAY" title="표시 설정" help="살롱 이름과 설명은 키오스크와 함께 바뀝니다." />
      <div className="grid grid-cols-2 gap-6">
        <Field label="살롱 이름">
          <TextInput value={config.kiosk.salonName} onChange={(salonName) => onChange(setKiosk(config, { salonName }))} />
        </Field>
        <Field label="살롱 설명">
          <TextInput value={config.kiosk.descriptor} onChange={(descriptor) => onChange(setKiosk(config, { descriptor }))} />
        </Field>
        <Field label="날짜 형식">
          <Select
            value={display.dateFormat}
            onChange={(dateFormat) => set({ dateFormat })}
            options={[
              { value: "en-long", label: "SEP 25, 2026" },
              { value: "ko-long", label: "2026년 9월 25일" },
              { value: "dot", label: "2026.09.25" },
            ]}
          />
        </Field>
        <Field label="완료 섹션 보이기">
          <Toggle checked={display.showCompleted} label="완료 섹션" onChange={(showCompleted) => set({ showCompleted })} />
        </Field>
        <Field label="‘대기’ 표시 문구">
          <TextInput value={display.waitingLabel} onChange={(waitingLabel) => set({ waitingLabel })} />
        </Field>
        <Field label="‘완료’ 표시 문구">
          <TextInput value={display.completedLabel} onChange={(completedLabel) => set({ completedLabel })} />
        </Field>
      </div>
    </>
  );
}

// ─── 현황판: 보드 설정 ────────────────────────────────

export function BoardRulesEditor({ config, onChange }: EditorProps) {
  const board = config.board.board;
  const set = (patch: Partial<BoardSettings>) =>
    onChange({ ...config, board: { ...config.board, board: { ...board, ...patch } } });
  const designers = config.kiosk.designers.filter((d) => !d.isAny && d.visible);
  return (
    <>
      <SectionTitle eyebrow="04 · BOARD" title="현황판 설정" help="대기 고객은 항상 위에 먼저 보입니다." />
      <div className="grid grid-cols-2 gap-6">
        <Field label="기본 디자이너 필터" hint="디자이너 전용 태블릿이라면 해당 디자이너를 고르세요.">
          <Select
            value={board.defaultFilter}
            onChange={(defaultFilter) => set({ defaultFilter })}
            options={[{ value: "all", label: "전체" }, ...designers.map((d) => ({ value: d.id, label: d.name }))]}
          />
        </Field>
        <Field label="대기 고객 정렬">
          <Select
            value={board.sortRule}
            onChange={(sortRule) => set({ sortRule })}
            options={[
              { value: "reservationTime", label: "예약시간 순" },
              { value: "checkInTime", label: "체크인 순" },
            ]}
          />
        </Field>
        <Field label="완료 고객 계속 보이기" hint="끄면 완료 후 10분이 지난 고객은 목록에서 빠집니다(숫자는 유지).">
          <Toggle checked={board.keepCompleted} label="완료 고객 유지" onChange={(keepCompleted) => set({ keepCompleted })} />
        </Field>
        <Field label="완료 고객 표시 순서">
          <Select
            value={board.completedOrder}
            onChange={(completedOrder) => set({ completedOrder })}
            options={[
              { value: "recentFirst", label: "최근 완료 먼저" },
              { value: "reservationTime", label: "예약시간 순" },
            ]}
          />
        </Field>
      </div>
    </>
  );
}
