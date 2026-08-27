import { useEffect, useState } from "react";
import { api } from "../../api";
import { Section, ListRow, Empty, Button, Back } from "../../components";

type QueueItem = {
  practiceId: string;
  designerId: string;
  designerName: string;
  skillId: string | null;
  skillName: string | null;
  evidence: string;
  reflection: string;
  submittedAt: string;
};
type Level = { id: string; name: string; order: number };

export function EvaluationMgmt() {
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [active, setActive] = useState<QueueItem | null>(null);

  const load = () => api.get<QueueItem[]>("/api/eval/queue").then(setQueue);
  useEffect(() => {
    load();
    api.get<Level[]>("/api/levels").then(setLevels);
  }, []);

  if (active)
    return <EvaluateForm item={active} levels={levels} onDone={() => { setActive(null); load(); }} onCancel={() => setActive(null)} />;

  return (
    <div>
      <h1 className="page-title">평가</h1>
      <p className="muted small">제출된 실습을 행동·역량 기준으로 평가하고 피드백을 남깁니다.</p>
      <Section label="평가 대기 실습">
        {!queue ? (
          <Empty>불러오는 중…</Empty>
        ) : queue.length === 0 ? (
          <Empty>평가 대기 중인 실습이 없습니다.</Empty>
        ) : (
          queue.map((q) => (
            <ListRow
              key={q.practiceId}
              title={`${q.designerName} · ${q.skillName ?? "역량 미지정"}`}
              sub={q.evidence.slice(0, 70)}
              onClick={() => setActive(q)}
            />
          ))
        )}
      </Section>
    </div>
  );
}

function EvaluateForm({
  item,
  levels,
  onDone,
  onCancel,
}: {
  item: QueueItem;
  levels: Level[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [f, setF] = useState({ criteria: "", observation: "", strength: "", gap: "", nextAction: "", score: "" });
  const [newLevelId, setNewLevelId] = useState("");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"eval" | "feedback" | "done">("eval");
  const [fbMsg, setFbMsg] = useState("");
  const [fbNext, setFbNext] = useState("");
  const set = (k: keyof typeof f) => (e: any) => setF({ ...f, [k]: e.target.value });

  async function submitEval(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/api/eval", {
        subjectUserId: item.designerId,
        skillId: item.skillId ?? undefined,
        practiceId: item.practiceId,
        criteria: f.criteria,
        observation: f.observation,
        strength: f.strength,
        gap: f.gap,
        nextAction: f.nextAction,
        score: f.score ? Number(f.score) : undefined,
        newLevelId: newLevelId || undefined,
      });
      // Pre-fill feedback from the evaluation's next action (close the loop).
      setFbMsg(f.gap ? `${f.strength ? f.strength + " " : ""}다만, ${f.gap}` : f.strength);
      setFbNext(f.nextAction);
      setPhase("feedback");
    } finally {
      setBusy(false);
    }
  }

  async function submitFeedback(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/api/feedback", {
        subjectUserId: item.designerId,
        skillId: item.skillId ?? undefined,
        message: fbMsg,
        nextAction: fbNext,
      });
      setPhase("done");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Back to="#" />
      <h1 className="page-title">{item.designerName} 평가</h1>
      <p className="muted small">{item.skillName ?? "역량 미지정"}</p>

      <Section label="제출된 실습">
        <div className="feedback-block">
          <div className="small"><b>Evidence</b> {item.evidence}</div>
          {item.reflection && <div className="small" style={{ marginTop: 6 }}><b>Reflection</b> {item.reflection}</div>}
        </div>
      </Section>

      {phase === "eval" && (
        <form onSubmit={submitEval}>
          <Section label="평가 (행동·역량)">
            <Field label="Criteria · 기준" v={f.criteria} on={set("criteria")} />
            <Field label="Observation · 관찰" v={f.observation} on={set("observation")} />
            <Field label="Strength · 강점" v={f.strength} on={set("strength")} />
            <Field label="Gap · 부족" v={f.gap} on={set("gap")} />
            <Field label="Next Action · 다음 행동" v={f.nextAction} on={set("nextAction")} required />
            <label className="field">
              <span className="lbl">Score · 점수 (선택)</span>
              <input type="number" min={0} max={100} value={f.score} onChange={set("score")} />
            </label>
            <label className="field">
              <span className="lbl">역량 성장 반영 (선택) · 이 평가로 레벨이 이동한다면</span>
              <select value={newLevelId} onChange={(e) => setNewLevelId(e.target.value)}>
                <option value="">변화 없음</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="small faint">※ 레벨 이동은 근거(이 평가)와 함께 성장 이력에 기록됩니다. 완료만으로는 오르지 않습니다.</p>
          </Section>
          <div style={{ display: "flex", gap: 8 }}>
            <Button type="submit" disabled={busy || !f.nextAction}>
              {busy ? "저장 중…" : "평가 저장 → 피드백"}
            </Button>
            <Button ghost onClick={onCancel}>
              취소
            </Button>
          </div>
        </form>
      )}

      {phase === "feedback" && (
        <form onSubmit={submitFeedback}>
          <Section label="피드백 (다음 행동으로 연결)">
            <label className="field">
              <span className="lbl">Message</span>
              <textarea value={fbMsg} onChange={(e) => setFbMsg(e.target.value)} required />
            </label>
            <label className="field">
              <span className="lbl">Next Action</span>
              <textarea value={fbNext} onChange={(e) => setFbNext(e.target.value)} />
            </label>
          </Section>
          <Button type="submit" disabled={busy || !fbMsg}>
            {busy ? "저장 중…" : "피드백 전송"}
          </Button>
        </form>
      )}

      {phase === "done" && (
        <Section label="완료">
          <div className="feedback-block">평가와 피드백이 저장되었습니다. 디자이너의 홈에 반영됩니다.</div>
          <Button onClick={onDone}>평가 대기 목록으로</Button>
        </Section>
      )}
    </div>
  );
}

function Field({ label, v, on, required }: { label: string; v: string; on: (e: any) => void; required?: boolean }) {
  return (
    <label className="field">
      <span className="lbl">{label}</span>
      <textarea value={v} onChange={on} required={required} />
    </label>
  );
}
