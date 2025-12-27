using UnityEngine;
using System;

/// <summary>
/// 게임 전체를 관리하는 메인 매니저
/// React → Unity 통신 담당
/// </summary>
public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    [Header("게임 설정")]
    public bool DebugMode = false;

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

    private void Start()
    {
        // 게임 초기화 완료 알림
        GameEventManager eventManager = FindObjectOfType<GameEventManager>();
        if (eventManager != null)
        {
            eventManager.OnGameInitialized();
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
            
            if (DebugMode)
            {
                Debug.Log($"[GameManager] 캐릭터 이동: {data.characterId} -> ({data.targetPosition.x}, {data.targetPosition.y}, {data.targetPosition.z})");
            }
            
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
            else
            {
                Debug.LogWarning($"[GameManager] 캐릭터를 찾을 수 없습니다: {data.characterId}");
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
                
                if (DebugMode)
                {
                    Debug.Log($"[GameManager] 위치 업데이트: {data.characterId} -> ({newPos.x}, {newPos.y}, {newPos.z})");
                }
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
            
            if (DebugMode)
            {
                Debug.Log($"[GameManager] 대화 표시: {data.characterId} - {data.message}");
            }
            
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
            
            if (DebugMode)
            {
                Debug.Log($"[GameManager] 게임 이벤트 트리거: {data.eventType}");
            }
            
            // 이벤트 처리 로직
            // 예: 캐릭터에게 알림 표시, 특수 효과 재생 등
            // 필요에 따라 추가 구현
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
    public string eventData;
}

