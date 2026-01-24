#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
과일 레시피 추가 스크립트
- 사진이 있는 과일 레시피 생성
- modern-recipes.json에 추가
"""

import os
import json
import time
import random
import string

# 과일 정보 (이름, 100g당 영양 정보)
FRUITS = {
    "사과": {"calories": 52, "protein": 0.3, "carbs": 14.0, "fat": 0.2, "sodium": 1, "fiber": 2.4},
    "배": {"calories": 58, "protein": 0.4, "carbs": 15.0, "fat": 0.1, "sodium": 1, "fiber": 3.1},
    "바나나": {"calories": 89, "protein": 1.1, "carbs": 23.0, "fat": 0.3, "sodium": 1, "fiber": 2.6},
    "딸기": {"calories": 32, "protein": 0.7, "carbs": 7.7, "fat": 0.3, "sodium": 1, "fiber": 2.0},
    "포도": {"calories": 69, "protein": 0.7, "carbs": 18.0, "fat": 0.2, "sodium": 2, "fiber": 0.9},
    "수박": {"calories": 30, "protein": 0.6, "carbs": 7.6, "fat": 0.2, "sodium": 1, "fiber": 0.4},
    "복숭아": {"calories": 39, "protein": 0.9, "carbs": 9.5, "fat": 0.3, "sodium": 0, "fiber": 1.5},
    "체리": {"calories": 63, "protein": 1.1, "carbs": 16.0, "fat": 0.2, "sodium": 0, "fiber": 2.1},
    "키위": {"calories": 61, "protein": 1.1, "carbs": 14.7, "fat": 0.5, "sodium": 3, "fiber": 3.0},
    "멜론": {"calories": 34, "protein": 0.8, "carbs": 8.2, "fat": 0.2, "sodium": 16, "fiber": 0.9},
    "오렌지": {"calories": 47, "protein": 0.9, "carbs": 11.8, "fat": 0.1, "sodium": 0, "fiber": 2.4},
    "귤": {"calories": 53, "protein": 0.8, "carbs": 13.3, "fat": 0.3, "sodium": 2, "fiber": 1.8},
    "자두": {"calories": 46, "protein": 0.7, "carbs": 11.4, "fat": 0.3, "sodium": 0, "fiber": 1.4},
    "살구": {"calories": 48, "protein": 1.4, "carbs": 11.1, "fat": 0.4, "sodium": 1, "fiber": 2.0},
    "망고": {"calories": 60, "protein": 0.8, "carbs": 15.0, "fat": 0.4, "sodium": 1, "fiber": 1.6},
    "레몬": {"calories": 29, "protein": 1.1, "carbs": 9.3, "fat": 0.3, "sodium": 2, "fiber": 2.8},
    "자몽": {"calories": 42, "protein": 0.8, "carbs": 10.7, "fat": 0.1, "sodium": 0, "fiber": 1.6},
    "유자": {"calories": 53, "protein": 0.8, "carbs": 13.3, "fat": 0.1, "sodium": 1, "fiber": 1.8},
    "홍시": {"calories": 70, "protein": 0.6, "carbs": 18.6, "fat": 0.2, "sodium": 1, "fiber": 3.6},
    "감": {"calories": 127, "protein": 0.8, "carbs": 33.5, "fat": 0.4, "sodium": 1, "fiber": 3.6},
    "무화과": {"calories": 74, "protein": 0.8, "carbs": 19.2, "fat": 0.3, "sodium": 1, "fiber": 2.9},
    "파인애플": {"calories": 50, "protein": 0.5, "carbs": 13.1, "fat": 0.1, "sodium": 1, "fiber": 1.4},
    "블루베리": {"calories": 57, "protein": 0.7, "carbs": 14.5, "fat": 0.3, "sodium": 1, "fiber": 2.4},
    "블랙베리": {"calories": 43, "protein": 1.4, "carbs": 9.6, "fat": 0.5, "sodium": 1, "fiber": 5.3},
    "라즈베리": {"calories": 52, "protein": 1.2, "carbs": 11.9, "fat": 0.7, "sodium": 1, "fiber": 6.5},
    "크린베리": {"calories": 46, "protein": 0.4, "carbs": 12.2, "fat": 0.1, "sodium": 2, "fiber": 4.6}
}

def generate_recipe_id():
    """레시피 ID 생성"""
    timestamp = int(time.time() * 1000)
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=13))
    return f"modern-{timestamp}-{random_str}"

def create_fruit_recipe(name, nutrition):
    """과일 레시피 생성"""
    return {
        "id": generate_recipe_id(),
        "title": name,
        "description": f"신선한 {name} 1회분",
        "source": "modern",
        "dishType": ["snack"],
        "mealType": ["snack"],
        "ingredients": [
            {"name": name, "amount": "100", "unit": "g"}
        ],
        "instructions": f"{name}을 깨끗이 씻어 먹기 좋은 크기로 준비합니다.",
        "nutrition": nutrition,
        "image": f"/api/picture/{name}.jpg",
        "imageUrl": f"/api/picture/{name}.jpg",
        "emoji": "🍎" if "apple" in name.lower() else "🍌" if "banana" in name.lower() else "🍊"
    }

def main():
    # 경로 설정
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    json_path = os.path.join(project_root, "lib", "recipes", "static-data", "modern-recipes.json")
    
    # 기존 레시피 로드
    with open(json_path, 'r', encoding='utf-8') as f:
        recipes = json.load(f)
    
    print(f"Current recipes: {len(recipes)}")
    
    # 과일 레시피 추가
    fruit_count = 0
    for name, nutrition in FRUITS.items():
        # 이미 존재하는지 확인
        exists = any(r.get('title') == name for r in recipes)
        if not exists:
            recipe = create_fruit_recipe(name, nutrition)
            recipes.append(recipe)
            fruit_count += 1
            print(f"Added: {name}")
        else:
            print(f"Skipped (exists): {name}")
    
    # 저장
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(recipes, f, ensure_ascii=False, indent=2)
    
    print(f"\nAdded {fruit_count} fruit recipes")
    print(f"Total recipes: {len(recipes)}")

if __name__ == "__main__":
    main()


















