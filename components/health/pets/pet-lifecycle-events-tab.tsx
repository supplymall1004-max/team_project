/**
 * @file components/health/pets/pet-lifecycle-events-tab.tsx
 * @description 반려동물 생애주기별 건강 이벤트 탭 컴포넌트
 * 
 * 주요 기능:
 * 1. 생애주기별 건강 이벤트 목록 표시
 * 2. 중성화 수술, 치과 검진, 혈액 검사 등 이벤트 안내
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PetProfile } from '@/types/pet';
import { PetLifecycleEvent, getEventTypeLabel } from '@/lib/health/pet-lifecycle-events';
import { Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface PetLifecycleEventsTabProps {
  petId: string;
  pet: PetProfile;
}

export function PetLifecycleEventsTab({ petId, pet }: PetLifecycleEventsTabProps) {
  const [events, setEvents] = useState<PetLifecycleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLifecycleEvents();
  }, [petId]);

  const fetchLifecycleEvents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/health/pets/${petId}/lifecycle-events`);
      if (!response.ok) {
        throw new Error('생애주기 이벤트를 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('생애주기 이벤트 조회 실패:', error);
      toast.error('생애주기 이벤트를 불러오는데 실패했습니다.');
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            생애주기별 건강 이벤트
          </CardTitle>
          <CardDescription>
            반려동물의 생애주기에 맞는 건강 이벤트를 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p className="text-muted-foreground">
                현재 해당하는 생애주기 이벤트가 없습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-4 rounded-lg border-2",
                    getPriorityColor(event.priority)
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{event.event_name}</h3>
                        <Badge className={getPriorityBadgeColor(event.priority)}>
                          {event.priority === 'high' ? '높음' : event.priority === 'medium' ? '보통' : '낮음'}
                        </Badge>
                        <Badge variant="outline">
                          {getEventTypeLabel(event.event_type)}
                        </Badge>
                      </div>
                      <p className="text-sm mb-3">{event.description}</p>
                      {event.recommended_action && (
                        <div className="bg-white/50 rounded p-3 mb-2">
                          <p className="text-sm font-medium mb-1">권장 조치:</p>
                          <p className="text-sm">{event.recommended_action}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {event.target_age_months && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            권장 시기: {event.target_age_months}개월
                          </span>
                        )}
                        {event.target_age_years && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            권장 시기: {event.target_age_years}세
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

