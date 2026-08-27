import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api";
import { Section, ListRow, Empty, Button, Tag } from "../../components";

type Practice = {
  id: string;
  skillName: string | null;
  assignmentTitle: string | null;
  lessonTitle: string | null;
  evidence: string;
  reflection: string;
  status: string;
  submittedAt: string;
  evaluated: boolean;
};
type Skill = { id: string; name: string; isCore: boolean };

export function PracticePage() {
  const [params] = useSearchParams();
  const [list, setList] = useState<Practice[] | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillId, setSkillId] = useState("");
  const [evidence, setEvidence] = useState("");
  const [reflection, setReflection] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const assignmentId = params.get("assignmentId") ?? undefined;
  const lessonId = params.get("lessonId") ?? undefined;

  const load = () => api.get<Practice[]>("/api/designer/practices").then(setList);
  useEffect(() => {
    load();
    api.get<Skill[]>("/api/skills").then(setSkills);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api.post("/api/designer/practices", { skillId: skillId || undefined, assignmentId, lessonId, evidence, reflection });
      setEvidence("");
      setReflection("");
      setMsg("실습이 제출되었습니다. 평가를 기다립니다.");
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">실습</h1>
      <p className="muted small">교육 내용을 실제 행동으로 연결합니다.</p>

      <Section label="새 실습 제출">
        <form onSubmit={submit}>
          <label className="field">
            <span className="lbl">역량 (Skill)</span>
            <select value={skillId} onChange={(e) => setSkillId(e.target.value)}>
              <option value="">— 선택 —</option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.isCore ? " (핵심)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="lbl">Evidence · 무엇을 했는가</span>
            <textarea value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="관찰 → 진단 → 디자인 연결 과정을 기록하세요." required />
          </label>
          <label className="field">
            <span className="lbl">Reflection · 스스로의 회고</span>
            <textarea value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="무엇이 부족했고 다음에 무엇을 개선할지." />
          </label>
          {msg && <p className="small" style={{ color: "#111" }}>{msg}</p>}
          <Button type="submit" disabled={busy || !evidence}>
            {busy ? "제출 중…" : "실습 제출"}
          </Button>
        </form>
      </Section>

      <Section label="내 실습">
        {!list ? (
          <Empty>불러오는 중…</Empty>
        ) : list.length === 0 ? (
          <Empty>아직 제출한 실습이 없습니다.</Empty>
        ) : (
          list.map((p) => (
            <ListRow
              key={p.id}
              title={p.skillName ?? "실습"}
              sub={p.evidence.slice(0, 60) + (p.evidence.length > 60 ? "…" : "")}
              right={p.evaluated ? <Tag>평가됨</Tag> : <Tag>평가 대기</Tag>}
            />
          ))
        )}
      </Section>
    </div>
  );
}
