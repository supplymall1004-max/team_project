/**
 * @file recent-activity-feed.tsx
 * @description 최근 활동 피드 - 실시간 사용자 활동 표시
 * 
 * 주요 기능:
 * 1. 최근 커뮤니티 활동 표시
 * 2. 실시간 업데이트 (30초마다)
 * 3. 활동 타입별 아이콘
 * 4. 애니메이션 효과
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Heart, MessageCircle, BookmarkPlus, Eye, Clock } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface ActivityItem {
  id: string;
  type: "like" | "comment" | "save" | "view" | "post";
  userName: string;
  targetTitle: string;
  targetType: "recipe" | "post";
  targetId: string;
  createdAt: string;
}

const ACTIVITY_CONFIG = {
  like: {
    icon: Heart,
    color: "text-pink-500",
    bgColor: "bg-pink-50 dark:bg-pink-950",
    text: "님이 좋아합니다",
  },
  comment: {
    icon: MessageCircle,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    text: "님이 댓글을 남겼습니다",
  },
  save: {
    icon: BookmarkPlus,
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950",
    text: "님이 저장했습니다",
  },
  view: {
    icon: Eye,
    color: "text-gray-500",
    bgColor: "bg-gray-50 dark:bg-gray-950",
    text: "님이 조회했습니다",
  },
  post: {
    icon: MessageCircle,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950",
    text: "님이 게시글을 작성했습니다",
  },
};

export function RecentActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();

    // 30초마다 자동 새로고침
    const interval = setInterval(() => {
      fetchActivities();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch("/api/activity/recent?limit=10");
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error("최근 활동 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 animate-pulse" />
            최근 활동
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            최근 활동
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-green-500"
            />
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            실시간으로 업데이트됩니다
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <AnimatePresence mode="popLayout">
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {activities.map((activity, index) => {
                const config = ACTIVITY_CONFIG[activity.type];
                const Icon = config.icon;
                const targetUrl = activity.targetType === "recipe" 
                  ? `/recipes/${activity.targetId}`
                  : `/community/${activity.targetId}`;

                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <Link
                      href={targetUrl}
                      className="flex items-start gap-3 p-4 hover:bg-accent transition-colors group"
                    >
                      {/* 아이콘 */}
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                        ${config.bgColor}
                      `}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>

                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-semibold">{activity.userName}</span>
                          <span className="text-muted-foreground">{config.text}</span>
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1 group-hover:text-primary transition-colors">
                          {activity.targetTitle}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(activity.createdAt), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>

          {activities.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>아직 활동이 없습니다</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

