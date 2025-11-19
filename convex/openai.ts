import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import OpenAI from "openai";

export const generateQuestions = action({
    args: {
        topic: v.optional(v.string()),
        numberOfQuestions: v.optional(v.number()),
        customQuestions: v.optional(v.array(v.string())),
        autoGenerate: v.optional(v.boolean())
    },
    handler: async (ctx, args) => {
        // If custom questions are provided and auto-generate is disabled, use them
        if (args.customQuestions && args.customQuestions.length > 0 && args.autoGenerate === false) {
            return args.customQuestions;
        }

        // Otherwise, generate questions using AI
        const topic = args.topic || "AI/ML Engineer position";
        const numQuestions = args.numberOfQuestions || 5;

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content:
                        `You are a technical interviewer for a ${topic}. Generate ${numQuestions} distinct, challenging, but fair interview questions. Return them as a JSON array of strings.`,
                },
                {
                    role: "user",
                    content: `Generate ${numQuestions} interview questions about ${topic}.`,
                },
            ],
        });

        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error("Failed to generate questions");
        }

        try {
            const jsonMatch = content.match(/\[.*\]/s);
            const jsonStr = jsonMatch ? jsonMatch[0] : content;
            const questions = JSON.parse(jsonStr);
            if (!Array.isArray(questions)) {
                throw new Error("Invalid question format received");
            }
            return questions;
        } catch (e) {
            console.error("Error parsing OpenAI response:", content);
            throw new Error("Failed to parse questions from OpenAI");
        }
    },
});

export const evaluateAnswer = action({
    args: {
        question: v.string(),
        answer: v.string(),
    },
    handler: async (ctx, args) => {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content:
                        "You are an expert AI interviewer. Evaluate the candidate's answer to the question. " +
                        "Score the answer from 1 to 10. " +
                        "1-3: Wrong or nonsense. " +
                        "4-7: Partial or incomplete understanding. " +
                        "8-10: Correct and well-explained. " +
                        "Return a JSON object with two fields: 'score' (number) and 'feedback' (string, brief comment).",
                },
                {
                    role: "user",
                    content: `Question: ${args.question}\nAnswer: ${args.answer}`,
                },
            ],
        });

        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error("Failed to evaluate answer");
        }

        try {
            const jsonMatch = content.match(/\{.*\}/s);
            const jsonStr = jsonMatch ? jsonMatch[0] : content;
            const result = JSON.parse(jsonStr);
            return {
                score: result.score,
                feedback: result.feedback
            };
        } catch (e) {
            console.error("Error parsing OpenAI evaluation:", content);
            return { score: 0, feedback: "Error evaluating answer." };
        }
    },
});

export const evaluateAnswerAction = action({
    args: {
        interviewId: v.id("interviews"),
        questionIndex: v.number(),
        question: v.string(),
        answer: v.string(),
    },
    handler: async (ctx, args) => {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content:
                        "You are an expert AI interviewer. Evaluate the candidate's answer to the question. " +
                        "Score the answer from 1 to 10. " +
                        "1-3: Wrong or nonsense. " +
                        "4-7: Partial or incomplete understanding. " +
                        "8-10: Correct and well-explained. " +
                        "Return a JSON object with two fields: 'score' (number) and 'feedback' (string, brief comment).",
                },
                {
                    role: "user",
                    content: `Question: ${args.question}\nAnswer: ${args.answer}`,
                },
            ],
        });

        const content = response.choices[0].message.content;
        let score = 0;
        let feedback = "Failed to evaluate";

        if (content) {
            try {
                const jsonMatch = content.match(/\{.*\}/s);
                const jsonStr = jsonMatch ? jsonMatch[0] : content;
                const result = JSON.parse(jsonStr);
                score = result.score;
                feedback = result.feedback;
            } catch (e) {
                console.error("Error parsing eval", e);
            }
        }

        await ctx.runMutation(api.interview.processEvaluationResult, {
            interviewId: args.interviewId,
            questionIndex: args.questionIndex,
            score: score,
            feedback: feedback
        });
    }
});

// Analyze user performance history
export const analyzePerformance = action({
    args: {
        history: v.array(v.object({
            date: v.number(),
            score: v.number(),
            questions: v.number()
        }))
    },
    handler: async (ctx, args) => {
        if (args.history.length === 0) {
            return {
                analysis: "No history available yet. Complete your first interview to get AI insights!",
                prediction: null,
                trendStatus: "New User"
            };
        }

        const historyStr = args.history
            .map(h => `Date: ${new Date(h.date).toLocaleDateString()}, Score: ${h.score}/50`)
            .join("\n");

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a career coach analyzing a candidate's interview performance history. Scores are out of 50. Provide: 1. 'analysis': A brief, encouraging analysis. 2. 'prediction': Number (next score). 3. 'trendStatus': A one-line summary status (e.g., 'Consistently Improving', 'Needs Focus', 'Top Performer'). Return JSON."
                },
                {
                    role: "user",
                    content: `Here is the candidate's history:\n${historyStr}\n\nAnalyze their progress.`
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content || "{}";
        return JSON.parse(content);
    }
});
