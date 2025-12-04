/**
 * @file scripts/setup-admin.ts
 * @description Clerk 사용자에게 관리자 역할을 부여하는 스크립트
 * 
 * 사용 방법:
 * 1. Clerk 대시보드에서 관리자로 만들 사용자의 User ID를 확인
 * 2. 이 스크립트를 실행하여 관리자 역할 부여
 * 
 * 실행:
 * npx tsx scripts/setup-admin.ts <clerk_user_id>
 * 
 * 또는 환경 변수로:
 * CLERK_USER_ID=<clerk_user_id> npx tsx scripts/setup-admin.ts
 */

import { clerkClient } from "@clerk/nextjs/server";

/**
 * Clerk 사용자에게 관리자 역할 부여
 */
async function grantAdminRole(clerkUserId: string) {
  console.group("🔐 관리자 역할 부여");
  console.log("대상 Clerk User ID:", clerkUserId);

  try {
    const client = await clerkClient();

    // 현재 사용자 정보 조회
    const user = await client.users.getUser(clerkUserId);
    console.log("✅ 사용자 정보 조회 성공:", {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      name: user.fullName || user.firstName,
    });

    // 현재 메타데이터 확인
    const currentPublicMetadata = user.publicMetadata || {};
    const currentPrivateMetadata = user.privateMetadata || {};

    console.log("📋 현재 메타데이터:", {
      public: currentPublicMetadata,
      private: currentPrivateMetadata,
    });

    // 관리자 역할 추가 (publicMetadata에 추가)
    const updatedPublicMetadata = {
      ...currentPublicMetadata,
      role: "admin",
      roles: Array.isArray(currentPublicMetadata.roles)
        ? [...currentPublicMetadata.roles, "admin"]
        : ["admin"],
    };

    // 사용자 메타데이터 업데이트
    const updatedUser = await client.users.updateUser(clerkUserId, {
      publicMetadata: updatedPublicMetadata,
    });

    console.log("✅ 관리자 역할 부여 완료!");
    console.log("📋 업데이트된 메타데이터:", {
      public: updatedUser.publicMetadata,
    });
    console.groupEnd();

    return {
      success: true,
      message: "관리자 역할이 성공적으로 부여되었습니다.",
      user: {
        id: updatedUser.id,
        email: updatedUser.emailAddresses[0]?.emailAddress,
        name: updatedUser.fullName || updatedUser.firstName,
        roles: updatedUser.publicMetadata?.roles || [],
      },
    };
  } catch (error) {
    console.error("❌ 관리자 역할 부여 실패:", error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

/**
 * 관리자 역할 제거
 */
async function revokeAdminRole(clerkUserId: string) {
  console.group("🔓 관리자 역할 제거");
  console.log("대상 Clerk User ID:", clerkUserId);

  try {
    const client = await clerkClient();

    // 현재 사용자 정보 조회
    const user = await client.users.getUser(clerkUserId);
    const currentPublicMetadata = user.publicMetadata || {};

    // 관리자 역할 제거
    const currentRoles = Array.isArray(currentPublicMetadata.roles)
      ? currentPublicMetadata.roles.filter((role: string) => role !== "admin")
      : [];

    const updatedPublicMetadata = {
      ...currentPublicMetadata,
      role: currentRoles.length > 0 ? currentRoles[0] : undefined,
      roles: currentRoles.length > 0 ? currentRoles : undefined,
    };

    // role이 없으면 제거
    if (!updatedPublicMetadata.role) {
      delete updatedPublicMetadata.role;
    }
    if (!updatedPublicMetadata.roles || updatedPublicMetadata.roles.length === 0) {
      delete updatedPublicMetadata.roles;
    }

    // 사용자 메타데이터 업데이트
    const updatedUser = await client.users.updateUser(clerkUserId, {
      publicMetadata: updatedPublicMetadata,
    });

    console.log("✅ 관리자 역할 제거 완료!");
    console.groupEnd();

    return {
      success: true,
      message: "관리자 역할이 성공적으로 제거되었습니다.",
    };
  } catch (error) {
    console.error("❌ 관리자 역할 제거 실패:", error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

// CLI 실행
// eslint-disable-next-line @typescript-eslint/no-require-imports
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0]; // 'grant' 또는 'revoke'
  const clerkUserId = args[1] || process.env.CLERK_USER_ID;

  if (!clerkUserId) {
    console.error("❌ Clerk User ID가 필요합니다.");
    console.log("사용법:");
    console.log("  npx tsx scripts/setup-admin.ts grant <clerk_user_id>");
    console.log("  npx tsx scripts/setup-admin.ts revoke <clerk_user_id>");
    console.log("또는:");
    console.log("  CLERK_USER_ID=<clerk_user_id> npx tsx scripts/setup-admin.ts grant");
    process.exit(1);
  }

  if (command === "grant") {
    grantAdminRole(clerkUserId).then((result) => {
      if (result.success) {
        console.log("✅", result.message);
        process.exit(0);
      } else {
        console.error("❌", result.error);
        process.exit(1);
      }
    });
  } else if (command === "revoke") {
    revokeAdminRole(clerkUserId).then((result) => {
      if (result.success) {
        console.log("✅", result.message);
        process.exit(0);
      } else {
        console.error("❌", result.error);
        process.exit(1);
      }
    });
  } else {
    console.error("❌ 명령어가 올바르지 않습니다. 'grant' 또는 'revoke'를 사용하세요.");
    process.exit(1);
  }
}

export { grantAdminRole, revokeAdminRole };

