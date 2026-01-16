/**
 * @file expiry-alert-banner.tsx
 * @description 유통기한 임박 알림 배너
 */

"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@clerk/nextjs";

interface ExpiringItem {
  id: string;
  name: string;
  expiryDate: string;
  daysUntilExpiry: number;
}

export function ExpiryAlertBanner() {
  const { isSignedIn } = useAuth();
  const [expiringItems, setExpiringItems] = useState<ExpiringItem[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSignedIn) {
      fetchExpiringItems();
    } else {
      setLoading(false);
    }
  }, [isSignedIn]);

  const fetchExpiringItems = async () => {
    try {
      const response = await fetch("/api/fridge/expiring");
      if (response.ok) {
        const data = await response.json();
        setExpiringItems(data.items || []);
      }
    } catch (error) {
      console.error("유통기한 임박 아이템 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isSignedIn || loading || dismissed || expiringItems.length === 0) {
    return null;
  }

  const urgentItems = expiringItems.filter(item => item.daysUntilExpiry <= 1);
  const warningItems = expiringItems.filter(item => item.daysUntilExpiry > 1 && item.daysUntilExpiry <= 3);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-4"
      >
        <Alert variant={urgentItems.length > 0 ? "destructive" : "default"}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <AlertTriangle className="h-5 w-5 mt-0.5" />
              <div className="flex-1">
                <AlertTitle className="mb-2">
                  {urgentItems.length > 0 ? "🚨 유통기한이 임박했습니다!" : "⚠️ 유통기한을 확인하세요"}
                </AlertTitle>
                <AlertDescription>
                  {urgentItems.length > 0 && (
                    <div className="mb-2">
                      <p className="font-semibold mb-1">오늘/내일 만료:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {urgentItems.slice(0, 3).map(item => (
                          <li key={item.id}>
                            {item.name} ({item.daysUntilExpiry === 0 ? "오늘" : "내일"} 만료)
                          </li>
                        ))}
                        {urgentItems.length > 3 && (
                          <li>외 {urgentItems.length - 3}개</li>
                        )}
                      </ul>
                    </div>
                  )}
                  {warningItems.length > 0 && (
                    <div>
                      <p className="font-semibold mb-1">3일 이내 만료:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {warningItems.slice(0, 2).map(item => (
                          <li key={item.id}>
                            {item.name} ({item.daysUntilExpiry}일 남음)
                          </li>
                        ))}
                        {warningItems.length > 2 && (
                          <li>외 {warningItems.length - 2}개</li>
                        )}
                      </ul>
                    </div>
                  )}
                  <Link href="/fridge" className="inline-block mt-3">
                    <Button variant="outline" size="sm">
                      냉장고 확인하기
                    </Button>
                  </Link>
                </AlertDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDismissed(true)}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
}

