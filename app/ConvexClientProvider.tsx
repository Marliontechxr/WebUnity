"use client";

import { ReactNode, useMemo } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

export default function ConvexClientProvider({
    children,
}: {
    children: ReactNode;
}) {
    const convex = useMemo(() => {
        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
        if (!convexUrl) {
            throw new Error(
                "Missing NEXT_PUBLIC_CONVEX_URL environment variable. " +
                "Please set it in your environment variables."
            );
        }
        return new ConvexReactClient(convexUrl);
    }, []);

    return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
