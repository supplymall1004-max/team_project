# Unity C# 스크립트 예시

## 📋 개요

Next.js React 애플리케이션과 통신하기 위한 Unity C# 스크립트 예시입니다.

## 🔗 Unity → React 통신

### GameEventManager.cs

Unity에서 게임 이벤트를 발생시켜 React로 전송하는 스크립트입니다.

```csharp
using UnityEngine;
using System.Runtime.InteropServices;

public class GameEventManager : MonoBehaviour
{
    // React로 메시지를 전송하는 JavaScript 함수
    [DllImport("__Internal")]
    private static extern void ReceiveMessageFromUnity(string method, string data);

    /// <summary>
    /// 게임 이벤트 발생 시 React로 전송
    /// </summary>
    /// <param name="eventType">이벤트 타입 (medication, baby_feeding, lifecycle_event 등)</param>
    /// <param name="eventData">이벤트 데이터</param>
    public void TriggerGameEvent(string eventType, object eventData)
    {
        if (Application.platform == RuntimePlatform.WebGLPlayer)
        {
            GameEventData data = new GameEventData
            {
                eventType = eventType,
                eventData = eventData
            };
            
            string jsonData = JsonUtility.ToJson(data);
            ReceiveMessageFromUnity("GameEventTriggered", jsonData);
            
            Debug.Log($"[GameEventManager] 이벤트 전송: {eventType}");
        }
    }

    /// <summary>
    /// 캐릭터가 플레이어에게 도착했을 때 호출
    /// </summary>
    public void OnCharacterArrived(string characterId)
    {
        if (Application.platform == RuntimePlatform.WebGLPlayer)
        {
            CharacterArrivedData data = new CharacterArrivedData
            {
                characterId = characterId,
                timestamp = System.DateTime.Now.ToString("yyyy-MM-ddTHH:mm:ss")
            };
            
            string jsonData = JsonUtility.ToJson(data);
            ReceiveMessageFromUnity("CharacterArrived", jsonData);
        }
    }
}

[System.Serializable]
public class GameEventData
{
    public string eventType;
    public object eventData;
}

[System.Serializable]
public class CharacterArrivedData
{
    public string characterId;
    public string timestamp;
}
```

## 📨 React → Unity 통신

### GameManager.cs

React로부터 메시지를 수신하여 처리하는 메인 게임 매니저입니다.

```csharp
using UnityEngine;
using System;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    /// <summary>
    /// React에서 호출: 캐릭터 이동 명령
    /// </summary>
    /// <param name="jsonData">JSON 형식의 이동 데이터</param>
    public void MoveTo(string jsonData)
    {
        try
        {
            CharacterMoveData data = JsonUtility.FromJson<CharacterMoveData>(jsonData);
            
            Debug.Log($"[GameManager] 캐릭터 이동: {data.characterId} -> ({data.targetPosition.x}, {data.targetPosition.y}, {data.targetPosition.z})");
            
            // CharacterController에 이동 명령 전달
            CharacterController controller = FindCharacterController(data.characterId);
            if (controller != null)
            {
                Vector3 targetPos = new Vector3(
                    data.targetPosition.x,
                    data.targetPosition.y,
                    data.targetPosition.z
                );
                controller.MoveTo(targetPos);
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"[GameManager] MoveTo 오류: {e.Message}");
        }
    }

    /// <summary>
    /// React에서 호출: 캐릭터 위치 업데이트
    /// </summary>
    public void UpdatePosition(string jsonData)
    {
        try
        {
            CharacterPositionData data = JsonUtility.FromJson<CharacterPositionData>(jsonData);
            
            CharacterController controller = FindCharacterController(data.characterId);
            if (controller != null)
            {
                Vector3 newPos = new Vector3(
                    data.position.x,
                    data.position.y,
                    data.position.z
                );
                controller.transform.position = newPos;
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"[GameManager] UpdatePosition 오류: {e.Message}");
        }
    }

    /// <summary>
    /// React에서 호출: 대화 표시
    /// </summary>
    public void ShowDialogue(string jsonData)
    {
        try
        {
            DialogueData data = JsonUtility.FromJson<DialogueData>(jsonData);
            
            Debug.Log($"[GameManager] 대화 표시: {data.characterId} - {data.message}");
            
            // DialogueSystem에 대화 표시 요청
            DialogueSystem dialogueSystem = FindObjectOfType<DialogueSystem>();
            if (dialogueSystem != null)
            {
                dialogueSystem.ShowDialogue(data.characterId, data.message);
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"[GameManager] ShowDialogue 오류: {e.Message}");
        }
    }

    /// <summary>
    /// React에서 호출: 게임 이벤트 트리거
    /// </summary>
    public void TriggerEvent(string jsonData)
    {
        try
        {
            GameEventTriggerData data = JsonUtility.FromJson<GameEventTriggerData>(jsonData);
            
            Debug.Log($"[GameManager] 게임 이벤트 트리거: {data.eventType}");
            
            // 이벤트 처리 로직
            // 예: 캐릭터에게 알림 표시, 특수 효과 재생 등
        }
        catch (Exception e)
        {
            Debug.LogError($"[GameManager] TriggerEvent 오류: {e.Message}");
        }
    }

    private CharacterController FindCharacterController(string characterId)
    {
        // 캐릭터 ID로 CharacterController 찾기
        CharacterController[] controllers = FindObjectsOfType<CharacterController>();
        foreach (var controller in controllers)
        {
            if (controller.CharacterId == characterId)
            {
                return controller;
            }
        }
        return null;
    }
}

[System.Serializable]
public class CharacterMoveData
{
    public string characterId;
    public PositionData targetPosition;
}

[System.Serializable]
public class CharacterPositionData
{
    public string characterId;
    public PositionData position;
}

[System.Serializable]
public class PositionData
{
    public float x;
    public float y;
    public float z;
}

[System.Serializable]
public class DialogueData
{
    public string characterId;
    public string message;
}

[System.Serializable]
public class GameEventTriggerData
{
    public string eventType;
    public object eventData;
}
```

### CharacterController.cs

캐릭터 이동을 제어하는 스크립트입니다.

```csharp
using UnityEngine;
using UnityEngine.AI;

public class CharacterController : MonoBehaviour
{
    [Header("캐릭터 설정")]
    public string CharacterId;
    public float MoveSpeed = 3.5f;
    
    private NavMeshAgent navAgent;
    private Animator animator;
    private Vector3 targetPosition;
    private bool isMoving = false;

    private void Start()
    {
        navAgent = GetComponent<NavMeshAgent>();
        animator = GetComponent<Animator>();
        
        if (navAgent != null)
        {
            navAgent.speed = MoveSpeed;
        }
    }

    /// <summary>
    /// 목표 위치로 이동
    /// </summary>
    public void MoveTo(Vector3 target)
    {
        targetPosition = target;
        isMoving = true;
        
        if (navAgent != null && navAgent.isOnNavMesh)
        {
            navAgent.SetDestination(target);
        }
        else
        {
            // NavMesh가 없는 경우 직접 이동
            StartCoroutine(MoveToPosition(target));
        }
        
        if (animator != null)
        {
            animator.SetBool("IsWalking", true);
        }
    }

    private System.Collections.IEnumerator MoveToPosition(Vector3 target)
    {
        while (Vector3.Distance(transform.position, target) > 0.1f)
        {
            transform.position = Vector3.MoveTowards(
                transform.position,
                target,
                MoveSpeed * Time.deltaTime
            );
            yield return null;
        }
        
        isMoving = false;
        if (animator != null)
        {
            animator.SetBool("IsWalking", false);
        }
        
        // 도착 이벤트 발생
        GameEventManager eventManager = FindObjectOfType<GameEventManager>();
        if (eventManager != null)
        {
            eventManager.OnCharacterArrived(CharacterId);
        }
    }

    private void Update()
    {
        // NavMesh를 사용하는 경우 도착 확인
        if (navAgent != null && navAgent.isOnNavMesh && isMoving)
        {
            if (!navAgent.pathPending && navAgent.remainingDistance < 0.1f)
            {
                isMoving = false;
                if (animator != null)
                {
                    animator.SetBool("IsWalking", false);
                }
                
                // 도착 이벤트 발생
                GameEventManager eventManager = FindObjectOfType<GameEventManager>();
                if (eventManager != null)
                {
                    eventManager.OnCharacterArrived(CharacterId);
                }
            }
        }
    }
}
```

### DialogueSystem.cs

대화 시스템을 관리하는 스크립트입니다.

```csharp
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class DialogueSystem : MonoBehaviour
{
    [Header("UI 요소")]
    public GameObject DialoguePanel;
    public TextMeshProUGUI CharacterNameText;
    public TextMeshProUGUI DialogueText;
    public Button CloseButton;
    
    private string currentCharacterId;
    private bool isShowing = false;

    private void Start()
    {
        if (DialoguePanel != null)
        {
            DialoguePanel.SetActive(false);
        }
        
        if (CloseButton != null)
        {
            CloseButton.onClick.AddListener(CloseDialogue);
        }
    }

    /// <summary>
    /// 대화 표시
    /// </summary>
    public void ShowDialogue(string characterId, string message)
    {
        currentCharacterId = characterId;
        isShowing = true;
        
        if (DialoguePanel != null)
        {
            DialoguePanel.SetActive(true);
        }
        
        if (CharacterNameText != null)
        {
            CharacterNameText.text = characterId; // 실제로는 캐릭터 이름을 가져와야 함
        }
        
        if (DialogueText != null)
        {
            DialogueText.text = message;
        }
        
        // 자동으로 닫기 (10초 후)
        Invoke(nameof(CloseDialogue), 10f);
    }

    /// <summary>
    /// 대화 닫기
    /// </summary>
    public void CloseDialogue()
    {
        isShowing = false;
        
        if (DialoguePanel != null)
        {
            DialoguePanel.SetActive(false);
        }
        
        CancelInvoke(nameof(CloseDialogue));
    }
}
```

## 🎮 사용 방법

### 1. 스크립트 생성
1. Unity 프로젝트에서 `Assets/Scripts/` 폴더 생성
2. 위의 스크립트들을 각각 파일로 저장:
   - `GameEventManager.cs`
   - `GameManager.cs`
   - `CharacterController.cs`
   - `DialogueSystem.cs`

### 2. 게임 오브젝트 설정
1. **GameManager** 게임 오브젝트 생성
   - `GameManager.cs` 스크립트 추가
   - 이름: `GameManager` (React에서 호출할 이름)

2. **GameEventManager** 게임 오브젝트 생성
   - `GameEventManager.cs` 스크립트 추가

3. **캐릭터** 게임 오브젝트 생성
   - `CharacterController.cs` 스크립트 추가
   - `CharacterId` 필드에 고유 ID 설정
   - NavMesh Agent 컴포넌트 추가 (선택사항)

4. **DialogueSystem** 게임 오브젝트 생성
   - `DialogueSystem.cs` 스크립트 추가
   - UI 요소 연결

### 3. React와 연동 확인
- React에서 `GameManager.MoveTo` 호출 시 Unity에서 캐릭터 이동
- Unity에서 `GameEventTriggered` 이벤트 발생 시 React에서 수신

## 🔍 디버깅 팁

1. **Unity 콘솔 확인**
   - `Debug.Log`로 메시지 수신 확인
   - 오류 발생 시 스택 트레이스 확인

2. **브라우저 콘솔 확인**
   - Unity → React 메시지 수신 확인
   - React → Unity 메시지 전송 확인

3. **통신 테스트**
   - Unity 에디터에서 Play 모드로 테스트 불가 (WebGL 전용)
   - 반드시 WebGL 빌드 후 브라우저에서 테스트

## 📝 참고사항

- `[DllImport("__Internal")]`는 WebGL 빌드에서만 작동합니다
- Unity 에디터에서는 `Application.platform == RuntimePlatform.WebGLPlayer` 체크 필요
- JSON 직렬화는 `JsonUtility` 사용 (복잡한 객체는 `Newtonsoft.Json` 고려)
- 게임 오브젝트 이름이 React에서 호출하는 이름과 일치해야 합니다

