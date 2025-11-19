import { config } from '../config';

/**
 * Prepare config data to send to backend
 * Only includes relevant interview configuration
 */
export function prepareConfigForBackend() {
    return {
        interview: {
            topic: config.interview.topic,
            numberOfQuestions: config.interview.numberOfQuestions,
            customQuestions: config.interview.customQuestions,
            autoGenerateQuestions: config.interview.autoGenerateQuestions
        }
    };
}
