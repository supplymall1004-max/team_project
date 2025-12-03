/**
 * 주간 식단 달력 컴포넌트
 */
export interface WeeklyDietCalendarProps {
  weekYear: number;
  weekNumber: number;
  dailyPlans: any[];
  weekStartDate?: string | Date;
  onWeekChange: (direction: 'prev' | 'next') => void;
  onShowShoppingList: () => void;
}

export function WeeklyDietCalendar({
  weekYear,
  weekNumber,
  dailyPlans,
  weekStartDate,
  onWeekChange,
  onShowShoppingList,
}: WeeklyDietCalendarProps) {
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">
        {weekYear}년 {weekNumber}주차 주간 식단
      </h3>
      <div className="text-sm text-gray-600">
        총 {dailyPlans.length}일의 식단이 계획되어 있습니다.
      </div>
    </div>
  );
}