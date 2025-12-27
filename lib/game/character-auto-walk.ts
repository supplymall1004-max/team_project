/**
 * @file lib/game/character-auto-walk.ts
 * @description 캐릭터 자동 이동 시스템
 *
 * 게임 이벤트 발생 시 캐릭터가 자동으로 플레이어 위치로 이동하는 시스템입니다.
 *
 * @dependencies
 * - @/lib/supabase/service-role: Supabase 서비스 역할 클라이언트
 * - @/lib/game/character-game-bridge: Unity-React 브릿지
 * - @/types/game/character-game-events: 게임 이벤트 타입
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { getCharacterGameBridge } from "@/lib/game/character-game-bridge";
import type {
  CharacterPosition,
  CharacterPositionData,
  UpdateCharacterPositionParams,
} from "@/types/game/character-game-events";

/**
 * 플레이어 위치 (고정 위치, Unity 게임 월드에서 설정)
 * 실제 Unity 게임에서 플레이어가 있는 위치로 설정해야 합니다.
 */
const PLAYER_POSITION: CharacterPosition = {
  x: 0,
  y: 0,
  z: 0,
};

/**
 * 캐릭터를 플레이어 위치로 이동
 */
export async function moveCharacterToPlayer(
  userId: string,
  familyMemberId: string
): Promise<void> {
  console.group("[CharacterAutoWalk] 캐릭터를 플레이어 위치로 이동");
  console.log("userId:", userId);
  console.log("familyMemberId:", familyMemberId);

  try {
    // 캐릭터 위치 조회 또는 생성
    const positionData = await getOrCreateCharacterPosition(userId, familyMemberId);

    // 목표 위치를 플레이어 위치로 설정
    const targetPosition = PLAYER_POSITION;

    // 데이터베이스에 위치 업데이트
    await updateCharacterPosition({
      user_id: userId,
      family_member_id: familyMemberId,
      target_position: targetPosition,
      activity_type: "walking",
    });

    // Unity로 이동 명령 전송
    const bridge = getCharacterGameBridge();
    bridge.moveCharacter(familyMemberId, targetPosition);

    console.log("✅ 캐릭터 이동 명령 전송 완료");
    console.log("목표 위치:", targetPosition);
    console.groupEnd();
  } catch (error) {
    console.error("❌ 캐릭터 이동 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 캐릭터 위치 조회 또는 생성
 */
async function getOrCreateCharacterPosition(
  userId: string,
  familyMemberId: string
): Promise<CharacterPositionData> {
  const supabase = getServiceRoleClient();

  // 기존 위치 조회
  const { data: existing, error: fetchError } = await supabase
    .from("character_positions")
    .select("*")
    .eq("user_id", userId)
    .eq("family_member_id", familyMemberId)
    .single();

  if (existing) {
    return existing as CharacterPositionData;
  }

  // 위치가 없으면 생성
  const defaultPosition: CharacterPosition = {
    x: Math.random() * 10 - 5, // -5 ~ 5 범위의 랜덤 위치
    y: 0,
    z: Math.random() * 10 - 5,
  };

  const { data: created, error: createError } = await supabase
    .from("character_positions")
    .insert({
      user_id: userId,
      family_member_id: familyMemberId,
      current_position: defaultPosition,
      target_position: null,
      activity_type: "idle",
    })
    .select()
    .single();

  if (createError) {
    throw new Error(`캐릭터 위치 생성 실패: ${createError.message}`);
  }

  return created as CharacterPositionData;
}

/**
 * 캐릭터 위치 업데이트
 */
export async function updateCharacterPosition(
  params: UpdateCharacterPositionParams
): Promise<CharacterPositionData> {
  console.group("[CharacterAutoWalk] 캐릭터 위치 업데이트");
  console.log("params:", params);

  const supabase = getServiceRoleClient();

  const updateData: any = {
    last_updated: new Date().toISOString(),
  };

  if (params.current_position) {
    updateData.current_position = params.current_position;
  }

  if (params.target_position !== undefined) {
    updateData.target_position = params.target_position;
  }

  if (params.activity_type !== undefined) {
    updateData.activity_type = params.activity_type;
  }

  // 기존 위치 확인
  const { data: existing } = await supabase
    .from("character_positions")
    .select("*")
    .eq("user_id", params.user_id)
    .eq("family_member_id", params.family_member_id)
    .single();

  let result;
  if (existing) {
    // 업데이트
    const { data, error } = await supabase
      .from("character_positions")
      .update(updateData)
      .eq("user_id", params.user_id)
      .eq("family_member_id", params.family_member_id)
      .select()
      .single();

    if (error) {
      console.error("❌ 위치 업데이트 실패:", error);
      console.groupEnd();
      throw new Error(`위치 업데이트 실패: ${error.message}`);
    }

    result = data;
  } else {
    // 생성
    const { data, error } = await supabase
      .from("character_positions")
      .insert({
        user_id: params.user_id,
        family_member_id: params.family_member_id,
        current_position: params.current_position || { x: 0, y: 0, z: 0 },
        target_position: params.target_position || null,
        activity_type: params.activity_type || "idle",
      })
      .select()
      .single();

    if (error) {
      console.error("❌ 위치 생성 실패:", error);
      console.groupEnd();
      throw new Error(`위치 생성 실패: ${error.message}`);
    }

    result = data;
  }

  console.log("✅ 캐릭터 위치 업데이트 완료");
  console.groupEnd();

  return result as CharacterPositionData;
}

/**
 * 캐릭터 위치 조회
 */
export async function getCharacterPosition(
  userId: string,
  familyMemberId: string
): Promise<CharacterPositionData | null> {
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from("character_positions")
    .select("*")
    .eq("user_id", userId)
    .eq("family_member_id", familyMemberId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // 레코드 없음
      return null;
    }
    throw new Error(`위치 조회 실패: ${error.message}`);
  }

  return data as CharacterPositionData;
}

/**
 * 모든 가족 구성원의 위치 조회
 */
export async function getAllFamilyMemberPositions(
  userId: string
): Promise<CharacterPositionData[]> {
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from("character_positions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`위치 조회 실패: ${error.message}`);
  }

  return (data || []) as CharacterPositionData[];
}

/**
 * 캐릭터가 목표 위치에 도착했을 때 호출 (Unity에서 호출)
 */
export async function onCharacterArrived(
  userId: string,
  familyMemberId: string,
  currentPosition: CharacterPosition
): Promise<void> {
  console.group("[CharacterAutoWalk] 캐릭터 도착 처리");
  console.log("userId:", userId);
  console.log("familyMemberId:", familyMemberId);
  console.log("currentPosition:", currentPosition);

  // 위치 업데이트 (목표 위치를 현재 위치로 설정)
  await updateCharacterPosition({
    user_id: userId,
    family_member_id: familyMemberId,
    current_position: currentPosition,
    target_position: null,
    activity_type: "idle",
  });

  console.log("✅ 캐릭터 도착 처리 완료");
  console.groupEnd();
}

