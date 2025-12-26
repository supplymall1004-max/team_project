/**
 * @file components/health/pets/pet-lifecycle-events-summary.tsx
 * @description 반려동물 생애주기별 건강 이벤트 요약 컴포넌트
 * 
 * 모든 반려동물의 건강 이벤트를 한눈에 확인할 수 있는 요약 컴포넌트입니다.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PetProfile } from '@/types/pet';
import { PetLifecycleEvent, getEventTypeLabel } from '@/lib/health/pet-lifecycle-events';
import { Calendar, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface PetEventWithPet {
  pet: PetProfile;
  event: PetLifecycleEvent;
  eventDate: Date;
  daysUntil: number;
}

interface PetLifecycleEventsSummaryProps {
  pets: PetProfile[];
}

export function PetLifecycleEventsSummary({ pets }: PetLifecycleEventsSummaryProps) {
  const [events, setEvents] = useState<PetEventWithPet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAllEvents();
  }, [pets]);

  const fetchAllEvents = async () => {
    try {
      setIsLoading(true);
      const allEvents: PetEventWithPet[] = [];

      // 각 반려동물의 이벤트 조회
      for (const pet of pets) {
        try {
          const response = await fetch(`/api/health/pets/${pet.id}/lifecycle-events`);
          if (!response.ok) continue;

          const data = await response.json();
          const petEvents: PetLifecycleEvent[] = data.events || [];

          // 이벤트 예정일 계산 및 정렬
          for (const event of petEvents) {
            const birthDate = new Date(pet.birth_date);
            let eventDate: Date;

            if (event.target_age_months) {
              eventDate = new Date(birthDate);
              eventDate.setMonth(eventDate.getMonth() + event.target_age_months);
            } else if (event.target_age_years) {
              eventDate = new Date(birthDate);
              eventDate.setFullYear(eventDate.getFullYear() + event.target_age_years);
            } else {
              continue;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            eventDate.setHours(0, 0, 0, 0);
            const daysUntil = Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            allEvents.push({
              pet,
              event,
              eventDate,
              daysUntil,
            });
          }
        } catch (error) {
          console.error(`반려동물 ${pet.name}의 이벤트 조회 실패:`, error);
        }
      }

      // 날짜순으로 정렬 (가까운 날짜부터)
      allEvents.sort((a, b) => a.daysUntil - b.daysUntil);
      setEvents(allEvents);
    } catch (error) {
      console.error('이벤트 요약 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getDaysUntilText = (daysUntil: number) => {
    if (daysUntil < 0) {
      return `${Math.abs(daysUntil)}일 지남`;
    } else if (daysUntil === 0) {
      return '오늘';
    } else if (daysUntil === 1) {
      return '내일';
    } else {
      return `${daysUntil}일 후`;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>생애주기별 건강 이벤트 요약</CardTitle>
          <CardDescription>
            반려동물들의 건강 이벤트를 한눈에 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>생애주기별 건강 이벤트 요약</CardTitle>
          <CardDescription>
            반려동물들의 건강 이벤트를 한눈에 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-muted-foreground">
              현재 예정된 건강 이벤트가 없습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 우선순위별로 그룹화
  const urgentEvents = events.filter(e => e.daysUntil <= 30 && e.event.priority === 'high');
  const upcomingEvents = events.filter(e => e.daysUntil > 30 || e.event.priority !== 'high');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          생애주기별 건강 이벤트 요약
        </CardTitle>
        <CardDescription>
          반려동물들의 건강 이벤트를 한눈에 확인하세요 ({events.length}건)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 긴급 이벤트 (30일 이내, 높은 우선순위) */}
        {urgentEvents.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              긴급 이벤트 ({urgentEvents.length}건)
            </h3>
            <div className="space-y-3">
              {urgentEvents.map((item, index) => (
                <EventItem
                  key={`${item.pet.id}-${item.event.event_code}-${index}`}
                  item={item}
                  getPriorityColor={getPriorityColor}
                  getPriorityBadgeColor={getPriorityBadgeColor}
                  getDaysUntilText={getDaysUntilText}
                />
              ))}
            </div>
          </div>
        )}

        {/* 예정된 이벤트 */}
        {upcomingEvents.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              예정된 이벤트 ({upcomingEvents.length}건)
            </h3>
            <div className="space-y-3">
              {upcomingEvents.slice(0, 10).map((item, index) => (
                <EventItem
                  key={`${item.pet.id}-${item.event.event_code}-${index}`}
                  item={item}
                  getPriorityColor={getPriorityColor}
                  getPriorityBadgeColor={getPriorityBadgeColor}
                  getDaysUntilText={getDaysUntilText}
                />
              ))}
            </div>
            {upcomingEvents.length > 10 && (
              <p className="text-xs text-muted-foreground mt-3 text-center">
                외 {upcomingEvents.length - 10}건의 이벤트가 더 있습니다
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface EventItemProps {
  item: PetEventWithPet;
  getPriorityColor: (priority: string) => string;
  getPriorityBadgeColor: (priority: string) => string;
  getDaysUntilText: (daysUntil: number) => string;
}

function EventItem({ item, getPriorityColor, getPriorityBadgeColor, getDaysUntilText }: EventItemProps) {
  return (
    <Link href={`/health/pets/${item.pet.id}`}>
      <div
        className={cn(
          "p-4 rounded-lg border-2 transition-all hover:shadow-md cursor-pointer",
          getPriorityColor(item.event.priority)
        )}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold">{item.pet.name}</h4>
              <span className="text-sm text-muted-foreground">·</span>
              <h4 className="font-semibold">{item.event.event_name}</h4>
            </div>
            <p className="text-sm mb-2">{item.event.description}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={getPriorityBadgeColor(item.event.priority)}>
                {item.event.priority === 'high' ? '높음' : item.event.priority === 'medium' ? '보통' : '낮음'}
              </Badge>
              <Badge variant="outline">
                {getEventTypeLabel(item.event.event_type)}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {getDaysUntilText(item.daysUntil)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(item.eventDate, 'yyyy년 M월 d일', { locale: ko })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

