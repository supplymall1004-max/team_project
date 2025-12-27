using UnityEngine;
using System.Runtime.InteropServices;

/// <summary>
/// 게임 이벤트를 React로 전송하는 매니저
/// Unity → React 통신 담당
/// </summary>
public class GameEventManager : MonoBehaviour
{
    // React로 메시지를 전송하는 JavaScript 함수
    // 이 함수는 character-game-bridge.ts에서 정의되어 있습니다.
    [DllImport("__Internal")]
    private static extern void ReceiveMessageFromUnity(string method, string data);

    /// <summary>
    /// 게임 이벤트 발생 시 React로 전송
    /// </summary>
    /// <param name="eventType">이벤트 타입 (medication, baby_feeding, lifecycle_event, kcdc_alert 등)</param>
    /// <param name="eventData">이벤트 데이터 (선택사항)</param>
    public void TriggerGameEvent(string eventType, object eventData = null)
    {
        if (Application.platform == RuntimePlatform.WebGLPlayer)
        {
            GameEventData data = new GameEventData
            {
                eventType = eventType,
                eventData = eventData != null ? eventData.ToString() : ""
            };
            
            string jsonData = JsonUtility.ToJson(data);
            ReceiveMessageFromUnity("GameEventTriggered", jsonData);
            
            Debug.Log($"[GameEventManager] 이벤트 전송: {eventType}");
        }
        else
        {
            Debug.Log($"[GameEventManager] (에디터 모드) 이벤트 시뮬레이션: {eventType}");
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
            
            Debug.Log($"[GameEventManager] 캐릭터 도착: {characterId}");
        }
    }

    /// <summary>
    /// 게임 초기화 완료 시 React로 알림
    /// </summary>
    public void OnGameInitialized()
    {
        if (Application.platform == RuntimePlatform.WebGLPlayer)
        {
            ReceiveMessageFromUnity("GameInitialized", "{}");
            Debug.Log("[GameEventManager] 게임 초기화 완료");
        }
    }
}

[System.Serializable]
public class GameEventData
{
    public string eventType;
    public string eventData;
}

[System.Serializable]
public class CharacterArrivedData
{
    public string characterId;
    public string timestamp;
}

