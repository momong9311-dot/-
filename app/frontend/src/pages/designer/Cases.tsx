import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { Section, ListRow, Empty, Button, Tag } from "../../components";

type CaseRow = {
  id: string;
  status: string;
  skillName: string | null;
  customerNeed: string | null;
  diagnosis: string | null;
  createdAt: string;
  completedAt: string | null;
  evaluated: boolean;
  relatedSkills: string[];
};

const statusLabel: Record<string, string> = { draft: "작성 중", applied: "적용함", completed: "완료" };

export function Cases() {
  const [rows, setRows] = useState<CaseRow[] | null>(null);
  const nav = useNavigate();
  useEffect(() => {
    api.get<CaseRow[]>("/api/designer/cases").then(setRows);
  }, []);

  return (
    <div>
      <h1 className="page-title">MY CASES</h1>
      <p className="muted small">배운 내용을 실제 고객에게 어떻게 적용했는지 기록합니다. (고객 개인정보는 저장하지 않습니다)</p>
      <div style={{ margin: "12px 0 4px" }}>
        <Button onClick={() => nav("/cases/new")}>+ 새 사례 기록</Button>
      </div>

      <Section label="기록한 사례">
        {!rows ? (
          <Empty>불러오는 중…</Empty>
        ) : rows.length === 0 ? (
          <Empty>아직 기록한 사례가 없습니다.</Empty>
        ) : (
          rows.map((c) => (
            <ListRow
              key={c.id}
              title={c.diagnosis || c.customerNeed || "무제 사례"}
              sub={
                <>
                  {c.skillName ?? "역량 미지정"}
                  {c.relatedSkills.length > 1 ? ` +${c.relatedSkills.length - 1}` : ""} ·{" "}
                  {new Date(c.createdAt).toLocaleDateString("ko-KR")}
                </>
              }
              right={
                <span style={{ display: "flex", gap: 6 }}>
                  {c.evaluated && <Tag>평가됨</Tag>}
                  <Tag core={c.status === "completed"}>{statusLabel[c.status] ?? c.status}</Tag>
                </span>
              }
              onClick={() => nav(`/cases/${c.id}`)}
            />
          ))
        )}
      </Section>
    </div>
  );
}
