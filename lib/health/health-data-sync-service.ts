/**
 * @file lib/health/health-data-sync-service.ts
 * @description 건강정보 동기화 서비스 레이어
 * 
 * 핵심 기능:
 * 1. 데이터 소스별 동기화 로직 통합
 * 2. 에러 처리 및 재시도 로직
 * 3. 데이터 변환 및 정규화
 * 4. 동기화 로그 기록
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import {
  generateMyDataAuthUrl,
  getMyDataAccessToken,
  refreshMyDataAccessToken,
  fetchHospitalRecords as fetchMyDataHospitalRecords,
  fetchMedicationRecords as fetchMyDataMedicationRecords,
  fetchCheckupRecords as fetchMyDataCheckupRecords,
  type MyDataToken,
} from "./mydata-client";
import {
  generateHealthHighwayAuthUrl,
  getHealthHighwayAccessToken,
  refreshHealthHighwayAccessToken,
  fetchHospitalRecords as fetchHealthHighwayHospitalRecords,
  fetchMedicationRecords as fetchHealthHighwayMedicationRecords,
  fetchCheckupRecords as fetchHealthHighwayCheckupRecords,
  fetchVaccinationRecords as fetchHealthHighwayVaccinationRecords,
  type HealthHighwayToken,
} from "./health-highway-client";

/**
 * 데이터 소스 유형
 */
export type DataSourceType = "mydata" | "health_highway" | "manual";

/**
 * 동기화 타입
 */
export type SyncType = "full" | "incremental" | "manual";

/**
 * 동기화 결과
 */
export interface SyncResult {
  success: boolean;
  recordsSynced: number;
  hospitalRecordsCount: number;
  medicationRecordsCount: number;
  diseaseRecordsCount: number;
  checkupRecordsCount: number;
  error?: string;
  errorDetails?: Record<string, any>;
}

/**
 * 동기화 파라미터
 */
export interface SyncParams {
  userId: string;
  dataSourceId?: string;
  syncType?: SyncType;
  startDate?: string;
  endDate?: string;
  familyMemberId?: string;
}

/**
 * 데이터 소스 연결 정보 조회
 */
async function getDataSource(
  userId: string,
  dataSourceId?: string
): Promise<{ id: string; source_type: DataSourceType; connection_metadata: any } | null> {
  const supabase = getServiceRoleClient();

  let query = supabase
    .from("health_data_sources")
    .select("*")
    .eq("user_id", userId)
    .eq("connection_status", "connected");

  if (dataSourceId) {
    query = query.eq("id", dataSourceId);
  } else {
    query = query.limit(1);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    source_type: data.source_type as DataSourceType,
    connection_metadata: data.connection_metadata,
  };
}

/**
 * 토큰 갱신이 필요한지 확인
 */
function isTokenExpired(token: MyDataToken | HealthHighwayToken): boolean {
  return new Date() >= token.expires_at;
}

/**
 * 마이데이터 동기화 실행
 */
async function syncMyData(
  params: SyncParams,
  token: MyDataToken
): Promise<SyncResult> {
  console.group("[HealthDataSyncService] 마이데이터 동기화 시작");

  const result: SyncResult = {
    success: true,
    recordsSynced: 0,
    hospitalRecordsCount: 0,
    medicationRecordsCount: 0,
    diseaseRecordsCount: 0,
    checkupRecordsCount: 0,
  };

  try {
    // 토큰 만료 확인 및 갱신
    let accessToken = token.access_token;
    if (isTokenExpired(token)) {
      console.log("🔄 토큰 만료, 갱신 중...");
      const refreshedToken = await refreshMyDataAccessToken(token.refresh_token);
      accessToken = refreshedToken.access_token;
      
      // 갱신된 토큰 저장
      const supabase = getServiceRoleClient();
      await supabase
        .from("health_data_sources")
        .update({
          connection_metadata: {
            ...token,
            access_token: refreshedToken.access_token,
            refresh_token: refreshedToken.refresh_token,
            expires_at: refreshedToken.expires_at.toISOString(),
          },
        })
        .eq("user_id", params.userId);
    }

    // 병원 방문 기록 동기화
    console.log("📋 병원 방문 기록 동기화 중...");
    const hospitalRecords = await fetchMyDataHospitalRecords(accessToken, {
      startDate: params.startDate,
      endDate: params.endDate,
    });
    result.hospitalRecordsCount = hospitalRecords.length;

    // 약물 복용 기록 동기화
    console.log("💊 약물 복용 기록 동기화 중...");
    const medicationRecords = await fetchMyDataMedicationRecords(accessToken, {
      startDate: params.startDate,
      endDate: params.endDate,
    });
    result.medicationRecordsCount = medicationRecords.length;

    // 건강검진 기록 동기화
    console.log("🏥 건강검진 기록 동기화 중...");
    const checkupRecords = await fetchMyDataCheckupRecords(accessToken, {
      startDate: params.startDate,
      endDate: params.endDate,
    });
    result.checkupRecordsCount = checkupRecords.length;

    // 데이터베이스에 저장
    const { syncHospitalRecords } = await import("./hospital-records-sync");
    const { syncMedicationRecords } = await import("./medication-records-sync");
    const { syncDiseaseRecords, extractDiseaseRecordsFromHospitalRecord, syncDiseasesToHealthProfile } = await import("./disease-records-sync");
    const { syncCheckupRecords } = await import("./checkup-results-sync");

    // 병원 기록 저장 및 질병 기록 추출
    const hospitalSyncResult = await syncHospitalRecords(
      hospitalRecords,
      params.userId,
      params.familyMemberId || null,
      dataSource.id
    );
    
    // 병원 기록에서 질병 기록 추출
    const diseaseRecordsFromHospital: any[] = [];
    for (const hospitalRecord of hospitalRecords) {
      // 저장된 병원 기록 ID 조회
      const supabase = getServiceRoleClient();
      const { data: savedHospitalRecord } = await supabase
        .from("hospital_records")
        .select("id")
        .eq("user_id", params.userId)
        .eq("visit_date", hospitalRecord.visit_date || hospitalRecord.visitDate)
        .eq("hospital_name", hospitalRecord.hospital_name || hospitalRecord.hospitalName)
        .single();
      
      if (savedHospitalRecord) {
        const diseases = extractDiseaseRecordsFromHospitalRecord(
          hospitalRecord,
          params.userId,
          params.familyMemberId || null,
          savedHospitalRecord.id,
          dataSource.id
        );
        diseaseRecordsFromHospital.push(...diseases);
      }
    }

    // 약물 기록 저장
    const medicationSyncResult = await syncMedicationRecords(
      medicationRecords,
      params.userId,
      params.familyMemberId || null,
      null, // hospital_record_id는 나중에 연결 가능
      dataSource.id
    );

    // 질병 기록 저장
    const diseaseSyncResult = await syncDiseaseRecords(
      diseaseRecordsFromHospital,
      params.userId,
      params.familyMemberId || null,
      null,
      dataSource.id
    );
    result.diseaseRecordsCount = diseaseSyncResult.saved;

    // 건강검진 기록 저장
    const checkupSyncResult = await syncCheckupRecords(
      checkupRecords,
      params.userId,
      params.familyMemberId || null,
      dataSource.id
    );

    // user_health_profiles에 질병 정보 동기화
    await syncDiseasesToHealthProfile(params.userId);

    result.recordsSynced =
      hospitalSyncResult.saved +
      medicationSyncResult.saved +
      diseaseSyncResult.saved +
      checkupSyncResult.saved;

    console.log(`✅ 마이데이터 동기화 완료: ${result.recordsSynced}건`);
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("❌ 마이데이터 동기화 실패:", error);
    console.groupEnd();

    result.success = false;
    result.error = error instanceof Error ? error.message : "알 수 없는 오류";
    result.errorDetails = { error: String(error) };

    return result;
  }
}

/**
 * 건강정보고속도로 동기화 실행
 */
async function syncHealthHighway(
  params: SyncParams,
  token: HealthHighwayToken
): Promise<SyncResult> {
  console.group("[HealthDataSyncService] 건강정보고속도로 동기화 시작");

  const result: SyncResult = {
    success: true,
    recordsSynced: 0,
    hospitalRecordsCount: 0,
    medicationRecordsCount: 0,
    diseaseRecordsCount: 0,
    checkupRecordsCount: 0,
  };

  try {
    // 토큰 만료 확인 및 갱신
    let accessToken = token.access_token;
    if (isTokenExpired(token)) {
      console.log("🔄 토큰 만료, 갱신 중...");
      const refreshedToken = await refreshHealthHighwayAccessToken(token.refresh_token);
      accessToken = refreshedToken.access_token;

      // 갱신된 토큰 저장
      const supabase = getServiceRoleClient();
      await supabase
        .from("health_data_sources")
        .update({
          connection_metadata: {
            ...token,
            access_token: refreshedToken.access_token,
            refresh_token: refreshedToken.refresh_token,
            expires_at: refreshedToken.expires_at.toISOString(),
          },
        })
        .eq("user_id", params.userId);
    }

    // 병원 방문 기록 동기화
    console.log("📋 병원 방문 기록 동기화 중...");
    const hospitalRecords = await fetchHealthHighwayHospitalRecords(accessToken, {
      startDate: params.startDate,
      endDate: params.endDate,
    });
    result.hospitalRecordsCount = hospitalRecords.length;

    // 약물 복용 기록 동기화
    console.log("💊 약물 복용 기록 동기화 중...");
    const medicationRecords = await fetchHealthHighwayMedicationRecords(accessToken, {
      startDate: params.startDate,
      endDate: params.endDate,
    });
    result.medicationRecordsCount = medicationRecords.length;

    // 건강검진 기록 동기화
    console.log("🏥 건강검진 기록 동기화 중...");
    const checkupRecords = await fetchHealthHighwayCheckupRecords(accessToken, {
      startDate: params.startDate,
      endDate: params.endDate,
    });
    result.checkupRecordsCount = checkupRecords.length;

    // 데이터베이스에 저장
    const { syncHospitalRecords } = await import("./hospital-records-sync");
    const { syncMedicationRecords } = await import("./medication-records-sync");
    const { syncDiseaseRecords, extractDiseaseRecordsFromHospitalRecord, syncDiseasesToHealthProfile } = await import("./disease-records-sync");
    const { syncCheckupRecords } = await import("./checkup-results-sync");

    // 병원 기록 저장 및 질병 기록 추출
    const hospitalSyncResult = await syncHospitalRecords(
      hospitalRecords,
      params.userId,
      params.familyMemberId || null,
      dataSource.id
    );
    
    // 병원 기록에서 질병 기록 추출
    const supabase = getServiceRoleClient();
    const diseaseRecordsFromHospital: any[] = [];
    for (const hospitalRecord of hospitalRecords) {
      // 저장된 병원 기록 ID 조회
      const { data: savedHospitalRecord } = await supabase
        .from("hospital_records")
        .select("id")
        .eq("user_id", params.userId)
        .eq("visit_date", hospitalRecord.visitDate || hospitalRecord.visit_date)
        .eq("hospital_name", hospitalRecord.hospitalName || hospitalRecord.hospital_name)
        .single();
      
      if (savedHospitalRecord) {
        const diseases = extractDiseaseRecordsFromHospitalRecord(
          hospitalRecord,
          params.userId,
          params.familyMemberId || null,
          savedHospitalRecord.id,
          dataSource.id
        );
        diseaseRecordsFromHospital.push(...diseases);
      }
    }

    // 약물 기록 저장
    const medicationSyncResult = await syncMedicationRecords(
      medicationRecords,
      params.userId,
      params.familyMemberId || null,
      null,
      dataSource.id
    );

    // 질병 기록 저장
    const diseaseSyncResult = await syncDiseaseRecords(
      diseaseRecordsFromHospital,
      params.userId,
      params.familyMemberId || null,
      null,
      dataSource.id
    );
    result.diseaseRecordsCount = diseaseSyncResult.saved;

    // 건강검진 기록 저장
    const checkupSyncResult = await syncCheckupRecords(
      checkupRecords,
      params.userId,
      params.familyMemberId || null,
      dataSource.id
    );

    // user_health_profiles에 질병 정보 동기화
    await syncDiseasesToHealthProfile(params.userId);

    result.recordsSynced =
      hospitalSyncResult.saved +
      medicationSyncResult.saved +
      diseaseSyncResult.saved +
      checkupSyncResult.saved;

    console.log(`✅ 건강정보고속도로 동기화 완료: ${result.recordsSynced}건`);
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("❌ 건강정보고속도로 동기화 실패:", error);
    console.groupEnd();

    result.success = false;
    result.error = error instanceof Error ? error.message : "알 수 없는 오류";
    result.errorDetails = { error: String(error) };

    return result;
  }
}

/**
 * 건강정보 동기화 실행 (메인 함수)
 */
export async function syncHealthData(params: SyncParams): Promise<SyncResult> {
  console.group("[HealthDataSyncService] 건강정보 동기화 시작");

  const startTime = Date.now();

  try {
    // 데이터 소스 조회
    const dataSource = await getDataSource(params.userId, params.dataSourceId);

    if (!dataSource) {
      console.error("❌ 연결된 데이터 소스를 찾을 수 없습니다.");
      console.groupEnd();
      return {
        success: false,
        recordsSynced: 0,
        hospitalRecordsCount: 0,
        medicationRecordsCount: 0,
        diseaseRecordsCount: 0,
        checkupRecordsCount: 0,
        error: "연결된 데이터 소스를 찾을 수 없습니다.",
      };
    }

    console.log(`📡 데이터 소스: ${dataSource.source_type}`);

    // 데이터 소스별 동기화 실행
    let syncResult: SyncResult;

    if (dataSource.source_type === "mydata") {
      const token = dataSource.connection_metadata as MyDataToken;
      syncResult = await syncMyData(params, token);
    } else if (dataSource.source_type === "health_highway") {
      const token = dataSource.connection_metadata as HealthHighwayToken;
      syncResult = await syncHealthHighway(params, token);
    } else {
      console.error("❌ 지원하지 않는 데이터 소스 유형:", dataSource.source_type);
      console.groupEnd();
      return {
        success: false,
        recordsSynced: 0,
        hospitalRecordsCount: 0,
        medicationRecordsCount: 0,
        diseaseRecordsCount: 0,
        checkupRecordsCount: 0,
        error: `지원하지 않는 데이터 소스 유형: ${dataSource.source_type}`,
      };
    }

    // 동기화 로그 기록
    const syncDuration = Date.now() - startTime;
    const supabase = getServiceRoleClient();
    await supabase.from("health_data_sync_logs").insert({
      user_id: params.userId,
      data_source_id: dataSource.id,
      sync_type: params.syncType || "manual",
      sync_status: syncResult.success ? "success" : "failed",
      records_synced: syncResult.recordsSynced,
      hospital_records_count: syncResult.hospitalRecordsCount,
      medication_records_count: syncResult.medicationRecordsCount,
      disease_records_count: syncResult.diseaseRecordsCount,
      checkup_records_count: syncResult.checkupRecordsCount,
      error_message: syncResult.error,
      error_details: syncResult.errorDetails,
      sync_duration_ms: syncDuration,
    });

    // 데이터 소스의 마지막 동기화 시간 업데이트
    if (syncResult.success) {
      await supabase
        .from("health_data_sources")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", dataSource.id);
    }

    console.log(`✅ 동기화 완료 (소요 시간: ${syncDuration}ms)`);
    console.groupEnd();

    return syncResult;
  } catch (error) {
    console.error("❌ 동기화 중 오류 발생:", error);
    console.groupEnd();

    return {
      success: false,
      recordsSynced: 0,
      hospitalRecordsCount: 0,
      medicationRecordsCount: 0,
      diseaseRecordsCount: 0,
      checkupRecordsCount: 0,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
      errorDetails: { error: String(error) },
    };
  }
}

/**
 * 데이터 소스 연결 URL 생성
 */
export async function generateConnectionUrl(
  userId: string,
  sourceType: DataSourceType,
  redirectUri: string
): Promise<string> {
  console.group("[HealthDataSyncService] 연결 URL 생성");

  const state = `${userId}_${Date.now()}`;

  let authUrl: string;

  if (sourceType === "mydata") {
    authUrl = generateMyDataAuthUrl(state);
  } else if (sourceType === "health_highway") {
    authUrl = generateHealthHighwayAuthUrl(state);
  } else {
    console.error("❌ 지원하지 않는 데이터 소스 유형:", sourceType);
    console.groupEnd();
    throw new Error(`지원하지 않는 데이터 소스 유형: ${sourceType}`);
  }

  console.log("✅ 연결 URL 생성 완료");
  console.groupEnd();

  return authUrl;
}

