using UnityEngine;
using UnityEngine.AI;

/// <summary>
/// 캐릭터 이동을 제어하는 컨트롤러
/// </summary>
public class CharacterController : MonoBehaviour
{
    [Header("캐릭터 설정")]
    [Tooltip("캐릭터 고유 ID (React에서 사용)")]
    public string CharacterId = "character_1";
    
    [Tooltip("이동 속도")]
    public float MoveSpeed = 3.5f;
    
    [Tooltip("도착 거리 임계값")]
    public float ArrivalDistance = 0.1f;

    private NavMeshAgent navAgent;
    private Animator animator;
    private Vector3 targetPosition;
    private bool isMoving = false;
    private GameEventManager eventManager;

    private void Start()
    {
        navAgent = GetComponent<NavMeshAgent>();
        animator = GetComponent<Animator>();
        eventManager = FindObjectOfType<GameEventManager>();
        
        if (navAgent != null)
        {
            navAgent.speed = MoveSpeed;
            navAgent.stoppingDistance = ArrivalDistance;
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
        while (Vector3.Distance(transform.position, target) > ArrivalDistance)
        {
            Vector3 direction = (target - transform.position).normalized;
            transform.position = Vector3.MoveTowards(
                transform.position,
                target,
                MoveSpeed * Time.deltaTime
            );
            
            // 이동 방향으로 회전
            if (direction != Vector3.zero)
            {
                transform.rotation = Quaternion.LookRotation(direction);
            }
            
            yield return null;
        }
        
        OnArrived();
    }

    private void Update()
    {
        // NavMesh를 사용하는 경우 도착 확인
        if (navAgent != null && navAgent.isOnNavMesh && isMoving)
        {
            if (!navAgent.pathPending && navAgent.remainingDistance < ArrivalDistance)
            {
                OnArrived();
            }
        }
    }

    private void OnArrived()
    {
        isMoving = false;
        
        if (animator != null)
        {
            animator.SetBool("IsWalking", false);
        }
        
        // 도착 이벤트 발생
        if (eventManager != null)
        {
            eventManager.OnCharacterArrived(CharacterId);
        }
    }
}

