import { useEffect, useState } from "react";
import { api } from "../../api";
import { Section, Empty, Button } from "../../components";

type Feedback = {
  id: string;
  message: string;
  nextAction: string;
  skillName: string | null;
  authorName: string;
  acknowledged: boolean;
  createdAt: string;
};

export function FeedbackPage() {
  const [list, setList] = useState<Feedback[] | null>(null);
  const load = () => api.get<Feedback[]>("/api/designer/feedback").then(setList);
  useEffect(() => {
    load();
  }, []);

  async function ack(id: string) {
    await api.post(`/api/designer/feedback/${id}/acknowledge`);
    await load();
  }

  return (
    <div>
      <h1 className="page-title">피드백</h1>
      <p className="muted small">모든 피드백은 다음 행동(Next Action)으로 이어집니다.</p>
      <Section label="받은 피드백">
        {!list ? (
          <Empty>불러오는 중…</Empty>
        ) : list.length === 0 ? (
          <Empty>아직 피드백이 없습니다.</Empty>
        ) : (
          list.map((f) => (
            <div className="feedback-block" key={f.id}>
              <div className="small faint">
                {f.authorName}
                {f.skillName ? ` · ${f.skillName}` : ""}
              </div>
              <div className="feedback-msg" style={{ marginTop: 4 }}>
                {f.message}
              </div>
              {f.nextAction && (
                <div className="next-action">
                  <span className="label">Next Action</span>
                  <div>{f.nextAction}</div>
                </div>
              )}
              <div style={{ marginTop: 12 }}>
                {f.acknowledged ? (
                  <span className="small faint">확인함</span>
                ) : (
                  <Button ghost onClick={() => ack(f.id)}>
                    확인했습니다
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </Section>
    </div>
  );
}
