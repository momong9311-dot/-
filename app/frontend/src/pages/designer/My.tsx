import { useNavigate } from "react-router-dom";
import { useAuth, isManager } from "../../auth";
import { Section, ListRow } from "../../components";

export function My() {
  const { me, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div>
      <h1 className="page-title">MY</h1>
      <p className="muted small">
        {me?.name} · {me?.roleName}
        <br />
        {me?.email}
      </p>

      <Section label="내 활동">
        <ListRow title="받은 피드백" sub="다음 행동으로 연결됩니다" onClick={() => nav("/feedback")} />
        <ListRow title="내 실습" sub="제출한 실습 기록" onClick={() => nav("/practice")} />
        <ListRow title="내 사례" sub="실제 고객 적용 기록" onClick={() => nav("/cases")} />
        <ListRow title="내 역량 성장" sub="Skill별 성장 상태" onClick={() => nav("/growth")} />
      </Section>

      {isManager(me?.roleKey) && (
        <Section label="관리">
          <ListRow title="관리자 화면" sub="디자이너 현황 · 평가 · 사례 · 커리큘럼" onClick={() => nav("/admin")} />
        </Section>
      )}

      <Section label="계정">
        <ListRow title="로그아웃" onClick={() => logout()} />
      </Section>
    </div>
  );
}
