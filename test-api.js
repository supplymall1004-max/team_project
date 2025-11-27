// API 테스트용 임시 파일
const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('API 테스트 시작...');

    // 건강 정보 조회 테스트 (실제로는 인증이 필요하지만 구조 확인용)
    const healthResponse = await fetch('http://localhost:3000/api/health/profile');
    console.log('건강 정보 API 상태:', healthResponse.status);

    // 식단 생성 테스트
    const dietResponse = await fetch('http://localhost:3000/api/diet/plan?date=2025-01-25');
    console.log('식단 API 상태:', dietResponse.status);

    if (dietResponse.status !== 200) {
      const errorText = await dietResponse.text();
      console.log('식단 API 오류:', errorText);
    } else {
      const dietData = await dietResponse.json();
      console.log('식단 API 성공:', dietData);
    }

  } catch (error) {
    console.error('테스트 오류:', error);
  }
}

testAPI();
