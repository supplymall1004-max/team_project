/**
 * @file components/game/threejs/community-board-overlay.tsx
 * @description 게시판 위에 커뮤니티 내용을 표시하는 컴포넌트
 *
 * 게시판 모델 위에 최근 커뮤니티 게시글을 표시합니다.
 */

"use client";

import { useEffect, useState } from "react";
import { Html } from "@react-three/drei";
import { listPosts } from "@/actions/community/list-posts";
import { listGroups } from "@/actions/community/list-groups";
import type { PostWithAuthor } from "@/types/community";

interface CommunityBoardOverlayProps {
  position: [number, number, number];
  groupId?: string;
}

/**
 * 게시판 위 커뮤니티 오버레이 컴포넌트
 */
export function CommunityBoardOverlay({ 
  position, 
  groupId 
}: CommunityBoardOverlayProps) {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCommunityPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log("📋 커뮤니티 게시글 로드 시작", { groupId });

        // 그룹 ID가 없으면 공개 그룹을 먼저 찾아서 게시글을 가져옴
        if (!groupId) {
          // 공개 그룹 목록 조회
          const groupsResult = await listGroups({
            is_public: true,
            page: 1,
            limit: 1,
          });

          if (groupsResult.success && groupsResult.data?.items?.length > 0) {
            const publicGroupId = groupsResult.data.items[0].id;
            console.log("✅ 공개 그룹 찾음:", publicGroupId);
            
            const result = await listPosts({
              group_id: publicGroupId,
              sort: "latest",
              page: 1,
              limit: 5,
            });

            if (result.success && result.data) {
              console.log("✅ 커뮤니티 게시글 로드 성공:", result.data.items.length);
              setPosts(result.data.items);
            } else {
              console.warn("⚠️ 커뮤니티 게시글 로드 실패:", result.error);
              setError(result.error || "게시글을 불러올 수 없습니다.");
            }
          } else {
            console.warn("⚠️ 공개 그룹을 찾을 수 없습니다.");
            setError("게시글을 불러올 수 없습니다.");
          }
        } else {
          // 그룹 ID가 있으면 해당 그룹의 게시글을 가져옴
          const result = await listPosts({
            group_id: groupId,
            sort: "latest",
            page: 1,
            limit: 5,
          });

          if (result.success && result.data) {
            console.log("✅ 커뮤니티 게시글 로드 성공:", result.data.items.length);
            setPosts(result.data.items);
          } else {
            console.warn("⚠️ 커뮤니티 게시글 로드 실패:", result.error);
            setError(result.error || "게시글을 불러올 수 없습니다.");
          }
        }
      } catch (err) {
        console.error("❌ 커뮤니티 게시글 로드 오류:", err);
        setError("게시글을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadCommunityPosts();
  }, [groupId]);

  return (
    <Html
      position={position}
      transform
      occlude
      style={{
        pointerEvents: "auto",
        transform: "translate(-50%, -50%)",
      }}
      center
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl p-4 w-80 max-h-96 overflow-y-auto border-2 border-blue-200">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            📌 커뮤니티 게시판
          </h3>
        </div>

        {isLoading && (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p>게시글을 불러오는 중...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-500">
            <p>⚠️ {error}</p>
          </div>
        )}

        {!isLoading && !error && posts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>게시글이 없습니다.</p>
            <p className="text-sm mt-2">첫 게시글을 작성해보세요!</p>
          </div>
        )}

        {!isLoading && !error && posts.length > 0 && (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                onClick={() => {
                  console.log("게시글 클릭:", post.id);
                  // 게시글 상세 페이지로 이동
                  window.location.href = `/community/posts/${post.id}`;
                }}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-gray-800 truncate">
                      {post.title}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>{post.author.name}</span>
                      <span>•</span>
                      <span>👍 {post.like_count}</span>
                      <span>•</span>
                      <span>💬 {post.comment_count}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 pt-2 border-t border-gray-200">
          <a
            href="/community"
            className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            전체 게시판 보기 →
          </a>
        </div>
      </div>
    </Html>
  );
}

