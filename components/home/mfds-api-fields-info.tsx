/**
 * @file mfds-api-fields-info.tsx
 * @description 식약처 API 필드 정보 표시 컴포넌트
 *
 * 주요 기능:
 * 1. 식약처 API에서 제공하는 모든 필드를 텍스트로 표시
 * 2. 필드 그룹별로 분류하여 가독성 향상
 * 3. 각 필드의 설명과 용도 표시
 */

import { Section } from "@/components/section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * 필드 정보 타입
 */
interface FieldInfo {
  name: string;
  description: string;
  example: string;
  usage: string;
  category: string;
}

/**
 * 필드 정보 데이터
 */
const fieldData: FieldInfo[] = [
  // 기본 정보
  {
    name: "RCP_SEQ",
    description: "레시피 순번 (고유 ID)",
    example: "1, 2, 100",
    usage: "레시피 상세 조회, 데이터베이스 외래키",
    category: "기본 식별 정보",
  },
  {
    name: "RCP_NM",
    description: "레시피명",
    example: "된장찌개, 김치볶음밥",
    usage: "레시피 검색, 카드 제목 표시",
    category: "기본 식별 정보",
  },
  {
    name: "RCP_WAY2",
    description: "조리방법 (볶음, 끓이기, 굽기 등)",
    example: "볶음, 끓이기, 굽기",
    usage: "레시피 필터링, 카테고리 분류",
    category: "분류 정보",
  },
  {
    name: "RCP_PAT2",
    description: "요리종류 (밥, 국, 찌개, 반찬 등)",
    example: "밥, 국, 찌개, 반찬",
    usage: "레시피 필터링, 카테고리 분류",
    category: "분류 정보",
  },
  // 영양 정보 (필수)
  {
    name: "INFO_ENG",
    description: "칼로리 (kcal)",
    example: "250, 350.5",
    usage: "칼로리 계산, 식단 추천",
    category: "영양 정보 (필수)",
  },
  {
    name: "INFO_CAR",
    description: "탄수화물 (g)",
    example: "45.2, 30",
    usage: "영양소 분석, 다이어트 식단 추천",
    category: "영양 정보 (필수)",
  },
  {
    name: "INFO_PRO",
    description: "단백질 (g)",
    example: "15.3, 20",
    usage: "영양소 분석, 헬스 식단 추천",
    category: "영양 정보 (필수)",
  },
  {
    name: "INFO_FAT",
    description: "지방 (g)",
    example: "8.5, 12",
    usage: "영양소 분석, 저지방 식단 추천",
    category: "영양 정보 (필수)",
  },
  {
    name: "INFO_NA",
    description: "나트륨 (mg)",
    example: "850, 1200",
    usage: "고혈압 환자 식단 추천, 저염식 식단",
    category: "영양 정보 (필수)",
  },
  {
    name: "INFO_FIBER",
    description: "식이섬유 (g)",
    example: "5.2, 8",
    usage: "건강 식단 추천, 변비 예방",
    category: "영양 정보 (필수)",
  },
  // 영양 정보 (선택)
  {
    name: "INFO_K",
    description: "칼륨 (mg) - 옵셔널",
    example: "350, 500",
    usage: "신장질환 환자 식단 추천 (칼륨 제한)",
    category: "영양 정보 (선택)",
  },
  {
    name: "INFO_P",
    description: "인 (mg) - 옵셔널",
    example: "200, 300",
    usage: "신장질환 환자 식단 추천 (인 제한)",
    category: "영양 정보 (선택)",
  },
  {
    name: "INFO_GI",
    description: "GI 지수 (혈당지수) - 옵셔널",
    example: "55, 70",
    usage: "당뇨 환자 식단 추천",
    category: "영양 정보 (선택)",
  },
  // 재료 정보
  {
    name: "RCP_PARTS_DTLS",
    description: "재료 정보 (쉼표 또는 줄바꿈으로 구분)",
    example: "된장 1큰술, 두부 1/2모, 대파 1대",
    usage: "재료 표시, 장보기 리스트 생성",
    category: "재료 정보",
  },
  // 조리 방법
  {
    name: "MANUAL01 ~ MANUAL20",
    description: "단계별 조리 방법 설명 (최대 20단계)",
    example: "된장을 물에 풀어주세요",
    usage: "단계별 조리 가이드, 요리 모드",
    category: "조리 방법 (텍스트)",
  },
  {
    name: "MANUAL_IMG01 ~ MANUAL_IMG20",
    description: "각 조리 단계에 해당하는 이미지 URL",
    example: "http://www.foodsafetykorea.go.kr/uploadimg/...",
    usage: "시각적 조리 가이드",
    category: "조리 방법 (이미지)",
  },
  // 이미지
  {
    name: "ATT_FILE_NO_MAIN",
    description: "레시피의 대표 이미지 URL",
    example: "http://www.foodsafetykorea.go.kr/uploadimg/...",
    usage: "레시피 카드 썸네일, 상세 페이지 메인 이미지",
    category: "이미지",
  },
  {
    name: "ATT_FILE_NO_MK",
    description: "레시피 만드는 법 전체 이미지 URL",
    example: "http://www.foodsafetykorea.go.kr/uploadimg/...",
    usage: "레시피 상세 페이지, 인쇄용 이미지",
    category: "이미지",
  },
];

/**
 * 카테고리별로 필드 그룹화
 */
function groupFieldsByCategory(fields: FieldInfo[]): Record<string, FieldInfo[]> {
  return fields.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = [];
    }
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, FieldInfo[]>);
}

/**
 * 카테고리 색상 매핑
 */
const categoryColors: Record<string, string> = {
  "기본 식별 정보": "bg-blue-100 text-blue-800",
  "분류 정보": "bg-green-100 text-green-800",
  "영양 정보 (필수)": "bg-orange-100 text-orange-800",
  "영양 정보 (선택)": "bg-yellow-100 text-yellow-800",
  "재료 정보": "bg-purple-100 text-purple-800",
  "조리 방법 (텍스트)": "bg-pink-100 text-pink-800",
  "조리 방법 (이미지)": "bg-indigo-100 text-indigo-800",
  "이미지": "bg-teal-100 text-teal-800",
};

export function MfdsApiFieldsInfo() {
  const groupedFields = groupFieldsByCategory(fieldData);

  return (
    <Section
      id="mfds-api-fields"
      title="📋 식약처 API 필드 정보"
      description="식약처 레시피 API에서 제공하는 모든 필드에 대한 상세 정보입니다."
    >
      <div className="space-y-6">
        {Object.entries(groupedFields).map(([category, fields]) => (
          <Card key={category} className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{category}</CardTitle>
                <Badge className={categoryColors[category] || "bg-gray-100 text-gray-800"}>
                  {fields.length}개 필드
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fields.map((field) => (
                  <div
                    key={field.name}
                    className="border-l-4 border-teal-500 pl-4 py-2 bg-gray-50 rounded-r"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{field.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{field.description}</p>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">예시:</span> {field.example}
                          </p>
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">용도:</span> {field.usage}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}

