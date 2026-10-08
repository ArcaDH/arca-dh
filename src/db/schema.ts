import { pgTable, uuid, varchar, char, integer, date, timestamp, pgEnum, primaryKey } from 'drizzle-orm/pg-core';

// Enums
// example
// export const productivityEnum = pgEnum('productivity', [
//     'Efficient',
//     'High',
//     'Medium',
//     'Low',
//     'Procrastinating',
//     'Blocked',

// ]);

// Tables

export const User = pgTable('User', {
    userId: integer('userId').primaryKey().generatedAlwaysAsIdentity(),
    username: varchar('username', { length: 60 }).notNull().unique(),
    lastname: varchar('lastname', { length: 60 }).notNull(),
    firstname: varchar('firstname', { length: 60 }).notNull(),
    password: varchar('password', { length: 60 }).notNull(),
    email: varchar('email', { length: 60 }).notNull().unique(),
});

