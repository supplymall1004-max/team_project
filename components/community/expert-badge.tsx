/**
 * @file expert-badge.tsx
 * @description 전문가 배지 컴포넌트
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ExpertBadgeProps {
  field: string;
  description?: string;
  size?: "sm" | "md" | "lg";
}

const FIELD_LABELS: Record<string, { label: string; color: string }> = {
  nutrition: { label: "영양 전문가", color: "bg-green-500" },
  pediatrics: { label: "소아과 전문의", color: "bg-blue-500" },
  cooking: { label: "요리 전문가", color: "bg-orange-500" },
  fitness: { label: "운동 전문가", color: "bg-purple-500" },
};

export function ExpertBadge({ field, description, size = "md" }: ExpertBadgeProps) {
  const fieldInfo = FIELD_LABELS[field] || { label: "전문가", color: "bg-gray-500" };
  
  const iconSize = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }[size];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            className={`${fieldInfo.color} text-white gap-1 cursor-help`}
            variant="default"
          >
            <ShieldCheck className={iconSize} />
            {fieldInfo.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">{fieldInfo.label}</p>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          <p className="text-xs text-muted-foreground mt-1">✓ 인증된 전문가</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

