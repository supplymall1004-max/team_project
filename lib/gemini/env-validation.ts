/**
 * @file env-validation.ts
 * @description Gemini API 관련 환경 변수 검증 및 연결 테스트
 */

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export interface GeminiEnvConfig {
  apiKey: string | undefined;
  hasApiKey: boolean;
  keyLength: number;
  keyPrefix: string;
}

/**
 * Gemini 환경 변수 설정 검증
 */
export function validateGeminiEnvironment(): EnvValidationResult {
  console.groupCollapsed?.("[GeminiEnv] validateGeminiEnvironment");

  const config = extractGeminiConfig();
  const result: EnvValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    recommendations: []
  };

  try {
    // 필수 환경 변수 체크
    if (!config.hasApiKey) {
      result.isValid = false;
      result.errors.push("GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.");
      result.recommendations.push(
        "1. Google AI Studio (https://makersuite.google.com/app/apikey)에서 API 키를 생성하세요.",
        "2. 생성된 키를 .env.local 파일에 GEMINI_API_KEY=your_key_here 형식으로 추가하세요.",
        "3. 개발 환경에서는 .env.local, 프로덕션에서는 Supabase Edge Function 환경 변수에 설정하세요."
      );
      console.error?.("GEMINI_API_KEY not found");
      return result;
    }

    // API 키 형식 검증
    if (!config.apiKey!.startsWith("AIza")) {
      result.isValid = false;
      result.errors.push("GEMINI_API_KEY 형식이 올바르지 않습니다. Google AI API 키는 'AIza'로 시작해야 합니다.");
      result.recommendations.push("Google AI Studio에서 생성한 올바른 API 키를 사용하세요.");
    }

    // 키 길이 검증 (Google AI 키는 보통 39자)
    if (config.keyLength !== 39) {
      result.warnings.push(`API 키 길이가 비정상적입니다. 예상: 39자, 실제: ${config.keyLength}자`);
    }

    // 연결 테스트 권장
    if (result.isValid) {
      result.recommendations.push(
        "연결 테스트를 실행하려면 다음 명령어를 사용하세요:",
        "curl \"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_KEY\" \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"contents\": [{\"parts\": [{\"text\": \"Hello\"}]}]}'"
      );
    }

    console.log?.("validation result", {
      isValid: result.isValid,
      errors: result.errors.length,
      warnings: result.warnings.length
    });

    return result;
  } finally {
    console.groupEnd?.();
  }
}

/**
 * 환경 변수에서 Gemini 설정 추출
 */
export function extractGeminiConfig(): GeminiEnvConfig {
  const apiKey = process.env.GEMINI_API_KEY;

  return {
    apiKey,
    hasApiKey: Boolean(apiKey && apiKey.trim().length > 0),
    keyLength: apiKey?.length ?? 0,
    keyPrefix: apiKey?.substring(0, 4) ?? ""
  };
}

/**
 * 검증 결과를 사용자 친화적인 메시지로 변환
 */
export function formatValidationMessage(result: EnvValidationResult): string {
  const lines: string[] = [];

  if (result.isValid) {
    lines.push("✅ Gemini API 환경 설정이 올바릅니다.");
  } else {
    lines.push("❌ Gemini API 환경 설정에 문제가 있습니다:");
    result.errors.forEach(error => lines.push(`   - ${error}`));
  }

  if (result.warnings.length > 0) {
    lines.push("\n⚠️  경고:");
    result.warnings.forEach(warning => lines.push(`   - ${warning}`));
  }

  if (result.recommendations.length > 0) {
    lines.push("\n💡 권장 사항:");
    result.recommendations.forEach(rec => lines.push(`   - ${rec}`));
  }

  return lines.join("\n");
}

/**
 * 개발 환경용 빠른 검증 함수
 */
export async function quickEnvCheck(): Promise<void> {
  const result = validateGeminiEnvironment();
  const message = formatValidationMessage(result);

  console.log(message);

  if (!result.isValid) {
    // 개발 환경에서는 에러를 throw하지 않고 경고만 출력
    console.warn("Gemini API가 설정되지 않아 이미지 생성이 작동하지 않을 수 있습니다.");
  }
}
