// 식단 API 테스트
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.method === 'POST' && options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function testDietAPI() {
  console.log('🍽️ AI 맞춤 식단 API 테스트 시작...\n');

  try {
    // 1. 건강 정보 확인 API 테스트
    console.log('1. 건강 정보 확인 테스트...');
    const healthCheckResponse = await makeRequest('http://localhost:3000/api/health/check');
    console.log(`   상태: ${healthCheckResponse.status}`);
    if (healthCheckResponse.status === 200) {
      console.log(`   결과: ${JSON.stringify(healthCheckResponse.data, null, 2)}\n`);
    } else {
      console.log(`   오류: ${healthCheckResponse.data}\n`);
    }

    // 2. 식단 생성 API 테스트
    console.log('2. 식단 생성 API 테스트...');
    const dietResponse = await makeRequest('http://localhost:3000/api/diet/plan?date=2025-01-25');
    console.log(`   상태: ${dietResponse.status}`);

    if (dietResponse.status === 200) {
      console.log('   ✅ 식단 생성 성공!');
      const dietData = dietResponse.data;
      console.log(`   아침: ${dietData.dietPlan?.breakfast?.recipe?.title || '없음'}`);
      console.log(`   점심: ${dietData.dietPlan?.lunch?.recipe?.title || '없음'}`);
      console.log(`   저녁: ${dietData.dietPlan?.dinner?.recipe?.title || '없음'}`);
      console.log(`   간식: ${dietData.dietPlan?.snack?.title || '없음'}`);
      console.log(`   총 칼로리: ${dietData.dietPlan?.totalNutrition?.calories || 0}kcal\n`);
    } else {
      console.log('   ❌ 식단 생성 실패');
      console.log(`   오류: ${JSON.stringify(dietResponse.data, null, 2)}\n`);
    }

  } catch (error) {
    console.error('테스트 중 오류 발생:', error.message);
  }
}

// 서버가 시작될 때까지 잠시 기다린 후 테스트
setTimeout(testDietAPI, 3000);
