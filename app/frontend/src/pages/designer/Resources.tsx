import { useEffect, useState } from "react";
import { api } from "../../api";
import { Section, Empty, Tag, Back } from "../../components";

type Res = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  url: string;
  tags: string[];
  lessonTitle: string | null;
};
type Cat = { id: string; name: string; resources: Res[] };

const TYPE_LABEL: Record<string, string> = {
  video: "영상",
  pdf: "PDF",
  image: "이미지",
  link: "링크",
  doc: "문서",
};

const TYPES = ["", "video", "pdf", "image", "link", "doc"];

export function Resources() {
  const [data, setData] = useState<Cat[] | null>(null);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type) params.set("type", type);
    const t = setTimeout(() => {
      api.get<Cat[]>(`/api/resources${params.toString() ? `?${params}` : ""}`).then(setData);
    }, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [q, type]);

  return (
    <div>
      <Back to="/curriculum" />
      <h1 className="page-title">교육자료실</h1>
      <p className="muted small">교육에 필요한 영상·자료 라이브러리입니다. 항목을 누르면 새 창에서 열립니다.</p>

      <label className="field" style={{ marginTop: 12 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="제목·설명·태그로 검색" />
      </label>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
        {TYPES.map((t) => (
          <button
            key={t || "all"}
            className={`btn${type === t ? "" : " ghost"}`}
            style={{ padding: "6px 12px" }}
            onClick={() => setType(t)}
          >
            {t ? TYPE_LABEL[t] : "전체"}
          </button>
        ))}
      </div>

      {!data ? (
        <Empty>불러오는 중…</Empty>
      ) : data.length === 0 ? (
        <Empty>{q || type ? "조건에 맞는 자료가 없습니다." : "등록된 자료가 없습니다."}</Empty>
      ) : (
        data.map((c) => (
          <Section key={c.id} label={c.name}>
            {c.resources.map((r) => (
              <a
                key={r.id}
                href={r.url || undefined}
                target="_blank"
                rel="noreferrer"
                className={`row${r.url ? " link" : ""}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="row-main">
                  <div className="row-title">
                    {r.title} <Tag>{TYPE_LABEL[r.type] ?? r.type}</Tag>
                  </div>
                  {r.description && <div className="row-sub">{r.description}</div>}
                  {(r.lessonTitle || r.tags.length > 0) && (
                    <div className="small faint" style={{ marginTop: 4 }}>
                      {r.lessonTitle && <>레슨 연결 · {r.lessonTitle}　</>}
                      {r.tags.map((t) => `#${t}`).join(" ")}
                    </div>
                  )}
                </div>
                {r.url && <span className="chev">↗</span>}
              </a>
            ))}
          </Section>
        ))
      )}
    </div>
  );
}
