import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { Section, ListRow, Empty, Tag } from "../../components";

type Row = { id: string; name: string; level: string | null };
type Dash = {
  totals: { designers: number; awaitingEvaluation: number; needsFeedback: number; practiceShortage: number };
  growing: Row[];
  stuck: Row[];
  weakSkills: { skillId: string; skillName: string; isCore: boolean; tracked: number; noApplication: number }[];
  practiceShortage: Row[];
  awaitingEvaluation: (Row & { awaitingEval: number })[];
  needsFeedback: (Row & { unackFeedback: number })[];
};

export function AdminDashboard() {
  const [d, setD] = useState<Dash | null>(null);
  const nav = useNavigate();
  useEffect(() => {
    api.get<Dash>("/api/admin/dashboard").then(setD);
  }, []);
  if (!d) return <Empty>불러오는 중…</Empty>;

  const go = (id: string) => nav(`/admin/designers/${id}`);
  const short = (l: string | null) => (l ? l.replace(/^LEVEL\s*\d+\s*—\s*/, "") : "—");

  return (
    <div>
      <h1 className="page-title">현황</h1>
      <p className="muted small">누가 어디에서 막혀 있고, 무엇을 도와줘야 하는가.</p>

      <div className="stat-row" style={{ marginTop: 16 }}>
        <div className="stat">
          <div className="n">{d.totals.designers}</div>
          <div className="l">디자이너</div>
        </div>
        <div className="stat">
          <div className="n">{d.totals.awaitingEvaluation}</div>
          <div className="l">평가 대기</div>
        </div>
        <div className="stat">
          <div className="n">{d.totals.needsFeedback}</div>
          <div className="l">피드백 필요</div>
        </div>
        <div className="stat">
          <div className="n">{d.totals.practiceShortage}</div>
          <div className="l">실습 부족</div>
        </div>
      </div>

      <Section label="막혀 있는 디자이너">
        {d.stuck.length ? (
          d.stuck.map((r) => <ListRow key={r.id} title={r.name} sub={short(r.level)} onClick={() => go(r.id)} />)
        ) : (
          <Empty>막혀 있는 디자이너가 없습니다.</Empty>
        )}
      </Section>

      <Section label="평가 대기">
        {d.awaitingEvaluation.length ? (
          d.awaitingEvaluation.map((r) => (
            <ListRow key={r.id} title={r.name} sub={`대기 실습 ${r.awaitingEval}건`} onClick={() => go(r.id)} />
          ))
        ) : (
          <Empty>평가 대기 중인 실습이 없습니다.</Empty>
        )}
      </Section>

      <Section label="피드백 필요">
        {d.needsFeedback.length ? (
          d.needsFeedback.map((r) => (
            <ListRow key={r.id} title={r.name} sub={`미확인 피드백 ${r.unackFeedback}건`} onClick={() => go(r.id)} />
          ))
        ) : (
          <Empty>피드백이 필요한 디자이너가 없습니다.</Empty>
        )}
      </Section>

      <Section label="취약 역량">
        {d.weakSkills.length ? (
          d.weakSkills.map((s) => (
            <ListRow
              key={s.skillId}
              title={
                <>
                  {s.skillName} {s.isCore && <Tag core>핵심</Tag>}
                </>
              }
              sub={`추적 ${s.tracked}명 중 고객 적용 0회: ${s.noApplication}명`}
            />
          ))
        ) : (
          <Empty>데이터가 부족합니다.</Empty>
        )}
      </Section>

      <Section label="성장 중">
        {d.growing.length ? (
          d.growing.map((r) => <ListRow key={r.id} title={r.name} sub={short(r.level)} onClick={() => go(r.id)} />)
        ) : (
          <Empty>최근 성장 기록이 없습니다.</Empty>
        )}
      </Section>
    </div>
  );
}
