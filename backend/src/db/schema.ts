import {
    pgTable,
    pgEnum,
    uuid,
    varchar,
    integer,
    bigint,
    date,
    timestamp,
    unique,
    index,
    check,
    AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { relations, sql, InferSelectModel, InferInsertModel } from 'drizzle-orm';

const money = (name: string) => bigint(name, { mode: 'number' });
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

// Enums
export const transactionTypeEnum = pgEnum('transaction_type', ['EXPENSE', 'INCOME']);

// Tables

// 1. User (Preserved original columns with added currentPlanId reference)
export const User = pgTable('User', {
    userId: integer('userId').primaryKey().generatedAlwaysAsIdentity(),
    username: varchar('username', { length: 60 }).notNull().unique(),
    lastname: varchar('lastname', { length: 60 }).notNull(),
    firstname: varchar('firstname', { length: 60 }).notNull(),
    password: varchar('password', { length: 60 }).notNull(),
    email: varchar('email', { length: 60 }).notNull().unique(),
    currentPlanId: uuid('currentPlanId').references((): AnyPgColumn => budgetPlans.id, {
        onDelete: 'set null',
    }),
});

export const users = User;

// 2. BudgetPlans
export const budgetPlans = pgTable('budget_plans', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    userId: integer('user_id')
        .notNull()
        .references(() => User.userId, { onDelete: 'cascade' }),
    createdAt: createdAt(),
}, (table) => [
    index('budget_plans_user_idx').on(table.userId),
]);

export const BudgetPlan = budgetPlans;

// 3. IncomeSources
export const incomeSources = pgTable('income_sources', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    monthlyAmount: money('monthly_amount').notNull(),
    budgetPlanId: uuid('budget_plan_id')
        .notNull()
        .references(() => budgetPlans.id, { onDelete: 'cascade' }),
}, (table) => [
    unique('income_sources_plan_name_unique').on(table.budgetPlanId, table.name),
    check('income_sources_amount_check', sql`${table.monthlyAmount} >= 0`),
]);

export const IncomeSource = incomeSources;

// 4. Categories
export const categories = pgTable('categories', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    maxBudget: money('max_budget').notNull(), // per month
    budgetPlanId: uuid('budget_plan_id')
        .notNull()
        .references(() => budgetPlans.id, { onDelete: 'cascade' }),
}, (table) => [
    unique('categories_plan_name_unique').on(table.budgetPlanId, table.name),
    check('categories_max_budget_check', sql`${table.maxBudget} >= 0`),
]);

export const Category = categories;

// 5. Subcategories
export const subcategories = pgTable('subcategories', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    limit: money('limit').notNull(), // per month
    categoryId: uuid('category_id')
        .notNull()
        .references(() => categories.id, { onDelete: 'cascade' }),
}, (table) => [
    unique('subcategories_category_name_unique').on(table.categoryId, table.name),
    check('subcategories_limit_check', sql`${table.limit} >= 0`),
]);

export const Subcategory = subcategories;

// 6. SavingsGoals
export const savingsGoals = pgTable('savings_goals', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    targetAmount: money('target_amount').notNull(),
    deadline: date('deadline').notNull(),
    budgetPlanId: uuid('budget_plan_id')
        .notNull()
        .references(() => budgetPlans.id, { onDelete: 'cascade' }),
}, (table) => [
    check('savings_goals_target_check', sql`${table.targetAmount} > 0`),
]);

export const SavingsGoal = savingsGoals;

// 7. Transactions
//    INCOME:  may reference an income source. No category, subcategory or savings goal.
//    EXPENSE: may reference a category/subcategory, or a savings goal (money put aside
//             for that goal). Never an income source.
export const transactions = pgTable('transactions', {
    id: uuid('id').primaryKey().defaultRandom(),
    amount: money('amount').notNull(), // always positive, expense/income comes from type
    date: date('date').notNull(),
    description: varchar('description', { length: 500 }),
    type: transactionTypeEnum('type').notNull(),
    budgetPlanId: uuid('budget_plan_id')
        .notNull()
        .references(() => budgetPlans.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    subcategoryId: uuid('subcategory_id').references(() => subcategories.id, { onDelete: 'set null' }),
    savingsGoalId: uuid('savings_goal_id').references(() => savingsGoals.id, { onDelete: 'set null' }),
    incomeSourceId: uuid('income_source_id').references(() => incomeSources.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
}, (table) => [
    check('transactions_amount_check', sql`${table.amount} > 0`),
    check('transactions_type_links_check', sql`
        (${table.type} = 'INCOME' AND ${table.categoryId} IS NULL AND ${table.subcategoryId} IS NULL
            AND ${table.savingsGoalId} IS NULL)
        OR (${table.type} = 'EXPENSE' AND ${table.incomeSourceId} IS NULL)
    `),
    index('transactions_plan_date_idx').on(table.budgetPlanId, table.date),
    index('transactions_category_idx').on(table.categoryId),
    index('transactions_subcategory_idx').on(table.subcategoryId),
    index('transactions_savings_goal_idx').on(table.savingsGoalId),
]);

export const Transaction = transactions;

// Relations

export const usersRelations = relations(User, ({ one, many }) => ({
    currentPlan: one(budgetPlans, {
        fields: [User.currentPlanId],
        references: [budgetPlans.id],
    }),
    budgetPlans: many(budgetPlans),
}));

export const budgetPlansRelations = relations(budgetPlans, ({ one, many }) => ({
    user: one(User, {
        fields: [budgetPlans.userId],
        references: [User.userId],
    }),
    incomeSources: many(incomeSources),
    categories: many(categories),
    savingsGoals: many(savingsGoals),
    transactions: many(transactions),
}));

export const incomeSourcesRelations = relations(incomeSources, ({ one, many }) => ({
    budgetPlan: one(budgetPlans, {
        fields: [incomeSources.budgetPlanId],
        references: [budgetPlans.id],
    }),
    transactions: many(transactions),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
    budgetPlan: one(budgetPlans, {
        fields: [categories.budgetPlanId],
        references: [budgetPlans.id],
    }),
    subcategories: many(subcategories),
    transactions: many(transactions),
}));

export const subcategoriesRelations = relations(subcategories, ({ one, many }) => ({
    category: one(categories, {
        fields: [subcategories.categoryId],
        references: [categories.id],
    }),
    transactions: many(transactions),
}));

export const savingsGoalsRelations = relations(savingsGoals, ({ one, many }) => ({
    budgetPlan: one(budgetPlans, {
        fields: [savingsGoals.budgetPlanId],
        references: [budgetPlans.id],
    }),
    transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
    budgetPlan: one(budgetPlans, {
        fields: [transactions.budgetPlanId],
        references: [budgetPlans.id],
    }),
    category: one(categories, {
        fields: [transactions.categoryId],
        references: [categories.id],
    }),
    subcategory: one(subcategories, {
        fields: [transactions.subcategoryId],
        references: [subcategories.id],
    }),
    savingsGoal: one(savingsGoals, {
        fields: [transactions.savingsGoalId],
        references: [savingsGoals.id],
    }),
    incomeSource: one(incomeSources, {
        fields: [transactions.incomeSourceId],
        references: [incomeSources.id],
    }),
}));

// Types

export type UserModel = InferSelectModel<typeof User>;
export type NewUserModel = InferInsertModel<typeof User>;

export type BudgetPlanModel = InferSelectModel<typeof budgetPlans>;
export type NewBudgetPlanModel = InferInsertModel<typeof budgetPlans>;

export type IncomeSourceModel = InferSelectModel<typeof incomeSources>;
export type NewIncomeSourceModel = InferInsertModel<typeof incomeSources>;

export type CategoryModel = InferSelectModel<typeof categories>;
export type NewCategoryModel = InferInsertModel<typeof categories>;

export type SubcategoryModel = InferSelectModel<typeof subcategories>;
export type NewSubcategoryModel = InferInsertModel<typeof subcategories>;

export type SavingsGoalModel = InferSelectModel<typeof savingsGoals>;
export type NewSavingsGoalModel = InferInsertModel<typeof savingsGoals>;

export type TransactionModel = InferSelectModel<typeof transactions>;
export type NewTransactionModel = InferInsertModel<typeof transactions>;
