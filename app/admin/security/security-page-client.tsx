/**
 * @file app/admin/security/security-page-client.tsx
 * @description 관리자 보안 설정 페이지 클라이언트 컴포넌트
 *
 * 주요 기능:
 * 1. 요약 카드: 최근 비밀번호 변경일, 2FA 상태, 계정 잠금 상태
 * 2. 작업 리스트: 비밀번호 변경, 2FA 설정, 세션 관리, 감사 로그
 * 3. 세부 패널: 선택된 작업의 상세 설정 UI
 */

"use client";

import { useState } from "react";
import { Shield, Key, Smartphone, LogOut, FileText, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PasswordChangePanel } from "@/components/admin/security/password-change-panel";
import { MfaSetupPanel } from "@/components/admin/security/mfa-setup-panel";
import { SessionManagementPanel } from "@/components/admin/security/session-management-panel";
import { SecurityAuditViewer } from "@/components/admin/security/security-audit-viewer";

type SecuritySection = "password" | "mfa" | "sessions" | "audit";

interface SecuritySummary {
  lastPasswordChange: string;
  mfaEnabled: boolean;
  accountLocked: boolean;
  activeSessions: number;
  recentFailedLogins: number;
}

export function AdminSecurityClient() {
  const [activeSection, setActiveSection] = useState<SecuritySection>("password");

  // 임시 요약 데이터 (실제로는 API에서 가져와야 함)
  const securitySummary: SecuritySummary = {
    lastPasswordChange: "2025-01-15",
    mfaEnabled: false,
    accountLocked: false,
    activeSessions: 2,
    recentFailedLogins: 0,
  };

  const sections = [
    {
      id: "password" as const,
      title: "비밀번호 변경",
      description: "관리자 계정 비밀번호를 안전하게 변경합니다",
      icon: Key,
      component: PasswordChangePanel,
      urgent: false,
    },
    {
      id: "mfa" as const,
      title: "2단계 인증",
      description: "추가 보안을 위해 2FA를 설정합니다",
      icon: Smartphone,
      component: MfaSetupPanel,
      urgent: !securitySummary.mfaEnabled,
    },
    {
      id: "sessions" as const,
      title: "세션 관리",
      description: "활성 세션을 확인하고 필요시 로그아웃합니다",
      icon: LogOut,
      component: SessionManagementPanel,
      urgent: securitySummary.activeSessions > 1,
    },
    {
      id: "audit" as const,
      title: "보안 감사 로그",
      description: "보안 관련 이벤트 로그를 확인합니다",
      icon: FileText,
      component: SecurityAuditViewer,
      urgent: securitySummary.recentFailedLogins > 0,
    },
  ];

  const ActiveComponent = sections.find(s => s.id === activeSection)?.component || PasswordChangePanel;

  return (
    <div className="h-full flex">
      {/* 좌측 메뉴 */}
      <div className="w-80 border-r border-gray-200 bg-gray-50">
        {/* 요약 카드 */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" />
            보안 현황
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">마지막 비밀번호 변경</span>
              <span className="text-sm font-medium">
                {new Date(securitySummary.lastPasswordChange).toLocaleDateString('ko-KR')}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">2단계 인증</span>
              <Badge variant={securitySummary.mfaEnabled ? "default" : "secondary"}>
                {securitySummary.mfaEnabled ? "활성" : "비활성"}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">활성 세션</span>
              <Badge variant={securitySummary.activeSessions > 1 ? "outline" : "secondary"}>
                {securitySummary.activeSessions}개
              </Badge>
            </div>

            {securitySummary.recentFailedLogins > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  최근 실패 로그인
                </span>
                <Badge variant="destructive">
                  {securitySummary.recentFailedLogins}회
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* 작업 리스트 */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">보안 작업</h3>
          <div className="space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-orange-100 border-orange-200 text-orange-900"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 ${isActive ? "text-orange-600" : "text-gray-500"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium truncate">{section.title}</h4>
                        {section.urgent && (
                          <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 우측 콘텐츠 */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}
























