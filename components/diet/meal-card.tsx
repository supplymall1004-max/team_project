/**
 * @file components/diet/meal-card.tsx
 * @description 간식 카드 컴포넌트 (주로 과일) - docs/foodjpg.md에서 직접 이미지 표시
 */

"use client";

import Image from "next/image";
import type { RecipeDetailForDiet } from "@/types/recipe";

// docs/foodjpg.md에서 직접 가져온 음식별 이미지 URL 매핑
const FOOD_IMAGE_URLS: Record<string, string> = {
  '흰쌀밥': 'https://lh3.googleusercontent.com/gg-dl/ABS2GSkhxj1q2sjOnDEEUYBPYCOn-iks5Zhla0onrA-kJpNmtXmV2xoZevDz-1QNi-Wt8KXk9gL5fKN8IH48cCyrAVyw_0mAYYmZpUwIA_LSJ_eXAmqJ3b-Kca9K2M409YmUoo4e7OOSk-tm1GZKAKBUdqs8_Fl8mC4bx7X5tkxU_PnlJwNSKQ=s1024-rj',
  '현미밥': 'https://lh3.googleusercontent.com/gg-dl/ABS2GSnBP7LCCvasu39iucuz4sKd6hJUOhVQSUqnjZC0MCvP580adG5zkX_m46TA3dPigzwFGsezXO4XYGMPPODvE-_LuU4k0Wv8VvLnDRdlzN4wYEDX9dCkmYrfc7rlMieH1x_TGTcji5A3EY5MOiWoxm9gxFtzFGRor9ZUd8lTe3jqcuQlPg=s1024-rj',
  '잡곡밥': 'https://lh3.googleusercontent.com/gg-dl/ABS2GSkByKCaA-7_x7Sbtg9H_mBPNRBrzI110QcC2C6YeZdpcoVqmFQkyv0p9Ary_Ss-VsV0OmIw3or7h9yvERqbVe1a56iycBgqWQ3Ve4AQIlf3tEKAkKEr1_KC-Gh5iz-Y2hVGV-pk-en7JYnnG1pRY-KcHo8_6dk_9tRvy_yoVRT0ZEhSww=s1024-rj',
  '시금치나물': 'https://lh3.googleusercontent.com/gg/AIJ2gl8YZyfEDPK5ratSEMdSXMKLMOoJlooYbhsVPa6DUXyIeQNznLy9UJXYG9EzQGiby5zQki5Ac5k0BgbmmMoyTWvuLFG4d7NL4bird1V7h8rQkziTBu-aLh0EEtUZUm8NIj47IvZqafeLTtm3p4RobbahxxwyeZtzo8NyD5ZizuuSAXwPvwHswWgMMLHV1scyLeZJTuzIoOfrOJnc0Jf8gzW576vqjrdAtmFbcKi8_7cTzVJ2bf1ThxiWXKL5qR1CWGslwLYS5uuF1HOsbqMe5w0_u_ItbJ-KXw-bpGoWEg5HO2caaWaDIjqCyzc7OGz3fbnVxFPUNfPn-ukk8YVXmCE=s1024-rj',
  '콩나물무침': 'https://lh3.googleusercontent.com/gg-dl/ABS2GSnf5iN8Q7cNR0x6oqZBnAXcp5ZFJ7Iv7tewcmyno4Ragn4pA0ViCTBZUG8pFvc0JrI4XO4c-HWbUtWy1sQB6zWKwtay5XlNno7b3LQHsCoGr17luLP5_zZzL2ElcKHuHO9R0Yjnn2xcaIJh_nMTndV-FA0mVF3Cw66jAuTYHyonF_Pk=s1024-rj',
  '고구마줄기볶음': 'https://lh3.googleusercontent.com/gg-dl/ABS2GSm1afHhl8faeadAEMuL2uUCDSn7r1Q-ZYwdtaAxX_ZY7aHGaazH8mj9ZyhiPaD7IawH-1azWoMHdmeFLlJCQfnb63wU6AmO0zw8NHlXqGQUXAGJST-9Xi-RMe6_I-414QG1bS95_hKKHvjiyu-dZlZmV59eOdqvE6QInb3D1wIfbpYe=s1024-rj',
  '두부조림': 'https://lh3.googleusercontent.com/gg-dl/ABS2GSmZoP_vKhdhXn3LpZ8Y4NGpP0is4OCN0qBRYbHwXMx1JOTSnBm1hiPTGxIv5a5bP7zjiqH8sgxc8bXuYCvZoXBaawxNu6-5e_1kTRB3qBRJrtIIruqS31UkjYiD6-ri1bs98o5swaagykQmaX6WpTCEDUbZkk1ZWFvRAP7KVDh0Mfss=s1024-rj',
  '계란찜': 'https://lh3.googleusercontent.com/gg-dl/ABS2GSn1RXckJyK3MDFmgOu8v7FCO_foSi-vdr1o4RtoLJGaDEMDB8DqFwqZtvvCt_6QS-ApE2Z_YuUwD8a6GIzB7fqGhE1YvPmCLo_4aDp5OyMtb7Fds6UAGoB0ccYB3rCoFIFEpRuXIl9sWl71qGxHwLM86uO7XT1S4RPJIHalzGRCrKwjcQ=s1024-rj',
  '순두부찌개': 'https://lh3.googleusercontent.com/gg-dl/ABS2GSnTAeZkr0s2WKijiI9Hdy9v2xucnOIkw3Jwq_nnMJ-9BBUebyCWcpil6C7DZiR5AjuOWE2QiUphl8prHL3VvjhOKU5uUfDyFKHa_-s25tEvs-N3AqN8rdA23UggblNAWDkBmLWZY7JJ46ugsr3R121NQabbKpowvy8VNDsKvjvsnZ2O_A=s1024-rj',
  '감자조림': 'https://lh3.googleusercontent.com/gg-dl/ABS2GSlFrzaQ8poj-7SJ96Ll9mjxyc7Bm26DiP7jiS4_BwfPjFdvYyOjzNT2Fkhz4Ej5Us2V1hCFso1valaY3IAgaFoX7ORwUdtnPi0TNzu3GWS7wpTA5Be4M0sihJ1suIcTBJSo24cBul_NowBW3Du0jayua2iDOnPeo6dNTNgu8aQv6-kq=s1024-rj',
  '김치찌개': 'https://lh3.googleusercontent.com/gg-dl/ABS2GSkWFwQMihM8CWuH4W5viFXhqRMcQSHVU8ZophQbpBoxRGuTJXZuFZnF6Z-crsXpHE-wsPi0wwuhXLALUZ564HLNirwlYx6YNqlDo0z-R8l-ybCArtB0vGAZhzXQfh6_zDob6haLarPzIWD1mbJ5rpjXny8xEJDzcnVC_rff9DjmWChAzw=s1024-rj',
  '배': 'https://lh3.googleusercontent.com/gg-dl/ABS2GSlYmNg0A0TUytBTY7kzqgZQeUa75POPrvAof0wcfnsYGVb_oPrn7WNHPSCFJ1JdFLE4912ieFmr5FIbsiSylL8YfTolfmsww10I05Y3oYhvtBlo36PUDMZLMpV_m8g_dF1xSynhx-P6zHqx2PqzfxiT6Bxof98EEjFG3EpZagq54JlV=s1024-rj',
  '사과': 'https://lh3.googleusercontent.com/gg-dl/ABS2GSnZ1Kop7ysS-6dUTlw_caXLGv7ouEc8T9TnGsYqS1wVTQgE3W8XhjP7KiKsrGzt3vNrsLW720hZv-AtddgqIN_Zf0lY0XUPWIvn2S92DAN3I4Twm-Dm3bF_ylQEthNpPyoISzeI-pe665g6vPfn9_bQyAb_CY1DvgKyv0f1QaT8bqNLQA=s1024-rj',
  '바나나': 'https://lh3.googleusercontent.com/gg-dl/ABS2GSkGbXdKkHucshWf3ZxxaW8bulLRzLL6xJ6YmjPGa8_FutIG8TS3x3INzSybdbrDRl7qcrXlSjWGdaQ7jj0o2s1d7SJbveyEHkrByuTpGhdR4EzJepbmCtWySVfDeID6qUTvKkVRIorvDdavWxV4jrRB6JVyAKPRRW0-01pRnJDRXP-IzA=s1024-rj',
  '복숭아': 'https://lh3.googleusercontent.com/gg-dl/ABS2GSmNINDq4vuxbXMSPQ_XsCJxHN3EZmUyv7Bq3tPbanMc9yDfMbm4CzL11dyPuWsIU1bHIf7Vevb4rS5jRZwknRXh3VAts4G1dJEfbSpiav2GUyJ4ykJs8sCFCoWKpzjlQhTWpJEp9b9pJW5w8cIX6Cx_JCWAB8Gqj9Z9-OksOIqe2kim9w=s1024-rj',
  '수박': 'https://lh3.googleusercontent.com/gg/AIJ2gl9eCDT5UWZbCWE8X2nEPoXimKdCEegC2TCahjkCqk25p9P-haUWCrqvZbwzgJuBuHE4etr9DS1EqzIh5XWH_Fc6QZmRgldnFdnDhE2cPyk6E_dKA7dhYO_tiZNW3lrAkqwMZhrgsQc6hsbGZvmiZ6b5RDZRHiFdtEHEZBX_fEF0R_We0vH85OeBvhmiU9V1_sGQlR1REfzSKjbLo7tcdkqjxC_cW8etVY2nUfwbY_FMgT27FDIU550ql_4R08-_QkgGe4piGLcNxlc_O2PmtvVp3eotyakAip7UaEud6HMiDhQqR9ZUU6QW3GA7BIm6IXwJ-CvG0p05-RduV_AAj3OS=s1024-rj',
  '옥수수': 'https://lh3.googleusercontent.com/gg/AIJ2gl9C-2yhiWFWyAhagXtNcFKf_rpn9PI0dwgfrAyui1yXxXNFoaYDRBz9BibsFVYOKOEctZmgYbhsBTS41u8DpaWhod50G0AXyFVSwoPkWBAqi2NM0w3JIlrBeEjoy6BOtrbUwrkx9dF2SKmRGEyb1Zlw-cItAiETiCWsKJFbUML8bEcTtXc8GapNpcmLpIOSDRTP8qk2PVffG5uVInpCFeEmOFUQOY8sM2MZGoWKWuHtKwQlNOYf1LcHUv4xd75rQPRgh-ep4t-_jtZ7jEcnc1IEmn54_5XyI5FLMZiULX6Y2xieq6mnGhCBgojlH631YlEVSbzeYb2u7e0WIDDdoeMP=s1024-rj',
  '김치': 'https://lh3.googleusercontent.com/gg/AIJ2gl-fL-giaXMSwd7r2m0fOLXRCu8ABLAfNVjT00RVQzgJoGG8JCr1zhGuCHQy3637B-ia_sR_eNoLU64NwT5QdLZQ7SDN8jDSfJhJmnUS1sa6yGVZFH-8e53dcoxwGW48_FlIaPmEbVYRgAkSVpQWJpRHb5v-EKki-ofwGjJnfWvfiiPdR5DOPIwKEYbb3iku1W3i4VBqed-bxB-eN45xbAEAoNHmAVRp9Z4R0e7mgQIJKTnayMRRGuYxGeTA7G8G-yuwyqbyp4yAVmyR3CCnupcgBWx-L0W31BFKZ7RVVjyd4jyvoX5jpZGP946e4CpLXOApHB1fpGfQhTsuIYZisX8X=s1024-rj',
  '깍두기': 'https://lh3.googleusercontent.com/gg-dl/ABS2GSkN7TWeC6p-rHV9cLu17sqbKXaY5jmJtX5wjxsK-Co3avWjlTHMNhJ2u6hgVThMSOUNwaOoRFHMYzrJ8oYQTRoVk6ZlrtV5KqjuwTuENdIjkn7gSyb4S_Y_cGlF7SvfUrNYRO8-IUiMn37I9vCdihABM4Y_wfhlo3QRoeMVnTyOI3KcEg=s1024-rj',
};

interface MealCardProps {
  recipe: RecipeDetailForDiet;
}

export function MealCard({ recipe }: MealCardProps) {
  // 음식 이름으로 직접 이미지 URL 가져오기
  const foodImageUrl = FOOD_IMAGE_URLS[recipe.title] || null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* 음식 이미지 표시 - docs/foodjpg.md에서 직접 가져옴 */}
      {foodImageUrl ? (
        <div className="mb-4 flex justify-center">
          <Image
            src={foodImageUrl}
            alt={recipe.title}
            width={120}
            height={90}
            className="rounded-lg object-cover"
            unoptimized={true}
            onError={(e) => {
              // 이미지 로딩 실패 시 이모지 표시
              const target = e.target as HTMLImageElement;
              if (target.parentElement) {
                target.parentElement.innerHTML = recipe.emoji ? `<div class="text-6xl">${recipe.emoji}</div>` : '';
              }
            }}
          />
        </div>
      ) : (
        recipe.emoji && (
          <div className="mb-4 text-center text-6xl">{recipe.emoji}</div>
        )
      )}

      {/* 제목 */}
      <h4 className="mb-2 text-center text-2xl font-bold">{recipe.title}</h4>

      {/* 설명 */}
      {recipe.description && (
        <p className="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
          {recipe.description}
        </p>
      )}

      {/* 어린이 추천 이유 */}
      {recipe.featureDescription && (
        <div className="mb-4 rounded-md bg-yellow-50 p-4 dark:bg-yellow-950">
          <p className="text-sm">
            <span className="font-semibold text-yellow-700 dark:text-yellow-300">
              👶 성장기 어린이에게 좋은 이유:
            </span>
            <br />
            {recipe.featureDescription}
          </p>
        </div>
      )}

      {/* 영양 정보 */}
      <div className="grid grid-cols-4 gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">칼로리</p>
          <p className="text-lg font-bold">{recipe.nutrition.calories}</p>
          <p className="text-xs text-gray-500">kcal</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">단백질</p>
          <p className="text-lg font-bold">
            {Math.round(recipe.nutrition.protein)}
          </p>
          <p className="text-xs text-gray-500">g</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">탄수화물</p>
          <p className="text-lg font-bold">
            {Math.round(recipe.nutrition.carbs)}
          </p>
          <p className="text-xs text-gray-500">g</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">식이섬유</p>
          <p className="text-lg font-bold">
            {Math.round(recipe.nutrition.fiber || 0)}
          </p>
          <p className="text-xs text-gray-500">g</p>
        </div>
      </div>

      {/* 재료 */}
      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 font-semibold">재료:</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300">
            {recipe.ingredients.map((ing, index) => (
              <li key={index}>
                {ing.name} {ing.amount} {ing.unit}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

