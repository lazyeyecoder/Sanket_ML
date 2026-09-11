import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db.get("users", userId);
  },
});

export const setRole = mutation({
  args: { role: v.union(v.literal("citizen"), v.literal("medical_officer")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    await ctx.db.patch("users", userId, {
      role: args.role,
      verified: args.role === "citizen" ? true : false,
      verificationStatus: args.role === "citizen" ? "approved" : "none",
    });
    return null;
  },
});

export const setLanguage = mutation({
  args: { language: v.union(v.literal("en"), v.literal("hi"), v.literal("mr")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    await ctx.db.patch("users", userId, { language: args.language });
    return null;
  },
});

export const submitVerification = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    await ctx.db.patch("users", userId, { verificationStatus: "pending" });
    return null;
  },
});

// Mocked approval step: in the real product this would be a back-office
// review; here we let the client flip it after a short delay to demo the flow.
export const approveVerification = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    await ctx.db.patch("users", userId, { verificationStatus: "approved", verified: true });
    return null;
  },
});
