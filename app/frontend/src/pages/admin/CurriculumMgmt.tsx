import { useEffect, useState } from "react";
import { api } from "../../api";
// (single React import; see top)
import { Section, Empty, Button, Tag } from "../../components";

type Lesson = { id: string; title: string; content: string; isRequired: boolean; isActive: boolean; order: number };
type Module = { id: string; title: string; lessons: Lesson[] };
type Course = { id: string; title: string; modules: Module[] };
type Curr = { id: string; title: string; skill: { name: string } | null; courses: Course[] };

export function CurriculumMgmt() {
  const [tree, setTree] = useState<Curr[] | null>(null);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);

  const load = () => api.get<Curr[]>("/api/admin/curricula").then(setTree);
  useEffect(() => {
    load();
  }, []);

  async function saveLesson(l: Lesson) {
    await api.patch(`/api/admin/lessons/${l.id}`, { title: l.title, content: l.content, isRequired: l.isRequired, isActive: l.isActive });
    setEditing(null);
    await load();
  }
  async function addLesson(moduleId: string, title: string, content: string) {
    await api.post("/api/admin/lessons", { moduleId, title, content });
    setAddingTo(null);
    await load();
  }

  if (!tree) return <Empty>불러오는 중…</Empty>;

  return (
    <div>
      <h1 className="page-title">커리큘럼 관리</h1>
      <p className="muted small">모든 교육 내용은 데이터입니다. 코드 수정 없이 여기서 편집합니다.</p>

      {tree.map((c) => (
        <Section key={c.id} label={c.skill ? `${c.title} · ${c.skill.name}` : c.title}>
          {c.courses.map((co) =>
            co.modules.map((m) => (
              <div key={m.id} style={{ marginBottom: 16 }}>
                <div className="small faint" style={{ margin: "8px 0" }}>
                  {co.title} › {m.title}
                </div>
                {m.lessons.map((l) =>
                  editing?.id === l.id ? (
                    <LessonEditor key={l.id} lesson={editing} onChange={setEditing} onSave={() => saveLesson(editing)} onCancel={() => setEditing(null)} />
                  ) : (
                    <div className="row" key={l.id}>
                      <div className="row-main">
                        <div className="row-title">
                          {l.title} {l.isRequired ? <Tag>필수</Tag> : <Tag>선택</Tag>} {!l.isActive && <Tag>비활성</Tag>}
                        </div>
                        <div className="row-sub">{l.content.slice(0, 60)}</div>
                      </div>
                      <Button ghost onClick={() => setEditing(l)}>
                        편집
                      </Button>
                    </div>
                  ),
                )}
                {addingTo === m.id ? (
                  <NewLesson onAdd={(t, ct) => addLesson(m.id, t, ct)} onCancel={() => setAddingTo(null)} />
                ) : (
                  <div style={{ marginTop: 8 }}>
                    <Button ghost onClick={() => setAddingTo(m.id)}>
                      + 레슨 추가
                    </Button>
                  </div>
                )}
              </div>
            )),
          )}
        </Section>
      ))}
    </div>
  );
}

function LessonEditor({
  lesson,
  onChange,
  onSave,
  onCancel,
}: {
  lesson: Lesson;
  onChange: (l: Lesson) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="feedback-block">
      <label className="field">
        <span className="lbl">제목</span>
        <input value={lesson.title} onChange={(e) => onChange({ ...lesson, title: e.target.value })} />
      </label>
      <label className="field">
        <span className="lbl">교육 내용</span>
        <textarea value={lesson.content} onChange={(e) => onChange({ ...lesson, content: e.target.value })} />
      </label>
      <label className="small" style={{ display: "block", marginBottom: 8 }}>
        <input type="checkbox" style={{ width: "auto", marginRight: 8 }} checked={lesson.isRequired} onChange={(e) => onChange({ ...lesson, isRequired: e.target.checked })} />
        필수 레슨
      </label>
      <label className="small" style={{ display: "block", marginBottom: 12 }}>
        <input type="checkbox" style={{ width: "auto", marginRight: 8 }} checked={lesson.isActive} onChange={(e) => onChange({ ...lesson, isActive: e.target.checked })} />
        활성
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <Button onClick={onSave}>저장</Button>
        <Button ghost onClick={onCancel}>
          취소
        </Button>
      </div>
    </div>
  );
}

function NewLesson({ onAdd, onCancel }: { onAdd: (title: string, content: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  return (
    <div className="feedback-block">
      <label className="field">
        <span className="lbl">새 레슨 제목</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="field">
        <span className="lbl">교육 내용</span>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} />
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <Button onClick={() => onAdd(title, content)} disabled={!title}>
          추가
        </Button>
        <Button ghost onClick={onCancel}>
          취소
        </Button>
      </div>
    </div>
  );
}
