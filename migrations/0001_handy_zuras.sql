CREATE TABLE "crypto_addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"network" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"updated_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "crypto_addresses_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
ALTER TABLE "crypto_addresses" ADD CONSTRAINT "crypto_addresses_updated_by_admins_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" DROP COLUMN "tax_percentage";--> statement-breakpoint
ALTER TABLE "clients" DROP COLUMN "tax_currency";--> statement-breakpoint
ALTER TABLE "clients" DROP COLUMN "tax_status";--> statement-breakpoint
ALTER TABLE "clients" DROP COLUMN "tax_wallet_address";--> statement-breakpoint
ALTER TABLE "clients" DROP COLUMN "tax_payment_proof";--> statement-breakpoint
ALTER TABLE "clients" DROP COLUMN "tax_set_by";--> statement-breakpoint
ALTER TABLE "clients" DROP COLUMN "tax_set_at";