CREATE TYPE "public"."transaction_type" AS ENUM('EXPENSE', 'SAVING');--> statement-breakpoint
CREATE TABLE "budget_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"month" varchar(7) NOT NULL,
	"user_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"max_budget" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"budget_plan_id" uuid NOT NULL,
	CONSTRAINT "categories_plan_name_unique" UNIQUE("budget_plan_id","name")
);
--> statement-breakpoint
CREATE TABLE "income_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"monthly_amount" numeric(12, 2) NOT NULL,
	"budget_plan_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "savings_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"target_amount" numeric(12, 2) NOT NULL,
	"deadline" date NOT NULL,
	"budget_plan_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subcategories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"limit" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "subcategories_category_name_unique" UNIQUE("category_id","name")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"date" date NOT NULL,
	"description" varchar(500),
	"type" "transaction_type" NOT NULL,
	"budget_plan_id" uuid NOT NULL,
	"category_id" uuid,
	"subcategory_id" uuid,
	"savings_goal_id" uuid
);
--> statement-breakpoint
CREATE TABLE "User" (
	"userId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "User_userId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"username" varchar(60) NOT NULL,
	"lastname" varchar(60) NOT NULL,
	"firstname" varchar(60) NOT NULL,
	"password" varchar(60) NOT NULL,
	"email" varchar(60) NOT NULL,
	"currentPlanId" uuid,
	CONSTRAINT "User_username_unique" UNIQUE("username"),
	CONSTRAINT "User_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "budget_plans" ADD CONSTRAINT "budget_plans_user_id_User_userId_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("userId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_budget_plan_id_budget_plans_id_fk" FOREIGN KEY ("budget_plan_id") REFERENCES "public"."budget_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_sources" ADD CONSTRAINT "income_sources_budget_plan_id_budget_plans_id_fk" FOREIGN KEY ("budget_plan_id") REFERENCES "public"."budget_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_budget_plan_id_budget_plans_id_fk" FOREIGN KEY ("budget_plan_id") REFERENCES "public"."budget_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_budget_plan_id_budget_plans_id_fk" FOREIGN KEY ("budget_plan_id") REFERENCES "public"."budget_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_subcategory_id_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_savings_goal_id_savings_goals_id_fk" FOREIGN KEY ("savings_goal_id") REFERENCES "public"."savings_goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_currentPlanId_budget_plans_id_fk" FOREIGN KEY ("currentPlanId") REFERENCES "public"."budget_plans"("id") ON DELETE set null ON UPDATE no action;
