/**
 * @file components/community/post-card.tsx
 * @description 게시글 카드 컴포넌트
 *
 * 커뮤니티 게시글을 카드 형태로 표시하는 컴포넌트입니다.
 *
 * @dependencies
 * - @/components/ui/card: Card, CardHeader, CardContent
 * - @/components/ui/badge: Badge
 * - @/components/ui/avatar: Avatar
 * - lucide-react: Heart, MessageCircle, Eye, Pin
 * - @/types/community: PostWithAuthor
 */

"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Heart, MessageCircle, Eye, Pin } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PostWithAuthor } from "@/types/community";

interface PostCardProps {
  post: PostWithAuthor;
  showGroup?: boolean;
}

const postTypeLabels: Record<PostWithAuthor["post_type"], string> = {
  general: "일반",
  question: "질문",
  recipe: "레시피",
  achievement: "성과",
  challenge: "챌린지",
};

export function PostCard({ post, showGroup = false }: PostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: ko,
  });

  return (
    <Link href={`/community/posts/${post.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={post.author.profile_image_url || undefined}
                alt={post.author.name}
              />
              <AvatarFallback>
                {post.author.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{post.author.name}</span>
                {showGroup && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-sm text-muted-foreground">
                      {post.group.name}
                    </span>
                  </>
                )}
                <span className="text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">
                  {timeAgo}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {post.is_pinned && (
                  <Badge variant="secondary" className="gap-1">
                    <Pin className="h-3 w-3" />
                    고정
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {postTypeLabels[post.post_type]}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
            {post.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {post.content}
          </p>
          {post.images && post.images.length > 0 && (
            <div className="mb-4">
              <div className="grid grid-cols-3 gap-2">
                {post.images.slice(0, 3).map((image, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-md overflow-hidden bg-muted"
                  >
                    <img
                      src={image}
                      alt={`${post.title} 이미지 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Heart
                className={`h-4 w-4 ${post.is_liked ? "fill-red-500 text-red-500" : ""}`}
              />
              <span>{post.like_count}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageCircle className="h-4 w-4" />
              <span>{post.comment_count}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              <span>{post.view_count}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

