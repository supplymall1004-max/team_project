#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
현대 레시피 업데이트 스크립트
- modern recipe.md에서 레시피 추출
- 사진이 있는 레시피만 선택
- modern-recipes.json 업데이트
"""

import os
import json
import re
import sys

# 사진 파일 목록 (확장자 포함)
AVAILABLE_IMAGES = {
    "흰쌀밥.jpg", "황태국.png", "홍시.jpg", "호박볶음.jpg", "현미밥.jpg", 
    "포도.jpg", "파인애플.jpg", "파김치.jpg", "토란국.png", "키위.jpg", 
    "크린베리.jpg", "콩비지찌개.png", "콩나물무침.jpg", "콩나물국.png", 
    "취나물.jpg", "총각김치.jpg", "체리.jpg", "청국장찌개.png", "참나물.jpg", 
    "진미채볶음.jpg", "잡곡밥.jpg", "자몽.jpg", "자두.jpg", "육개장.png", 
    "유자.jpg", "옥수수.jpg", "오징어.jpg", "오이지.jpg", "오이소박이.jpg", 
    "오이무침.jpg", "오렌지.jpg", "열무김치.jpg", "어묵볶음.jpg", "애호박볶음.jpg", 
    "아이스크림.jpg", "쑥갓나물.jpg", "시래기국.png", "시금치나물.png", 
    "시금치나물.jpg", "순두부찌개.png", "순두부찌개.jpg", "수박.jpg", 
    "소고기찌개.png", "소고기무국.png", "살구.jpg", "사과.jpg", "뼈해장국.png", 
    "블루베리.jpg", "블랙베리.jpg", "북어국.png", "부대찌개.png", "복숭아.jpg", 
    "보쌈김치.jpg", "버섯국.png", "배.jpg", "바나나.jpg", "미역줄기볶음.jpg", 
    "미역국.png", "무화과.jpg", "무생채.jpg", "무국.png", "멸치볶음.jpg", 
    "멜론.jpg", "망고.jpg", "만두국.png", "레몬.jpg", "라즈베리.jpg", 
    "떡국.png", "딸기.jpg", "두부조림.jpg", "된장찌개.png", "된장국.png", 
    "돼지고기찌개.png", "동치미.jpg", "도토리묵.jpg", "도라지나물.jpg", 
    "대추.jpg", "달걀국.png", "깍두기.jpg", "김치찌개.png", "김치찌개.jpg", 
    "김치국.png", "김치.jpg", "귤.jpg", "고춧잎장아찌.jpg", "고사리나물.jpg", 
    "고사리국.png", "고구마줄기볶음.jpg", "계란찜.jpg", "갓김치.jpg", 
    "감자탕.png", "감자채볶음.jpg", "감자조림.jpg", "감자국.png", "감.jpg", 
    "가지나물.jpg"
}

# 사진 이름 → 확장자 매핑
IMAGE_MAP = {}
for img in AVAILABLE_IMAGES:
    name = os.path.splitext(img)[0]
    ext = os.path.splitext(img)[1]
    if name not in IMAGE_MAP:
        IMAGE_MAP[name] = ext
    elif ext == ".jpg" and IMAGE_MAP[name] == ".png":
        # jpg를 우선으로
        IMAGE_MAP[name] = ext

def parse_modern_recipes_md(file_path):
    """modern recipe.md 파일 파싱"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # JSON 블록 추출
    json_pattern = r'```json\s*(\{[\s\S]*?\})\s*```'
    matches = re.findall(json_pattern, content)
    
    recipes = []
    for match in matches:
        try:
            recipe = json.loads(match)
            # 유효한 레시피인지 확인 (title과 nutrition이 있어야 함)
            if 'title' in recipe and 'nutrition' in recipe:
                recipes.append(recipe)
        except json.JSONDecodeError as e:
            print(f"JSON 파싱 오류: {e}")
            continue
    
    return recipes

def filter_recipes_with_images(recipes):
    """사진이 있는 레시피만 필터링"""
    filtered = []
    no_image_count = 0
    
    for recipe in recipes:
        title = recipe.get('title', '')
        
        # 이미지가 있는지 확인
        if title in IMAGE_MAP:
            # 이미지 URL 설정
            ext = IMAGE_MAP[title]
            recipe['image'] = f"/api/picture/{title}{ext}"
            recipe['imageUrl'] = f"/api/picture/{title}{ext}"  # 호환성
            filtered.append(recipe)
            print(f"✅ {title} - 이미지: {title}{ext}")
        else:
            no_image_count += 1
            print(f"❌ {title} - 이미지 없음")
    
    print(f"\n총 {len(recipes)}개 레시피 중 {len(filtered)}개에 이미지 있음 ({no_image_count}개 제외)")
    return filtered

def generate_recipe_id(title, index):
    """레시피 ID 생성"""
    import time
    import random
    import string
    
    timestamp = int(time.time() * 1000)
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=13))
    return f"modern-{timestamp}-{random_str}"

def update_modern_recipes_json(recipes, output_path):
    """modern-recipes.json 업데이트"""
    # 기존 ID 유지를 위해 기존 파일 로드
    existing_recipes = {}
    if os.path.exists(output_path):
        try:
            with open(output_path, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
                for recipe in existing_data:
                    title = recipe.get('title')
                    if title:
                        existing_recipes[title] = recipe.get('id')
        except:
            pass
    
    # ID 할당
    updated_recipes = []
    for idx, recipe in enumerate(recipes):
        title = recipe.get('title')
        
        # 기존 ID가 있으면 유지, 없으면 생성
        if title in existing_recipes:
            recipe['id'] = existing_recipes[title]
        else:
            recipe['id'] = generate_recipe_id(title, idx)
        
        # source 필드 확인
        if 'source' not in recipe:
            recipe['source'] = 'modern'
        
        updated_recipes.append(recipe)
    
    # 파일 저장
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(updated_recipes, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ {len(updated_recipes)}개 레시피를 {output_path}에 저장했습니다")

def main():
    # 경로 설정
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    md_path = os.path.join(project_root, "docs", "recipes", "modern recipe", "modern recipe.md")
    json_path = os.path.join(project_root, "lib", "recipes", "static-data", "modern-recipes.json")
    
    if not os.path.exists(md_path):
        print(f"❌ 파일을 찾을 수 없습니다: {md_path}")
        sys.exit(1)
    
    print("📖 modern recipe.md 파일 파싱 중...")
    recipes = parse_modern_recipes_md(md_path)
    print(f"✅ 총 {len(recipes)}개 레시피 추출")
    
    print("\n🖼️ 이미지가 있는 레시피 필터링 중...")
    filtered_recipes = filter_recipes_with_images(recipes)
    
    print("\n💾 modern-recipes.json 업데이트 중...")
    update_modern_recipes_json(filtered_recipes, json_path)
    
    print("\n✅ 완료!")

if __name__ == "__main__":
    main()


