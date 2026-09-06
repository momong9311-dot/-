import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { Section, ListRow, Empty, Tag } from "../../components";

type ManualRow = {
  id: string;
  title: string;
  summary: string | null;
  isRequired: boolean;
  version: number;
  read: boolean;
};
type Cat = { id: string; name: string; manuals: ManualRow[] };

export function Manuals() {
  const [data, setData] = useState<Cat[] | null>(null);
  const [q, setQ] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => {
      api.get<Cat[]>(`/api/manuals${q ? `?q=${encodeURIComponent(q)}` : ""}`).then(setData);
    }, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div>
      <h1 className="page-title">운영 매뉴얼</h1>
      <p className="muted small">매장 운영·접객·위생 기준입니다. 필독 자료는 확인 표시를 남겨주세요.</p>

      <label className="field" style={{ marginTop: 12 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="제목·요약으로 검색"
        />
      </label>

      {!data ? (
        <Empty>불러오는 중…</Empty>
      ) : data.length === 0 ? (
        <Empty>{q ? "검색 결과가 없습니다." : "등록된 매뉴얼이 없습니다."}</Empty>
      ) : (
        data.map((c) => (
          <Section key={c.id} label={c.name}>
            {c.manuals.map((m) => (
              <ListRow
                key={m.id}
                title={
                  <>
                    {m.title}{" "}
                    {m.isRequired && <Tag core>필독</Tag>}
                    {m.isRequired && !m.read && <Tag>미확인</Tag>}
                  </>
                }
                sub={m.summary ?? undefined}
                onClick={() => nav(`/manuals/${m.id}`)}
              />
            ))}
          </Section>
        ))
      )}
    </div>
  );
}
