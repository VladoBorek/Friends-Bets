CREATE INDEX IF NOT EXISTS "wager_status_created_at_idx" ON "wager" ("status", "created_at");
CREATE INDEX IF NOT EXISTS "outcome_wager_idx" ON "outcome" ("wager_id");
CREATE INDEX IF NOT EXISTS "bet_user_idx" ON "bet" ("user_id");
CREATE INDEX IF NOT EXISTS "bet_outcome_idx" ON "bet" ("outcome_id");
CREATE INDEX IF NOT EXISTS "bet_created_at_idx" ON "bet" ("created_at");
CREATE INDEX IF NOT EXISTS "transaction_wallet_idx" ON "transaction" ("wallet_id");
CREATE INDEX IF NOT EXISTS "transaction_outcome_type_idx" ON "transaction" ("outcome_id", "type");
