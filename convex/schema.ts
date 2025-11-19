import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    interviews: defineTable({
        sessionCode: v.optional(v.string()), // 4-digit code for Unity connection
        status: v.string(), // "waiting", "connected", "active", "completed"
        currentQuestionIndex: v.number(),
        questions: v.array(
            v.object({
                question: v.string(),
                userAnswer: v.optional(v.string()),
                score: v.optional(v.number()),
                feedback: v.optional(v.string()),
            })
        ),
        totalScore: v.optional(v.number()),
        userInfo: v.optional(v.any()), // Optional user information collected from form (flexible)
        interviewConfig: v.optional(v.any()), // Store interview configuration for question generation (flexible)
        userId: v.optional(v.id("users")), // Link to user profile for history tracking
        completedAt: v.optional(v.number()), // Timestamp when interview completed
    })
        .index("by_session_code", ["sessionCode"])
        .index("by_user", ["userId"]),

    users: defineTable({
        email: v.string(),
        username: v.string(),
        age: v.optional(v.number()),
        totalInterviews: v.number(),
        averageScore: v.optional(v.number()),
        lastInterviewDate: v.optional(v.number()),
    }).index("by_email", ["email"]),
});
