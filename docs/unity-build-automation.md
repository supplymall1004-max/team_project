# Unity 빌드 자동화 가이드

## 🚀 자동 빌드 스크립트 사용법

### 방법 1: PowerShell 스크립트 사용 (권장)

```powershell
# 프로젝트 루트에서 실행
.\scripts\build-unity-webgl.ps1
```

### 방법 2: 수동 Unity CLI 빌드

Unity가 설치되어 있고 프로젝트가 준비되어 있다면:

```powershell
# Unity 경로 확인 후 실행
$unityExe = "C:\Program Files\Unity\Hub\Editor\2022.3.0f1\Editor\Unity.exe"
$projectPath = "E:\team\team_project\unity-project"
$buildPath = "E:\team\team_project\public\game\unity-build"

& $unityExe -batchmode -quit -projectPath $projectPath -buildTarget WebGL -executeMethod BuildScript.BuildWebGL
```

## 📋 사전 요구사항

### 1. Unity 설치 확인

Unity가 설치되어 있는지 확인:
```powershell
# Unity Hub 경로 확인
Get-ChildItem "$env:ProgramFiles\Unity\Hub\Editor" -Directory
```

### 2. Unity 프로젝트 생성

Unity Hub에서:
1. **New Project** 클릭
2. **Template**: 2D 또는 3D 선택
3. **Project Name**: `CharacterGame`
4. **Location**: `E:\team\team_project\unity-project`
5. **Create Project**

### 3. 스크립트 추가

Unity 프로젝트 생성 후:
1. `Assets` 폴더에 `Scripts` 폴더 생성
2. `unity-scripts/` 폴더의 모든 `.cs` 파일을 `Assets/Scripts/`로 복사:
   - `GameEventManager.cs`
   - `GameManager.cs`
   - `CharacterController.cs`
   - `DialogueSystem.cs`
   - `BuildScript.cs` (빌드 자동화용)

### 4. 게임 오브젝트 설정

Unity 에디터에서:
1. **GameManager** 게임 오브젝트 생성
2. `GameManager.cs`와 `GameEventManager.cs` 스크립트 추가
3. 씬을 빌드 설정에 추가 (File > Build Settings)

## 🔧 빌드 스크립트 설명

### BuildScript.cs

Unity 에디터에서 빌드를 자동화하는 스크립트입니다.

**주요 기능:**
- WebGL 빌드 자동 실행
- 빌드 출력 경로 자동 설정
- 빌드 결과 로그 출력

**사용법:**
- Unity CLI에서 `-executeMethod BuildScript.BuildWebGL` 옵션으로 호출
- 또는 Unity 에디터에서 직접 메서드 호출 가능

### build-unity-webgl.ps1

PowerShell 빌드 스크립트입니다.

**기능:**
- Unity 설치 경로 자동 탐지
- Unity 프로젝트 경로 확인
- 빌드 실행 및 결과 확인

## 📝 빌드 프로세스

1. **Unity 프로젝트 확인**
   - 프로젝트 경로 존재 확인
   - 필요한 스크립트 확인

2. **빌드 출력 폴더 준비**
   - `public/game/unity-build/` 폴더 생성
   - 기존 빌드 파일 정리 (선택사항)

3. **Unity 빌드 실행**
   - WebGL 타겟으로 빌드
   - 빌드 로그 저장

4. **빌드 결과 확인**
   - 빌드 파일 존재 확인
   - 파일 크기 확인

## 🐛 문제 해결

### "Unity 에디터를 찾을 수 없습니다"
- Unity Hub에서 Unity 설치 확인
- 설치 경로가 기본 위치인지 확인
- 스크립트의 경로 패턴 확인

### "Unity 프로젝트를 찾을 수 없습니다"
- Unity 프로젝트가 생성되었는지 확인
- 프로젝트 경로가 올바른지 확인
- `unity-project` 폴더가 존재하는지 확인

### "빌드 실패"
- Unity 에디터에서 프로젝트를 열어 오류 확인
- 빌드 로그 파일(`unity-build.log`) 확인
- 스크립트 컴파일 오류 확인

### "빌드 파일이 생성되지 않음"
- 빌드 로그 확인
- Unity 프로젝트의 씬이 빌드 설정에 추가되었는지 확인
- 빌드 출력 경로 권한 확인

## 💡 팁

1. **첫 빌드 전 테스트**
   - Unity 에디터에서 프로젝트가 정상적으로 열리는지 확인
   - 스크립트 컴파일 오류가 없는지 확인

2. **빌드 시간 단축**
   - 불필요한 에셋 제거
   - Development Build 옵션 해제 (프로덕션 빌드)

3. **빌드 크기 최적화**
   - 텍스처 압축 설정 조정
   - Code Optimization을 Size로 설정

## 📚 관련 문서

- [빠른 시작 가이드](./unity-quick-start.md)
- [상세 빌드 계획](./unity-webgl-build-plan.md)
- [스크립트 예시](./unity-scripts-examples.md)

