/**
 * @file types/community.ts
 * @description 커뮤니티 시스템 타입 정의
 *
 * 커뮤니티 그룹, 게시글, 댓글, 좋아요, 팔로우 등
 * 커뮤니티 관련 모든 TypeScript 타입을 정의합니다.
 */

/**
 * 그룹 카테고리 타입
 */
export type GroupCategory = "health" | "pet" | "recipe" | "exercise" | "region";

/**
 * 그룹 멤버 역할 타입
 */
export type GroupMemberRole = "owner" | "moderator" | "member";

/**
 * 게시글 타입
 */
export type PostType = "general" | "question" | "recipe" | "achievement" | "challenge";

/**
 * 커뮤니티 그룹 인터페이스
 */
export interface Group {
  id: string;
  name: string;
  description: string | null;
  category: GroupCategory;
  cover_image_url: string | null;
  is_public: boolean;
  is_family_only: boolean;
  owner_id: string;
  member_count: number;
  post_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * 그룹 멤버 인터페이스
 */
export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupMemberRole;
  joined_at: string;
}

/**
 * 그룹 멤버 정보 (사용자 정보 포함)
 */
export interface GroupMemberWithUser extends GroupMember {
  user: {
    id: string;
    name: string;
    profile_image_url: string | null;
  };
}

/**
 * 그룹 게시글 인터페이스
 */
export interface Post {
  id: string;
  group_id: string;
  author_id: string;
  title: string;
  content: string;
  post_type: PostType;
  images: string[]; // JSONB 배열을 string[]로 변환
  like_count: number;
  comment_count: number;
  view_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 게시글 정보 (작성자 정보 포함)
 */
export interface PostWithAuthor extends Post {
  author: {
    id: string;
    name: string;
    profile_image_url: string | null;
  };
  group: {
    id: string;
    name: string;
  };
  is_liked?: boolean; // 현재 사용자가 좋아요를 눌렀는지 여부
}

/**
 * 게시글 댓글 인터페이스
 */
export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_comment_id: string | null;
  like_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * 댓글 정보 (작성자 정보 및 대댓글 포함)
 */
export interface CommentWithAuthor extends Comment {
  author: {
    id: string;
    name: string;
    profile_image_url: string | null;
  };
  replies?: CommentWithAuthor[]; // 대댓글 배열
  is_liked?: boolean; // 현재 사용자가 좋아요를 눌렀는지 여부
}

/**
 * 게시글/댓글 좋아요 인터페이스
 */
export interface PostLike {
  id: string;
  post_id: string | null;
  comment_id: string | null;
  user_id: string;
  created_at: string;
}

/**
 * 사용자 팔로우 인터페이스
 */
export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

/**
 * 그룹 생성 입력 타입
 */
export interface CreateGroupInput {
  name: string;
  description?: string;
  category: GroupCategory;
  cover_image_url?: string;
  is_public?: boolean;
  is_family_only?: boolean;
}

/**
 * 그룹 업데이트 입력 타입
 */
export interface UpdateGroupInput {
  name?: string;
  description?: string;
  cover_image_url?: string;
  is_public?: boolean;
}

/**
 * 게시글 생성 입력 타입
 */
export interface CreatePostInput {
  group_id: string;
  title: string;
  content: string;
  post_type?: PostType;
  images?: string[];
}

/**
 * 게시글 업데이트 입력 타입
 */
export interface UpdatePostInput {
  title?: string;
  content?: string;
  post_type?: PostType;
  images?: string[];
  is_pinned?: boolean;
}

/**
 * 댓글 생성 입력 타입
 */
export interface CreateCommentInput {
  post_id: string;
  content: string;
  parent_comment_id?: string | null;
}

/**
 * 댓글 업데이트 입력 타입
 */
export interface UpdateCommentInput {
  content: string;
}

/**
 * 그룹 목록 조회 파라미터
 */
export interface ListGroupsParams {
  category?: GroupCategory;
  search?: string;
  page?: number;
  limit?: number;
  is_public?: boolean;
}

/**
 * 게시글 목록 조회 파라미터
 */
export interface ListPostsParams {
  group_id?: string;
  post_type?: PostType;
  sort?: "latest" | "popular"; // latest: 최신순, popular: 인기순
  page?: number;
  limit?: number;
}

/**
 * 댓글 목록 조회 파라미터
 */
export interface ListCommentsParams {
  post_id: string;
  page?: number;
  limit?: number;
}

/**
 * Server Action 반환 타입
 */
export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * 그룹 조회 결과 (멤버 여부 포함)
 */
export interface GroupWithMembership extends Group {
  is_member: boolean;
  user_role?: GroupMemberRole;
}

/**
 * 페이지네이션 메타데이터
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

/**
 * 페이지네이션된 결과
 */
export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

