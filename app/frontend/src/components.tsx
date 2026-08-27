import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

export function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="section">
      <div className="section-label">{label}</div>
      {children}
    </section>
  );
}

export function ListRow({
  title,
  sub,
  right,
  onClick,
}: {
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div className={`row${onClick ? " link" : ""}`} onClick={onClick}>
      <div className="row-main">
        <div className="row-title">{title}</div>
        {sub && <div className="row-sub">{sub}</div>}
      </div>
      {right ?? (onClick ? <span className="chev">›</span> : null)}
    </div>
  );
}

export function Tag({ children, core }: { children: ReactNode; core?: boolean }) {
  return <span className={`tag${core ? " core" : ""}`}>{children}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function Button({
  children,
  onClick,
  ghost,
  block,
  disabled,
  type,
}: {
  children: ReactNode;
  onClick?: () => void;
  ghost?: boolean;
  block?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type ?? "button"}
      className={`btn${ghost ? " ghost" : ""}${block ? " block" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function Back({ to }: { to?: string }) {
  const nav = useNavigate();
  return (
    <span className="back" onClick={() => (to ? nav(to) : nav(-1))}>
      ‹ 뒤로
    </span>
  );
}

// Growth row: level move + the multi-dimensional counts, kept explicitly
// separate from any completion metric. Optional history explains WHY.
export function GrowthRow({
  name,
  isCore,
  currentLevel,
  targetLevel,
  practiceCount,
  applicationCount,
  evaluationCount,
  feedbackCount,
  history,
}: {
  name: string;
  isCore?: boolean;
  currentLevel: string | null;
  targetLevel: string | null;
  practiceCount: number;
  applicationCount: number;
  evaluationCount: number;
  feedbackCount: number;
  history?: { from: string | null; to: string | null; causeType: string; note?: string | null }[];
}) {
  const short = (l: string | null) => (l ? l.replace(/^LEVEL\s*\d+\s*—\s*/, "") : "—");
  return (
    <div className="growth-row">
      <div className="growth-head">
        <span className="growth-name">
          {name} {isCore && <Tag core>핵심</Tag>}
        </span>
        <span className="growth-level">
          {short(currentLevel)} → {short(targetLevel)}
        </span>
      </div>
      <div className="growth-counts">
        <span>실습 <b>{practiceCount}</b></span>
        <span>적용 <b>{applicationCount}</b></span>
        <span>평가 <b>{evaluationCount}</b></span>
        <span>피드백 <b>{feedbackCount}</b></span>
      </div>
      {history && history.length > 0 && (
        <div className="growth-history">
          {history.map((h, i) => (
            <div className="h" key={i}>
              {short(h.from)} → {short(h.to)} · {causeLabel(h.causeType)}
              {h.note ? ` — ${h.note}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function causeLabel(c: string) {
  return { evaluation: "평가", feedback: "피드백", application: "고객 적용", practice: "실습" }[c] ?? c;
}
