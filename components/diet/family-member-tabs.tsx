'use client';

/**
 * @file components/diet/family-member-tabs.tsx
 * @description 가족 구성원별 식단 선택 탭 컴포넌트
 * 
 * Radix UI Tabs의 hydration mismatch를 방지하기 위해 분리된 클라이언트 컴포넌트
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Users } from 'lucide-react';

interface TabMember {
  id: string;
  name: string;
  isUser: boolean;
}

interface FamilyMemberTabsProps {
  tabMembers: TabMember[];
  activeTab: string;
  onTabChange: (value: string) => void;
  mealType: 'breakfast' | 'lunch' | 'dinner';
}

export function FamilyMemberTabs({
  tabMembers,
  activeTab,
  onTabChange,
  mealType,
}: FamilyMemberTabsProps) {
  // 탭이 2개 미만이면 표시하지 않음
  if (tabMembers.length < 2) {
    return null;
  }

  const mealTypeKorean = {
    breakfast: '아침',
    lunch: '점심',
    dinner: '저녁',
  }[mealType];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          구성원별 식단
        </CardTitle>
        <CardDescription>
          가족 구성원들의 {mealTypeKorean} 식단을 확인할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList 
            className="grid w-full" 
            style={{ gridTemplateColumns: `repeat(${tabMembers.length}, 1fr)` }}
          >
            {tabMembers.map((member) => (
              <TabsTrigger
                key={member.id}
                value={member.id}
                className="flex items-center gap-2"
              >
                {member.isUser ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Users className="h-4 w-4" />
                )}
                <span className="truncate">{member.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardContent>
    </Card>
  );
}

