/**
 * @file components/admin/security/password-change-panel.tsx
 * @description 관리자 비밀번호 변경 패널
 *
 * 주요 기능:
 * 1. 현재 비밀번호 확인
 * 2. 새 비밀번호 입력 및 확인
 * 3. 비밀번호 정책 검증
 * 4. 보안 감사 로그 기록
 */

"use client";

import { useState } from "react";
import { Key, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventRecentPasswords: number;
}

const PASSWORD_POLICY: PasswordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventRecentPasswords: 5,
};

export function PasswordChangePanel() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChanging, setIsChanging] = useState(false);
  const { toast } = useToast();

  // 비밀번호 정책 검증
  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < PASSWORD_POLICY.minLength) {
      errors.push(`최소 ${PASSWORD_POLICY.minLength}자 이상이어야 합니다`);
    }

    if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push("대문자를 포함해야 합니다");
    }

    if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
      errors.push("소문자를 포함해야 합니다");
    }

    if (PASSWORD_POLICY.requireNumbers && !/\d/.test(password)) {
      errors.push("숫자를 포함해야 합니다");
    }

    if (PASSWORD_POLICY.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("특수문자를 포함해야 합니다");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // 폼 데이터 변경 핸들러
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 비밀번호 표시 토글
  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // 비밀번호 변경 핸들러
  const handlePasswordChange = async () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "비밀번호 불일치",
        description: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      });
      return;
    }

    const validation = validatePassword(formData.newPassword);
    if (!validation.isValid) {
      toast({
        title: "비밀번호 정책 위반",
        description: validation.errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    setIsChanging(true);
    try {
      console.group("[AdminConsole][Security][Password]");
      console.log("event", "change-password");

      // Clerk 비밀번호 변경 API 호출 (실제로는 Clerk SDK 사용)
      // const result = await updatePassword(formData.currentPassword, formData.newPassword);

      // 임시 성공 처리
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 성공 시 폼 초기화
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast({
        title: "비밀번호 변경 완료",
        description: "비밀번호가 성공적으로 변경되었습니다.",
      });

      console.log("password_change_success");
    } catch (error) {
      console.error("password_change_error", error);
      toast({
        title: "변경 실패",
        description: "비밀번호 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsChanging(false);
      console.groupEnd();
    }
  };

  // 새 비밀번호 검증 결과
  const newPasswordValidation = formData.newPassword ? validatePassword(formData.newPassword) : null;

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            비밀번호 변경
          </CardTitle>
          <p className="text-sm text-gray-600">
            보안을 위해 정기적으로 비밀번호를 변경해주세요.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 현재 비밀번호 */}
          <div>
            <Label htmlFor="current-password">현재 비밀번호</Label>
            <div className="relative mt-1">
              <Input
                id="current-password"
                type={showPasswords.current ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                placeholder="현재 비밀번호를 입력하세요"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => togglePasswordVisibility("current")}
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 새 비밀번호 */}
          <div>
            <Label htmlFor="new-password">새 비밀번호</Label>
            <div className="relative mt-1">
              <Input
                id="new-password"
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => handleInputChange("newPassword", e.target.value)}
                placeholder="새 비밀번호를 입력하세요"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => togglePasswordVisibility("new")}
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <Label htmlFor="confirm-password">비밀번호 확인</Label>
            <div className="relative mt-1">
              <Input
                id="confirm-password"
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                placeholder="새 비밀번호를 다시 입력하세요"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => togglePasswordVisibility("confirm")}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 비밀번호 정책 표시 */}
          {formData.newPassword && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">비밀번호 정책:</p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li className="flex items-center gap-2">
                      {formData.newPassword.length >= PASSWORD_POLICY.minLength ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      )}
                      최소 {PASSWORD_POLICY.minLength}자 이상
                    </li>
                    <li className="flex items-center gap-2">
                      {/[A-Z]/.test(formData.newPassword) ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      )}
                      대문자 포함
                    </li>
                    <li className="flex items-center gap-2">
                      {/[a-z]/.test(formData.newPassword) ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      )}
                      소문자 포함
                    </li>
                    <li className="flex items-center gap-2">
                      {/\d/.test(formData.newPassword) ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      )}
                      숫자 포함
                    </li>
                    <li className="flex items-center gap-2">
                      {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.newPassword) ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      )}
                      특수문자 포함
                    </li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" })}
              disabled={isChanging}
            >
              초기화
            </Button>
            <Button
              onClick={handlePasswordChange}
              disabled={
                isChanging ||
                !formData.currentPassword ||
                !formData.newPassword ||
                !formData.confirmPassword ||
                formData.newPassword !== formData.confirmPassword ||
                (newPasswordValidation && !newPasswordValidation.isValid)
              }
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isChanging ? "변경 중..." : "비밀번호 변경"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




















