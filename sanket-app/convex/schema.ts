import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(v.union(v.literal("citizen"), v.literal("medical_officer"))),
    verified: v.optional(v.boolean()),
    verificationStatus: v.optional(
      v.union(v.literal("none"), v.literal("pending"), v.literal("approved")),
    ),
    language: v.optional(v.union(v.literal("en"), v.literal("hi"), v.literal("mr"))),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  incidents: defineTable({
    reporterId: v.id("users"),
    lat: v.number(),
    lng: v.number(),
    type: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    status: v.union(v.literal("open"), v.literal("accepted"), v.literal("resolved")),
    createdAt: v.number(),
    acceptedBy: v.optional(v.id("users")),
  })
    .index("by_status", ["status"])
    .index("by_reporter", ["reporterId"]),

  responders: defineTable({
    userId: v.id("users"),
    lat: v.number(),
    lng: v.number(),
    verified: v.boolean(),
  }).index("by_userId", ["userId"]),
});
