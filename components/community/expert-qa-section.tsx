/**
 * @file expert-qa-section.tsx
 * @description 전문가 Q&A 섹션 컴포넌트
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircleQuestion, CheckCircle } from "lucide-react";
import Link from "next/link";
import { ExpertBadge } from "./expert-badge";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { motion } from "framer-motion";

interface QAPost {
  id: string;
  title: string;
  content: string;
  authorName: string;
  isExpert: boolean;
  expertField?: string;
  answerCount: number;
  hasBestAnswer: boolean;
  createdAt: string;
}

export function ExpertQASection() {
  const [qaPosts, setQaPosts] = useState<QAPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQAPosts();
  }, []);

  const fetchQAPosts = async () => {
    try {
      const response = await fetch("/api/community/qa-posts?limit=10");
      const data = await response.json();
      setQaPosts(data.posts || []);
    } catch (error) {
      console.error("Q&A 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircleQuestion className="w-5 h-5" />
            전문가에게 물어보세요
          </div>
          <Link href="/community/qa">
            <Button variant="outline" size="sm">
              질문하기
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {qaPosts.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <MessageCircleQuestion className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>아직 질문이 없습니다</p>
            <p className="text-sm mt-2">첫 질문을 남겨보세요!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {qaPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={`/community/qa/${post.id}`}
                  className="block p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span>{post.authorName}</span>
                        {post.isExpert && post.expertField && (
                          <ExpertBadge field={post.expertField} size="sm" />
                        )}
                        <span>·</span>
                        <span>{formatDistanceToNow(new Date(post.createdAt), { 
                          addSuffix: true, 
                          locale: ko 
                        })}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {post.hasBestAnswer && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      <div className="text-center">
                        <div className="text-sm font-semibold">{post.answerCount}</div>
                        <div className="text-xs text-muted-foreground">답변</div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

