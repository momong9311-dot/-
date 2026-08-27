import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { ListRow, Empty, Tag } from "../../components";

type Designer = {
  id: string;
  name: string;
  level: string | null;
  branch: string | null;
  coreSkill: { name: string; level: string | null } | null;
  weakSkill: string | null;
};

export function Designers() {
  const [rows, setRows] = useState<Designer[] | null>(null);
  const nav = useNavigate();
  useEffect(() => {
    api.get<Designer[]>("/api/admin/designers").then(setRows);
  }, []);
  if (!rows) return <Empty>불러오는 중…</Empty>;
  const short = (l: string | null) => (l ? l.replace(/^LEVEL\s*\d+\s*—\s*/, "") : "—");

  return (
    <div>
      <h1 className="page-title">디자이너</h1>
      {rows.length === 0 && <Empty>디자이너가 없습니다.</Empty>}
      {rows.map((d) => (
        <ListRow
          key={d.id}
          title={d.name}
          sub={
            <>
              {short(d.level)}
              {d.branch ? ` · ${d.branch}` : ""}
              {d.weakSkill ? ` · 취약: ${d.weakSkill}` : ""}
            </>
          }
          right={d.coreSkill ? <Tag core>{short(d.coreSkill.level)}</Tag> : undefined}
          onClick={() => nav(`/admin/designers/${d.id}`)}
        />
      ))}
    </div>
  );
}
