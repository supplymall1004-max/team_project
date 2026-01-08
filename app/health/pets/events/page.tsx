/**
 * @file app/health/pets/events/page.tsx
 * @description 반려동물 생애주기별 건강 이벤트 상세 페이지
 * 
 * 태어나서부터 죽을 때까지의 모든 건강 이벤트를 종합 표로 표시합니다.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Section } from '@/components/section';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PetProfile } from '@/types/pet';
import { PetLifecycleEventWithDate, getEventTypeLabel, generateAllPetLifecycleEvents } from '@/lib/health/pet-lifecycle-events';
import { ArrowLeft, Calendar, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PetEventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const petId = searchParams.get('petId');

  const [pets, setPets] = useState<PetProfile[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(petId);
  const [allEvents, setAllEvents] = useState<Array<PetLifecycleEventWithDate & { pet: PetProfile }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'past' | 'future'>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchPets();
  }, []);

  useEffect(() => {
    if (selectedPetId && pets.length > 0) {
      fetchAllEvents(selectedPetId);
    }
  }, [selectedPetId, pets]);

  const fetchPets = async () => {
    try {
      const response = await fetch('/api/health/pets');
      if (!response.ok) throw new Error('반려동물 목록을 불러오는데 실패했습니다.');
      const data = await response.json();
      setPets(data.pets || []);
      
      // petId가 있으면 해당 반려동물 선택, 없으면 첫 번째 반려동물 선택
      if (petId && data.pets?.length > 0) {
        setSelectedPetId(petId);
      } else if (data.pets?.length > 0) {
        setSelectedPetId(data.pets[0].id);
      }
    } catch (error) {
      console.error('반려동물 목록 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllEvents = async (petId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/health/pets/${petId}`);
      if (!response.ok) throw new Error('반려동물 정보를 불러오는데 실패했습니다.');
      
      const data = await response.json();
      const pet = data.pet as PetProfile;
      
      // 필수 정보 확인
      if (!pet.birth_date || !pet.pet_type) {
        console.warn('반려동물의 생년월일 또는 종류 정보가 없습니다.');
        setAllEvents([]);
        return;
      }
      
      // 전체 생애 이벤트 생성
      const events = generateAllPetLifecycleEvents(pet);
      
      setAllEvents(events.map(event => ({ ...event, pet })));
    } catch (error) {
      console.error('이벤트 조회 실패:', error);
      setAllEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPet = pets.find(p => p.id === selectedPetId);
  const filteredEvents = allEvents.filter(event => {
    if (filter === 'past' && !event.isPast) return false;
    if (filter === 'future' && event.isPast) return false;
    if (eventTypeFilter !== 'all' && event.event_type !== eventTypeFilter) return false;
    return true;
  });

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

  if (isLoading && !selectedPet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Section className="pt-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">등록된 반려동물이 없습니다.</p>
              <Button onClick={() => router.push('/health/pets')}>반려동물 등록하기</Button>
            </CardContent>
          </Card>
        </Section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        {/* 헤더 */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/health/pets')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로
          </Button>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">생애주기별 건강 이벤트</h1>
              <p className="text-muted-foreground">
                태어나서부터 죽을 때까지의 모든 건강 이벤트를 확인하세요
              </p>
            </div>
          </div>

          {/* 반려동물 선택 */}
          {pets.length > 1 && (
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">반려동물 선택</label>
              <div className="flex gap-2 flex-wrap">
                {pets.map((pet) => (
                  <Button
                    key={pet.id}
                    variant={selectedPetId === pet.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPetId(pet.id)}
                  >
                    {pet.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedPet && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {selectedPet.name}의 생애 건강 이벤트
              </CardTitle>
              <CardDescription>
                {selectedPet.breed && `${selectedPet.breed} · `}
                {format(new Date(selectedPet.birth_date), 'yyyy년 M월 d일', { locale: ko })} 출생
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 필터 */}
              <div className="mb-6 space-y-4">
                <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'past' | 'future')}>
                  <TabsList>
                    <TabsTrigger value="all">전체 ({allEvents.length}건)</TabsTrigger>
                    <TabsTrigger value="past">과거 ({allEvents.filter(e => e.isPast).length}건)</TabsTrigger>
                    <TabsTrigger value="future">미래 ({allEvents.filter(e => !e.isPast).length}건)</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">이벤트 타입:</span>
                  <Button
                    variant={eventTypeFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEventTypeFilter('all')}
                  >
                    전체
                  </Button>
                  <Button
                    variant={eventTypeFilter === 'neutering' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEventTypeFilter('neutering')}
                  >
                    중성화 수술
                  </Button>
                  <Button
                    variant={eventTypeFilter === 'dental' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEventTypeFilter('dental')}
                  >
                    치과 검진
                  </Button>
                  <Button
                    variant={eventTypeFilter === 'blood_test' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEventTypeFilter('blood_test')}
                  >
                    혈액 검사
                  </Button>
                </div>
              </div>

              {/* 이벤트 테이블 */}
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-muted-foreground">해당 조건의 이벤트가 없습니다.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">날짜</th>
                        <th className="text-left p-3 font-semibold">나이</th>
                        <th className="text-left p-3 font-semibold">이벤트명</th>
                        <th className="text-left p-3 font-semibold">타입</th>
                        <th className="text-left p-3 font-semibold">우선순위</th>
                        <th className="text-left p-3 font-semibold">상태</th>
                        <th className="text-left p-3 font-semibold">설명</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvents.map((event, index) => (
                        <tr
                          key={`${event.event_code}-${event.eventDate.getTime()}-${index}`}
                          className={cn(
                            "border-b hover:bg-gray-50 transition-colors",
                            event.isPast && "opacity-60"
                          )}
                        >
                          <td className="p-3">
                            <div className="font-medium">
                              {format(event.eventDate, 'yyyy년 M월 d일', { locale: ko })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(event.eventDate, 'EEEE', { locale: ko })}
                            </div>
                          </td>
                          <td className="p-3">
                            {event.eventAgeYears > 0 && `${event.eventAgeYears}세 `}
                            {event.eventAgeMonths % 12}개월
                          </td>
                          <td className="p-3">
                            <div className="font-medium">{event.event_name}</div>
                            {event.is_recurring && (
                              <Badge variant="outline" className="text-xs mt-1">
                                반복
                              </Badge>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">
                              {getEventTypeLabel(event.event_type)}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge className={getPriorityBadgeColor(event.priority)}>
                              {event.priority === 'high' ? '높음' : event.priority === 'medium' ? '보통' : '낮음'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant={event.isPast ? 'secondary' : 'default'}>
                              {getDaysUntilText(event.daysUntil)}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="text-sm text-muted-foreground max-w-md">
                              {event.description}
                            </div>
                            {event.recommended_action && (
                              <div className="text-xs text-muted-foreground mt-1">
                                💡 {event.recommended_action}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 통계 요약 */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{allEvents.length}</div>
                  <div className="text-sm text-muted-foreground">전체 이벤트</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {allEvents.filter(e => !e.isPast && e.priority === 'high').length}
                  </div>
                  <div className="text-sm text-muted-foreground">긴급 예정</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {allEvents.filter(e => !e.isPast).length}
                  </div>
                  <div className="text-sm text-muted-foreground">미래 이벤트</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {allEvents.filter(e => e.isPast).length}
                  </div>
                  <div className="text-sm text-muted-foreground">과거 이벤트</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </Section>
    </div>
  );
}

