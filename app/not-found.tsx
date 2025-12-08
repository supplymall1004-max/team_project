import Link from "next/link";
import { Home, Search, ChefHat } from "lucide-react";

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
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Home className="h-4 w-4" />
            홈으로 가기
          </Link>
          <Link
            href="/recipes"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all h-9 px-4 py-2 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground"
          >
            <ChefHat className="h-4 w-4" />
            레시피 보기
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all h-9 px-4 py-2 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground"
          >
            <Search className="h-4 w-4" />
            검색하기
          </Link>
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

