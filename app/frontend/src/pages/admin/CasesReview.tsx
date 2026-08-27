import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { Section, ListRow, Empty, Tag } from "../../components";

type CaseRow = {
  id: string;
  status: string;
  designerId: string;
  designerName: string;
  skillName: string | null;
  diagnosis: string | null;
  completedAt: string | null;
  evaluated: boolean;
};

export function CasesReview() {
  const [rows, setRows] = useState<CaseRow[] | null>(null);
  const nav = useNavigate();
  useEffect(() => {
    api.get<CaseRow[]>("/api/manager/cases?status=completed").then(setRows);
  }, []);

  const pending = (rows ?? []).filter((c) => !c.evaluated);
  const done = (rows ?? []).filter((c) => c.evaluated);

  return (
    <div>
      <h1 className="page-title">고객 사례</h1>
      <p className="muted small">완료된 사례를 확인하고 평가·피드백을 남깁니다. 사례를 열어 진단 → 디자인 연결을 확인하세요.</p>

      <Section label="평가 대기 사례">
        {!rows ? (
          <Empty>불러오는 중…</Empty>
        ) : pending.length === 0 ? (
          <Empty>평가 대기 중인 사례가 없습니다.</Empty>
        ) : (
          pending.map((c) => (
            <ListRow
              key={c.id}
              title={`${c.designerName} · ${c.diagnosis || "사례"}`}
              sub={c.skillName ?? "역량 미지정"}
              onClick={() => nav(`/cases/${c.id}`)}
            />
          ))
        )}
      </Section>

      {done.length > 0 && (
        <Section label="평가 완료">
          {done.map((c) => (
            <ListRow
              key={c.id}
              title={`${c.designerName} · ${c.diagnosis || "사례"}`}
              sub={c.skillName ?? "역량 미지정"}
              right={<Tag>평가됨</Tag>}
              onClick={() => nav(`/cases/${c.id}`)}
            />
          ))}
        </Section>
      )}
    </div>
  );
}
