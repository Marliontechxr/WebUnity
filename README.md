# AI Interviewer - Web App Middleware

An AI-powered technical interviewer system that integrates Unity (frontend) with a Next.js webapp (middleware) using Convex as the backend.

## Features

- **Session-based Connection**: Webapp generates a 4-digit code that Unity uses to connect
- **AI-Powered Questions**: Automatically generate interview questions using OpenAI GPT-4
- **Speech-to-Text**: Real-time voice recording with browser Speech Recognition API
- **Text-to-Speech**: Questions are spoken automatically using Speech Synthesis
- **Real-time Sync**: Unity displays current question and answers in real-time
- **Configurable Template System**: Customize everything through a single JSON file

## Quick Start

### Prerequisites

- Node.js 16+ installed
- OpenAI API key
- Convex account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Deploy Convex backend:
   ```bash
   npx convex dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Configuration

All customization can be done through the `config.json` file in the root directory. See [CONFIGURATION.md](./CONFIGURATION.md) for detailed documentation.

### Quick Configuration Examples

**Enable User Info Collection:**
```json
{
  "userInfo": {
    "enabled": true,
    "fields": [
      {
        "name": "username",
        "label": "Username",
        "type": "text",
        "required": true
      }
    ]
  }
}
```

**Use Custom Questions:**
```json
{
  "interview": {
    "autoGenerateQuestions": false,
    "customQuestions": [
      "Your question 1",
      "Your question 2",
      "Your question 3"
    ]
  }
}
```

**Change Theme Colors:**
```json
{
  "ui": {
    "theme": {
      "primaryColor": "#9333EA",
      "successColor": "#22C55E",
      "errorColor": "#DC2626"
    }
  }
}
```

## Unity Integration

### Setup

1. Open your Unity project (E:\Navee\WEBAI)
2. Ensure InterviewManager.cs is attached to a GameObject
3. Configure the base URL to point to your Convex deployment

### Usage Flow

1. **Start Webapp**: Run the webapp - it generates a 4-digit session code
2. **Connect Unity**: Enter the 4-digit code in Unity and click "Connect"
3. **Interview Starts**: Questions are displayed one at a time
4. **Answer in Webapp**: User records their answer via speech-to-text
5. **Advance in Unity**: Click "Next" to move to the next question
6. **Complete**: After the last question, click "Submit" to get the final score

## Project Structure

```
webaiunity/
├── app/
│   ├── components/
│   │   ├── Interviewer.tsx    # Main interview UI component
│   │   └── UserInfoForm.tsx   # Configurable user info form
│   ├── config.ts              # Configuration type definitions
│   └── utils/
│       └── configHelper.ts    # Config helper utilities
├── convex/
│   ├── interview.ts           # Interview mutations and queries
│   ├── openai.ts              # OpenAI integration for questions/evaluation
│   ├── http.ts                # HTTP endpoints for Unity
│   └── schema.ts              # Database schema
├── config.json                # Main configuration file
├── CONFIGURATION.md           # Detailed configuration guide
└── README.md                  # This file
```

## Architecture

### Components

- **Next.js Frontend**: React-based webapp for interview interface
- **Convex Backend**: Real-time database and serverless functions
- **OpenAI Integration**: GPT-4 for question generation and answer evaluation
- **Unity Client**: Desktop UI for interview management

### Data Flow

1. Webapp creates interview session with unique 4-digit code
2. Unity connects using code, triggering question generation
3. Webapp displays questions and captures speech-to-text answers
4. Unity polls backend for real-time updates
5. Unity advances questions, webapp follows
6. Unity submits final answers, triggering AI evaluation
7. Results displayed in both Unity and webapp

## API Endpoints

### POST /http/startInterview
Creates new interview session and returns session code

### POST /http/connectWithCode
Connects Unity using session code and generates questions
- Body: `{ "sessionCode": "1234" }`

### GET /http/getInterviewState
Gets current state of interview session
- Query: `?interviewId=xxx`

### POST /http/advanceQuestion
Moves to next question
- Body: `{ "interviewId": "xxx", "nextIndex": 1 }`

### POST /http/submitAnswer
Submits answer for evaluation
- Body: `{ "interviewId": "xxx", "answer": "..." }`

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Update Convex Deployment

```bash
npx convex deploy
```

Update the `baseUrl` in Unity's InterviewManager.cs to point to your production Convex URL.

## Technologies Used

- **Next.js 16.0.3**: React framework
- **Convex**: Backend-as-a-service
- **OpenAI GPT-4**: Question generation and evaluation
- **Web Speech API**: Speech recognition and synthesis
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Unity (C#)**: Desktop client

## Troubleshooting

### Speech Recognition Not Working
- Ensure you're using HTTPS (or localhost)
- Check browser permissions for microphone
- Supported browsers: Chrome, Edge, Safari

### Unity Connection Failed
- Verify Convex backend is deployed and running
- Check the baseUrl in InterviewManager.cs
- Ensure session code is correct (4 digits)

### Questions Not Generating
- Verify OpenAI API key is set correctly
- Check Convex logs for errors
- Ensure you have OpenAI API credits

## License

MIT

## Support

For issues or questions, please refer to CONFIGURATION.md for configuration help.
