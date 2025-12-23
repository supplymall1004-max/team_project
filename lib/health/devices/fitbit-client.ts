/**
 * @file fitbit-client.ts
 * @description Fitbit API 클라이언트
 *
 * Fitbit API를 통해 건강 데이터를 가져오는 클라이언트입니다.
 */

interface FitbitToken {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  user_id: string;
}

interface FitbitActivityData {
  steps: number;
  activeMinutes: number;
  calories: number;
  date: string;
}

interface FitbitSleepData {
  duration: number;
  deepSleep: number;
  lightSleep: number;
  remSleep: number;
  date: string;
}

interface FitbitHeartRateData {
  heartRate: number;
  timestamp: string;
}

interface FitbitWeightData {
  weight: number;
  timestamp: string;
}

/**
 * Fitbit API 클라이언트
 */
export class FitbitClient {
  private accessToken: string;
  private refreshToken: string;
  private expiresAt: Date;
  private userId: string;

  constructor(token: FitbitToken) {
    this.accessToken = token.access_token;
    this.refreshToken = token.refresh_token;
    this.expiresAt = new Date(token.expires_at);
    this.userId = token.user_id;
  }

  /**
   * 토큰 갱신
   */
  private async refreshAccessToken(): Promise<void> {
    if (new Date() < this.expiresAt) {
      return; // 아직 유효함
    }

    const clientId = process.env.FITBIT_CLIENT_ID;
    const clientSecret = process.env.FITBIT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Fitbit 설정이 완료되지 않았습니다');
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
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

    const response = await fetch(`https://api.fitbit.com/1${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Fitbit API 오류: ${error}`);
    }

    return response.json();
  }

  /**
   * 활동량 데이터 가져오기
   */
  async getActivityData(startDate: string, endDate: string): Promise<FitbitActivityData[]> {
    try {
      console.group('[FitbitClient] 활동량 데이터 조회');

      const result: FitbitActivityData[] = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      // 날짜별로 조회
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        
        try {
          const response = await this.request(`/user/${this.userId}/activities/date/${dateStr}.json`);
          
          if (response.summary) {
            result.push({
              steps: response.summary.steps || 0,
              activeMinutes: response.summary.fairlyActiveMinutes + response.summary.veryActiveMinutes || 0,
              calories: response.summary.caloriesOut || 0,
              date: dateStr,
            });
          }
        } catch (error) {
          console.warn(`[FitbitClient] ${dateStr} 데이터 조회 실패:`, error);
          // 계속 진행
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
   * 수면 데이터 가져오기
   */
  async getSleepData(startDate: string, endDate: string): Promise<FitbitSleepData[]> {
    try {
      console.group('[FitbitClient] 수면 데이터 조회');

      const result: FitbitSleepData[] = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      // 날짜별로 조회
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        
        try {
          const response = await this.request(`/user/${this.userId}/sleep/date/${dateStr}.json`);
          
          if (response.sleep && response.sleep.length > 0) {
            const sleep = response.sleep[0];
            const duration = sleep.duration || 0;
            const levels = sleep.levels?.summary || {};

            result.push({
              duration: Math.round(duration / 60000), // 밀리초를 분으로 변환
              deepSleep: levels.deep?.minutes || 0,
              lightSleep: levels.light?.minutes || 0,
              remSleep: levels.rem?.minutes || 0,
              date: dateStr,
            });
          }
        } catch (error) {
          console.warn(`[FitbitClient] ${dateStr} 수면 데이터 조회 실패:`, error);
          // 계속 진행
        }
      }

      console.log(`✅ 수면 데이터 조회 완료: ${result.length}건`);
      console.groupEnd();

      return result;
    } catch (error) {
      console.error('❌ 수면 데이터 조회 실패:', error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * 심박수 데이터 가져오기
   */
  async getHeartRateData(startDate: string, endDate: string): Promise<FitbitHeartRateData[]> {
    try {
      console.group('[FitbitClient] 심박수 데이터 조회');

      const result: FitbitHeartRateData[] = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      // 날짜별로 조회
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        
        try {
          const response = await this.request(`/user/${this.userId}/activities/heart/date/${dateStr}/1d.json`);
          
          if (response['activities-heart'] && response['activities-heart'].length > 0) {
            const heartData = response['activities-heart'][0];
            if (heartData.value?.restingHeartRate) {
              result.push({
                heartRate: heartData.value.restingHeartRate,
                timestamp: `${dateStr}T12:00:00`,
              });
            }
          }
        } catch (error) {
          console.warn(`[FitbitClient] ${dateStr} 심박수 데이터 조회 실패:`, error);
          // 계속 진행
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
  async getWeightData(startDate: string, endDate: string): Promise<FitbitWeightData[]> {
    try {
      console.group('[FitbitClient] 체중 데이터 조회');

      const result: FitbitWeightData[] = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      // 날짜 범위로 조회
      try {
        const response = await this.request(
          `/user/${this.userId}/body/weight/date/${startDate}/${endDate}.json`
        );
        
        if (response['body-weight']) {
          for (const weight of response['body-weight']) {
            result.push({
              weight: weight.value,
              timestamp: weight.dateTime,
            });
          }
        }
      } catch (error) {
        console.warn('[FitbitClient] 체중 데이터 조회 실패:', error);
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
