using UnityEngine;
using UnityEngine.UI;
using TMPro;

/// <summary>
/// 대화 시스템을 관리하는 스크립트
/// </summary>
public class DialogueSystem : MonoBehaviour
{
    [Header("UI 요소")]
    [Tooltip("대화 패널 게임 오브젝트")]
    public GameObject DialoguePanel;
    
    [Tooltip("캐릭터 이름 텍스트")]
    public TextMeshProUGUI CharacterNameText;
    
    [Tooltip("대화 내용 텍스트")]
    public TextMeshProUGUI DialogueText;
    
    [Tooltip("닫기 버튼")]
    public Button CloseButton;
    
    [Header("설정")]
    [Tooltip("자동 닫기 시간 (초, 0이면 자동 닫기 안 함)")]
    public float AutoCloseTime = 10f;
    
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
        
        // 자동으로 닫기
        if (AutoCloseTime > 0)
        {
            CancelInvoke(nameof(CloseDialogue));
            Invoke(nameof(CloseDialogue), AutoCloseTime);
        }
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

