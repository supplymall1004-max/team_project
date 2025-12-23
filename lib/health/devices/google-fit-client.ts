/**
 * @file google-fit-client.ts
 * @description Google Fit API 클라이언트
 *
 * Google Fit API를 통해 건강 데이터를 가져오는 클라이언트입니다.
 */

interface GoogleFitToken {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  user_id: string;
}

interface GoogleFitActivityData {
  steps: number;
  activeMinutes: number;
  calories: number;
  date: string;
}

interface GoogleFitHeartRateData {
  heartRate: number;
  timestamp: string;
}

interface GoogleFitWeightData {
  weight: number;
  timestamp: string;
}

/**
 * Google Fit API 클라이언트
 */
export class GoogleFitClient {
  private accessToken: string;
  private refreshToken: string;
  private expiresAt: Date;

  constructor(token: GoogleFitToken) {
    this.accessToken = token.access_token;
    this.refreshToken = token.refresh_token;
    this.expiresAt = new Date(token.expires_at);
  }

  /**
   * 토큰 갱신
   */
  private async refreshAccessToken(): Promise<void> {
    if (new Date() < this.expiresAt) {
      return; // 아직 유효함
    }

    const clientId = process.env.GOOGLE_FIT_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_FIT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Google Fit 설정이 완료되지 않았습니다');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('토큰 갱신 실패');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.expiresAt = new Date(Date.now() + data.expires_in * 1000);
  }

  /**
   * API 요청 헬퍼
   */
  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    await this.refreshAccessToken();

    const response = await fetch(`https://www.googleapis.com/fitness/v1${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Fit API 오류: ${error}`);
    }

    return response.json();
  }

  /**
   * 활동량 데이터 가져오기
   */
  async getActivityData(startDate: string, endDate: string): Promise<GoogleFitActivityData[]> {
    try {
      console.group('[GoogleFitClient] 활동량 데이터 조회');

      // Google Fit API는 데이터 소스와 세션을 통해 활동량을 조회합니다
      // 여기서는 간단한 예시를 제공하고, 실제 구현 시 Google Fit API 문서를 참고해야 합니다
      
      const startTime = new Date(startDate).getTime() * 1000000; // 나노초 단위
      const endTime = new Date(endDate).getTime() * 1000000;

      // 활동량 데이터 소스 조회
      const dataSourcesResponse = await this.request('/users/me/dataSources');
      
      // 걸음 수 데이터 가져오기
      const stepsResponse = await this.request(
        `/users/me/dataset:aggregate`,
        {
          method: 'POST',
          body: JSON.stringify({
            aggregateBy: [{
              dataTypeName: 'com.google.step_count.delta',
            }],
            bucketByTime: { durationMillis: 86400000 }, // 1일
            startTimeMillis: startTime / 1000000,
            endTimeMillis: endTime / 1000000,
          }),
        }
      );

      const result: GoogleFitActivityData[] = [];

      // 버킷 데이터 파싱
      if (stepsResponse.bucket) {
        for (const bucket of stepsResponse.bucket) {
          const date = new Date(parseInt(bucket.startTimeMillis));
          let steps = 0;
          let activeMinutes = 0;
          let calories = 0;

          // 걸음 수 집계
          if (bucket.dataset && bucket.dataset[0]?.point) {
            for (const point of bucket.dataset[0].point) {
              if (point.value && point.value[0]?.intVal) {
                steps += point.value[0].intVal;
              }
            }
          }

          // 활동 시간 및 칼로리는 별도 API 호출 필요
          // 여기서는 기본값 사용

          result.push({
            steps,
            activeMinutes,
            calories,
            date: date.toISOString().split('T')[0],
          });
        }
      }

      console.log(`✅ 활동량 데이터 조회 완료: ${result.length}건`);
      console.groupEnd();

      return result;
    } catch (error) {
      console.error('❌ 활동량 데이터 조회 실패:', error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * 심박수 데이터 가져오기
   */
  async getHeartRateData(startDate: string, endDate: string): Promise<GoogleFitHeartRateData[]> {
    try {
      console.group('[GoogleFitClient] 심박수 데이터 조회');

      const startTime = new Date(startDate).getTime() * 1000000;
      const endTime = new Date(endDate).getTime() * 1000000;

      const response = await this.request(
        `/users/me/dataset:aggregate`,
        {
          method: 'POST',
          body: JSON.stringify({
            aggregateBy: [{
              dataTypeName: 'com.google.heart_rate.bpm',
            }],
            bucketByTime: { durationMillis: 3600000 }, // 1시간
            startTimeMillis: startTime / 1000000,
            endTimeMillis: endTime / 1000000,
          }),
        }
      );

      const result: GoogleFitHeartRateData[] = [];

      if (response.bucket) {
        for (const bucket of response.bucket) {
          if (bucket.dataset && bucket.dataset[0]?.point) {
            for (const point of bucket.dataset[0].point) {
              if (point.value && point.value[0]?.fpVal) {
                result.push({
                  heartRate: Math.round(point.value[0].fpVal),
                  timestamp: new Date(parseInt(point.startTimeNanos) / 1000000).toISOString(),
                });
              }
            }
          }
        }
      }

      console.log(`✅ 심박수 데이터 조회 완료: ${result.length}건`);
      console.groupEnd();

      return result;
    } catch (error) {
      console.error('❌ 심박수 데이터 조회 실패:', error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * 체중 데이터 가져오기
   */
  async getWeightData(startDate: string, endDate: string): Promise<GoogleFitWeightData[]> {
    try {
      console.group('[GoogleFitClient] 체중 데이터 조회');

      const startTime = new Date(startDate).getTime() * 1000000;
      const endTime = new Date(endDate).getTime() * 1000000;

      const response = await this.request(
        `/users/me/dataset:aggregate`,
        {
          method: 'POST',
          body: JSON.stringify({
            aggregateBy: [{
              dataTypeName: 'com.google.weight',
            }],
            bucketByTime: { durationMillis: 86400000 }, // 1일
            startTimeMillis: startTime / 1000000,
            endTimeMillis: endTime / 1000000,
          }),
        }
      );

      const result: GoogleFitWeightData[] = [];

      if (response.bucket) {
        for (const bucket of response.bucket) {
          if (bucket.dataset && bucket.dataset[0]?.point) {
            for (const point of bucket.dataset[0].point) {
              if (point.value && point.value[0]?.fpVal) {
                result.push({
                  weight: point.value[0].fpVal,
                  timestamp: new Date(parseInt(point.startTimeNanos) / 1000000).toISOString(),
                });
              }
            }
          }
        }
      }

      console.log(`✅ 체중 데이터 조회 완료: ${result.length}건`);
      console.groupEnd();

      return result;
    } catch (error) {
      console.error('❌ 체중 데이터 조회 실패:', error);
      console.groupEnd();
      throw error;
    }
  }
}
