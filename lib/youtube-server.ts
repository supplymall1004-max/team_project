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

// YouTube oEmbed API를 통해 제목을 가져옵니다
// 배포되지 않은 링크의 경우 재시도 로직 포함
// fallbackPrefix: 제목을 가져올 수 없을 때 사용할 접두사 (예: "전래동화", "반전동화")
async function fetchYouTubeTitle(videoId: string, retries = 2, fallbackPrefix = "동화"): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        {
          // 타임아웃 설정 (10초)
          signal: AbortSignal.timeout(10000),
        }
      );
      
      if (!response.ok) {
        // 404는 비디오가 없거나 비공개인 경우
        if (response.status === 404) {
          console.warn(`[fetchYouTubeTitle] 비디오를 찾을 수 없음 (${videoId}): 비공개이거나 삭제됨`);
          // 배포되지 않은 링크의 경우 임시 제목 반환
          // 나중에 배포되면 페이지 새로고침 시 자동으로 제목이 업데이트됨
          return `${fallbackPrefix} ${videoId}`;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const title = data.title || `${fallbackPrefix} ${videoId}`;
      
      // 제목이 성공적으로 가져와졌으면 반환
      if (title && !title.includes(videoId)) {
        return title;
      }
      
      // 제목이 비어있거나 videoId만 포함된 경우 재시도
      if (attempt < retries) {
        console.log(`[fetchYouTubeTitle] 제목 가져오기 재시도 (${videoId}): ${attempt + 1}/${retries}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // 지수 백오프
        continue;
      }
      
      return title;
    } catch (error) {
      // 네트워크 오류나 타임아웃의 경우 재시도
      if (attempt < retries && (error instanceof TypeError || error instanceof Error)) {
        console.log(`[fetchYouTubeTitle] 네트워크 오류 재시도 (${videoId}): ${attempt + 1}/${retries}`, error);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // 지수 백오프
        continue;
      }
      
      console.warn(`[fetchYouTubeTitle] 제목 가져오기 실패 (${videoId}):`, error);
      // 배포되지 않은 링크의 경우 임시 제목 반환
      // 나중에 배포되면 페이지 새로고침 시 자동으로 제목이 업데이트됨
      return `${fallbackPrefix} ${videoId}`;
    }
  }
  
  // 모든 재시도 실패 시 임시 제목 반환
  // 배포 후 페이지 새로고침 시 자동으로 제목이 업데이트됨
  return `${fallbackPrefix} ${videoId}`;
}

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

/**
 * docs/youtube-folktales.md 파일에서 전래동화 동영상 데이터를 파싱합니다.
 * 파일 형식: "https://youtube.com/..." (제목 없이 링크만)
 * 중복된 동영상은 첫 번째 것만 유지합니다.
 */
export async function parseFolktaleVideos(): Promise<FoodStoryVideo[]> {
  const filePath = path.join(process.cwd(), "docs", "youtube-folktales.md");

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n").filter(line => line.trim());

    // 먼저 모든 비디오 ID를 추출하여 중복 확인
    const videoIdMap = new Map<string, { url: string; index: number }>();
    
    lines.forEach((line, index) => {
      const url = line.trim();
      if (!url) return;

      const videoId = extractYouTubeVideoId(url);
      if (!videoId) return;

      // 중복되지 않은 경우만 추가 (첫 번째 것만 유지)
      if (!videoIdMap.has(videoId)) {
        videoIdMap.set(videoId, { url, index });
      } else {
        console.log(`[parseFolktaleVideos] 중복된 동영상 제거: ${videoId} (인덱스 ${index + 1})`);
      }
    });

    // 중복 제거된 비디오들만 처리
    const uniqueVideos = Array.from(videoIdMap.entries()).map(([videoId, { url }]) => ({
      videoId,
      url,
    }));

    const videos: FoodStoryVideo[] = await Promise.all(
      uniqueVideos.map(async ({ videoId, url }, index) => {
        // YouTube oEmbed API를 통해 제목 가져오기
        // 배포되지 않은 링크의 경우 재시도 로직 포함
        // 나중에 배포되면 페이지 새로고침 시 자동으로 제목이 업데이트됨
        const title = await fetchYouTubeTitle(videoId, 2, "전래동화");

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
      })
    );

    const validVideos = videos.filter(Boolean) as FoodStoryVideo[];
    console.log(`[parseFolktaleVideos] ${validVideos.length}개의 전래동화 동영상을 파싱했습니다. (중복 제거: ${lines.length - validVideos.length}개)`);
    return validVideos;
  } catch (error) {
    console.error("[parseFolktaleVideos] 파일 읽기 실패:", error);
    return [];
  }
}

/**
 * docs/youtube-reversal.md 파일에서 반전동화 동영상 데이터를 파싱합니다.
 * 파일 형식: "https://youtube.com/..." (제목 없이 링크만)
 * 중복된 동영상은 첫 번째 것만 유지합니다.
 * 배포되지 않은 링크도 나중에 제목이 자연스럽게 들어갈 수 있도록 처리합니다.
 */
export async function parseReversalVideos(): Promise<FoodStoryVideo[]> {
  const filePath = path.join(process.cwd(), "docs", "youtube-reversal.md");

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n").filter(line => line.trim());

    // 먼저 모든 비디오 ID를 추출하여 중복 확인
    const videoIdMap = new Map<string, { url: string; index: number }>();
    
    lines.forEach((line, index) => {
      const url = line.trim();
      if (!url) return;

      const videoId = extractYouTubeVideoId(url);
      if (!videoId) return;

      // 중복되지 않은 경우만 추가 (첫 번째 것만 유지)
      if (!videoIdMap.has(videoId)) {
        videoIdMap.set(videoId, { url, index });
      } else {
        console.log(`[parseReversalVideos] 중복된 동영상 제거: ${videoId} (인덱스 ${index + 1})`);
      }
    });

    // 중복 제거된 비디오들만 처리
    const uniqueVideos = Array.from(videoIdMap.entries()).map(([videoId, { url }]) => ({
      videoId,
      url,
    }));

    const videos: FoodStoryVideo[] = await Promise.all(
      uniqueVideos.map(async ({ videoId, url }, index) => {
        // YouTube oEmbed API를 통해 제목 가져오기
        // 배포되지 않은 링크의 경우 재시도 로직 포함
        // 나중에 배포되면 페이지 새로고침 시 자동으로 제목이 업데이트됨
        const title = await fetchYouTubeTitle(videoId, 2, "반전동화");

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
      })
    );

    const validVideos = videos.filter(Boolean) as FoodStoryVideo[];
    console.log(`[parseReversalVideos] ${validVideos.length}개의 반전동화 동영상을 파싱했습니다. (중복 제거: ${lines.length - validVideos.length}개)`);
    return validVideos;
  } catch (error) {
    console.error("[parseReversalVideos] 파일 읽기 실패:", error);
    return [];
  }
}

/**
 * docs/youtube-earth.md 파일에서 지구동화 동영상 데이터를 파싱합니다.
 * 파일 형식: "https://youtube.com/..." (제목 없이 링크만)
 * 중복된 동영상은 첫 번째 것만 유지합니다.
 * 배포되지 않은 링크도 나중에 제목이 자연스럽게 들어갈 수 있도록 처리합니다.
 */
export async function parseEarthVideos(): Promise<FoodStoryVideo[]> {
  const filePath = path.join(process.cwd(), "docs", "youtube-earth.md");

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n").filter(line => line.trim());

    // 먼저 모든 비디오 ID를 추출하여 중복 확인
    const videoIdMap = new Map<string, { url: string; index: number }>();
    
    lines.forEach((line, index) => {
      const url = line.trim();
      if (!url) return;

      const videoId = extractYouTubeVideoId(url);
      if (!videoId) return;

      // 중복되지 않은 경우만 추가 (첫 번째 것만 유지)
      if (!videoIdMap.has(videoId)) {
        videoIdMap.set(videoId, { url, index });
      } else {
        console.log(`[parseEarthVideos] 중복된 동영상 제거: ${videoId} (인덱스 ${index + 1})`);
      }
    });

    // 중복 제거된 비디오들만 처리
    const uniqueVideos = Array.from(videoIdMap.entries()).map(([videoId, { url }]) => ({
      videoId,
      url,
    }));

    const videos: FoodStoryVideo[] = await Promise.all(
      uniqueVideos.map(async ({ videoId, url }) => {
        // YouTube oEmbed API를 통해 제목 가져오기
        // 배포되지 않은 링크의 경우 재시도 로직 포함
        // 나중에 배포되면 페이지 새로고침 시 자동으로 제목이 업데이트됨
        const title = await fetchYouTubeTitle(videoId, 2, "지구동화");

        return {
          id: videoId,
          title,
          url,
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          publishedAt: new Date().toISOString().split('T')[0], // 임시 날짜, 사용되지 않음
        };
      })
    );

    const validVideos = videos.filter(Boolean) as FoodStoryVideo[];
    console.log(`[parseEarthVideos] ${validVideos.length}개의 지구동화 동영상을 파싱했습니다. (중복 제거: ${lines.length - validVideos.length}개)`);
    return validVideos;
  } catch (error) {
    console.error("[parseEarthVideos] 파일 읽기 실패:", error);
    return [];
  }
}























