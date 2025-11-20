"use client";

import { ReactNode, useMemo } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

export default function ConvexClientProvider({
    children,
}: {
    children: ReactNode;
}) {
    // NEXT_PUBLIC_ variables are embedded at build time in Next.js
    // Initialize client inside component to ensure it's client-side only
    const convex = useMemo(() => {
        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
        if (!convexUrl) {
            console.error("Missing NEXT_PUBLIC_CONVEX_URL environment variable");
            throw new Error(
                "Missing NEXT_PUBLIC_CONVEX_URL environment variable. " +
                "Please set it in your environment variables."
            );
        }
        return new ConvexReactClient(convexUrl);
    }, []);

    return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
