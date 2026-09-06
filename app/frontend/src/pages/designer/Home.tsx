import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { Section, ListRow, Button, Empty, GrowthRow } from "../../components";

type Home = {
  today: { lessonId: string; lessonTitle: string; curriculumTitle: string; status: string } | null;
  currentFocus: { skillId: string; skillName: string } | null;
  practice: { assignmentId: string; title: string; lessonTitle: string }[];
  feedback: { id: string; message: string; nextAction: string; skillName: string | null; acknowledged: boolean }[];
  growth: {
    skillId: string; skillName: string; isCore: boolean;
    currentLevel: string | null; targetLevel: string | null;
    practiceCount: number; applicationCount: number; evaluationCount: number; feedbackCount: number;
  }[];
  nextStep: string;
};

export function DesignerHome() {
  const [data, setData] = useState<Home | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    api.get<Home>("/api/designer/home").then(setData);
  }, []);

  if (!data) return <Empty>불러오는 중…</Empty>;

  return (
    <div>
      {/* TODAY — the first answer: what should I do now? */}
      <Section label="Today">
        {data.today ? (
          <>
            <ListRow
              title={data.today.lessonTitle}
              sub={data.today.curriculumTitle + (data.today.status === "in_progress" ? " · 진행 중" : "")}
            />
            <div style={{ marginTop: 12 }}>
              <Button onClick={() => nav(`/lesson/${data.today!.lessonId}`)}>계속하기</Button>
            </div>
          </>
        ) : (
          <Empty>오늘 예정된 교육이 없습니다.</Empty>
        )}
      </Section>

      {/* STORE — daily checklists & notices */}
      <Section label="Store">
        <ListRow title="매장" sub="오늘의 체크리스트 · 공지" onClick={() => nav("/store")} />
      </Section>

      {/* CURRENT FOCUS */}
      {data.currentFocus && (
        <Section label="Current Focus">
          <ListRow title={data.currentFocus.skillName} sub="현재 집중 역량" />
        </Section>
      )}

      {/* PRACTICE */}
      <Section label="Practice">
        {data.practice.length ? (
          data.practice.map((p) => (
            <ListRow key={p.assignmentId} title={p.title} sub={p.lessonTitle} onClick={() => nav("/practice")} />
          ))
        ) : (
          <Empty>오늘 해야 할 실습이 없습니다.</Empty>
        )}
      </Section>

      {/* FEEDBACK — always connects to a next action */}
      <Section label="Feedback">
        {data.feedback.length ? (
          data.feedback.map((f) => (
            <div className="feedback-block" key={f.id}>
              <div className="feedback-msg">{f.message}</div>
              {f.nextAction && (
                <div className="next-action">
                  <span className="label">Next Action</span>
                  <div>{f.nextAction}</div>
                </div>
              )}
            </div>
          ))
        ) : (
          <Empty>최근 피드백이 없습니다.</Empty>
        )}
        {data.feedback.length > 0 && (
          <Button ghost onClick={() => nav("/feedback")}>
            피드백 전체 보기
          </Button>
        )}
      </Section>

      {/* MY GROWTH — completion is never shown as growth here */}
      <Section label="My Growth">
        {data.growth.length ? (
          <>
            {data.growth.map((g) => (
              <GrowthRow key={g.skillId} name={g.skillName} {...g} />
            ))}
            <div style={{ marginTop: 12 }}>
              <Button ghost onClick={() => nav("/growth")}>
                성장 상세 보기
              </Button>
            </div>
          </>
        ) : (
          <Empty>아직 역량 데이터가 없습니다.</Empty>
        )}
      </Section>

      {/* NEXT STEP */}
      <Section label="Next Step">
        <ListRow title={data.nextStep} />
      </Section>
    </div>
  );
}
