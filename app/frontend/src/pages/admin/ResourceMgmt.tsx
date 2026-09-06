import { useEffect, useState } from "react";
import { api } from "../../api";
import { Section, Empty, Button, Tag } from "../../components";

type ResItem = {
  id: string;
  categoryId: string;
  title: string;
  description: string | null;
  type: string;
  url: string;
  tags: string;
  targetRoles: string;
  lessonId: string | null;
  lesson: { id: string; title: string } | null;
  isPublished: boolean;
};
type Cat = { id: string; name: string; resources: ResItem[] };
type LessonOpt = { id: string; label: string };

const TYPE_OPTIONS = [
  { key: "video", label: "영상" },
  { key: "pdf", label: "PDF" },
  { key: "image", label: "이미지" },
  { key: "link", label: "링크" },
  { key: "doc", label: "문서" },
];
const ROLE_OPTIONS = [
  { key: "designer", label: "디자이너" },
  { key: "leader", label: "리더" },
  { key: "educator", label: "교육자" },
  { key: "admin", label: "관리자" },
  { key: "owner", label: "점주" },
];

type Draft = {
  id?: string;
  categoryId: string;
  title: string;
  description: string;
  type: string;
  url: string;
  tags: string; // comma-separated in the form
  targetRoles: string[];
  lessonId: string;
  isPublished: boolean;
};

function parseArr(s: string): string[] {
  try {
    const a = JSON.parse(s || "[]");
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

export function ResourceMgmt() {
  const [tree, setTree] = useState<Cat[] | null>(null);
  const [lessons, setLessons] = useState<LessonOpt[]>([]);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [newCat, setNewCat] = useState("");

  const load = () => api.get<Cat[]>("/api/admin/resources").then(setTree);
  useEffect(() => {
    load();
    api.get<LessonOpt[]>("/api/admin/lessons-flat").then(setLessons);
  }, []);

  async function addCategory() {
    if (!newCat.trim()) return;
    await api.post("/api/admin/resource-categories", { name: newCat.trim(), order: (tree?.length ?? 0) + 1 });
    setNewCat("");
    await load();
  }

  async function save(d: Draft) {
    const payload = {
      categoryId: d.categoryId,
      title: d.title,
      description: d.description,
      type: d.type,
      url: d.url,
      tags: d.tags.split(",").map((t) => t.trim()).filter(Boolean),
      targetRoles: d.targetRoles,
      lessonId: d.lessonId || null,
      isPublished: d.isPublished,
    };
    if (d.id) await api.patch(`/api/admin/resources/${d.id}`, payload);
    else await api.post("/api/admin/resources", payload);
    setEditing(null);
    await load();
  }

  if (!tree) return <Empty>불러오는 중…</Empty>;

  return (
    <div>
      <h1 className="page-title">교육자료실 관리</h1>
      <p className="muted small">영상·PDF·링크 자료를 등록합니다. 자료는 URL로 참조합니다.</p>

      <div className="feedback-block" style={{ marginTop: 12 }}>
        <label className="field">
          <span className="lbl">새 카테고리</span>
          <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="예: 커트 기초 영상" />
        </label>
        <Button onClick={addCategory} disabled={!newCat.trim()}>카테고리 추가</Button>
      </div>

      {tree.map((c) => (
        <Section key={c.id} label={c.name}>
          {c.resources.map((r) => (
            <div className="row" key={r.id}>
              <div className="row-main">
                <div className="row-title">
                  {r.title} <Tag>{TYPE_OPTIONS.find((t) => t.key === r.type)?.label ?? r.type}</Tag>{" "}
                  {!r.isPublished && <Tag>비공개</Tag>}
                </div>
                <div className="row-sub">
                  {r.url || "URL 없음"}
                  {r.lesson && ` · 레슨: ${r.lesson.title}`}
                </div>
              </div>
              <Button
                ghost
                onClick={() =>
                  setEditing({
                    id: r.id,
                    categoryId: r.categoryId,
                    title: r.title,
                    description: r.description ?? "",
                    type: r.type,
                    url: r.url,
                    tags: parseArr(r.tags).join(", "),
                    targetRoles: parseArr(r.targetRoles),
                    lessonId: r.lessonId ?? "",
                    isPublished: r.isPublished,
                  })
                }
              >
                편집
              </Button>
            </div>
          ))}
          <div style={{ marginTop: 8 }}>
            <Button
              ghost
              onClick={() =>
                setEditing({
                  categoryId: c.id,
                  title: "",
                  description: "",
                  type: "link",
                  url: "",
                  tags: "",
                  targetRoles: [],
                  lessonId: "",
                  isPublished: true,
                })
              }
            >
              + 자료 추가
            </Button>
          </div>
        </Section>
      ))}

      {editing && (
        <ResourceEditor
          draft={editing}
          categories={tree.map((c) => ({ id: c.id, name: c.name }))}
          lessons={lessons}
          onChange={setEditing}
          onSave={() => save(editing)}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ResourceEditor({
  draft,
  categories,
  lessons,
  onChange,
  onSave,
  onCancel,
}: {
  draft: Draft;
  categories: { id: string; name: string }[];
  lessons: LessonOpt[];
  onChange: (d: Draft) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const toggleRole = (key: string) => {
    const has = draft.targetRoles.includes(key);
    onChange({ ...draft, targetRoles: has ? draft.targetRoles.filter((r) => r !== key) : [...draft.targetRoles, key] });
  };

  return (
    <div className="feedback-block" style={{ marginTop: 16 }}>
      <div className="section-label">{draft.id ? "자료 편집" : "새 자료"}</div>

      <label className="field">
        <span className="lbl">카테고리</span>
        <select value={draft.categoryId} onChange={(e) => onChange({ ...draft, categoryId: e.target.value })}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="lbl">제목</span>
        <input value={draft.title} onChange={(e) => onChange({ ...draft, title: e.target.value })} />
      </label>

      <label className="field">
        <span className="lbl">설명</span>
        <textarea rows={3} value={draft.description} onChange={(e) => onChange({ ...draft, description: e.target.value })} />
      </label>

      <label className="field">
        <span className="lbl">유형</span>
        <select value={draft.type} onChange={(e) => onChange({ ...draft, type: e.target.value })}>
          {TYPE_OPTIONS.map((t) => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="lbl">URL (영상·PDF·링크 주소)</span>
        <input value={draft.url} onChange={(e) => onChange({ ...draft, url: e.target.value })} placeholder="https://" />
      </label>

      <label className="field">
        <span className="lbl">태그 (쉼표로 구분)</span>
        <input value={draft.tags} onChange={(e) => onChange({ ...draft, tags: e.target.value })} placeholder="커트, 기초" />
      </label>

      <label className="field">
        <span className="lbl">레슨 연결 (선택)</span>
        <select value={draft.lessonId} onChange={(e) => onChange({ ...draft, lessonId: e.target.value })}>
          <option value="">연결 안 함</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </select>
      </label>

      <div className="field">
        <span className="lbl">공개 대상 (선택 안 하면 전체)</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {ROLE_OPTIONS.map((r) => (
            <label key={r.key} className="small" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" style={{ width: "auto" }} checked={draft.targetRoles.includes(r.key)} onChange={() => toggleRole(r.key)} />
              {r.label}
            </label>
          ))}
        </div>
      </div>

      <label className="small" style={{ display: "block", marginBottom: 12 }}>
        <input type="checkbox" style={{ width: "auto", marginRight: 8 }} checked={draft.isPublished} onChange={(e) => onChange({ ...draft, isPublished: e.target.checked })} />
        공개 (체크 해제 시 직원 화면에 안 보임)
      </label>

      <div style={{ display: "flex", gap: 8 }}>
        <Button onClick={onSave} disabled={!draft.title.trim()}>저장</Button>
        <Button ghost onClick={onCancel}>취소</Button>
      </div>
    </div>
  );
}
