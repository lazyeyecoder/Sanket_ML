import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { distanceMeters } from "./geo";

export const createIncident = mutation({
  args: {
    lat: v.number(),
    lng: v.number(),
    type: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    detectedClass: v.optional(v.string()),
    confidence: v.optional(v.number()),
    urgency: v.optional(v.string()),
    detectedBy: v.optional(v.string()),
    language: v.optional(v.string()),
    guidance: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const incidentId = await ctx.db.insert("incidents", {
      reporterId: userId,
      lat: args.lat,
      lng: args.lng,
      type: args.type,
      severity: args.severity,
      status: "open",
      createdAt: Date.now(),
      detectedClass: args.detectedClass,
      confidence: args.confidence,
      urgency: args.urgency,
      detectedBy: args.detectedBy,
      language: args.language,
      guidance: args.guidance,
    });
    return incidentId;
  },
});

// The signed-in user's own reports, newest first (shown under Profile).
export const listMyIncidents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db
      .query("incidents")
      .withIndex("by_reporter", (q) => q.eq("reporterId", userId))
      .order("desc")
      .take(50);
  },
});

export const getIncident = query({
  args: { incidentId: v.id("incidents") },
  handler: async (ctx, args) => {
    return await ctx.db.get("incidents", args.incidentId);
  },
});

export const listNearbyIncidents = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    radiusMeters: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const radius = args.radiusMeters ?? 5000;
    const open = await ctx.db
      .query("incidents")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .order("desc")
      .take(100);
    return open.filter(
      (incident) => distanceMeters(args.lat, args.lng, incident.lat, incident.lng) <= radius,
    );
  },
});

export const listOpenIncidents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("incidents")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .order("desc")
      .take(50);
  },
});

export const acceptIncident = mutation({
  args: { incidentId: v.id("incidents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const user = await ctx.db.get("users", userId);
    if (!user || user.role !== "medical_officer") {
      throw new Error("Only medical officers can accept incidents");
    }
    if (!user.verified) {
      throw new Error("Complete verification before accepting incidents");
    }
    const incident = await ctx.db.get("incidents", args.incidentId);
    if (!incident) throw new Error("Incident not found");
    if (incident.status !== "open") throw new Error("Incident is no longer open");
    await ctx.db.patch("incidents", args.incidentId, {
      status: "accepted",
      acceptedBy: userId,
    });
    return null;
  },
});
