/**
 * @file components/admin/security/session-management-panel.tsx
 * @description 관리자 세션 관리 패널
 */

"use client";

import { useState } from "react";
import { Monitor, Smartphone, LogOut, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Session {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
}

export function SessionManagementPanel() {
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: "1",
      device: "Chrome on Windows",
      location: "서울, 대한민국",
      lastActive: "2025-01-27 14:30",
      current: true,
    },
    {
      id: "2",
      device: "Safari on iPhone",
      location: "서울, 대한민국",
      lastActive: "2025-01-26 09:15",
      current: false,
    },
  ]);

  const handleRevokeSession = async (sessionId: string) => {
    // 세션 무효화 로직 구현 (추후)
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleRevokeAllOtherSessions = async () => {
    // 다른 모든 세션 무효화 로직 구현 (추후)
    setSessions(prev => prev.filter(s => s.current));
  };

  return (
    <div className="max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            세션 관리
          </CardTitle>
          <p className="text-sm text-gray-600">
            활성 세션을 확인하고 필요시 로그아웃할 수 있습니다.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              다른 기기에서 의심스러운 로그인을 발견하면 즉시 해당 세션을 종료하세요.
            </AlertDescription>
          </Alert>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>기기</TableHead>
                <TableHead>위치</TableHead>
                <TableHead>마지막 활동</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="w-32">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {session.device.includes("iPhone") || session.device.includes("Android") ? (
                        <Smartphone className="h-4 w-4" />
                      ) : (
                        <Monitor className="h-4 w-4" />
                      )}
                      <span className="text-sm">{session.device}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {session.location}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {session.lastActive}
                  </TableCell>
                  <TableCell>
                    {session.current ? (
                      <Badge variant="default">현재 세션</Badge>
                    ) : (
                      <Badge variant="secondary">활성</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {!session.current && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeSession(session.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="h-3 w-3 mr-1" />
                        로그아웃
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {sessions.length > 1 && (
            <div className="flex justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleRevokeAllOtherSessions}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                다른 모든 세션 로그아웃
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
























