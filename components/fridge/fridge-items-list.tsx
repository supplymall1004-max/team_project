/**
 * @file fridge-items-list.tsx
 * @description 냉장고 식재료 목록 표시
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Calendar, AlertTriangle } from "lucide-react";
import { FridgeItem } from "./fridge-manager";
import { deleteFridgeItem } from "@/actions/fridge/manage-ingredients";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface FridgeItemsListProps {
  items: FridgeItem[];
  onItemDeleted: (itemId: string) => void;
  onItemUpdated: () => void;
}

export function FridgeItemsList({ items, onItemDeleted, onItemUpdated }: FridgeItemsListProps) {
  const { toast } = useToast();

  // 유통기한별 그룹화
  const groupedItems = groupItemsByExpiry(items);

  const handleDelete = async (itemId: string, itemName: string) => {
    if (!confirm(`${itemName}을(를) 삭제하시겠습니까?`)) {
      return;
    }

    const result = await deleteFridgeItem(itemId);
    
    if (result.success) {
      toast({
        title: "삭제 완료",
        description: `${itemName}이(가) 삭제되었습니다.`,
      });
      onItemDeleted(itemId);
    } else {
      toast({
        title: "삭제 실패",
        description: result.error || "삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-6xl mb-4">🧊</div>
          <p className="text-muted-foreground mb-4">
            냉장고가 비어있습니다
          </p>
          <p className="text-sm text-muted-foreground">
            식재료를 추가하여 유통기한을 관리해보세요
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div id="fridge-items" className="space-y-4">
      {/* 임박 아이템 */}
      {groupedItems.urgent.length > 0 && (
        <Card id="expiring-items" className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              유통기한 임박 ({groupedItems.urgent.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <AnimatePresence>
                {groupedItems.urgent.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onDelete={handleDelete}
                    variant="urgent"
                  />
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 주의 아이템 */}
      {groupedItems.warning.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <Calendar className="w-5 h-5" />
              주의 필요 ({groupedItems.warning.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <AnimatePresence>
                {groupedItems.warning.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onDelete={handleDelete}
                    variant="warning"
                  />
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 정상 아이템 */}
      {groupedItems.normal.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ✅ 신선함 ({groupedItems.normal.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <AnimatePresence>
                {groupedItems.normal.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onDelete={handleDelete}
                    variant="normal"
                  />
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface ItemCardProps {
  item: FridgeItem;
  onDelete: (itemId: string, itemName: string) => void;
  variant: "urgent" | "warning" | "normal";
}

function ItemCard({ item, onDelete, variant }: ItemCardProps) {
  const expiryDate = new Date(item.expiryDate);
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const variantStyles = {
    urgent: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
    warning: "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800",
    normal: "bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`p-4 rounded-lg border ${variantStyles[variant]} flex items-center justify-between gap-4`}
    >
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold truncate">{item.name}</h4>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
          {item.quantity && <span>{item.quantity}</span>}
          {item.category && (
            <>
              <span>·</span>
              <span>{item.category}</span>
            </>
          )}
        </div>
        <div className="text-sm mt-2">
          <span className={`
            ${variant === "urgent" ? "text-red-600 dark:text-red-400 font-semibold" :
              variant === "warning" ? "text-orange-600 dark:text-orange-400" :
              "text-muted-foreground"}
          `}>
            {daysUntilExpiry === 0 ? "오늘 만료" :
             daysUntilExpiry < 0 ? `${Math.abs(daysUntilExpiry)}일 지남` :
             `${daysUntilExpiry}일 남음`}
          </span>
          <span className="text-muted-foreground ml-2">
            ({expiryDate.toLocaleDateString("ko-KR")})
          </span>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(item.id, item.name)}
        className="flex-shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </motion.div>
  );
}

function groupItemsByExpiry(items: FridgeItem[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const urgent: FridgeItem[] = [];
  const warning: FridgeItem[] = [];
  const normal: FridgeItem[] = [];

  items.forEach((item) => {
    const expiryDate = new Date(item.expiryDate);
    expiryDate.setHours(0, 0, 0, 0);
    
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 1) {
      urgent.push(item);
    } else if (daysUntilExpiry <= 3) {
      warning.push(item);
    } else {
      normal.push(item);
    }
  });

  // 유통기한 임박 순으로 정렬
  urgent.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  warning.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  normal.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  return { urgent, warning, normal };
}

