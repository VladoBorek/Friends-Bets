CREATE INDEX "bet_user_idx" ON "bet" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bet_outcome_idx" ON "bet" USING btree ("outcome_id");--> statement-breakpoint
CREATE INDEX "bet_created_at_idx" ON "bet" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "outcome_wager_idx" ON "outcome" USING btree ("wager_id");--> statement-breakpoint
CREATE INDEX "transaction_wallet_idx" ON "transaction" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "transaction_outcome_type_idx" ON "transaction" USING btree ("outcome_id","type");--> statement-breakpoint
CREATE INDEX "wager_status_created_at_idx" ON "wager" USING btree ("status","created_at");