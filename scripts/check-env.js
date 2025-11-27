/**
 * 환경변수 확인 스크립트
 * Next.js 환경변수가 제대로 설정되었는지 확인합니다.
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const requiredEnvVars = {
  'Clerk': [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
  ],
  'Supabase': [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ],
};

console.log('🔍 환경변수 확인 중...\n');

let allValid = true;

for (const [category, vars] of Object.entries(requiredEnvVars)) {
  console.log(`📦 ${category} 환경변수:`);
  
  for (const varName of vars) {
    const value = process.env[varName];
    const isValid = value && value.trim() !== '';
    
    if (isValid) {
      // 값의 일부만 표시 (보안)
      const displayValue = varName.includes('SECRET') || varName.includes('KEY')
        ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
        : value;
      console.log(`  ✅ ${varName}: ${displayValue}`);
    } else {
      console.log(`  ❌ ${varName}: 설정되지 않음`);
      allValid = false;
    }
  }
  console.log('');
}

if (allValid) {
  console.log('✅ 모든 필수 환경변수가 설정되었습니다!');
  process.exit(0);
} else {
  console.log('❌ 일부 환경변수가 설정되지 않았습니다.');
  console.log('\n💡 .env 파일에 다음 변수들을 추가해주세요:');
  console.log('   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
  console.log('   - CLERK_SECRET_KEY');
  console.log('   - NEXT_PUBLIC_SUPABASE_URL');
  console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

