/**
 * 알림 설정 API 테스트 스크립트
 * 
 * 사용법:
 * 1. 개발 서버가 실행 중이어야 합니다 (pnpm dev)
 * 2. Clerk 인증이 필요하므로 실제 브라우저에서 테스트하는 것이 좋습니다
 * 
 * 이 스크립트는 API 엔드포인트가 올바르게 작동하는지 확인하는 데 도움이 됩니다.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 환경 변수 확인:');
console.log('SUPABASE_URL:', SUPABASE_URL ? '✅ 설정됨' : '❌ 없음');
console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 없음');

// 테스트 데이터
const testSettings = {
  kcdcAlerts: true,
  generalNotifications: false,
  healthPopups: true,
};

console.log('\n📝 테스트할 설정 데이터:');
console.log(JSON.stringify(testSettings, null, 2));

console.log('\n✅ 테스트 준비 완료');
console.log('💡 실제 테스트는 브라우저에서 /health/manage 페이지를 통해 진행하세요.');











