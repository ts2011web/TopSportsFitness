// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { integer, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";
export const dashboard = sqliteTable("dashboard", {
 id:integer("id").primaryKey(),config:text("config").notNull(),owner:text("owner").notNull(),revision:integer("revision").notNull().default(1),updatedAt:text("updated_at").notNull(),
});

export const memberships = sqliteTable("memberships", {
 id:text("id").primaryKey(), clubId:text("club_id").notNull(), employee:text("employee").notNull(),
 reference:text("reference").notNull(), signedOn:text("signed_on").notNull(), createdBy:text("created_by").notNull(),
 createdAt:text("created_at").notNull(), cancelledAt:text("cancelled_at"),cancelledBy:text("cancelled_by"),
},t=>[uniqueIndex("memberships_club_reference").on(t.clubId,t.reference),index("memberships_date_club").on(t.signedOn,t.clubId)]);

export const clubReports=sqliteTable('club_reports',{
 id:text('id').primaryKey(),clubId:text('club_id').notNull(),signedOn:text('signed_on').notNull(),counts:text('counts').notNull(),online:integer('online').notNull(),total:integer('total').notNull(),firstName:text('first_name').notNull(),lastName:text('last_name').notNull(),createdBy:text('created_by').notNull(),createdAt:text('created_at').notNull(),cancelledAt:text('cancelled_at'),cancelledBy:text('cancelled_by'),
});

export const monthlyStats=sqliteTable('monthly_stats',{period:text('period').primaryKey(),config:text('config').notNull(),updatedAt:text('updated_at').notNull()});
