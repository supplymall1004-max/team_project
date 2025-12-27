# Unity WebGL 빌드 빠른 시작 가이드

## 🚀 5분 안에 시작하기

### 1단계: Unity 설치 (처음만)

1. [Unity Hub](https://unity.com/download) 다운로드 및 설치
2. Unity Hub 실행
3. **Installs** 탭에서 **Install Editor** 클릭
4. **Unity 2022.3 LTS** 또는 **Unity 2023.3 LTS** 선택
5. **WebGL Build Support** 모듈 체크 (필수!)
6. 설치 완료 대기

### 2단계: Unity 프로젝트 생성

1. Unity Hub에서 **Projects** 탭
2. **New Project** 클릭
3. 설정:
   - **Template**: 2D 또는 3D (게임 타입 선택)
   - **Project Name**: `CharacterGame`
   - **Location**: 원하는 폴더 선택
4. **Create Project** 클릭

### 3단계: 스크립트 추가

1. Unity 프로젝트에서 `Assets` 폴더 우클릭
2. **Create > Folder** → 이름: `Scripts`
3. `unity-scripts/` 폴더의 모든 `.cs` 파일을 `Assets/Scripts/`로 복사:
   - `GameEventManager.cs`
   - `GameManager.cs`
   - `CharacterController.cs`
   - `DialogueSystem.cs`

### 4단계: 게임 오브젝트 설정

#### GameManager 생성
1. Hierarchy에서 빈 게임 오브젝트 생성 (우클릭 > Create Empty)
2. 이름을 **`GameManager`**로 변경 (대소문자 정확히!)
3. Inspector에서 **Add Component** → `GameManager` 추가
4. **Add Component** → `GameEventManager` 추가

#### 간단한 테스트 씬 구성
1. 기본 씬에 플레이어 캐릭터 추가 (Cube 또는 Sprite)
2. 캐릭터에 `CharacterController` 컴포넌트 추가
3. `CharacterId` 필드에 `"test_character"` 입력

### 5단계: WebGL 빌드 설정

1. **File > Build Settings** 열기
2. **WebGL** 선택
3. **Switch Platform** 클릭 (처음이면 모듈 설치 필요)
4. **Player Settings** 클릭하여 설정 확인:
   - **Company Name**: `HealthGame`
   - **Product Name**: `Character Game`
   - **Version**: `1.0.0`

### 6단계: 빌드 실행

1. **File > Build Settings**에서 **Build** 클릭
2. 빌드 출력 폴더 선택:
   ```
   E:\team\team_project\public\game\unity-build
   ```
3. 빌드 완료 대기 (10-30분 소요)

### 7단계: 테스트

1. Next.js 개발 서버 실행:
   ```bash
   pnpm dev
   ```
2. 브라우저에서 게임 페이지 접속
3. Unity 게임이 로드되는지 확인

## ✅ 체크리스트

빌드 전 확인:
- [ ] Unity 에디터 설치 완료
- [ ] WebGL Build Support 모듈 설치 완료
- [ ] Unity 프로젝트 생성 완료
- [ ] 스크립트 파일 복사 완료
- [ ] GameManager 게임 오브젝트 생성 완료
- [ ] WebGL 플랫폼으로 전환 완료
- [ ] 빌드 실행 완료
- [ ] 빌드 파일이 `public/game/unity-build/Build/`에 있는지 확인

## 🐛 문제 해결

### "WebGL Build Support 모듈이 없습니다"
- Unity Hub에서 모듈 추가 설치 필요

### "빌드 실패"
- 콘솔 오류 확인
- 스크립트 컴파일 오류 확인

### "게임이 로드되지 않습니다"
- 브라우저 콘솔 확인
- 파일 경로 확인 (`public/game/unity-build/Build/`)
- 파일 이름 확인 (`CharacterGame.loader.js`)

### "통신이 안 됩니다"
- GameManager 게임 오브젝트 이름 확인 (정확히 `GameManager`)
- 브라우저 콘솔에서 오류 확인
- Unity 콘솔에서 오류 확인

## 📚 다음 단계

빌드가 완료되면:
1. 게임 기능 구현 (캐릭터 이동, 대화 등)
2. React와의 통신 테스트
3. 게임 이벤트 시스템 연동
4. UI 개선 및 최적화

## 💡 팁

- **개발 중**: `Development Build` 옵션 사용하여 디버깅 정보 포함
- **프로덕션**: `Development Build` 해제하여 최적화
- **빌드 크기**: 불필요한 에셋 제거하여 크기 최소화
- **테스트**: Unity 에디터에서는 WebGL 통신 테스트 불가 → 반드시 빌드 후 브라우저에서 테스트

