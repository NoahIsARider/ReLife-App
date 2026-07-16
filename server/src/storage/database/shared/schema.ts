import { sql } from "drizzle-orm";
import { pgTable, serial, timestamp, varchar, text, integer, index } from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 信任联系人表（先定义，因为 will_assets 需要引用）
export const trustedContacts = pgTable(
  "trusted_contacts",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 100 }).notNull(),
    relationship: varchar("relationship", { length: 50 }).notNull(),
    email: varchar("email", { length: 300 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    message: text("message"),
    is_primary: varchar("is_primary", { length: 5 }).default("false").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("trusted_contacts_email_idx").on(table.email),
  ]
);

// 数字资产表
export const digitalAssets = pgTable(
  "digital_assets",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 200 }).notNull(),
    category: varchar("category", { length: 50 }).notNull(),
    platform: varchar("platform", { length: 200 }).notNull(),
    account: varchar("account", { length: 300 }),
    encrypted_password: text("encrypted_password"),
    url: varchar("url", { length: 500 }),
    notes: text("notes"),
    importance: integer("importance").default(3).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("digital_assets_category_idx").on(table.category),
    index("digital_assets_importance_idx").on(table.importance),
    index("digital_assets_created_at_idx").on(table.created_at),
  ]
);

// 数字遗嘱表
export const digitalWills = pgTable(
  "digital_wills",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    title: varchar("title", { length: 200 }).notNull(),
    message: text("message"),
    inactive_days: integer("inactive_days").default(30).notNull(),
    status: varchar("status", { length: 20 }).default("draft").notNull(),
    last_activity_at: timestamp("last_activity_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("digital_wills_status_idx").on(table.status),
  ]
);

// 遗嘱-资产关联表
export const willAssets = pgTable(
  "will_assets",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    will_id: varchar("will_id", { length: 36 }).notNull().references(() => digitalWills.id, { onDelete: "cascade" }),
    asset_id: varchar("asset_id", { length: 36 }).notNull().references(() => digitalAssets.id, { onDelete: "cascade" }),
    contact_id: varchar("contact_id", { length: 36 }).references(() => trustedContacts.id, { onDelete: "set null" }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("will_assets_will_id_idx").on(table.will_id),
    index("will_assets_asset_id_idx").on(table.asset_id),
  ]
);

const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({ coerce: { date: true } });

export const insertDigitalAssetSchema = createCoercedInsertSchema(digitalAssets).pick({
  name: true, category: true, platform: true, account: true,
  encrypted_password: true, url: true, notes: true, importance: true,
});
export type DigitalAsset = typeof digitalAssets.$inferSelect;
export type InsertDigitalAsset = z.infer<typeof insertDigitalAssetSchema>;

export const insertDigitalWillSchema = createCoercedInsertSchema(digitalWills).pick({
  title: true, message: true, inactive_days: true,
});
export type DigitalWill = typeof digitalWills.$inferSelect;
export type InsertDigitalWill = z.infer<typeof insertDigitalWillSchema>;

export const insertTrustedContactSchema = createCoercedInsertSchema(trustedContacts).pick({
  name: true, relationship: true, email: true, phone: true, message: true, is_primary: true,
});
export type TrustedContact = typeof trustedContacts.$inferSelect;
export type InsertTrustedContact = z.infer<typeof insertTrustedContactSchema>;
