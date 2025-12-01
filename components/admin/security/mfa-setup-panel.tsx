/**
 * @file components/admin/security/mfa-setup-panel.tsx
 * @description 관리자 2FA(MFA) 설정 패널
 * 
 * Google Authenticator를 사용한 TOTP 기반 2단계 인증 설정
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Smartphone, Shield, QrCode, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { setupMFA, verifyAndEnableMFA, disableMFA, getMFAStatus } from "@/actions/admin/security/mfa";

export function MfaSetupPanel() {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // MFA 설정 데이터
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [otpToken, setOtpToken] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  
  const { toast } = useToast();

  // MFA 상태 로드
  const loadMFAStatus = useCallback(async () => {
    console.group("[MfaSetupPanel]");
    console.log("event", "load_status");
    
    setIsLoading(true);
    const result = await getMFAStatus();
    
    if (result.success) {
      setMfaEnabled(result.enabled);
      console.log("mfa_enabled", result.enabled);
    } else {
      const errorMessage = "error" in result ? result.error : "알 수 없는 오류가 발생했습니다";
      console.error("load_error", errorMessage);
      toast({
        title: "오류",
        description: errorMessage,
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
    console.groupEnd();
  }, []);

  // MFA 상태 로드
  useEffect(() => {
    loadMFAStatus();
  }, [loadMFAStatus]);

  const handleEnableMFA = async () => {
    console.group("[MfaSetupPanel]");
    console.log("event", "enable_mfa_start");
    
    setIsSettingUp(true);
    const result = await setupMFA();
    
    if (result.success) {
      setQrCodeUrl(result.qrCodeUrl);
      setSecret(result.secret);
      setBackupCodes(result.backupCodes);
      setIsDialogOpen(true);
      console.log("setup_success", "✓");
      
      toast({
        title: "2FA 설정 시작",
        description: "QR 코드를 스캔하고 인증 코드를 입력해주세요.",
      });
    } else {
      const errorMessage = "error" in result ? result.error : "알 수 없는 오류가 발생했습니다";
      console.error("setup_error", errorMessage);
      toast({
        title: "오류",
        description: errorMessage,
        variant: "destructive",
      });
    }
    
    setIsSettingUp(false);
    console.groupEnd();
  };

  const handleVerifyOTP = async () => {
    if (otpToken.length !== 6) {
      toast({
        title: "입력 오류",
        description: "6자리 인증 코드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    console.group("[MfaSetupPanel]");
    console.log("event", "verify_otp");
    console.log("token_length", otpToken.length);
    
    setIsSettingUp(true);
    const result = await verifyAndEnableMFA(otpToken);
    
    if (result.success) {
      setMfaEnabled(true);
      setIsDialogOpen(false);
      setOtpToken("");
      console.log("verify_success", "✓");
      
      toast({
        title: "성공",
        description: result.message,
      });
    } else {
      const errorMessage = "error" in result ? result.error : "알 수 없는 오류가 발생했습니다";
      console.error("verify_error", errorMessage);
      toast({
        title: "인증 실패",
        description: errorMessage,
        variant: "destructive",
      });
    }
    
    setIsSettingUp(false);
    console.groupEnd();
  };

  const handleDisableMFA = async () => {
    if (!confirm("정말로 2단계 인증을 비활성화하시겠습니까?")) {
      return;
    }

    console.group("[MfaSetupPanel]");
    console.log("event", "disable_mfa");
    
    setIsSettingUp(true);
    const result = await disableMFA();
    
    if (result.success) {
      setMfaEnabled(false);
      console.log("disable_success", "✓");
      
      toast({
        title: "성공",
        description: result.message,
      });
    } else {
      const errorMessage = "error" in result ? result.error : "알 수 없는 오류가 발생했습니다";
      console.error("disable_error", errorMessage);
      toast({
        title: "오류",
        description: errorMessage,
        variant: "destructive",
      });
    }
    
    setIsSettingUp(false);
    console.groupEnd();
  };

  const handleCopySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setIsCopied(true);
      toast({
        title: "복사됨",
        description: "비밀 키가 클립보드에 복사되었습니다.",
      });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast({
      title: "복사됨",
      description: "복구 코드가 클립보드에 복사되었습니다.",
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">로딩 중...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            2단계 인증 (2FA)
          </CardTitle>
          <p className="text-sm text-gray-600">
            추가 보안을 위해 2단계 인증을 설정하세요.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className={`h-8 w-8 ${mfaEnabled ? "text-green-500" : "text-gray-400"}`} />
              <div>
                <h3 className="font-medium">인증 앱</h3>
                <p className="text-sm text-gray-600">
                  Google Authenticator, Authy 등 인증 앱 사용
                </p>
              </div>
            </div>
            <Badge variant={mfaEnabled ? "default" : "secondary"}>
              {mfaEnabled ? "활성" : "비활성"}
            </Badge>
          </div>

          {!mfaEnabled ? (
            <Alert>
              <QrCode className="h-4 w-4" />
              <AlertDescription>
                2단계 인증을 활성화하면 계정 보안이 크게 향상됩니다.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                2단계 인증이 활성화되어 있습니다. 로그인 시 인증 앱의 코드를 입력해야 합니다.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            {mfaEnabled ? (
              <Button
                variant="outline"
                onClick={handleDisableMFA}
                disabled={isSettingUp}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {isSettingUp ? "처리 중..." : "2FA 비활성화"}
              </Button>
            ) : (
              <Button
                onClick={handleEnableMFA}
                disabled={isSettingUp}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isSettingUp ? "설정 중..." : "2FA 활성화"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* MFA 설정 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>2단계 인증 설정</DialogTitle>
            <DialogDescription>
              Google Authenticator 앱으로 QR 코드를 스캔하세요
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* QR 코드 */}
            {qrCodeUrl && (
              <div className="flex flex-col items-center gap-2">
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                <p className="text-sm text-gray-600 text-center">
                  Google Authenticator 앱에서<br />위 QR 코드를 스캔하세요
                </p>
              </div>
            )}

            {/* 비밀 키 (수동 입력용) */}
            {secret && (
              <div>
                <Label htmlFor="secret">비밀 키 (수동 입력용)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="secret"
                    value={secret}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopySecret}
                  >
                    {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  QR 코드를 스캔할 수 없는 경우 이 키를 수동으로 입력하세요
                </p>
              </div>
            )}

            {/* OTP 입력 */}
            <div>
              <Label htmlFor="otp">인증 코드 (6자리)</Label>
              <Input
                id="otp"
                type="text"
                maxLength={6}
                value={otpToken}
                onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="mt-1 text-center text-2xl tracking-widest font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                인증 앱에 표시된 6자리 코드를 입력하세요
              </p>
            </div>

            {/* 복구 코드 */}
            {backupCodes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>복구 코드</Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyBackupCodes}
                    className="h-auto p-1 text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    복사
                  </Button>
                </div>
                <div className="bg-gray-50 p-3 rounded border text-xs font-mono grid grid-cols-2 gap-2">
                  {backupCodes.map((code, idx) => (
                    <div key={idx}>{code}</div>
                  ))}
                </div>
                <Alert className="mt-2">
                  <AlertDescription className="text-xs">
                    복구 코드를 안전한 곳에 보관하세요. 인증 앱을 분실한 경우 이 코드로 계정에 접근할 수 있습니다.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* 확인 버튼 */}
            <Button
              onClick={handleVerifyOTP}
              disabled={isSettingUp || otpToken.length !== 6}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isSettingUp ? "확인 중..." : "인증 코드 확인"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
