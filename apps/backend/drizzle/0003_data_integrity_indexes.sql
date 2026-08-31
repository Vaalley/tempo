UPDATE "users" SET "role" = 'USER' WHERE "role" IS NULL;--> statement-breakpoint
UPDATE "workspaces" SET "capacity" = 1 WHERE "capacity" < 1;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "bookings_user_id_idx" ON "bookings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bookings_workspace_time_idx" ON "bookings" USING btree ("workspace_id","start_at","end_at");--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_capacity_check" CHECK ("workspaces"."capacity" >= 1);
