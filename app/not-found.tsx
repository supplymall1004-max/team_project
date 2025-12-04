import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Search, ChefHat } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - 페이지를 찾을 수 없습니다",
  description: "요청하신 페이지를 찾을 수 없습니다.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700">
            페이지를 찾을 수 없습니다
          </h2>
          <p className="text-gray-500">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              홈으로 가기
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/recipes">
              <ChefHat className="mr-2 h-4 w-4" />
              레시피 보기
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/search">
              <Search className="mr-2 h-4 w-4" />
              검색하기
            </Link>
          </Button>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-400">
            문제가 계속되면 관리자에게 문의해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}

