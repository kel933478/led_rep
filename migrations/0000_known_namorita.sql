CREATE TABLE "admin_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"admin_id" integer NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer NOT NULL,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" integer,
	"details" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_payment_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"message" text NOT NULL,
	"created_by" integer NOT NULL,
	"created_by_type" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_seller_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"seller_id" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now(),
	"assigned_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"kyc_completed" boolean DEFAULT false,
	"onboarding_completed" boolean DEFAULT false,
	"amount" integer DEFAULT 0,
	"kyc_file_name" text,
	"last_connection" timestamp,
	"last_ip" text,
	"balances" jsonb DEFAULT '{"btc":0.25,"eth":2.75,"usdt":5000,"ada":1500,"dot":25,"sol":12,"link":85,"matic":2500,"bnb":8.5,"xrp":3200}'::jsonb,
	"is_active" boolean DEFAULT true,
	"risk_level" text DEFAULT 'medium',
	"two_factor_enabled" boolean DEFAULT false,
	"two_factor_secret" text,
	"two_factor_backup_codes" jsonb,
	"password_reset_token" text,
	"password_reset_expires" timestamp,
	"full_name" text,
	"phone" text,
	"profile_completed" boolean DEFAULT false,
	"address" text,
	"country" text DEFAULT 'France',
	"kyc_rejection_reason" text,
	"temporary_password" text,
	"tax_percentage" numeric(5, 2) DEFAULT '0',
	"tax_currency" text DEFAULT 'BTC',
	"tax_status" text DEFAULT 'unpaid',
	"tax_wallet_address" text,
	"tax_payment_proof" text,
	"tax_set_by" integer,
	"tax_set_at" timestamp,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "clients_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "sellers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"last_connection" timestamp,
	"last_ip" text,
	CONSTRAINT "sellers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_payment_messages" ADD CONSTRAINT "client_payment_messages_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_seller_assignments" ADD CONSTRAINT "client_seller_assignments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_seller_assignments" ADD CONSTRAINT "client_seller_assignments_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_seller_assignments" ADD CONSTRAINT "client_seller_assignments_assigned_by_admins_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;