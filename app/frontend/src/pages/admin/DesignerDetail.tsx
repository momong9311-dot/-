import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api";
import { Section, ListRow, Empty, Back, GrowthRow, Tag } from "../../components";

type Detail = {
  id: string;
  name: string;
  email: string;
  level: string | null;
  branch: string | null;
  learning: { completed: number; inProgress: number };
  growth: any[];
  practices: { id: string; skillName: string | null; evidence: string; status: string; evaluated: boolean }[];
  evaluations: any[];
  feedback: any[];
};

export function DesignerDetail() {
  const { id } = useParams();
  const [d, setD] = useState<Detail | null>(null);
  useEffect(() => {
    api.get<Detail>(`/api/admin/designers/${id}`).then(setD);
  }, [id]);
  if (!d) return <Empty>불러오는 중…</Empty>;

  return (
    <div>
      <Back to="/admin/designers" />
      <h1 className="page-title">{d.name}</h1>
      <p className="muted small">
        {d.level ?? "—"} · {d.branch ?? "—"} · {d.email}
      </p>

      {/* Completion is shown separately and never labeled as growth. */}
      <Section label="학습 (완료율)">
        <ListRow title={`완료 ${d.learning.completed}개 · 진행 중 ${d.learning.inProgress}개`} sub="※ 완료는 성장이 아닙니다." />
      </Section>

      <Section label="역량 성장">
        {d.growth.length ? (
          d.growth.map((g, i) => <GrowthRow key={i} name={g.skillName} isCore={g.isCore} {...g} history={g.history} />)
        ) : (
          <Empty>역량 데이터가 없습니다.</Empty>
        )}
      </Section>

      <Section label="실습">
        {d.practices.length ? (
          d.practices.map((p) => (
            <ListRow
              key={p.id}
              title={p.skillName ?? "실습"}
              sub={p.evidence.slice(0, 70)}
              right={p.evaluated ? <Tag>평가됨</Tag> : <Tag>대기</Tag>}
            />
          ))
        ) : (
          <Empty>제출된 실습이 없습니다.</Empty>
        )}
      </Section>

      <Section label="평가">
        {d.evaluations.length ? (
          d.evaluations.map((e: any) => (
            <div className="feedback-block" key={e.id}>
              <div className="small faint">
                {e.skill?.name ?? "-"} · {e.evaluator?.name ?? ""}
              </div>
              <div className="small" style={{ marginTop: 4 }}>
                <b>강점</b> {e.strength}
              </div>
              <div className="small">
                <b>부족</b> {e.gap}
              </div>
              <div className="next-action">
                <span className="label">Next Action</span>
                <div>{e.nextAction}</div>
              </div>
            </div>
          ))
        ) : (
          <Empty>평가가 없습니다.</Empty>
        )}
      </Section>

      <Section label="피드백">
        {d.feedback.length ? (
          d.feedback.map((f: any) => (
            <div className="feedback-block" key={f.id}>
              <div className="feedback-msg">{f.message}</div>
              <div className="next-action">
                <span className="label">Next Action</span>
                <div>{f.nextAction}</div>
              </div>
            </div>
          ))
        ) : (
          <Empty>피드백이 없습니다.</Empty>
        )}
      </Section>
    </div>
  );
}
