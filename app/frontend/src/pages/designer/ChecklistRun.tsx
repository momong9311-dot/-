import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api";
import { Empty, Button, Tag, Back } from "../../components";

type Data = {
  id: string;
  name: string;
  type: string;
  date: string;
  items: { id: string; label: string }[];
  checkedItemIds: string[];
  note: string;
};

const TYPE_LABEL: Record<string, string> = { open: "오픈", close: "마감", custom: "기타" };

export function ChecklistRun() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<Data | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    api.get<Data>(`/api/store/checklist/${id}`).then((d) => {
      setData(d);
      setChecked(new Set(d.checkedItemIds));
      setNote(d.note);
    });
  }, [id]);

  function toggle(itemId: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      await api.post(`/api/store/checklist/${id}`, { checkedItemIds: [...checked], note });
      setSavedAt(new Date().toLocaleTimeString("ko-KR"));
    } finally {
      setSaving(false);
    }
  }

  if (!data) return <Empty>불러오는 중…</Empty>;

  const doneCount = data.items.filter((i) => checked.has(i.id)).length;

  return (
    <div>
      <Back to="/store" />
      <h1 className="page-title">
        {data.name} <Tag>{TYPE_LABEL[data.type] ?? data.type}</Tag>
      </h1>
      <p className="muted small">
        {data.date} · {doneCount} / {data.items.length} 완료
      </p>

      <div style={{ marginTop: 12 }}>
        {data.items.map((it) => {
          const on = checked.has(it.id);
          return (
            <div
              key={it.id}
              className="row link"
              onClick={() => toggle(it.id)}
              style={{ alignItems: "center" }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  border: "1.5px solid #111",
                  background: on ? "#111" : "#fff",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                  flexShrink: 0,
                  fontSize: 13,
                }}
              >
                {on ? "✓" : ""}
              </div>
              <div className="row-main">
                <div className="row-title" style={{ color: on ? "#111" : "#555" }}>{it.label}</div>
              </div>
            </div>
          );
        })}
        {data.items.length === 0 && <Empty>항목이 없습니다.</Empty>}
      </div>

      <label className="field" style={{ marginTop: 16 }}>
        <span className="lbl">특이사항 메모 (선택)</span>
        <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="예: 소독액 교체함, 비품 부족 등" />
      </label>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Button onClick={save} disabled={saving}>{saving ? "저장 중…" : "저장"}</Button>
        <Button ghost onClick={() => nav("/store")}>매장으로</Button>
        {savedAt && <span className="small faint">저장됨 · {savedAt}</span>}
      </div>
    </div>
  );
}
