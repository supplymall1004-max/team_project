/**
 * @file types/admin/community.ts
 * @description 관리자 커뮤니티 관리 타입 정의
 */

import type { Group, Post, Comment, GroupCategory } from "@/types/community";

/**
 * 커뮤니티 통계 데이터
 */
export interface AdminCommunityStats {
  totalGroups: number;
  activeGroups: number;
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  activeUsers: number; // 최근 30일 활동 사용자 수
  dailyActivity: {
    date: string;
    posts: number;
    comments: number;
  }[];
  weeklyActivity: {
    week: string;
    posts: number;
    comments: number;
  }[];
  monthlyActivity: {
    month: string;
    posts: number;
    comments: number;
  }[];
  popularGroups: {
    group: Group;
    memberCount: number;
    postCount: number;
  }[];
  recentActivity: {
    userId: string;
    userName: string;
    activityType: "group_join" | "post_create" | "comment_create";
    activityDate: string;
  }[];
}

/**
 * 관리자용 그룹 정보 (확장)
 */
export interface AdminGroup extends Group {
  owner: {
    id: string;
    name: string;
    email?: string;
  };
  memberCount: number;
  postCount: number;
  recentActivity: string; // 마지막 활동일
}

/**
 * 관리자용 게시글 정보 (확장)
 */
export interface AdminPost extends Post {
  author: {
    id: string;
    name: string;
    email?: string;
  };
  group: {
    id: string;
    name: string;
  };
  commentCount: number;
  likeCount: number;
  viewCount: number;
}

/**
 * 관리자용 댓글 정보 (확장)
 */
export interface AdminComment extends Comment {
  author: {
    id: string;
    name: string;
    email?: string;
  };
  post: {
    id: string;
    title: string;
    group: {
      id: string;
      name: string;
    };
  };
  likeCount: number;
}

/**
 * 사용자 활동 정보
 */
export interface AdminUserActivity {
  userId: string;
  userName: string;
  email?: string;
  groupsJoined: number;
  postsCreated: number;
  commentsCreated: number;
  likesGiven: number;
  lastActivity: string;
  isBanned: boolean;
  bannedAt?: string;
  bannedReason?: string;
}

/**
 * 커뮤니티 관리 필터 옵션
 */
export interface AdminCommunityFilters {
  category?: GroupCategory;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  isPublic?: boolean;
  minMembers?: number;
  minPosts?: number;
}

/**
 * 페이지네이션 파라미터
 */
export interface AdminPaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

