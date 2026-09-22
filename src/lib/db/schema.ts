import type { Block } from "@blocknote/core";
import { generateId } from "./uuid";
import { pgTable, primaryKey, uuid, text, timestamp, jsonb, type AnyPgColumn } from "drizzle-orm/pg-core";

export const userDomains = ["staff", "tenant"] as const;
export const userRoles = ["owner", "admin", "member"] as const;
export const domainKinds = ["shared", "custom"] as const;

export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => generateId()),

  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  domain: text("domain", { enum: userDomains }).notNull().default("tenant"),
  account_id: uuid("account_id").references((): AnyPgColumn => accounts.id, {
    onDelete: "cascade"
  }),
  role: text("role", { enum: userRoles }).notNull().default("member"),
  claimed_at: timestamp("claimed_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires").notNull()
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })]
);

export const accounts = pgTable("accounts", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  name: text("name").notNull(),
  owner_id: uuid("owner_id")
    .references(() => users.id)
    .notNull(),
  claimed_at: timestamp("claimed_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});

export const projects = pgTable("projects", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  name: text("name").notNull(),
  description: jsonb("description").$type<Block[]>(),
  account_id: uuid("account_id")
    .references(() => accounts.id)
    .notNull(),
  creator_id: uuid("creator_id")
    .references(() => users.id)
    .notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});

export const decisionStates = ["proposed", "active", "retired", "rejected"] as const;

export const decisions = pgTable("decisions", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  title: text("title").notNull(),
  rationale: jsonb("rationale").$type<Block[]>(),
  state: text("state", { enum: decisionStates }).notNull().default("proposed"),
  project_id: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  creator_id: uuid("creator_id")
    .references(() => users.id)
    .notNull(),
  review_by: timestamp("review_by"),
  reviewed_at: timestamp("reviewed_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});

export const rationaleAiRatings = ["addressed", "partially_addressed", "not_addressed"] as const;

export const assumptions = pgTable("assumptions", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  title: text("title").notNull(),
  rationale: jsonb("rationale").$type<Block[]>(),
  rationale_updated_at: timestamp("rationale_updated_at").defaultNow().notNull(),
  rationale_ai_evaluated_at: timestamp("rationale_ai_evaluated_at"),
  rationale_ai_requested_at: timestamp("rationale_ai_requested_at"),
  rationale_ai_evaluation: text("rationale_ai_evaluation"),
  rationale_ai_rating: text("rationale_ai_rating", { enum: rationaleAiRatings }),
  decision_id: uuid("decision_id")
    .references(() => decisions.id, { onDelete: "cascade" })
    .notNull(),
  creator_id: uuid("creator_id")
    .references(() => users.id)
    .notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});

export const assumptionComments = pgTable("assumption_comments", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  body: jsonb("body").$type<Block[]>(),
  assumption_id: uuid("assumption_id")
    .references(() => assumptions.id, { onDelete: "cascade" })
    .notNull(),
  creator_id: uuid("creator_id")
    .references(() => users.id)
    .notNull(),
  resolver_id: uuid("resolver_id").references(() => users.id),
  resolved_at: timestamp("resolved_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});
