/**
 * @file lib/youtube-server.ts
 * @description 유튜브 동영상 관련 서버 전용 유틸리티 함수들
 * 
 * 이 파일은 Node.js 모듈(fs, path)을 사용하므로 서버 사이드에서만 사용 가능합니다.
 * 클라이언트 컴포넌트에서는 사용할 수 없습니다.
 */

import fs from "fs";
import path from "path";
import { FoodStoryVideo, extractYouTubeVideoId } from "@/lib/youtube";

/**
 * docs/youtube.md 파일에서 동화 동영상 데이터를 파싱합니다.
 * 파일 형식: "제목 = https://youtube.com/..."
 */
export async function parseFoodStoryVideos(): Promise<FoodStoryVideo[]> {
  const filePath = path.join(process.cwd(), "docs", "youtube.md");

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n").filter(line => line.trim());

    const videos: FoodStoryVideo[] = lines.map((line, index) => {
      const [title, url] = line.split(" = ").map(s => s.trim());

      if (!title || !url) {
        console.warn(`[parseFoodStoryVideos] 잘못된 형식의 라인 발견: ${line}`);
        return null;
      }

      // 유튜브 URL에서 비디오 ID 추출
      const videoId = extractYouTubeVideoId(url);
      if (!videoId) {
        console.warn(`[parseFoodStoryVideos] 유효하지 않은 유튜브 URL: ${url}`);
        return null;
      }

      // 하루에 1개씩 게시되는 로직 (오늘부터 역순으로 날짜 계산)
      const publishedDate = new Date();
      publishedDate.setDate(publishedDate.getDate() - index);

      return {
        id: videoId,
        title,
        url,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        publishedAt: publishedDate.toISOString().split('T')[0], // YYYY-MM-DD 형식
      };
    }).filter(Boolean) as FoodStoryVideo[];

    console.log(`[parseFoodStoryVideos] ${videos.length}개의 동화 동영상을 파싱했습니다.`);
    return videos;
  } catch (error) {
    console.error("[parseFoodStoryVideos] 파일 읽기 실패:", error);
    return [];
  }
}



























