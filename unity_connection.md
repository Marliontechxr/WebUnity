# Unity Connection Guide for AI Interviewer

This guide explains how to connect your Unity game to the AI Interviewer middleware.

## Workflow
1. **Unity**: Click "Start Interview".
2. **Web App**: Detects start, displays question, speaks it.
3. **User**: Speaks answer in Web App.
4. **Web App**: Updates answer in DB.
5. **Unity**: Polls DB, sees answer, displays it in Unity UI.
6. **Unity**: User clicks "Submit".
7. **Web App**: Detects submission, triggers evaluation, moves to next question.
8. **Repeat** for 5 questions.
9. **End**: Unity displays final score.

## Endpoints
- `POST /startInterview`
- `POST /submitAnswer` (Body: `{"interviewId": "..."}`)
- `GET /getInterviewState?interviewId=...`

## Unity C# Scripts

### 1. InterviewManager.cs
Attach this to a GameObject.

```csharp
using UnityEngine;
using UnityEngine.Networking;
using System.Collections;
using System.Text;

[System.Serializable]
public class StartResponse { public string interviewId; }

[System.Serializable]
public class StateResponse {
    public string status;
    public int currentQuestionIndex;
    public QuestionData[] questions;
    public float totalScore;
}

[System.Serializable]
public class QuestionData {
    public string question;
    public string userAnswer;
    public float score;
}

public class InterviewManager : MonoBehaviour {
    public string baseUrl = "https://YOUR-DEPLOYMENT.convex.cloud/http"; // UPDATE THIS
    
    [Header("UI References")]
    public UnityEngine.UI.Text questionText;
    public UnityEngine.UI.Text answerText;
    public UnityEngine.UI.Text statusText;
    public UnityEngine.UI.Button startButton;
    public UnityEngine.UI.Button submitButton;

    private string currentInterviewId;
    private bool isPolling = false;

    void Start() {
        startButton.onClick.AddListener(StartInterview);
        submitButton.onClick.AddListener(SubmitAnswer);
        submitButton.interactable = false;
    }

    public void StartInterview() {
        StartCoroutine(StartRoutine());
    }

    IEnumerator StartRoutine() {
        statusText.text = "Starting...";
        UnityWebRequest request = new UnityWebRequest(baseUrl + "/startInterview", "POST");
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");
        
        yield return request.SendWebRequest();

        if (request.result == UnityWebRequest.Result.Success) {
            var res = JsonUtility.FromJson<StartResponse>(request.downloadHandler.text);
            currentInterviewId = res.interviewId;
            statusText.text = "Interview Started. Look at Web App.";
            startButton.interactable = false;
            submitButton.interactable = true;
            isPolling = true;
            StartCoroutine(PollRoutine());
        } else {
            statusText.text = "Error: " + request.error;
        }
    }

    public void SubmitAnswer() {
        StartCoroutine(SubmitRoutine());
    }

    IEnumerator SubmitRoutine() {
        string json = "{\"interviewId\": \"" + currentInterviewId + "\"}"; // No answer needed, uses draft
        UnityWebRequest request = new UnityWebRequest(baseUrl + "/submitAnswer", "POST");
        byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
        request.uploadHandler = new UploadHandlerRaw(bodyRaw);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");

        yield return request.SendWebRequest();

        if (request.result == UnityWebRequest.Result.Success) {
            Debug.Log("Submitted");
            // Polling will pick up the next question
        }
    }

    IEnumerator PollRoutine() {
        while (isPolling) {
            UnityWebRequest request = UnityWebRequest.Get(baseUrl + "/getInterviewState?interviewId=" + currentInterviewId);
            yield return request.SendWebRequest();

            if (request.result == UnityWebRequest.Result.Success) {
                var state = JsonUtility.FromJson<StateResponse>(request.downloadHandler.text);
                UpdateUI(state);
                
                if (state.status == "completed") {
                    isPolling = false;
                    ShowResults(state);
                }
            }
            yield return new WaitForSeconds(1f); // Poll every second
        }
    }

    void UpdateUI(StateResponse state) {
        if (state.questions != null && state.questions.Length > state.currentQuestionIndex) {
            var q = state.questions[state.currentQuestionIndex];
            questionText.text = "Q: " + q.question;
            answerText.text = "A: " + q.userAnswer; // Shows live transcript from Web App
        }
    }

    void ShowResults(StateResponse state) {
        float avgScore = state.totalScore / 5f;
        bool passed = avgScore > 4;
        statusText.text = "FINISHED\nScore: " + avgScore.ToString("F1") + "/10\nResult: " + (passed ? "PASS" : "FAIL");
        submitButton.interactable = false;
    }
}
```
