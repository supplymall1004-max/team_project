/**
 * @file app/health/family/[memberId]/page.tsx
 * @description 가족 구성원별 건강 상세 페이지
 *
 * 가족 구성원의 건강 상태를 상세하게 확인할 수 있는 페이지입니다.
 */

import { Suspense } from "react";
import { Section } from "@/components/section";
import { FamilyMemberHealthDetail } from "@/components/health/family-member-health-detail";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorBoundary } from "@/components/error-boundary";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DirectionalEntrance } from "@/components/motion/directional-entrance";

function SectionSkeleton() {
  return (
    <div className="py-12 text-center">
      <LoadingSpinner />
    </div>
  );
}

interface FamilyMemberPageProps {
  params: Promise<{ memberId: string }>;
}

async function FamilyMemberContent({ params }: FamilyMemberPageProps) {
  const { memberId } = await params;

  return (
    <DirectionalEntrance direction="up" delay={0.3}>
      <div className="min-h-screen bg-gray-50">
        <Section className="pt-8">
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/health">
                <ArrowLeft className="h-4 w-4 mr-2" />
                건강 관리로 돌아가기
              </Link>
            </Button>
            <h1 className="text-4xl font-bold mb-2">👤 구성원 건강 상세</h1>
            <p className="text-muted-foreground">
              구성원의 건강 상태를 상세하게 확인하세요
            </p>
          </div>

          <ErrorBoundary>
            <FamilyMemberHealthDetail memberId={memberId} />
          </ErrorBoundary>
        </Section>
      </div>
    </DirectionalEntrance>
  );
}

export default async function FamilyMemberPage({ params }: FamilyMemberPageProps) {
  return (
    <Suspense fallback={<SectionSkeleton />}>
      <FamilyMemberContent params={params} />
    </Suspense>
  );
}

