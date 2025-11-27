/**
 * @file lib/youtube.ts
 * @description 유튜브 동영상 관련 유틸리티 함수들
 * 
 * 이 파일은 클라이언트와 서버 양쪽에서 사용 가능한 함수들을 포함합니다.
 * 서버 전용 함수는 lib/youtube-server.ts를 참조하세요.
 */

export interface FoodStoryVideo {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  embedUrl: string;
  publishedAt: string; // ISO date string
}

/**
 * 유튜브 URL에서 비디오 ID를 추출합니다.
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * 동화 동영상 데이터를 날짜별로 그룹화합니다.
 */
export function groupFoodStoriesByDate(videos: FoodStoryVideo[]): Record<string, FoodStoryVideo[]> {
  const grouped: Record<string, FoodStoryVideo[]> = {};

  videos.forEach(video => {
    const date = video.publishedAt;
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(video);
  });

  return grouped;
}
