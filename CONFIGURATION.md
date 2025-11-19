# AI Interviewer Configuration Guide

This document explains how to customize the AI Interviewer webapp using the `config.json` file. All customization can be done through this single JSON file without modifying any code.

## Location

The configuration file is located at: `config.json` in the root directory of the project.

## Configuration Options

### App Information

```json
{
  "appName": "AI Interviewer",
  "appDescription": "AI-powered technical interviewer"
}
```

- **appName**: The name displayed in the webapp
- **appDescription**: Short description shown on the user info form (if enabled)

### User Information Collection

```json
{
  "userInfo": {
    "enabled": false,
    "fields": [
      {
        "name": "username",
        "label": "Username",
        "type": "text",
        "required": true,
        "placeholder": "Enter your username"
      }
    ]
  }
}
```

- **enabled**: Set to `true` to show a form before the interview starts
- **fields**: Array of form fields to collect
  - **name**: Unique identifier for the field (used in database)
  - **label**: Display label shown above the input
  - **type**: Input type (`text`, `number`, `email`, `tel`, `date`)
  - **required**: Whether the field must be filled
  - **placeholder**: Placeholder text in the input field

**Example: Collecting Username and Age**

```json
{
  "userInfo": {
    "enabled": true,
    "fields": [
      {
        "name": "username",
        "label": "Username",
        "type": "text",
        "required": true,
        "placeholder": "Enter your username"
      },
      {
        "name": "age",
        "label": "Age",
        "type": "number",
        "required": true,
        "placeholder": "Enter your age"
      }
    ]
  }
}
```

### Interview Settings

```json
{
  "interview": {
    "numberOfQuestions": 5,
    "passingScore": 4,
    "topic": "Machine Learning and AI",
    "autoGenerateQuestions": true,
    "customQuestions": []
  }
}
```

- **numberOfQuestions**: Total number of questions in the interview (used when auto-generating)
- **passingScore**: Minimum score out of 10 to pass (displayed at completion)
- **topic**: The topic for AI-generated questions
- **autoGenerateQuestions**:
  - `true`: Use OpenAI to generate questions based on topic
  - `false`: Use the custom questions array instead
- **customQuestions**: Array of custom question strings (used when autoGenerateQuestions is false)

**Example: Custom Questions**

```json
{
  "interview": {
    "numberOfQuestions": 3,
    "passingScore": 6,
    "topic": "JavaScript Development",
    "autoGenerateQuestions": false,
    "customQuestions": [
      "What is the difference between let, const, and var?",
      "Explain the concept of closures in JavaScript.",
      "What are promises and how do they work?"
    ]
  }
}
```

### Speech Settings

```json
{
  "speech": {
    "enabled": true,
    "language": "en-US",
    "autoSpeak": true,
    "speechRate": 1.0
  }
}
```

- **enabled**: Enable/disable speech features (currently always enabled in code)
- **language**: Language code for speech recognition (e.g., "en-US", "en-GB", "es-ES")
- **autoSpeak**: Whether to automatically speak questions when they appear
- **speechRate**: Speed of speech synthesis (0.5 = half speed, 2.0 = double speed)

### UI Theme

```json
{
  "ui": {
    "theme": {
      "primaryColor": "#3B82F6",
      "successColor": "#10B981",
      "errorColor": "#EF4444",
      "backgroundColor": "#111827",
      "textColor": "#FFFFFF"
    }
  }
}
```

- **primaryColor**: Main accent color (session code, buttons, loading spinner)
- **successColor**: Color for success states (Submit button, PASS result)
- **errorColor**: Color for error/recording states (FAIL result, recording indicator)
- **backgroundColor**: Main background color of all screens
- **textColor**: Primary text color

**Example: Custom Theme**

```json
{
  "ui": {
    "theme": {
      "primaryColor": "#9333EA",
      "successColor": "#22C55E",
      "errorColor": "#DC2626",
      "backgroundColor": "#0F172A",
      "textColor": "#F8FAFC"
    }
  }
}
```

### Session Code Display

```json
{
  "ui": {
    "sessionCodeDisplay": {
      "fontSize": "8xl",
      "showInstructions": true
    }
  }
}
```

- **fontSize**: Tailwind font size class for the session code (`6xl`, `7xl`, `8xl`, `9xl`)
- **showInstructions**: Whether to show instruction text around the session code

### Button Visibility

```json
{
  "ui": {
    "buttons": {
      "showStartRecording": true,
      "showStopRecording": true,
      "showSubmitAnswer": true
    }
  }
}
```

- **showStartRecording**: Show the Start Recording button
- **showStopRecording**: Show the Stop Recording button
- **showSubmitAnswer**: Show the Submit Answer button

### Unity Integration Settings

```json
{
  "unity": {
    "displayAllQuestions": false,
    "showAnswerImmediately": true,
    "showScoreOnly": true,
    "autoAdvance": false
  }
}
```

- **displayAllQuestions**: (Not currently used) Show all questions vs one at a time
- **showAnswerImmediately**: Show user answer as soon as received from webapp
- **showScoreOnly**: Show only total score at end (vs detailed breakdown)
- **autoAdvance**: (Not currently used) Auto-advance to next question

### Feature Toggles

```json
{
  "features": {
    "saveResponses": true,
    "exportResults": false,
    "timerPerQuestion": 0,
    "allowSkip": false,
    "showFeedback": true
  }
}
```

- **saveResponses**: Save interview responses to database
- **exportResults**: (Not currently implemented) Allow exporting results
- **timerPerQuestion**: Time limit per question in seconds (0 = no limit)
- **allowSkip**: (Not currently implemented) Allow skipping questions
- **showFeedback**: Show AI feedback on answers

## Common Customization Scenarios

### 1. Change to a Different Interview Topic

```json
{
  "interview": {
    "topic": "Frontend Web Development",
    "numberOfQuestions": 5,
    "autoGenerateQuestions": true
  }
}
```

### 2. Use Custom Questions Instead of AI-Generated

```json
{
  "interview": {
    "autoGenerateQuestions": false,
    "customQuestions": [
      "Tell me about yourself.",
      "What are your strengths?",
      "What are your weaknesses?",
      "Where do you see yourself in 5 years?",
      "Why should we hire you?"
    ]
  }
}
```

### 3. Collect User Email Before Interview

```json
{
  "userInfo": {
    "enabled": true,
    "fields": [
      {
        "name": "email",
        "label": "Email Address",
        "type": "email",
        "required": true,
        "placeholder": "your.email@example.com"
      }
    ]
  }
}
```

### 4. Change Theme to Match Your Branding

```json
{
  "ui": {
    "theme": {
      "primaryColor": "#FF6B6B",
      "successColor": "#51CF66",
      "errorColor": "#FF6B6B",
      "backgroundColor": "#2C2C2C",
      "textColor": "#FFFFFF"
    }
  }
}
```

### 5. Shorter Interview with Higher Passing Score

```json
{
  "interview": {
    "numberOfQuestions": 3,
    "passingScore": 7,
    "topic": "Data Structures and Algorithms"
  }
}
```

## Applying Changes

1. Edit the `config.json` file with your desired settings
2. Save the file
3. If the development server is running, it should automatically reload
4. If not, restart the development server:
   ```bash
   npm run dev
   ```
5. The Convex backend will automatically pick up configuration changes on the next interview session

## Notes

- Colors must be in hex format (e.g., `#3B82F6`)
- The configuration is loaded when the webapp starts and stored with each interview session
- Changing config.json will only affect NEW interview sessions, not ones already in progress
- User info and interview config are stored in the database with each session for record-keeping

## Troubleshooting

**Q: Changes to config.json aren't showing up**
A: Restart the development server (`npm run dev`) and create a new interview session

**Q: Custom questions aren't being used**
A: Make sure `autoGenerateQuestions` is set to `false`

**Q: User info form isn't showing**
A: Check that `userInfo.enabled` is set to `true`

**Q: Colors aren't applying correctly**
A: Ensure colors are in hex format with the `#` prefix

## Advanced: Adding New Fields

To add new user info fields, simply add them to the `userInfo.fields` array:

```json
{
  "userInfo": {
    "enabled": true,
    "fields": [
      {
        "name": "fullName",
        "label": "Full Name",
        "type": "text",
        "required": true,
        "placeholder": "John Doe"
      },
      {
        "name": "phoneNumber",
        "label": "Phone Number",
        "type": "tel",
        "required": false,
        "placeholder": "+1 (555) 123-4567"
      },
      {
        "name": "graduationDate",
        "label": "Expected Graduation",
        "type": "date",
        "required": true,
        "placeholder": ""
      }
    ]
  }
}
```

The form will automatically render all fields and validate them based on the `required` property.
