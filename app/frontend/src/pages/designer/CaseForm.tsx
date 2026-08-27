import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import { Section, Button, Back, Empty } from "../../components";

type Skill = { id: string; name: string; isCore: boolean };
type Branch = { id: string; name: string };

// The full case shape (all optional free-text). Mirrors the backend schema.
type CaseData = {
  branchId?: string;
  skillId?: string;
  relatedSkillIds?: string[];
  customerNeed?: string;
  desiredImage?: string;
  currentConcern?: string;
  observation?: string;
  diagnosis?: string;
  problemDefinition?: string;
  imageDirection?: string;
  designGoal?: string;
  dsLength?: string;
  dsSilhouette?: string;
  dsVolume?: string;
  dsLine?: string;
  dsWeight?: string;
  dsTexture?: string;
  dsCurl?: string;
  dsParting?: string;
  dsFringe?: string;
  dsColor?: string;
  dsReason?: string;
  procedure?: string;
  result?: string;
  beforeRef?: string;
  afterRef?: string;
  designerReflection?: string;
};

const empty: CaseData = { relatedSkillIds: [] };

export function CaseForm() {
  const { id } = useParams();
  const editing = !!id;
  const [data, setData] = useState<CaseData>(empty);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(!editing);
  const nav = useNavigate();

  useEffect(() => {
    api.get<Skill[]>("/api/skills").then(setSkills);
    api.get<Branch[]>("/api/branches").then(setBranches).catch(() => setBranches([]));
    if (editing) {
      api.get<any>(`/api/designer/cases/${id}`).then((c) => {
        setData({
          branchId: c.branchId ?? undefined,
          skillId: c.skillId ?? undefined,
          relatedSkillIds: (c.relatedSkills ?? []).map((r: any) => r.skillId),
          customerNeed: c.customerNeed ?? "",
          desiredImage: c.desiredImage ?? "",
          currentConcern: c.currentConcern ?? "",
          observation: c.observation ?? "",
          diagnosis: c.diagnosis ?? "",
          problemDefinition: c.problemDefinition ?? "",
          imageDirection: c.imageDirection ?? "",
          designGoal: c.designGoal ?? "",
          dsLength: c.dsLength ?? "", dsSilhouette: c.dsSilhouette ?? "", dsVolume: c.dsVolume ?? "",
          dsLine: c.dsLine ?? "", dsWeight: c.dsWeight ?? "", dsTexture: c.dsTexture ?? "",
          dsCurl: c.dsCurl ?? "", dsParting: c.dsParting ?? "", dsFringe: c.dsFringe ?? "",
          dsColor: c.dsColor ?? "", dsReason: c.dsReason ?? "",
          procedure: c.procedure ?? "", result: c.result ?? "",
          beforeRef: c.beforeRef ?? "", afterRef: c.afterRef ?? "",
          designerReflection: c.designerReflection ?? "",
        });
        setLoaded(true);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const set = (k: keyof CaseData) => (e: any) => setData({ ...data, [k]: e.target.value });
  const toggleSkill = (sid: string) => {
    const cur = new Set(data.relatedSkillIds ?? []);
    cur.has(sid) ? cur.delete(sid) : cur.add(sid);
    setData({ ...data, relatedSkillIds: Array.from(cur) });
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (editing) {
        await api.patch(`/api/designer/cases/${id}`, data);
        nav(`/cases/${id}`);
      } else {
        const created = await api.post<{ id: string }>("/api/designer/cases", data);
        nav(`/cases/${created.id}`);
      }
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return <Empty>불러오는 중…</Empty>;

  return (
    <div>
      <Back to={editing ? `/cases/${id}` : "/cases"} />
      <h1 className="page-title">{editing ? "사례 편집" : "새 사례 기록"}</h1>
      <p className="muted small">고객 이름·연락처·주소는 입력하지 않습니다. 교육 목적의 최소 정보만 기록합니다.</p>

      <form onSubmit={submit}>
        <Section label="고객 맥락">
          <Ta label="Customer Need · 고객 니즈" v={data.customerNeed} on={set("customerNeed")} />
          <Ta label="Desired Image · 원하는 이미지" v={data.desiredImage} on={set("desiredImage")} />
          <Ta label="Current Concern · 현재 고민" v={data.currentConcern} on={set("currentConcern")} />
        </Section>

        <Section label="관찰 · 진단">
          <Ta label="Observation · 관찰" v={data.observation} on={set("observation")} />
          <Ta label="Diagnosis · 진단" v={data.diagnosis} on={set("diagnosis")} />
          <Ta label="Problem Definition · 문제 정의" v={data.problemDefinition} on={set("problemDefinition")} />
          <Ta label="Image Direction · 이미지 방향" v={data.imageDirection} on={set("imageDirection")} />
        </Section>

        {/* The core: diagnosis -> design. Never just a procedure name. */}
        <Section label="디자인 전략 (핵심: 진단 → 디자인 연결)">
          <Ta label="Design Goal · 디자인 목표" v={data.designGoal} on={set("designGoal")} />
          <div className="ds-grid">
            <In label="Length" v={data.dsLength} on={set("dsLength")} />
            <In label="Silhouette" v={data.dsSilhouette} on={set("dsSilhouette")} />
            <In label="Volume" v={data.dsVolume} on={set("dsVolume")} />
            <In label="Line" v={data.dsLine} on={set("dsLine")} />
            <In label="Weight" v={data.dsWeight} on={set("dsWeight")} />
            <In label="Texture" v={data.dsTexture} on={set("dsTexture")} />
            <In label="Curl" v={data.dsCurl} on={set("dsCurl")} />
            <In label="Parting" v={data.dsParting} on={set("dsParting")} />
            <In label="Fringe" v={data.dsFringe} on={set("dsFringe")} />
            <In label="Color" v={data.dsColor} on={set("dsColor")} />
          </div>
          <Ta
            label="Reason · 이 전략이 진단에서 나온 이유 (가장 중요)"
            v={data.dsReason}
            on={set("dsReason")}
            placeholder="예: 가로 비율이 강조된 진단 결과에 따라 옆볼륨을 줄이고 세로 라인을 만들기 위해…"
          />
        </Section>

        <Section label="시술 · 결과">
          <Ta label="Procedure · 시술" v={data.procedure} on={set("procedure")} />
          <Ta label="Result · 결과" v={data.result} on={set("result")} />
          <In label="Before Image (참조 URL/메모)" v={data.beforeRef} on={set("beforeRef")} />
          <In label="After Image (참조 URL/메모)" v={data.afterRef} on={set("afterRef")} />
        </Section>

        <Section label="회고 · 역량">
          <Ta label="Designer Reflection · 회고" v={data.designerReflection} on={set("designerReflection")} />
          <label className="field">
            <span className="lbl">주요 역량 (Primary Skill)</span>
            <select value={data.skillId ?? ""} onChange={set("skillId")}>
              <option value="">— 선택 —</option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.isCore ? " (핵심)" : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="field">
            <span className="lbl">관련 역량 (Related Skills · 완료 시 적용 횟수 반영)</span>
            <div className="chip-select">
              {skills.map((s) => {
                const on = (data.relatedSkillIds ?? []).includes(s.id);
                return (
                  <button type="button" key={s.id} className={`chip${on ? " on" : ""}`} onClick={() => toggleSkill(s.id)}>
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
          {branches.length > 0 && (
            <label className="field">
              <span className="lbl">지점 (Branch)</span>
              <select value={data.branchId ?? ""} onChange={set("branchId")}>
                <option value="">— 기본 지점 —</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </label>
          )}
        </Section>

        <Button type="submit" disabled={busy}>
          {busy ? "저장 중…" : editing ? "저장" : "사례 저장 (작성 중)"}
        </Button>
      </form>
    </div>
  );
}

function Ta({ label, v, on, placeholder }: { label: string; v?: string; on: (e: any) => void; placeholder?: string }) {
  return (
    <label className="field">
      <span className="lbl">{label}</span>
      <textarea value={v ?? ""} onChange={on} placeholder={placeholder} />
    </label>
  );
}
function In({ label, v, on }: { label: string; v?: string; on: (e: any) => void }) {
  return (
    <label className="field">
      <span className="lbl">{label}</span>
      <input value={v ?? ""} onChange={on} />
    </label>
  );
}
