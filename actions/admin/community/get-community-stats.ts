/**
 * @file actions/admin/community/get-community-stats.ts
 * @description 커뮤니티 통계 조회 Server Action
 *
 * 커뮤니티 전체 통계 데이터를 조회합니다.
 *
 * @dependencies
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/types/admin/community: AdminCommunityStats
 */

"use server";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { AdminCommunityStats } from "@/types/admin/community";

/**
 * 커뮤니티 통계 조회
 */
export async function getCommunityStats(): Promise<{
  success: boolean;
  error?: string;
  data?: AdminCommunityStats;
}> {
  try {
    console.group("[AdminCommunity][GetStats] 커뮤니티 통계 조회 시작");

    const supabase = getServiceRoleClient();

    // 전체 그룹 수
    const { count: totalGroups, error: groupsError } = await supabase
      .from("community_groups")
      .select("*", { count: "exact", head: true });

    if (groupsError) {
      console.error("❌ 그룹 수 조회 실패:", groupsError);
      throw groupsError;
    }

    // 활성 그룹 수 (최근 30일 활동)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: activeGroups, error: activeGroupsError } = await supabase
      .from("community_groups")
      .select("*", { count: "exact", head: true })
      .gte("updated_at", thirtyDaysAgo.toISOString());

    if (activeGroupsError) {
      console.error("❌ 활성 그룹 수 조회 실패:", activeGroupsError);
      throw activeGroupsError;
    }

    // 전체 게시글 수
    const { count: totalPosts, error: postsError } = await supabase
      .from("group_posts")
      .select("*", { count: "exact", head: true });

    if (postsError) {
      console.error("❌ 게시글 수 조회 실패:", postsError);
      throw postsError;
    }

    // 전체 댓글 수
    const { count: totalComments, error: commentsError } = await supabase
      .from("post_comments")
      .select("*", { count: "exact", head: true });

    if (commentsError) {
      console.error("❌ 댓글 수 조회 실패:", commentsError);
      throw commentsError;
    }

    // 전체 좋아요 수
    const { count: totalLikes, error: likesError } = await supabase
      .from("post_likes")
      .select("*", { count: "exact", head: true });

    if (likesError) {
      console.error("❌ 좋아요 수 조회 실패:", likesError);
      throw likesError;
    }

    // 최근 30일 활동 사용자 수
    const { count: activeUsers, error: activeUsersError } = await supabase
      .from("group_posts")
      .select("author_id", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString());

    if (activeUsersError) {
      console.error("❌ 활성 사용자 수 조회 실패:", activeUsersError);
      throw activeUsersError;
    }

    // 일일 활동 통계 (최근 7일)
    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const { count: posts, error: postsErr } = await supabase
        .from("group_posts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", date.toISOString())
        .lt("created_at", nextDate.toISOString());

      const { count: comments, error: commentsErr } = await supabase
        .from("post_comments")
        .select("*", { count: "exact", head: true })
        .gte("created_at", date.toISOString())
        .lt("created_at", nextDate.toISOString());

      if (!postsErr && !commentsErr) {
        dailyActivity.push({
          date: date.toISOString().split("T")[0],
          posts: posts || 0,
          comments: comments || 0,
        });
      }
    }

    // 주간 활동 통계 (최근 4주)
    const weeklyActivity = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const { count: posts, error: postsErr } = await supabase
        .from("group_posts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekStart.toISOString())
        .lt("created_at", weekEnd.toISOString());

      const { count: comments, error: commentsErr } = await supabase
        .from("post_comments")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekStart.toISOString())
        .lt("created_at", weekEnd.toISOString());

      if (!postsErr && !commentsErr) {
        weeklyActivity.push({
          week: `${weekStart.toISOString().split("T")[0]} ~ ${weekEnd.toISOString().split("T")[0]}`,
          posts: posts || 0,
          comments: comments || 0,
        });
      }
    }

    // 월간 활동 통계 (최근 3개월)
    const monthlyActivity = [];
    for (let i = 2; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const { count: posts, error: postsErr } = await supabase
        .from("group_posts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart.toISOString())
        .lt("created_at", monthEnd.toISOString());

      const { count: comments, error: commentsErr } = await supabase
        .from("post_comments")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart.toISOString())
        .lt("created_at", monthEnd.toISOString());

      if (!postsErr && !commentsErr) {
        monthlyActivity.push({
          month: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`,
          posts: posts || 0,
          comments: comments || 0,
        });
      }
    }

    // 인기 그룹 TOP 10
    const { data: popularGroupsData, error: popularGroupsError } = await supabase
      .from("community_groups")
      .select("*, group_members(count), group_posts(count)")
      .order("member_count", { ascending: false })
      .limit(10);

    if (popularGroupsError) {
      console.error("❌ 인기 그룹 조회 실패:", popularGroupsError);
      throw popularGroupsError;
    }

    const popularGroups = (popularGroupsData || []).map((group: any) => ({
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        category: group.category,
        cover_image_url: group.cover_image_url,
        is_public: group.is_public,
        is_family_only: group.is_family_only,
        owner_id: group.owner_id,
        member_count: group.member_count,
        post_count: group.post_count,
        created_at: group.created_at,
        updated_at: group.updated_at,
      },
      memberCount: group.member_count || 0,
      postCount: group.post_count || 0,
    }));

    // 최근 활동 사용자 목록 (최근 7일)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentPosts, error: recentPostsError } = await supabase
      .from("group_posts")
      .select("author_id, created_at, users!group_posts_author_id_fkey(id, name)")
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(20);

    const { data: recentComments, error: recentCommentsError } = await supabase
      .from("post_comments")
      .select("author_id, created_at, users!post_comments_author_id_fkey(id, name)")
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(20);

    const recentActivity: AdminCommunityStats["recentActivity"] = [];

    if (recentPosts && !recentPostsError) {
      recentPosts.forEach((post: any) => {
        recentActivity.push({
          userId: post.author_id,
          userName: post.users?.name || "알 수 없음",
          activityType: "post_create",
          activityDate: post.created_at,
        });
      });
    }

    if (recentComments && !recentCommentsError) {
      recentComments.forEach((comment: any) => {
        recentActivity.push({
          userId: comment.author_id,
          userName: comment.users?.name || "알 수 없음",
          activityType: "comment_create",
          activityDate: comment.created_at,
        });
      });
    }

    // 날짜순 정렬
    recentActivity.sort((a, b) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime());

    const stats: AdminCommunityStats = {
      totalGroups: totalGroups || 0,
      activeGroups: activeGroups || 0,
      totalPosts: totalPosts || 0,
      totalComments: totalComments || 0,
      totalLikes: totalLikes || 0,
      activeUsers: activeUsers || 0,
      dailyActivity,
      weeklyActivity,
      monthlyActivity,
      popularGroups,
      recentActivity: recentActivity.slice(0, 20),
    };

    console.log("✅ 커뮤니티 통계 조회 완료");
    console.log("📊 통계:", {
      totalGroups: stats.totalGroups,
      totalPosts: stats.totalPosts,
      totalComments: stats.totalComments,
    });
    console.groupEnd();

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error("❌ 커뮤니티 통계 조회 실패:", error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

