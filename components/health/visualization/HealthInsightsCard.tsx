'use client';

/**
 * @file HealthInsightsCard.tsx
 * @description 건강 인사이트 카드 컴포넌트
 *
 * 주요 기능:
 * 1. 건강 관련 인사이트 표시
 * 2. 긍정/경고/정보 타입별 시각화
 * 3. 우선순위별 정렬 및 필터링
 * 4. 실행 가능한 인사이트 강조
 */

import { HealthInsight } from '@/types/health-visualization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  Lightbulb,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useState } from 'react';

interface HealthInsightsCardProps {
  insights: HealthInsight[];
  className?: string;
  maxVisible?: number;
  showPriorityFilter?: boolean;
}

export function HealthInsightsCard({
  insights,
  className,
  maxVisible = 5,
  showPriorityFilter = true
}: HealthInsightsCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // 우선순위에 따른 필터링 및 정렬
  const filteredInsights = insights
    .filter(insight => priorityFilter === 'all' || insight.priority === priorityFilter)
    .sort((a, b) => {
      // 우선순위별 정렬 (high -> medium -> low)
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      // 같은 우선순위 내에서는 타입별 정렬 (warning -> positive -> info)
      const typeOrder = { warning: 3, positive: 2, info: 1 };
      return typeOrder[b.type] - typeOrder[a.type];
    });

  const visibleInsights = expanded ? filteredInsights : filteredInsights.slice(0, maxVisible);
  const hasMore = filteredInsights.length > maxVisible;

  // 인사이트 타입별 스타일 및 아이콘
  const getInsightStyles = (type: HealthInsight['type']) => {
    const styles = {
      positive: {
        icon: CheckCircle,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        iconColor: 'text-green-600',
        badgeColor: 'bg-green-100 text-green-800',
        badgeText: '긍정'
      },
      warning: {
        icon: AlertTriangle,
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        iconColor: 'text-yellow-600',
        badgeColor: 'bg-yellow-100 text-yellow-800',
        badgeText: '주의'
      },
      info: {
        icon: Info,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        iconColor: 'text-blue-600',
        badgeColor: 'bg-blue-100 text-blue-800',
        badgeText: '정보'
      }
    };
    return styles[type] || styles.info;
  };

  // 우선순위 스타일
  const getPriorityStyles = (priority: HealthInsight['priority']) => {
    const styles = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-gray-100 text-gray-800'
    };
    return styles[priority] || styles.medium;
  };

  // 우선순위 텍스트
  const getPriorityText = (priority: HealthInsight['priority']) => {
    const texts = {
      high: '높음',
      medium: '중간',
      low: '낮음'
    };
    return texts[priority] || '중간';
  };

  if (insights.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">분석 중</h3>
            <p className="text-gray-500">
              건강 데이터를 분석하여 인사이트를 생성하고 있습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              건강 인사이트
            </CardTitle>
            <CardDescription>
              건강 상태 분석 결과와 개선 방향
            </CardDescription>
          </div>
          {showPriorityFilter && (
            <div className="flex gap-2">
              <Button
                variant={priorityFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPriorityFilter('all')}
              >
                전체
              </Button>
              <Button
                variant={priorityFilter === 'high' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPriorityFilter('high')}
              >
                긴급
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {visibleInsights.map((insight, index) => {
            const styles = getInsightStyles(insight.type);
            const Icon = styles.icon;

            return (
              <div
                key={index}
                className={`p-4 rounded-lg border ${styles.borderColor} ${styles.bgColor} transition-all hover:shadow-sm`}
              >
                <div className="flex items-start gap-3">
                  {/* 아이콘 */}
                  <div className={`flex-shrink-0 ${styles.iconColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={styles.badgeColor}>
                        {styles.badgeText}
                      </Badge>
                      <Badge variant="outline" className={getPriorityStyles(insight.priority)}>
                        {getPriorityText(insight.priority)}
                      </Badge>
                      {insight.actionable && (
                        <Badge variant="outline" className="bg-purple-100 text-purple-800">
                          실행 가능
                        </Badge>
                      )}
                    </div>

                    <h4 className="font-medium text-gray-900 mb-1">
                      {insight.title}
                    </h4>

                    <p className="text-sm text-gray-700 leading-relaxed">
                      {insight.description}
                    </p>

                    {/* 실행 가능할 경우 추가 액션 표시 */}
                    {insight.actionable && (
                      <div className="mt-3">
                        <Button size="sm" variant="outline" className="text-xs">
                          자세히 보기
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* 더 보기/접기 버튼 */}
          {hasMore && (
            <div className="text-center pt-4">
              <Button
                variant="ghost"
                onClick={() => setExpanded(!expanded)}
                className="text-sm"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    접기
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    더 보기 ({filteredInsights.length - maxVisible}개)
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* 요약 통계 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {insights.filter(i => i.type === 'positive').length}
              </div>
              <div className="text-xs text-gray-500">긍정</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {insights.filter(i => i.type === 'warning').length}
              </div>
              <div className="text-xs text-gray-500">주의</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {insights.filter(i => i.type === 'info').length}
              </div>
              <div className="text-xs text-gray-500">정보</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
