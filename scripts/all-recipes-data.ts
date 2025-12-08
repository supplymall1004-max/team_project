/**
 * @file all-recipes-data.ts
 * @description 모든 한국 전통 음식 레시피 데이터
 * 
 * 웹 검색을 통해 수집한 조리법을 블로그 스타일로 작성했습니다.
 */

import type { RecipeData } from './recipe-data-generator';

/**
 * 모든 레시피 데이터
 * 각 레시피는 블로그 스타일로 친근하고 재미있게 작성되었습니다.
 */
export const ALL_RECIPES: RecipeData[] = [
  // 1-3번은 이미 recipe-data-generator.ts에 있음
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
  // 나머지 레시피들도 계속 추가...
];






















