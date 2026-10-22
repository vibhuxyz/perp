CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"username" varchar(255),
	"email" varchar(255) NOT NULL UNIQUE,
	"password" varchar(255) NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
    CREATE TYPE "order_status" AS ENUM('queued', 'open', 'filled', 'cancelled', 'partially_filled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "order_type" AS ENUM('LIMIT', 'MARKET');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "order_side" AS ENUM('LONG', 'SHORT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "market" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"symbol" varchar UNIQUE,
	"imageUrl" varchar
);

CREATE TABLE IF NOT EXISTS "orders" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"side" "order_side" NOT NULL,
	"marketId" integer NOT NULL REFERENCES "market"("id") ON DELETE CASCADE,
	"qty" integer NOT NULL,
	"filled_qty" integer NOT NULL,
	"price" integer NOT NULL,
	"equity" integer,
	"status" "order_status" NOT NULL,
	"order_type" "order_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);

CREATE TABLE IF NOT EXISTS "positions" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"market" text NOT NULL,
	"side" text NOT NULL,
	"quantity" numeric(30, 0) DEFAULT '0' NOT NULL,
	"margin" numeric(30, 0) DEFAULT '0' NOT NULL,
	"liquidation_price" numeric(30, 2),
	"average_price" numeric(30, 2),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_market_unique" UNIQUE("user_id", "market")
);

CREATE TABLE IF NOT EXISTS "collateral" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL UNIQUE,
	"available_balance" numeric(30, 0) DEFAULT '0' NOT NULL,
	"locked" numeric(30, 0) DEFAULT '0' NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
