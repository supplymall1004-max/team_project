/**
 * @file section-reorder-handler.tsx
 * @description 섹션 순서 변경을 위한 드래그 앤 드롭 핸들러
 *
 * 주요 기능:
 * 1. 섹션 드래그 앤 드롭으로 순서 변경
 * 2. 변경된 순서를 커스텀 설정에 저장
 * 3. 시각적 피드백 제공
 *
 * @dependencies
 * - @dnd-kit/core: 드래그 앤 드롭 핵심 기능
 * - @dnd-kit/sortable: 정렬 가능한 리스트
 * - @dnd-kit/utilities: 유틸리티 함수
 */

"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useHomeCustomization } from "@/hooks/use-home-customization";
import { SECTION_IDS } from "@/types/home-customization";

interface SortableSectionItemProps {
  id: string;
  children: React.ReactNode;
}

function SortableSectionItem({ id, children }: SortableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 border rounded-lg bg-white dark:bg-card dark:border-border ${
        isDragging ? "shadow-lg z-50" : ""
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
      >
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="flex-1 dark:text-card-foreground">{children}</div>
    </div>
  );
}

interface SectionReorderHandlerProps {
  /** 섹션 순서 변경 완료 콜백 */
  onOrderChange?: (newOrder: string[]) => void;
  /** 섹션 ID와 이름 매핑 */
  sectionNames?: Record<string, string>;
}

/**
 * 섹션 순서 변경 핸들러 컴포넌트
 * 드래그 앤 드롭으로 섹션 순서를 변경할 수 있습니다.
 */
export function SectionReorderHandler({
  onOrderChange,
  sectionNames,
}: SectionReorderHandlerProps) {
  const { customization, updateSectionOrder, isLoaded } = useHomeCustomization();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 섹션 이름 매핑 (기본값)
  const defaultSectionNames: Record<string, string> = {
    [SECTION_IDS.emergency]: "응급조치 안내",
    [SECTION_IDS.weather]: "날씨 위젯",
    [SECTION_IDS.hero]: "히어로 섹션",
    [SECTION_IDS.characterGame]: "캐릭터 게임",
    [SECTION_IDS.community]: "커뮤니티 미리보기",
  };

  const names = sectionNames || defaultSectionNames;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = customization.sectionOrder.indexOf(active.id as string);
    const newIndex = customization.sectionOrder.indexOf(over.id as string);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(customization.sectionOrder, oldIndex, newIndex);
      updateSectionOrder(newOrder);
      onOrderChange?.(newOrder);

      // 개발 환경에서만 로그 출력
      if (process.env.NODE_ENV === "development") {
        console.group("[SectionReorderHandler] 섹션 순서 변경");
        console.log("이전 순서:", customization.sectionOrder);
        console.log("새 순서:", newOrder);
        console.groupEnd();
      }
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={customization.sectionOrder}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {customization.sectionOrder.map((sectionId, index) => (
            <SortableSectionItem key={sectionId} id={sectionId}>
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-medium dark:text-card-foreground">
                  {index + 1}. {names[sectionId] || sectionId}
                </span>
              </div>
            </SortableSectionItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

