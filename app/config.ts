import configData from '../config.json';

export interface UserInfoField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'tel' | 'date';
  required: boolean;
  placeholder?: string;
}

export interface Config {
  appName: string;
  appDescription: string;
  userInfo: {
    enabled: boolean;
    fields: UserInfoField[];
  };
  interview: {
    numberOfQuestions: number;
    passingScore: number;
    topic: string;
    autoGenerateQuestions: boolean;
    customQuestions: string[];
  };
  speech: {
    enabled: boolean;
    language: string;
    autoSpeak: boolean;
    speechRate: number;
  };
  ui: {
    theme: {
      primaryColor: string;
      successColor: string;
      errorColor: string;
      backgroundColor: string;
      textColor: string;
    };
    sessionCodeDisplay: {
      fontSize: string;
      showInstructions: boolean;
    };
    buttons: {
      showStartRecording: boolean;
      showStopRecording: boolean;
      showSubmitAnswer: boolean;
    };
  };
  unity: {
    displayAllQuestions: boolean;
    showAnswerImmediately: boolean;
    showScoreOnly: boolean;
    autoAdvance: boolean;
  };
  features: {
    saveResponses: boolean;
    exportResults: boolean;
    timerPerQuestion: number;
    allowSkip: boolean;
    showFeedback: boolean;
  };
}

export const config: Config = configData as Config;
