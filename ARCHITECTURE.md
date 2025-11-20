# Project Architecture & Flow Documentation

This document outlines the architecture of the AI Interviewer application, explaining the frontend, backend, and the complete data flow including the Unity integration.

## 1. Project Structure Overview

The project is a **Next.js** application with a **Convex** backend.

*   **Frontend (`/app`)**: This is the "Frontend". It is built with Next.js (App Router). It handles the user interface, displaying questions, and capturing user input.
*   **Backend (`/convex`)**: This is the "Backend". It runs on the Convex platform. It handles the database, business logic, AI integration (OpenAI), and API endpoints.
*   **Unity Integration**: The system is designed to connect with a Unity application (acting as a 3D avatar/interface) via HTTP endpoints.

## 2. Which one is Frontend?

The **Frontend** code is located in the **`app/`** directory.
*   **Main Entry Point**: `app/page.tsx` (The home page).
*   **Components**: `app/components/` (UI components like the Interviewer interface).
*   **Styling**: `app/globals.css`.

## 3. Complete Data Flow

The application follows a flow where the Web Frontend and an optional Unity Client interact with the Convex Backend.

### Phase 1: Initialization & Connection
1.  **Start**: The User opens the Web App (`app/page.tsx`).
2.  **Session Creation**: The Web App calls the backend function `startInterview`.
    *   The Backend generates a unique 4-digit **Session Code**.
    *   A new interview record is created in the database with status `waiting`.
3.  **Display**: The Web App displays the Session Code.
4.  **Unity Connection (Optional)**:
    *   The Unity Client sends the Session Code to the backend endpoint `/connectWithCode` (defined in `convex/http.ts`).
    *   The Backend verifies the code, generates interview questions using OpenAI (`convex/openai.ts`), and updates the status to `active`.

### Phase 2: The Interview Loop
The interview consists of a series of questions. The state is synchronized between the Backend, Web App, and Unity.

1.  **Get State**: Both the Web App and Unity poll or subscribe to `getInterviewState`. This returns the current question, status, and score.
2.  **Ask Question**: The Web App (and Unity Avatar) displays/speaks the current question.
3.  **Answer**: The User provides an answer via the Web App (text/voice) or Unity.
4.  **Submit**: The answer is sent to the backend via `submitAnswer`.
    *   **Drafting**: Answers can be drafted/updated in real-time using `updateAnswer`.
5.  **Evaluation**:
    *   The Backend triggers an OpenAI call (`api.openai.evaluateAnswerAction`) to evaluate the answer.
    *   OpenAI returns a score (1-10) and feedback.
6.  **Progression**:
    *   The Backend updates the question record with the score and feedback.
    *   The Backend automatically advances to the next question (or waits for an explicit `advanceQuestion` signal).

### Phase 3: Completion
1.  **Finish**: After the final question is answered and evaluated, the interview status changes to `completed`.
2.  **Scoring**: The Backend calculates the total score and average.
3.  **Results**: The Web App displays the final results, total score, and a Pass/Fail message.

## 4. Key Files & Responsibilities

### Frontend (`app/`)
*   **`page.tsx`**: Renders the main layout and the `Interviewer` component.
*   **`ConvexClientProvider.tsx`**: Wraps the app to provide the Convex client for data fetching.

### Backend (`convex/`)
*   **`interview.ts`**: The core logic. Handles session creation, state management, and user history.
*   **`http.ts`**: Defines HTTP endpoints (`/startInterview`, `/connectWithCode`, etc.) specifically for the Unity client to talk to the backend.
*   **`openai.ts`**: Handles communication with the OpenAI API for generating questions and grading answers.
*   **`schema.ts`**: Defines the database structure (tables for `interviews` and `users`).
