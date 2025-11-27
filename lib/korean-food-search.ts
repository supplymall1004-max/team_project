/**
 * @file korean-food-search.ts
 * @description foodreaserch2.md 기반 한국 음식 검색어 변환 서비스
 *
 * 이 모듈은 foodreaserch2.md 문서의 3단계 검색 우선순위를 따릅니다:
 * 🥇 1순위: 로마자 표기 (고유명사) - "Bibimbap", "Jjigae", "Banchan"
 * 🥈 2순위: 영어 설명 (Descriptive) - "Kimchi Stew", "Spicy Beef Soup"
 * 🥉 3순위: 핵심 재료명 + 분류 - "Spinach side dish", "Radish kimchi"
 *
 * 검색 로직: 1순위에서 결과가 있으면 즉시 종료, 없으면 2순위, 그래도 없으면 3순위
 *
 * @see {@link docs/foodreaserch2.md} - 한국 음식 검색 가이드
 */

/**
 * 검색 우선순위별 검색어를 반환합니다.
 * foodreaserch2.md의 3단계 검색 우선순위를 따릅니다.
 *
 * @param koreanFoodName 한국 음식명
 * @returns 우선순위별 검색어 배열 (1순위, 2순위, 3순위)
 */
export function getKoreanFoodSearchQueries(koreanFoodName: string): {
  priority1: string; // 로마자 표기 (고유명사)
  priority2: string; // 영어 설명 (Descriptive)
  priority3: string; // 재료명 + 분류
} {
  const trimmedName = koreanFoodName.trim();
  const lowerName = trimmedName.toLowerCase();

  // ============================================
  // 🥇 1순위: 로마자 표기 (고유명사)
  // ============================================
  const romanizedMapping: Record<string, string> = {
    // 밥류
    '흰쌀밥': 'Bap',
    '쌀밥': 'Bap',
    '밥': 'Bap',
    '현미밥': 'Hyeonmi Bap',
    '잡곡밥': 'Japgokbap',
    '비빔밥': 'Bibimbap',
    '돌솥비빔밥': 'Dolsot Bibimbap',
    '김치볶음밥': 'Kimchi Bokkeumbap',
    '콩나물밥': 'Kongnamulbap',
    '김밥': 'Gimbap',
    '주먹밥': 'Jumeokbap',
    '죽': 'Juk',
    
    // 찌개류
    '찌개': 'Jjigae',
    '김치찌개': 'Kimchi Jjigae',
    '된장찌개': 'Doenjang Jjigae',
    '순두부찌개': 'Sundubu Jjigae',
    '부대찌개': 'Budae Jjigae',
    '해물찌개': 'Haemul Jjigae',
    '청국장찌개': 'Cheonggukjang Jjigae',
    '전골': 'Jeongol',
    '만두전골': 'Mandu Jeongol',
    
    // 국/탕류
    '국': 'Guk',
    '미역국': 'Miyeok Guk',
    '콩나물국': 'Kongnamul Guk',
    '떡국': 'Tteok Guk',
    '육개장': 'Yukgaejang',
    '갈비탕': 'Galbitang',
    '설렁탕': 'Seolleongtang',
    '감자탕': 'Gamjatang',
    '해장국': 'Haejangguk',
    '만둣국': 'Mandu Guk',
    '오징어국': 'Ojing-eo Guk',
    
    // 반찬류
    '반찬': 'Banchan',
    '김치': 'Kimchi',
    '깍두기': 'Kkakdugi',
    '파김치': 'Pa Kimchi',
    '잡채': 'Japchae',
    '불고기': 'Bulgogi',
    '갈비': 'Galbi',
    '나물': 'Namul',
    '콩나물무침': 'Kongnamul Muchim',
    '시금치나물': 'Sigeumchi Namul',
    '전': 'Jeon',
    '김치전': 'Kimchi Jeon',
    '해물파전': 'Haemul Pajeon',
    '계란말이': 'Gyeran Mari',
    '멸치볶음': 'Myeolchi Bokkeum',
    '어묵볶음': 'Eomuk Bokkeum',
    '고구마줄기볶음': 'Goguma-julgi Bokkeum',
    '찜': 'Jjim',
    '닭볶음탕': 'Dakbokkeumtang',
    '떡볶이': 'Tteokbokki',
    '순대': 'Sundae',
  };

  // 패턴 기반 로마자 표기 변환
  let priority1 = romanizedMapping[lowerName] || '';
  
  if (!priority1) {
    // 찌개류 패턴
    if (lowerName.includes('찌개')) {
      if (lowerName.includes('김치')) priority1 = 'Kimchi Jjigae';
      else if (lowerName.includes('된장')) priority1 = 'Doenjang Jjigae';
      else if (lowerName.includes('순두부')) priority1 = 'Sundubu Jjigae';
      else if (lowerName.includes('부대')) priority1 = 'Budae Jjigae';
      else if (lowerName.includes('해물')) priority1 = 'Haemul Jjigae';
      else priority1 = 'Jjigae';
    }
    // 국/탕류 패턴
    else if (lowerName.includes('국') || lowerName.includes('탕')) {
      if (lowerName.includes('미역')) priority1 = 'Miyeok Guk';
      else if (lowerName.includes('콩나물')) priority1 = 'Kongnamul Guk';
      else if (lowerName.includes('떡') && lowerName.includes('국')) priority1 = 'Tteok Guk';
      else if (lowerName.includes('육개장')) priority1 = 'Yukgaejang';
      else if (lowerName.includes('갈비') && lowerName.includes('탕')) priority1 = 'Galbitang';
      else if (lowerName.includes('설렁탕')) priority1 = 'Seolleongtang';
      else if (lowerName.includes('감자탕')) priority1 = 'Gamjatang';
      else if (lowerName.includes('해장국')) priority1 = 'Haejangguk';
      else if (lowerName.includes('만두') && lowerName.includes('국')) priority1 = 'Mandu Guk';
      else if (lowerName.includes('오징어') && lowerName.includes('국')) priority1 = 'Ojing-eo Guk';
      else if (lowerName.includes('국')) priority1 = 'Guk';
      else if (lowerName.includes('탕')) priority1 = 'Tang';
    }
    // 밥류 패턴
    else if (lowerName.includes('밥')) {
      if (lowerName.includes('비빔')) {
        if (lowerName.includes('돌솥')) priority1 = 'Dolsot Bibimbap';
        else priority1 = 'Bibimbap';
      } else if (lowerName.includes('현미')) priority1 = 'Hyeonmi Bap';
      else if (lowerName.includes('잡곡')) priority1 = 'Japgokbap';
      else if (lowerName.includes('김치') && lowerName.includes('볶음')) priority1 = 'Kimchi Bokkeumbap';
      else if (lowerName.includes('콩나물')) priority1 = 'Kongnamulbap';
      else if (lowerName.includes('주먹')) priority1 = 'Jumeokbap';
      else priority1 = 'Bap';
    }
    // 나물/무침 패턴
    else if (lowerName.includes('나물') || lowerName.includes('무침')) {
      if (lowerName.includes('콩나물')) priority1 = 'Kongnamul Muchim';
      else if (lowerName.includes('시금치')) priority1 = 'Sigeumchi Namul';
      else priority1 = 'Namul';
    }
    // 볶음 패턴
    else if (lowerName.includes('볶음')) {
      if (lowerName.includes('고구마줄기')) priority1 = 'Goguma-julgi Bokkeum';
      else if (lowerName.includes('멸치')) priority1 = 'Myeolchi Bokkeum';
      else if (lowerName.includes('어묵')) priority1 = 'Eomuk Bokkeum';
      else priority1 = 'Bokkeum';
    }
  }

  // ============================================
  // 🥈 2순위: 영어 설명 (Descriptive)
  // ============================================
  const descriptiveMapping: Record<string, string> = {
    // 밥류
    '흰쌀밥': 'Cooked Rice',
    '쌀밥': 'Cooked Rice',
    '밥': 'Cooked Rice',
    '현미밥': 'Brown Rice',
    '잡곡밥': 'Multigrain Rice',
    '비빔밥': 'Mixed Rice with Vegetables and Beef',
    '돌솥비빔밥': 'Hot Stone Pot Bibimbap',
    '김치볶음밥': 'Kimchi Fried Rice',
    '콩나물밥': 'Rice Cooked with Bean Sprouts',
    '김밥': 'Dried Seaweed Rolls',
    '주먹밥': 'Rice Balls',
    '죽': 'Porridge',
    
    // 찌개류
    '찌개': 'Korean Stew',
    '김치찌개': 'Kimchi Stew',
    '된장찌개': 'Soybean Paste Stew',
    '순두부찌개': 'Soft Tofu Stew',
    '부대찌개': 'Army Stew',
    '해물찌개': 'Seafood Stew',
    '청국장찌개': 'Fermented Soybean Paste Stew',
    '전골': 'Hot Pot',
    '만두전골': 'Dumpling Hot Pot',
    
    // 국/탕류
    '국': 'Soup',
    '미역국': 'Seaweed Soup',
    '콩나물국': 'Bean Sprout Soup',
    '떡국': 'Sliced Rice Cake Soup',
    '육개장': 'Spicy Beef Soup',
    '갈비탕': 'Beef Rib Soup',
    '설렁탕': 'Ox Bone Soup',
    '감자탕': 'Pork Backbone Stew',
    '해장국': 'Hangover Remedy Soup',
    '만둣국': 'Dumpling Soup',
    '오징어국': 'Squid Soup',
    
    // 반찬류
    '반찬': 'Korean Side Dishes',
    '김치': 'Fermented Spicy Cabbage',
    '깍두기': 'Cubed Radish Kimchi',
    '파김치': 'Scallion Kimchi',
    '잡채': 'Glass Noodles Stir-fried with Vegetables and Meat',
    '불고기': 'Marinated Sliced Barbecued Beef',
    '갈비': 'Grilled Beef Ribs',
    '나물': 'Seasoned Vegetables',
    '콩나물무침': 'Seasoned Bean Sprouts',
    '시금치나물': 'Seasoned Spinach',
    '전': 'Korean Pancake',
    '김치전': 'Kimchi Pancake',
    '해물파전': 'Seafood and Scallion Pancake',
    '계란말이': 'Rolled Omelet',
    '멸치볶음': 'Stir-fried Anchovies',
    '어묵볶음': 'Stir-fried Fish Cake',
    '고구마줄기볶음': 'Stir-fried Sweet Potato Stems',
    '찜': 'Steamed or Braised Dish',
    '닭볶음탕': 'Spicy Braised Chicken',
    '떡볶이': 'Spicy Stir-fried Rice Cakes',
    '순대': 'Korean Blood Sausage',
  };

  let priority2 = descriptiveMapping[lowerName] || '';
  
  if (!priority2) {
    // 패턴 기반 영어 설명 변환
    if (lowerName.includes('찌개')) {
      if (lowerName.includes('김치')) priority2 = 'Kimchi Stew';
      else if (lowerName.includes('된장')) priority2 = 'Soybean Paste Stew';
      else if (lowerName.includes('순두부')) priority2 = 'Soft Tofu Stew';
      else if (lowerName.includes('부대')) priority2 = 'Army Stew';
      else if (lowerName.includes('해물')) priority2 = 'Seafood Stew';
      else priority2 = 'Korean Stew';
    } else if (lowerName.includes('국') || lowerName.includes('탕')) {
      if (lowerName.includes('미역')) priority2 = 'Seaweed Soup';
      else if (lowerName.includes('콩나물')) priority2 = 'Bean Sprout Soup';
      else if (lowerName.includes('떡') && lowerName.includes('국')) priority2 = 'Sliced Rice Cake Soup';
      else if (lowerName.includes('육개장')) priority2 = 'Spicy Beef Soup';
      else if (lowerName.includes('갈비') && lowerName.includes('탕')) priority2 = 'Beef Rib Soup';
      else if (lowerName.includes('설렁탕')) priority2 = 'Ox Bone Soup';
      else if (lowerName.includes('감자탕')) priority2 = 'Pork Backbone Stew';
      else if (lowerName.includes('해장국')) priority2 = 'Hangover Remedy Soup';
      else if (lowerName.includes('만두') && lowerName.includes('국')) priority2 = 'Dumpling Soup';
      else if (lowerName.includes('오징어') && lowerName.includes('국')) priority2 = 'Squid Soup';
      else priority2 = 'Korean Soup';
    } else if (lowerName.includes('밥')) {
      if (lowerName.includes('비빔')) {
        if (lowerName.includes('돌솥')) priority2 = 'Hot Stone Pot Bibimbap';
        else priority2 = 'Mixed Rice with Vegetables and Beef';
      } else if (lowerName.includes('현미')) priority2 = 'Brown Rice';
      else if (lowerName.includes('잡곡')) priority2 = 'Multigrain Rice';
      else if (lowerName.includes('김치') && lowerName.includes('볶음')) priority2 = 'Kimchi Fried Rice';
      else if (lowerName.includes('콩나물')) priority2 = 'Rice Cooked with Bean Sprouts';
      else priority2 = 'Cooked Rice';
    } else if (lowerName.includes('나물') || lowerName.includes('무침')) {
      if (lowerName.includes('시금치')) priority2 = 'Seasoned Spinach';
      else if (lowerName.includes('콩나물')) priority2 = 'Seasoned Bean Sprouts';
      else priority2 = 'Seasoned Vegetables';
    } else if (lowerName.includes('볶음')) {
      if (lowerName.includes('고구마줄기')) priority2 = 'Stir-fried Sweet Potato Stems';
      else if (lowerName.includes('멸치')) priority2 = 'Stir-fried Anchovies';
      else if (lowerName.includes('어묵')) priority2 = 'Stir-fried Fish Cake';
      else priority2 = 'Stir-fried Dish';
    }
  }

  // ============================================
  // 🥉 3순위: 재료명 + 분류
  // ============================================
  const ingredientMapping: Record<string, string> = {
    // 밥류
    '흰쌀밥': 'Rice',
    '쌀밥': 'Rice',
    '밥': 'Rice',
    '현미밥': 'Brown Rice grain',
    '잡곡밥': 'Grain mix',
    '비빔밥': 'Mixed rice vegetables',
    '김치볶음밥': 'Kimchi rice',
    
    // 찌개류
    '김치찌개': 'Kimchi soup',
    '된장찌개': 'Doenjang soup',
    '순두부찌개': 'Tofu stew',
    '부대찌개': 'Army stew',
    '해물찌개': 'Seafood stew',
    
    // 국/탕류
    '미역국': 'Seaweed broth',
    '콩나물국': 'Bean sprout soup',
    '떡국': 'Rice cake soup',
    '육개장': 'Beef soup',
    '갈비탕': 'Beef ribs soup',
    '설렁탕': 'Beef bone soup',
    '감자탕': 'Pork soup',
    
    // 반찬류
    '시금치나물': 'Spinach side dish',
    '콩나물무침': 'Bean sprout side dish',
    '고구마줄기볶음': 'Sweet potato stems',
    '멸치볶음': 'Anchovy side dish',
    '어묵볶음': 'Fish cake side dish',
    '잡채': 'Glass noodles',
    '불고기': 'Marinated beef',
    '갈비': 'Beef ribs',
    '나물': 'Seasoned vegetables',
    '전': 'Korean pancake',
    '김치전': 'Kimchi pancake',
    '해물파전': 'Seafood pancake',
    '계란말이': 'Rolled egg',
    '떡볶이': 'Spicy rice cakes',
  };

  let priority3 = ingredientMapping[lowerName] || '';
  
  if (!priority3) {
    // 패턴 기반 재료명 + 분류 변환
    if (lowerName.includes('시금치')) {
      if (lowerName.includes('나물') || lowerName.includes('무침')) {
        priority3 = 'Spinach side dish';
      } else {
        priority3 = 'Spinach';
      }
    } else if (lowerName.includes('콩나물')) {
      if (lowerName.includes('나물') || lowerName.includes('무침')) {
        priority3 = 'Bean sprout side dish';
      } else {
        priority3 = 'Bean sprouts';
      }
    } else if (lowerName.includes('고구마줄기')) {
      priority3 = 'Sweet potato stems';
    } else if (lowerName.includes('멸치')) {
      priority3 = 'Anchovy side dish';
    } else if (lowerName.includes('어묵')) {
      priority3 = 'Fish cake';
    } else if (lowerName.includes('찌개')) {
      if (lowerName.includes('김치')) priority3 = 'Kimchi soup';
      else if (lowerName.includes('된장')) priority3 = 'Doenjang soup';
      else priority3 = 'Korean stew';
    } else if (lowerName.includes('국') || lowerName.includes('탕')) {
      if (lowerName.includes('미역')) priority3 = 'Seaweed broth';
      else if (lowerName.includes('콩나물')) priority3 = 'Bean sprout soup';
      else if (lowerName.includes('떡')) priority3 = 'Rice cake soup';
      else if (lowerName.includes('육개장')) priority3 = 'Beef soup';
      else if (lowerName.includes('갈비')) priority3 = 'Beef ribs soup';
      else priority3 = 'Korean soup';
    } else if (lowerName.includes('나물') || lowerName.includes('무침')) {
      priority3 = 'Vegetable side dish';
    } else if (lowerName.includes('볶음')) {
      priority3 = 'Stir-fried vegetables';
    }
  }

  // 기본값 처리
  if (!priority1) priority1 = trimmedName;
  if (!priority2) priority2 = priority1; // 2순위가 없으면 1순위 사용
  if (!priority3) priority3 = priority2; // 3순위가 없으면 2순위 사용

  return {
    priority1,
    priority2,
    priority3,
  };
}

/**
 * 검색 우선순위를 반환합니다.
 * 
 * @param query 검색어
 * @returns 우선순위 (1, 2, 3, 4)
 */
export function getSearchPriority(query: string): number {
  const queryLower = query.toLowerCase();
  
  // 1순위: 로마자 표기 (고유명사) - 짧고 명확한 형태
  const romanizedPatterns = [
    'bibimbap', 'jjigae', 'banchan', 'guk', 'tang', 'bap', 'namul', 
    'kimchi', 'bulgogi', 'galbi', 'jeon', 'bokkeum', 'jjim', 'muchim',
    'japgokbap', 'kongnamul', 'sigeumchi', 'myeolchi', 'doenjang', 'sundubu',
    'hyeonmi', 'goguma', 'dolsot', 'yukgaejang', 'galbitang', 'seolleongtang'
  ];
  if (romanizedPatterns.some(pattern => {
    const words = queryLower.split(/\s+/);
    return words.some(word => word.includes(pattern)) && words.length <= 3;
  })) {
    return 1;
  }
  
  // 2순위: 영어 설명 (Descriptive) - "Stew", "Soup", "Side dish" 등 포함
  const descriptivePatterns = [
    'stew', 'soup', 'side dish', 'cooked', 'seasoned', 'stir-fried', 
    'mixed', 'fried', 'grilled', 'steamed', 'marinated', 'broth',
    'porridge', 'pancake', 'braised'
  ];
  if (descriptivePatterns.some(pattern => queryLower.includes(pattern))) {
    return 2;
  }
  
  // 3순위: 재료명 + 분류
  const ingredientPatterns = [
    'spinach', 'bean sprout', 'sweet potato', 'radish', 'anchovy',
    'fish cake', 'rice', 'noodle', 'vegetable', 'beef', 'pork', 'chicken',
    'tofu', 'seaweed', 'egg'
  ];
  if (ingredientPatterns.some(pattern => queryLower.includes(pattern))) {
    return 3;
  }
  
  // 기타: 4순위
  return 4;
}



