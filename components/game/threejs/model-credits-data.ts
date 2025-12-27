/**
 * @file components/game/threejs/model-credits-data.ts
 * @description 3D 모델 출처 데이터
 * 
 * Server Component와 Client Component 모두에서 사용할 수 있도록
 * 데이터만 별도 파일로 분리했습니다.
 */

/**
 * 모델 출처 정보 타입
 */
export interface ModelCredit {
  name: string;
  url: string;
  description?: string;
}

/**
 * 모델 출처 정보 (license.md 기반)
 * CC Attribution 4.0 라이선스
 * 모든 모델은 license.md 파일의 정보를 기반으로 작성되었습니다.
 * 
 * 새로운 모델을 추가할 때는 이 배열에 정보를 추가하면
 * 자동으로 게임 화면 하단과 상세 페이지에 표시됩니다.
 */
export const MODEL_CREDITS: ModelCredit[] = [
  {
    name: "도시뷰",
    url: "https://sketchfab.com/3d-models/city-pack-7-6550e37439814c348e2c884aa740ca3c",
    description: "도시 풍경 3D 모델",
  },
  {
    name: "아파트내부",
    url: "https://sketchfab.com/3d-models/modern-apartment-interior-400c9069181a4342a7142433dfa3466e",
    description: "현대식 아파트 내부 3D 모델",
  },
  {
    name: "세가족",
    url: "https://sketchfab.com/3d-models/peasant-family-2-lowpoly-character-ccf3af01b8744f59b352dfb74af97212",
    description: "가족 캐릭터 3D 모델",
  },
  {
    name: "강아지",
    url: "https://sketchfab.com/3d-models/shiba-faef9fe5ace445e7b2989d1c1ece361c",
    description: "시바견 3D 모델",
  },
  {
    name: "게시판",
    url: "https://sketchfab.com/3d-models/office-decor-memory-board-d78f6842d8e44dd9a9730bfa2e65de52",
    description: "게시판 장식 3D 모델",
  },
];

