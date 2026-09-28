import { pgTable, varchar, integer } from 'drizzle-orm/pg-core';

// Tables

export const User = pgTable('User', {
    userId: integer('userId').primaryKey().generatedAlwaysAsIdentity(),
    username: varchar('username', { length: 60 }).notNull().unique(),
    lastname: varchar('lastname', { length: 60 }).notNull(),
    firstname: varchar('firstname', { length: 60 }).notNull(),
    password: varchar('password', { length: 60 }).notNull(),
    email: varchar('email', { length: 60 }).notNull().unique(),
});

