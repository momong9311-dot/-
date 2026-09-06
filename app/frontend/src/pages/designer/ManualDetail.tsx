import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api";
import { Empty, Button, Tag, Back } from "../../components";

type Manual = {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  categoryName: string;
  isRequired: boolean;
  version: number;
  updatedAt: string;
  read: boolean;
};

export function ManualDetail() {
  const { id } = useParams();
  const [m, setM] = useState<Manual | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => api.get<Manual>(`/api/manuals/${id}`).then(setM);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function acknowledge() {
    setSaving(true);
    try {
      await api.post(`/api/manuals/${id}/read`);
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (!m) return <Empty>불러오는 중…</Empty>;

  return (
    <div>
      <Back to="/manuals" />
      <div className="small faint" style={{ margin: "8px 0 4px" }}>{m.categoryName}</div>
      <h1 className="page-title">
        {m.title} {m.isRequired && <Tag core>필독</Tag>}
      </h1>
      {m.summary && <p className="muted small">{m.summary}</p>}

      <div className="lesson-content" style={{ whiteSpace: "pre-wrap", marginTop: 16, lineHeight: 1.75 }}>
        {m.content}
      </div>

      {m.isRequired && (
        <div className="feedback-block" style={{ marginTop: 24 }}>
          {m.read ? (
            <p className="small" style={{ margin: 0 }}>✓ 이 매뉴얼(버전 {m.version})을 확인했습니다.</p>
          ) : (
            <>
              <p className="small" style={{ marginTop: 0 }}>필독 매뉴얼입니다. 내용을 확인한 뒤 아래 버튼을 눌러주세요.</p>
              <Button onClick={acknowledge} disabled={saving}>
                {saving ? "저장 중…" : "확인했습니다"}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
