/**
 * @file app/admin/page.tsx
 * @description 관리자 콘솔 초기 Overview 페이지의 임시 콘텐츠.
 * 레이아웃 기능 검증을 위해 핵심 카드/상태 요약을 노출합니다.
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const overviewMetrics = [
  { label: "오늘 생성된 AI 식단", value: "128건", delta: "+12% vs 어제" },
  { label: "활성 팝업", value: "3건", delta: "1건 예정" },
  { label: "미확인 알림 실패", value: "2건", delta: "조치 필요" },
];

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {overviewMetrics.map((metric) => (
          <Card
            key={metric.label}
            className="border border-orange-100 bg-white shadow-sm"
          >
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wide text-slate-500">
                {metric.label}
              </CardDescription>
              <CardTitle className="text-2xl text-slate-900">
                {metric.value}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">{metric.delta}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">빠른 안내</CardTitle>
          <CardDescription>
            좌측 네비게이션에서 페이지 문구, 팝업, 보안 설정을 순차적으로
            구성하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-2 text-sm text-slate-600">
            <li>페이지 문구 모듈에서 최신 카피 블록을 불러옵니다.</li>
            <li>팝업 공지 탭에서 미리보기 후 배포 상태를 확인하세요.</li>
            <li>보안 탭에서 2FA 및 세션 모니터링을 활성화합니다.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}






















