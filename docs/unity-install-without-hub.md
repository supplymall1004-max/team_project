# Unity Hub 없이 Unity 에디터 설치하기

Unity Hub를 사용하지 않고 Unity 에디터를 직접 설치하는 방법입니다.

## 방법 1: Unity Archive에서 직접 다운로드 (권장)

### 1단계: Unity Archive 페이지 접속

브라우저에서 다음 주소로 이동:
```
https://unity.com/releases/editor/archive
```

### 2단계: Unity 버전 선택

권장 버전:
- **Unity 2022.3 LTS** (안정적, 장기 지원)
- 또는 **Unity 2023.3 LTS** (최신 LTS)

### 3단계: 다운로드

다음 두 파일을 다운로드해야 합니다:

1. **Unity Editor** (약 1-2GB)
   - Unity 에디터 본체
   - 예: `UnitySetup64.exe`

2. **WebGL Build Support** (필수!)
   - WebGL 빌드를 위한 모듈
   - 예: `UnitySetup64-WebGL-Support-for-Editor-[VERSION].exe`

### 4단계: 설치

1. **Unity Editor 설치 파일 실행**
   - 설치 경로 선택 (기본: `C:\Program Files\Unity\Editor`)
   - 설치 완료 대기

2. **WebGL Build Support 설치 파일 실행**
   - Unity Editor가 설치된 경로를 자동으로 감지
   - 설치 완료 대기

### 5단계: 설치 확인

PowerShell에서 다음 명령 실행:
```powershell
.\scripts\check-unity-ready.ps1
```

Unity 에디터가 설치되었다면 다음 경로에 있습니다:
- `C:\Program Files\Unity\Editor\Editor\Unity.exe`
- 또는 `C:\Program Files (x86)\Unity\Editor\Editor\Unity.exe`

## 방법 2: Chocolatey를 통한 설치 (자동화)

Chocolatey가 설치되어 있다면:

```powershell
# Chocolatey 설치 (없는 경우)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Unity 설치
choco install unity -y
```

**주의**: Chocolatey로 설치해도 WebGL 모듈은 별도로 설치해야 합니다.

## 방법 3: 기존 Unity 프로젝트 버전 확인

이미 Unity 프로젝트가 있다면:

1. 프로젝트 폴더의 `ProjectSettings/ProjectVersion.txt` 파일 확인
2. 파일 내용 예: `m_EditorVersion: 2022.3.50f1`
3. 해당 버전의 Unity 에디터만 설치

## Unity 프로젝트 생성 (Unity Hub 없이)

Unity 에디터가 설치되었다면:

### 방법 1: Unity 에디터 직접 실행

1. Unity 에디터 실행
   - `C:\Program Files\Unity\Editor\Editor\Unity.exe`

2. **New Project** 클릭
   - Template 선택 (2D 또는 3D)
   - Project Name: `CharacterGame`
   - Location: `E:\team\team_project\unity-project`
   - Create 클릭

### 방법 2: 명령줄로 프로젝트 생성

```powershell
$unityExe = "C:\Program Files\Unity\Editor\Editor\Unity.exe"
$projectPath = "E:\team\team_project\unity-project"

# 프로젝트 폴더 생성
New-Item -ItemType Directory -Path $projectPath -Force

# Unity 에디터로 프로젝트 열기 (자동 생성)
& $unityExe -createProject $projectPath
```

## 빌드 스크립트 복사

Unity 프로젝트가 생성되면:

1. `unity-scripts\BuildScript.cs` 파일을
2. `unity-project\Assets\Scripts\BuildScript.cs`로 복사

```powershell
# Scripts 폴더 생성
New-Item -ItemType Directory -Path "E:\team\team_project\unity-project\Assets\Scripts" -Force

# 빌드 스크립트 복사
Copy-Item -Path "E:\team\team_project\unity-scripts\BuildScript.cs" -Destination "E:\team\team_project\unity-project\Assets\Scripts\BuildScript.cs"
```

## WebGL 빌드 설정

Unity 에디터에서:

1. **File > Build Settings** 열기
2. **WebGL** 선택
3. **Switch Platform** 클릭 (처음이면 모듈 설치 필요)
4. **Player Settings** 클릭하여 설정 확인

## 빌드 실행

모든 준비가 완료되면:

```powershell
.\scripts\build-unity-webgl.ps1
```

## 문제 해결

### Unity 에디터를 찾을 수 없음

스크립트가 Unity 에디터를 찾지 못하는 경우:

1. Unity 에디터 설치 경로 확인
2. `scripts\build-unity-webgl.ps1` 파일에서 경로 수정:

```powershell
$unityPaths = @(
    "C:\Program Files\Unity\Editor\Editor\Unity.exe",  # 직접 설치 경로
    "$env:ProgramFiles\Unity\Hub\Editor\*\Editor\Unity.exe"  # Unity Hub 경로
)
```

### WebGL 빌드 실패

WebGL 모듈이 설치되지 않은 경우:

1. Unity Archive에서 WebGL Build Support 다운로드
2. 설치 파일 실행
3. Unity Editor 설치 경로 지정

## 참고사항

- Unity Hub를 사용하는 것이 더 편리하지만, 직접 설치도 가능합니다
- Unity 에디터는 약 1-2GB의 용량이 필요합니다
- WebGL Build Support 모듈은 반드시 설치해야 합니다
- 설치에는 10-30분이 소요될 수 있습니다

