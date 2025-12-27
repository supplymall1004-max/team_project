# Unity 스크립트 가이드

이 폴더에는 Unity 프로젝트에서 사용할 C# 스크립트들이 포함되어 있습니다.

## 📁 파일 목록

- **GameEventManager.cs** - Unity → React 통신 (이벤트 전송)
- **GameManager.cs** - React → Unity 통신 (메시지 수신)
- **CharacterController.cs** - 캐릭터 이동 제어
- **DialogueSystem.cs** - 대화 시스템

## 🚀 Unity 프로젝트에 추가하는 방법

### 1. Unity 프로젝트 열기
Unity Hub에서 프로젝트를 열거나 새 프로젝트를 생성합니다.

### 2. 스크립트 폴더 생성
Unity 프로젝트의 `Assets` 폴더에 `Scripts` 폴더를 생성합니다:
```
Assets/
└── Scripts/
```

### 3. 스크립트 파일 복사
이 폴더의 모든 `.cs` 파일을 `Assets/Scripts/` 폴더로 복사합니다.

### 4. 게임 오브젝트 설정

#### GameManager 설정
1. Unity Hierarchy에서 빈 게임 오브젝트 생성
2. 이름을 `GameManager`로 변경 (중요: React에서 이 이름으로 호출)
3. `GameManager.cs` 스크립트 추가
4. `GameEventManager.cs` 스크립트도 같은 오브젝트에 추가

#### CharacterController 설정
1. 캐릭터 게임 오브젝트 생성 (또는 기존 캐릭터 선택)
2. `CharacterController.cs` 스크립트 추가
3. `CharacterId` 필드에 고유 ID 설정 (예: "character_1")
4. NavMesh Agent 컴포넌트 추가 (선택사항, NavMesh 사용 시)

#### DialogueSystem 설정
1. UI Canvas 생성 (GameObject > UI > Canvas)
2. 대화 패널 UI 요소 생성:
   - Panel (대화 배경)
   - TextMeshPro - CharacterNameText (캐릭터 이름)
   - TextMeshPro - DialogueText (대화 내용)
   - Button - CloseButton (닫기 버튼)
3. 빈 게임 오브젝트 생성하고 `DialogueSystem.cs` 추가
4. UI 요소들을 스크립트의 필드에 연결

## 🔗 React와의 통신

### Unity → React
`GameEventManager`를 사용하여 이벤트를 전송합니다:
```csharp
GameEventManager eventManager = FindObjectOfType<GameEventManager>();
eventManager.TriggerGameEvent("medication", null);
```

### React → Unity
React에서 `CharacterGameBridge`를 통해 메시지를 전송합니다:
```typescript
const bridge = getCharacterGameBridge();
bridge.sendToUnity("GameManager", "MoveTo", {
  characterId: "character_1",
  targetPosition: { x: 10, y: 0, z: 5 }
});
```

## 📝 주의사항

1. **게임 오브젝트 이름**: `GameManager`는 정확히 이 이름이어야 React에서 호출할 수 있습니다.

2. **WebGL 빌드**: 이 스크립트들은 WebGL 빌드에서만 완전히 작동합니다. Unity 에디터에서는 일부 기능이 제한될 수 있습니다.

3. **NavMesh**: `CharacterController`에서 NavMesh를 사용하려면:
   - NavMesh를 베이크해야 합니다 (Window > AI > Navigation)
   - NavMesh Agent 컴포넌트가 필요합니다

4. **TextMeshPro**: `DialogueSystem`에서 TextMeshPro를 사용합니다. 처음 사용 시 Unity가 자동으로 임포트합니다.

## 🧪 테스트

Unity 에디터에서는 WebGL 통신을 완전히 테스트할 수 없으므로, 반드시 WebGL 빌드 후 브라우저에서 테스트해야 합니다.

## 📚 추가 리소스

- [Unity WebGL 빌드 가이드](../docs/unity-webgl-build-plan.md)
- [Unity 스크립트 예시 문서](../docs/unity-scripts-examples.md)

