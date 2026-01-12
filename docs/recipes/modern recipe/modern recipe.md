# 추가 레시피 데이터 수집

이 파일은 건강 맞춤 식단에 사용할 반찬, 국, 찌개 레시피를 수집하여 정리하는 문서입니다.

## 데이터 형식

각 레시피는 다음 형식으로 작성합니다:

```json
{
  "title": "레시피 이름",
  "description": "레시피 설명",
  "source": "collected", // 수집된 레시피임을 표시
  "dishType": ["side" | "soup" | "stew"],
  "mealType": ["breakfast" | "lunch" | "dinner"],
  "ingredients": [
    { "name": "재료명", "amount": "수량", "unit": "단위" }
  ],
  "instructions": "조리 방법 설명",
  "nutrition": {
    "calories": 칼로리,
    "protein": 단백질(g),
    "carbs": 탄수화물(g),
    "fat": 지방(g),
    "sodium": 나트륨(mg),
    "fiber": 식이섬유(g)
  },
  "imageUrl": "이미지 URL (있는 경우)",
  "emoji": "이모지 (선택사항)"
}
```

---

## 반찬류 (Side Dishes)

### 1. 도라지나물
```json
{
  "title": "도라지나물",
  "description": "아삭하고 씁쓸한 맛이 일품인 도라지나물",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "도라지", "amount": "200", "unit": "g" },
    { "name": "소금", "amount": "1", "unit": "작은술" },
    { "name": "참기름", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "깨소금", "amount": "1", "unit": "작은술" }
  ],
  "instructions": "도라지를 깨끗이 씻어 소금에 절인 후 물기를 짜고, 참기름, 다진 마늘, 깨소금으로 무칩니다.",
  "nutrition": {
    "calories": 55,
    "protein": 2.0,
    "carbs": 8.0,
    "fat": 2.0,
    "sodium": 200,
    "fiber": 3.5
  },
  "imageUrl": "/api/picture/도라지나물.jpg",
  "emoji": "🥬"
}
```

### 2. 고사리나물
```json
{
  "title": "고사리나물",
  "description": "구수하고 부드러운 고사리나물",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "고사리", "amount": "150", "unit": "g" },
    { "name": "들기름", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "2", "unit": "쪽" },
    { "name": "국간장", "amount": "1", "unit": "큰술" }
  ],
  "instructions": "고사리를 삶아 물기를 짜고, 들기름에 마늘을 볶다가 고사리를 넣어 볶습니다. 국간장으로 간을 맞춥니다.",
  "nutrition": {
    "calories": 65,
    "protein": 2.5,
    "carbs": 7.0,
    "fat": 3.0,
    "sodium": 350,
    "fiber": 4.0
  },
  "imageUrl": "/api/picture/고사리나물.jpg",
  "emoji": "🌿"
}
```

### 3. 취나물
```json
{
  "title": "취나물",
  "description": "향긋한 취나물",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "취나물", "amount": "150", "unit": "g" },
    { "name": "참기름", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "깨소금", "amount": "1", "unit": "작은술" }
  ],
  "instructions": "취나물을 데쳐 물기를 짜고, 참기름, 마늘, 깨소금으로 무칩니다.",
  "nutrition": {
    "calories": 50,
    "protein": 2.0,
    "carbs": 6.0,
    "fat": 2.5,
    "sodium": 10,
    "fiber": 3.0
  },
  "imageUrl": "/api/picture/취나물.jpg",
  "emoji": "🌱"
}
```

### 4. 미역줄기볶음
```json
{
  "title": "미역줄기볶음",
  "description": "아삭한 미역줄기 볶음",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "미역줄기", "amount": "200", "unit": "g" },
    { "name": "식용유", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "2", "unit": "쪽" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "설탕", "amount": "1", "unit": "작은술" }
  ],
  "instructions": "미역줄기를 깨끗이 씻어 물기를 빼고, 식용유에 마늘을 볶다가 미역줄기를 넣어 볶습니다. 고춧가루와 설탕으로 간을 맞춥니다.",
  "nutrition": {
    "calories": 60,
    "protein": 1.5,
    "carbs": 8.0,
    "fat": 2.5,
    "sodium": 150,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🌊"
}
```

### 5. 숙주나물
```json
{
  "title": "숙주나물",
  "description": "아삭하고 담백한 숙주나물",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "숙주", "amount": "200", "unit": "g" },
    { "name": "참기름", "amount": "1", "unit": "작은술" },
    { "name": "깨소금", "amount": "1", "unit": "작은술" },
    { "name": "파", "amount": "약간", "unit": "" }
  ],
  "instructions": "숙주를 살짝 데쳐 물기를 빼고, 참기름, 깨소금, 파로 무칩니다.",
  "nutrition": {
    "calories": 35,
    "protein": 3.5,
    "carbs": 4.0,
    "fat": 1.0,
    "sodium": 5,
    "fiber": 1.5
  },
  "imageUrl": "",
  "emoji": "🌱"
}
```

### 6. 시래기나물
```json
{
  "title": "시래기나물",
  "description": "구수한 시래기나물",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "시래기", "amount": "100", "unit": "g" },
    { "name": "들기름", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "2", "unit": "쪽" },
    { "name": "국간장", "amount": "1", "unit": "큰술" }
  ],
  "instructions": "시래기를 불려 삶아 물기를 짜고, 들기름에 마늘을 볶다가 시래기를 넣어 볶습니다. 국간장으로 간을 맞춥니다.",
  "nutrition": {
    "calories": 70,
    "protein": 3.0,
    "carbs": 8.0,
    "fat": 3.0,
    "sodium": 400,
    "fiber": 4.5
  },
  "imageUrl": "",
  "emoji": "🥬"
}
```

### 7. 연근조림
```json
{
  "title": "연근조림",
  "description": "달콤하고 아삭한 연근조림",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "연근", "amount": "200", "unit": "g" },
    { "name": "간장", "amount": "2", "unit": "큰술" },
    { "name": "올리고당", "amount": "1", "unit": "큰술" },
    { "name": "참기름", "amount": "1", "unit": "작은술" }
  ],
  "instructions": "연근을 얇게 썰어 간장, 올리고당으로 조립니다. 마지막에 참기름을 넣어 마무리합니다.",
  "nutrition": {
    "calories": 90,
    "protein": 2.0,
    "carbs": 18.0,
    "fat": 1.5,
    "sodium": 500,
    "fiber": 3.5
  },
  "imageUrl": "",
  "emoji": "🌿"
}
```

### 8. 가지볶음
```json
{
  "title": "가지볶음",
  "description": "부드럽고 고소한 가지볶음",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "가지", "amount": "2", "unit": "개" },
    { "name": "양파", "amount": "1/2", "unit": "개" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "식용유", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "2", "unit": "쪽" }
  ],
  "instructions": "가지를 썰어 기름에 볶다가 양파와 마늘을 넣어 볶습니다. 고춧가루로 간을 맞춥니다.",
  "nutrition": {
    "calories": 75,
    "protein": 2.0,
    "carbs": 10.0,
    "fat": 3.5,
    "sodium": 20,
    "fiber": 3.0
  },
  "imageUrl": "",
  "emoji": "🍆"
}
```

### 9. 브로콜리나물
```json
{
  "title": "브로콜리나물",
  "description": "영양 가득한 브로콜리나물",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "브로콜리", "amount": "200", "unit": "g" },
    { "name": "참기름", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "깨소금", "amount": "1", "unit": "작은술" }
  ],
  "instructions": "브로콜리를 살짝 데쳐 물기를 짜고, 참기름, 마늘, 깨소금으로 무칩니다.",
  "nutrition": {
    "calories": 50,
    "protein": 3.5,
    "carbs": 6.0,
    "fat": 2.0,
    "sodium": 30,
    "fiber": 3.5
  },
  "imageUrl": "",
  "emoji": "🥦"
}
```

### 10. 파래무침
```json
{
  "title": "파래무침",
  "description": "향긋한 파래무침",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "파래", "amount": "100", "unit": "g" },
    { "name": "식초", "amount": "1", "unit": "큰술" },
    { "name": "고춧가루", "amount": "1", "unit": "작은술" },
    { "name": "설탕", "amount": "1", "unit": "작은술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" }
  ],
  "instructions": "파래를 깨끗이 씻어 물기를 빼고, 식초, 고춧가루, 설탕, 다진 마늘로 무칩니다.",
  "nutrition": {
    "calories": 30,
    "protein": 2.0,
    "carbs": 5.0,
    "fat": 0.5,
    "sodium": 200,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🌿"
}
```

### 11. 콩나물무침
```json
{
  "title": "콩나물무침",
  "description": "아삭하고 담백한 콩나물무침",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "콩나물", "amount": "200", "unit": "g" },
    { "name": "참기름", "amount": "1", "unit": "작은술" },
    { "name": "깨소금", "amount": "1", "unit": "작은술" },
    { "name": "다진 마늘", "amount": "0.5", "unit": "작은술" },
    { "name": "소금", "amount": "약간", "unit": "" }
  ],
  "instructions": "콩나물을 데쳐 찬물에 헹궈 물기를 빼고, 참기름, 깨소금, 다진 마늘, 소금으로 무칩니다.",
  "nutrition": {
    "calories": 40,
    "protein": 4.0,
    "carbs": 5.0,
    "fat": 1.5,
    "sodium": 150,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🌱"
}
```

### 12. 오이소박이
```json
{
  "title": "오이소박이",
  "description": "시원하고 아삭한 오이소박이",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "오이", "amount": "3", "unit": "개" },
    { "name": "부추", "amount": "50", "unit": "g" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "생강즙", "amount": "0.5", "unit": "작은술" },
    { "name": "새우젓", "amount": "1", "unit": "작은술" },
    { "name": "설탕", "amount": "1", "unit": "작은술" }
  ],
  "instructions": "오이를 4등분하여 소금에 절인 후, 부추와 양념을 섞어 오이에 채워 넣습니다. 하루 정도 숙성시킵니다.",
  "nutrition": {
    "calories": 35,
    "protein": 2.0,
    "carbs": 6.0,
    "fat": 0.5,
    "sodium": 300,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🥒"
}
```

### 13. 무생채
```json
{
  "title": "무생채",
  "description": "아삭하고 시원한 무생채",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "무", "amount": "200", "unit": "g" },
    { "name": "식초", "amount": "1", "unit": "큰술" },
    { "name": "설탕", "amount": "1", "unit": "큰술" },
    { "name": "소금", "amount": "0.5", "unit": "작은술" },
    { "name": "고춧가루", "amount": "0.5", "unit": "작은술" }
  ],
  "instructions": "무를 채 썰어 소금에 절인 후 물기를 짜고, 식초, 설탕, 고춧가루로 무칩니다.",
  "nutrition": {
    "calories": 25,
    "protein": 1.0,
    "carbs": 5.0,
    "fat": 0.2,
    "sodium": 200,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🥕"
}
```

### 14. 깻잎나물
```json
{
  "title": "깻잎나물",
  "description": "향긋한 깻잎나물",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "깻잎", "amount": "100", "unit": "g" },
    { "name": "참기름", "amount": "1", "unit": "큰술" },
    { "name": "깨소금", "amount": "1", "unit": "작은술" },
    { "name": "다진 마늘", "amount": "0.5", "unit": "작은술" },
    { "name": "국간장", "amount": "1", "unit": "작은술" }
  ],
  "instructions": "깻잎을 깨끗이 씻어 물기를 빼고, 참기름, 깨소금, 다진 마늘, 국간장으로 무칩니다.",
  "nutrition": {
    "calories": 45,
    "protein": 2.5,
    "carbs": 3.0,
    "fat": 3.0,
    "sodium": 250,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🌿"
}
```

### 15. 당근볶음
```json
{
  "title": "당근볶음",
  "description": "달콤하고 고소한 당근볶음",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "당근", "amount": "200", "unit": "g" },
    { "name": "식용유", "amount": "1", "unit": "큰술" },
    { "name": "설탕", "amount": "1", "unit": "작은술" },
    { "name": "소금", "amount": "약간", "unit": "" }
  ],
  "instructions": "당근을 채 썰어 식용유에 볶다가 설탕과 소금으로 간을 맞춥니다.",
  "nutrition": {
    "calories": 60,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 2.5,
    "sodium": 100,
    "fiber": 3.0
  },
  "imageUrl": "",
  "emoji": "🥕"
}
```

### 16. 양배추볶음
```json
{
  "title": "양배추볶음",
  "description": "아삭하고 담백한 양배추볶음",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "양배추", "amount": "200", "unit": "g" },
    { "name": "식용유", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "소금", "amount": "약간", "unit": "" },
    { "name": "후추", "amount": "약간", "unit": "" }
  ],
  "instructions": "양배추를 채 썰어 식용유에 다진 마늘과 함께 볶습니다. 소금과 후추로 간을 맞춥니다.",
  "nutrition": {
    "calories": 50,
    "protein": 2.0,
    "carbs": 6.0,
    "fat": 2.5,
    "sodium": 150,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🥬"
}
```

### 17. 버섯볶음
```json
{
  "title": "버섯볶음",
  "description": "고소하고 부드러운 버섯볶음",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "표고버섯", "amount": "100", "unit": "g" },
    { "name": "식용유", "amount": "1", "unit": "큰술" },
    { "name": "간장", "amount": "1", "unit": "큰술" },
    { "name": "설탕", "amount": "0.5", "unit": "작은술" },
    { "name": "참기름", "amount": "0.5", "unit": "작은술" }
  ],
  "instructions": "표고버섯을 썰어 식용유에 볶다가 간장, 설탕으로 간을 맞춥니다. 마지막에 참기름을 넣어 마무리합니다.",
  "nutrition": {
    "calories": 55,
    "protein": 2.5,
    "carbs": 6.0,
    "fat": 2.5,
    "sodium": 400,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🍄"
}
```

### 18. 감자볶음
```json
{
  "title": "감자볶음",
  "description": "부드럽고 고소한 감자볶음",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "감자", "amount": "200", "unit": "g" },
    { "name": "식용유", "amount": "1", "unit": "큰술" },
    { "name": "소금", "amount": "약간", "unit": "" },
    { "name": "후추", "amount": "약간", "unit": "" }
  ],
  "instructions": "감자를 채 썰어 찬물에 헹군 후 식용유에 볶습니다. 소금과 후추로 간을 맞춥니다.",
  "nutrition": {
    "calories": 120,
    "protein": 2.5,
    "carbs": 20.0,
    "fat": 3.5,
    "sodium": 100,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🥔"
}
```

### 19. 두부조림
```json
{
  "title": "두부조림",
  "description": "부드럽고 고소한 두부조림",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "두부", "amount": "1", "unit": "모" },
    { "name": "간장", "amount": "2", "unit": "큰술" },
    { "name": "설탕", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "참기름", "amount": "1", "unit": "작은술" }
  ],
  "instructions": "두부를 썰어 간장, 설탕, 다진 마늘로 조립니다. 마지막에 참기름을 넣어 마무리합니다.",
  "nutrition": {
    "calories": 95,
    "protein": 8.0,
    "carbs": 8.0,
    "fat": 4.0,
    "sodium": 600,
    "fiber": 1.0
  },
  "imageUrl": "",
  "emoji": "🧈"
}
```

### 20. 계란말이
```json
{
  "title": "계란말이",
  "description": "부드럽고 고소한 계란말이",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "계란", "amount": "3", "unit": "개" },
    { "name": "소금", "amount": "약간", "unit": "" },
    { "name": "식용유", "amount": "1", "unit": "큰술" },
    { "name": "설탕", "amount": "0.5", "unit": "작은술" }
  ],
  "instructions": "계란을 풀어 소금과 설탕을 넣고, 팬에 식용유를 두르고 계란을 부어 말아줍니다.",
  "nutrition": {
    "calories": 150,
    "protein": 12.0,
    "carbs": 2.0,
    "fat": 10.0,
    "sodium": 200,
    "fiber": 0
  },
  "imageUrl": "",
  "emoji": "🍳"
}
```

### 21. 콩나물무침
```json
{
  "title": "콩나물무침",
  "description": "아삭하고 담백한 콩나물무침",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "콩나물", "amount": "200", "unit": "g" },
    { "name": "참기름", "amount": "1", "unit": "작은술" },
    { "name": "깨소금", "amount": "1", "unit": "작은술" },
    { "name": "다진 마늘", "amount": "0.5", "unit": "작은술" },
    { "name": "소금", "amount": "약간", "unit": "" }
  ],
  "instructions": "콩나물을 데쳐 찬물에 헹궈 물기를 빼고, 참기름, 깨소금, 다진 마늘, 소금으로 무칩니다.",
  "nutrition": {
    "calories": 40,
    "protein": 4.0,
    "carbs": 5.0,
    "fat": 1.5,
    "sodium": 150,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🌱"
}
```

### 22. 오이소박이
```json
{
  "title": "오이소박이",
  "description": "시원하고 아삭한 오이소박이",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "오이", "amount": "3", "unit": "개" },
    { "name": "부추", "amount": "50", "unit": "g" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "생강즙", "amount": "0.5", "unit": "작은술" },
    { "name": "새우젓", "amount": "1", "unit": "작은술" },
    { "name": "설탕", "amount": "1", "unit": "작은술" }
  ],
  "instructions": "오이를 4등분하여 소금에 절인 후, 부추와 양념을 섞어 오이에 채워 넣습니다. 하루 정도 숙성시킵니다.",
  "nutrition": {
    "calories": 35,
    "protein": 2.0,
    "carbs": 6.0,
    "fat": 0.5,
    "sodium": 300,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🥒"
}
```

### 23. 무생채
```json
{
  "title": "무생채",
  "description": "아삭하고 시원한 무생채",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "무", "amount": "200", "unit": "g" },
    { "name": "식초", "amount": "1", "unit": "큰술" },
    { "name": "설탕", "amount": "1", "unit": "큰술" },
    { "name": "소금", "amount": "0.5", "unit": "작은술" },
    { "name": "고춧가루", "amount": "0.5", "unit": "작은술" }
  ],
  "instructions": "무를 채 썰어 소금에 절인 후 물기를 짜고, 식초, 설탕, 고춧가루로 무칩니다.",
  "nutrition": {
    "calories": 25,
    "protein": 1.0,
    "carbs": 5.0,
    "fat": 0.2,
    "sodium": 200,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🥕"
}
```

### 24. 깻잎나물
```json
{
  "title": "깻잎나물",
  "description": "향긋한 깻잎나물",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "깻잎", "amount": "100", "unit": "g" },
    { "name": "참기름", "amount": "1", "unit": "큰술" },
    { "name": "깨소금", "amount": "1", "unit": "작은술" },
    { "name": "다진 마늘", "amount": "0.5", "unit": "작은술" },
    { "name": "국간장", "amount": "1", "unit": "작은술" }
  ],
  "instructions": "깻잎을 깨끗이 씻어 물기를 빼고, 참기름, 깨소금, 다진 마늘, 국간장으로 무칩니다.",
  "nutrition": {
    "calories": 45,
    "protein": 2.5,
    "carbs": 3.0,
    "fat": 3.0,
    "sodium": 250,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🌿"
}
```

### 25. 당근볶음
```json
{
  "title": "당근볶음",
  "description": "달콤하고 고소한 당근볶음",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "당근", "amount": "200", "unit": "g" },
    { "name": "식용유", "amount": "1", "unit": "큰술" },
    { "name": "설탕", "amount": "1", "unit": "작은술" },
    { "name": "소금", "amount": "약간", "unit": "" }
  ],
  "instructions": "당근을 채 썰어 식용유에 볶다가 설탕과 소금으로 간을 맞춥니다.",
  "nutrition": {
    "calories": 60,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 2.5,
    "sodium": 100,
    "fiber": 3.0
  },
  "imageUrl": "",
  "emoji": "🥕"
}
```

### 26. 양배추볶음
```json
{
  "title": "양배추볶음",
  "description": "아삭하고 담백한 양배추볶음",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "양배추", "amount": "200", "unit": "g" },
    { "name": "식용유", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "소금", "amount": "약간", "unit": "" },
    { "name": "후추", "amount": "약간", "unit": "" }
  ],
  "instructions": "양배추를 채 썰어 식용유에 다진 마늘과 함께 볶습니다. 소금과 후추로 간을 맞춥니다.",
  "nutrition": {
    "calories": 50,
    "protein": 2.0,
    "carbs": 6.0,
    "fat": 2.5,
    "sodium": 150,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🥬"
}
```

### 27. 버섯볶음
```json
{
  "title": "버섯볶음",
  "description": "고소하고 부드러운 버섯볶음",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "표고버섯", "amount": "100", "unit": "g" },
    { "name": "식용유", "amount": "1", "unit": "큰술" },
    { "name": "간장", "amount": "1", "unit": "큰술" },
    { "name": "설탕", "amount": "0.5", "unit": "작은술" },
    { "name": "참기름", "amount": "0.5", "unit": "작은술" }
  ],
  "instructions": "표고버섯을 썰어 식용유에 볶다가 간장, 설탕으로 간을 맞춥니다. 마지막에 참기름을 넣어 마무리합니다.",
  "nutrition": {
    "calories": 55,
    "protein": 2.5,
    "carbs": 6.0,
    "fat": 2.5,
    "sodium": 400,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🍄"
}
```

### 28. 감자볶음
```json
{
  "title": "감자볶음",
  "description": "부드럽고 고소한 감자볶음",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "감자", "amount": "200", "unit": "g" },
    { "name": "식용유", "amount": "1", "unit": "큰술" },
    { "name": "소금", "amount": "약간", "unit": "" },
    { "name": "후추", "amount": "약간", "unit": "" }
  ],
  "instructions": "감자를 채 썰어 찬물에 헹군 후 식용유에 볶습니다. 소금과 후추로 간을 맞춥니다.",
  "nutrition": {
    "calories": 120,
    "protein": 2.5,
    "carbs": 20.0,
    "fat": 3.5,
    "sodium": 100,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🥔"
}
```

### 29. 두부조림
```json
{
  "title": "두부조림",
  "description": "부드럽고 고소한 두부조림",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "두부", "amount": "1", "unit": "모" },
    { "name": "간장", "amount": "2", "unit": "큰술" },
    { "name": "설탕", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "참기름", "amount": "1", "unit": "작은술" }
  ],
  "instructions": "두부를 썰어 간장, 설탕, 다진 마늘로 조립니다. 마지막에 참기름을 넣어 마무리합니다.",
  "nutrition": {
    "calories": 95,
    "protein": 8.0,
    "carbs": 8.0,
    "fat": 4.0,
    "sodium": 600,
    "fiber": 1.0
  },
  "imageUrl": "",
  "emoji": "🧈"
}
```

### 30. 계란말이
```json
{
  "title": "계란말이",
  "description": "부드럽고 고소한 계란말이",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "계란", "amount": "3", "unit": "개" },
    { "name": "소금", "amount": "약간", "unit": "" },
    { "name": "식용유", "amount": "1", "unit": "큰술" },
    { "name": "설탕", "amount": "0.5", "unit": "작은술" }
  ],
  "instructions": "계란을 풀어 소금과 설탕을 넣고, 팬에 식용유를 두르고 계란을 부어 말아줍니다.",
  "nutrition": {
    "calories": 150,
    "protein": 12.0,
    "carbs": 2.0,
    "fat": 10.0,
    "sodium": 200,
    "fiber": 0
  },
  "imageUrl": "",
  "emoji": "🍳"
}
```

### 31. 미역줄기볶음
```json
{
  "title": "미역줄기볶음",
  "description": "아삭한 미역줄기 볶음",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "미역줄기", "amount": "200", "unit": "g" },
    { "name": "식용유", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "2", "unit": "쪽" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "설탕", "amount": "1", "unit": "작은술" }
  ],
  "instructions": "미역줄기를 깨끗이 씻어 물기를 빼고, 식용유에 마늘을 볶다가 미역줄기를 넣어 볶습니다. 고춧가루와 설탕으로 간을 맞춥니다.",
  "nutrition": {
    "calories": 60,
    "protein": 1.5,
    "carbs": 8.0,
    "fat": 2.5,
    "sodium": 150,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🌊"
}
```

### 32. 숙주나물
```json
{
  "title": "숙주나물",
  "description": "아삭하고 담백한 숙주나물",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "숙주", "amount": "200", "unit": "g" },
    { "name": "참기름", "amount": "1", "unit": "작은술" },
    { "name": "깨소금", "amount": "1", "unit": "작은술" },
    { "name": "파", "amount": "약간", "unit": "" }
  ],
  "instructions": "숙주를 살짝 데쳐 물기를 빼고, 참기름, 깨소금, 파로 무칩니다.",
  "nutrition": {
    "calories": 35,
    "protein": 3.5,
    "carbs": 4.0,
    "fat": 1.0,
    "sodium": 5,
    "fiber": 1.5
  },
  "imageUrl": "",
  "emoji": "🌱"
}
```

### 33. 시래기나물
```json
{
  "title": "시래기나물",
  "description": "구수한 시래기나물",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "시래기", "amount": "100", "unit": "g" },
    { "name": "들기름", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "2", "unit": "쪽" },
    { "name": "국간장", "amount": "1", "unit": "큰술" }
  ],
  "instructions": "시래기를 불려 삶아 물기를 짜고, 들기름에 마늘을 볶다가 시래기를 넣어 볶습니다. 국간장으로 간을 맞춥니다.",
  "nutrition": {
    "calories": 70,
    "protein": 3.0,
    "carbs": 8.0,
    "fat": 3.0,
    "sodium": 400,
    "fiber": 4.5
  },
  "imageUrl": "",
  "emoji": "🥬"
}
```

### 34. 연근조림
```json
{
  "title": "연근조림",
  "description": "달콤하고 아삭한 연근조림",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "연근", "amount": "200", "unit": "g" },
    { "name": "간장", "amount": "2", "unit": "큰술" },
    { "name": "올리고당", "amount": "1", "unit": "큰술" },
    { "name": "참기름", "amount": "1", "unit": "작은술" }
  ],
  "instructions": "연근을 얇게 썰어 간장, 올리고당으로 조립니다. 마지막에 참기름을 넣어 마무리합니다.",
  "nutrition": {
    "calories": 90,
    "protein": 2.0,
    "carbs": 18.0,
    "fat": 1.5,
    "sodium": 500,
    "fiber": 3.5
  },
  "imageUrl": "",
  "emoji": "🌿"
}
```

### 35. 가지볶음
```json
{
  "title": "가지볶음",
  "description": "부드럽고 고소한 가지볶음",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "가지", "amount": "2", "unit": "개" },
    { "name": "양파", "amount": "1/2", "unit": "개" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "식용유", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "2", "unit": "쪽" }
  ],
  "instructions": "가지를 썰어 기름에 볶다가 양파와 마늘을 넣어 볶습니다. 고춧가루로 간을 맞춥니다.",
  "nutrition": {
    "calories": 75,
    "protein": 2.0,
    "carbs": 10.0,
    "fat": 3.5,
    "sodium": 20,
    "fiber": 3.0
  },
  "imageUrl": "",
  "emoji": "🍆"
}
```

### 36. 브로콜리나물
```json
{
  "title": "브로콜리나물",
  "description": "영양 가득한 브로콜리나물",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "브로콜리", "amount": "200", "unit": "g" },
    { "name": "참기름", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "깨소금", "amount": "1", "unit": "작은술" }
  ],
  "instructions": "브로콜리를 살짝 데쳐 물기를 짜고, 참기름, 마늘, 깨소금으로 무칩니다.",
  "nutrition": {
    "calories": 50,
    "protein": 3.5,
    "carbs": 6.0,
    "fat": 2.0,
    "sodium": 30,
    "fiber": 3.5
  },
  "imageUrl": "",
  "emoji": "🥦"
}
```

### 37. 파래무침
```json
{
  "title": "파래무침",
  "description": "향긋한 파래무침",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "파래", "amount": "100", "unit": "g" },
    { "name": "식초", "amount": "1", "unit": "큰술" },
    { "name": "고춧가루", "amount": "1", "unit": "작은술" },
    { "name": "설탕", "amount": "1", "unit": "작은술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" }
  ],
  "instructions": "파래를 깨끗이 씻어 물기를 빼고, 식초, 고춧가루, 설탕, 다진 마늘로 무칩니다.",
  "nutrition": {
    "calories": 30,
    "protein": 2.0,
    "carbs": 5.0,
    "fat": 0.5,
    "sodium": 200,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🌿"
}
```

### 38. 콩나물무침
```json
{
  "title": "콩나물무침",
  "description": "아삭하고 담백한 콩나물무침",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "콩나물", "amount": "200", "unit": "g" },
    { "name": "참기름", "amount": "1", "unit": "작은술" },
    { "name": "깨소금", "amount": "1", "unit": "작은술" },
    { "name": "다진 마늘", "amount": "0.5", "unit": "작은술" },
    { "name": "소금", "amount": "약간", "unit": "" }
  ],
  "instructions": "콩나물을 데쳐 찬물에 헹궈 물기를 빼고, 참기름, 깨소금, 다진 마늘, 소금으로 무칩니다.",
  "nutrition": {
    "calories": 40,
    "protein": 4.0,
    "carbs": 5.0,
    "fat": 1.5,
    "sodium": 150,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🌱"
}
```

### 39. 오이소박이
```json
{
  "title": "오이소박이",
  "description": "시원하고 아삭한 오이소박이",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "오이", "amount": "3", "unit": "개" },
    { "name": "부추", "amount": "50", "unit": "g" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "생강즙", "amount": "0.5", "unit": "작은술" },
    { "name": "새우젓", "amount": "1", "unit": "작은술" },
    { "name": "설탕", "amount": "1", "unit": "작은술" }
  ],
  "instructions": "오이를 4등분하여 소금에 절인 후, 부추와 양념을 섞어 오이에 채워 넣습니다. 하루 정도 숙성시킵니다.",
  "nutrition": {
    "calories": 35,
    "protein": 2.0,
    "carbs": 6.0,
    "fat": 0.5,
    "sodium": 300,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🥒"
}
```

### 40. 무생채
```json
{
  "title": "무생채",
  "description": "아삭하고 시원한 무생채",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "무", "amount": "200", "unit": "g" },
    { "name": "식초", "amount": "1", "unit": "큰술" },
    { "name": "설탕", "amount": "1", "unit": "큰술" },
    { "name": "소금", "amount": "0.5", "unit": "작은술" },
    { "name": "고춧가루", "amount": "0.5", "unit": "작은술" }
  ],
  "instructions": "무를 채 썰어 소금에 절인 후 물기를 짜고, 식초, 설탕, 고춧가루로 무칩니다.",
  "nutrition": {
    "calories": 25,
    "protein": 1.0,
    "carbs": 5.0,
    "fat": 0.2,
    "sodium": 200,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🥕"
}
```

### 41. 깻잎나물
```json
{
  "title": "깻잎나물",
  "description": "향긋한 깻잎나물",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "깻잎", "amount": "100", "unit": "g" },
    { "name": "참기름", "amount": "1", "unit": "큰술" },
    { "name": "깨소금", "amount": "1", "unit": "작은술" },
    { "name": "다진 마늘", "amount": "0.5", "unit": "작은술" },
    { "name": "국간장", "amount": "1", "unit": "작은술" }
  ],
  "instructions": "깻잎을 깨끗이 씻어 물기를 빼고, 참기름, 깨소금, 다진 마늘, 국간장으로 무칩니다.",
  "nutrition": {
    "calories": 45,
    "protein": 2.5,
    "carbs": 3.0,
    "fat": 3.0,
    "sodium": 250,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🌿"
}
```

### 42. 당근볶음
```json
{
  "title": "당근볶음",
  "description": "달콤하고 고소한 당근볶음",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "당근", "amount": "200", "unit": "g" },
    { "name": "식용유", "amount": "1", "unit": "큰술" },
    { "name": "설탕", "amount": "1", "unit": "작은술" },
    { "name": "소금", "amount": "약간", "unit": "" }
  ],
  "instructions": "당근을 채 썰어 식용유에 볶다가 설탕과 소금으로 간을 맞춥니다.",
  "nutrition": {
    "calories": 60,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 2.5,
    "sodium": 100,
    "fiber": 3.0
  },
  "imageUrl": "",
  "emoji": "🥕"
}
```

### 43. 양배추볶음
```json
{
  "title": "양배추볶음",
  "description": "아삭하고 담백한 양배추볶음",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "양배추", "amount": "200", "unit": "g" },
    { "name": "식용유", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "소금", "amount": "약간", "unit": "" },
    { "name": "후추", "amount": "약간", "unit": "" }
  ],
  "instructions": "양배추를 채 썰어 식용유에 다진 마늘과 함께 볶습니다. 소금과 후추로 간을 맞춥니다.",
  "nutrition": {
    "calories": 50,
    "protein": 2.0,
    "carbs": 6.0,
    "fat": 2.5,
    "sodium": 150,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🥬"
}
```

### 44. 버섯볶음
```json
{
  "title": "버섯볶음",
  "description": "고소하고 부드러운 버섯볶음",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "표고버섯", "amount": "100", "unit": "g" },
    { "name": "식용유", "amount": "1", "unit": "큰술" },
    { "name": "간장", "amount": "1", "unit": "큰술" },
    { "name": "설탕", "amount": "0.5", "unit": "작은술" },
    { "name": "참기름", "amount": "0.5", "unit": "작은술" }
  ],
  "instructions": "표고버섯을 썰어 식용유에 볶다가 간장, 설탕으로 간을 맞춥니다. 마지막에 참기름을 넣어 마무리합니다.",
  "nutrition": {
    "calories": 55,
    "protein": 2.5,
    "carbs": 6.0,
    "fat": 2.5,
    "sodium": 400,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🍄"
}
```

### 45. 감자볶음
```json
{
  "title": "감자볶음",
  "description": "부드럽고 고소한 감자볶음",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "감자", "amount": "200", "unit": "g" },
    { "name": "식용유", "amount": "1", "unit": "큰술" },
    { "name": "소금", "amount": "약간", "unit": "" },
    { "name": "후추", "amount": "약간", "unit": "" }
  ],
  "instructions": "감자를 채 썰어 찬물에 헹군 후 식용유에 볶습니다. 소금과 후추로 간을 맞춥니다.",
  "nutrition": {
    "calories": 120,
    "protein": 2.5,
    "carbs": 20.0,
    "fat": 3.5,
    "sodium": 100,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🥔"
}
```

### 46. 두부조림
```json
{
  "title": "두부조림",
  "description": "부드럽고 고소한 두부조림",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "두부", "amount": "1", "unit": "모" },
    { "name": "간장", "amount": "2", "unit": "큰술" },
    { "name": "설탕", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "참기름", "amount": "1", "unit": "작은술" }
  ],
  "instructions": "두부를 썰어 간장, 설탕, 다진 마늘로 조립니다. 마지막에 참기름을 넣어 마무리합니다.",
  "nutrition": {
    "calories": 95,
    "protein": 8.0,
    "carbs": 8.0,
    "fat": 4.0,
    "sodium": 600,
    "fiber": 1.0
  },
  "imageUrl": "",
  "emoji": "🧈"
}
```

### 47. 계란말이
```json
{
  "title": "계란말이",
  "description": "부드럽고 고소한 계란말이",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "계란", "amount": "3", "unit": "개" },
    { "name": "소금", "amount": "약간", "unit": "" },
    { "name": "식용유", "amount": "1", "unit": "큰술" },
    { "name": "설탕", "amount": "0.5", "unit": "작은술" }
  ],
  "instructions": "계란을 풀어 소금과 설탕을 넣고, 팬에 식용유를 두르고 계란을 부어 말아줍니다.",
  "nutrition": {
    "calories": 150,
    "protein": 12.0,
    "carbs": 2.0,
    "fat": 10.0,
    "sodium": 200,
    "fiber": 0
  },
  "imageUrl": "",
  "emoji": "🍳"
}
```

### 48. 고사리나물
```json
{
  "title": "고사리나물",
  "description": "구수하고 부드러운 고사리나물",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "고사리", "amount": "150", "unit": "g" },
    { "name": "들기름", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "2", "unit": "쪽" },
    { "name": "국간장", "amount": "1", "unit": "큰술" }
  ],
  "instructions": "고사리를 삶아 물기를 짜고, 들기름에 마늘을 볶다가 고사리를 넣어 볶습니다. 국간장으로 간을 맞춥니다.",
  "nutrition": {
    "calories": 65,
    "protein": 2.5,
    "carbs": 7.0,
    "fat": 3.0,
    "sodium": 350,
    "fiber": 4.0
  },
  "imageUrl": "/api/picture/고사리나물.jpg",
  "emoji": "🌿"
}
```

### 49. 취나물
```json
{
  "title": "취나물",
  "description": "향긋한 취나물",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "취나물", "amount": "150", "unit": "g" },
    { "name": "참기름", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "깨소금", "amount": "1", "unit": "작은술" }
  ],
  "instructions": "취나물을 데쳐 물기를 짜고, 참기름, 마늘, 깨소금으로 무칩니다.",
  "nutrition": {
    "calories": 50,
    "protein": 2.0,
    "carbs": 6.0,
    "fat": 2.5,
    "sodium": 10,
    "fiber": 3.0
  },
  "imageUrl": "/api/picture/취나물.jpg",
  "emoji": "🌱"
}
```

### 50. 도라지나물
```json
{
  "title": "도라지나물",
  "description": "아삭하고 씁쓸한 맛이 일품인 도라지나물",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "도라지", "amount": "200", "unit": "g" },
    { "name": "소금", "amount": "1", "unit": "작은술" },
    { "name": "참기름", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "깨소금", "amount": "1", "unit": "작은술" }
  ],
  "instructions": "도라지를 깨끗이 씻어 소금에 절인 후 물기를 짜고, 참기름, 다진 마늘, 깨소금으로 무칩니다.",
  "nutrition": {
    "calories": 55,
    "protein": 2.0,
    "carbs": 8.0,
    "fat": 2.0,
    "sodium": 200,
    "fiber": 3.5
  },
  "imageUrl": "/api/picture/도라지나물.jpg",
  "emoji": "🥬"
}
```

### 51. 시금치나물
```json
{
  "title": "시금치나물",
  "description": "고소한 시금치나물",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "시금치", "amount": "200", "unit": "g" },
    { "name": "다진 마늘", "amount": "0.5", "unit": "작은술" },
    { "name": "국간장", "amount": "1", "unit": "작은술" },
    { "name": "참기름", "amount": "1", "unit": "작은술" },
    { "name": "깨소금", "amount": "0.5", "unit": "작은술" }
  ],
  "instructions": "시금치는 뿌리 부분을 다듬고 깨끗이 씻어 끓는 물에 소금을 약간 넣고 30초 정도 데쳐 찬물에 헹궈 물기를 꼭 짭니다. 데친 시금치를 볼에 담고 다진 마늘, 국간장, 참기름, 깨소금을 넣어 조물조물 무쳐줍니다.",
  "nutrition": {
    "calories": 60,
    "protein": 3.0,
    "carbs": 5.0,
    "fat": 4.0,
    "sodium": 200,
    "fiber": 3.0
  },
  "imageUrl": "/api/picture/시금치나물.jpg",
  "emoji": "🌿"
}
```

### 52. 콩나물볶음
```json
{
  "title": "콩나물볶음",
  "description": "아삭하고 고소한 콩나물볶음",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "콩나물", "amount": "200", "unit": "g" },
    { "name": "식용유", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "소금", "amount": "약간", "unit": "" },
    { "name": "파", "amount": "약간", "unit": "" }
  ],
  "instructions": "콩나물을 식용유에 다진 마늘과 함께 볶습니다. 소금으로 간을 맞추고 파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 50,
    "protein": 4.0,
    "carbs": 5.0,
    "fat": 2.0,
    "sodium": 150,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🌱"
}
```

### 53. 오이무침
```json
{
  "title": "오이무침",
  "description": "시원하고 아삭한 오이무침",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "오이", "amount": "2", "unit": "개" },
    { "name": "식초", "amount": "1", "unit": "큰술" },
    { "name": "설탕", "amount": "1", "unit": "큰술" },
    { "name": "소금", "amount": "0.5", "unit": "작은술" },
    { "name": "고춧가루", "amount": "0.5", "unit": "작은술" }
  ],
  "instructions": "오이를 채 썰어 소금에 절인 후 물기를 짜고, 식초, 설탕, 고춧가루로 무칩니다.",
  "nutrition": {
    "calories": 30,
    "protein": 1.0,
    "carbs": 6.0,
    "fat": 0.2,
    "sodium": 250,
    "fiber": 1.5
  },
  "imageUrl": "",
  "emoji": "🥒"
}
```

### 54. 무말랭이무침
```json
{
  "title": "무말랭이무침",
  "description": "아삭하고 시원한 무말랭이무침",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "무말랭이", "amount": "50", "unit": "g" },
    { "name": "식초", "amount": "1", "unit": "큰술" },
    { "name": "설탕", "amount": "1", "unit": "큰술" },
    { "name": "고춧가루", "amount": "0.5", "unit": "작은술" },
    { "name": "참기름", "amount": "0.5", "unit": "작은술" }
  ],
  "instructions": "무말랭이를 불려 물기를 짜고, 식초, 설탕, 고춧가루, 참기름으로 무칩니다.",
  "nutrition": {
    "calories": 40,
    "protein": 1.0,
    "carbs": 8.0,
    "fat": 1.0,
    "sodium": 150,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🥕"
}
```

### 55. 가지나물
```json
{
  "title": "가지나물",
  "description": "부드럽고 고소한 가지나물",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "가지", "amount": "2", "unit": "개" },
    { "name": "참기름", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "국간장", "amount": "1", "unit": "작은술" },
    { "name": "깨소금", "amount": "0.5", "unit": "작은술" }
  ],
  "instructions": "가지를 찜기에 쪄서 껍질을 벗기고, 참기름, 다진 마늘, 국간장, 깨소금으로 무칩니다.",
  "nutrition": {
    "calories": 70,
    "protein": 2.0,
    "carbs": 9.0,
    "fat": 3.5,
    "sodium": 250,
    "fiber": 3.0
  },
  "imageUrl": "/api/picture/가지나물.jpg",
  "emoji": "🍆"
}
```

### 56. 브로콜리볶음
```json
{
  "title": "브로콜리볶음",
  "description": "영양 가득한 브로콜리볶음",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "브로콜리", "amount": "200", "unit": "g" },
    { "name": "식용유", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "소금", "amount": "약간", "unit": "" },
    { "name": "후추", "amount": "약간", "unit": "" }
  ],
  "instructions": "브로콜리를 식용유에 다진 마늘과 함께 볶습니다. 소금과 후추로 간을 맞춥니다.",
  "nutrition": {
    "calories": 55,
    "protein": 3.5,
    "carbs": 6.0,
    "fat": 2.5,
    "sodium": 100,
    "fiber": 3.5
  },
  "imageUrl": "",
  "emoji": "🥦"
}
```

### 57. 당근나물
```json
{
  "title": "당근나물",
  "description": "달콤하고 고소한 당근나물",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "당근", "amount": "200", "unit": "g" },
    { "name": "참기름", "amount": "1", "unit": "큰술" },
    { "name": "깨소금", "amount": "1", "unit": "작은술" },
    { "name": "소금", "amount": "약간", "unit": "" }
  ],
  "instructions": "당근을 채 썰어 소금에 절인 후 물기를 짜고, 참기름, 깨소금으로 무칩니다.",
  "nutrition": {
    "calories": 65,
    "protein": 1.0,
    "carbs": 10.0,
    "fat": 2.5,
    "sodium": 150,
    "fiber": 3.0
  },
  "imageUrl": "",
  "emoji": "🥕"
}
```

### 58. 양배추나물
```json
{
  "title": "양배추나물",
  "description": "아삭하고 담백한 양배추나물",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "양배추", "amount": "200", "unit": "g" },
    { "name": "참기름", "amount": "1", "unit": "큰술" },
    { "name": "깨소금", "amount": "1", "unit": "작은술" },
    { "name": "소금", "amount": "약간", "unit": "" }
  ],
  "instructions": "양배추를 채 썰어 소금에 절인 후 물기를 짜고, 참기름, 깨소금으로 무칩니다.",
  "nutrition": {
    "calories": 45,
    "protein": 2.0,
    "carbs": 6.0,
    "fat": 2.0,
    "sodium": 150,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🥬"
}
```

### 59. 버섯나물
```json
{
  "title": "버섯나물",
  "description": "고소하고 부드러운 버섯나물",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "팽이버섯", "amount": "100", "unit": "g" },
    { "name": "참기름", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "국간장", "amount": "1", "unit": "작은술" },
    { "name": "깨소금", "amount": "0.5", "unit": "작은술" }
  ],
  "instructions": "팽이버섯을 데쳐 물기를 짜고, 참기름, 다진 마늘, 국간장, 깨소금으로 무칩니다.",
  "nutrition": {
    "calories": 50,
    "protein": 2.5,
    "carbs": 5.0,
    "fat": 2.5,
    "sodium": 300,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🍄"
}
```

### 60. 감자나물
```json
{
  "title": "감자나물",
  "description": "부드럽고 고소한 감자나물",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "감자", "amount": "200", "unit": "g" },
    { "name": "참기름", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "국간장", "amount": "1", "unit": "작은술" },
    { "name": "깨소금", "amount": "0.5", "unit": "작은술" }
  ],
  "instructions": "감자를 삶아 으깨어 참기름, 다진 마늘, 국간장, 깨소금으로 무칩니다.",
  "nutrition": {
    "calories": 130,
    "protein": 2.5,
    "carbs": 20.0,
    "fat": 4.0,
    "sodium": 300,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🥔"
}
```

---

## 국류 (Soups)

### 1. 배추국
```json
{
  "title": "배추국",
  "description": "담백하고 시원한 배추국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "배추", "amount": "200", "unit": "g" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "2", "unit": "쪽" },
    { "name": "파", "amount": "약간", "unit": "" }
  ],
  "instructions": "멸치육수에 배추를 넣고 끓이다가 국간장, 마늘로 간을 맞춥니다. 파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 35,
    "protein": 2.0,
    "carbs": 5.0,
    "fat": 0.5,
    "sodium": 400,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🥬"
}
```

### 2. 시금치국
```json
{
  "title": "시금치국",
  "description": "영양 가득한 시금치국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "시금치", "amount": "150", "unit": "g" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" }
  ],
  "instructions": "멸치육수에 시금치를 넣고 끓이다가 국간장, 마늘로 간을 맞춥니다.",
  "nutrition": {
    "calories": 30,
    "protein": 2.5,
    "carbs": 4.0,
    "fat": 0.5,
    "sodium": 380,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🥬"
}
```

### 3. 우거지국
```json
{
  "title": "우거지국",
  "description": "구수한 우거지국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "우거지", "amount": "150", "unit": "g" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "2", "unit": "쪽" },
    { "name": "고춧가루", "amount": "1", "unit": "작은술" }
  ],
  "instructions": "우거지를 불려 삶아 물기를 짜고, 멸치육수에 넣어 끓입니다. 국간장, 마늘, 고춧가루로 간을 맞춥니다.",
  "nutrition": {
    "calories": 40,
    "protein": 2.5,
    "carbs": 6.0,
    "fat": 1.0,
    "sodium": 450,
    "fiber": 3.0
  },
  "imageUrl": "",
  "emoji": "🥬"
}
```

### 4. 호박국
```json
{
  "title": "호박국",
  "description": "담백한 호박국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "애호박", "amount": "200", "unit": "g" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" }
  ],
  "instructions": "애호박을 썰어 멸치육수에 넣고 끓이다가 국간장, 마늘로 간을 맞춥니다.",
  "nutrition": {
    "calories": 35,
    "protein": 1.5,
    "carbs": 7.0,
    "fat": 0.5,
    "sodium": 400,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🎃"
}
```

### 5. 파국
```json
{
  "title": "파국",
  "description": "향긋한 파국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["breakfast", "lunch"],
  "ingredients": [
    { "name": "대파", "amount": "2", "unit": "대" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" }
  ],
  "instructions": "대파를 썰어 멸치육수에 넣고 끓이다가 국간장, 마늘로 간을 맞춥니다.",
  "nutrition": {
    "calories": 25,
    "protein": 1.5,
    "carbs": 4.0,
    "fat": 0.3,
    "sodium": 380,
    "fiber": 1.5
  },
  "imageUrl": "",
  "emoji": "🌿"
}
```

### 6. 미역국
```json
{
  "title": "미역국",
  "description": "영양 가득한 미역국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "마른 미역", "amount": "10", "unit": "g" },
    { "name": "소고기", "amount": "50", "unit": "g" },
    { "name": "참기름", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "물", "amount": "500", "unit": "ml" }
  ],
  "instructions": "미역을 불려 준비하고, 소고기를 참기름에 볶다가 물을 넣고 끓입니다. 미역을 넣고 마늘로 간을 맞춥니다.",
  "nutrition": {
    "calories": 80,
    "protein": 8.0,
    "carbs": 5.0,
    "fat": 3.5,
    "sodium": 200,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🌊"
}
```

### 7. 달걀국
```json
{
  "title": "달걀국",
  "description": "부드럽고 담백한 달걀국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "계란", "amount": "2", "unit": "개" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "파", "amount": "약간", "unit": "" }
  ],
  "instructions": "멸치육수에 계란을 풀어 넣고 끓입니다. 국간장으로 간을 맞추고 파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 60,
    "protein": 6.0,
    "carbs": 2.0,
    "fat": 3.5,
    "sodium": 400,
    "fiber": 0
  },
  "imageUrl": "",
  "emoji": "🍳"
}
```

### 8. 무국
```json
{
  "title": "무국",
  "description": "시원하고 담백한 무국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "무", "amount": "150", "unit": "g" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "파", "amount": "약간", "unit": "" }
  ],
  "instructions": "무를 썰어 멸치육수에 넣고 끓이다가 국간장, 마늘로 간을 맞춥니다. 파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 30,
    "protein": 1.5,
    "carbs": 5.0,
    "fat": 0.3,
    "sodium": 400,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🥕"
}
```

### 9. 콩나물국
```json
{
  "title": "콩나물국",
  "description": "아삭하고 시원한 콩나물국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "콩나물", "amount": "150", "unit": "g" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "파", "amount": "약간", "unit": "" }
  ],
  "instructions": "멸치육수에 콩나물을 넣고 끓이다가 국간장, 마늘로 간을 맞춥니다. 파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 35,
    "protein": 3.5,
    "carbs": 4.0,
    "fat": 1.0,
    "sodium": 400,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🌱"
}
```

### 10. 두부국
```json
{
  "title": "두부국",
  "description": "부드럽고 담백한 두부국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "두부", "amount": "1/2", "unit": "모" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "파", "amount": "약간", "unit": "" }
  ],
  "instructions": "멸치육수에 두부를 넣고 끓이다가 국간장, 마늘로 간을 맞춥니다. 파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 50,
    "protein": 5.0,
    "carbs": 3.0,
    "fat": 2.0,
    "sodium": 400,
    "fiber": 1.0
  },
  "imageUrl": "",
  "emoji": "🧈"
}
```

### 11. 감자국
```json
{
  "title": "감자국",
  "description": "부드럽고 담백한 감자국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "감자", "amount": "200", "unit": "g" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "파", "amount": "약간", "unit": "" }
  ],
  "instructions": "감자를 썰어 멸치육수에 넣고 끓이다가 국간장, 마늘로 간을 맞춥니다. 파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 90,
    "protein": 2.5,
    "carbs": 18.0,
    "fat": 0.5,
    "sodium": 400,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🥔"
}
```

### 12. 오이냉국
```json
{
  "title": "오이냉국",
  "description": "시원하고 상큼한 오이냉국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "오이", "amount": "1", "unit": "개" },
    { "name": "식초", "amount": "1", "unit": "큰술" },
    { "name": "설탕", "amount": "1", "unit": "큰술" },
    { "name": "소금", "amount": "0.5", "unit": "작은술" },
    { "name": "물", "amount": "500", "unit": "ml" }
  ],
  "instructions": "오이를 채 썰어 물에 넣고, 식초, 설탕, 소금으로 간을 맞춥니다. 차갑게 식혀서 드세요.",
  "nutrition": {
    "calories": 25,
    "protein": 1.0,
    "carbs": 6.0,
    "fat": 0.2,
    "sodium": 300,
    "fiber": 1.5
  },
  "imageUrl": "",
  "emoji": "🥒"
}
```

### 13. 토란국
```json
{
  "title": "토란국",
  "description": "부드럽고 구수한 토란국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "토란", "amount": "200", "unit": "g" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "파", "amount": "약간", "unit": "" }
  ],
  "instructions": "토란을 삶아 껍질을 벗기고 썰어 멸치육수에 넣고 끓입니다. 국간장, 마늘로 간을 맞추고 파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 70,
    "protein": 2.0,
    "carbs": 15.0,
    "fat": 0.5,
    "sodium": 400,
    "fiber": 3.0
  },
  "imageUrl": "",
  "emoji": "🌿"
}
```

### 14. 고사리국
```json
{
  "title": "고사리국",
  "description": "구수한 고사리국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "고사리", "amount": "100", "unit": "g" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "파", "amount": "약간", "unit": "" }
  ],
  "instructions": "고사리를 삶아 물기를 짜고, 멸치육수에 넣어 끓입니다. 국간장, 마늘로 간을 맞추고 파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 40,
    "protein": 2.0,
    "carbs": 6.0,
    "fat": 1.0,
    "sodium": 400,
    "fiber": 3.0
  },
  "imageUrl": "",
  "emoji": "🌿"
}
```

### 15. 취나물국
```json
{
  "title": "취나물국",
  "description": "향긋한 취나물국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "취나물", "amount": "100", "unit": "g" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "파", "amount": "약간", "unit": "" }
  ],
  "instructions": "취나물을 데쳐 물기를 짜고, 멸치육수에 넣어 끓입니다. 국간장, 마늘로 간을 맞추고 파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 35,
    "protein": 2.0,
    "carbs": 5.0,
    "fat": 1.0,
    "sodium": 400,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🌱"
}
```

### 16. 시래기국
```json
{
  "title": "시래기국",
  "description": "구수한 시래기국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "시래기", "amount": "100", "unit": "g" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "파", "amount": "약간", "unit": "" }
  ],
  "instructions": "시래기를 불려 삶아 물기를 짜고, 멸치육수에 넣어 끓입니다. 국간장, 마늘로 간을 맞추고 파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 45,
    "protein": 2.5,
    "carbs": 7.0,
    "fat": 1.0,
    "sodium": 450,
    "fiber": 3.5
  },
  "imageUrl": "",
  "emoji": "🥬"
}
```

### 17. 도라지국
```json
{
  "title": "도라지국",
  "description": "아삭하고 담백한 도라지국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "도라지", "amount": "100", "unit": "g" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "파", "amount": "약간", "unit": "" }
  ],
  "instructions": "도라지를 소금에 절인 후 물기를 짜고, 멸치육수에 넣어 끓입니다. 국간장, 마늘로 간을 맞추고 파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 40,
    "protein": 2.0,
    "carbs": 7.0,
    "fat": 0.5,
    "sodium": 400,
    "fiber": 3.0
  },
  "imageUrl": "",
  "emoji": "🥬"
}
```

### 18. 연근국
```json
{
  "title": "연근국",
  "description": "아삭하고 담백한 연근국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "연근", "amount": "150", "unit": "g" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "파", "amount": "약간", "unit": "" }
  ],
  "instructions": "연근을 썰어 멸치육수에 넣고 끓입니다. 국간장, 마늘로 간을 맞추고 파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 50,
    "protein": 2.0,
    "carbs": 10.0,
    "fat": 0.3,
    "sodium": 400,
    "fiber": 3.0
  },
  "imageUrl": "",
  "emoji": "🌿"
}
```

### 19. 가지국
```json
{
  "title": "가지국",
  "description": "부드럽고 담백한 가지국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "가지", "amount": "1", "unit": "개" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "파", "amount": "약간", "unit": "" }
  ],
  "instructions": "가지를 썰어 멸치육수에 넣고 끓입니다. 국간장, 마늘로 간을 맞추고 파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 40,
    "protein": 2.0,
    "carbs": 7.0,
    "fat": 1.0,
    "sodium": 400,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🍆"
}
```

### 20. 브로콜리국
```json
{
  "title": "브로콜리국",
  "description": "영양 가득한 브로콜리국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "브로콜리", "amount": "150", "unit": "g" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "파", "amount": "약간", "unit": "" }
  ],
  "instructions": "브로콜리를 썰어 멸치육수에 넣고 끓입니다. 국간장, 마늘로 간을 맞추고 파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 35,
    "protein": 3.0,
    "carbs": 5.0,
    "fat": 0.5,
    "sodium": 400,
    "fiber": 3.0
  },
  "imageUrl": "",
  "emoji": "🥦"
}
```

### 21. 당근국
```json
{
  "title": "당근국",
  "description": "달콤하고 담백한 당근국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "당근", "amount": "150", "unit": "g" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "파", "amount": "약간", "unit": "" }
  ],
  "instructions": "당근을 썰어 멸치육수에 넣고 끓입니다. 국간장, 마늘로 간을 맞추고 파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 40,
    "protein": 1.0,
    "carbs": 8.0,
    "fat": 0.3,
    "sodium": 400,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🥕"
}
```

### 22. 양배추국
```json
{
  "title": "양배추국",
  "description": "아삭하고 담백한 양배추국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "양배추", "amount": "150", "unit": "g" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "파", "amount": "약간", "unit": "" }
  ],
  "instructions": "양배추를 썰어 멸치육수에 넣고 끓입니다. 국간장, 마늘로 간을 맞추고 파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 30,
    "protein": 2.0,
    "carbs": 5.0,
    "fat": 0.3,
    "sodium": 400,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🥬"
}
```

### 23. 표고버섯국
```json
{
  "title": "표고버섯국",
  "description": "고소하고 담백한 표고버섯국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "표고버섯", "amount": "50", "unit": "g" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "파", "amount": "약간", "unit": "" }
  ],
  "instructions": "표고버섯을 썰어 멸치육수에 넣고 끓입니다. 국간장, 마늘로 간을 맞추고 파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 30,
    "protein": 2.0,
    "carbs": 5.0,
    "fat": 0.5,
    "sodium": 400,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🍄"
}
```

### 24. 파래국
```json
{
  "title": "파래국",
  "description": "향긋한 파래국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "파래", "amount": "50", "unit": "g" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "파", "amount": "약간", "unit": "" }
  ],
  "instructions": "파래를 깨끗이 씻어 멸치육수에 넣고 끓입니다. 국간장, 마늘로 간을 맞추고 파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 25,
    "protein": 2.0,
    "carbs": 4.0,
    "fat": 0.3,
    "sodium": 400,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🌿"
}
```

### 25. 미역줄기국
```json
{
  "title": "미역줄기국",
  "description": "아삭하고 담백한 미역줄기국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "미역줄기", "amount": "100", "unit": "g" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "파", "amount": "약간", "unit": "" }
  ],
  "instructions": "미역줄기를 썰어 멸치육수에 넣고 끓입니다. 국간장, 마늘로 간을 맞추고 파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 30,
    "protein": 1.5,
    "carbs": 6.0,
    "fat": 0.3,
    "sodium": 400,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🌊"
}
```

### 26. 숙주국
```json
{
  "title": "숙주국",
  "description": "아삭하고 담백한 숙주국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "숙주", "amount": "150", "unit": "g" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "파", "amount": "약간", "unit": "" }
  ],
  "instructions": "숙주를 멸치육수에 넣고 끓입니다. 국간장, 마늘로 간을 맞추고 파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 30,
    "protein": 3.0,
    "carbs": 4.0,
    "fat": 0.5,
    "sodium": 400,
    "fiber": 1.5
  },
  "imageUrl": "",
  "emoji": "🌱"
}
```

### 27. 깻잎국
```json
{
  "title": "깻잎국",
  "description": "향긋한 깻잎국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "깻잎", "amount": "50", "unit": "g" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "파", "amount": "약간", "unit": "" }
  ],
  "instructions": "깻잎을 썰어 멸치육수에 넣고 끓입니다. 국간장, 마늘로 간을 맞추고 파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 25,
    "protein": 1.5,
    "carbs": 3.0,
    "fat": 0.5,
    "sodium": 400,
    "fiber": 1.5
  },
  "imageUrl": "",
  "emoji": "🌿"
}
```

### 28. 오이국
```json
{
  "title": "오이국",
  "description": "시원하고 담백한 오이국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "오이", "amount": "1", "unit": "개" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "파", "amount": "약간", "unit": "" }
  ],
  "instructions": "오이를 썰어 멸치육수에 넣고 끓입니다. 국간장, 마늘로 간을 맞추고 파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 25,
    "protein": 1.5,
    "carbs": 4.0,
    "fat": 0.3,
    "sodium": 400,
    "fiber": 1.5
  },
  "imageUrl": "",
  "emoji": "🥒"
}
```

### 29. 버섯국
```json
{
  "title": "버섯국",
  "description": "고소하고 담백한 버섯국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "팽이버섯", "amount": "100", "unit": "g" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "파", "amount": "약간", "unit": "" }
  ],
  "instructions": "팽이버섯을 멸치육수에 넣고 끓입니다. 국간장, 마늘로 간을 맞추고 파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 30,
    "protein": 2.0,
    "carbs": 5.0,
    "fat": 0.5,
    "sodium": 400,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🍄"
}
```

### 30. 다시마국
```json
{
  "title": "다시마국",
  "description": "깔끔하고 담백한 다시마국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "다시마", "amount": "10", "unit": "g" },
    { "name": "물", "amount": "500", "unit": "ml" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "1", "unit": "쪽" },
    { "name": "파", "amount": "약간", "unit": "" }
  ],
  "instructions": "다시마를 물에 넣고 끓입니다. 국간장, 마늘로 간을 맞추고 파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 20,
    "protein": 1.0,
    "carbs": 4.0,
    "fat": 0.2,
    "sodium": 400,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🌊"
}
```

---

## 찌개류 (Stews)

### 1. 청국장찌개
```json
{
  "title": "청국장찌개",
  "description": "구수하고 진한 청국장찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "청국장", "amount": "100", "unit": "g" },
    { "name": "두부", "amount": "1/2", "unit": "모" },
    { "name": "애호박", "amount": "1/2", "unit": "개" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "멸치육수에 청국장을 풀고 두부, 애호박을 넣어 끓입니다. 고춧가루로 간을 맞춥니다.",
  "nutrition": {
    "calories": 120,
    "protein": 8.0,
    "carbs": 12.0,
    "fat": 4.0,
    "sodium": 800,
    "fiber": 3.0
  },
  "imageUrl": "",
  "emoji": "🍲"
}
```

### 2. 고추장찌개
```json
{
  "title": "고추장찌개",
  "description": "얼큰한 고추장찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "고추장", "amount": "2", "unit": "큰술" },
    { "name": "두부", "amount": "1/2", "unit": "모" },
    { "name": "애호박", "amount": "1/2", "unit": "개" },
    { "name": "양파", "amount": "1/2", "unit": "개" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "멸치육수에 고추장을 풀고 두부, 애호박, 양파를 넣어 끓입니다.",
  "nutrition": {
    "calories": 110,
    "protein": 5.0,
    "carbs": 15.0,
    "fat": 3.5,
    "sodium": 750,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🌶️"
}
```

### 3. 부대찌개
```json
{
  "title": "부대찌개",
  "description": "다양한 재료가 들어간 부대찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "김치", "amount": "150", "unit": "g" },
    { "name": "소시지", "amount": "100", "unit": "g" },
    { "name": "햄", "amount": "50", "unit": "g" },
    { "name": "두부", "amount": "1/2", "unit": "모" },
    { "name": "라면사리", "amount": "1", "unit": "개" },
    { "name": "물", "amount": "500", "unit": "ml" }
  ],
  "instructions": "김치와 소시지, 햄을 볶다가 물을 넣고 끓입니다. 두부와 라면사리를 넣어 끓입니다.",
  "nutrition": {
    "calories": 280,
    "protein": 15.0,
    "carbs": 25.0,
    "fat": 12.0,
    "sodium": 1200,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🍲"
}
```

### 4. 동태찌개
```json
{
  "title": "동태찌개",
  "description": "시원하고 얼큰한 동태찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "동태", "amount": "200", "unit": "g" },
    { "name": "무", "amount": "100", "unit": "g" },
    { "name": "고춧가루", "amount": "2", "unit": "큰술" },
    { "name": "된장", "amount": "1", "unit": "큰술" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "멸치육수에 동태와 무를 넣고 끓이다가 고춧가루와 된장을 넣어 끓입니다.",
  "nutrition": {
    "calories": 140,
    "protein": 18.0,
    "carbs": 8.0,
    "fat": 4.0,
    "sodium": 850,
    "fiber": 1.5
  },
  "imageUrl": "",
  "emoji": "🐟"
}
```

### 5. 맑은 된장찌개
```json
{
  "title": "맑은 된장찌개",
  "description": "깔끔한 맑은 된장찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "된장", "amount": "2", "unit": "큰술" },
    { "name": "두부", "amount": "1/2", "unit": "모" },
    { "name": "애호박", "amount": "1/2", "unit": "개" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "마늘", "amount": "1", "unit": "쪽" }
  ],
  "instructions": "멸치육수에 된장을 풀고 두부, 애호박을 넣어 끓입니다. 마늘을 넣어 마무리합니다.",
  "nutrition": {
    "calories": 95,
    "protein": 6.5,
    "carbs": 10.0,
    "fat": 3.0,
    "sodium": 800,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🍲"
}
```

### 6. 김치찌개
```json
{
  "title": "김치찌개",
  "description": "얼큰하고 구수한 김치찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "신김치", "amount": "200", "unit": "g" },
    { "name": "돼지고기", "amount": "100", "unit": "g" },
    { "name": "두부", "amount": "1/2", "unit": "모" },
    { "name": "양파", "amount": "1/2", "unit": "개" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "돼지고기를 볶다가 신김치를 넣고 함께 볶습니다. 멸치육수를 붓고 끓이다가 두부와 양파를 넣고 고춧가루로 간을 맞춥니다.",
  "nutrition": {
    "calories": 180,
    "protein": 12.0,
    "carbs": 10.0,
    "fat": 10.0,
    "sodium": 900,
    "fiber": 2.0
  },
  "imageUrl": "/api/picture/김치찌개.jpg",
  "emoji": "🍲"
}
```

### 7. 순두부찌개
```json
{
  "title": "순두부찌개",
  "description": "부드럽고 얼큰한 순두부찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "순두부", "amount": "1", "unit": "팩" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "대파", "amount": "1/2", "unit": "대" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "멸치육수에 순두부를 넣고 끓입니다. 고춧가루와 다진 마늘로 간을 맞추고 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 110,
    "protein": 8.0,
    "carbs": 8.0,
    "fat": 5.0,
    "sodium": 700,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🍲"
}
```

### 8. 된장찌개
```json
{
  "title": "된장찌개",
  "description": "구수한 된장찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "된장", "amount": "2", "unit": "큰술" },
    { "name": "두부", "amount": "1/2", "unit": "모" },
    { "name": "애호박", "amount": "1/2", "unit": "개" },
    { "name": "양파", "amount": "1/2", "unit": "개" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "마늘", "amount": "1", "unit": "쪽" }
  ],
  "instructions": "멸치육수에 된장을 풀고 두부, 애호박, 양파를 넣어 끓입니다. 마늘을 넣어 마무리합니다.",
  "nutrition": {
    "calories": 100,
    "protein": 6.5,
    "carbs": 10.0,
    "fat": 3.5,
    "sodium": 850,
    "fiber": 2.5
  },
  "imageUrl": "/api/picture/된장찌개.png",
  "emoji": "🍲"
}
```

### 9. 콩나물찌개
```json
{
  "title": "콩나물찌개",
  "description": "아삭하고 얼큰한 콩나물찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "콩나물", "amount": "200", "unit": "g" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "대파", "amount": "1/2", "unit": "대" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "멸치육수에 콩나물을 넣고 끓입니다. 고춧가루와 다진 마늘로 간을 맞추고 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 50,
    "protein": 4.0,
    "carbs": 6.0,
    "fat": 1.5,
    "sodium": 600,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🌱"
}
```

### 10. 미역줄기찌개
```json
{
  "title": "미역줄기찌개",
  "description": "아삭하고 얼큰한 미역줄기찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "미역줄기", "amount": "150", "unit": "g" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "대파", "amount": "1/2", "unit": "대" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "멸치육수에 미역줄기를 넣고 끓입니다. 고춧가루와 다진 마늘로 간을 맞추고 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 45,
    "protein": 2.0,
    "carbs": 7.0,
    "fat": 1.5,
    "sodium": 650,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🌊"
}
```

### 11. 우거지찌개
```json
{
  "title": "우거지찌개",
  "description": "구수하고 얼큰한 우거지찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "우거지", "amount": "150", "unit": "g" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "대파", "amount": "1/2", "unit": "대" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "우거지를 불려 삶아 물기를 짜고, 멸치육수에 넣어 끓입니다. 고춧가루와 다진 마늘로 간을 맞추고 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 50,
    "protein": 2.5,
    "carbs": 7.0,
    "fat": 1.5,
    "sodium": 700,
    "fiber": 3.5
  },
  "imageUrl": "",
  "emoji": "🥬"
}
```

### 12. 시래기찌개
```json
{
  "title": "시래기찌개",
  "description": "구수하고 얼큰한 시래기찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "시래기", "amount": "100", "unit": "g" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "대파", "amount": "1/2", "unit": "대" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "시래기를 불려 삶아 물기를 짜고, 멸치육수에 넣어 끓입니다. 고춧가루와 다진 마늘로 간을 맞추고 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 55,
    "protein": 3.0,
    "carbs": 8.0,
    "fat": 1.5,
    "sodium": 750,
    "fiber": 4.0
  },
  "imageUrl": "",
  "emoji": "🥬"
}
```

### 13. 고사리찌개
```json
{
  "title": "고사리찌개",
  "description": "구수하고 얼큰한 고사리찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "고사리", "amount": "100", "unit": "g" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "대파", "amount": "1/2", "unit": "대" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "고사리를 삶아 물기를 짜고, 멸치육수에 넣어 끓입니다. 고춧가루와 다진 마늘로 간을 맞추고 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 50,
    "protein": 2.5,
    "carbs": 7.0,
    "fat": 1.5,
    "sodium": 700,
    "fiber": 3.5
  },
  "imageUrl": "",
  "emoji": "🌿"
}
```

### 14. 취나물찌개
```json
{
  "title": "취나물찌개",
  "description": "향긋하고 얼큰한 취나물찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "취나물", "amount": "100", "unit": "g" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "대파", "amount": "1/2", "unit": "대" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "취나물을 데쳐 물기를 짜고, 멸치육수에 넣어 끓입니다. 고춧가루와 다진 마늘로 간을 맞추고 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 45,
    "protein": 2.0,
    "carbs": 6.0,
    "fat": 1.5,
    "sodium": 700,
    "fiber": 3.0
  },
  "imageUrl": "",
  "emoji": "🌱"
}
```

### 15. 도라지찌개
```json
{
  "title": "도라지찌개",
  "description": "아삭하고 얼큰한 도라지찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "도라지", "amount": "100", "unit": "g" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "대파", "amount": "1/2", "unit": "대" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "도라지를 소금에 절인 후 물기를 짜고, 멸치육수에 넣어 끓입니다. 고춧가루와 다진 마늘로 간을 맞추고 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 50,
    "protein": 2.0,
    "carbs": 8.0,
    "fat": 1.0,
    "sodium": 700,
    "fiber": 3.5
  },
  "imageUrl": "",
  "emoji": "🥬"
}
```

### 16. 연근찌개
```json
{
  "title": "연근찌개",
  "description": "아삭하고 얼큰한 연근찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "연근", "amount": "150", "unit": "g" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "대파", "amount": "1/2", "unit": "대" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "연근을 썰어 멸치육수에 넣고 끓입니다. 고춧가루와 다진 마늘로 간을 맞추고 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 60,
    "protein": 2.0,
    "carbs": 11.0,
    "fat": 1.0,
    "sodium": 700,
    "fiber": 3.5
  },
  "imageUrl": "",
  "emoji": "🌿"
}
```

### 17. 가지찌개
```json
{
  "title": "가지찌개",
  "description": "부드럽고 얼큰한 가지찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "가지", "amount": "2", "unit": "개" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "대파", "amount": "1/2", "unit": "대" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "가지를 썰어 멸치육수에 넣고 끓입니다. 고춧가루와 다진 마늘로 간을 맞추고 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 50,
    "protein": 2.0,
    "carbs": 8.0,
    "fat": 1.5,
    "sodium": 700,
    "fiber": 3.0
  },
  "imageUrl": "",
  "emoji": "🍆"
}
```

### 18. 브로콜리찌개
```json
{
  "title": "브로콜리찌개",
  "description": "영양 가득하고 얼큰한 브로콜리찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "브로콜리", "amount": "150", "unit": "g" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "대파", "amount": "1/2", "unit": "대" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "브로콜리를 썰어 멸치육수에 넣고 끓입니다. 고춧가루와 다진 마늘로 간을 맞추고 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 45,
    "protein": 3.5,
    "carbs": 6.0,
    "fat": 1.0,
    "sodium": 700,
    "fiber": 3.5
  },
  "imageUrl": "",
  "emoji": "🥦"
}
```

### 19. 당근찌개
```json
{
  "title": "당근찌개",
  "description": "달콤하고 얼큰한 당근찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "당근", "amount": "150", "unit": "g" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "대파", "amount": "1/2", "unit": "대" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "당근을 썰어 멸치육수에 넣고 끓입니다. 고춧가루와 다진 마늘로 간을 맞추고 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 50,
    "protein": 1.0,
    "carbs": 9.0,
    "fat": 1.0,
    "sodium": 700,
    "fiber": 3.0
  },
  "imageUrl": "",
  "emoji": "🥕"
}
```

### 20. 양배추찌개
```json
{
  "title": "양배추찌개",
  "description": "아삭하고 얼큰한 양배추찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "양배추", "amount": "150", "unit": "g" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "대파", "amount": "1/2", "unit": "대" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "양배추를 썰어 멸치육수에 넣고 끓입니다. 고춧가루와 다진 마늘로 간을 맞추고 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 40,
    "protein": 2.0,
    "carbs": 6.0,
    "fat": 1.0,
    "sodium": 700,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🥬"
}
```

### 21. 버섯찌개
```json
{
  "title": "버섯찌개",
  "description": "고소하고 얼큰한 버섯찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "팽이버섯", "amount": "100", "unit": "g" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "대파", "amount": "1/2", "unit": "대" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "팽이버섯을 멸치육수에 넣고 끓입니다. 고춧가루와 다진 마늘로 간을 맞추고 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 40,
    "protein": 2.5,
    "carbs": 6.0,
    "fat": 1.0,
    "sodium": 700,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🍄"
}
```

### 22. 파래찌개
```json
{
  "title": "파래찌개",
  "description": "향긋하고 얼큰한 파래찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "파래", "amount": "50", "unit": "g" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "대파", "amount": "1/2", "unit": "대" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "파래를 깨끗이 씻어 멸치육수에 넣고 끓입니다. 고춧가루와 다진 마늘로 간을 맞추고 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 35,
    "protein": 2.0,
    "carbs": 5.0,
    "fat": 1.0,
    "sodium": 700,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🌿"
}
```

### 23. 깻잎찌개
```json
{
  "title": "깻잎찌개",
  "description": "향긋하고 얼큰한 깻잎찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "깻잎", "amount": "50", "unit": "g" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "대파", "amount": "1/2", "unit": "대" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "깻잎을 썰어 멸치육수에 넣고 끓입니다. 고춧가루와 다진 마늘로 간을 맞추고 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 35,
    "protein": 2.0,
    "carbs": 4.0,
    "fat": 1.0,
    "sodium": 700,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🌿"
}
```

### 24. 오이찌개
```json
{
  "title": "오이찌개",
  "description": "시원하고 얼큰한 오이찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "오이", "amount": "1", "unit": "개" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "대파", "amount": "1/2", "unit": "대" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "오이를 썰어 멸치육수에 넣고 끓입니다. 고춧가루와 다진 마늘로 간을 맞추고 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 35,
    "protein": 1.5,
    "carbs": 5.0,
    "fat": 1.0,
    "sodium": 700,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🥒"
}
```

### 25. 감자찌개
```json
{
  "title": "감자찌개",
  "description": "부드럽고 얼큰한 감자찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "감자", "amount": "200", "unit": "g" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "대파", "amount": "1/2", "unit": "대" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "감자를 썰어 멸치육수에 넣고 끓입니다. 고춧가루와 다진 마늘로 간을 맞추고 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 100,
    "protein": 2.5,
    "carbs": 19.0,
    "fat": 1.0,
    "sodium": 700,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🥔"
}
```

### 26. 무찌개
```json
{
  "title": "무찌개",
  "description": "시원하고 얼큰한 무찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "무", "amount": "150", "unit": "g" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "대파", "amount": "1/2", "unit": "대" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "무를 썰어 멸치육수에 넣고 끓입니다. 고춧가루와 다진 마늘로 간을 맞추고 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 40,
    "protein": 1.5,
    "carbs": 6.0,
    "fat": 1.0,
    "sodium": 700,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🥕"
}
```

### 27. 배추찌개
```json
{
  "title": "배추찌개",
  "description": "아삭하고 얼큰한 배추찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "배추", "amount": "150", "unit": "g" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "대파", "amount": "1/2", "unit": "대" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "배추를 썰어 멸치육수에 넣고 끓입니다. 고춧가루와 다진 마늘로 간을 맞추고 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 45,
    "protein": 2.0,
    "carbs": 6.0,
    "fat": 1.0,
    "sodium": 700,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🥬"
}
```

### 28. 시금치찌개
```json
{
  "title": "시금치찌개",
  "description": "영양 가득하고 얼큰한 시금치찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "시금치", "amount": "150", "unit": "g" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "대파", "amount": "1/2", "unit": "대" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "시금치를 멸치육수에 넣고 끓입니다. 고춧가루와 다진 마늘로 간을 맞추고 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 40,
    "protein": 2.5,
    "carbs": 5.0,
    "fat": 1.0,
    "sodium": 700,
    "fiber": 3.0
  },
  "imageUrl": "",
  "emoji": "🥬"
}
```

### 29. 호박찌개
```json
{
  "title": "호박찌개",
  "description": "부드럽고 얼큰한 호박찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "애호박", "amount": "200", "unit": "g" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "대파", "amount": "1/2", "unit": "대" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "애호박을 썰어 멸치육수에 넣고 끓입니다. 고춧가루와 다진 마늘로 간을 맞추고 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 45,
    "protein": 1.5,
    "carbs": 8.0,
    "fat": 1.0,
    "sodium": 700,
    "fiber": 2.5
  },
  "imageUrl": "",
  "emoji": "🎃"
}
```

### 30. 파찌개
```json
{
  "title": "파찌개",
  "description": "향긋하고 얼큰한 파찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "대파", "amount": "2", "unit": "대" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "대파를 썰어 멸치육수에 넣고 끓입니다. 고춧가루와 다진 마늘로 간을 맞춥니다.",
  "nutrition": {
    "calories": 35,
    "protein": 1.5,
    "carbs": 5.0,
    "fat": 1.0,
    "sodium": 700,
    "fiber": 2.0
  },
  "imageUrl": "",
  "emoji": "🌿"
}
```

---

## 추가 레시피 (이미지 파일 기반)

### 1. 감자조림
```json
{
  "title": "감자조림",
  "description": "달콤하고 부드러운 감자조림",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "감자", "amount": "3", "unit": "개" },
    { "name": "양파", "amount": "1/2", "unit": "개" },
    { "name": "물엿", "amount": "2", "unit": "큰술" },
    { "name": "간장", "amount": "2", "unit": "큰술" },
    { "name": "설탕", "amount": "1", "unit": "큰술" },
    { "name": "참기름", "amount": "1", "unit": "작은술" }
  ],
  "instructions": "감자는 껍질을 벗기고 한입 크기로 썰어 준비합니다. 양파는 채 썹니다. 냄비에 감자와 양파를 넣고 간장, 물엿, 설탕을 넣어 조립니다. 감자가 익으면 참기름을 넣고 마무리합니다.",
  "nutrition": {
    "calories": 120,
    "protein": 2.5,
    "carbs": 28.0,
    "fat": 1.5,
    "sodium": 600,
    "fiber": 2.5
  },
  "imageUrl": "/api/picture/감자조림.jpg",
  "emoji": "🥔"
}
```

### 2. 감자채볶음
```json
{
  "title": "감자채볶음",
  "description": "아삭한 감자채볶음",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "감자", "amount": "2", "unit": "개" },
    { "name": "식용유", "amount": "2", "unit": "큰술" },
    { "name": "소금", "amount": "약간", "unit": "" },
    { "name": "후추", "amount": "약간", "unit": "" }
  ],
  "instructions": "감자는 채 썰어 찬물에 담가 전분을 제거합니다. 팬에 식용유를 두르고 감자채를 볶습니다. 소금과 후추로 간을 맞춥니다.",
  "nutrition": {
    "calories": 95,
    "protein": 2.0,
    "carbs": 20.0,
    "fat": 2.0,
    "sodium": 300,
    "fiber": 2.0
  },
  "imageUrl": "/api/picture/감자채볶음.jpg",
  "emoji": "🥔"
}
```

### 3. 감자탕
```json
{
  "title": "감자탕",
  "description": "뼈와 고기가 부드러운 감자탕",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "돼지뼈", "amount": "500", "unit": "g" },
    { "name": "감자", "amount": "2", "unit": "개" },
    { "name": "우거지", "amount": "100", "unit": "g" },
    { "name": "된장", "amount": "2", "unit": "큰술" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "큰술" },
    { "name": "대파", "amount": "1", "unit": "대" }
  ],
  "instructions": "돼지뼈를 깨끗이 씻어 끓는 물에 데쳐 핏물을 제거합니다. 냄비에 뼈를 넣고 물을 부어 푹 끓입니다. 감자와 우거지를 넣고 된장, 고춧가루, 다진 마늘로 간을 맞춥니다. 대파를 넣고 마무리합니다.",
  "nutrition": {
    "calories": 280,
    "protein": 18.0,
    "carbs": 25.0,
    "fat": 12.0,
    "sodium": 1200,
    "fiber": 3.0
  },
  "imageUrl": "/api/picture/감자탕.png",
  "emoji": "🍲"
}
```

### 4. 갓김치
```json
{
  "title": "갓김치",
  "description": "향긋한 갓김치",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "갓", "amount": "500", "unit": "g" },
    { "name": "소금", "amount": "3", "unit": "큰술" },
    { "name": "고춧가루", "amount": "2", "unit": "큰술" },
    { "name": "멸치젓갈", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "큰술" },
    { "name": "생강", "amount": "0.5", "unit": "작은술" }
  ],
  "instructions": "갓을 깨끗이 씻어 소금에 절입니다. 물기를 짜고 고춧가루, 멸치젓갈, 다진 마늘, 생강을 넣어 버무립니다.",
  "nutrition": {
    "calories": 35,
    "protein": 2.5,
    "carbs": 5.0,
    "fat": 1.0,
    "sodium": 1500,
    "fiber": 2.5
  },
  "imageUrl": "/api/picture/갓김치.jpg",
  "emoji": "🥬"
}
```

### 5. 계란찜
```json
{
  "title": "계란찜",
  "description": "부드러운 계란찜",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "계란", "amount": "4", "unit": "개" },
    { "name": "물", "amount": "100", "unit": "ml" },
    { "name": "소금", "amount": "약간", "unit": "" },
    { "name": "대파", "amount": "1/2", "unit": "대" }
  ],
  "instructions": "계란을 풀어 물과 소금을 넣고 섞습니다. 대파를 잘게 썰어 넣습니다. 팬에 기름을 두르고 계란물을 부어 젓가락으로 저으면서 익힙니다.",
  "nutrition": {
    "calories": 140,
    "protein": 12.0,
    "carbs": 2.0,
    "fat": 9.0,
    "sodium": 400,
    "fiber": 0.5
  },
  "imageUrl": "/api/picture/계란찜.jpg",
  "emoji": "🍳"
}
```

### 6. 고구마줄기볶음
```json
{
  "title": "고구마줄기볶음",
  "description": "아삭한 고구마줄기볶음",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "고구마줄기", "amount": "200", "unit": "g" },
    { "name": "식용유", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "고춧가루", "amount": "0.5", "unit": "큰술" }
  ],
  "instructions": "고구마줄기는 껍질을 벗기고 적당한 크기로 썹니다. 팬에 식용유를 두르고 다진 마늘을 볶다가 고구마줄기를 넣어 볶습니다. 국간장과 고춧가루로 간을 맞춥니다.",
  "nutrition": {
    "calories": 65,
    "protein": 2.0,
    "carbs": 10.0,
    "fat": 2.5,
    "sodium": 400,
    "fiber": 2.0
  },
  "imageUrl": "/api/picture/고구마줄기볶음.jpg",
  "emoji": "🌿"
}
```

### 7. 고춧잎장아찌
```json
{
  "title": "고춧잎장아찌",
  "description": "고소한 고춧잎장아찌",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "고춧잎", "amount": "200", "unit": "g" },
    { "name": "간장", "amount": "3", "unit": "큰술" },
    { "name": "물엿", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "참기름", "amount": "1", "unit": "작은술" }
  ],
  "instructions": "고춧잎을 깨끗이 씻어 물기를 제거합니다. 간장, 물엿, 다진 마늘, 참기름을 섞어 양념장을 만듭니다. 고춧잎을 양념장에 버무려 하루 이상 숙성시킵니다.",
  "nutrition": {
    "calories": 45,
    "protein": 2.0,
    "carbs": 6.0,
    "fat": 1.5,
    "sodium": 800,
    "fiber": 2.0
  },
  "imageUrl": "/api/picture/고춧잎장아찌.jpg",
  "emoji": "🌶️"
}
```

### 8. 김치
```json
{
  "title": "김치",
  "description": "한국 대표 발효식품 김치",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "배추", "amount": "1", "unit": "포기" },
    { "name": "소금", "amount": "1/2", "unit": "컵" },
    { "name": "고춧가루", "amount": "1", "unit": "컵" },
    { "name": "멸치젓갈", "amount": "3", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "2", "unit": "큰술" },
    { "name": "생강", "amount": "1", "unit": "작은술" },
    { "name": "무", "amount": "100", "unit": "g" },
    { "name": "대파", "amount": "2", "unit": "대" }
  ],
  "instructions": "배추를 소금에 절여 물기를 제거합니다. 고춧가루, 멸치젓갈, 다진 마늘, 생강을 섞어 양념을 만듭니다. 무와 대파를 채 썰어 양념에 버무립니다. 배추 잎 사이사이에 양념을 넣어 버무립니다.",
  "nutrition": {
    "calories": 25,
    "protein": 1.5,
    "carbs": 4.0,
    "fat": 0.5,
    "sodium": 800,
    "fiber": 2.0
  },
  "imageUrl": "/api/picture/김치.jpg",
  "emoji": "🥬"
}
```

### 9. 김치국
```json
{
  "title": "김치국",
  "description": "얼큰한 김치국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "김치", "amount": "150", "unit": "g" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "대파", "amount": "1/2", "unit": "대" }
  ],
  "instructions": "김치를 적당한 크기로 썹니다. 냄비에 멸치육수를 붓고 김치를 넣어 끓입니다. 다진 마늘을 넣고 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 35,
    "protein": 2.0,
    "carbs": 5.0,
    "fat": 1.0,
    "sodium": 900,
    "fiber": 1.5
  },
  "imageUrl": "/api/picture/김치국.png",
  "emoji": "🍲"
}
```

### 10. 깍두기
```json
{
  "title": "깍두기",
  "description": "아삭한 깍두기",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "무", "amount": "500", "unit": "g" },
    { "name": "소금", "amount": "2", "unit": "큰술" },
    { "name": "고춧가루", "amount": "2", "unit": "큰술" },
    { "name": "멸치젓갈", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "큰술" },
    { "name": "대파", "amount": "1", "unit": "대" }
  ],
  "instructions": "무를 깨끗이 씻어 깍둑썰기로 썹니다. 소금에 절여 물기를 제거합니다. 고춧가루, 멸치젓갈, 다진 마늘을 섞어 양념을 만듭니다. 대파를 썰어 넣고 무와 함께 버무립니다.",
  "nutrition": {
    "calories": 30,
    "protein": 1.5,
    "carbs": 5.0,
    "fat": 0.5,
    "sodium": 1000,
    "fiber": 2.0
  },
  "imageUrl": "/api/picture/깍두기.jpg",
  "emoji": "🥕"
}
```

### 11. 도토리묵
```json
{
  "title": "도토리묵",
  "description": "고소한 도토리묵",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "도토리묵", "amount": "200", "unit": "g" },
    { "name": "양파", "amount": "1/4", "unit": "개" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "식초", "amount": "1", "unit": "큰술" },
    { "name": "간장", "amount": "1", "unit": "큰술" },
    { "name": "참기름", "amount": "1", "unit": "작은술" }
  ],
  "instructions": "도토리묵을 적당한 크기로 썹니다. 양파는 채 썹니다. 고춧가루, 식초, 간장, 참기름을 섞어 양념장을 만듭니다. 도토리묵과 양파를 양념장에 버무립니다.",
  "nutrition": {
    "calories": 55,
    "protein": 1.5,
    "carbs": 10.0,
    "fat": 1.0,
    "sodium": 500,
    "fiber": 2.0
  },
  "imageUrl": "/api/picture/도토리묵.jpg",
  "emoji": "🌰"
}
```

### 12. 동치미
```json
{
  "title": "동치미",
  "description": "시원한 동치미",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "무", "amount": "500", "unit": "g" },
    { "name": "소금", "amount": "2", "unit": "큰술" },
    { "name": "설탕", "amount": "1", "unit": "큰술" },
    { "name": "식초", "amount": "1", "unit": "큰술" },
    { "name": "생강", "amount": "1", "unit": "쪽" }
  ],
  "instructions": "무를 깨끗이 씻어 적당한 크기로 썹니다. 소금에 절여 물기를 제거합니다. 설탕, 식초, 생강을 넣어 양념장을 만듭니다. 무를 양념장에 넣고 물을 부어 숙성시킵니다.",
  "nutrition": {
    "calories": 25,
    "protein": 1.0,
    "carbs": 5.0,
    "fat": 0.2,
    "sodium": 800,
    "fiber": 1.5
  },
  "imageUrl": "/api/picture/동치미.jpg",
  "emoji": "🥕"
}
```

### 13. 돼지고기찌개
```json
{
  "title": "돼지고기찌개",
  "description": "부드러운 돼지고기찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "돼지고기", "amount": "200", "unit": "g" },
    { "name": "김치", "amount": "150", "unit": "g" },
    { "name": "두부", "amount": "1/2", "unit": "모" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "큰술" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "돼지고기를 볶다가 김치를 넣고 함께 볶습니다. 멸치육수를 붓고 끓입니다. 두부를 넣고 고춧가루와 다진 마늘로 간을 맞춥니다.",
  "nutrition": {
    "calories": 320,
    "protein": 22.0,
    "carbs": 8.0,
    "fat": 22.0,
    "sodium": 1100,
    "fiber": 2.0
  },
  "imageUrl": "/api/picture/돼지고기찌개.png",
  "emoji": "🍲"
}
```

### 14. 만두국
```json
{
  "title": "만두국",
  "description": "고소한 만두국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "만두", "amount": "6", "unit": "개" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "대파", "amount": "1/2", "unit": "대" },
    { "name": "다진 마늘", "amount": "0.5", "unit": "작은술" },
    { "name": "국간장", "amount": "1", "unit": "큰술" }
  ],
  "instructions": "냄비에 멸치육수를 붓고 끓입니다. 만두를 넣어 끓입니다. 국간장과 다진 마늘로 간을 맞추고 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 280,
    "protein": 12.0,
    "carbs": 35.0,
    "fat": 10.0,
    "sodium": 900,
    "fiber": 2.0
  },
  "imageUrl": "/api/picture/만두국.png",
  "emoji": "🥟"
}
```

### 15. 멸치볶음
```json
{
  "title": "멸치볶음",
  "description": "고소한 멸치볶음",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "멸치", "amount": "100", "unit": "g" },
    { "name": "식용유", "amount": "2", "unit": "큰술" },
    { "name": "물엿", "amount": "2", "unit": "큰술" },
    { "name": "간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "2", "unit": "쪽" }
  ],
  "instructions": "멸치의 머리와 내장을 제거합니다. 팬에 식용유를 두르고 멸치를 볶습니다. 물엿과 간장을 넣고 마늘을 넣어 볶습니다.",
  "nutrition": {
    "calories": 180,
    "protein": 15.0,
    "carbs": 12.0,
    "fat": 8.0,
    "sodium": 800,
    "fiber": 0.5
  },
  "imageUrl": "/api/picture/멸치볶음.jpg",
  "emoji": "🐟"
}
```

### 16. 북어국
```json
{
  "title": "북어국",
  "description": "구수한 북어국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "북어", "amount": "1", "unit": "마리" },
    { "name": "무", "amount": "100", "unit": "g" },
    { "name": "콩나물", "amount": "100", "unit": "g" },
    { "name": "된장", "amount": "1", "unit": "큰술" },
    { "name": "고춧가루", "amount": "0.5", "unit": "큰술" },
    { "name": "대파", "amount": "1/2", "unit": "대" }
  ],
  "instructions": "북어를 불려 준비합니다. 무를 썰고 콩나물을 준비합니다. 냄비에 물을 붓고 북어를 넣어 끓입니다. 된장과 고춧가루로 간을 맞추고 무와 콩나물을 넣습니다. 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 150,
    "protein": 18.0,
    "carbs": 8.0,
    "fat": 5.0,
    "sodium": 1000,
    "fiber": 2.0
  },
  "imageUrl": "/api/picture/북어국.png",
  "emoji": "🐟"
}
```

### 17. 뼈해장국
```json
{
  "title": "뼈해장국",
  "description": "얼큰한 뼈해장국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "소뼈", "amount": "500", "unit": "g" },
    { "name": "우거지", "amount": "100", "unit": "g" },
    { "name": "고춧가루", "amount": "2", "unit": "큰술" },
    { "name": "된장", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "큰술" },
    { "name": "대파", "amount": "1", "unit": "대" }
  ],
  "instructions": "소뼈를 깨끗이 씻어 끓는 물에 데쳐 핏물을 제거합니다. 냄비에 뼈를 넣고 물을 부어 푹 끓입니다. 우거지를 넣고 된장, 고춧가루, 다진 마늘로 간을 맞춥니다. 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 250,
    "protein": 20.0,
    "carbs": 10.0,
    "fat": 14.0,
    "sodium": 1200,
    "fiber": 2.5
  },
  "imageUrl": "/api/picture/뼈해장국.png",
  "emoji": "🍲"
}
```

### 18. 소고기무국
```json
{
  "title": "소고기무국",
  "description": "구수한 소고기무국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "소고기", "amount": "150", "unit": "g" },
    { "name": "무", "amount": "200", "unit": "g" },
    { "name": "대파", "amount": "1", "unit": "대" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "소고기를 볶다가 무를 넣고 함께 볶습니다. 멸치육수를 붓고 끓입니다. 국간장과 다진 마늘로 간을 맞추고 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 180,
    "protein": 18.0,
    "carbs": 8.0,
    "fat": 8.0,
    "sodium": 900,
    "fiber": 2.0
  },
  "imageUrl": "/api/picture/소고기무국.png",
  "emoji": "🍲"
}
```

### 19. 소고기찌개
```json
{
  "title": "소고기찌개",
  "description": "부드러운 소고기찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "소고기", "amount": "200", "unit": "g" },
    { "name": "양파", "amount": "1/2", "unit": "개" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "된장", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "큰술" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "소고기를 볶다가 양파를 넣고 함께 볶습니다. 멸치육수를 붓고 끓입니다. 된장과 고춧가루, 다진 마늘로 간을 맞춥니다.",
  "nutrition": {
    "calories": 280,
    "protein": 25.0,
    "carbs": 10.0,
    "fat": 16.0,
    "sodium": 1000,
    "fiber": 2.0
  },
  "imageUrl": "/api/picture/소고기찌개.png",
  "emoji": "🍲"
}
```

### 20. 오이지
```json
{
  "title": "오이지",
  "description": "아삭한 오이지",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "오이", "amount": "3", "unit": "개" },
    { "name": "소금", "amount": "2", "unit": "큰술" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "멸치젓갈", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" }
  ],
  "instructions": "오이를 깨끗이 씻어 소금에 절입니다. 물기를 제거하고 고춧가루, 멸치젓갈, 다진 마늘을 넣어 버무립니다.",
  "nutrition": {
    "calories": 20,
    "protein": 1.0,
    "carbs": 4.0,
    "fat": 0.3,
    "sodium": 900,
    "fiber": 1.5
  },
  "imageUrl": "/api/picture/오이지.jpg",
  "emoji": "🥒"
}
```

### 21. 육개장
```json
{
  "title": "육개장",
  "description": "얼큰한 육개장",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "소고기", "amount": "150", "unit": "g" },
    { "name": "콩나물", "amount": "100", "unit": "g" },
    { "name": "고사리", "amount": "50", "unit": "g" },
    { "name": "고춧가루", "amount": "2", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "큰술" },
    { "name": "대파", "amount": "1", "unit": "대" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" }
  ],
  "instructions": "소고기를 볶다가 고춧가루를 넣고 볶습니다. 멸치육수를 붓고 끓입니다. 콩나물과 고사리를 넣고 다진 마늘로 간을 맞춥니다. 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 220,
    "protein": 20.0,
    "carbs": 12.0,
    "fat": 10.0,
    "sodium": 1100,
    "fiber": 3.0
  },
  "imageUrl": "/api/picture/육개장.png",
  "emoji": "🍲"
}
```

### 22. 진미채볶음
```json
{
  "title": "진미채볶음",
  "description": "고소한 진미채볶음",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "진미채", "amount": "100", "unit": "g" },
    { "name": "식용유", "amount": "2", "unit": "큰술" },
    { "name": "물엿", "amount": "2", "unit": "큰술" },
    { "name": "간장", "amount": "1", "unit": "큰술" },
    { "name": "마늘", "amount": "2", "unit": "쪽" }
  ],
  "instructions": "진미채를 불려 준비합니다. 팬에 식용유를 두르고 진미채를 볶습니다. 물엿과 간장을 넣고 마늘을 넣어 볶습니다.",
  "nutrition": {
    "calories": 160,
    "protein": 12.0,
    "carbs": 15.0,
    "fat": 6.0,
    "sodium": 700,
    "fiber": 0.5
  },
  "imageUrl": "/api/picture/진미채볶음.jpg",
  "emoji": "🦑"
}
```

### 23. 참나물
```json
{
  "title": "참나물",
  "description": "향긋한 참나물",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "참나물", "amount": "200", "unit": "g" },
    { "name": "참기름", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "깨소금", "amount": "0.5", "unit": "작은술" }
  ],
  "instructions": "참나물을 깨끗이 씻어 물기를 제거합니다. 참기름에 다진 마늘을 볶다가 참나물을 넣어 볶습니다. 국간장으로 간을 맞추고 깨소금을 넣어 마무리합니다.",
  "nutrition": {
    "calories": 50,
    "protein": 2.0,
    "carbs": 6.0,
    "fat": 2.5,
    "sodium": 400,
    "fiber": 2.5
  },
  "imageUrl": "/api/picture/참나물.jpg",
  "emoji": "🌿"
}
```

### 24. 총각김치
```json
{
  "title": "총각김치",
  "description": "아삭한 총각김치",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "총각무", "amount": "500", "unit": "g" },
    { "name": "소금", "amount": "2", "unit": "큰술" },
    { "name": "고춧가루", "amount": "2", "unit": "큰술" },
    { "name": "멸치젓갈", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "큰술" },
    { "name": "대파", "amount": "1", "unit": "대" }
  ],
  "instructions": "총각무를 깨끗이 씻어 소금에 절입니다. 물기를 제거하고 고춧가루, 멸치젓갈, 다진 마늘을 섞어 양념을 만듭니다. 대파를 썰어 넣고 총각무와 함께 버무립니다.",
  "nutrition": {
    "calories": 30,
    "protein": 1.5,
    "carbs": 5.0,
    "fat": 0.5,
    "sodium": 1000,
    "fiber": 2.0
  },
  "imageUrl": "/api/picture/총각김치.jpg",
  "emoji": "🥕"
}
```

### 25. 파김치
```json
{
  "title": "파김치",
  "description": "향긋한 파김치",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "대파", "amount": "500", "unit": "g" },
    { "name": "소금", "amount": "2", "unit": "큰술" },
    { "name": "고춧가루", "amount": "2", "unit": "큰술" },
    { "name": "멸치젓갈", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "큰술" },
    { "name": "생강", "amount": "0.5", "unit": "작은술" }
  ],
  "instructions": "대파를 깨끗이 씻어 소금에 절입니다. 물기를 제거하고 고춧가루, 멸치젓갈, 다진 마늘, 생강을 섞어 양념을 만듭니다. 대파에 양념을 넣어 버무립니다.",
  "nutrition": {
    "calories": 35,
    "protein": 2.0,
    "carbs": 6.0,
    "fat": 0.8,
    "sodium": 900,
    "fiber": 2.0
  },
  "imageUrl": "/api/picture/파김치.jpg",
  "emoji": "🌿"
}
```

### 26. 황태국
```json
{
  "title": "황태국",
  "description": "구수한 황태국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "황태", "amount": "100", "unit": "g" },
    { "name": "무", "amount": "100", "unit": "g" },
    { "name": "콩나물", "amount": "100", "unit": "g" },
    { "name": "된장", "amount": "1", "unit": "큰술" },
    { "name": "고춧가루", "amount": "0.5", "unit": "큰술" },
    { "name": "대파", "amount": "1/2", "unit": "대" }
  ],
  "instructions": "황태를 불려 준비합니다. 무를 썰고 콩나물을 준비합니다. 냄비에 물을 붓고 황태를 넣어 끓입니다. 된장과 고춧가루로 간을 맞추고 무와 콩나물을 넣습니다. 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 140,
    "protein": 16.0,
    "carbs": 8.0,
    "fat": 4.0,
    "sodium": 950,
    "fiber": 2.0
  },
  "imageUrl": "/api/picture/황태국.png",
  "emoji": "🐟"
}
```

---

## 추가 레시피 (docs/picture 이미지 기반)

### 1. 떡국
```json
{
  "title": "떡국",
  "description": "설날 대표 음식인 떡국",
  "source": "collected",
  "dishType": ["soup"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "가래떡", "amount": "200", "unit": "g" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "소고기", "amount": "50", "unit": "g" },
    { "name": "계란", "amount": "1", "unit": "개" },
    { "name": "대파", "amount": "1/2", "unit": "대" },
    { "name": "다진 마늘", "amount": "0.5", "unit": "작은술" },
    { "name": "국간장", "amount": "1", "unit": "큰술" }
  ],
  "instructions": "가래떡을 적당한 크기로 썰어 준비합니다. 멸치육수에 소고기를 넣고 끓입니다. 떡을 넣고 끓이다가 국간장과 다진 마늘로 간을 맞춥니다. 계란을 풀어 넣고 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 180,
    "protein": 8.0,
    "carbs": 28.0,
    "fat": 4.0,
    "sodium": 600,
    "fiber": 1.0
  },
  "imageUrl": "/api/picture/떡국.png",
  "emoji": "🍲"
}
```

### 2. 보쌈김치
```json
{
  "title": "보쌈김치",
  "description": "배추잎에 양념을 싸서 만든 보쌈김치",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "배추", "amount": "500", "unit": "g" },
    { "name": "소금", "amount": "2", "unit": "큰술" },
    { "name": "고춧가루", "amount": "2", "unit": "큰술" },
    { "name": "멸치젓갈", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "큰술" },
    { "name": "생강", "amount": "0.5", "unit": "작은술" },
    { "name": "무", "amount": "100", "unit": "g" },
    { "name": "대파", "amount": "2", "unit": "대" }
  ],
  "instructions": "배추를 소금에 절여 물기를 제거합니다. 고춧가루, 멸치젓갈, 다진 마늘, 생강을 섞어 양념을 만듭니다. 무와 대파를 채 썰어 양념에 버무립니다. 배추 잎에 양념을 넣어 싸서 버무립니다.",
  "nutrition": {
    "calories": 30,
    "protein": 2.0,
    "carbs": 5.0,
    "fat": 0.5,
    "sodium": 900,
    "fiber": 2.5
  },
  "imageUrl": "/api/picture/보쌈김치.jpg",
  "emoji": "🥬"
}
```

### 3. 열무김치
```json
{
  "title": "열무김치",
  "description": "아삭하고 시원한 열무김치",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "열무", "amount": "500", "unit": "g" },
    { "name": "소금", "amount": "2", "unit": "큰술" },
    { "name": "고춧가루", "amount": "2", "unit": "큰술" },
    { "name": "멸치젓갈", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "큰술" },
    { "name": "생강", "amount": "0.5", "unit": "작은술" },
    { "name": "설탕", "amount": "0.5", "unit": "큰술" }
  ],
  "instructions": "열무를 깨끗이 씻어 소금에 절입니다. 물기를 제거하고 고춧가루, 멸치젓갈, 다진 마늘, 생강, 설탕을 섞어 양념을 만듭니다. 열무에 양념을 넣어 버무립니다.",
  "nutrition": {
    "calories": 25,
    "protein": 1.5,
    "carbs": 4.0,
    "fat": 0.3,
    "sodium": 850,
    "fiber": 2.0
  },
  "imageUrl": "/api/picture/열무김치.jpg",
  "emoji": "🥬"
}
```

### 4. 어묵볶음
```json
{
  "title": "어묵볶음",
  "description": "쫄깃한 어묵을 달콤짭짤한 양념에 볶은 반찬",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "어묵", "amount": "200", "unit": "g" },
    { "name": "양파", "amount": "1/2", "unit": "개" },
    { "name": "당근", "amount": "1/3", "unit": "개" },
    { "name": "대파", "amount": "1", "unit": "대" },
    { "name": "간장", "amount": "2", "unit": "큰술" },
    { "name": "설탕", "amount": "1", "unit": "큰술" },
    { "name": "물엿", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "참기름", "amount": "1", "unit": "작은술" },
    { "name": "통깨", "amount": "약간", "unit": "" }
  ],
  "instructions": "어묵은 먹기 좋은 크기로 썰고, 양파와 당근은 채 썰고, 대파는 어슷하게 썹니다. 팬에 기름을 두르고 다진 마늘을 볶아 향을 낸 후, 양파와 당근을 넣어 볶습니다. 어묵을 넣고 함께 볶다가 간장, 설탕, 물엿을 넣어 간을 맞춥니다. 대파를 넣고 한 번 더 볶은 후, 참기름과 통깨를 뿌려 마무리합니다.",
  "nutrition": {
    "calories": 120,
    "protein": 8.0,
    "carbs": 15.0,
    "fat": 3.0,
    "sodium": 700,
    "fiber": 1.0
  },
  "imageUrl": "/api/picture/어묵볶음.jpg",
  "emoji": "🐟"
}
```

### 5. 호박볶음
```json
{
  "title": "호박볶음",
  "description": "부드럽고 달콤한 호박볶음",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "애호박", "amount": "1", "unit": "개" },
    { "name": "양파", "amount": "1/2", "unit": "개" },
    { "name": "식용유", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "소금", "amount": "약간", "unit": "" },
    { "name": "후추", "amount": "약간", "unit": "" }
  ],
  "instructions": "애호박과 양파를 적당한 크기로 썹니다. 팬에 식용유를 두르고 다진 마늘을 볶아 향을 낸 후, 애호박과 양파를 넣어 볶습니다. 소금과 후추로 간을 맞춥니다.",
  "nutrition": {
    "calories": 60,
    "protein": 2.0,
    "carbs": 8.0,
    "fat": 2.5,
    "sodium": 150,
    "fiber": 2.0
  },
  "imageUrl": "/api/picture/호박볶음.jpg",
  "emoji": "🎃"
}
```

### 6. 쑥갓나물
```json
{
  "title": "쑥갓나물",
  "description": "향긋한 쑥갓나물",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "쑥갓", "amount": "200", "unit": "g" },
    { "name": "참기름", "amount": "1", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "국간장", "amount": "1", "unit": "큰술" },
    { "name": "깨소금", "amount": "0.5", "unit": "작은술" }
  ],
  "instructions": "쑥갓을 깨끗이 씻어 물기를 제거합니다. 참기름에 다진 마늘을 볶다가 쑥갓을 넣어 볶습니다. 국간장으로 간을 맞추고 깨소금을 넣어 마무리합니다.",
  "nutrition": {
    "calories": 45,
    "protein": 2.5,
    "carbs": 4.0,
    "fat": 2.5,
    "sodium": 350,
    "fiber": 2.5
  },
  "imageUrl": "/api/picture/쑥갓나물.jpg",
  "emoji": "🌿"
}
```

### 7. 콩비지찌개
```json
{
  "title": "콩비지찌개",
  "description": "구수한 콩비지찌개",
  "source": "collected",
  "dishType": ["stew"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "콩비지", "amount": "150", "unit": "g" },
    { "name": "된장", "amount": "2", "unit": "큰술" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "애호박", "amount": "1/2", "unit": "개" },
    { "name": "양파", "amount": "1/2", "unit": "개" },
    { "name": "멸치육수", "amount": "500", "unit": "ml" },
    { "name": "다진 마늘", "amount": "1", "unit": "큰술" },
    { "name": "대파", "amount": "1/2", "unit": "대" }
  ],
  "instructions": "멸치육수에 된장을 풀고 콩비지를 넣어 끓입니다. 애호박과 양파를 넣고 끓이다가 고춧가루와 다진 마늘로 간을 맞춥니다. 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 110,
    "protein": 7.0,
    "carbs": 12.0,
    "fat": 4.0,
    "sodium": 850,
    "fiber": 4.0
  },
  "imageUrl": "/api/picture/콩비지찌개.png",
  "emoji": "🍲"
}
```

### 8. 현미밥
```json
{
  "title": "현미밥",
  "description": "영양 가득한 현미밥",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "현미", "amount": "1", "unit": "컵" },
    { "name": "물", "amount": "1.5", "unit": "컵" }
  ],
  "instructions": "현미를 깨끗이 씻어 물에 30분 이상 불립니다. 물을 넣고 밥솥에 넣어 밥을 짓습니다.",
  "nutrition": {
    "calories": 220,
    "protein": 5.0,
    "carbs": 45.0,
    "fat": 2.0,
    "sodium": 5,
    "fiber": 3.5
  },
  "imageUrl": "/api/picture/현미밥.jpg",
  "emoji": "🍚"
}
```

### 9. 잡곡밥
```json
{
  "title": "잡곡밥",
  "description": "다양한 잡곡이 들어간 영양 밥",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "쌀", "amount": "1", "unit": "컵" },
    { "name": "보리", "amount": "0.3", "unit": "컵" },
    { "name": "현미", "amount": "0.2", "unit": "컵" },
    { "name": "수수", "amount": "0.2", "unit": "컵" },
    { "name": "물", "amount": "2", "unit": "컵" }
  ],
  "instructions": "잡곡을 깨끗이 씻어 물에 30분 이상 불립니다. 물을 넣고 밥솥에 넣어 밥을 짓습니다.",
  "nutrition": {
    "calories": 240,
    "protein": 6.0,
    "carbs": 48.0,
    "fat": 2.5,
    "sodium": 5,
    "fiber": 4.0
  },
  "imageUrl": "/api/picture/잡곡밥.jpg",
  "emoji": "🍚"
}
```

### 10. 흰쌀밥
```json
{
  "title": "흰쌀밥",
  "description": "기본 흰쌀밥",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "쌀", "amount": "1", "unit": "컵" },
    { "name": "물", "amount": "1.2", "unit": "컵" }
  ],
  "instructions": "쌀을 깨끗이 씻어 물에 30분 이상 불립니다. 물을 넣고 밥솥에 넣어 밥을 짓습니다.",
  "nutrition": {
    "calories": 200,
    "protein": 4.0,
    "carbs": 44.0,
    "fat": 0.5,
    "sodium": 2,
    "fiber": 0.5
  },
  "imageUrl": "/api/picture/흰쌀밥.jpg",
  "emoji": "🍚"
}
```

### 11. 대추
```json
{
  "title": "대추",
  "description": "달콤한 대추",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "대추", "amount": "100", "unit": "g" }
  ],
  "instructions": "대추를 깨끗이 씻어 물기를 제거합니다. 그대로 먹거나 찜기에 쪄서 먹습니다.",
  "nutrition": {
    "calories": 80,
    "protein": 1.0,
    "carbs": 20.0,
    "fat": 0.2,
    "sodium": 1,
    "fiber": 3.0
  },
  "imageUrl": "/api/picture/대추.jpg",
  "emoji": "🌰"
}
```

### 12. 옥수수
```json
{
  "title": "옥수수",
  "description": "달콤한 옥수수",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [
    { "name": "옥수수", "amount": "1", "unit": "개" },
    { "name": "소금", "amount": "약간", "unit": "" }
  ],
  "instructions": "옥수수를 깨끗이 씻어 찜기에 넣고 쪄 익힙니다. 소금을 뿌려 먹습니다.",
  "nutrition": {
    "calories": 90,
    "protein": 3.0,
    "carbs": 20.0,
    "fat": 1.0,
    "sodium": 5,
    "fiber": 2.5
  },
  "imageUrl": "/api/picture/옥수수.jpg",
  "emoji": "🌽"
}
```

### 13. 오징어
```json
{
  "title": "오징어",
  "description": "쫄깃한 오징어",
  "source": "collected",
  "dishType": ["side"],
  "mealType": ["lunch", "dinner"],
  "ingredients": [
    { "name": "오징어", "amount": "200", "unit": "g" },
    { "name": "식용유", "amount": "1", "unit": "큰술" },
    { "name": "고춧가루", "amount": "1", "unit": "큰술" },
    { "name": "간장", "amount": "1", "unit": "큰술" },
    { "name": "설탕", "amount": "0.5", "unit": "큰술" },
    { "name": "다진 마늘", "amount": "1", "unit": "작은술" },
    { "name": "대파", "amount": "1/2", "unit": "대" }
  ],
  "instructions": "오징어를 깨끗이 씻어 적당한 크기로 썹니다. 팬에 식용유를 두르고 다진 마늘을 볶아 향을 낸 후, 오징어를 넣어 볶습니다. 고춧가루, 간장, 설탕을 넣어 간을 맞추고 대파를 넣어 마무리합니다.",
  "nutrition": {
    "calories": 140,
    "protein": 18.0,
    "carbs": 8.0,
    "fat": 4.0,
    "sodium": 600,
    "fiber": 0
  },
  "imageUrl": "/api/picture/오징어.jpg",
  "emoji": "🦑"
}
```

---

## 이미지 URL 수집 가이드

### 이미지 수집 방법

1. **무료 이미지 사이트 활용**:
   - Unsplash (https://unsplash.com)
   - Pexels (https://www.pexels.com)
   - Pixabay (https://pixabay.com)
   - 한국 요리 관련 이미지 검색

2. **이미지 URL 형식**:
   - 직접 URL 사용: `https://example.com/image.jpg`
   - CDN URL 사용 권장 (안정성 향상)

3. **저작권 주의사항**:
   - 저작권이 없는 이미지만 사용
   - 출처를 명시할 수 있는 이미지 우선 사용
   - 상업적 이용 가능한 이미지 확인

### 반찬류 이미지
각 레시피의 JSON 블록 내 `imageUrl` 필드에 URL을 추가하세요.

예시:
```json
{
  "title": "도라지나물",
  ...
  "imageUrl": "https://example.com/doraji-namul.jpg",
  ...
}
```

### 국류 이미지
각 레시피의 JSON 블록 내 `imageUrl` 필드에 URL을 추가하세요.

### 찌개류 이미지
각 레시피의 JSON 블록 내 `imageUrl` 필드에 URL을 추가하세요.

---

## 참고사항

1. **영양정보 계산**: 각 재료의 영양정보를 합산하여 계산했습니다. 실제 값은 조리 방법과 재료 양에 따라 달라질 수 있습니다.

2. **이미지 URL**: 인터넷에서 수집한 이미지 URL을 위 섹션에 추가해주세요. 저작권이 있는 이미지는 사용하지 마세요.

3. **추가 레시피**: 더 많은 레시피를 추가할 때는 위 형식을 따라 작성해주세요.

4. **출처**: 각 레시피의 출처를 명시해주시면 좋습니다.

---

## 데이터 통합 방법

이 파일의 레시피 데이터는 `lib/recipes/static-recipes-loader.ts`를 통해 로드되며, `lib/diet/queries.ts`의 `getRecipesWithNutrition()` 함수에서 자동으로 통합됩니다.

