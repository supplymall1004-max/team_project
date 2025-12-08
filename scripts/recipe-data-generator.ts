/**
 * @file recipe-data-generator.ts
 * @description 레시피 데이터 생성 및 일괄 등록 스크립트
 * 
 * 각 레시피의 조리법을 웹 검색을 통해 찾아 블로그 스타일로 작성합니다.
 */

import { join } from 'path';

export interface RecipeData {
  title: string;
  description: string;
  difficulty: number; // 1-5
  cookingTimeMinutes: number;
  servings: number;
  ingredients: Array<{
    ingredient_name: string;
    quantity?: string;
    unit?: string;
    category: "곡물" | "채소" | "과일" | "육류" | "해산물" | "유제품" | "조미료" | "기타";
    is_optional?: boolean;
    preparation_note?: string;
  }>;
  steps: Array<{
    content: string;
    image_url?: string;
  }>;
  imageFilename: string; // docs/picture/ 파일명
}

// 이미지 경로는 generate-all-recipes.ts의 getImagePath 함수 사용

/**
 * 모든 레시피 데이터 (웹 검색을 통해 조리법 수집 필요)
 * 
 * 각 레시피는 블로그 스타일로 친근하고 재미있게 작성되어야 합니다.
 */
export const RECIPE_DATASET: RecipeData[] = [
  {
    title: '가지나물',
    description: '부드러운 식감과 고소한 맛이 일품인 여름철 반찬. 제철 가지를 활용하면 더욱 맛있게 즐길 수 있어요!',
    difficulty: 2,
    cookingTimeMinutes: 15,
    servings: 2,
    ingredients: [
      { ingredient_name: '가지', quantity: '2', unit: '개', category: '채소' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '깨소금', quantity: '약간', category: '조미료' },
      { ingredient_name: '쪽파', quantity: '약간', category: '채소', is_optional: true },
    ],
    steps: [
      {
        content: '가지를 깨끗이 씻어 꼭지를 제거한 후, 길쭉하게 반으로 자르고 다시 4~5cm 길이로 썰어주세요. 너무 얇게 썰면 물러질 수 있으니 적당한 두께가 중요해요!',
      },
      {
        content: '찜기에 물을 끓여 김이 오르면 썰어놓은 가지를 넣고 약 4분간 쪄줍니다. 너무 오래 찌면 물러지니 주의하세요. 포크로 찔러보면 촉촉하게 익었는지 확인할 수 있어요.',
      },
      {
        content: '볼에 국간장, 참기름, 다진 마늘, 깨소금을 넣고 잘 섞어 양념장을 만듭니다. 기호에 따라 고춧가루를 조금 넣어도 좋아요!',
      },
      {
        content: '찐 가지를 식힌 후 손으로 찢어 양념장에 넣고 조물조물 무쳐주세요. 기호에 따라 송송 썬 쪽파나 대파를 넣어도 좋아요. 따뜻한 밥과 함께 비벼 먹으면 더욱 맛있답니다!',
      },
    ],
    imageFilename: '가지나물.jpg',
  },
  {
    title: '감자국',
    description: '담백하고 시원한 국물 맛이 일품인 국으로, 아침 식사로도 제격이에요. 감자의 포슬포슬한 식감과 맑은 국물이 잘 어우러져 부담 없이 즐길 수 있답니다.',
    difficulty: 2,
    cookingTimeMinutes: 20,
    servings: 2,
    ingredients: [
      { ingredient_name: '감자', quantity: '2', unit: '개', category: '채소' },
      { ingredient_name: '양파', quantity: '1/2', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '멸치 육수', quantity: '6', unit: '컵', category: '기타' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
      { ingredient_name: '후추', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '감자는 껍질을 벗겨 도톰하게 반달 모양으로 썰고, 양파는 채 썰고, 대파는 어슷하게 썰어 준비합니다. 감자를 너무 얇게 썰면 쉽게 부서지니 도톰하게 썰어주세요!',
      },
      {
        content: '냄비에 참기름을 두르고 중약불에서 감자와 양파를 투명해질 때까지 볶아줍니다. 이렇게 볶으면 감자의 고소한 맛이 더욱 살아나요.',
      },
      {
        content: '멸치 육수를 붓고 끓여줍니다. 끓어오르면 중불로 줄여 감자가 푹 익을 때까지 약 10분간 끓입니다. 국물이 뽀얗게 우러나오면 완벽해요!',
      },
      {
        content: '다진 마늘과 국간장을 넣고 간을 맞춥니다. 부족한 간은 소금으로 조절하세요. 간을 맞출 때는 조금씩 넣어가며 본인의 입맛에 맞게 조절하는 게 중요해요.',
      },
      {
        content: '어슷 썬 대파를 넣고 한소끔 더 끓인 후, 후추를 약간 뿌려 마무리합니다. 따뜻한 감자국 한 그릇으로 하루를 시작해보세요. 속이 든든해집니다!',
      },
    ],
    imageFilename: '감자국.png',
  },
  {
    title: '감자조림',
    description: '달콤하고 짭짤한 맛이 어우러진 밑반찬으로, 아이들도 좋아하는 메뉴 중 하나입니다. 간단한 재료로 쉽게 만들 수 있어요.',
    difficulty: 2,
    cookingTimeMinutes: 25,
    servings: 2,
    ingredients: [
      { ingredient_name: '감자', quantity: '2', unit: '개', category: '채소' },
      { ingredient_name: '간장', quantity: '2', unit: '큰술', category: '조미료' },
      { ingredient_name: '설탕', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '올리고당', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '깨소금', quantity: '약간', category: '조미료' },
      { ingredient_name: '식용유', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '감자는 껍질을 벗기고 한입 크기로 깍둑썰기합니다. 너무 작게 썰면 조리 중 부서질 수 있으니 적당한 크기가 중요해요!',
      },
      {
        content: '팬에 식용유를 두르고 감자를 넣어 중약불에서 겉이 투명해질 때까지 볶아줍니다. 감자가 노릇노릇해지면 더욱 맛있어요.',
      },
      {
        content: '간장, 설탕, 다진 마늘을 넣고 감자에 양념이 잘 배도록 볶아줍니다. 양념이 고르게 배도록 팬을 흔들어주세요.',
      },
      {
        content: '감자가 거의 익으면 올리고당을 넣고 윤기가 나도록 볶아줍니다. 올리고당은 감자조림의 윤기를 더해주는 비법이에요!',
      },
      {
        content: '불을 끄고 참기름과 깨소금을 뿌려 마무리합니다. 달콤짭짤한 맛이 밥과 잘 어울려요. 한 번 만들어 두면 며칠간 맛있게 즐길 수 있답니다.',
      },
    ],
    imageFilename: '감자조림.jpg',
  },
  {
    title: '감자채볶음',
    description: '아삭한 식감과 담백한 맛이 일품인 간단한 반찬. 감자와 당근, 양파를 채 썰어 볶아 만드는 누구나 좋아하는 메뉴예요!',
    difficulty: 2,
    cookingTimeMinutes: 15,
    servings: 2,
    ingredients: [
      { ingredient_name: '감자', quantity: '2', unit: '개', category: '채소' },
      { ingredient_name: '당근', quantity: '1/2', unit: '개', category: '채소' },
      { ingredient_name: '양파', quantity: '1/2', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
      { ingredient_name: '후추', quantity: '약간', category: '조미료' },
      { ingredient_name: '식용유', quantity: '2', unit: '큰술', category: '조미료' },
    ],
    steps: [
      {
        content: '감자와 당근은 껍질을 벗기고 채 썰어 찬물에 10분 정도 담가 전분을 제거합니다. 이렇게 하면 볶을 때 서로 달라붙지 않아요!',
      },
      {
        content: '양파와 대파도 채 썰어 준비합니다. 양파는 얇게 슬라이스하고, 대파는 어슷하게 썰어주세요.',
      },
      {
        content: '팬에 식용유를 두르고 중불에서 양파와 대파를 먼저 볶아 향을 내줍니다. 향이 올라오면 감자와 당근을 넣어주세요.',
      },
      {
        content: '감자와 당근을 넣고 센 불에서 빠르게 볶아줍니다. 아삭한 식감을 유지하려면 너무 오래 볶지 않는 게 중요해요!',
      },
      {
        content: '소금과 후추로 간을 맞추고, 감자가 투명해질 때까지 볶아주면 완성입니다. 간단하면서도 맛있는 반찬이에요!',
      },
    ],
    imageFilename: '감자채볶음.jpg',
  },
  {
    title: '감자탕',
    description: '진한 국물 맛이 일품인 한국의 대표적인 탕 요리. 돼지 등뼈와 감자를 푹 고아낸 얼큰하고 깊은 맛이 일품이에요!',
    difficulty: 4,
    cookingTimeMinutes: 120,
    servings: 4,
    ingredients: [
      { ingredient_name: '돼지 등뼈', quantity: '1', unit: 'kg', category: '육류' },
      { ingredient_name: '감자', quantity: '3', unit: '개', category: '채소' },
      { ingredient_name: '우거지', quantity: '200', unit: 'g', category: '채소' },
      { ingredient_name: '대파', quantity: '2', unit: '대', category: '채소' },
      { ingredient_name: '청양고추', quantity: '2', unit: '개', category: '채소' },
      { ingredient_name: '된장', quantity: '2', unit: '큰술', category: '조미료' },
      { ingredient_name: '고춧가루', quantity: '3', unit: '큰술', category: '조미료' },
      { ingredient_name: '다진 마늘', quantity: '2', unit: '큰술', category: '조미료' },
      { ingredient_name: '국간장', quantity: '2', unit: '큰술', category: '조미료' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
      { ingredient_name: '후추', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '돼지 등뼈는 찬물에 2시간 정도 담가 핏물을 제거합니다. 이렇게 하면 잡내가 없어져요!',
      },
      {
        content: '큰 냄비에 물을 끓여 등뼈를 넣고 10분 정도 데친 후, 흐르는 물에 깨끗이 씻어줍니다. 불순물을 제거하는 중요한 단계예요!',
      },
      {
        content: '다시 냄비에 등뼈를 넣고 물을 부어 끓입니다. 끓어오르면 중불로 줄여 1시간 정도 푹 끓여 육수를 만듭니다. 시간이 걸리지만 깊은 맛의 비법이에요!',
      },
      {
        content: '감자는 껍질을 벗겨 큼직하게 썰고, 우거지는 깨끗이 씻어 물기를 짜고, 대파와 청양고추는 어슷하게 썰어 준비합니다.',
      },
      {
        content: '육수에 된장, 고춧가루, 다진 마늘을 넣고 잘 풀어줍니다. 된장이 잘 풀리지 않으면 체에 걸러서 넣어도 좋아요!',
      },
      {
        content: '감자와 우거지를 넣고 감자가 익을 때까지 약 30분 정도 더 끓입니다. 감자가 포슬포슬해지면 완벽해요!',
      },
      {
        content: '대파와 청양고추를 넣고 국간장, 소금, 후추로 간을 맞춥니다. 한소끔 더 끓여 맛을 배게 한 후 불을 끄면 완성입니다. 뜨끈한 감자탕 한 그릇으로 몸보신하세요!',
      },
    ],
    imageFilename: '감자탕.png',
  },
  {
    title: '갓김치',
    description: '갓 특유의 알싸한 맛이 매력적인 김치. 찹쌀풀을 사용하면 양념이 잘 배고 감칠맛이 더해진답니다!',
    difficulty: 3,
    cookingTimeMinutes: 60,
    servings: 4,
    ingredients: [
      { ingredient_name: '갓', quantity: '1', unit: '단', category: '채소' },
      { ingredient_name: '굵은 소금', quantity: '1', unit: '컵', category: '조미료' },
      { ingredient_name: '찹쌀풀', quantity: '1', unit: '컵', category: '기타' },
      { ingredient_name: '고춧가루', quantity: '1', unit: '컵', category: '조미료' },
      { ingredient_name: '다진 마늘', quantity: '2', unit: '큰술', category: '조미료' },
      { ingredient_name: '다진 생강', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '멸치액젓', quantity: '1/2', unit: '컵', category: '조미료' },
      { ingredient_name: '설탕', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '쪽파', quantity: '1', unit: '줌', category: '채소' },
    ],
    steps: [
      {
        content: '갓은 깨끗이 씻어 물기를 빼고, 굵은 소금을 뿌려 1~2시간 정도 절입니다. 갓이 적당히 숨이 죽을 때까지 절여주세요.',
      },
      {
        content: '찹쌀풀을 쑤어 식힌 후, 고춧가루를 넣어 불려줍니다. 찹쌀풀은 양념이 잘 배도록 도와주는 비법이에요!',
      },
      {
        content: '불린 고춧가루에 다진 마늘, 다진 생강, 멸치액젓, 설탕을 넣어 양념장을 만듭니다. 잘 섞어서 고르게 만들어주세요.',
      },
      {
        content: '절인 갓의 물기를 빼고 쪽파와 함께 양념장을 골고루 버무립니다. 손으로 조물조물 무치면 더욱 맛있어요!',
      },
      {
        content: '버무린 갓김치를 용기에 담아 실온에서 하루 정도 숙성시킨 후 냉장 보관합니다. 갓김치 특유의 알싸한 맛이 입맛을 돋워줘요!',
      },
    ],
    imageFilename: '갓김치.jpg',
  },
  {
    title: '계란찜',
    description: '부드럽고 촉촉한 식감이 일품인 계란찜. 뚝배기에 만들어 따뜻하게 먹으면 더욱 맛있어요!',
    difficulty: 2,
    cookingTimeMinutes: 10,
    servings: 2,
    ingredients: [
      { ingredient_name: '계란', quantity: '3', unit: '개', category: '유제품' },
      { ingredient_name: '물', quantity: '1/2', unit: '컵', category: '기타' },
      { ingredient_name: '소금', quantity: '1/2', unit: '작은술', category: '조미료' },
      { ingredient_name: '다진 파', quantity: '1', unit: '큰술', category: '채소' },
      { ingredient_name: '다진 당근', quantity: '1', unit: '큰술', category: '채소' },
      { ingredient_name: '참기름', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '계란을 볼에 깨뜨려 물, 소금과 함께 잘 풀어줍니다. 거품이 생기도록 충분히 풀어주면 더욱 부드러워요!',
      },
      {
        content: '다진 파와 다진 당근을 넣고 섞어줍니다. 색감도 좋아지고 영양도 더해져요!',
      },
      {
        content: '뚝배기에 참기름을 약간 두르고 계란물을 부어줍니다. 참기름을 먼저 두르면 눌어붙지 않아요.',
      },
      {
        content: '중약불에서 뚜껑을 덮고 계란이 부드럽게 익을 때까지 찜니다. 중간중간 젓가락으로 저어주면 더욱 고르게 익어요!',
      },
      {
        content: '계란찜이 부드럽게 익으면 불을 끄고 바로 제공하세요. 따뜻할 때 먹으면 더욱 맛있답니다!',
      },
    ],
    imageFilename: '계란찜.jpg',
  },
  {
    title: '고구마줄기볶음',
    description: '고구마줄기의 아삭한 식감과 고소한 맛이 일품인 반찬. 간단한 조리법으로 누구나 쉽게 만들 수 있어요!',
    difficulty: 2,
    cookingTimeMinutes: 15,
    servings: 2,
    ingredients: [
      { ingredient_name: '고구마줄기', quantity: '300', unit: 'g', category: '채소' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '간장', quantity: '2', unit: '큰술', category: '조미료' },
      { ingredient_name: '설탕', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '통깨', quantity: '약간', category: '조미료' },
      { ingredient_name: '식용유', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '고구마줄기는 껍질을 벗기고 깨끗이 씻어 5cm 길이로 썰어줍니다. 너무 길게 썰면 먹기 불편해요!',
      },
      {
        content: '끓는 물에 소금을 약간 넣고 고구마줄기를 1분 정도 데친 후 찬물에 헹궈 물기를 빼줍니다. 데치면 아삭한 식감이 살아나요!',
      },
      {
        content: '팬에 식용유를 두르고 다진 마늘을 볶아 향을 낸 후, 고구마줄기를 넣고 볶아줍니다.',
      },
      {
        content: '간장과 설탕을 넣고 간이 배도록 볶아줍니다. 고구마줄기가 양념을 잘 흡수하도록 조금씩 볶아주세요.',
      },
      {
        content: '마지막으로 참기름과 통깨를 뿌려 마무리합니다. 고소한 맛이 더해져 밥반찬으로 딱이에요!',
      },
    ],
    imageFilename: '고구마줄기볶음.jpg',
  },
  {
    title: '고사리나물',
    description: '봄철 대표 나물인 고사리나물. 아삭한 식감과 고소한 맛이 일품이에요. 데친 고사리를 양념에 무쳐 만드는 전통 반찬입니다.',
    difficulty: 2,
    cookingTimeMinutes: 20,
    servings: 2,
    ingredients: [
      { ingredient_name: '고사리', quantity: '200', unit: 'g', category: '채소' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '깨소금', quantity: '약간', category: '조미료' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '고사리는 깨끗이 씻어 끓는 물에 소금을 넣고 3~5분 정도 데쳐줍니다. 너무 오래 데치면 식감이 없어지니 주의하세요!',
      },
      {
        content: '데친 고사리를 찬물에 헹궈 물기를 꼭 짜줍니다. 물기를 충분히 제거해야 양념이 잘 배어요.',
      },
      {
        content: '볼에 국간장, 참기름, 다진 마늘, 깨소금을 넣고 잘 섞어 양념장을 만듭니다.',
      },
      {
        content: '물기를 뺀 고사리를 양념장에 넣고 조물조물 무쳐줍니다. 손으로 무치면 더욱 맛있어요!',
      },
      {
        content: '완성된 고사리나물을 그릇에 담아 제공합니다. 봄철 제철 나물로 밥반찬으로 딱이에요!',
      },
    ],
    imageFilename: '고사리나물.jpg',
  },
  {
    title: '고사리국',
    description: '고사리의 아삭한 식감과 시원한 국물이 어우러진 국. 봄철 제철 고사리를 활용한 담백한 국물 요리예요!',
    difficulty: 2,
    cookingTimeMinutes: 25,
    servings: 2,
    ingredients: [
      { ingredient_name: '고사리', quantity: '150', unit: 'g', category: '채소' },
      { ingredient_name: '양파', quantity: '1/2', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '멸치 육수', quantity: '5', unit: '컵', category: '기타' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '고사리는 깨끗이 씻어 끓는 물에 데친 후 찬물에 헹궈 물기를 빼줍니다. 양파는 채 썰고, 대파는 어슷하게 썰어 준비합니다.',
      },
      {
        content: '냄비에 참기름을 두르고 양파를 볶아 향을 내줍니다. 양파가 투명해지면 고사리를 넣고 함께 볶아주세요.',
      },
      {
        content: '멸치 육수를 붓고 끓여줍니다. 끓어오르면 중불로 줄여 고사리가 익을 때까지 약 10분간 끓입니다.',
      },
      {
        content: '국간장과 다진 마늘을 넣고 간을 맞춥니다. 부족한 간은 소금으로 조절하세요.',
      },
      {
        content: '대파를 넣고 한소끔 더 끓인 후 불을 끕니다. 봄철 제철 고사리국 한 그릇으로 봄을 느껴보세요!',
      },
    ],
    imageFilename: '고사리국.png',
  },
  {
    title: '고춧잎장아찌',
    description: '고춧잎을 간장에 절여 만든 장아찌. 밥도둑 반찬으로 유명하며, 고춧잎 특유의 향과 맛이 일품이에요!',
    difficulty: 3,
    cookingTimeMinutes: 30,
    servings: 4,
    ingredients: [
      { ingredient_name: '고춧잎', quantity: '200', unit: 'g', category: '채소' },
      { ingredient_name: '간장', quantity: '1/2', unit: '컵', category: '조미료' },
      { ingredient_name: '설탕', quantity: '2', unit: '큰술', category: '조미료' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '생강', quantity: '1', unit: '쪽', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '깨소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '고춧잎은 깨끗이 씻어 물기를 빼줍니다. 생강은 얇게 썰어 준비하세요.',
      },
      {
        content: '볼에 간장, 설탕, 다진 마늘, 생강을 넣고 잘 섞어 양념장을 만듭니다.',
      },
      {
        content: '고춧잎을 양념장에 넣고 골고루 버무려줍니다. 손으로 조물조물 무치면 더욱 맛있어요!',
      },
      {
        content: '버무린 고춧잎을 밀폐 용기에 담아 냉장고에서 하루 정도 숙성시킵니다.',
      },
      {
        content: '숙성된 고춧잎장아찌를 꺼내 참기름과 깨소금을 뿌려 마무리합니다. 밥반찬으로 딱이에요!',
      },
    ],
    imageFilename: '고춧잎장아찌.jpg',
  },
  {
    title: '김치',
    description: '한국의 대표 발효식품인 김치. 배추를 소금에 절인 후 고춧가루와 양념을 발라 발효시킨 전통 김치예요!',
    difficulty: 4,
    cookingTimeMinutes: 120,
    servings: 10,
    ingredients: [
      { ingredient_name: '배추', quantity: '1', unit: '포기', category: '채소' },
      { ingredient_name: '굵은 소금', quantity: '1', unit: '컵', category: '조미료' },
      { ingredient_name: '고춧가루', quantity: '1', unit: '컵', category: '조미료' },
      { ingredient_name: '다진 마늘', quantity: '3', unit: '큰술', category: '조미료' },
      { ingredient_name: '다진 생강', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '멸치액젓', quantity: '1/2', unit: '컵', category: '조미료' },
      { ingredient_name: '설탕', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '무', quantity: '1/4', unit: '개', category: '채소' },
      { ingredient_name: '당근', quantity: '1/2', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '3', unit: '대', category: '채소' },
      { ingredient_name: '쪽파', quantity: '1', unit: '줌', category: '채소' },
    ],
    steps: [
      {
        content: '배추는 반으로 갈라 굵은 소금을 뿌려 3~4시간 정도 절입니다. 배추가 적당히 숨이 죽을 때까지 절여주세요.',
      },
      {
        content: '절인 배추를 깨끗이 헹궈 물기를 빼줍니다. 무와 당근은 채 썰고, 대파와 쪽파는 어슷하게 썰어 준비합니다.',
      },
      {
        content: '볼에 고춧가루, 다진 마늘, 다진 생강, 멸치액젓, 설탕을 넣고 잘 섞어 양념장을 만듭니다.',
      },
      {
        content: '채 썬 무와 당근, 대파, 쪽파를 양념장에 넣고 버무려줍니다.',
      },
      {
        content: '배추 잎 사이사이에 양념을 골고루 발라줍니다. 밀폐 용기에 담아 실온에서 하루 정도 숙성시킨 후 냉장 보관합니다. 김치가 익으면 더욱 맛있어요!',
      },
    ],
    imageFilename: '김치.jpg',
  },
  {
    title: '김치국',
    description: '신선한 김치로 끓인 시원한 국. 김치의 신맛과 고춧가루의 매콤함이 어우러진 담백한 국물 요리예요!',
    difficulty: 2,
    cookingTimeMinutes: 20,
    servings: 2,
    ingredients: [
      { ingredient_name: '신김치', quantity: '1/4', unit: '포기', category: '채소' },
      { ingredient_name: '양파', quantity: '1/2', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '고춧가루', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '물', quantity: '5', unit: '컵', category: '기타' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '신김치는 적당한 크기로 썰고, 양파는 채 썰고, 대파는 어슷하게 썰어 준비합니다.',
      },
      {
        content: '냄비에 참기름을 두르고 김치를 넣어 볶아줍니다. 김치가 투명해질 때까지 볶으면 더욱 맛있어요!',
      },
      {
        content: '물을 붓고 끓여줍니다. 끓어오르면 중불로 줄여 약 10분간 끓입니다.',
      },
      {
        content: '양파와 고춧가루, 다진 마늘, 국간장을 넣고 간을 맞춥니다. 부족한 간은 소금으로 조절하세요.',
      },
      {
        content: '대파를 넣고 한소끔 더 끓인 후 불을 끕니다. 시원하고 담백한 김치국 한 그릇으로 식욕을 돋워보세요!',
      },
    ],
    imageFilename: '김치국.png',
  },
  {
    title: '김치찌개',
    description: '신선한 김치와 돼지고기를 넣어 끓인 얼큰한 찌개. 한국의 대표적인 찌개 요리로, 밥과 함께 먹으면 일품이에요!',
    difficulty: 3,
    cookingTimeMinutes: 30,
    servings: 2,
    ingredients: [
      { ingredient_name: '신김치', quantity: '1/2', unit: '포기', category: '채소' },
      { ingredient_name: '돼지고기', quantity: '200', unit: 'g', category: '육류' },
      { ingredient_name: '양파', quantity: '1/2', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '청양고추', quantity: '1', unit: '개', category: '채소' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '고춧가루', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '물', quantity: '3', unit: '컵', category: '기타' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '신김치는 적당한 크기로 썰고, 돼지고기는 한입 크기로 썰어 준비합니다. 양파는 채 썰고, 대파와 청양고추는 어슷하게 썰어주세요.',
      },
      {
        content: '냄비에 참기름을 두르고 돼지고기를 볶아줍니다. 고기가 익으면 김치를 넣고 함께 볶아주세요.',
      },
      {
        content: '물을 붓고 끓여줍니다. 끓어오르면 고춧가루와 다진 마늘을 넣고 중불에서 약 15분간 끓입니다.',
      },
      {
        content: '양파와 국간장을 넣고 간을 맞춥니다. 부족한 간은 소금으로 조절하세요.',
      },
      {
        content: '대파와 청양고추를 넣고 한소끔 더 끓인 후 불을 끕니다. 얼큰하고 맛있는 김치찌개 완성! 따뜻한 밥과 함께 드세요!',
      },
    ],
    imageFilename: '김치찌개.jpg',
  },
  {
    title: '깍두기',
    description: '무를 깍둑썰기하여 만든 김치. 아삭한 식감과 매콤한 맛이 일품인 밥도둑 반찬이에요!',
    difficulty: 3,
    cookingTimeMinutes: 60,
    servings: 4,
    ingredients: [
      { ingredient_name: '무', quantity: '1', unit: '개', category: '채소' },
      { ingredient_name: '굵은 소금', quantity: '1/2', unit: '컵', category: '조미료' },
      { ingredient_name: '고춧가루', quantity: '1/2', unit: '컵', category: '조미료' },
      { ingredient_name: '다진 마늘', quantity: '2', unit: '큰술', category: '조미료' },
      { ingredient_name: '다진 생강', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '멸치액젓', quantity: '1/4', unit: '컵', category: '조미료' },
      { ingredient_name: '설탕', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '대파', quantity: '2', unit: '대', category: '채소' },
    ],
    steps: [
      {
        content: '무는 껍질을 벗기고 깍둑썰기하여 굵은 소금을 뿌려 1시간 정도 절입니다. 무가 적당히 숨이 죽을 때까지 절여주세요.',
      },
      {
        content: '절인 무를 깨끗이 헹궈 물기를 빼줍니다. 대파는 어슷하게 썰어 준비합니다.',
      },
      {
        content: '볼에 고춧가루, 다진 마늘, 다진 생강, 멸치액젓, 설탕을 넣고 잘 섞어 양념장을 만듭니다.',
      },
      {
        content: '절인 무와 대파를 양념장에 넣고 골고루 버무려줍니다. 손으로 조물조물 무치면 더욱 맛있어요!',
      },
      {
        content: '버무린 깍두기를 용기에 담아 실온에서 하루 정도 숙성시킨 후 냉장 보관합니다. 아삭하고 매콤한 깍두기 완성!',
      },
    ],
    imageFilename: '깍두기.jpg',
  },
  {
    title: '달걀국',
    description: '계란을 풀어 넣어 만든 맑은 국. 간단하면서도 담백한 맛이 일품인 가정식 국이에요!',
    difficulty: 1,
    cookingTimeMinutes: 10,
    servings: 2,
    ingredients: [
      { ingredient_name: '계란', quantity: '2', unit: '개', category: '유제품' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '다진 마늘', quantity: '1/2', unit: '작은술', category: '조미료' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '물', quantity: '4', unit: '컵', category: '기타' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '계란을 볼에 깨뜨려 잘 풀어줍니다. 대파는 어슷하게 썰어 준비하세요.',
      },
      {
        content: '냄비에 참기름을 두르고 대파를 볶아 향을 내줍니다.',
      },
      {
        content: '물을 붓고 끓여줍니다. 끓어오르면 국간장과 다진 마늘을 넣고 간을 맞춥니다.',
      },
      {
        content: '계란물을 넣고 젓가락으로 저어가며 끓여줍니다. 계란이 익으면 불을 끕니다.',
      },
      {
        content: '완성된 달걀국을 그릇에 담아 제공합니다. 간단하면서도 담백한 맛이 일품이에요!',
      },
    ],
    imageFilename: '달걀국.png',
  },
  {
    title: '도라지나물',
    description: '도라지의 쌉쌀한 맛과 아삭한 식감이 일품인 나물. 데친 도라지를 양념에 무쳐 만드는 전통 반찬이에요!',
    difficulty: 2,
    cookingTimeMinutes: 20,
    servings: 2,
    ingredients: [
      { ingredient_name: '도라지', quantity: '200', unit: 'g', category: '채소' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '깨소금', quantity: '약간', category: '조미료' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '도라지는 깨끗이 씻어 껍질을 벗기고 채 썰어줍니다. 찬물에 담가 쓴맛을 제거해주세요.',
      },
      {
        content: '끓는 물에 소금을 넣고 도라지를 2~3분 정도 데친 후 찬물에 헹궈 물기를 빼줍니다.',
      },
      {
        content: '볼에 국간장, 참기름, 다진 마늘, 깨소금을 넣고 잘 섞어 양념장을 만듭니다.',
      },
      {
        content: '물기를 뺀 도라지를 양념장에 넣고 조물조물 무쳐줍니다.',
      },
      {
        content: '완성된 도라지나물을 그릇에 담아 제공합니다. 아삭하고 쌉쌀한 맛이 일품이에요!',
      },
    ],
    imageFilename: '도라지나물.jpg',
  },
  {
    title: '도토리묵',
    description: '도토리 전분으로 만든 투명한 묵. 시원하고 부드러운 식감이 일품이며, 양념장과 함께 먹으면 더욱 맛있어요!',
    difficulty: 3,
    cookingTimeMinutes: 40,
    servings: 4,
    ingredients: [
      { ingredient_name: '도토리묵', quantity: '1', unit: '모', category: '기타' },
      { ingredient_name: '양파', quantity: '1/4', unit: '개', category: '채소' },
      { ingredient_name: '오이', quantity: '1/2', unit: '개', category: '채소' },
      { ingredient_name: '고춧가루', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '식초', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '설탕', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '다진 마늘', quantity: '1/2', unit: '작은술', category: '조미료' },
      { ingredient_name: '깨소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '도토리묵은 적당한 크기로 썰어줍니다. 양파와 오이는 채 썰어 준비하세요.',
      },
      {
        content: '볼에 고춧가루, 간장, 식초, 설탕, 다진 마늘, 깨소금을 넣고 잘 섞어 양념장을 만듭니다.',
      },
      {
        content: '도토리묵에 양파와 오이를 올리고 양념장을 뿌려줍니다.',
      },
      {
        content: '완성된 도토리묵을 그릇에 담아 제공합니다. 시원하고 부드러운 식감이 일품이에요!',
      },
    ],
    imageFilename: '도토리묵.jpg',
  },
  {
    title: '동치미',
    description: '무를 소금물에 절여 만든 시원한 김치. 깔끔하고 시원한 맛이 일품이며, 국물까지 마시기 좋은 여름철 대표 김치예요!',
    difficulty: 3,
    cookingTimeMinutes: 90,
    servings: 6,
    ingredients: [
      { ingredient_name: '무', quantity: '1', unit: '개', category: '채소' },
      { ingredient_name: '굵은 소금', quantity: '1/2', unit: '컵', category: '조미료' },
      { ingredient_name: '대파', quantity: '2', unit: '대', category: '채소' },
      { ingredient_name: '마늘', quantity: '5', unit: '쪽', category: '조미료' },
      { ingredient_name: '생강', quantity: '1', unit: '쪽', category: '조미료' },
      { ingredient_name: '고춧가루', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '설탕', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '물', quantity: '6', unit: '컵', category: '기타' },
    ],
    steps: [
      {
        content: '무는 껍질을 벗기고 큼직하게 썰어 굵은 소금을 뿌려 1시간 정도 절입니다. 무가 적당히 숨이 죽을 때까지 절여주세요.',
      },
      {
        content: '절인 무를 깨끗이 헹궈 물기를 빼줍니다. 대파는 4cm 길이로 썰고, 마늘과 생강은 얇게 썰어 준비합니다.',
      },
      {
        content: '물에 소금을 넣어 소금물을 만듭니다. 고춧가루와 설탕을 넣고 잘 섞어주세요.',
      },
      {
        content: '절인 무와 대파, 마늘, 생강을 용기에 담고 소금물을 부어줍니다.',
      },
      {
        content: '용기를 냉장고에 넣어 2~3일 정도 숙성시킵니다. 시원하고 깔끔한 동치미 완성! 국물까지 마시면 더욱 맛있어요!',
      },
    ],
    imageFilename: '동치미.jpg',
  },
  {
    title: '돼지고기찌개',
    description: '돼지고기와 야채를 넣어 끓인 얼큰한 찌개. 돼지고기의 고소한 맛과 야채의 단맛이 어우러진 든든한 한 끼 식사예요!',
    difficulty: 3,
    cookingTimeMinutes: 35,
    servings: 2,
    ingredients: [
      { ingredient_name: '돼지고기', quantity: '300', unit: 'g', category: '육류' },
      { ingredient_name: '양파', quantity: '1', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '2', unit: '대', category: '채소' },
      { ingredient_name: '청양고추', quantity: '2', unit: '개', category: '채소' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '고춧가루', quantity: '2', unit: '큰술', category: '조미료' },
      { ingredient_name: '된장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '물', quantity: '4', unit: '컵', category: '기타' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '돼지고기는 한입 크기로 썰고, 양파는 채 썰고, 대파와 청양고추는 어슷하게 썰어 준비합니다.',
      },
      {
        content: '냄비에 참기름을 두르고 돼지고기를 볶아줍니다. 고기가 익으면 양파를 넣고 함께 볶아주세요.',
      },
      {
        content: '물을 붓고 끓여줍니다. 끓어오르면 된장, 고춧가루, 다진 마늘을 넣고 중불에서 약 20분간 끓입니다.',
      },
      {
        content: '국간장을 넣고 간을 맞춥니다. 부족한 간은 소금으로 조절하세요.',
      },
      {
        content: '대파와 청양고추를 넣고 한소끔 더 끓인 후 불을 끕니다. 얼큰하고 든든한 돼지고기찌개 완성!',
      },
    ],
    imageFilename: '돼지고기찌개.png',
  },
  {
    title: '된장국',
    description: '된장을 풀어 끓인 구수한 국. 된장의 깊은 맛과 야채의 단맛이 어우러진 전통 국물 요리예요!',
    difficulty: 2,
    cookingTimeMinutes: 20,
    servings: 2,
    ingredients: [
      { ingredient_name: '된장', quantity: '2', unit: '큰술', category: '조미료' },
      { ingredient_name: '두부', quantity: '1/2', unit: '모', category: '유제품' },
      { ingredient_name: '양파', quantity: '1/2', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '고춧가루', quantity: '1/2', unit: '작은술', category: '조미료' },
      { ingredient_name: '물', quantity: '5', unit: '컵', category: '기타' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '두부는 한입 크기로 썰고, 양파는 채 썰고, 대파는 어슷하게 썰어 준비합니다.',
      },
      {
        content: '냄비에 물을 붓고 된장을 풀어줍니다. 체에 걸러서 풀어주면 더욱 깔끔해요!',
      },
      {
        content: '된장국을 끓여줍니다. 끓어오르면 두부와 양파를 넣고 중불에서 약 10분간 끓입니다.',
      },
      {
        content: '고춧가루와 다진 마늘을 넣고 간을 맞춥니다. 부족한 간은 소금으로 조절하세요.',
      },
      {
        content: '대파를 넣고 한소끔 더 끓인 후 불을 끕니다. 구수하고 담백한 된장국 완성!',
      },
    ],
    imageFilename: '된장국.png',
  },
  {
    title: '된장찌개',
    description: '된장을 풀어 끓인 얼큰한 찌개. 된장의 깊은 맛과 야채의 단맛이 어우러진 한국의 대표 찌개 요리예요!',
    difficulty: 3,
    cookingTimeMinutes: 30,
    servings: 2,
    ingredients: [
      { ingredient_name: '된장', quantity: '2', unit: '큰술', category: '조미료' },
      { ingredient_name: '돼지고기', quantity: '200', unit: 'g', category: '육류' },
      { ingredient_name: '두부', quantity: '1/2', unit: '모', category: '유제품' },
      { ingredient_name: '양파', quantity: '1/2', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '청양고추', quantity: '1', unit: '개', category: '채소' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '고춧가루', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '물', quantity: '4', unit: '컵', category: '기타' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '돼지고기는 한입 크기로 썰고, 두부는 한입 크기로 썰고, 양파는 채 썰고, 대파와 청양고추는 어슷하게 썰어 준비합니다.',
      },
      {
        content: '냄비에 참기름을 두르고 돼지고기를 볶아줍니다. 고기가 익으면 양파를 넣고 함께 볶아주세요.',
      },
      {
        content: '물을 붓고 된장을 풀어줍니다. 체에 걸러서 풀어주면 더욱 깔끔해요!',
      },
      {
        content: '된장찌개를 끓여줍니다. 끓어오르면 두부, 고춧가루, 다진 마늘을 넣고 중불에서 약 15분간 끓입니다.',
      },
      {
        content: '대파와 청양고추를 넣고 한소끔 더 끓인 후 불을 끕니다. 구수하고 얼큰한 된장찌개 완성!',
      },
    ],
    imageFilename: '된장찌개.png',
  },
  {
    title: '두부조림',
    description: '두부를 양념에 조려 만든 반찬. 두부의 부드러운 식감과 양념의 깊은 맛이 어우러진 밥반찬으로 딱이에요!',
    difficulty: 2,
    cookingTimeMinutes: 20,
    servings: 2,
    ingredients: [
      { ingredient_name: '두부', quantity: '1', unit: '모', category: '유제품' },
      { ingredient_name: '간장', quantity: '2', unit: '큰술', category: '조미료' },
      { ingredient_name: '설탕', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '청양고추', quantity: '1', unit: '개', category: '채소' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '식용유', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '두부는 적당한 두께로 썰어 키친타월로 물기를 제거합니다. 대파와 청양고추는 어슷하게 썰어 준비하세요.',
      },
      {
        content: '팬에 식용유를 두르고 두부를 넣어 노릇하게 굽습니다. 앞뒤로 골고루 구워주세요.',
      },
      {
        content: '볼에 간장, 설탕, 다진 마늘을 넣고 잘 섞어 양념장을 만듭니다.',
      },
      {
        content: '구운 두부에 양념장을 넣고 약불에서 조려줍니다. 양념이 두부에 잘 배도록 조금씩 조려주세요.',
      },
      {
        content: '대파와 청양고추를 넣고 참기름을 뿌려 마무리합니다. 부드럽고 고소한 두부조림 완성!',
      },
    ],
    imageFilename: '두부조림.jpg',
  },
  {
    title: '만두국',
    description: '만두를 넣어 끓인 든든한 국. 만두의 고소한 맛과 시원한 국물이 어우러진 한 끼 식사로 딱이에요!',
    difficulty: 2,
    cookingTimeMinutes: 25,
    servings: 2,
    ingredients: [
      { ingredient_name: '만두', quantity: '8', unit: '개', category: '기타' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '멸치 육수', quantity: '5', unit: '컵', category: '기타' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
      { ingredient_name: '후추', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '대파는 어슷하게 썰어 준비합니다. 만두는 냉동 만두를 사용하거나 직접 만든 만두를 준비하세요.',
      },
      {
        content: '냄비에 멸치 육수를 붓고 끓여줍니다. 끓어오르면 만두를 넣고 중불에서 약 10분간 끓입니다.',
      },
      {
        content: '국간장과 다진 마늘을 넣고 간을 맞춥니다. 부족한 간은 소금으로 조절하세요.',
      },
      {
        content: '대파를 넣고 한소끔 더 끓인 후 참기름과 후추를 뿌려 마무리합니다.',
      },
      {
        content: '완성된 만두국을 그릇에 담아 제공합니다. 만두의 고소한 맛과 시원한 국물이 일품이에요!',
      },
    ],
    imageFilename: '만두국.png',
  },
  {
    title: '멸치볶음',
    description: '멸치를 양념에 볶아 만든 밥도둑 반찬. 고소하고 바삭한 멸치와 달콤짭짤한 양념이 어우러진 인기 반찬이에요!',
    difficulty: 2,
    cookingTimeMinutes: 15,
    servings: 2,
    ingredients: [
      { ingredient_name: '멸치', quantity: '100', unit: 'g', category: '해산물' },
      { ingredient_name: '간장', quantity: '2', unit: '큰술', category: '조미료' },
      { ingredient_name: '설탕', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '올리고당', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '식용유', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '멸치는 머리와 내장을 제거하고 깨끗이 씻어 물기를 빼줍니다.',
      },
      {
        content: '팬에 식용유를 두르고 멸치를 넣어 중약불에서 바삭하게 볶아줍니다.',
      },
      {
        content: '볼에 간장, 설탕, 올리고당, 다진 마늘을 넣고 잘 섞어 양념장을 만듭니다.',
      },
      {
        content: '볶은 멸치에 양념장을 넣고 약불에서 조려줍니다. 양념이 멸치에 잘 배도록 조금씩 조려주세요.',
      },
      {
        content: '참기름을 넣고 한 번 더 섞어 마무리합니다. 고소하고 바삭한 멸치볶음 완성!',
      },
    ],
    imageFilename: '멸치볶음.jpg',
  },
  {
    title: '무국',
    description: '무를 넣어 끓인 맑은 국. 무의 단맛과 시원한 국물이 어우러진 담백한 국물 요리예요!',
    difficulty: 2,
    cookingTimeMinutes: 20,
    servings: 2,
    ingredients: [
      { ingredient_name: '무', quantity: '1/4', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '멸치 육수', quantity: '5', unit: '컵', category: '기타' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '무는 껍질을 벗기고 적당한 크기로 썰어줍니다. 대파는 어슷하게 썰어 준비하세요.',
      },
      {
        content: '냄비에 참기름을 두르고 무를 볶아줍니다. 무가 투명해질 때까지 볶으면 더욱 맛있어요!',
      },
      {
        content: '멸치 육수를 붓고 끓여줍니다. 끓어오르면 중불로 줄여 무가 익을 때까지 약 10분간 끓입니다.',
      },
      {
        content: '국간장과 다진 마늘을 넣고 간을 맞춥니다. 부족한 간은 소금으로 조절하세요.',
      },
      {
        content: '대파를 넣고 한소끔 더 끓인 후 불을 끕니다. 시원하고 담백한 무국 완성!',
      },
    ],
    imageFilename: '무국.png',
  },
  {
    title: '무생채',
    description: '무를 채 썰어 양념에 무친 나물. 아삭한 식감과 시원한 맛이 일품인 밥반찬이에요!',
    difficulty: 2,
    cookingTimeMinutes: 15,
    servings: 2,
    ingredients: [
      { ingredient_name: '무', quantity: '1/2', unit: '개', category: '채소' },
      { ingredient_name: '소금', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '식초', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '설탕', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '고춧가루', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '다진 마늘', quantity: '1/2', unit: '작은술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '깨소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '무는 껍질을 벗기고 채 썰어줍니다. 소금을 뿌려 10분 정도 절여 물기를 빼주세요.',
      },
      {
        content: '볼에 식초, 설탕, 고춧가루, 다진 마늘을 넣고 잘 섞어 양념장을 만듭니다.',
      },
      {
        content: '물기를 뺀 무를 양념장에 넣고 조물조물 무쳐줍니다.',
      },
      {
        content: '참기름과 깨소금을 뿌려 마무리합니다. 아삭하고 시원한 무생채 완성!',
      },
    ],
    imageFilename: '무생채.jpg',
  },
  {
    title: '미역국',
    description: '미역을 넣어 끓인 시원한 국. 미역의 부드러운 식감과 깔끔한 국물이 어우러진 전통 국물 요리예요!',
    difficulty: 2,
    cookingTimeMinutes: 15,
    servings: 2,
    ingredients: [
      { ingredient_name: '마른 미역', quantity: '10', unit: 'g', category: '해산물' },
      { ingredient_name: '소고기', quantity: '100', unit: 'g', category: '육류' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
      { ingredient_name: '물', quantity: '5', unit: '컵', category: '기타' },
    ],
    steps: [
      {
        content: '마른 미역은 찬물에 불려 부드럽게 만든 후 적당한 크기로 썰어줍니다. 소고기는 한입 크기로 썰어 준비하세요.',
      },
      {
        content: '냄비에 참기름을 두르고 소고기를 볶아줍니다. 고기가 익으면 미역을 넣고 함께 볶아주세요.',
      },
      {
        content: '물을 붓고 끓여줍니다. 끓어오르면 중불로 줄여 약 10분간 끓입니다.',
      },
      {
        content: '국간장과 다진 마늘을 넣고 간을 맞춥니다. 부족한 간은 소금으로 조절하세요.',
      },
      {
        content: '완성된 미역국을 그릇에 담아 제공합니다. 부드럽고 시원한 미역국 한 그릇으로 건강을 챙겨보세요!',
      },
    ],
    imageFilename: '미역국.png',
  },
  {
    title: '미역줄기볶음',
    description: '미역줄기를 볶아 만든 아삭한 반찬. 미역줄기의 쫄깃한 식감과 고소한 맛이 일품이에요!',
    difficulty: 2,
    cookingTimeMinutes: 15,
    servings: 2,
    ingredients: [
      { ingredient_name: '미역줄기', quantity: '200', unit: 'g', category: '해산물' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '설탕', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '식용유', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '미역줄기는 깨끗이 씻어 적당한 길이로 썰어줍니다. 끓는 물에 1분 정도 데친 후 찬물에 헹궈 물기를 빼주세요.',
      },
      {
        content: '팬에 식용유를 두르고 다진 마늘을 볶아 향을 내줍니다.',
      },
      {
        content: '미역줄기를 넣고 볶아줍니다. 간장과 설탕을 넣고 간이 배도록 볶아주세요.',
      },
      {
        content: '참기름을 넣고 한 번 더 섞어 마무리합니다. 쫄깃하고 고소한 미역줄기볶음 완성!',
      },
    ],
    imageFilename: '미역줄기볶음.jpg',
  },
  {
    title: '버섯국',
    description: '버섯을 넣어 끓인 구수한 국. 버섯의 고소한 맛과 맑은 국물이 어우러진 담백한 국물 요리예요!',
    difficulty: 2,
    cookingTimeMinutes: 20,
    servings: 2,
    ingredients: [
      { ingredient_name: '팽이버섯', quantity: '1', unit: '팩', category: '채소' },
      { ingredient_name: '양파', quantity: '1/2', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '멸치 육수', quantity: '5', unit: '컵', category: '기타' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '팽이버섯은 밑동을 제거하고 적당한 크기로 썰어줍니다. 양파는 채 썰고, 대파는 어슷하게 썰어 준비하세요.',
      },
      {
        content: '냄비에 참기름을 두르고 양파를 볶아 향을 내줍니다. 양파가 투명해지면 버섯을 넣고 함께 볶아주세요.',
      },
      {
        content: '멸치 육수를 붓고 끓여줍니다. 끓어오르면 중불로 줄여 버섯이 익을 때까지 약 10분간 끓입니다.',
      },
      {
        content: '국간장과 다진 마늘을 넣고 간을 맞춥니다. 부족한 간은 소금으로 조절하세요.',
      },
      {
        content: '대파를 넣고 한소끔 더 끓인 후 불을 끕니다. 구수하고 담백한 버섯국 완성!',
      },
    ],
    imageFilename: '버섯국.png',
  },
  {
    title: '보쌈김치',
    description: '배추잎에 양념을 싸서 만든 김치. 보쌈처럼 싸서 먹는 재미있는 김치로, 아삭한 식감이 일품이에요!',
    difficulty: 3,
    cookingTimeMinutes: 60,
    servings: 4,
    ingredients: [
      { ingredient_name: '배추', quantity: '1/2', unit: '포기', category: '채소' },
      { ingredient_name: '굵은 소금', quantity: '1/2', unit: '컵', category: '조미료' },
      { ingredient_name: '고춧가루', quantity: '1/2', unit: '컵', category: '조미료' },
      { ingredient_name: '다진 마늘', quantity: '2', unit: '큰술', category: '조미료' },
      { ingredient_name: '다진 생강', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '멸치액젓', quantity: '1/4', unit: '컵', category: '조미료' },
      { ingredient_name: '설탕', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '무', quantity: '1/4', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '2', unit: '대', category: '채소' },
    ],
    steps: [
      {
        content: '배추는 잎을 하나씩 떼어내고 굵은 소금을 뿌려 1시간 정도 절입니다. 배추가 적당히 숨이 죽을 때까지 절여주세요.',
      },
      {
        content: '절인 배추를 깨끗이 헹궈 물기를 빼줍니다. 무는 채 썰고, 대파는 어슷하게 썰어 준비합니다.',
      },
      {
        content: '볼에 고춧가루, 다진 마늘, 다진 생강, 멸치액젓, 설탕을 넣고 잘 섞어 양념장을 만듭니다.',
      },
      {
        content: '채 썬 무와 대파를 양념장에 넣고 버무려줍니다.',
      },
      {
        content: '배추잎에 양념을 넣고 보쌈처럼 싸서 용기에 담습니다. 실온에서 하루 정도 숙성시킨 후 냉장 보관합니다. 아삭하고 맛있는 보쌈김치 완성!',
      },
    ],
    imageFilename: '보쌈김치.jpg',
  },
  {
    title: '부대찌개',
    description: '햄과 소시지, 라면을 넣어 끓인 얼큰한 찌개. 다양한 재료가 어우러진 푸짐하고 맛있는 찌개예요!',
    difficulty: 3,
    cookingTimeMinutes: 25,
    servings: 2,
    ingredients: [
      { ingredient_name: '햄', quantity: '100', unit: 'g', category: '육류' },
      { ingredient_name: '소시지', quantity: '2', unit: '개', category: '육류' },
      { ingredient_name: '라면', quantity: '1', unit: '봉지', category: '곡물' },
      { ingredient_name: '김치', quantity: '1/4', unit: '포기', category: '채소' },
      { ingredient_name: '양파', quantity: '1/2', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '고춧가루', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '물', quantity: '3', unit: '컵', category: '기타' },
    ],
    steps: [
      {
        content: '햄과 소시지는 한입 크기로 썰고, 김치는 적당한 크기로 썰고, 양파는 채 썰고, 대파는 어슷하게 썰어 준비합니다.',
      },
      {
        content: '냄비에 김치를 넣고 볶아줍니다. 김치가 투명해지면 햄과 소시지를 넣고 함께 볶아주세요.',
      },
      {
        content: '물을 붓고 끓여줍니다. 끓어오르면 고춧가루와 다진 마늘을 넣고 중불에서 약 10분간 끓입니다.',
      },
      {
        content: '양파와 라면을 넣고 끓여줍니다. 라면이 익으면 대파를 넣고 한소끔 더 끓입니다.',
      },
      {
        content: '완성된 부대찌개를 그릇에 담아 제공합니다. 푸짐하고 얼큰한 부대찌개 한 그릇으로 든든하게 드세요!',
      },
    ],
    imageFilename: '부대찌개.png',
  },
  {
    title: '북어국',
    description: '북어를 넣어 끓인 구수한 국. 북어의 고소한 맛과 맑은 국물이 어우러진 전통 국물 요리예요!',
    difficulty: 2,
    cookingTimeMinutes: 25,
    servings: 2,
    ingredients: [
      { ingredient_name: '양파', quantity: '1/2', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '멸치 육수', quantity: '5', unit: '컵', category: '기타' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '북어는 깨끗이 씻어 적당한 크기로 썰어줍니다. 양파는 채 썰고, 대파는 어슷하게 썰어 준비하세요.',
      },
      {
        content: '냄비에 참기름을 두르고 양파를 볶아 향을 내줍니다. 양파가 투명해지면 북어를 넣고 함께 볶아주세요.',
      },
      {
        content: '멸치 육수를 붓고 끓여줍니다. 끓어오르면 중불로 줄여 북어가 익을 때까지 약 15분간 끓입니다.',
      },
      {
        content: '국간장과 다진 마늘을 넣고 간을 맞춥니다. 부족한 간은 소금으로 조절하세요.',
      },
      {
        content: '대파를 넣고 한소끔 더 끓인 후 불을 끕니다. 구수하고 담백한 북어국 완성!',
      },
    ],
    imageFilename: '북어국.png',
  },
  {
    title: '뼈해장국',
    description: '소뼈를 푹 고아낸 진한 국물의 해장국. 깊은 맛과 든든한 식감이 일품인 해장 요리예요!',
    difficulty: 4,
    cookingTimeMinutes: 180,
    servings: 4,
    ingredients: [
      { ingredient_name: '소뼈', quantity: '1', unit: 'kg', category: '육류' },
      { ingredient_name: '우거지', quantity: '200', unit: 'g', category: '채소' },
      { ingredient_name: '대파', quantity: '2', unit: '대', category: '채소' },
      { ingredient_name: '청양고추', quantity: '2', unit: '개', category: '채소' },
      { ingredient_name: '다진 마늘', quantity: '2', unit: '큰술', category: '조미료' },
      { ingredient_name: '고춧가루', quantity: '2', unit: '큰술', category: '조미료' },
      { ingredient_name: '국간장', quantity: '2', unit: '큰술', category: '조미료' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
      { ingredient_name: '후추', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '소뼈는 찬물에 담가 핏물을 제거합니다. 끓는 물에 데쳐 불순물을 제거한 후 깨끗이 씻어주세요.',
      },
      {
        content: '큰 냄비에 소뼈를 넣고 물을 부어 끓입니다. 끓어오르면 중불로 줄여 2시간 정도 푹 끓여 육수를 만듭니다.',
      },
      {
        content: '우거지는 깨끗이 씻어 물기를 짜고, 대파와 청양고추는 어슷하게 썰어 준비합니다.',
      },
      {
        content: '육수에 고춧가루, 다진 마늘, 국간장을 넣고 간을 맞춥니다. 우거지를 넣고 약 30분간 더 끓입니다.',
      },
      {
        content: '대파와 청양고추를 넣고 소금과 후추로 간을 맞춥니다. 한소끔 더 끓여 마무리합니다. 진한 뼈해장국 한 그릇으로 해장하세요!',
      },
    ],
    imageFilename: '뼈해장국.png',
  },
  {
    title: '소고기무국',
    description: '소고기와 무를 넣어 끓인 구수한 국. 소고기의 고소한 맛과 무의 단맛이 어우러진 든든한 국물 요리예요!',
    difficulty: 3,
    cookingTimeMinutes: 40,
    servings: 2,
    ingredients: [
      { ingredient_name: '소고기', quantity: '200', unit: 'g', category: '육류' },
      { ingredient_name: '무', quantity: '1/4', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '물', quantity: '5', unit: '컵', category: '기타' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '소고기는 한입 크기로 썰고, 무는 껍질을 벗기고 적당한 크기로 썰고, 대파는 어슷하게 썰어 준비합니다.',
      },
      {
        content: '냄비에 참기름을 두르고 소고기를 볶아줍니다. 고기가 익으면 무를 넣고 함께 볶아주세요.',
      },
      {
        content: '물을 붓고 끓여줍니다. 끓어오르면 중불로 줄여 무가 익을 때까지 약 20분간 끓입니다.',
      },
      {
        content: '국간장과 다진 마늘을 넣고 간을 맞춥니다. 부족한 간은 소금으로 조절하세요.',
      },
      {
        content: '대파를 넣고 한소끔 더 끓인 후 불을 끕니다. 구수하고 든든한 소고기무국 완성!',
      },
    ],
    imageFilename: '소고기무국.png',
  },
  {
    title: '소고기찌개',
    description: '소고기를 넣어 끓인 얼큰한 찌개. 소고기의 고소한 맛과 야채의 단맛이 어우러진 든든한 찌개예요!',
    difficulty: 3,
    cookingTimeMinutes: 35,
    servings: 2,
    ingredients: [
      { ingredient_name: '소고기', quantity: '300', unit: 'g', category: '육류' },
      { ingredient_name: '양파', quantity: '1', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '2', unit: '대', category: '채소' },
      { ingredient_name: '청양고추', quantity: '2', unit: '개', category: '채소' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '고춧가루', quantity: '2', unit: '큰술', category: '조미료' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '물', quantity: '4', unit: '컵', category: '기타' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '소고기는 한입 크기로 썰고, 양파는 채 썰고, 대파와 청양고추는 어슷하게 썰어 준비합니다.',
      },
      {
        content: '냄비에 참기름을 두르고 소고기를 볶아줍니다. 고기가 익으면 양파를 넣고 함께 볶아주세요.',
      },
      {
        content: '물을 붓고 끓여줍니다. 끓어오르면 고춧가루와 다진 마늘을 넣고 중불에서 약 20분간 끓입니다.',
      },
      {
        content: '국간장을 넣고 간을 맞춥니다. 부족한 간은 소금으로 조절하세요.',
      },
      {
        content: '대파와 청양고추를 넣고 한소끔 더 끓인 후 불을 끕니다. 얼큰하고 든든한 소고기찌개 완성!',
      },
    ],
    imageFilename: '소고기찌개.png',
  },
  {
    title: '순두부찌개',
    description: '부드러운 순두부를 넣어 끓인 얼큰한 찌개. 순두부의 부드러운 식감과 얼큰한 맛이 어우러진 인기 찌개예요!',
    difficulty: 3,
    cookingTimeMinutes: 20,
    servings: 2,
    ingredients: [
      { ingredient_name: '순두부', quantity: '1', unit: '팩', category: '유제품' },
      { ingredient_name: '돼지고기', quantity: '100', unit: 'g', category: '육류' },
      { ingredient_name: '양파', quantity: '1/2', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '청양고추', quantity: '1', unit: '개', category: '채소' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '고춧가루', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '물', quantity: '3', unit: '컵', category: '기타' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '돼지고기는 한입 크기로 썰고, 양파는 채 썰고, 대파와 청양고추는 어슷하게 썰어 준비합니다.',
      },
      {
        content: '냄비에 참기름을 두르고 돼지고기를 볶아줍니다. 고기가 익으면 양파를 넣고 함께 볶아주세요.',
      },
      {
        content: '물을 붓고 끓여줍니다. 끓어오르면 고춧가루와 다진 마늘을 넣고 중불에서 약 10분간 끓입니다.',
      },
      {
        content: '순두부를 넣고 국간장으로 간을 맞춥니다. 부족한 간은 소금으로 조절하세요.',
      },
      {
        content: '대파와 청양고추를 넣고 한소끔 더 끓인 후 불을 끕니다. 부드럽고 얼큰한 순두부찌개 완성!',
      },
    ],
    imageFilename: '순두부찌개.jpg',
  },
  {
    title: '시금치나물',
    description: '시금치를 데쳐 양념에 무친 나물. 시금치의 부드러운 식감과 고소한 양념이 어우러진 건강한 반찬이에요!',
    difficulty: 1,
    cookingTimeMinutes: 10,
    servings: 2,
    ingredients: [
      { ingredient_name: '시금치', quantity: '1', unit: '단', category: '채소' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '다진 마늘', quantity: '1/2', unit: '작은술', category: '조미료' },
      { ingredient_name: '깨소금', quantity: '약간', category: '조미료' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '시금치는 깨끗이 씻어 끓는 물에 소금을 넣고 30초 정도 데쳐줍니다. 너무 오래 데치면 식감이 없어지니 주의하세요!',
      },
      {
        content: '데친 시금치를 찬물에 헹궈 물기를 꼭 짜줍니다. 물기를 충분히 제거해야 양념이 잘 배어요.',
      },
      {
        content: '볼에 국간장, 참기름, 다진 마늘, 깨소금을 넣고 잘 섞어 양념장을 만듭니다.',
      },
      {
        content: '물기를 뺀 시금치를 양념장에 넣고 조물조물 무쳐줍니다.',
      },
      {
        content: '완성된 시금치나물을 그릇에 담아 제공합니다. 부드럽고 고소한 시금치나물 완성!',
      },
    ],
    imageFilename: '시금치나물.jpg',
  },
  {
    title: '시래기국',
    description: '시래기를 넣어 끓인 구수한 국. 시래기의 고소한 맛과 맑은 국물이 어우러진 전통 국물 요리예요!',
    difficulty: 2,
    cookingTimeMinutes: 25,
    servings: 2,
    ingredients: [
      { ingredient_name: '시래기', quantity: '100', unit: 'g', category: '채소' },
      { ingredient_name: '양파', quantity: '1/2', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '멸치 육수', quantity: '5', unit: '컵', category: '기타' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '시래기는 찬물에 불려 부드럽게 만든 후 적당한 크기로 썰어줍니다. 양파는 채 썰고, 대파는 어슷하게 썰어 준비하세요.',
      },
      {
        content: '냄비에 참기름을 두르고 양파를 볶아 향을 내줍니다. 양파가 투명해지면 시래기를 넣고 함께 볶아주세요.',
      },
      {
        content: '멸치 육수를 붓고 끓여줍니다. 끓어오르면 중불로 줄여 시래기가 익을 때까지 약 15분간 끓입니다.',
      },
      {
        content: '국간장과 다진 마늘을 넣고 간을 맞춥니다. 부족한 간은 소금으로 조절하세요.',
      },
      {
        content: '대파를 넣고 한소끔 더 끓인 후 불을 끕니다. 구수하고 담백한 시래기국 완성!',
      },
    ],
    imageFilename: '시래기국.png',
  },
  {
    title: '쑥갓나물',
    description: '쑥갓을 데쳐 양념에 무친 나물. 쑥갓 특유의 향과 아삭한 식감이 일품인 봄철 제철 나물이에요!',
    difficulty: 2,
    cookingTimeMinutes: 15,
    servings: 2,
    ingredients: [
      { ingredient_name: '쑥갓', quantity: '200', unit: 'g', category: '채소' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '다진 마늘', quantity: '1/2', unit: '작은술', category: '조미료' },
      { ingredient_name: '깨소금', quantity: '약간', category: '조미료' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '쑥갓은 깨끗이 씻어 끓는 물에 소금을 넣고 30초 정도 데쳐줍니다. 너무 오래 데치면 식감이 없어지니 주의하세요!',
      },
      {
        content: '데친 쑥갓을 찬물에 헹궈 물기를 꼭 짜줍니다.',
      },
      {
        content: '볼에 국간장, 참기름, 다진 마늘, 깨소금을 넣고 잘 섞어 양념장을 만듭니다.',
      },
      {
        content: '물기를 뺀 쑥갓을 양념장에 넣고 조물조물 무쳐줍니다.',
      },
      {
        content: '완성된 쑥갓나물을 그릇에 담아 제공합니다. 쑥갓 특유의 향과 아삭한 식감이 일품이에요!',
      },
    ],
    imageFilename: '쑥갓나물.jpg',
  },
  {
    title: '애호박볶음',
    description: '애호박을 볶아 만든 부드러운 반찬. 애호박의 부드러운 식감과 고소한 맛이 일품인 밥반찬이에요!',
    difficulty: 2,
    cookingTimeMinutes: 15,
    servings: 2,
    ingredients: [
      { ingredient_name: '애호박', quantity: '1', unit: '개', category: '채소' },
      { ingredient_name: '양파', quantity: '1/2', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '식용유', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '애호박은 껍질을 벗기고 반달 모양으로 썰어줍니다. 양파는 채 썰고, 대파는 어슷하게 썰어 준비하세요.',
      },
      {
        content: '팬에 식용유를 두르고 양파와 대파를 볶아 향을 내줍니다.',
      },
      {
        content: '애호박을 넣고 중불에서 볶아줍니다. 애호박이 부드럽게 익을 때까지 볶아주세요.',
      },
      {
        content: '국간장과 다진 마늘을 넣고 간을 맞춥니다. 참기름을 넣고 한 번 더 섞어 마무리합니다.',
      },
      {
        content: '완성된 애호박볶음을 그릇에 담아 제공합니다. 부드럽고 고소한 애호박볶음 완성!',
      },
    ],
    imageFilename: '애호박볶음.jpg',
  },
  {
    title: '어묵볶음',
    description: '어묵을 양념에 볶아 만든 반찬. 어묵의 쫄깃한 식감과 달콤짭짤한 양념이 어우러진 인기 반찬이에요!',
    difficulty: 2,
    cookingTimeMinutes: 15,
    servings: 2,
    ingredients: [
      { ingredient_name: '어묵', quantity: '200', unit: 'g', category: '해산물' },
      { ingredient_name: '양파', quantity: '1/2', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '간장', quantity: '2', unit: '큰술', category: '조미료' },
      { ingredient_name: '설탕', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '고춧가루', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '식용유', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '어묵은 적당한 크기로 썰고, 양파는 채 썰고, 대파는 어슷하게 썰어 준비합니다.',
      },
      {
        content: '팬에 식용유를 두르고 양파와 대파를 볶아 향을 내줍니다.',
      },
      {
        content: '어묵을 넣고 중불에서 볶아줍니다. 간장, 설탕, 고춧가루를 넣고 간이 배도록 볶아주세요.',
      },
      {
        content: '참기름을 넣고 한 번 더 섞어 마무리합니다. 쫄깃하고 달콤짭짤한 어묵볶음 완성!',
      },
    ],
    imageFilename: '어묵볶음.jpg',
  },
  {
    title: '열무김치',
    description: '열무를 절여 만든 아삭한 김치. 열무의 아삭한 식감과 매콤한 맛이 일품인 봄철 대표 김치예요!',
    difficulty: 3,
    cookingTimeMinutes: 60,
    servings: 4,
    ingredients: [
      { ingredient_name: '열무', quantity: '1', unit: '단', category: '채소' },
      { ingredient_name: '굵은 소금', quantity: '1/2', unit: '컵', category: '조미료' },
      { ingredient_name: '고춧가루', quantity: '1/2', unit: '컵', category: '조미료' },
      { ingredient_name: '다진 마늘', quantity: '2', unit: '큰술', category: '조미료' },
      { ingredient_name: '다진 생강', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '멸치액젓', quantity: '1/4', unit: '컵', category: '조미료' },
      { ingredient_name: '설탕', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '대파', quantity: '2', unit: '대', category: '채소' },
    ],
    steps: [
      {
        content: '열무는 깨끗이 씻어 굵은 소금을 뿌려 1시간 정도 절입니다. 열무가 적당히 숨이 죽을 때까지 절여주세요.',
      },
      {
        content: '절인 열무를 깨끗이 헹궈 물기를 빼줍니다. 대파는 어슷하게 썰어 준비합니다.',
      },
      {
        content: '볼에 고춧가루, 다진 마늘, 다진 생강, 멸치액젓, 설탕을 넣고 잘 섞어 양념장을 만듭니다.',
      },
      {
        content: '절인 열무와 대파를 양념장에 넣고 골고루 버무려줍니다.',
      },
      {
        content: '버무린 열무김치를 용기에 담아 실온에서 하루 정도 숙성시킨 후 냉장 보관합니다. 아삭하고 매콤한 열무김치 완성!',
      },
    ],
    imageFilename: '열무김치.jpg',
  },
  {
    title: '오이무침',
    description: '오이를 채 썰어 양념에 무친 나물. 오이의 아삭한 식감과 시원한 맛이 일품인 여름철 대표 나물이에요!',
    difficulty: 1,
    cookingTimeMinutes: 10,
    servings: 2,
    ingredients: [
      { ingredient_name: '오이', quantity: '2', unit: '개', category: '채소' },
      { ingredient_name: '소금', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '식초', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '설탕', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '고춧가루', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '다진 마늘', quantity: '1/2', unit: '작은술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '깨소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '오이는 깨끗이 씻어 채 썰어줍니다. 소금을 뿌려 10분 정도 절여 물기를 빼주세요.',
      },
      {
        content: '볼에 식초, 설탕, 고춧가루, 다진 마늘을 넣고 잘 섞어 양념장을 만듭니다.',
      },
      {
        content: '물기를 뺀 오이를 양념장에 넣고 조물조물 무쳐줍니다.',
      },
      {
        content: '참기름과 깨소금을 뿌려 마무리합니다. 아삭하고 시원한 오이무침 완성!',
      },
    ],
    imageFilename: '오이무침.jpg',
  },
  {
    title: '오이소박이',
    description: '오이에 양념을 넣어 만든 아삭한 김치. 오이의 아삭한 식감과 매콤한 양념이 어우러진 여름철 대표 김치예요!',
    difficulty: 3,
    cookingTimeMinutes: 60,
    servings: 4,
    ingredients: [
      { ingredient_name: '오이', quantity: '4', unit: '개', category: '채소' },
      { ingredient_name: '굵은 소금', quantity: '1/4', unit: '컵', category: '조미료' },
      { ingredient_name: '고춧가루', quantity: '1/2', unit: '컵', category: '조미료' },
      { ingredient_name: '다진 마늘', quantity: '2', unit: '큰술', category: '조미료' },
      { ingredient_name: '다진 생강', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '멸치액젓', quantity: '1/4', unit: '컵', category: '조미료' },
      { ingredient_name: '설탕', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '대파', quantity: '2', unit: '대', category: '채소' },
      { ingredient_name: '무', quantity: '1/4', unit: '개', category: '채소' },
    ],
    steps: [
      {
        content: '오이는 깨끗이 씻어 십자로 칼집을 내고 굵은 소금을 뿌려 30분 정도 절입니다. 무는 채 썰고, 대파는 어슷하게 썰어 준비하세요.',
      },
      {
        content: '절인 오이를 깨끗이 헹궈 물기를 빼줍니다.',
      },
      {
        content: '볼에 고춧가루, 다진 마늘, 다진 생강, 멸치액젓, 설탕을 넣고 잘 섞어 양념장을 만듭니다.',
      },
      {
        content: '채 썬 무와 대파를 양념장에 넣고 버무려줍니다.',
      },
      {
        content: '오이의 칼집 사이사이에 양념을 넣어 소박이를 만듭니다. 용기에 담아 실온에서 하루 정도 숙성시킨 후 냉장 보관합니다. 아삭하고 매콤한 오이소박이 완성!',
      },
    ],
    imageFilename: '오이소박이.jpg',
  },
  {
    title: '오이지',
    description: '오이를 소금에 절여 만든 장아찌. 오이의 아삭한 식감과 깔끔한 맛이 일품인 밥반찬이에요!',
    difficulty: 2,
    cookingTimeMinutes: 30,
    servings: 4,
    ingredients: [
      { ingredient_name: '오이', quantity: '4', unit: '개', category: '채소' },
      { ingredient_name: '굵은 소금', quantity: '1/4', unit: '컵', category: '조미료' },
      { ingredient_name: '간장', quantity: '1/2', unit: '컵', category: '조미료' },
      { ingredient_name: '설탕', quantity: '2', unit: '큰술', category: '조미료' },
      { ingredient_name: '식초', quantity: '2', unit: '큰술', category: '조미료' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '생강', quantity: '1', unit: '쪽', category: '조미료' },
    ],
    steps: [
      {
        content: '오이는 깨끗이 씻어 적당한 크기로 썰어줍니다. 굵은 소금을 뿌려 1시간 정도 절입니다.',
      },
      {
        content: '절인 오이를 깨끗이 헹궈 물기를 빼줍니다.',
      },
      {
        content: '볼에 간장, 설탕, 식초, 다진 마늘, 생강을 넣고 잘 섞어 양념장을 만듭니다.',
      },
      {
        content: '절인 오이를 양념장에 넣고 버무려줍니다.',
      },
      {
        content: '버무린 오이지를 용기에 담아 냉장고에서 하루 정도 숙성시킵니다. 아삭하고 깔끔한 오이지 완성!',
      },
    ],
    imageFilename: '오이지.jpg',
  },
  {
    title: '육개장',
    description: '소고기를 넣어 끓인 얼큰한 국. 소고기의 고소한 맛과 고춧가루의 매콤함이 어우러진 든든한 국물 요리예요!',
    difficulty: 3,
    cookingTimeMinutes: 40,
    servings: 2,
    ingredients: [
      { ingredient_name: '소고기', quantity: '200', unit: 'g', category: '육류' },
      { ingredient_name: '콩나물', quantity: '100', unit: 'g', category: '채소' },
      { ingredient_name: '양파', quantity: '1/2', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '청양고추', quantity: '1', unit: '개', category: '채소' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '고춧가루', quantity: '2', unit: '큰술', category: '조미료' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '물', quantity: '5', unit: '컵', category: '기타' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '소고기는 한입 크기로 썰고, 콩나물은 깨끗이 씻고, 양파는 채 썰고, 대파와 청양고추는 어슷하게 썰어 준비합니다.',
      },
      {
        content: '냄비에 참기름을 두르고 소고기를 볶아줍니다. 고기가 익으면 양파를 넣고 함께 볶아주세요.',
      },
      {
        content: '물을 붓고 끓여줍니다. 끓어오르면 고춧가루와 다진 마늘을 넣고 중불에서 약 20분간 끓입니다.',
      },
      {
        content: '콩나물과 국간장을 넣고 간을 맞춥니다. 부족한 간은 소금으로 조절하세요.',
      },
      {
        content: '대파와 청양고추를 넣고 한소끔 더 끓인 후 불을 끕니다. 얼큰하고 든든한 육개장 완성!',
      },
    ],
    imageFilename: '육개장.png',
  },
  {
    title: '진미채볶음',
    description: '진미채를 양념에 볶아 만든 밥도둑 반찬. 진미채의 쫄깃한 식감과 달콤짭짤한 양념이 어우러진 인기 반찬이에요!',
    difficulty: 2,
    cookingTimeMinutes: 15,
    servings: 2,
    ingredients: [
      { ingredient_name: '진미채', quantity: '100', unit: 'g', category: '해산물' },
      { ingredient_name: '양파', quantity: '1/2', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '간장', quantity: '2', unit: '큰술', category: '조미료' },
      { ingredient_name: '설탕', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '고춧가루', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '식용유', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '진미채는 찬물에 불려 부드럽게 만든 후 적당한 길이로 썰어줍니다. 양파는 채 썰고, 대파는 어슷하게 썰어 준비하세요.',
      },
      {
        content: '팬에 식용유를 두르고 양파와 대파를 볶아 향을 내줍니다.',
      },
      {
        content: '진미채를 넣고 중불에서 볶아줍니다. 간장, 설탕, 고춧가루를 넣고 간이 배도록 볶아주세요.',
      },
      {
        content: '참기름을 넣고 한 번 더 섞어 마무리합니다. 쫄깃하고 달콤짭짤한 진미채볶음 완성!',
      },
    ],
    imageFilename: '진미채볶음.jpg',
  },
  {
    title: '참나물',
    description: '참나물을 데쳐 양념에 무친 나물. 참나물 특유의 향과 아삭한 식감이 일품인 봄철 제철 나물이에요!',
    difficulty: 2,
    cookingTimeMinutes: 15,
    servings: 2,
    ingredients: [
      { ingredient_name: '참나물', quantity: '200', unit: 'g', category: '채소' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '다진 마늘', quantity: '1/2', unit: '작은술', category: '조미료' },
      { ingredient_name: '깨소금', quantity: '약간', category: '조미료' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '참나물은 깨끗이 씻어 끓는 물에 소금을 넣고 30초 정도 데쳐줍니다. 너무 오래 데치면 식감이 없어지니 주의하세요!',
      },
      {
        content: '데친 참나물을 찬물에 헹궈 물기를 꼭 짜줍니다.',
      },
      {
        content: '볼에 국간장, 참기름, 다진 마늘, 깨소금을 넣고 잘 섞어 양념장을 만듭니다.',
      },
      {
        content: '물기를 뺀 참나물을 양념장에 넣고 조물조물 무쳐줍니다.',
      },
      {
        content: '완성된 참나물을 그릇에 담아 제공합니다. 참나물 특유의 향과 아삭한 식감이 일품이에요!',
      },
    ],
    imageFilename: '참나물.jpg',
  },
  {
    title: '청국장찌개',
    description: '청국장을 풀어 끓인 구수한 찌개. 청국장의 깊은 맛과 야채의 단맛이 어우러진 한국의 대표 찌개 요리예요!',
    difficulty: 3,
    cookingTimeMinutes: 30,
    servings: 2,
    ingredients: [
      { ingredient_name: '청국장', quantity: '3', unit: '큰술', category: '조미료' },
      { ingredient_name: '돼지고기', quantity: '200', unit: 'g', category: '육류' },
      { ingredient_name: '두부', quantity: '1/2', unit: '모', category: '유제품' },
      { ingredient_name: '양파', quantity: '1/2', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '청양고추', quantity: '1', unit: '개', category: '채소' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '고춧가루', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '물', quantity: '4', unit: '컵', category: '기타' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '돼지고기는 한입 크기로 썰고, 두부는 한입 크기로 썰고, 양파는 채 썰고, 대파와 청양고추는 어슷하게 썰어 준비합니다.',
      },
      {
        content: '냄비에 참기름을 두르고 돼지고기를 볶아줍니다. 고기가 익으면 양파를 넣고 함께 볶아주세요.',
      },
      {
        content: '물을 붓고 청국장을 풀어줍니다. 체에 걸러서 풀어주면 더욱 깔끔해요!',
      },
      {
        content: '청국장찌개를 끓여줍니다. 끓어오르면 두부, 고춧가루, 다진 마늘을 넣고 중불에서 약 15분간 끓입니다.',
      },
      {
        content: '대파와 청양고추를 넣고 한소끔 더 끓인 후 불을 끕니다. 구수하고 얼큰한 청국장찌개 완성!',
      },
    ],
    imageFilename: '청국장찌개.png',
  },
  {
    title: '총각김치',
    description: '총각무를 절여 만든 아삭한 김치. 총각무의 아삭한 식감과 매콤한 맛이 일품인 봄철 대표 김치예요!',
    difficulty: 3,
    cookingTimeMinutes: 60,
    servings: 4,
    ingredients: [
      { ingredient_name: '총각무', quantity: '10', unit: '개', category: '채소' },
      { ingredient_name: '굵은 소금', quantity: '1/2', unit: '컵', category: '조미료' },
      { ingredient_name: '고춧가루', quantity: '1/2', unit: '컵', category: '조미료' },
      { ingredient_name: '다진 마늘', quantity: '2', unit: '큰술', category: '조미료' },
      { ingredient_name: '다진 생강', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '멸치액젓', quantity: '1/4', unit: '컵', category: '조미료' },
      { ingredient_name: '설탕', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '대파', quantity: '2', unit: '대', category: '채소' },
    ],
    steps: [
      {
        content: '총각무는 깨끗이 씻어 굵은 소금을 뿌려 1시간 정도 절입니다. 총각무가 적당히 숨이 죽을 때까지 절여주세요.',
      },
      {
        content: '절인 총각무를 깨끗이 헹궈 물기를 빼줍니다. 대파는 어슷하게 썰어 준비합니다.',
      },
      {
        content: '볼에 고춧가루, 다진 마늘, 다진 생강, 멸치액젓, 설탕을 넣고 잘 섞어 양념장을 만듭니다.',
      },
      {
        content: '절인 총각무와 대파를 양념장에 넣고 골고루 버무려줍니다.',
      },
      {
        content: '버무린 총각김치를 용기에 담아 실온에서 하루 정도 숙성시킨 후 냉장 보관합니다. 아삭하고 매콤한 총각김치 완성!',
      },
    ],
    imageFilename: '총각김치.jpg',
  },
  {
    title: '취나물',
    description: '취를 데쳐 양념에 무친 나물. 취 특유의 향과 아삭한 식감이 일품인 봄철 제철 나물이에요!',
    difficulty: 2,
    cookingTimeMinutes: 20,
    servings: 2,
    ingredients: [
      { ingredient_name: '취', quantity: '200', unit: 'g', category: '채소' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '다진 마늘', quantity: '1/2', unit: '작은술', category: '조미료' },
      { ingredient_name: '깨소금', quantity: '약간', category: '조미료' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '취는 깨끗이 씻어 끓는 물에 소금을 넣고 1분 정도 데쳐줍니다. 너무 오래 데치면 식감이 없어지니 주의하세요!',
      },
      {
        content: '데친 취를 찬물에 헹궈 물기를 꼭 짜줍니다.',
      },
      {
        content: '볼에 국간장, 참기름, 다진 마늘, 깨소금을 넣고 잘 섞어 양념장을 만듭니다.',
      },
      {
        content: '물기를 뺀 취를 양념장에 넣고 조물조물 무쳐줍니다.',
      },
      {
        content: '완성된 취나물을 그릇에 담아 제공합니다. 취 특유의 향과 아삭한 식감이 일품이에요!',
      },
    ],
    imageFilename: '취나물.jpg',
  },
  {
    title: '콩나물국',
    description: '콩나물을 넣어 끓인 시원한 국. 콩나물의 아삭한 식감과 깔끔한 국물이 어우러진 담백한 국물 요리예요!',
    difficulty: 2,
    cookingTimeMinutes: 15,
    servings: 2,
    ingredients: [
      { ingredient_name: '콩나물', quantity: '200', unit: 'g', category: '채소' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '멸치 육수', quantity: '5', unit: '컵', category: '기타' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '콩나물은 깨끗이 씻고, 대파는 어슷하게 썰어 준비합니다.',
      },
      {
        content: '냄비에 멸치 육수를 붓고 끓여줍니다. 끓어오르면 콩나물을 넣고 중불에서 약 10분간 끓입니다.',
      },
      {
        content: '국간장과 다진 마늘을 넣고 간을 맞춥니다. 부족한 간은 소금으로 조절하세요.',
      },
      {
        content: '대파를 넣고 한소끔 더 끓인 후 참기름을 뿌려 마무리합니다.',
      },
      {
        content: '완성된 콩나물국을 그릇에 담아 제공합니다. 아삭하고 시원한 콩나물국 완성!',
      },
    ],
    imageFilename: '콩나물국.png',
  },
  {
    title: '콩나물무침',
    description: '콩나물을 데쳐 양념에 무친 나물. 콩나물의 아삭한 식감과 고소한 양념이 어우러진 건강한 반찬이에요!',
    difficulty: 1,
    cookingTimeMinutes: 10,
    servings: 2,
    ingredients: [
      { ingredient_name: '콩나물', quantity: '300', unit: 'g', category: '채소' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '다진 마늘', quantity: '1/2', unit: '작은술', category: '조미료' },
      { ingredient_name: '깨소금', quantity: '약간', category: '조미료' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '콩나물은 깨끗이 씻어 끓는 물에 소금을 넣고 2분 정도 데쳐줍니다. 너무 오래 데치면 아삭한 식감이 없어지니 주의하세요!',
      },
      {
        content: '데친 콩나물을 찬물에 헹궈 물기를 꼭 짜줍니다.',
      },
      {
        content: '볼에 국간장, 참기름, 다진 마늘, 깨소금을 넣고 잘 섞어 양념장을 만듭니다.',
      },
      {
        content: '물기를 뺀 콩나물을 양념장에 넣고 조물조물 무쳐줍니다.',
      },
      {
        content: '완성된 콩나물무침을 그릇에 담아 제공합니다. 아삭하고 고소한 콩나물무침 완성!',
      },
    ],
    imageFilename: '콩나물무침.jpg',
  },
  {
    title: '콩비지찌개',
    description: '콩비지를 넣어 끓인 구수한 찌개. 콩비지의 고소한 맛과 야채의 단맛이 어우러진 한국의 대표 찌개 요리예요!',
    difficulty: 3,
    cookingTimeMinutes: 30,
    servings: 2,
    ingredients: [
      { ingredient_name: '콩비지', quantity: '200', unit: 'g', category: '기타' },
      { ingredient_name: '돼지고기', quantity: '100', unit: 'g', category: '육류' },
      { ingredient_name: '양파', quantity: '1/2', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '청양고추', quantity: '1', unit: '개', category: '채소' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '고춧가루', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '물', quantity: '4', unit: '컵', category: '기타' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '돼지고기는 한입 크기로 썰고, 양파는 채 썰고, 대파와 청양고추는 어슷하게 썰어 준비합니다.',
      },
      {
        content: '냄비에 참기름을 두르고 돼지고기를 볶아줍니다. 고기가 익으면 양파를 넣고 함께 볶아주세요.',
      },
      {
        content: '물을 붓고 끓여줍니다. 끓어오르면 콩비지, 고춧가루, 다진 마늘을 넣고 중불에서 약 15분간 끓입니다.',
      },
      {
        content: '국간장을 넣고 간을 맞춥니다. 부족한 간은 소금으로 조절하세요.',
      },
      {
        content: '대파와 청양고추를 넣고 한소끔 더 끓인 후 불을 끕니다. 구수하고 얼큰한 콩비지찌개 완성!',
      },
    ],
    imageFilename: '콩비지찌개.png',
  },
  {
    title: '토란국',
    description: '토란을 넣어 끓인 구수한 국. 토란의 부드러운 식감과 맑은 국물이 어우러진 전통 국물 요리예요!',
    difficulty: 2,
    cookingTimeMinutes: 30,
    servings: 2,
    ingredients: [
      { ingredient_name: '토란', quantity: '200', unit: 'g', category: '채소' },
      { ingredient_name: '양파', quantity: '1/2', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '멸치 육수', quantity: '5', unit: '컵', category: '기타' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '토란은 껍질을 벗기고 적당한 크기로 썰어줍니다. 양파는 채 썰고, 대파는 어슷하게 썰어 준비하세요.',
      },
      {
        content: '냄비에 참기름을 두르고 양파를 볶아 향을 내줍니다. 양파가 투명해지면 토란을 넣고 함께 볶아주세요.',
      },
      {
        content: '멸치 육수를 붓고 끓여줍니다. 끓어오르면 중불로 줄여 토란이 익을 때까지 약 20분간 끓입니다.',
      },
      {
        content: '국간장과 다진 마늘을 넣고 간을 맞춥니다. 부족한 간은 소금으로 조절하세요.',
      },
      {
        content: '대파를 넣고 한소끔 더 끓인 후 불을 끕니다. 부드럽고 구수한 토란국 완성!',
      },
    ],
    imageFilename: '토란국.png',
  },
  {
    title: '파김치',
    description: '대파를 절여 만든 아삭한 김치. 대파의 아삭한 식감과 매콤한 양념이 어우러진 밥도둑 반찬이에요!',
    difficulty: 3,
    cookingTimeMinutes: 60,
    servings: 4,
    ingredients: [
      { ingredient_name: '대파', quantity: '10', unit: '대', category: '채소' },
      { ingredient_name: '굵은 소금', quantity: '1/2', unit: '컵', category: '조미료' },
      { ingredient_name: '고춧가루', quantity: '1/2', unit: '컵', category: '조미료' },
      { ingredient_name: '다진 마늘', quantity: '2', unit: '큰술', category: '조미료' },
      { ingredient_name: '다진 생강', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '멸치액젓', quantity: '1/4', unit: '컵', category: '조미료' },
      { ingredient_name: '설탕', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '찹쌀풀', quantity: '1/2', unit: '컵', category: '기타' },
    ],
    steps: [
      {
        content: '대파는 깨끗이 씻어 굵은 소금을 뿌려 1시간 정도 절입니다. 대파가 적당히 숨이 죽을 때까지 절여주세요.',
      },
      {
        content: '절인 대파를 깨끗이 헹궈 물기를 빼줍니다.',
      },
      {
        content: '찹쌀풀을 쑤어 식힌 후, 고춧가루, 다진 마늘, 다진 생강, 멸치액젓, 설탕을 넣고 잘 섞어 양념장을 만듭니다.',
      },
      {
        content: '절인 대파에 양념장을 골고루 발라줍니다.',
      },
      {
        content: '양념을 바른 대파를 용기에 담아 실온에서 하루 정도 숙성시킨 후 냉장 보관합니다. 아삭하고 매콤한 파김치 완성!',
      },
    ],
    imageFilename: '파김치.jpg',
  },
  {
    title: '현미밥',
    description: '현미로 지은 건강한 밥. 현미의 고소한 맛과 쫄깃한 식감이 일품이며, 영양도 풍부해요!',
    difficulty: 1,
    cookingTimeMinutes: 50,
    servings: 4,
    ingredients: [
      { ingredient_name: '현미', quantity: '2', unit: '컵', category: '곡물' },
      { ingredient_name: '물', quantity: '2.5', unit: '컵', category: '기타' },
    ],
    steps: [
      {
        content: '현미는 깨끗이 씻어 찬물에 30분 정도 불려줍니다. 불리면 더욱 부드럽게 익어요!',
      },
      {
        content: '불린 현미의 물기를 빼고 밥솥에 넣어줍니다.',
      },
      {
        content: '물을 붓고 밥솥으로 밥을 짓습니다. 현미밥은 일반 밥보다 조금 더 오래 걸려요!',
      },
      {
        content: '밥이 다 되면 주걱으로 섞어주고 뜸을 들입니다.',
      },
      {
        content: '완성된 현미밥을 그릇에 담아 제공합니다. 고소하고 쫄깃한 현미밥 완성!',
      },
    ],
    imageFilename: '현미밥.jpg',
  },
  {
    title: '호박볶음',
    description: '호박을 볶아 만든 부드러운 반찬. 호박의 부드러운 식감과 고소한 맛이 일품인 밥반찬이에요!',
    difficulty: 2,
    cookingTimeMinutes: 15,
    servings: 2,
    ingredients: [
      { ingredient_name: '호박', quantity: '1/2', unit: '개', category: '채소' },
      { ingredient_name: '양파', quantity: '1/2', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '식용유', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '호박은 껍질을 벗기고 적당한 크기로 썰어줍니다. 양파는 채 썰고, 대파는 어슷하게 썰어 준비하세요.',
      },
      {
        content: '팬에 식용유를 두르고 양파와 대파를 볶아 향을 내줍니다.',
      },
      {
        content: '호박을 넣고 중불에서 볶아줍니다. 호박이 부드럽게 익을 때까지 볶아주세요.',
      },
      {
        content: '국간장과 다진 마늘을 넣고 간을 맞춥니다. 참기름을 넣고 한 번 더 섞어 마무리합니다.',
      },
      {
        content: '완성된 호박볶음을 그릇에 담아 제공합니다. 부드럽고 고소한 호박볶음 완성!',
      },
    ],
    imageFilename: '호박볶음.jpg',
  },
  {
    title: '황태국',
    description: '황태를 넣어 끓인 구수한 국. 황태의 고소한 맛과 맑은 국물이 어우러진 전통 국물 요리예요!',
    difficulty: 2,
    cookingTimeMinutes: 25,
    servings: 2,
    ingredients: [
      { ingredient_name: '황태', quantity: '1', unit: '마리', category: '해산물' },
      { ingredient_name: '양파', quantity: '1/2', unit: '개', category: '채소' },
      { ingredient_name: '대파', quantity: '1', unit: '대', category: '채소' },
      { ingredient_name: '다진 마늘', quantity: '1', unit: '작은술', category: '조미료' },
      { ingredient_name: '국간장', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '참기름', quantity: '1', unit: '큰술', category: '조미료' },
      { ingredient_name: '멸치 육수', quantity: '5', unit: '컵', category: '기타' },
      { ingredient_name: '소금', quantity: '약간', category: '조미료' },
    ],
    steps: [
      {
        content: '황태는 깨끗이 씻어 적당한 크기로 썰어줍니다. 양파는 채 썰고, 대파는 어슷하게 썰어 준비하세요.',
      },
      {
        content: '냄비에 참기름을 두르고 양파를 볶아 향을 내줍니다. 양파가 투명해지면 황태를 넣고 함께 볶아주세요.',
      },
      {
        content: '멸치 육수를 붓고 끓여줍니다. 끓어오르면 중불로 줄여 황태가 익을 때까지 약 15분간 끓입니다.',
      },
      {
        content: '국간장과 다진 마늘을 넣고 간을 맞춥니다. 부족한 간은 소금으로 조절하세요.',
      },
      {
        content: '대파를 넣고 한소끔 더 끓인 후 불을 끕니다. 구수하고 담백한 황태국 완성!',
      },
    ],
    imageFilename: '황태국.png',
  },
];

