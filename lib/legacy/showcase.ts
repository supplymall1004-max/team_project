/**
 * @file showcase.ts
 * @description 레거시 아카이브 섹션에 필요한 데이터를 Supabase에서 조회하거나
 *              실패 시 더미 데이터로 대체하는 헬퍼.
 */

import {
  legacyDocuments as fallbackDocuments,
  legacyVideos as fallbackVideos,
  replacementGuides as fallbackReplacements,
} from "@/data/legacy-content";
import { createPublicSupabaseServerClient } from "@/lib/supabase/public-server";
import {
  LegacyDocument,
  LegacyVideo,
  ReplacementGuide,
} from "@/types/legacy";

interface LegacyVideoRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  duration_minutes: number;
  region: string;
  era: string;
  ingredients: string[];
  thumbnail_url: string;
  video_url: string;
  premium_only: boolean;
  tags: string[];
  master?: {
    name: string;
    region: string;
    title: string;
  } | null;
}

interface LegacyDocumentRow {
  id: string;
  title: string;
  summary: string;
  region: string;
  era: string;
  ingredients: LegacyDocument["ingredients"];
  tools: LegacyDocument["tools"];
  source: LegacyDocument["source"];
  steps: LegacyDocument["steps"];
}

interface ReplacementGuideRow {
  id: string;
  traditional: ReplacementGuide["traditional"];
  modern: ReplacementGuide["modern"];
  tips: string[];
}

export interface LegacyShowcaseData {
  videos: LegacyVideo[];
  documents: LegacyDocument[];
  replacements: ReplacementGuide[];
}

export interface LegacyVideoDetail {
  video: LegacyVideo;
  document: LegacyDocument | null;
  replacements: ReplacementGuide[];
}

const mapVideoRow = (row: LegacyVideoRow): LegacyVideo => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  description: row.description,
  durationMinutes: row.duration_minutes,
  region: row.region,
  era: row.era,
  ingredients: row.ingredients,
  thumbnail: row.thumbnail_url,
  videoUrl: row.video_url,
  premiumOnly: row.premium_only,
  master: row.master ?? {
    name: "미상 명인",
    region: row.region,
    title: "전문가",
  },
  tags: row.tags,
});

const mapDocumentRow = (row: LegacyDocumentRow): LegacyDocument => ({
  id: row.id,
  title: row.title,
  summary: row.summary,
  region: row.region,
  era: row.era,
  ingredients: row.ingredients,
  tools: row.tools,
  source: row.source,
  steps: row.steps,
});

const mapReplacementRow = (row: ReplacementGuideRow): ReplacementGuide => ({
  traditional: row.traditional,
  modern: row.modern,
  tips: row.tips,
});

export async function getLegacyShowcaseData(): Promise<LegacyShowcaseData> {
  // 성능 최적화: 프로덕션에서는 로그 최소화
  if (process.env.NODE_ENV === "development") {
    console.groupCollapsed("[LegacyShowcase] 데이터 조회");
  }
  const supabase = createPublicSupabaseServerClient();

  try {
    const [videoResult, documentResult, replacementResult] = await Promise.all([
      supabase
        .from("legacy_videos")
        .select(
          "id, slug, title, description, duration_minutes, region, era, ingredients, thumbnail_url, video_url, premium_only, tags, master:legacy_masters(name, region, title)",
        )
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("legacy_documents")
        .select(
          "id, title, summary, region, era, ingredients, tools, source, steps",
        )
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("legacy_replacement_guides")
        .select("id, traditional, modern, tips")
        .limit(5),
    ]);

    if (videoResult.error || documentResult.error || replacementResult.error) {
      throw (
        videoResult.error ?? documentResult.error ?? replacementResult.error
      );
    }

    const payload: LegacyShowcaseData = {
      videos: (videoResult.data ?? []).map(mapVideoRow),
      documents: (documentResult.data ?? []).map(mapDocumentRow),
      replacements: (replacementResult.data ?? []).map(mapReplacementRow),
    };

    if (process.env.NODE_ENV === "development") {
      console.log("source", "supabase");
      console.groupEnd();
    }
    return payload;
  } catch (error) {
    console.error("[LegacyShowcase] Supabase 조회 실패", error);
    if (process.env.NODE_ENV === "development") {
      console.log("source", "fallback");
      console.groupEnd();
    }
    return {
      videos: fallbackVideos,
      documents: fallbackDocuments,
      replacements: fallbackReplacements,
    };
  }
}

export async function getLegacyVideoDetail(
  slug: string,
): Promise<LegacyVideoDetail | null> {
  console.groupCollapsed("[LegacyShowcase] 단일 영상 조회");
  console.log("slug", slug);
  const supabase = createPublicSupabaseServerClient();

  try {
    const { data: videoRow, error: videoError } = await supabase
      .from("legacy_videos")
      .select(
        "id, slug, title, description, duration_minutes, region, era, ingredients, thumbnail_url, video_url, premium_only, tags, master:legacy_masters(name, region, title)",
      )
      .eq("slug", slug)
      .maybeSingle();

    if (videoError || !videoRow) {
      throw videoError ?? new Error("Video not found");
    }

    const videoRowTyped = videoRow as any;
    const { data: documentRow } = await supabase
      .from("legacy_documents")
      .select(
        "id, title, summary, region, era, ingredients, tools, source, steps",
      )
      .eq("video_id", videoRowTyped.id)
      .maybeSingle();

    const { data: replacementRows } = await supabase
      .from("legacy_replacement_guides")
      .select("id, traditional, modern, tips")
      .limit(5);

    const payload: LegacyVideoDetail = {
      video: mapVideoRow(videoRowTyped),
      document: documentRow ? mapDocumentRow(documentRow as any) : null,
      replacements: (replacementRows ?? []).map(mapReplacementRow),
    };

    console.log("source", "supabase");
    console.groupEnd();
    return payload;
  } catch (error) {
    console.error("[LegacyShowcase] 단일 조회 실패", error);
    const videoFallback = fallbackVideos.find((item) => item.slug === slug);
    if (!videoFallback) {
      console.groupEnd();
      return null;
    }

    const documentFallback =
      fallbackDocuments.find((doc) =>
        videoFallback.ingredients.some((ingredient) =>
          doc.ingredients.some((docIngredient) =>
            docIngredient.name.includes(ingredient),
          ),
        ),
      ) ?? null;

    console.log("source", "fallback");
    console.groupEnd();
    return {
      video: videoFallback,
      document: documentFallback,
      replacements: fallbackReplacements,
    };
  }
}

