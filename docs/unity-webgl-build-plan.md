# Unity WebGL 빌드 생성 계획

## 📋 개요

Next.js 프로젝트에 통합할 Unity WebGL 게임 빌드를 생성하는 단계별 계획입니다.

## 🎯 목표

- Unity WebGL 빌드 파일 생성
- Next.js 프로젝트에 통합
- Unity-React 양방향 통신 구현
- 게임 이벤트 시스템 연동

## 📁 필요한 빌드 파일 구조

```
public/
└── game/
    └── unity-build/
        ├── Build/
        │   ├── CharacterGame.loader.js    # Unity 로더 스크립트
        │   ├── CharacterGame.data         # 게임 데이터 파일
        │   ├── CharacterGame.framework.js # Unity 프레임워크
        │   └── CharacterGame.wasm         # WebAssembly 바이너리
        └── StreamingAssets/               # 스트리밍 에셋 (선택사항)
```

## 🔧 단계별 구현 계획

### 1단계: Unity 프로젝트 준비

#### 1.1 Unity 에디터 설치
- **Unity Hub** 설치
- **Unity 2022.3 LTS** 또는 **Unity 2023.3 LTS** 설치 (WebGL 지원 안정적)
- **WebGL Build Support** 모듈 설치

#### 1.2 Unity 프로젝트 생성
```bash
# Unity Hub에서 새 프로젝트 생성
- 프로젝트 이름: CharacterGame
- 템플릿: 2D 또는 3D (게임 타입에 따라)
- 위치: 별도 폴더 (예: ~/UnityProjects/CharacterGame)
```

#### 1.3 프로젝트 설정 확인
- **Edit > Project Settings > Player**
  - **Company Name**: `HealthGame`
  - **Product Name**: `Character Game`
  - **Version**: `1.0.0`
  - **Default Icon**: 게임 아이콘 설정 (선택사항)

### 2단계: WebGL 빌드 설정

#### 2.1 플랫폼 전환
1. **File > Build Settings** 열기
2. **WebGL** 플랫폼 선택
3. **Switch Platform** 클릭 (처음 선택 시 모듈 설치 필요)

#### 2.2 WebGL 플레이어 설정
**Edit > Project Settings > Player > WebGL** 탭:

- **Resolution and Presentation**
  - **Default Canvas Width**: `1920`
  - **Default Canvas Height**: `1080`
  - **Run In Background**: ✅ 체크 (선택사항)
  - **WebGL Template**: `Minimal` 또는 `Default` (커스텀 가능)

- **Publishing Settings**
  - **Compression Format**: `Gzip` (권장) 또는 `Brotli`
  - **Data caching**: ✅ 체크
  - **Code Optimization**: `Size` (빌드 크기 최소화) 또는 `Speed` (성능 최적화)

#### 2.3 스크립팅 백엔드 설정
**Edit > Project Settings > Player > Other Settings**:
- **Scripting Backend**: `IL2CPP` (권장) 또는 `Mono`
  - IL2CPP: 성능 향상, 빌드 시간 증가
  - Mono: 빠른 빌드, 상대적으로 낮은 성능

#### 2.4 씬 추가
**File > Build Settings**:
- 빌드에 포함할 씬을 **Scenes In Build**에 추가
- 순서 조정 (첫 번째 씬이 시작 씬)

### 3단계: Unity-React 통신 구현

#### 3.1 JavaScript 함수 호출 (Unity → React)

Unity C# 스크립트에서 React로 메시지 전송:

```csharp
// Unity C# 스크립트 예시
using UnityEngine;
using System.Runtime.InteropServices;

public class GameEventManager : MonoBehaviour
{
    [DllImport("__Internal")]
    private static extern void ReceiveMessageFromUnity(string method, string data);

    public void TriggerGameEvent(string eventType, object eventData)
    {
        string jsonData = JsonUtility.ToJson(eventData);
        ReceiveMessageFromUnity("GameEventTriggered", jsonData);
    }
}
```

**중요**: `ReceiveMessageFromUnity` 함수는 `character-game-bridge.ts`에서 이미 정의되어 있습니다.

#### 3.2 Unity 메서드 호출 (React → Unity)

React에서 Unity로 메시지 전송은 이미 구현되어 있습니다:
- `CharacterGameBridge.sendToUnity(gameObject, method, data)`

Unity C# 스크립트에서 메서드 준비:

```csharp
// Unity C# 스크립트 예시
public class GameManager : MonoBehaviour
{
    public void MoveCharacter(string jsonData)
    {
        // JSON 파싱 및 캐릭터 이동 처리
        var data = JsonUtility.FromJson<CharacterMoveData>(jsonData);
        // 캐릭터 이동 로직
    }

    public void ShowDialogue(string jsonData)
    {
        // JSON 파싱 및 대화 표시 처리
        var data = JsonUtility.FromJson<DialogueData>(jsonData);
        // 대화 시스템 로직
    }
}
```

#### 3.3 필요한 Unity 스크립트 구조

Unity 프로젝트에 다음 스크립트들이 필요합니다:

1. **GameManager.cs** - 게임 전체 관리
   - React로부터 메시지 수신
   - 게임 상태 관리

2. **CharacterController.cs** - 캐릭터 제어
   - `MoveTo(string jsonData)` - 캐릭터 이동
   - `UpdatePosition(string jsonData)` - 위치 업데이트

3. **DialogueSystem.cs** - 대화 시스템
   - `ShowDialogue(string jsonData)` - 대화 표시

4. **GameEventManager.cs** - 게임 이벤트 관리
   - `TriggerEvent(string jsonData)` - 이벤트 발생
   - React로 이벤트 전송

### 4단계: 빌드 실행

#### 4.1 빌드 전 체크리스트
- [ ] 모든 씬이 빌드 설정에 추가됨
- [ ] WebGL 플랫폼으로 전환 완료
- [ ] Unity-React 통신 스크립트 구현 완료
- [ ] 테스트 씬에서 통신 테스트 완료

#### 4.2 빌드 실행
1. **File > Build Settings** 열기
2. **Build** 버튼 클릭
3. 빌드 출력 폴더 선택: `public/game/unity-build` (또는 임시 폴더)
4. 빌드 완료 대기 (시간 소요)

#### 4.3 빌드 결과 확인
빌드 완료 후 다음 파일들이 생성되어야 합니다:
- `Build/CharacterGame.loader.js`
- `Build/CharacterGame.data`
- `Build/CharacterGame.framework.js`
- `Build/CharacterGame.wasm`
- `StreamingAssets/` (있는 경우)

### 5단계: Next.js 프로젝트에 통합

#### 5.1 빌드 파일 복사
```bash
# Unity 빌드 폴더에서 Next.js public 폴더로 복사
cp -r ~/UnityProjects/CharacterGame/Build public/game/unity-build/
# 또는 Windows에서
xcopy /E /I "C:\UnityProjects\CharacterGame\Build" "public\game\unity-build\Build"
```

#### 5.2 파일 경로 확인
빌드 파일이 다음 경로에 있는지 확인:
```
public/game/unity-build/Build/CharacterGame.loader.js
public/game/unity-build/Build/CharacterGame.data
public/game/unity-build/Build/CharacterGame.framework.js
public/game/unity-build/Build/CharacterGame.wasm
```

#### 5.3 .gitignore 설정
큰 빌드 파일은 Git에 포함하지 않도록 설정 (선택사항):
```gitignore
# Unity 빌드 파일 (선택사항 - 팀 협업 시 제외)
public/game/unity-build/Build/*.data
public/game/unity-build/Build/*.wasm
```

### 6단계: 테스트 및 디버깅

#### 6.1 로컬 테스트
1. Next.js 개발 서버 실행:
   ```bash
   pnpm dev
   ```
2. 브라우저에서 게임 페이지 접속
3. Unity 게임이 로드되는지 확인
4. 콘솔에서 오류 확인

#### 6.2 통신 테스트
1. **Unity → React 테스트**
   - Unity에서 이벤트 발생 시 React에서 수신 확인
   - 브라우저 콘솔에서 `GameEventTriggered` 이벤트 확인

2. **React → Unity 테스트**
   - React에서 Unity로 메시지 전송
   - Unity에서 메시지 수신 및 처리 확인

#### 6.3 성능 최적화
- 빌드 크기 확인 (목표: 10MB 이하 권장)
- 로딩 시간 측정
- 메모리 사용량 모니터링
- 필요시 압축 설정 조정

## 🔍 문제 해결 가이드

### 빌드 실패
- **원인**: WebGL 모듈 미설치
- **해결**: Unity Hub에서 WebGL Build Support 모듈 설치

### 로더 스크립트 로드 실패
- **원인**: 파일 경로 불일치
- **해결**: `character-game-loader.tsx`의 `buildPath` 확인

### 통신 실패
- **원인**: JavaScript 함수 이름 불일치
- **해결**: Unity 스크립트의 함수 이름과 브릿지의 함수 이름 일치 확인

### 빌드 크기 과대
- **해결책**:
  - 사용하지 않는 에셋 제거
  - 텍스처 압축 설정 조정
  - Code Optimization을 `Size`로 변경
  - 에셋 번들 사용 고려

## 📚 참고 자료

### Unity 공식 문서
- [Unity WebGL 빌드 가이드](https://docs.unity3d.com/Manual/webgl-building.html)
- [Unity WebGL 최적화](https://docs.unity3d.com/Manual/webgl-optimization.html)
- [JavaScript와 Unity 통신](https://docs.unity3d.com/Manual/webgl-interacting-with-browser-scripts.html)

### Next.js 통합
- [Next.js Static File Serving](https://nextjs.org/docs/app/building-your-application/optimizing/static-assets)
- [Next.js Public Folder](https://nextjs.org/docs/app/building-your-application/static-files)

## ✅ 체크리스트

### Unity 프로젝트 준비
- [ ] Unity 에디터 설치
- [ ] Unity 프로젝트 생성
- [ ] 프로젝트 설정 완료

### WebGL 빌드 설정
- [ ] WebGL 플랫폼으로 전환
- [ ] 플레이어 설정 구성
- [ ] 씬 추가 완료

### 통신 구현
- [ ] Unity → React 통신 스크립트 작성
- [ ] React → Unity 통신 테스트
- [ ] 이벤트 시스템 연동

### 빌드 및 배포
- [ ] WebGL 빌드 실행
- [ ] 빌드 파일 Next.js에 복사
- [ ] 로컬 테스트 완료
- [ ] 프로덕션 배포 준비

## 🎮 다음 단계

빌드 완료 후:
1. 게임 기능 구현 (캐릭터 이동, 대화 시스템 등)
2. 게임 이벤트와 React 이벤트 시스템 연동
3. 성능 최적화 및 사용자 경험 개선
4. 모바일 반응형 대응 (필요시)

## 📝 참고사항

- Unity WebGL 빌드는 시간이 오래 걸릴 수 있습니다 (10-30분)
- 빌드 크기는 가능한 한 작게 유지하는 것이 좋습니다
- 개발 중에는 `Development Build` 옵션을 사용하여 디버깅 정보 포함
- 프로덕션 빌드는 `Development Build` 옵션을 해제하여 최적화

