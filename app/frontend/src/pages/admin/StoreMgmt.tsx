import { useEffect, useState } from "react";
import { api } from "../../api";
import { Section, Empty, Button, Tag } from "../../components";

type Item = { id: string; label: string; order: number };
type Template = {
  id: string;
  name: string;
  type: string;
  branchId: string | null;
  branch: { name: string } | null;
  isActive: boolean;
  items: Item[];
};
type Notice = {
  id: string;
  title: string;
  body: string;
  branchId: string | null;
  branch: { name: string } | null;
  isPinned: boolean;
  isPublished: boolean;
};
type Branch = { id: string; name: string };
type StoreData = { templates: Template[]; notices: Notice[]; branches: Branch[] };

const TYPE_OPTIONS = [
  { key: "open", label: "오픈" },
  { key: "close", label: "마감" },
  { key: "custom", label: "기타" },
];

export function StoreMgmt() {
  const [data, setData] = useState<StoreData | null>(null);
  const load = () => api.get<StoreData>("/api/admin/store").then(setData);
  useEffect(() => {
    load();
  }, []);

  if (!data) return <Empty>불러오는 중…</Empty>;

  return (
    <div>
      <h1 className="page-title">매장 시스템 관리</h1>
      <p className="muted small">체크리스트와 공지를 관리합니다. 매장을 지정하지 않으면 전체 매장에 적용됩니다.</p>

      <Checklists data={data} reload={load} />
      <Notices data={data} reload={load} />
    </div>
  );
}

// ---------- Checklists ----------
function Checklists({ data, reload }: { data: StoreData; reload: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("open");
  const [branchId, setBranchId] = useState("");

  async function addTemplate() {
    if (!name.trim()) return;
    await api.post("/api/admin/checklist-templates", { name: name.trim(), type, branchId: branchId || null, order: data.templates.length + 1 });
    setName("");
    reload();
  }
  async function addItem(templateId: string, label: string, order: number) {
    await api.post("/api/admin/checklist-items", { templateId, label, order });
    reload();
  }

  return (
    <Section label="체크리스트">
      <div className="feedback-block">
        <label className="field">
          <span className="lbl">새 체크리스트</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 오픈 준비" />
        </label>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {TYPE_OPTIONS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">전체 매장</option>
            {data.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <Button onClick={addTemplate} disabled={!name.trim()}>체크리스트 추가</Button>
      </div>

      {data.templates.map((t) => (
        <TemplateBlock key={t.id} t={t} onAddItem={addItem} reload={reload} />
      ))}
    </Section>
  );
}

function TemplateBlock({ t, onAddItem, reload }: { t: Template; onAddItem: (tid: string, label: string, order: number) => void; reload: () => void }) {
  const [newItem, setNewItem] = useState("");
  const TYPE_LABEL: Record<string, string> = { open: "오픈", close: "마감", custom: "기타" };

  return (
    <div style={{ marginBottom: 16 }}>
      <div className="small faint" style={{ margin: "10px 0 6px" }}>
        {t.name} · {TYPE_LABEL[t.type] ?? t.type} · {t.branch ? t.branch.name : "전체 매장"} {!t.isActive && <Tag>비활성</Tag>}
      </div>
      {t.items.map((it) => (
        <div className="row" key={it.id}>
          <div className="row-main"><div className="row-title" style={{ fontWeight: 400 }}>· {it.label}</div></div>
          <DeleteItemButton id={it.id} reload={reload} />
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="새 항목" style={{ flex: 1 }} />
        <Button
          ghost
          onClick={() => {
            if (newItem.trim()) {
              onAddItem(t.id, newItem.trim(), t.items.length + 1);
              setNewItem("");
            }
          }}
        >
          + 항목
        </Button>
      </div>
    </div>
  );
}

function DeleteItemButton({ id, reload }: { id: string; reload: () => void }) {
  const [busy, setBusy] = useState(false);
  async function del() {
    setBusy(true);
    try {
      await api.del(`/api/admin/checklist-items/${id}`);
      reload();
    } finally {
      setBusy(false);
    }
  }
  return (
    <Button ghost onClick={del} disabled={busy}>삭제</Button>
  );
}

// ---------- Notices ----------
function Notices({ data, reload }: { data: StoreData; reload: () => void }) {
  const empty = { id: "", title: "", body: "", branchId: "", isPinned: false, isPublished: true };
  const [draft, setDraft] = useState<typeof empty | null>(null);

  async function save() {
    if (!draft) return;
    const payload = {
      title: draft.title,
      body: draft.body,
      branchId: draft.branchId || null,
      isPinned: draft.isPinned,
      isPublished: draft.isPublished,
    };
    if (draft.id) await api.patch(`/api/admin/notices/${draft.id}`, payload);
    else await api.post("/api/admin/notices", payload);
    setDraft(null);
    reload();
  }

  return (
    <Section label="공지">
      {data.notices.map((n) => (
        <div className="row" key={n.id}>
          <div className="row-main">
            <div className="row-title">
              {n.isPinned && <Tag core>고정</Tag>} {n.title} {!n.isPublished && <Tag>비공개</Tag>}
            </div>
            <div className="row-sub">{n.branch ? n.branch.name : "전체 매장"}</div>
          </div>
          <Button ghost onClick={() => setDraft({ id: n.id, title: n.title, body: n.body, branchId: n.branchId ?? "", isPinned: n.isPinned, isPublished: n.isPublished })}>
            편집
          </Button>
        </div>
      ))}

      <div style={{ marginTop: 8 }}>
        <Button ghost onClick={() => setDraft({ ...empty })}>+ 공지 추가</Button>
      </div>

      {draft && (
        <div className="feedback-block" style={{ marginTop: 12 }}>
          <div className="section-label">{draft.id ? "공지 편집" : "새 공지"}</div>
          <label className="field">
            <span className="lbl">제목</span>
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </label>
          <label className="field">
            <span className="lbl">내용</span>
            <textarea rows={5} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
          </label>
          <label className="field">
            <span className="lbl">대상 매장</span>
            <select value={draft.branchId} onChange={(e) => setDraft({ ...draft, branchId: e.target.value })}>
              <option value="">전체 매장</option>
              {data.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <label className="small" style={{ display: "block", marginBottom: 8 }}>
            <input type="checkbox" style={{ width: "auto", marginRight: 8 }} checked={draft.isPinned} onChange={(e) => setDraft({ ...draft, isPinned: e.target.checked })} />
            상단 고정
          </label>
          <label className="small" style={{ display: "block", marginBottom: 12 }}>
            <input type="checkbox" style={{ width: "auto", marginRight: 8 }} checked={draft.isPublished} onChange={(e) => setDraft({ ...draft, isPublished: e.target.checked })} />
            공개
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={save} disabled={!draft.title.trim()}>저장</Button>
            <Button ghost onClick={() => setDraft(null)}>취소</Button>
          </div>
        </div>
      )}
    </Section>
  );
}
