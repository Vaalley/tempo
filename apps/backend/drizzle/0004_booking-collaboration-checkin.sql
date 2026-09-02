CREATE TYPE "public"."booking_visibility" AS ENUM('PUBLIC', 'PRIVATE');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED');--> statement-breakpoint
CREATE TYPE "public"."participant_role" AS ENUM('OWNER', 'GUEST');--> statement-breakpoint
CREATE TABLE "booking_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "participant_role" DEFAULT 'GUEST' NOT NULL,
	"invitation_status" "invitation_status" DEFAULT 'PENDING' NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	"checked_in_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "booking_qr_tokens" (
	"booking_id" uuid PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "visibility" "booking_visibility" DEFAULT 'PRIVATE' NOT NULL;--> statement-breakpoint
ALTER TABLE "booking_participants" ADD CONSTRAINT "booking_participants_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_participants" ADD CONSTRAINT "booking_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_qr_tokens" ADD CONSTRAINT "booking_qr_tokens_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "booking_participants_booking_user_unique" ON "booking_participants" USING btree ("booking_id","user_id");--> statement-breakpoint
CREATE INDEX "booking_participants_user_status_idx" ON "booking_participants" USING btree ("user_id","invitation_status");--> statement-breakpoint
CREATE INDEX "booking_participants_booking_status_idx" ON "booking_participants" USING btree ("booking_id","invitation_status");--> statement-breakpoint
INSERT INTO "booking_participants" (
	"booking_id",
	"user_id",
	"role",
	"invitation_status",
	"responded_at"
)
SELECT
	"id",
	"user_id",
	'OWNER',
	'ACCEPTED',
	COALESCE("created_at", now())
FROM "bookings"
ON CONFLICT ("booking_id", "user_id") DO NOTHING;
