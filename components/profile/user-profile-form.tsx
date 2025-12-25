/**
 * @file user-profile-form.tsx
 * @description Clerk 사용자 프로필 수정 폼
 *
 * 주요 기능:
 * 1. 이름 수정
 * 2. 프로필 사진 업로드
 * 3. 이메일 주소 관리
 */

"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { User, Mail, Camera, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export function UserProfileForm() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [fullName, setFullName] = useState(
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">프로필을 불러오는 중...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            프로필을 수정하려면 로그인이 필요합니다
          </p>
          <Button onClick={() => router.push("/sign-in")}>로그인하기</Button>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      console.group("[UserProfile] 프로필 정보 업데이트");
      console.log("현재 이름:", user.firstName, user.lastName);
      console.log("새 전체 이름:", fullName);

      // 전체 이름을 firstName과 lastName으로 분리
      const trimmedName = fullName.trim();
      const nameParts = trimmedName.split(/\s+/);
      
      // 한국 이름(공백이 없는 경우)은 firstName에 전체 이름 저장
      // 서양 이름(공백이 있는 경우)은 기존 로직대로 처리
      let firstName: string;
      let lastName: string;
      
      if (nameParts.length === 1) {
        // 한국 이름: 전체 이름을 firstName에 저장
        firstName = trimmedName;
        lastName = "";
      } else {
        // 서양 이름: 첫 번째를 lastName, 나머지를 firstName
        lastName = nameParts[0] || "";
        firstName = nameParts.slice(1).join(" ") || "";
      }

      console.log("분리된 이름:", { firstName, lastName });

      // Clerk 사용자 정보 업데이트
      await user.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      console.log("✅ 프로필 업데이트 성공");
      console.groupEnd();

      setSuccess(true);

      // 성공 메시지를 잠시 보여주고 새로고침
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err) {
      console.error("❌ 프로필 업데이트 실패:", err);
      console.groupEnd();

      const errorMessage = err instanceof Error ? err.message : "프로필 업데이트에 실패했습니다.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      console.group("[UserProfile] 프로필 사진 업로드");
      console.log("파일:", file.name, file.size, "bytes");

      await user.setProfileImage({ file });

      console.log("✅ 프로필 사진 업로드 성공");
      console.groupEnd();

      // 페이지 새로고침으로 변경사항 반영
      window.location.reload();

    } catch (err) {
      console.error("❌ 프로필 사진 업로드 실패:", err);
      console.groupEnd();
      alert("프로필 사진 업로드에 실패했습니다.");
    }
  };

  // 표시용 전체 이름 (현재 사용자 정보 또는 입력 중인 값)
  const displayFullName = fullName.trim() || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "이름 없음";

  // 이니셜 계산 (입력 중인 값 우선, 없으면 현재 사용자 정보)
  const currentNameForInitials = fullName.trim() || [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const initials = currentNameForInitials
    .split(/\s+/)
    .map(word => word[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            프로필 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 프로필 사진 */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.imageUrl} alt={displayFullName} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>

            <div className="text-center">
              <label htmlFor="profile-image" className="cursor-pointer">
                <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700 hover:bg-blue-100 transition-colors">
                  <Camera className="h-4 w-4" />
                  사진 변경
                </div>
                <input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                JPG, PNG, GIF 파일 (최대 10MB)
              </p>
            </div>
          </div>

          {/* 이름 수정 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName">이름</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="이름을 입력하세요 (예: 김철수)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                성과 이름을 띄어쓰기로 구분해서 입력하세요. (예: 김 철수)
              </p>
            </div>

            {/* 이메일 정보 (읽기 전용) */}
            <div>
              <Label htmlFor="email">이메일 주소</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="email"
                  type="email"
                  value={user.primaryEmailAddress?.emailAddress || ""}
                  readOnly
                  className="bg-muted"
                />
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                이메일 주소는 Clerk 대시보드에서 변경할 수 있습니다.
              </p>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* 성공 메시지 */}
            {success && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-700 text-sm">
                ✅ 프로필이 성공적으로 업데이트되었습니다!
              </div>
            )}

            {/* 버튼 */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "저장 중..." : "프로필 저장"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 추가 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>계정 관리</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">비밀번호 변경</h4>
              <p className="text-sm text-muted-foreground">
                계정 비밀번호를 변경하려면 Clerk 대시보드를 이용하세요.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://dashboard.clerk.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Clerk 대시보드
              </a>
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">계정 삭제</h4>
              <p className="text-sm text-muted-foreground">
                계정을 완전히 삭제하려면 고객 지원팀에 문의하세요.
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              지원팀 문의
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
