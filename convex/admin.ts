import { mutation } from "./_generated/server";

export const clearAllData = mutation({
    args: {},
    handler: async (ctx) => {
        const interviews = await ctx.db.query("interviews").collect();
        for (const i of interviews) {
            await ctx.db.delete(i._id);
        }

        const users = await ctx.db.query("users").collect();
        for (const u of users) {
            await ctx.db.delete(u._id);
        }

        return "All data cleared (interviews and users)!";
    },
});
