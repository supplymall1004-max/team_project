/**
 * @file lib/royal-recipes/parser.ts
 * @description 궁중 레시피 마크다운 파일 파싱 유틸리티
 */

import fs from "fs";
import path from "path";

export type RecipeEra = "sanguk" | "goryeo" | "joseon";

export interface RoyalRecipe {
  id: string;
  era: RecipeEra;
  title: string;
  number: number;
  content: {
    characteristics?: string;
    ingredients?: string;
    steps: string[];
    tips?: string[];
  };
  rawContent: string; // 마크다운 원본
}

interface ParsedSection {
  title: string;
  number: number;
  content: string;
}

/**
 * 마크다운 파일에서 레시피 섹션을 파싱합니다.
 */
function parseMarkdownSections(content: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  // Windows와 Unix 개행 문자 모두 처리
  const lines = content.split(/\r?\n/);

  let currentSection: ParsedSection | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    // ## 번호. 제목 형식 매칭 (개행 문자 무시)
    const sectionMatch = line.trim().match(/^##\s+(\d+)\.\s+(.+)$/);

    if (sectionMatch) {
      // 이전 섹션 저장
      if (currentSection) {
        currentSection.content = currentContent.join("\n").trim();
        sections.push(currentSection);
      }

      // 새 섹션 시작
      currentSection = {
        title: sectionMatch[2].trim(),
        number: parseInt(sectionMatch[1], 10),
        content: "",
      };
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }
  
  // 마지막 섹션 저장
  if (currentSection) {
    currentSection.content = currentContent.join("\n").trim();
    sections.push(currentSection);
  }
  
  return sections;
}

/**
 * 섹션 내용을 구조화된 데이터로 변환합니다.
 */
function parseSectionContent(content: string): RoyalRecipe["content"] {
  const lines = content.split("\n").filter(line => line.trim());
  const result: RoyalRecipe["content"] = {
    steps: [],
  };
  
  let currentSection: keyof typeof result | null = null;
  const stepLines: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // **특징:** 또는 **주재료:** 등 섹션 헤더
    if (trimmed.startsWith("**특징:**")) {
      result.characteristics = trimmed.replace("**특징:**", "").trim();
      currentSection = null;
    } else if (trimmed.startsWith("**재료 대체:**")) {
      result.ingredients = trimmed.replace("**재료 대체:**", "").trim();
      currentSection = null;
    } else if (trimmed.startsWith("**주재료:**")) {
      result.ingredients = trimmed.replace("**주재료:**", "").trim();
      currentSection = null;
    } else if (trimmed.startsWith("**조리 순서 및 팁:**")) {
      currentSection = "steps";
      stepLines.length = 0;
    } else if (trimmed.startsWith("**추가 팁:**")) {
      currentSection = "tips";
      if (!result.tips) result.tips = [];
    } else if (currentSection === "steps" && trimmed.match(/^\d+\./)) {
      // 번호가 있는 단계
      stepLines.push(trimmed.replace(/^\d+\.\s*/, "").trim());
    } else if (currentSection === "tips" && trimmed.startsWith("-")) {
      // 팁 항목
      if (!result.tips) result.tips = [];
      result.tips.push(trimmed.replace(/^-\s*/, "").trim());
    } else if (currentSection === "steps" && trimmed && !trimmed.startsWith("---")) {
      // 단계 내용 (번호 없이)
      stepLines.push(trimmed);
    }
  }
  
  result.steps = stepLines.filter(step => step.length > 0);
  
  return result;
}

/**
 * 시대별 레시피를 파싱합니다.
 */
export function parseRoyalRecipes(era: RecipeEra): RoyalRecipe[] {
  const filePath = path.join(
    process.cwd(),
    "docs",
    "royalrecipe",
    "잊혀져 가는 시대별 궁중 레시피.md"
  );


  try {
    const content = fs.readFileSync(filePath, "utf-8");
    
    // 시대별 섹션 추출
    let eraSection = "";
    const eraHeaders: Record<RecipeEra, string> = {
      sanguk: "# 삼국시대 및 통일신라 궁중 레시피",
      goryeo: "# 고려시대 궁중 레시피",
      joseon: "# 조선시대 궁중 레시피",
    };

    const lines = content.split("\n");
    let inEraSection = false;
    let eraStartIndex = -1;

    console.log(`[parseRoyalRecipes] ${era} 시대 헤더 찾기: "${eraHeaders[era]}"`);
    console.log(`[parseRoyalRecipes] 전체 라인 수: ${lines.length}`);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim() === eraHeaders[era]) {
        inEraSection = true;
        eraStartIndex = i;
        console.log(`[parseRoyalRecipes] ${era} 시대 섹션 시작: 라인 ${i}`);
      } else if (inEraSection && line.startsWith("# ") && i > eraStartIndex) {
        // 다음 시대 섹션 시작
        eraSection = lines.slice(eraStartIndex, i).join("\n");
        console.log(`[parseRoyalRecipes] ${era} 시대 섹션 종료: 라인 ${i}`);
        break;
      }
    }

    if (inEraSection && eraSection === "") {
      // 마지막 섹션인 경우
      eraSection = lines.slice(eraStartIndex).join("\n");
      console.log(`[parseRoyalRecipes] ${era} 시대 마지막 섹션`);
    }

    console.log(`[parseRoyalRecipes] ${era} 시대 섹션 길이: ${eraSection.length}`);

    if (!eraSection) {
      console.warn(`[parseRoyalRecipes] ${era} 시대 섹션을 찾을 수 없습니다.`);
      return [];
    }
    
    // 섹션 파싱
    const sections = parseMarkdownSections(eraSection);

    return sections.map((section) => {
      const content = parseSectionContent(section.content);
      const slug = createSlug(section.title);

      return {
        id: slug,
        era,
        title: section.title,
        number: section.number,
        content,
        rawContent: section.content,
      };
    });
  } catch (error) {
    console.error(`[parseRoyalRecipes] ${era} 시대 레시피 파싱 실패:`, error);
    return [];
  }
}

/**
 * 제목에서 한자 표기를 분리합니다.
 */
export function parseTitleWithHanja(title: string): { korean: string; hanja?: string } {
  // 괄호 안의 한자 표기 추출 (例: 감시해 (甘시해))
  const hanjaMatch = title.match(/\(([^)]+)\)$/);

  if (hanjaMatch) {
    const korean = title.replace(/\s*\([^)]+\)$/, "").trim();
    const hanja = hanjaMatch[1].trim();
    return { korean, hanja };
  }

  return { korean: title };
}

/**
 * 제목에서 slug를 생성합니다.
 */
function createSlug(title: string): string {
  return title
    .replace(/[()（）]/g, "") // 괄호 제거
    .replace(/\s+/g, "-") // 공백을 하이픈으로
    .replace(/[^\w가-힣-]/g, "") // 특수문자 제거
    .toLowerCase();
}

/**
 * 모든 시대의 레시피를 파싱합니다.
 */
export function parseAllRoyalRecipes(): Record<RecipeEra, RoyalRecipe[]> {
  return {
    sanguk: parseRoyalRecipes("sanguk"),
    goryeo: parseRoyalRecipes("goryeo"),
    joseon: parseRoyalRecipes("joseon"),
  };
}

