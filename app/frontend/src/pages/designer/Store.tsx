import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { Section, ListRow, Empty, Tag } from "../../components";

type Notice = {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  scope: "store" | "all";
  author: string | null;
  createdAt: string;
};
type Checklist = { id: string; name: string; type: string; total: number; checked: number; done: boolean };
type Overview = { branchScoped: boolean; date: string; notices: Notice[]; checklists: Checklist[] };

const TYPE_LABEL: Record<string, string> = { open: "오픈", close: "마감", custom: "기타" };

export function Store() {
  const [data, setData] = useState<Overview | null>(null);
  const [openNotice, setOpenNotice] = useState<string | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    api.get<Overview>("/api/store/overview").then(setData);
  }, []);

  if (!data) return <Empty>불러오는 중…</Empty>;

  return (
    <div>
      <h1 className="page-title">매장</h1>
      <p className="muted small">오늘의 체크리스트와 매장 공지입니다.</p>

      {/* 오늘의 체크리스트 */}
      <Section label={`오늘의 체크리스트 · ${data.date}`}>
        {!data.branchScoped ? (
          <Empty>소속 매장이 없어 체크리스트를 표시할 수 없습니다.</Empty>
        ) : data.checklists.length === 0 ? (
          <Empty>등록된 체크리스트가 없습니다.</Empty>
        ) : (
          data.checklists.map((c) => (
            <ListRow
              key={c.id}
              title={
                <>
                  {c.name} <Tag>{TYPE_LABEL[c.type] ?? c.type}</Tag>
                  {c.done && <Tag core>완료</Tag>}
                </>
              }
              sub={`${c.checked} / ${c.total} 완료`}
              onClick={() => nav(`/store/checklist/${c.id}`)}
            />
          ))
        )}
      </Section>

      {/* 공지 */}
      <Section label="공지">
        {data.notices.length === 0 ? (
          <Empty>공지가 없습니다.</Empty>
        ) : (
          data.notices.map((n) => (
            <div key={n.id}>
              <ListRow
                title={
                  <>
                    {n.isPinned && <Tag core>고정</Tag>} {n.title}{" "}
                    {n.scope === "store" ? <Tag>우리 매장</Tag> : <Tag>전체</Tag>}
                  </>
                }
                sub={new Date(n.createdAt).toLocaleDateString("ko-KR") + (n.author ? ` · ${n.author}` : "")}
                onClick={() => setOpenNotice(openNotice === n.id ? null : n.id)}
              />
              {openNotice === n.id && (
                <div className="feedback-block" style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                  {n.body || "(내용 없음)"}
                </div>
              )}
            </div>
          ))
        )}
      </Section>
    </div>
  );
}
