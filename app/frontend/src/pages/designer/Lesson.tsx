import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import { Section, Button, Empty, Back, Tag } from "../../components";

type Assignment = { id: string; title: string; instructions: string; type: string };
type Lesson = {
  id: string;
  title: string;
  content: string;
  isRequired: boolean;
  estimatedMinutes: number | null;
  skillName: string | null;
  curriculumTitle: string;
  assignments: Assignment[];
  status: string;
  progressPct: number;
};

export function LessonPage() {
  const { id } = useParams();
  const [data, setData] = useState<Lesson | null>(null);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const load = () => api.get<Lesson>(`/api/designer/lessons/${id}`).then(setData);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!data) return <Empty>불러오는 중…</Empty>;

  async function setStatus(status: "in_progress" | "completed") {
    setBusy(true);
    try {
      await api.post(`/api/designer/lessons/${id}/progress`, { status });
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Back to="/curriculum" />
      <div className="small faint">
        {data.curriculumTitle}
        {data.skillName ? ` · ${data.skillName}` : ""}
      </div>
      <h1 className="page-title">{data.title}</h1>
      <div style={{ marginBottom: 12 }}>
        {data.isRequired ? <Tag>필수</Tag> : <Tag>선택</Tag>}{" "}
        {data.estimatedMinutes ? <span className="small muted">약 {data.estimatedMinutes}분</span> : null}{" "}
        <span className="small muted">· {statusLabel(data.status)}</span>
      </div>

      <Section label="Lesson">
        <p style={{ whiteSpace: "pre-wrap" }}>{data.content}</p>
      </Section>

      {/* Learning progress = completion. Explicitly NOT growth. */}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        {data.status !== "completed" && (
          <Button ghost onClick={() => setStatus("in_progress")} disabled={busy}>
            학습 시작
          </Button>
        )}
        <Button onClick={() => setStatus("completed")} disabled={busy}>
          {data.status === "completed" ? "완료됨" : "학습 완료"}
        </Button>
      </div>
      <p className="small faint" style={{ marginTop: 8 }}>
        ※ 학습 완료는 “배웠다”의 기록입니다. 역량 성장은 실습·적용·평가·피드백으로 이어집니다.
      </p>

      {data.assignments.length > 0 && (
        <Section label="Practice">
          {data.assignments.map((a) => (
            <div className="feedback-block" key={a.id}>
              <div className="row-title">{a.title}</div>
              <div className="small muted" style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>
                {a.instructions}
              </div>
              <div style={{ marginTop: 12 }}>
                <Button onClick={() => nav(`/practice?assignmentId=${a.id}&lessonId=${data.id}`)}>실습 제출하기</Button>
              </div>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

function statusLabel(s: string) {
  return { not_started: "시작 전", in_progress: "진행 중", completed: "완료" }[s] ?? s;
}
