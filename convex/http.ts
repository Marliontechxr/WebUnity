import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Webapp calls this to start and get session code
http.route({
    path: "/startInterview",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const result = await ctx.runMutation(api.interview.startInterview);
        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }),
});

// Unity calls this with session code to connect
http.route({
    path: "/connectWithCode",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const body = await request.json();
        const { sessionCode } = body as any;

        if (!sessionCode) {
            return new Response("Missing sessionCode", { status: 400 });
        }

        try {
            const interviewId = await ctx.runMutation(api.interview.connectWithCode, { sessionCode });

            // Get the interview to retrieve stored config
            const interview = await ctx.runQuery(api.interview.getInterviewState, { interviewId });
            const storedConfig: any = interview?.interviewConfig || {};

            // Trigger question generation with stored config
            const questions = await ctx.runAction(api.openai.generateQuestions, {
                topic: storedConfig?.topic,
                numberOfQuestions: storedConfig?.numberOfQuestions,
                customQuestions: storedConfig?.customQuestions,
                autoGenerate: storedConfig?.autoGenerateQuestions
            });
            await ctx.runMutation(api.interview.saveQuestions, {
                interviewId: interviewId,
                questions: questions
            });

            return new Response(JSON.stringify({ interviewId }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        } catch (error: any) {
            return new Response(error.message, { status: 400 });
        }
    }),
});

// Unity calls this to advance to next question
http.route({
    path: "/advanceQuestion",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const body = await request.json();
        const { interviewId, nextIndex } = body as any;

        if (!interviewId) {
            return new Response("Missing interviewId", { status: 400 });
        }

        await ctx.runMutation(api.interview.advanceQuestion, {
            interviewId: interviewId,
            nextIndex: nextIndex
        });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }),
});

http.route({
    path: "/submitAnswer",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        let body = {};
        try {
            body = await request.json();
        } catch (e) {
            // Body might be empty if just triggering submit
        }

        const { interviewId, answer } = body as any;

        if (!interviewId) {
            return new Response("Missing interviewId", { status: 400 });
        }

        await ctx.runMutation(api.interview.submitAnswer, {
            interviewId: interviewId,
            answer: answer // Can be undefined
        });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }),
});

http.route({
    path: "/getInterviewState",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
        const url = new URL(request.url);
        const interviewId = url.searchParams.get("interviewId");

        if (!interviewId) {
            return new Response("Missing interviewId", { status: 400 });
        }

        const state = await ctx.runQuery(api.interview.getInterviewState, {
            interviewId: interviewId as any
        });

        return new Response(JSON.stringify(state), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }),
});

export default http;
