/**
 * @file app/community/posts/[id]/page.tsx
 * @description 게시글 상세 페이지
 *
 * 게시글 상세 정보, 댓글 목록, 댓글 작성 기능을 제공합니다.
 *
 * @dependencies
 * - @/components/community/comment-list: CommentList
 * - @/actions/community/get-post: getPost
 * - @/actions/community/toggle-like: toggleLike
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Heart,
  MessageCircle,
  Eye,
  ArrowLeft,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommentList } from "@/components/community/comment-list";
import { getPost } from "@/actions/community/get-post";
import { toggleLike } from "@/actions/community/toggle-like";
import { deletePost } from "@/actions/community/delete-post";
import type { PostWithAuthor } from "@/types/community";
import { Skeleton } from "@/components/ui/skeleton";

const postTypeLabels: Record<string, string> = {
  general: "일반",
  question: "질문",
  recipe: "레시피",
  achievement: "성과",
  challenge: "챌린지",
};

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    const loadPost = async () => {
      setLoading(true);
      setError(null);

      const result = await getPost(postId);

      if (result.success && result.data) {
        setPost(result.data);
      } else {
        setError(result.error || "게시글을 불러오는데 실패했습니다.");
      }

      setLoading(false);
    };

    if (postId) {
      loadPost();
    }
  }, [postId]);

  const handleLike = async () => {
    if (!post || isLiking) return;

    setIsLiking(true);
    const result = await toggleLike(post.id, null);

    if (result.success && result.data) {
      setPost({
        ...post,
        is_liked: result.data.liked,
        like_count: result.data.liked
          ? post.like_count + 1
          : post.like_count - 1,
      });
    }

    setIsLiking(false);
  };

  const handleDelete = async () => {
    if (!post) return;

    if (!confirm("정말 이 게시글을 삭제하시겠습니까?")) {
      return;
    }

    const result = await deletePost(post.id);

    if (result.success) {
      router.push(`/community/groups/${post.group_id}`);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <p className="text-destructive">{error || "게시글을 찾을 수 없습니다."}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.back()}
          >
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: ko,
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* 뒤로가기 버튼 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          돌아가기
        </Button>

        {/* 게시글 카드 */}
        <Card>
          <CardHeader>
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
                  <span className="text-xs text-muted-foreground">
                    {post.group.name}
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{timeAgo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {postTypeLabels[post.post_type] || post.post_type}
                  </Badge>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDelete}>
                    삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <h1 className="text-2xl font-bold">{post.title}</h1>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap break-words">{post.content}</p>
            </div>
            {post.images && post.images.length > 0 && (
              <div className="grid grid-cols-1 gap-4">
                {post.images.map((image, index) => (
                  <div
                    key={index}
                    className="rounded-lg overflow-hidden bg-muted"
                  >
                    <Image
                      src={image}
                      alt={`${post.title} 이미지 ${index + 1}`}
                      width={800}
                      height={600}
                      className="w-full h-auto object-contain"
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-4 pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={isLiking}
                className="gap-2"
              >
                <Heart
                  className={`h-4 w-4 ${post.is_liked ? "fill-red-500 text-red-500" : ""}`}
                />
                {post.like_count}
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                {post.comment_count}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                {post.view_count}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 댓글 섹션 */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">댓글</h2>
          </CardHeader>
          <CardContent>
            <CommentList postId={postId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

