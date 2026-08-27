import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import { useAuth, isManager } from "../../auth";
import { Section, Empty, Button, Back, Tag } from "../../components";

const statusLabel: Record<string, string> = { draft: "작성 중", applied: "적용함", completed: "완료" };

export function CaseDetail() {
  const { id } = useParams();
  const { me } = useAuth();
  const [c, setC] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const load = () => api.get<any>(`/api/designer/cases/${id}`).then(setC);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!c) return <Empty>불러오는 중…</Empty>;
  const isOwner = me?.id === c.designerId;
  const manager = isManager(me?.roleKey);

  async function complete() {
    setBusy(true);
    try {
      await api.post(`/api/designer/cases/${id}/complete`);
      await load();
    } finally {
      setBusy(false);
    }
  }

  const ds = [
    ["Length", c.dsLength], ["Silhouette", c.dsSilhouette], ["Volume", c.dsVolume], ["Line", c.dsLine],
    ["Weight", c.dsWeight], ["Texture", c.dsTexture], ["Curl", c.dsCurl], ["Parting", c.dsParting],
    ["Fringe", c.dsFringe], ["Color", c.dsColor],
  ].filter(([, v]) => v);

  return (
    <div>
      <Back to="/cases" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="page-title" style={{ margin: 0 }}>{c.diagnosis || c.customerNeed || "사례"}</h1>
        <Tag core={c.status === "completed"}>{statusLabel[c.status] ?? c.status}</Tag>
      </div>
      <p className="muted small">
        {c.skill?.name ?? "역량 미지정"}
        {c.branch?.name ? ` · ${c.branch.name}` : ""} · {new Date(c.createdAt).toLocaleDateString("ko-KR")}
      </p>

      {isOwner && (
        <div style={{ display: "flex", gap: 8, margin: "8px 0 4px" }}>
          <Button ghost onClick={() => nav(`/cases/${id}/edit`)}>편집</Button>
          {c.status !== "completed" && (
            <Button onClick={complete} disabled={busy}>
              {busy ? "처리 중…" : "실제 고객 적용 완료"}
            </Button>
          )}
        </div>
      )}
      {isOwner && c.status !== "completed" && (
        <p className="small faint">※ ‘완료’는 실제 고객에게 적용했음을 의미하며, 관련 역량의 <b>적용(Application) 횟수</b>에 반영됩니다.</p>
      )}

      <Field label="Customer Need" v={c.customerNeed} />
      <Field label="Desired Image" v={c.desiredImage} />
      <Field label="Current Concern" v={c.currentConcern} />

      <Section label="관찰 · 진단">
        <Field label="Observation" v={c.observation} />
        <Field label="Diagnosis" v={c.diagnosis} />
        <Field label="Problem Definition" v={c.problemDefinition} />
        <Field label="Image Direction" v={c.imageDirection} />
      </Section>

      <Section label="디자인 전략 (진단 → 디자인 연결)">
        <Field label="Design Goal" v={c.designGoal} />
        {ds.length > 0 && (
          <div className="ds-view">
            {ds.map(([k, v]) => (
              <div key={k as string} className="ds-item">
                <span className="k">{k}</span>
                <span className="v">{v as string}</span>
              </div>
            ))}
          </div>
        )}
        <Field label="Reason (핵심)" v={c.dsReason} strong />
      </Section>

      <Section label="시술 · 결과">
        <Field label="Procedure" v={c.procedure} />
        <Field label="Result" v={c.result} />
        {c.beforeRef && <Field label="Before" v={c.beforeRef} />}
        {c.afterRef && <Field label="After" v={c.afterRef} />}
      </Section>

      {c.designerReflection && (
        <Section label="회고">
          <Field label="Designer Reflection" v={c.designerReflection} />
        </Section>
      )}

      {c.relatedSkills?.length > 0 && (
        <Section label="관련 역량">
          <div className="chip-select">
            {c.relatedSkills.map((r: any) => (
              <span className="chip on" key={r.id}>{r.skill.name}</span>
            ))}
          </div>
        </Section>
      )}

      {/* Evaluations + feedback on this case */}
      {c.evaluations?.length > 0 && (
        <Section label="평가">
          {c.evaluations.map((e: any) => (
            <div className="feedback-block" key={e.id}>
              <div className="small faint">
                {e.evaluator?.name}
                {e.dimension ? ` · ${dimLabel(e.dimension)}` : ""}
                {typeof e.score === "number" ? ` · ${e.score}점` : ""}
              </div>
              {e.strength && <div className="small" style={{ marginTop: 4 }}><b>강점</b> {e.strength}</div>}
              {e.gap && <div className="small"><b>부족</b> {e.gap}</div>}
              {e.nextAction && (
                <div className="next-action"><span className="label">Next Action</span><div>{e.nextAction}</div></div>
              )}
            </div>
          ))}
        </Section>
      )}
      {c.feedback?.length > 0 && (
        <Section label="피드백">
          {c.feedback.map((f: any) => (
            <div className="feedback-block" key={f.id}>
              <div className="feedback-msg">{f.message}</div>
              {f.nextAction && (
                <div className="next-action"><span className="label">Next Action</span><div>{f.nextAction}</div></div>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Manager: evaluate + feedback on this case */}
      {manager && !isOwner && <ManagerReview caseData={c} onDone={load} />}
    </div>
  );
}

function ManagerReview({ caseData, onDone }: { caseData: any; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ strength: "", gap: "", nextAction: "", score: "", message: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: any) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/api/eval", {
        subjectUserId: caseData.designerId,
        skillId: caseData.skillId ?? undefined,
        customerCaseId: caseData.id,
        dimension: "design_connection",
        strength: f.strength,
        gap: f.gap,
        nextAction: f.nextAction,
        score: f.score ? Number(f.score) : undefined,
      });
      await api.post("/api/feedback", {
        subjectUserId: caseData.designerId,
        customerCaseId: caseData.id,
        skillId: caseData.skillId ?? undefined,
        strength: f.strength,
        gap: f.gap,
        message: f.message || `${f.strength} ${f.gap ? "다만, " + f.gap : ""}`.trim(),
        nextAction: f.nextAction,
      });
      setOpen(false);
      setF({ strength: "", gap: "", nextAction: "", score: "", message: "" });
      await onDone();
    } finally {
      setBusy(false);
    }
  }

  if (!open)
    return (
      <Section label="관리자">
        <Button onClick={() => setOpen(true)}>이 사례 평가 + 피드백</Button>
      </Section>
    );

  return (
    <Section label="평가 + 피드백 (Design Connection)">
      <form onSubmit={submit}>
        <label className="field"><span className="lbl">Strength · 강점</span><textarea value={f.strength} onChange={set("strength")} /></label>
        <label className="field"><span className="lbl">Gap · 부족</span><textarea value={f.gap} onChange={set("gap")} /></label>
        <label className="field"><span className="lbl">Next Action · 다음 행동</span><textarea value={f.nextAction} onChange={set("nextAction")} required /></label>
        <label className="field"><span className="lbl">Score (선택)</span><input type="number" min={0} max={100} value={f.score} onChange={set("score")} /></label>
        <label className="field"><span className="lbl">Feedback Message (비우면 강점+부족으로 생성)</span><textarea value={f.message} onChange={set("message")} /></label>
        <div style={{ display: "flex", gap: 8 }}>
          <Button type="submit" disabled={busy || !f.nextAction}>{busy ? "저장 중…" : "저장"}</Button>
          <Button ghost onClick={() => setOpen(false)}>취소</Button>
        </div>
      </form>
    </Section>
  );
}

function Field({ label, v, strong }: { label: string; v?: string | null; strong?: boolean }) {
  if (!v) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="lbl" style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-faint)", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ whiteSpace: "pre-wrap", fontWeight: strong ? 500 : 400 }}>{v}</div>
    </div>
  );
}

function dimLabel(d: string) {
  return { observation: "관찰", diagnosis: "진단", problem: "문제정의", design_connection: "디자인 연결", execution: "실행", communication: "커뮤니케이션" }[d] ?? d;
}
