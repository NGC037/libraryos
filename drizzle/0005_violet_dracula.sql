CREATE TABLE "holds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"edition_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"queue_position" integer NOT NULL,
	"fulfilled_copy_id" uuid,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"ready_at" timestamp,
	"pickup_expires_at" timestamp,
	"fulfilled_at" timestamp,
	"cancelled_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "holds" ADD CONSTRAINT "holds_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holds" ADD CONSTRAINT "holds_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holds" ADD CONSTRAINT "holds_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."editions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holds" ADD CONSTRAINT "holds_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holds" ADD CONSTRAINT "holds_fulfilled_copy_id_copies_id_fk" FOREIGN KEY ("fulfilled_copy_id") REFERENCES "public"."copies"("id") ON DELETE no action ON UPDATE no action;