"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { config } from "../config";
import UserInfoForm from "./UserInfoForm";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Sub-component for AI Analysis to keep main component clean
function PerformanceAnalysis({ history }: { history: any[] }) {
    const analyzePerformance = useAction(api.openai.analyzePerformance);
    const [analysis, setAnalysis] = useState<{ analysis: string, prediction: number | null, trendStatus?: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalysis = async () => {
            console.log("PerformanceAnalysis: Fetching for history length:", history?.length);
            if (!history || history.length === 0) {
                setLoading(false);
                return;
            }

            try {
                const result = await analyzePerformance({ history });
                console.log("PerformanceAnalysis: Result:", result);
                setAnalysis(result);
            } catch (e) {
                console.error("Analysis failed", e);
                setError("Could not generate insights at this time.");
            } finally {
                setLoading(false);
            }
        };
        fetchAnalysis();
    }, [history, analyzePerformance]);

    if (loading) return <div className="animate-pulse text-gray-500 text-sm">Generating AI performance analysis...</div>;

    if (error) return (
        <div className="bg-gray-700 rounded-lg p-4 border border-red-900/50">
            <h3 className="text-sm font-bold mb-2 text-red-400">Analysis Error</h3>
            <p className="text-sm text-gray-400">{error}</p>
        </div>
    );

    if (!analysis) return null;

    return (
        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-bold text-blue-300">AI Coach Insights</h3>
                {analysis.trendStatus && (
                    <span className="px-2 py-1 rounded text-xs font-bold bg-blue-900 text-blue-200 border border-blue-700">
                        {analysis.trendStatus}
                    </span>
                )}
            </div>
            <p className="text-sm text-gray-300 mb-3 leading-relaxed">{analysis.analysis}</p>
            {analysis.prediction && (
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Projected Next Score:</span>
                    <span className="font-bold text-white bg-blue-600 px-2 py-0.5 rounded">
                        {(analysis.prediction / 5).toFixed(1)} / 10
                    </span>
                </div>
            )}
        </div>
    );
}

export default function Interviewer() {
    const [userType, setUserType] = useState<"new" | "existing" | null>(null); // User selection
    const [userInfo, setUserInfo] = useState<Record<string, string> | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [userHistory, setUserHistory] = useState<any>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [interviewId, setInterviewId] = useState<string | null>(null);
    const [sessionCode, setSessionCode] = useState<string>("");
    const [status, setStatus] = useState<"idle" | "waiting" | "loading" | "active" | "completed">("idle");
    const [currentQuestion, setCurrentQuestion] = useState<string>("");
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [totalScore, setTotalScore] = useState(0);

    // Mutations
    const updateAnswerMutation = useMutation(api.interview.updateAnswer);
    const startInterviewMutation = useMutation(api.interview.startInterview);
    const saveUserInfoMutation = useMutation(api.interview.saveUserInfo);

    // Query to check existing user by email
    const existingUserQuery = useQuery(api.interview.getUserByEmail, userEmail ? { email: userEmail } : "skip");

    // Queries
    // Get state of specific interview
    const interviewState = useQuery(api.interview.getInterviewState, interviewId ? { interviewId: interviewId as any } : "skip");

    // Speech Recognition Ref
    const recognitionRef = useRef<any>(null);
    const transcriptRef = useRef(""); // Ref to keep track of latest transcript for debouncing

    // Handle New User - submit form with all details
    const handleNewUserSubmit = async (data: Record<string, string>) => {
        setUserInfo(data);

        try {
            console.log("Creating interview session for new user...");
            const result = await startInterviewMutation();
            console.log("Session created:", result);
            setSessionCode(result.sessionCode);
            setInterviewId(result.interviewId);

            // Save user info to the interview
            const saveResult = await saveUserInfoMutation({
                interviewId: result.interviewId as any,
                userInfo: data,
                interviewConfig: {
                    topic: config.interview.topic,
                    numberOfQuestions: config.interview.numberOfQuestions,
                    customQuestions: config.interview.customQuestions,
                    autoGenerateQuestions: config.interview.autoGenerateQuestions
                }
            });
            if (saveResult.userId) {
                setUserId(saveResult.userId);
            }

            setStatus("waiting");
        } catch (error) {
            console.error("Error creating session:", error);
            setStatus("idle");
        }
    };

    // Handle Existing User - check by email
    const handleExistingUserSubmit = async (email: string) => {
        setUserEmail(email);
        // Query will load automatically and show history
    };

    // Watch for existing user query results
    useEffect(() => {
        console.log("Checking user query:", { existingUserQuery, userEmail, userType });
        // Only show history if we are in idle state (not currently in an interview)
        if (status === "idle" && existingUserQuery !== undefined && userEmail && userType === "existing") {
            console.log("Query result:", existingUserQuery);
            if (existingUserQuery && existingUserQuery.user) {
                // User found - show history
                console.log("User found! Setting history...");
                setUserHistory(existingUserQuery);
                setUserId(existingUserQuery.user._id);
                setShowHistory(true);
            } else {
                // User not found - show error
                console.log("User not found");
                alert("No user found with this email. Please register as a new user.");
                setUserEmail(null);
                setUserType(null);
            }
        }
    }, [existingUserQuery, userEmail, userType, status]);

    // Create new session for existing user
    const createSessionForExistingUser = async () => {
        if (!userId || !userHistory) return;

        try {
            console.log("Creating interview session for existing user...");
            const result = await startInterviewMutation();
            console.log("Session created:", result);
            setSessionCode(result.sessionCode);
            setInterviewId(result.interviewId);

            // Link to existing user
            await saveUserInfoMutation({
                interviewId: result.interviewId as any,
                userInfo: {
                    email: userEmail,
                    username: userHistory.user.username,
                    age: userHistory.user.age
                },
                interviewConfig: {
                    topic: config.interview.topic,
                    numberOfQuestions: config.interview.numberOfQuestions,
                    customQuestions: config.interview.customQuestions,
                    autoGenerateQuestions: config.interview.autoGenerateQuestions
                }
            });

            setStatus("waiting");
            setShowHistory(false);
        } catch (error) {
            console.error("Error creating session:", error);
            setStatus("idle");
        }
    };

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.lang = 'en-US';

                recognitionRef.current.onresult = (event: any) => {
                    let interimTranscript = "";
                    let finalTranscript = "";

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            finalTranscript += transcript + " ";
                        } else {
                            interimTranscript += transcript;
                        }
                    }

                    // Update with final results
                    if (finalTranscript) {
                        const newTranscript = (transcriptRef.current + " " + finalTranscript).trim();
                        setTranscript(newTranscript);
                        transcriptRef.current = newTranscript;

                        // Push to DB
                        if (interviewId) {
                            updateAnswerMutation({ interviewId: interviewId as any, answer: newTranscript });
                        }
                    } else if (interimTranscript) {
                        // Show interim results (in gray or italic)
                        setTranscript(transcriptRef.current + " " + interimTranscript);
                    }
                };

                recognitionRef.current.onstart = () => {
                    console.log("Speech recognition started");
                    setIsRecording(true);
                };

                recognitionRef.current.onend = () => {
                    console.log("Speech recognition ended");
                    // If we're still in recording state (button says "Stop Recording"), restart it
                    // This handles the case where speech recognition auto-stops due to silence
                    if (isRecording) {
                        console.log("Auto-restarting recognition (was still in recording mode)");
                        try {
                            recognitionRef.current?.start();
                        } catch (e) {
                            console.log("Could not restart:", e);
                            setIsRecording(false);
                        }
                    } else {
                        setIsRecording(false);
                    }
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.log("Speech recognition error:", event.error);

                    // "no-speech" error is normal - just means user paused or hasn't spoken yet
                    // Auto-restart if it was a no-speech or aborted error
                    if (event.error === 'no-speech' || event.error === 'aborted') {
                        console.log("Auto-restarting speech recognition...");
                        // Don't set recording to false - it will auto-restart
                    } else {
                        console.error("Speech recognition error:", event.error);
                        setIsRecording(false);
                    }
                };
            } else {
                console.error("Speech recognition not supported in this browser");
            }
        }
    }, [interviewId, updateAnswerMutation]);

    // Sync state from backend
    useEffect(() => {
        if (interviewState) {
            if (interviewState.status === "waiting") {
                setStatus("waiting");
            } else if (interviewState.status === "completed") {
                setStatus("completed");
                const sumScore = interviewState.totalScore || 0;
                setTotalScore(sumScore / 5);
                if (isRecording) stopRecording();
            } else if (interviewState.status === "active") {
                setStatus("active");

                // Check if question changed
                if (interviewState.currentQuestionIndex !== currentQuestionIndex) {
                    setCurrentQuestionIndex(interviewState.currentQuestionIndex);
                    const q = interviewState.questions[interviewState.currentQuestionIndex]?.question;
                    if (q) {
                        setCurrentQuestion(q);
                        setTranscript("");
                        transcriptRef.current = "";
                        stopRecording();
                        speak(q); // Speak the question
                    }
                } else if (currentQuestion === "" && interviewState.questions.length > 0) {
                    // Initial load
                    const q = interviewState.questions[0].question;
                    setCurrentQuestion(q);
                    speak(q);
                }
            } else if (interviewState.status === "initializing") {
                setStatus("loading");
            }
        }
    }, [interviewState, currentQuestionIndex, currentQuestion]);

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    };

    const startRecording = () => {
        if (recognitionRef.current && !isRecording) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.log("Already started");
            }
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

    // Show session code if it exists (highest priority)
    if (sessionCode && status === "waiting") {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-white p-4" style={{ backgroundColor: config.ui.theme.backgroundColor }}>
                <h1 className="text-4xl font-bold mb-8">{config.appName}</h1>

                {/* Session Code Display */}
                <div className="bg-gray-800 p-12 rounded-xl text-center">
                    {config.ui.sessionCodeDisplay.showInstructions && (
                        <p className="text-xl mb-4 text-gray-400">Enter this code in Unity:</p>
                    )}
                    <div
                        className={`text-${config.ui.sessionCodeDisplay.fontSize} font-bold tracking-widest mb-4`}
                        style={{ color: config.ui.theme.primaryColor }}
                    >
                        {sessionCode}
                    </div>
                    {config.ui.sessionCodeDisplay.showInstructions && (
                        <p className="text-sm text-gray-500">Waiting for Unity to connect...</p>
                    )}
                </div>
            </div>
        );
    }

    // Show user type selection screen
    if (!userType) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-white p-4" style={{ backgroundColor: config.ui.theme.backgroundColor }}>
                <h1 className="text-4xl font-bold mb-4">{config.appName}</h1>
                <p className="text-gray-400 text-center mb-12">{config.appDescription}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
                    {/* New User Option */}
                    <div
                        onClick={() => setUserType("new")}
                        className="bg-gray-800 p-8 rounded-xl cursor-pointer hover:bg-gray-700 transition border-2 border-transparent hover:border-blue-500"
                    >
                        <div className="text-center">
                            <div className="text-6xl mb-4">👤</div>
                            <h2 className="text-2xl font-bold mb-3" style={{ color: config.ui.theme.primaryColor }}>New User</h2>
                            <p className="text-gray-400">Register with your details to start your first interview</p>
                        </div>
                    </div>

                    {/* Existing User Option */}
                    <div
                        onClick={() => setUserType("existing")}
                        className="bg-gray-800 p-8 rounded-xl cursor-pointer hover:bg-gray-700 transition border-2 border-transparent hover:border-green-500"
                    >
                        <div className="text-center">
                            <div className="text-6xl mb-4">✅</div>
                            <h2 className="text-2xl font-bold mb-3" style={{ color: config.ui.theme.successColor }}>Existing User</h2>
                            <p className="text-gray-400">Login with your email to view history and start new interview</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show New User Form
    if (userType === "new" && !sessionCode) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-white p-4" style={{ backgroundColor: config.ui.theme.backgroundColor }}>
                <button
                    onClick={() => setUserType(null)}
                    className="absolute top-4 left-4 text-gray-400 hover:text-white"
                >
                    ← Back
                </button>
                <h1 className="text-4xl font-bold mb-4">{config.appName}</h1>
                <p className="text-gray-400 text-center mb-8">New User Registration</p>

                <div className="w-full max-w-md">
                    <UserInfoForm onSubmit={handleNewUserSubmit} />
                </div>
            </div>
        );
    }

    // Show Existing User Email Input
    if (userType === "existing" && !userEmail) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-white p-4" style={{ backgroundColor: config.ui.theme.backgroundColor }}>
                <button
                    onClick={() => setUserType(null)}
                    className="absolute top-4 left-4 text-gray-400 hover:text-white"
                >
                    ← Back
                </button>
                <h1 className="text-4xl font-bold mb-4">{config.appName}</h1>
                <p className="text-gray-400 text-center mb-8">Existing User Login</p>

                <div className="w-full max-w-md bg-gray-800 rounded-xl p-8">
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const email = formData.get("email") as string;
                        if (email) {
                            handleExistingUserSubmit(email);
                        }
                    }}>
                        <label className="block text-sm font-medium mb-2">
                            Email Address
                            <span className="text-red-400 ml-1">*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            required
                            placeholder="Enter your registered email"
                            className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
                        />
                        <button
                            type="submit"
                            className="w-full px-8 py-3 rounded-lg font-semibold transition"
                            style={{ backgroundColor: config.ui.theme.successColor }}
                        >
                            Check History
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Loading state for existing user check (Prevents glitch)
    if (userType === "existing" && userEmail && !showHistory && status === "idle") {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-white" style={{ backgroundColor: config.ui.theme.backgroundColor }}>
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 mb-4" style={{ borderColor: config.ui.theme.primaryColor }}></div>
                <p className="text-xl">Checking User History...</p>
            </div>
        );
    }

    // Show user history BEFORE session code (for existing users)
    if (showHistory && userHistory && userHistory.user && status === "idle") {
        const hasInterviews = userHistory.interviews && userHistory.interviews.length > 0;

        // Prepare data for graph
        const graphData = userHistory.interviews
            .slice()
            .reverse() // Oldest first
            .map((i: any) => ({
                date: new Date(i.date).toLocaleDateString(),
                score: (i.score || 0) / 5, // Scale to 10
                type: "History"
            }));

        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-white p-4" style={{ backgroundColor: config.ui.theme.backgroundColor }}>
                <h1 className="text-4xl font-bold mb-8">{config.appName}</h1>

                <div className="w-full max-w-4xl mb-8 bg-gray-800 rounded-xl p-8">
                    <h2 className="text-3xl font-semibold mb-6 text-center">Welcome back, {userHistory.user?.username}!</h2>

                    {hasInterviews ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                {/* Stats */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-4 bg-gray-700 rounded-lg">
                                            <div className="text-3xl font-bold mb-1" style={{ color: config.ui.theme.primaryColor }}>
                                                {userHistory.user?.totalInterviews || 0}
                                            </div>
                                            <div className="text-xs text-gray-400">Interviews</div>
                                        </div>
                                        <div className="text-center p-4 bg-gray-700 rounded-lg">
                                            <div className="text-3xl font-bold mb-1" style={{ color: config.ui.theme.successColor }}>
                                                {((userHistory.user?.averageScore || 0) / 5).toFixed(1)}
                                            </div>
                                            <div className="text-xs text-gray-400">Avg Score</div>
                                        </div>
                                    </div>

                                    {/* AI Analysis Component */}
                                    <PerformanceAnalysis history={userHistory.interviews} />
                                </div>

                                {/* Graph */}
                                <div className="bg-gray-900 p-4 rounded-lg h-64">
                                    <h3 className="text-sm font-semibold mb-2 text-gray-400 text-center">Performance Trend</h3>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={graphData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} />
                                            <YAxis domain={[0, 10]} stroke="#9CA3AF" fontSize={10} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                            <Line type="monotone" dataKey="score" stroke={config.ui.theme.primaryColor} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h3 className="text-xl font-semibold mb-4">Recent History</h3>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                    {userHistory.interviews.slice(0, 5).map((interview: any, idx: number) => {
                                        const scoreOutOf10 = (interview.score || 0) / 5;
                                        const passed = scoreOutOf10 > config.interview.passingScore;
                                        return (
                                            <div key={idx} className="flex justify-between items-center py-2 px-4 bg-gray-700 rounded-lg text-sm">
                                                <span className="text-gray-300">{new Date(interview.date).toLocaleDateString()}</span>
                                                <span className="font-semibold" style={{ color: passed ? config.ui.theme.successColor : config.ui.theme.errorColor }}>
                                                    {scoreOutOf10.toFixed(1)} / 10
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className="text-center text-gray-400 mb-8">This is your first interview. Good luck!</p>
                    )}

                    <button
                        onClick={createSessionForExistingUser}
                        className="w-full px-8 py-4 rounded-lg font-semibold text-lg transition hover:brightness-110"
                        style={{ backgroundColor: config.ui.theme.primaryColor }}
                    >
                        Start New Interview
                    </button>
                </div>
            </div>
        );
    }


    if (status === "loading") {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-white" style={{ backgroundColor: config.ui.theme.backgroundColor }}>
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 mb-4" style={{ borderColor: config.ui.theme.primaryColor }}></div>
                <p className="text-xl">Initializing Interview...</p>
            </div>
        );
    }

    if (status === "completed") {
        const passed = totalScore > config.interview.passingScore;
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-white" style={{ backgroundColor: config.ui.theme.backgroundColor }}>
                <h1 className="text-4xl font-bold mb-8">Interview Completed</h1>
                <div className="bg-gray-800 p-8 rounded-xl text-center">
                    <p className="text-2xl mb-4">Total Score: <span className="font-bold" style={{ color: config.ui.theme.primaryColor }}>{totalScore.toFixed(1)}</span> / 10</p>
                    <div className={`text-6xl font-bold`} style={{ color: passed ? config.ui.theme.successColor : config.ui.theme.errorColor }}>
                        {passed ? "PASS" : "FAIL"}
                    </div>
                </div>
                <p className="mt-8 text-gray-400">Check Unity for details.</p>
            </div>
        );
    }

    const handleSubmitAnswer = () => {
        if (interviewId && transcript) {
            updateAnswerMutation({ interviewId: interviewId as any, answer: transcript });
            stopRecording();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-white p-4" style={{ backgroundColor: config.ui.theme.backgroundColor }}>
            <div className="w-full max-w-2xl">
                <div className="mb-8 text-center">
                    <span className="text-gray-400 uppercase tracking-widest text-sm">Question {currentQuestionIndex + 1} of {config.interview.numberOfQuestions}</span>
                    <h2 className="text-3xl font-semibold mt-4 leading-relaxed">{currentQuestion}</h2>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 mb-8 min-h-[200px] relative">
                    {transcript ? (
                        <p className="text-gray-300 whitespace-pre-wrap text-lg">{transcript}</p>
                    ) : (
                        <p className="text-gray-500 italic">
                            {isRecording ? "Listening... Start speaking!" : "Click 'Start Recording' to begin..."}
                        </p>
                    )}
                    {isRecording && (
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                            <span style={{ color: config.ui.theme.errorColor }} className="text-sm font-semibold">RECORDING</span>
                            <span className="flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: config.ui.theme.errorColor }}></span>
                                <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: config.ui.theme.errorColor }}></span>
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex gap-4 justify-center mb-4">
                    {config.ui.buttons.showStartRecording && config.ui.buttons.showStopRecording && (
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className="px-8 py-3 rounded-lg font-semibold transition"
                            style={{
                                backgroundColor: isRecording ? config.ui.theme.errorColor : config.ui.theme.primaryColor
                            }}
                        >
                            {isRecording ? 'Stop Recording' : 'Start Recording'}
                        </button>
                    )}
                    {config.ui.buttons.showSubmitAnswer && (
                        <button
                            onClick={handleSubmitAnswer}
                            disabled={!transcript}
                            className="px-8 py-3 rounded-lg font-semibold transition"
                            style={{
                                backgroundColor: transcript ? config.ui.theme.successColor : '#4B5563',
                                cursor: transcript ? 'pointer' : 'not-allowed'
                            }}
                        >
                            Submit Answer
                        </button>
                    )}
                </div>

                <div className="text-center text-gray-500">
                    After submitting your answer, click "Next" in Unity to proceed to the next question.
                </div>
            </div>
        </div>
    );
}
