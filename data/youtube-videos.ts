export interface YouTubeVideo {
  id: string
  title?: string
}

// YouTube 쇼츠/비디오 링크에서 ID 추출 헬퍼 함수
export function extractVideoId(url: string): string | null {
  // YouTube Shorts: youtube.com/shorts/VIDEO_ID
  const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/)
  if (shortsMatch) return shortsMatch[1]

  // 일반 YouTube: youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/)
  if (watchMatch) return watchMatch[1]

  // 짧은 링크: youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)
  if (shortMatch) return shortMatch[1]

  return null
}

// 여기에 유튜브 비디오를 추가하세요
// 새 비디오를 추가하려면 아래 배열에 { id: "비디오ID", title: "제목(선택)" } 형식으로 추가하면 됩니다
export const youtubeVideos: YouTubeVideo[] = [
  { id: "pkx6W1QUajs", title: "막걸리 이야기" },
  { id: "ygXHb45isgM", title: "떡 이야기" },
  { id: "mJtFFjqNTTU", title: "된장 간장 고추장 이야기" },
  { id: "EdemvejVq3E", title: "불고기의 탄생" },
  { id: "UOLG6eD-dZg", title: "김치의 탄생" },
  { id: "Zvx_RHU80Wk", title: "비빔밥 이야기" },
  { id: "oCUeJqK0P4s", title: "설렁탕 이야기" },
  { id: "HEX0_Hd0_qs", title: "쌀 이야기" },
  { id: "B0ukBaT9MLA", title: "잡채 이야기" },
  { id: "uq5Xjm6dNwQ", title: "젓갈 이야기" },
  { id: "uU2Y8y-snuA", title: "마파두부 이야기" },
  { id: "-4OqxL1lqK8", title: "스테이크 이야기" },
  { id: "xQwR2BQHWdU", title: "짜장면 이야기" },
  { id: "35Zr2YAXV84", title: "카레 이야기" },
  { id: "FNNDaY4M-to", title: "피자 이야기" },
]

// 비디오 ID로 임베드 URL 생성
export function getEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`
}

// 비디오 ID로 썸네일 URL 생성
export function getThumbnailUrl(videoId: string, quality: "default" | "medium" | "high" | "maxres" = "high"): string {
  const qualityMap = {
    default: "default",
    medium: "mqdefault",
    high: "hqdefault",
    maxres: "maxresdefault",
  }
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`
}



