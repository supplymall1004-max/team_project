'use client';

/**
 * @file DiseaseRiskGauge.tsx
 * @description 질병 위험도 게이지 컴포넌트
 *
 * 주요 기능:
 * 1. 심혈관, 당뇨, 신장 등 주요 질병 위험도 표시
 * 2. 게이지 바로 위험 수준 시각화
 * 3. 위험도별 색상 코딩 (녹색-노랑-빨강)
 * 4. 상세 설명 및 개선 방향 제시
 */

import { DiseaseRiskScores } from '@/types/health-visualization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Droplets, Shield, AlertTriangle, Info, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface DiseaseRiskGaugeProps {
  risks: DiseaseRiskScores;
  className?: string;
}

interface DiseaseInfo {
  key: keyof DiseaseRiskScores;
  name: string;
  koreanName: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  riskFactors: string[];
  recommendations: string[];
  color: string;
}

const DISEASE_INFO: DiseaseInfo[] = [
  {
    key: 'cardiovascular',
    name: 'cardiovascular',
    koreanName: '심혈관 질환',
    icon: Heart,
    description: '심장 및 혈관 건강 상태를 나타냅니다.',
    riskFactors: ['고혈압', '고콜레스테롤', '흡연', '비만', '당뇨', '운동 부족'],
    recommendations: [
      '규칙적인 유산소 운동 (주 150분)',
      '염분 섭취 제한 (하루 2,300mg 이하)',
      '채소와 과일 중심 식단',
      '금연 및 절주'
    ],
    color: '#EF4444'
  },
  {
    key: 'diabetes',
    name: 'diabetes',
    koreanName: '당뇨병',
    icon: Droplets,
    description: '혈당 조절 능력을 나타냅니다.',
    riskFactors: ['비만', '운동 부족', '가족력', '인슐린 저항성', '임신성 당뇨'],
    recommendations: [
      '저GI 식품 섭취 (통곡물, 채소 위주)',
      '규칙적인 식사 시간 준수',
      '체중 관리 및 운동',
      '정기적인 혈당 검사'
    ],
    color: '#F59E0B'
  },
  {
    key: 'kidney',
    name: 'kidney',
    koreanName: '신장 질환',
    icon: Shield,
    description: '신장 기능 상태를 나타냅니다.',
    riskFactors: ['고혈압', '당뇨', '요로 감염', '약물 남용', '가족력'],
    recommendations: [
      '수분 섭취량 조절 (하루 2L 정도)',
      '단백질 섭취량 조절 (체중 kg당 0.8g)',
      '인 및 칼륨 제한 식단',
      '정기적인 신장 기능 검사'
    ],
    color: '#8B5CF6'
  },
  {
    key: 'obesity',
    name: 'obesity',
    koreanName: '비만',
    icon: AlertTriangle,
    description: '체중과 체지방 비율을 고려한 건강 상태입니다.',
    riskFactors: ['과도한 칼로리 섭취', '운동 부족', '유전적 요인', '호르몬 이상'],
    recommendations: [
      '칼로리 균형 맞춘 식단',
      '규칙적인 유산소 및 근력 운동',
      '식사 일지 기록',
      '전문가 상담 및 체중 관리 프로그램'
    ],
    color: '#EC4899'
  },
  {
    key: 'hypertension',
    name: 'hypertension',
    koreanName: '고혈압',
    icon: Heart,
    description: '혈압 상태를 나타냅니다.',
    riskFactors: ['염분 과다 섭취', '스트레스', '비만', '흡연', '유전적 요인'],
    recommendations: [
      '염분 섭취 제한 (하루 2,300mg 이하)',
      '카페인과 알코올 제한',
      '스트레스 관리 및 휴식',
      '규칙적인 혈압 측정'
    ],
    color: '#EF4444'
  }
];

export function DiseaseRiskGauge({ risks, className }: DiseaseRiskGaugeProps) {
  const [expandedDisease, setExpandedDisease] = useState<string | null>(null);

  // 위험도 레벨 평가
  const getRiskLevel = (score: number): { level: string; color: string; bgColor: string } => {
    if (score >= 80) return { level: '높음', color: 'text-red-700', bgColor: 'bg-red-100' };
    if (score >= 60) return { level: '중간', color: 'text-yellow-700', bgColor: 'bg-yellow-100' };
    if (score >= 40) return { level: '주의', color: 'text-orange-700', bgColor: 'bg-orange-100' };
    return { level: '낮음', color: 'text-green-700', bgColor: 'bg-green-100' };
  };

  // 게이지 바 렌더링
  const renderGaugeBar = (score: number, color: string) => {
    const riskLevel = getRiskLevel(score);

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className={`text-sm font-medium ${riskLevel.color}`}>
            {riskLevel.level}
          </span>
          <span className="text-sm text-gray-500">{score}%</span>
        </div>
        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
          {/* 배경 그라데이션 (낮음->높음) */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400" />

          {/* 현재 위험도 표시 */}
          <div
            className="absolute inset-y-0 left-0 transition-all duration-1000 ease-out"
            style={{
              width: `${score}%`,
              backgroundColor: color,
              boxShadow: `0 0 10px ${color}40`
            }}
          />

          {/* 위험 구간 표시선 */}
          <div className="absolute inset-y-0 w-px bg-white left-1/4 opacity-50" />
          <div className="absolute inset-y-0 w-px bg-white left-2/4 opacity-50" />
          <div className="absolute inset-y-0 w-px bg-white left-3/4 opacity-50" />
        </div>

        {/* 범례 */}
        <div className="flex justify-between text-xs text-gray-400">
          <span>낮음</span>
          <span>주의</span>
          <span>중간</span>
          <span>높음</span>
        </div>
      </div>
    );
  };

  // 전체 건강 위험도 계산
  const getOverallRiskLevel = () => {
    const scores = Object.values(risks);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    if (averageScore >= 70) return { level: '위험', color: 'text-red-600', icon: AlertTriangle };
    if (averageScore >= 50) return { level: '주의', color: 'text-yellow-600', icon: AlertTriangle };
    return { level: '양호', color: 'text-green-600', icon: Heart };
  };

  const overallRisk = getOverallRiskLevel();
  const OverallIcon = overallRisk.icon;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          질병 위험도 분석
        </CardTitle>
        <CardDescription>
          주요 질병에 대한 건강 위험도를 확인하세요
        </CardDescription>

        {/* 전체 건강 상태 요약 */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <OverallIcon className={`h-6 w-6 ${overallRisk.color}`} />
            <div>
              <div className={`font-semibold ${overallRisk.color}`}>
                전체 건강 위험도: {overallRisk.level}
              </div>
              <div className="text-sm text-gray-600">
                5개 주요 질병에 대한 평균 위험도 분석 결과입니다.
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {DISEASE_INFO.map((disease) => {
            const score = risks[disease.key];
            const isExpanded = expandedDisease === disease.key;
            const Icon = disease.icon;

            return (
              <div key={disease.key} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 text-gray-600`} />
                    <div>
                      <h4 className="font-medium text-gray-900">{disease.koreanName}</h4>
                      <p className="text-sm text-gray-600">{disease.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{score}%</div>
                    <Badge
                      variant="outline"
                      className={getRiskLevel(score).bgColor + ' ' + getRiskLevel(score).color}
                    >
                      {getRiskLevel(score).level}
                    </Badge>
                  </div>
                </div>

                {/* 게이지 바 */}
                {renderGaugeBar(score, disease.color)}

                {/* 상세 정보 토글 */}
                <div className="mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedDisease(isExpanded ? null : disease.key)}
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      상세 정보 및 개선 방법
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      {/* 위험 요인 */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">주요 위험 요인</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {disease.riskFactors.map((factor, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 개선 권장사항 */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">건강 관리 권장사항</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {disease.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 추가 정보 링크 */}
                      <div className="pt-2">
                        <Button variant="outline" size="sm">
                          자세한 건강 정보 보기
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 건강 관리 팁 */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">💡 건강 관리 팁</h4>
              <p className="text-sm text-blue-800">
                위험도가 높은 영역부터 개선을 시작하세요. 식단, 운동, 생활습관 개선을 통해
                건강 위험도를 낮출 수 있습니다. 정기적인 건강 검진도 중요합니다.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
