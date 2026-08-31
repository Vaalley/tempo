CREATE EXTENSION IF NOT EXISTS "btree_gist";--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_valid_time_range" CHECK ("end_at" > "start_at");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_workspace_time_exclusion" EXCLUDE USING gist (
	"workspace_id" WITH =,
	tsrange("start_at", "end_at", '[)') WITH &&
);
