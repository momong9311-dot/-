import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { Section, ListRow, Empty, Tag } from "../../components";

type Lesson = { id: string; title: string; isRequired: boolean; status: string };
type Module = { id: string; title: string; lessons: Lesson[] };
type Course = { id: string; title: string; modules: Module[] };
type Curr = { id: string; title: string; skillName: string | null; courses: Course[] };

const statusLabel: Record<string, string> = {
  not_started: "시작 전",
  in_progress: "진행 중",
  completed: "완료",
};

export function Curriculum() {
  const [data, setData] = useState<Curr[] | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    api.get<Curr[]>("/api/designer/curricula").then(setData);
  }, []);

  if (!data) return <Empty>불러오는 중…</Empty>;

  return (
    <div>
      <h1 className="page-title">교육</h1>
      <p className="muted small">배정된 커리큘럼과 진행 상태입니다.</p>
      <ListRow
        title="교육자료실"
        sub="영상·PDF·링크 자료 모음"
        onClick={() => nav("/resources")}
      />
      {data.length === 0 && <Empty>배정된 커리큘럼이 없습니다.</Empty>}
      {data.map((c) => (
        <Section key={c.id} label={c.skillName ? `${c.title} · ${c.skillName}` : c.title}>
          {c.courses.map((co) =>
            co.modules.map((m) => (
              <div key={m.id}>
                <div className="small faint" style={{ margin: "8px 0 4px" }}>
                  {co.title} › {m.title}
                </div>
                {m.lessons.map((l) => (
                  <ListRow
                    key={l.id}
                    title={
                      <>
                        {l.title} {l.isRequired ? <Tag>필수</Tag> : <Tag>선택</Tag>}
                      </>
                    }
                    sub={statusLabel[l.status]}
                    onClick={() => nav(`/lesson/${l.id}`)}
                  />
                ))}
              </div>
            )),
          )}
        </Section>
      ))}
    </div>
  );
}
