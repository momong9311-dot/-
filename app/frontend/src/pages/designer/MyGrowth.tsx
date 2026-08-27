import { useEffect, useState } from "react";
import { api } from "../../api";
import { Section, Empty, GrowthRow } from "../../components";

type Growth = {
  skillId: string;
  skillName: string;
  area: string;
  isCore: boolean;
  currentLevel: string | null;
  targetLevel: string | null;
  practiceCount: number;
  applicationCount: number;
  evaluationCount: number;
  feedbackCount: number;
  history: { from: string | null; to: string | null; causeType: string; note: string | null; createdAt: string }[];
};

export function MyGrowth() {
  const [rows, setRows] = useState<Growth[] | null>(null);
  useEffect(() => {
    api.get<Growth[]>("/api/designer/growth").then(setRows);
  }, []);

  if (!rows) return <Empty>불러오는 중…</Empty>;

  // Group by area for editorial structure.
  const byArea = new Map<string, Growth[]>();
  for (const r of rows) {
    if (!byArea.has(r.area)) byArea.set(r.area, []);
    byArea.get(r.area)!.push(r);
  }

  return (
    <div>
      <h1 className="page-title">나의 성장</h1>
      <p className="muted small">
        완료율이 아니라 역량입니다. 각 역량이 <b>왜</b> 성장했는지(또는 멈췄는지)를 실습·적용·평가·피드백으로 확인하세요.
      </p>
      {rows.length === 0 && <Empty>아직 역량 데이터가 없습니다.</Empty>}
      {Array.from(byArea.entries()).map(([area, list]) => (
        <Section key={area} label={area}>
          {list.map((g) => (
            <GrowthRow key={g.skillId} name={g.skillName} {...g} history={g.history} />
          ))}
        </Section>
      ))}
    </div>
  );
}
