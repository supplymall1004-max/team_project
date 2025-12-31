/**
 * @file components/settings/api-keys/api-key-guide.tsx
 * @description API 키 발급 가이드 컴포넌트
 *
 * 각 API별 발급 방법을 안내하는 컴포넌트입니다.
 */

"use client";

import { type ApiType } from "@/types/api-keys";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

interface ApiKeyGuideProps {
  apiType: ApiType;
}

export function ApiKeyGuide({ apiType }: ApiKeyGuideProps) {
  const guides: Record<ApiType, { title: string; steps: string[]; links: Array<{ text: string; url: string }> }> = {
    gemini: {
      title: "Google Gemini API 키 발급 방법",
      steps: [
        "Google AI Studio (https://aistudio.google.com/)에 접속합니다",
        "Google 계정으로 로그인합니다",
        "좌측 메뉴에서 'Get API key'를 클릭합니다",
        "'Create API key'를 클릭하여 새 키를 생성합니다",
        "생성된 API 키를 복사하여 아래 입력란에 붙여넣습니다",
      ],
      links: [
        { text: "Google AI Studio", url: "https://aistudio.google.com/" },
        { text: "Gemini API 문서", url: "https://ai.google.dev/docs" },
      ],
    },
    naver_map: {
      title: "네이버 지도 API 키 발급 방법",
      steps: [
        "네이버 클라우드 플랫폼 (https://www.ncloud.com/)에 접속합니다",
        "회원가입 또는 로그인을 진행합니다",
        "AI·Application Service → Maps 메뉴로 이동합니다",
        "Application을 생성하거나 기존 Application을 선택합니다",
        "서비스 환경 → Web 서비스 URL에 사용할 도메인을 등록합니다 (예: http://localhost:3000)",
        "인증 정보에서 Client ID를 복사하여 아래 입력란에 붙여넣습니다",
      ],
      links: [
        { text: "네이버 클라우드 플랫폼", url: "https://www.ncloud.com/" },
        { text: "Maps API 가이드", url: "https://api.ncloud-docs.com/docs/application-maps-overview" },
      ],
    },
    naver_geocoding: {
      title: "네이버 지오코딩 API 키 발급 방법",
      steps: [
        "네이버 클라우드 플랫폼 (https://www.ncloud.com/)에 접속합니다",
        "회원가입 또는 로그인을 진행합니다",
        "AI·Application Service → Maps 메뉴로 이동합니다",
        "Application을 생성하거나 기존 Application을 선택합니다",
        "Maps API 서비스를 활성화합니다 (2025년 7월 1일부터 새로운 키 필요)",
        "인증 정보에서 Client ID와 Client Secret을 복사합니다",
        "아래 입력란에 Client ID와 Client Secret을 각각 입력합니다",
      ],
      links: [
        { text: "네이버 클라우드 플랫폼", url: "https://www.ncloud.com/" },
        { text: "Maps API 가이드", url: "https://api.ncloud-docs.com/docs/application-maps-overview" },
      ],
    },
    naver_search: {
      title: "네이버 로컬 검색 API 키 발급 방법",
      steps: [
        "네이버 개발자 센터 (https://developers.naver.com/)에 접속합니다",
        "네이버 계정으로 로그인합니다",
        "'내 애플리케이션' 메뉴로 이동합니다",
        "애플리케이션을 등록하거나 기존 애플리케이션을 선택합니다",
        "API 설정 탭에서 '검색' → '로컬 검색' API를 활성화합니다",
        "인증 정보 탭에서 Client ID와 Client Secret을 복사합니다",
        "⚠️ 주의: 네이버 클라우드 플랫폼(NCP) 키와는 다릅니다!",
        "아래 입력란에 Client ID와 Client Secret을 각각 입력합니다",
      ],
      links: [
        { text: "네이버 개발자 센터", url: "https://developers.naver.com/" },
        { text: "로컬 검색 API 문서", url: "https://developers.naver.com/docs/serviceapi/search/local/local.md" },
      ],
    },
    pharmacy: {
      title: "약국 정보 API 키 발급 방법",
      steps: [
        "공공데이터포털 (https://www.data.go.kr/)에 접속합니다",
        "회원가입 또는 로그인을 진행합니다",
        "검색창에 '약국 정보'를 검색합니다",
        "'약국정보서비스' API를 선택합니다",
        "'활용신청' 버튼을 클릭하여 API 사용을 신청합니다",
        "승인 후 '마이페이지' → '활용신청 현황'에서 발급받은 인증키를 확인합니다",
        "인증키를 복사하여 아래 입력란에 붙여넣습니다",
      ],
      links: [
        { text: "공공데이터포털", url: "https://www.data.go.kr/" },
        { text: "약국 정보 API", url: "https://www.data.go.kr/data/15000500/openapi.do" },
      ],
    },
    food_safety: {
      title: "식약처 레시피 API 키 발급 방법",
      steps: [
        "식약처 식품안전나라 (https://www.foodsafetykorea.go.kr/)에 접속합니다",
        "회원가입 또는 로그인을 진행합니다",
        "API 신청 페이지로 이동합니다",
        "레시피 API 사용 신청을 제출합니다",
        "승인 후 발급받은 API 키를 확인합니다",
        "API 키를 복사하여 아래 입력란에 붙여넣습니다",
      ],
      links: [
        { text: "식약처 식품안전나라", url: "https://www.foodsafetykorea.go.kr/" },
      ],
    },
    kcdc: {
      title: "질병관리청 API 키 발급 방법",
      steps: [
        "공공데이터포털 (https://www.data.go.kr/)에 접속합니다",
        "회원가입 또는 로그인을 진행합니다",
        "검색창에 '질병관리청' 또는 '건강정보'를 검색합니다",
        "원하는 API를 선택하고 '활용신청'을 진행합니다",
        "승인 후 '마이페이지' → '활용신청 현황'에서 발급받은 인증키를 확인합니다",
        "인증키를 복사하여 아래 입력란에 붙여넣습니다",
      ],
      links: [
        { text: "공공데이터포털", url: "https://www.data.go.kr/" },
      ],
    },
    weather: {
      title: "기상청 날씨 API 키 발급 방법",
      steps: [
        "공공데이터포털 (https://www.data.go.kr/)에 접속합니다",
        "회원가입 또는 로그인을 진행합니다",
        "검색창에 '기상청' 또는 '날씨'를 검색합니다",
        "원하는 날씨 API를 선택하고 '활용신청'을 진행합니다",
        "승인 후 '마이페이지' → '활용신청 현황'에서 발급받은 인증키를 확인합니다",
        "인증키를 복사하여 아래 입력란에 붙여넣습니다",
      ],
      links: [
        { text: "공공데이터포털", url: "https://www.data.go.kr/" },
        { text: "기상청 날씨 API", url: "https://www.data.go.kr/tcs/dss/selectApiDataDetailView.do?publicDataPk=15057682" },
      ],
    },
  };

  const guide = guides[apiType];

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-lg">{guide.title}</CardTitle>
        <CardDescription>단계별 발급 가이드를 따라 진행하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="list-decimal list-inside space-y-2 text-sm">
          {guide.steps.map((step, index) => (
            <li key={index} className="text-muted-foreground">
              {step}
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2 pt-2">
          {guide.links.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {link.text}
              <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

