# 프로덕션 경고 및 오류 해결 가이드

## ✅ 수정 완료된 내용

### 1. Clerk 개발 키 경고 감지 개선

**파일**: `app/layout.tsx`

**개선 사항:**
- 프로덕션 환경에서 개발 키(`pk_test_`) 사용 시 명확한 경고 메시지 추가
- 콘솔에 해결 방법 안내

**변경 내용:**
```typescript
// 프로덕션에서 개발 키 사용 시 경고
if (process.env.NODE_ENV === "production" && publishableKey.startsWith("pk_test_")) {
  console.warn("⚠️ [Layout] 프로덕션 환경에서 개발 키(pk_test_)를 사용하고 있습니다.");
  console.warn("   프로덕션에서는 프로덕션 키(pk_live_)를 사용해야 합니다.");
  console.warn("   Clerk Dashboard → Settings → API Keys → Production 키를 복사하여");
  console.warn("   Vercel Dashboard → Settings → Environment Variables에서 업데이트해주세요.");
}
```

---

## ⚠️ 해결이 필요한 경고

### 1. Clerk 개발 키 경고

**경고 메시지:**
```
Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production.
```

**의미:**
- 프로덕션에서 개발 키(`pk_test_...`)를 사용하고 있음
- 프로덕션에서는 프로덕션 키(`pk_live_...`)를 사용해야 함

**해결 방법:**

1. **Clerk Dashboard에서 프로덕션 키 복사**
   - [Clerk Dashboard](https://dashboard.clerk.com) 접속
   - 프로젝트 선택
   - **Settings** → **API Keys**
   - **Production** 섹션에서 `Publishable Key` (`pk_live_...`) 복사

2. **Vercel에 프로덕션 키 설정**
   - Vercel Dashboard → 프로젝트 선택
   - **Settings** → **Environment Variables**
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` 찾기
   - 값에 프로덕션 키(`pk_live_...`) 입력
   - **Save** 클릭

3. **Secret Key도 확인**
   - `CLERK_SECRET_KEY`도 프로덕션 키(`sk_live_...`)인지 확인
   - 개발 키(`sk_test_...`)라면 프로덕션 키로 변경

4. **재배포**
   - 환경변수 변경 후 **자동 재배포** 또는 **수동 재배포**
   - 재배포 완료 후 경고 메시지가 사라지는지 확인

**참고:**
- 개발 키는 개발 환경에서만 사용
- 프로덕션 키는 프로덕션 환경에서만 사용
- 키를 변경한 후 반드시 재배포 필요

---

### 2. manifest.json 404 오류

**경고 메시지:**
```
manifest.json:1 Failed to load resource: the server responded with a status of 404
Manifest fetch from https://team-project-eight-blue.vercel.app/manifest.json failed, code 404
```

**의미:**
- `manifest.json` 파일이 배포되지 않았거나 접근할 수 없음
- PWA(Progressive Web App) 기능에 사용됨

**현재 상태:**
- ✅ `public/manifest.json` 파일이 존재함
- ✅ `app/layout.tsx`에서 `manifest: "/manifest.json"`로 설정됨

**가능한 원인:**
1. 빌드 시 `public` 폴더가 제대로 복사되지 않음
2. Vercel 배포 설정 문제
3. `.gitignore`에 `public/manifest.json`이 포함되어 있음

**해결 방법:**

1. **파일 존재 확인**
   ```bash
   # 로컬에서 확인
   ls -la public/manifest.json
   ```

2. **Git에 포함되어 있는지 확인**
   ```bash
   git ls-files public/manifest.json
   ```
   - 파일이 나오면 Git에 포함됨
   - 파일이 안 나오면 Git에 추가 필요:
     ```bash
     git add public/manifest.json
     git commit -m "Add manifest.json"
     git push
     ```

3. **빌드 확인**
   - 로컬에서 `pnpm build` 실행
   - `.next/static` 폴더에 `manifest.json`이 포함되는지 확인

4. **Vercel 재배포**
   - Git에 파일이 포함되어 있다면 재배포
   - 재배포 후 `https://your-domain.vercel.app/manifest.json` 접속하여 확인

**참고:**
- 이 경고는 앱 작동에 영향을 주지 않음
- PWA 기능을 사용하지 않는다면 무시해도 됨
- 하지만 PWA 기능을 사용하려면 반드시 해결 필요

---

### 3. "반경 내 검색 결과가 없습니다" 메시지

**메시지:**
```
⚠️ 반경 내 검색 결과가 없습니다.
```

**의미:**
- 선택한 반경 내에 의료시설이 없음
- 정상적인 경우일 수 있음

**원인:**
1. 선택한 반경이 너무 작음
2. 해당 위치 주변에 의료시설이 실제로 없음
3. 검색 필터가 너무 제한적임

**해결 방법:**

1. **반경 늘리기**
   - 의료시설 검색 페이지에서 반경 설정 증가
   - 예: 500m → 1km → 2km

2. **다른 위치에서 검색**
   - 위치 검색 바에서 다른 주소 입력
   - 지도에서 다른 위치 클릭

3. **필터 확인**
   - 카테고리 필터가 너무 제한적인지 확인
   - 모든 카테고리를 선택하여 검색

**참고:**
- 이 메시지는 오류가 아닌 정보성 메시지
- 해당 반경 내에 실제로 의료시설이 없을 때 표시됨
- 반경을 늘리거나 다른 위치에서 검색하면 해결됨

---

## 📋 체크리스트

### Clerk 키 설정
- [ ] Clerk Dashboard에서 프로덕션 키 확인
- [ ] Vercel에 `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` 프로덕션 키 설정
- [ ] Vercel에 `CLERK_SECRET_KEY` 프로덕션 키 설정
- [ ] 재배포 완료
- [ ] 재배포 후 경고 메시지 확인 (사라져야 함)

### manifest.json 설정
- [ ] `public/manifest.json` 파일 존재 확인
- [ ] Git에 `public/manifest.json` 포함 확인
- [ ] 로컬 빌드 후 `.next/static`에 포함 확인
- [ ] Vercel 재배포
- [ ] 배포 후 `https://your-domain.vercel.app/manifest.json` 접속 확인

### 의료시설 검색
- [ ] 반경 설정 확인 (너무 작지 않은지)
- [ ] 위치 설정 확인 (정확한 위치인지)
- [ ] 카테고리 필터 확인 (모든 카테고리 선택 가능한지)

---

## 🚀 다음 단계

1. **Clerk 프로덕션 키 설정** (우선순위: 높음)
   - 프로덕션에서 개발 키 사용은 보안 및 사용 제한 문제 발생 가능
   - 즉시 프로덕션 키로 변경 권장

2. **manifest.json 확인** (우선순위: 중간)
   - PWA 기능을 사용하지 않는다면 나중에 해결해도 됨
   - PWA 기능을 사용한다면 즉시 해결 필요

3. **의료시설 검색** (우선순위: 낮음)
   - 정상적인 동작이므로 추가 조치 불필요
   - 사용자에게 반경을 늘리거나 다른 위치에서 검색하도록 안내

---

## 💡 추가 정보

### Clerk 키 확인 방법

**개발 키:**
- `pk_test_...` (Publishable Key)
- `sk_test_...` (Secret Key)

**프로덕션 키:**
- `pk_live_...` (Publishable Key)
- `sk_live_...` (Secret Key)

### manifest.json 확인 방법

**로컬:**
```bash
curl http://localhost:3000/manifest.json
```

**프로덕션:**
```bash
curl https://your-domain.vercel.app/manifest.json
```

정상 응답 예시:
```json
{
  "name": "Flavor Archive",
  "short_name": "Flavor Archive",
  ...
}
```

404 응답이면 파일이 배포되지 않은 것임.
