import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { distanceMeters } from "./geo";

export const setMyLocation = mutation({
  args: { lat: v.number(), lng: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const user = await ctx.db.get("users", userId);
    if (!user || user.role !== "medical_officer") {
      throw new Error("Only medical officers have a responder location");
    }
    const existing = await ctx.db
      .query("responders")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (existing) {
      await ctx.db.patch("responders", existing._id, {
        lat: args.lat,
        lng: args.lng,
        verified: user.verified ?? false,
      });
    } else {
      await ctx.db.insert("responders", {
        userId,
        lat: args.lat,
        lng: args.lng,
        verified: user.verified ?? false,
      });
    }
    return null;
  },
});

export const listNearbyResponders = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    radiusMeters: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const radius = args.radiusMeters ?? 5000;
    const all = await ctx.db.query("responders").take(200);
    return all.filter(
      (responder) =>
        responder.verified &&
        distanceMeters(args.lat, args.lng, responder.lat, responder.lng) <= radius,
    );
  },
});
