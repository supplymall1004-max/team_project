"use client";

/**
 * @file components/admin/copy/slot-selector.tsx
 * @description 새 블록 생성 시 텍스트 슬롯을 선택하는 UI 컴포넌트
 *
 * 주요 기능:
 * 1. 섹션별로 그룹화된 슬롯 표시
 * 2. 라디오 버튼으로 슬롯 선택
 * 3. 각 슬롯의 위치 및 설명 표시
 */

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TextSlot } from "@/actions/admin/copy/slots";
import { getSlotsBySection } from "@/actions/admin/copy/slots";

interface SlotSelectorProps {
  existingSlugs?: string[];
  selectedSlug: string | null;
  onSlugSelect: (slug: string) => void;
}

export function SlotSelector({ existingSlugs = [], selectedSlug, onSlugSelect }: SlotSelectorProps) {
  const slotsBySection = getSlotsBySection();

  // 이미 생성된 슬롯 필터링
  const availableSlotsBySection = Object.entries(slotsBySection).reduce(
    (acc, [section, slots]) => {
      const availableSlots = slots.filter((slot) => !existingSlugs.includes(slot.slug));
      if (availableSlots.length > 0) {
        acc[section] = availableSlots;
      }
      return acc;
    },
    {} as Record<string, TextSlot[]>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">수정할 텍스트 위치 선택</h3>
        <p className="text-sm text-muted-foreground">
          홈페이지에서 관리할 텍스트 위치를 선택하세요. 섹션별로 그룹화되어 있습니다.
        </p>
      </div>

      <RadioGroup value={selectedSlug || ""} onValueChange={onSlugSelect}>
        <div className="space-y-4">
          {Object.entries(availableSlotsBySection).map(([section, slots]) => (
            <Card key={section}>
              <CardHeader>
                <CardTitle className="text-base">{section}</CardTitle>
                <CardDescription>{slots.length}개의 텍스트 위치</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {slots.map((slot) => (
                    <div
                      key={slot.slug}
                      className={`flex items-start space-x-3 p-3 rounded-md border transition-colors cursor-pointer ${
                        selectedSlug === slot.slug
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => onSlugSelect(slot.slug)}
                    >
                      <RadioGroupItem value={slot.slug} id={slot.slug} className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={slot.slug}
                          className="text-sm font-medium cursor-pointer flex items-center gap-2"
                        >
                          {slot.label}
                          {slot.isExisting && (
                            <Badge variant="secondary" className="text-xs">
                              기존 블록
                            </Badge>
                          )}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">{slot.description}</p>
                        <p className="text-xs text-gray-400 mt-1 font-mono">📍 {slot.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </RadioGroup>

      {Object.keys(availableSlotsBySection).length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              모든 텍스트 위치에 대한 블록이 이미 생성되었습니다.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

























