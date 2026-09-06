import { useEffect, useState } from "react";
import { api } from "../../api";
import { Section, Empty, Button, Tag } from "../../components";

type ManualItem = {
  id: string;
  categoryId: string;
  title: string;
  summary: string | null;
  content: string;
  targetRoles: string; // JSON string
  isRequired: boolean;
  isPublished: boolean;
  version: number;
  order: number;
  _count?: { readReceipts: number };
};
type Cat = { id: string; name: string; order: number; manuals: ManualItem[] };

const ROLE_OPTIONS: { key: string; label: string }[] = [
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
  summary: string;
  content: string;
  targetRoles: string[];
  isRequired: boolean;
  isPublished: boolean;
};

function parseRoles(s: string): string[] {
  try {
    const a = JSON.parse(s || "[]");
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

export function ManualMgmt() {
  const [tree, setTree] = useState<Cat[] | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [newCat, setNewCat] = useState("");
  const [reads, setReads] = useState<{ title: string; version: number; readCount: number; total: number; rows: { name: string; roleName: string; read: boolean }[] } | null>(null);

  const load = () => api.get<Cat[]>("/api/admin/manuals").then(setTree);
  useEffect(() => {
    load();
  }, []);

  async function addCategory() {
    if (!newCat.trim()) return;
    await api.post("/api/admin/manual-categories", { name: newCat.trim(), order: (tree?.length ?? 0) + 1 });
    setNewCat("");
    await load();
  }

  async function save(d: Draft) {
    const payload = {
      categoryId: d.categoryId,
      title: d.title,
      summary: d.summary,
      content: d.content,
      targetRoles: d.targetRoles,
      isRequired: d.isRequired,
      isPublished: d.isPublished,
    };
    if (d.id) await api.patch(`/api/admin/manuals/${d.id}`, payload);
    else await api.post("/api/admin/manuals", payload);
    setEditing(null);
    await load();
  }

  async function openReads(id: string) {
    setReads(await api.get(`/api/admin/manuals/${id}/reads`));
  }

  if (!tree) return <Empty>불러오는 중…</Empty>;

  return (
    <div>
      <h1 className="page-title">운영 매뉴얼 관리</h1>
      <p className="muted small">모든 매뉴얼 내용은 데이터입니다. 코드 수정 없이 여기서 편집합니다.</p>

      {/* 새 카테고리 */}
      <div className="feedback-block" style={{ marginTop: 12 }}>
        <label className="field">
          <span className="lbl">새 카테고리</span>
          <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="예: 위생 · 안전" />
        </label>
        <Button onClick={addCategory} disabled={!newCat.trim()}>카테고리 추가</Button>
      </div>

      {tree.map((c) => (
        <Section key={c.id} label={c.name}>
          {c.manuals.map((m) => (
            <div className="row" key={m.id}>
              <div className="row-main">
                <div className="row-title">
                  {m.title} {m.isRequired && <Tag core>필독</Tag>} {!m.isPublished && <Tag>비공개</Tag>}
                </div>
                <div className="row-sub">
                  {m.summary || "요약 없음"} · v{m.version}
                  {m.isRequired && ` · 확인 ${m._count?.readReceipts ?? 0}명`}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {m.isRequired && (
                  <Button ghost onClick={() => openReads(m.id)}>확인현황</Button>
                )}
                <Button
                  ghost
                  onClick={() =>
                    setEditing({
                      id: m.id,
                      categoryId: m.categoryId,
                      title: m.title,
                      summary: m.summary ?? "",
                      content: m.content,
                      targetRoles: parseRoles(m.targetRoles),
                      isRequired: m.isRequired,
                      isPublished: m.isPublished,
                    })
                  }
                >
                  편집
                </Button>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 8 }}>
            <Button
              ghost
              onClick={() =>
                setEditing({
                  categoryId: c.id,
                  title: "",
                  summary: "",
                  content: "",
                  targetRoles: [],
                  isRequired: false,
                  isPublished: true,
                })
              }
            >
              + 매뉴얼 추가
            </Button>
          </div>
        </Section>
      ))}

      {editing && (
        <ManualEditor
          draft={editing}
          categories={tree.map((c) => ({ id: c.id, name: c.name }))}
          onChange={setEditing}
          onSave={() => save(editing)}
          onCancel={() => setEditing(null)}
        />
      )}

      {reads && (
        <div className="feedback-block" style={{ marginTop: 16 }}>
          <div className="section-label">
            확인 현황 — {reads.title} (v{reads.version}) · {reads.readCount}/{reads.total}
          </div>
          {reads.rows.map((r, i) => (
            <div className="row" key={i}>
              <div className="row-main">
                <div className="row-title">{r.name}</div>
                <div className="row-sub">{r.roleName}</div>
              </div>
              {r.read ? <Tag core>확인</Tag> : <Tag>미확인</Tag>}
            </div>
          ))}
          <div style={{ marginTop: 8 }}>
            <Button ghost onClick={() => setReads(null)}>닫기</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ManualEditor({
  draft,
  categories,
  onChange,
  onSave,
  onCancel,
}: {
  draft: Draft;
  categories: { id: string; name: string }[];
  onChange: (d: Draft) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const toggleRole = (key: string) => {
    const has = draft.targetRoles.includes(key);
    onChange({
      ...draft,
      targetRoles: has ? draft.targetRoles.filter((r) => r !== key) : [...draft.targetRoles, key],
    });
  };

  return (
    <div className="feedback-block" style={{ marginTop: 16 }}>
      <div className="section-label">{draft.id ? "매뉴얼 편집" : "새 매뉴얼"}</div>

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
        <span className="lbl">한 줄 요약</span>
        <input value={draft.summary} onChange={(e) => onChange({ ...draft, summary: e.target.value })} />
      </label>

      <label className="field">
        <span className="lbl">내용</span>
        <textarea rows={10} value={draft.content} onChange={(e) => onChange({ ...draft, content: e.target.value })} />
      </label>

      <div className="field">
        <span className="lbl">공개 대상 (선택 안 하면 전체)</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {ROLE_OPTIONS.map((r) => (
            <label key={r.key} className="small" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                style={{ width: "auto" }}
                checked={draft.targetRoles.includes(r.key)}
                onChange={() => toggleRole(r.key)}
              />
              {r.label}
            </label>
          ))}
        </div>
      </div>

      <label className="small" style={{ display: "block", marginBottom: 8 }}>
        <input type="checkbox" style={{ width: "auto", marginRight: 8 }} checked={draft.isRequired} onChange={(e) => onChange({ ...draft, isRequired: e.target.checked })} />
        필독 (읽음 확인을 받습니다)
      </label>
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
