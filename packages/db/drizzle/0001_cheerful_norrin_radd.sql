CREATE TYPE "public"."order_status" AS ENUM('queued', 'open', 'filled', 'cancelled', 'partially_filled');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('LIMIT', 'MARKET');--> statement-breakpoint
CREATE TYPE "public"."order_side" AS ENUM('LONG', 'SHORT');--> statement-breakpoint
CREATE TABLE "orders" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "orders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"side" "order_side" NOT NULL,
	"marketId" integer NOT NULL,
	"qty" integer NOT NULL,
	"filled_qty" integer NOT NULL,
	"price" integer NOT NULL,
	"equity" integer,
	"status" "order_status" NOT NULL,
	"order_type" "order_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"market" text NOT NULL,
	"side" text NOT NULL,
	"quantity" numeric(30, 0) DEFAULT '0' NOT NULL,
	"margin" numeric(30, 0) DEFAULT '0' NOT NULL,
	"liquidation_price" numeric(30, 2),
	"average_price" numeric(30, 2),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_market_unique" UNIQUE("user_id","market")
);
--> statement-breakpoint
CREATE TABLE "collateral" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"available_balance" numeric(30, 0) DEFAULT '0' NOT NULL,
	"locked" numeric(30, 0) DEFAULT '0' NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "collateral_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "market" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "market_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"symbol" varchar,
	"imageUrl" varchar,
	CONSTRAINT "market_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "username" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_marketId_market_id_fk" FOREIGN KEY ("marketId") REFERENCES "public"."market"("id") ON DELETE cascade ON UPDATE no action;