CREATE TABLE "editions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_id" uuid NOT NULL,
	"format" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"publisher" text,
	"publication_year" integer,
	"isbn" text,
	"cover_image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "works" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"primary_author" text,
	"subjects" jsonb DEFAULT '[]'::jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"description" text,
	"reading_level" text,
	"visibility" text DEFAULT 'public' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "copies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"edition_id" uuid NOT NULL,
	"barcode" text NOT NULL,
	"condition" text DEFAULT 'good' NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "copies_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "copy_expected_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"copy_id" uuid NOT NULL,
	"shelf_location_id" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "copy_expected_locations_copy_id_unique" UNIQUE("copy_id")
);
--> statement-breakpoint
CREATE TABLE "copy_observed_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"copy_id" uuid NOT NULL,
	"shelf_location_id" uuid,
	"observed_at" timestamp DEFAULT now() NOT NULL,
	"method" text DEFAULT 'manual' NOT NULL,
	"confidence" integer
);
--> statement-breakpoint
CREATE TABLE "shelf_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"floor" text,
	"section" text,
	"aisle" text,
	"bay" text,
	"shelf" text,
	"position" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "editions" ADD CONSTRAINT "editions_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "works" ADD CONSTRAINT "works_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copies" ADD CONSTRAINT "copies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copies" ADD CONSTRAINT "copies_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copies" ADD CONSTRAINT "copies_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."editions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copy_expected_locations" ADD CONSTRAINT "copy_expected_locations_copy_id_copies_id_fk" FOREIGN KEY ("copy_id") REFERENCES "public"."copies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copy_expected_locations" ADD CONSTRAINT "copy_expected_locations_shelf_location_id_shelf_locations_id_fk" FOREIGN KEY ("shelf_location_id") REFERENCES "public"."shelf_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copy_observed_locations" ADD CONSTRAINT "copy_observed_locations_copy_id_copies_id_fk" FOREIGN KEY ("copy_id") REFERENCES "public"."copies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copy_observed_locations" ADD CONSTRAINT "copy_observed_locations_shelf_location_id_shelf_locations_id_fk" FOREIGN KEY ("shelf_location_id") REFERENCES "public"."shelf_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shelf_locations" ADD CONSTRAINT "shelf_locations_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;