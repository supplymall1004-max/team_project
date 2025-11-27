/**
 * @file app/legacy/[slug]/page.tsx
 * @description 명인 인터뷰 상세 페이지. 영상 플레이어, 문서화 기록, 대체재료 가이드 제공.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { Section } from "@/components/section";
import { LegacyVideoCta } from "@/components/legacy/legacy-video-cta";
import { getLegacyVideoDetail } from "@/lib/legacy/showcase";

interface LegacyVideoPageProps {
  params: Promise<{ slug: string }>;
}

export default async function LegacyVideoPage({
  params,
}: LegacyVideoPageProps) {
  const { slug } = await params;
  const detail = await getLegacyVideoDetail(slug);

  if (!detail) {
    notFound();
  }

  const { video, document, replacements } = detail;

  return (
    <div className="space-y-6">
      <Section className="pt-8">
        <div className="mb-4">
          <Link
            href="/legacy"
            className="text-sm text-muted-foreground hover:text-orange-600"
          >
            ← 레거시 목록으로 돌아가기
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-orange-600">
                {video.region} · {video.era}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-bold text-gray-900">
                  {video.title}
                </h1>
                {video.premiumOnly && (
                  <span className="rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-800">
                    프리미엄
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {video.master.name} · {video.master.title}
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-border/60 bg-black/90">
              <video
                className="w-full"
                controls
                preload="metadata"
                poster={video.thumbnail}
              >
                <source src={video.videoUrl} type="video/mp4" />
                브라우저가 video 태그를 지원하지 않습니다.
              </video>
            </div>

            <p className="text-lg text-muted-foreground">{video.description}</p>

            <LegacyVideoCta
              premiumOnly={video.premiumOnly}
              videoSlug={video.slug}
              videoTitle={video.title}
            />

            <div className="rounded-3xl border border-border/60 bg-white/80 p-6">
              <h2 className="text-xl font-semibold">주요 재료 & 태그</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {video.ingredients.map((ingredient) => (
                  <span
                    key={ingredient}
                    className="rounded-full bg-orange-50 px-4 py-1 text-sm font-semibold text-orange-700"
                  >
                    {ingredient}
                  </span>
                ))}
                {video.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border/60 px-4 py-1 text-sm text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {document && (
              <div className="rounded-3xl border border-border/60 bg-white/90 p-6 shadow-sm">
                <p className="text-sm font-semibold text-amber-600">
                  문서화 기록
                </p>
                <h2 className="text-2xl font-bold">{document.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {document.summary}
                </p>

                <div className="mt-4 space-y-3">
                  <h3 className="text-lg font-semibold">조리 단계</h3>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    {document.steps.map((step) => (
                      <li key={step.order} className="flex gap-3">
                        <span className="font-semibold text-orange-600">
                          {step.order}.
                        </span>
                        <span>{step.content}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="mt-4 space-y-2">
                  <h3 className="text-lg font-semibold">재료 고증</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {document.ingredients.map((ingredient) => (
                      <li key={ingredient.name}>
                        <span className="font-semibold text-gray-900">
                          {ingredient.name}
                        </span>
                        {" · "}
                        {ingredient.authenticityNotes}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-border/60 bg-white/90 p-6 shadow-sm">
              <p className="text-sm font-semibold text-emerald-600">
                대체재료 안내
              </p>
              <h2 className="text-2xl font-bold">현대적 적용 팁</h2>
              <div className="mt-4 space-y-4">
                {replacements.map((guide, index) => (
                  <div
                    key={`${guide.traditional.name}-${index}`}
                    className="rounded-2xl border border-border/50 bg-white/80 p-4"
                  >
                    <p className="text-xs font-semibold text-emerald-600">
                      {guide.traditional.name} → {guide.modern.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {guide.traditional.description}
                    </p>
                    <p className="text-sm text-gray-900">
                      대체재료: {guide.modern.availability}
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                      {guide.tips.map((tip) => (
                        <li key={tip}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

