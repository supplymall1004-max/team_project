# Unity 설치 및 프로젝트 생성 가이드

## 🚨 현재 상태

Unity 에디터가 설치되어 있지 않아 자동 빌드를 실행할 수 없습니다.

## 📥 Unity 설치 방법

### 1단계: Unity Hub 다운로드

1. [Unity Hub 다운로드 페이지](https://unity.com/download) 접속
2. **Download Unity Hub** 클릭
3. 설치 파일 실행 및 설치

### 2단계: Unity 에디터 설치

1. Unity Hub 실행
2. **Installs** 탭 클릭
3. **Install Editor** 버튼 클릭
4. **Unity 2022.3 LTS** 또는 **Unity 2023.3 LTS** 선택
5. **추가 모듈**에서 **WebGL Build Support** 체크 (필수!)
6. **Install** 클릭
7. 설치 완료 대기 (시간 소요)

### 3단계: Unity 프로젝트 생성

1. Unity Hub에서 **Projects** 탭 클릭
2. **New Project** 버튼 클릭
3. 설정:
   - **Template**: `2D` 또는 `3D` (게임 타입 선택)
   - **Project Name**: `CharacterGame`
   - **Location**: `E:\team\team_project\unity-project`
4. **Create Project** 클릭
5. Unity 에디터가 자동으로 열림

### 4단계: 스크립트 추가

Unity 프로젝트가 열리면:

1. **Assets** 폴더 우클릭 → **Create > Folder** → 이름: `Scripts`
2. Windows 탐색기에서 `E:\team\team_project\unity-scripts\` 폴더 열기
3. 다음 파일들을 Unity 프로젝트의 `Assets/Scripts/` 폴더로 복사:
   - `GameEventManager.cs`
   - `GameManager.cs`
   - `CharacterController.cs`
   - `DialogueSystem.cs`
   - `BuildScript.cs`

### 5단계: 게임 오브젝트 설정

Unity 에디터에서:

1. **Hierarchy** 패널에서 빈 게임 오브젝트 생성 (우클릭 > Create Empty)
2. 이름을 **`GameManager`**로 변경 (대소문자 정확히!)
3. **Inspector** 패널에서 **Add Component** 클릭
4. 다음 스크립트 추가:
   - `Game Manager`
   - `Game Event Manager`

### 6단계: 씬 빌드 설정

1. **File > Build Settings** 열기
2. 현재 씬이 **Scenes In Build**에 추가되어 있는지 확인
3. 없으면 **Add Open Scenes** 클릭

### 7단계: WebGL 빌드 설정

1. **File > Build Settings**에서 **WebGL** 선택
2. **Switch Platform** 클릭 (처음이면 모듈 설치 필요)
3. **Player Settings** 클릭하여 설정 확인:
   - **Company Name**: `HealthGame`
   - **Product Name**: `Character Game`
   - **Version**: `1.0.0`

## 🚀 빌드 실행

Unity 설치 및 프로젝트 준비가 완료되면:

### 방법 1: 자동 빌드 스크립트 (권장)

```powershell
# 프로젝트 루트에서 실행
.\scripts\build-unity-webgl.ps1
```

### 방법 2: Unity 에디터에서 수동 빌드

1. Unity 에디터에서 **File > Build Settings** 열기
2. **WebGL** 선택 확인
3. **Build** 버튼 클릭
4. 빌드 출력 폴더 선택: `E:\team\team_project\public\game\unity-build`
5. 빌드 완료 대기

### 방법 3: Unity CLI 빌드

Unity가 설치되어 있다면:

```powershell
# Unity 경로 확인
$unityExe = "C:\Program Files\Unity\Hub\Editor\2022.3.0f1\Editor\Unity.exe"
$projectPath = "E:\team\team_project\unity-project"
$buildPath = "E:\team\team_project\public\game\unity-build"

# 빌드 실행
& $unityExe -batchmode -quit -projectPath $projectPath -buildTarget WebGL -executeMethod BuildScript.BuildWebGL
```

## ✅ 설치 확인

Unity 설치 후 다음 명령으로 확인:

```powershell
# Unity 설치 경로 확인
Get-ChildItem "C:\Program Files\Unity\Hub\Editor" -Directory
```

## 📚 다음 단계

Unity 설치 및 프로젝트 생성이 완료되면:
1. `.\scripts\build-unity-webgl.ps1` 실행
2. 빌드 완료 후 Next.js 개발 서버에서 테스트
3. 브라우저에서 게임 로드 확인

## 💡 참고사항

- Unity 설치에는 시간이 걸립니다 (10-30분)
- WebGL Build Support 모듈은 반드시 설치해야 합니다
- Unity 프로젝트는 별도 폴더에 생성하는 것을 권장합니다
- 빌드 파일은 `public/game/unity-build/`에 자동으로 배치됩니다

