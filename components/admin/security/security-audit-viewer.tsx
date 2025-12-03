/**
 * @file components/admin/security/security-audit-viewer.tsx
 * @description 관리자 보안 감사 로그 뷰어
 */

"use client";

import { useState, useEffect } from "react";
import { FileText, Shield, AlertTriangle, CheckCircle, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SecurityAuditLog {
  id: string;
  action: string;
  user_id: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export function SecurityAuditViewer() {
  const [logs, setLogs] = useState<SecurityAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  // 임시 데이터
  useEffect(() => {
    setLogs([
      {
        id: "1",
        action: "password-change",
        user_id: "user_123",
        details: { success: true },
        ip_address: "192.168.1.1",
        user_agent: "Chrome/120.0",
        created_at: "2025-01-27T10:30:00Z",
      },
      {
        id: "2",
        action: "admin-access",
        user_id: "user_123",
        details: { section: "popups" },
        ip_address: "192.168.1.1",
        user_agent: "Chrome/120.0",
        created_at: "2025-01-27T09:15:00Z",
      },
    ]);
  }, []);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "password-change":
        return <Shield className="h-4 w-4" />;
      case "admin-access":
        return <Settings className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      "password-change": "비밀번호 변경",
      "mfa-enable": "2FA 활성화",
      "mfa-disable": "2FA 비활성화",
      "session-revoke": "세션 종료",
      "admin-access": "관리자 접근",
    };
    return labels[action] || action;
  };

  const filteredLogs = logs.filter(log =>
    !filter || filter === "all" || log.action === filter
  );

  return (
    <div className="max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            보안 감사 로그
          </CardTitle>
          <p className="text-sm text-gray-600">
            보안 관련 이벤트와 관리자 활동을 기록한 로그입니다.
          </p>
        </CardHeader>

        <CardContent>
          {/* 필터 */}
          <div className="flex gap-4 mb-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="모든 이벤트" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 이벤트</SelectItem>
                <SelectItem value="password-change">비밀번호 변경</SelectItem>
                <SelectItem value="mfa-enable">2FA 활성화</SelectItem>
                <SelectItem value="mfa-disable">2FA 비활성화</SelectItem>
                <SelectItem value="session-revoke">세션 종료</SelectItem>
                <SelectItem value="admin-access">관리자 접근</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 로그 테이블 */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>시간</TableHead>
                <TableHead>이벤트</TableHead>
                <TableHead>사용자</TableHead>
                <TableHead>IP 주소</TableHead>
                <TableHead>상세</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    로그가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(log.created_at).toLocaleString('ko-KR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="text-sm">{getActionLabel(log.action)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {log.user_id}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {log.ip_address}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="text-sm text-gray-600 truncate" title={JSON.stringify(log.details)}>
                        {JSON.stringify(log.details)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {filteredLogs.length > 0 && (
            <div className="mt-4 text-sm text-gray-500 text-center">
              총 {filteredLogs.length}개의 로그가 있습니다.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
