import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Generate a unique 4-digit code
function generateSessionCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

export const startInterview = mutation({
    args: {},
    handler: async (ctx) => {
        // Generate unique session code
        let sessionCode = generateSessionCode();

        // Ensure uniqueness
        let existing = await ctx.db
            .query("interviews")
            .withIndex("by_session_code", (q) => q.eq("sessionCode", sessionCode))
            .first();

        while (existing) {
            sessionCode = generateSessionCode();
            existing = await ctx.db
                .query("interviews")
                .withIndex("by_session_code", (q) => q.eq("sessionCode", sessionCode))
                .first();
        }

        const interviewId = await ctx.db.insert("interviews", {
            sessionCode: sessionCode,
            status: "waiting", // Waiting for Unity to connect
            currentQuestionIndex: 0,
            questions: [],
        });
        return { interviewId, sessionCode };
    },
});

// Get or create user profile
export const getOrCreateUser = mutation({
    args: {
        email: v.string(),
        username: v.string(),
        age: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        // Check if user exists by email
        let user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (!user) {
            // Create new user
            const userId = await ctx.db.insert("users", {
                email: args.email,
                username: args.username,
                age: args.age,
                totalInterviews: 0,
                lastInterviewDate: Date.now()
            });
            user = await ctx.db.get(userId);
        } else {
            // Update username/age if changed
            await ctx.db.patch(user._id, {
                username: args.username,
                age: args.age,
                lastInterviewDate: Date.now()
            });
        }

        return user;
    }
});

// Get user by email
export const getUserByEmail = query({
    args: {
        email: v.string()
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (!user) return null;

        const interviews = await ctx.db
            .query("interviews")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .filter((q) => q.eq(q.field("status"), "completed"))
            .order("desc")
            .collect();

        return {
            user,
            interviews: interviews.map(i => ({
                date: i.completedAt,
                score: i.totalScore,
                questions: i.questions.length
            }))
        };
    }
});

// Get user interview history
export const getUserHistory = query({
    args: {
        userId: v.id("users")
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        const interviews = await ctx.db
            .query("interviews")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("status"), "completed"))
            .order("desc")
            .collect();

        return {
            user,
            interviews: interviews.map(i => ({
                date: i.completedAt,
                score: i.totalScore,
                questions: i.questions.length
            }))
        };
    }
});

// Save user info and link to user profile
export const saveUserInfo = mutation({
    args: {
        interviewId: v.id("interviews"),
        userInfo: v.any(),
        interviewConfig: v.optional(v.any())
    },
    handler: async (ctx, args): Promise<{ userId: any }> => {
        const userInfo = args.userInfo as any;

        // Get or create user profile
        let userId: any = null;
        if (userInfo && userInfo.email) {
            const user: any = await ctx.runMutation(api.interview.getOrCreateUser, {
                email: userInfo.email,
                username: userInfo.username || "Anonymous",
                age: userInfo.age ? parseInt(userInfo.age) : undefined
            });
            userId = user?._id;
        }

        await ctx.db.patch(args.interviewId, {
            userInfo: args.userInfo,
            interviewConfig: args.interviewConfig,
            userId: userId || undefined
        });

        return { userId };
    }
});

// Connect Unity using session code
export const connectWithCode = mutation({
    args: {
        sessionCode: v.string()
    },
    handler: async (ctx, args) => {
        const interview = await ctx.db
            .query("interviews")
            .withIndex("by_session_code", (q) => q.eq("sessionCode", args.sessionCode))
            .first();

        if (!interview) {
            throw new Error("Invalid session code");
        }

        if (interview.status !== "waiting") {
            throw new Error("Session already connected or completed");
        }

        // Mark as connected and start generating questions
        await ctx.db.patch(interview._id, {
            status: "initializing"
        });

        return interview._id;
    }
});

export const saveQuestions = mutation({
    args: {
        interviewId: v.id("interviews"),
        questions: v.array(v.string())
    },
    handler: async (ctx, args) => {
        const formattedQuestions = args.questions.map(q => ({
            question: q,
            userAnswer: "", // Initialize with empty string
        }));

        await ctx.db.patch(args.interviewId, {
            questions: formattedQuestions,
            status: "active"
        });
    }
});

// NEW: Update the draft answer without submitting
export const updateAnswer = mutation({
    args: {
        interviewId: v.id("interviews"),
        answer: v.string(),
    },
    handler: async (ctx, args) => {
        const interview = await ctx.db.get(args.interviewId);
        if (!interview) throw new Error("Interview not found");

        const currentIndex = interview.currentQuestionIndex;
        if (currentIndex >= interview.questions.length) return; // Ignore if finished

        const questions = interview.questions;
        questions[currentIndex].userAnswer = args.answer;

        await ctx.db.patch(args.interviewId, {
            questions: questions
        });
    }
});

// Advance to next question (called from Unity Next button)
export const advanceQuestion = mutation({
    args: {
        interviewId: v.id("interviews"),
        nextIndex: v.number()
    },
    handler: async (ctx, args) => {
        const interview = await ctx.db.get(args.interviewId);
        if (!interview) throw new Error("Interview not found");

        await ctx.db.patch(args.interviewId, {
            currentQuestionIndex: args.nextIndex
        });
    }
});

export const submitAnswer = mutation({
    args: {
        interviewId: v.id("interviews"),
        answer: v.optional(v.string()), // Optional now, can use draft
    },
    handler: async (ctx, args) => {
        const interview = await ctx.db.get(args.interviewId);
        if (!interview) throw new Error("Interview not found");

        const currentIndex = interview.currentQuestionIndex;
        if (currentIndex >= interview.questions.length) {
            throw new Error("Interview already completed");
        }

        const questions = interview.questions;
        let finalAnswer = args.answer;

        // If no answer provided, use the draft
        if (finalAnswer === undefined || finalAnswer === null) {
            finalAnswer = questions[currentIndex].userAnswer || "";
        } else {
            // Update with provided answer
            questions[currentIndex].userAnswer = finalAnswer;
            await ctx.db.patch(args.interviewId, { questions });
        }

        // Trigger evaluation
        await ctx.scheduler.runAfter(0, api.openai.evaluateAnswerAction, {
            interviewId: args.interviewId,
            questionIndex: currentIndex,
            question: questions[currentIndex].question,
            answer: finalAnswer
        });

        return { success: true };
    },
});

export const processEvaluationResult = mutation({
    args: {
        interviewId: v.id("interviews"),
        questionIndex: v.number(),
        score: v.number(),
        feedback: v.string()
    },
    handler: async (ctx, args) => {
        const interview = await ctx.db.get(args.interviewId);
        if (!interview) throw new Error("Interview not found");

        const questions = interview.questions;
        questions[args.questionIndex].score = args.score;
        questions[args.questionIndex].feedback = args.feedback;

        // Move to next question
        const nextIndex = args.questionIndex + 1;
        let status = interview.status;
        let totalScore = interview.totalScore;
        let completedAt = interview.completedAt;

        if (nextIndex >= questions.length) {
            status = "completed";
            totalScore = questions.reduce((acc, q) => acc + (q.score || 0), 0);
            completedAt = Date.now();

            // Update user statistics if userId is linked
            if (interview.userId) {
                const user = await ctx.db.get(interview.userId);
                if (user) {
                    const userInterviews = await ctx.db
                        .query("interviews")
                        .withIndex("by_user", (q) => q.eq("userId", interview.userId))
                        .filter((q) => q.eq(q.field("status"), "completed"))
                        .collect();

                    const totalInterviews = userInterviews.length + 1;
                    const allScores = [...userInterviews.map(i => i.totalScore || 0), totalScore || 0];
                    const averageScore = allScores.reduce((a, b) => a + b, 0) / totalInterviews;

                    await ctx.db.patch(interview.userId, {
                        totalInterviews: totalInterviews,
                        averageScore: averageScore,
                        lastInterviewDate: Date.now()
                    });
                }
            }
        }

        await ctx.db.patch(args.interviewId, {
            questions: questions,
            currentQuestionIndex: nextIndex,
            status: status,
            totalScore: totalScore,
            completedAt: completedAt
        });
    }
});

export const getInterviewState = query({
    args: { interviewId: v.optional(v.id("interviews")) },
    handler: async (ctx, args) => {
        if (!args.interviewId) return null;
        return await ctx.db.get(args.interviewId);
    },
});

// NEW: Get the latest active interview
export const getLatestInterview = query({
    args: {},
    handler: async (ctx) => {
        const interview = await ctx.db
            .query("interviews")
            .order("desc")
            .first();

        if (!interview) return null;

        // Only return if it's active or initializing
        if (interview.status === "completed") return null;

        return interview;
    }
});
