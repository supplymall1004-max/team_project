using UnityEngine;
using UnityEditor;
using System.IO;

/// <summary>
/// Unity 빌드 자동화 스크립트
/// Unity 에디터에서 빌드를 실행하는 메서드
/// </summary>
public class BuildScript
{
    /// <summary>
    /// WebGL 빌드 실행
    /// Unity CLI에서 호출: -executeMethod BuildScript.BuildWebGL
    /// </summary>
    public static void BuildWebGL()
    {
        Debug.Log("[BuildScript] WebGL 빌드 시작");

        // 빌드 출력 경로 설정
        // Next.js 프로젝트의 public/game/unity-build 폴더
        string buildPath = Path.Combine(Application.dataPath, "../../public/game/unity-build");
        
        // 상대 경로가 작동하지 않으면 절대 경로 사용
        if (!Path.IsPathRooted(buildPath))
        {
            buildPath = Path.GetFullPath(buildPath);
        }

        // 빌드 경로가 없으면 생성
        if (!Directory.Exists(buildPath))
        {
            Directory.CreateDirectory(buildPath);
            Debug.Log($"[BuildScript] 빌드 경로 생성: {buildPath}");
        }

        // 빌드 설정
        BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions
        {
            scenes = GetEnabledScenes(),
            locationPathName = buildPath,
            target = BuildTarget.WebGL,
            options = BuildOptions.None
        };

        // 빌드 실행
        Debug.Log($"[BuildScript] 빌드 시작: {buildPath}");
        BuildReport report = BuildPipeline.BuildPlayer(buildPlayerOptions);
        BuildSummary summary = report.summary;

        if (summary.result == BuildResult.Succeeded)
        {
            Debug.Log($"[BuildScript] ✅ 빌드 성공!");
            Debug.Log($"[BuildScript] 빌드 크기: {summary.totalSize / 1024 / 1024} MB");
            Debug.Log($"[BuildScript] 빌드 시간: {summary.totalTime.TotalSeconds} 초");
        }
        else if (summary.result == BuildResult.Failed)
        {
            Debug.LogError($"[BuildScript] ❌ 빌드 실패!");
            EditorApplication.Exit(1);
        }
    }

    /// <summary>
    /// 빌드에 포함할 씬 목록 가져오기
    /// </summary>
    private static string[] GetEnabledScenes()
    {
        System.Collections.Generic.List<string> scenes = new System.Collections.Generic.List<string>();
        
        foreach (EditorBuildSettingsScene scene in EditorBuildSettings.scenes)
        {
            if (scene.enabled)
            {
                scenes.Add(scene.path);
            }
        }
        
        return scenes.ToArray();
    }
}

