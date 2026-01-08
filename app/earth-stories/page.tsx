/**
 * @file app/earth-stories/page.tsx
 * @description 장고의 지구동화 스토리북 플레이어 페이지
 * 
 * GDWEB 기반 디자인 패턴 적용:
 * - 세련된 레이아웃 및 타이포그래피
 * - 부드러운 애니메이션 및 트랜지션
 * - 반응형 디자인 강화
 * 
 * 주요 기능:
 * 1. YouTube 비디오를 인터랙티브한 방 형태로 재생
 * 2. 선물 상자를 클릭하여 다양한 지구동화 이야기 선택
 * 3. 비디오 종료 시 자동으로 랜덤 재생
 * 4. 계절별 테마 지원 (현재는 겨울 테마)
 */

import { EarthRoom } from "@/components/earth-stories/earth-room"
import { parseEarthVideos } from "@/lib/youtube-server"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "장고의 지구동화 | Flavor Archive",
  description: "전통 전래동화를 동화처럼 들려주는 인터랙티브 스토리북입니다.",
}

export default async function EarthStoriesPage() {
  let videos;

  try {
    videos = await parseEarthVideos();
    console.log(`[EarthStoriesPage] ${videos.length}개의 지구동화 동영상을 로드했습니다.`);
  } catch (error) {
    console.error("[EarthStoriesPage] 지구동화 동영상 로드 실패:", error);
    videos = [];
  }

  return (
    <main className="min-h-screen overflow-hidden relative">
      <EarthRoom videos={videos} />
    </main>
  )
}

