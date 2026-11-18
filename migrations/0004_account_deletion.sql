CREATE TABLE account_deletions (
 user_id TEXT PRIMARY KEY NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending',
 created TEXT NOT NULL,
 completed TEXT,
 attempts INTEGER NOT NULL DEFAULT 0
);
-- Keep in-flight requests from recreating an account being deleted.
CREATE TRIGGER deletion_profiles_insert BEFORE INSERT ON profiles WHEN EXISTS (SELECT 1 FROM account_deletions WHERE user_id=NEW.user_id) BEGIN SELECT RAISE(ABORT,'Account deletion in progress'); END;
CREATE TRIGGER deletion_profiles_update BEFORE UPDATE ON profiles WHEN EXISTS (SELECT 1 FROM account_deletions WHERE user_id=NEW.user_id) BEGIN SELECT RAISE(ABORT,'Account deletion in progress'); END;
CREATE TRIGGER deletion_members_insert BEFORE INSERT ON members WHEN EXISTS (SELECT 1 FROM account_deletions WHERE user_id=NEW.user_id) BEGIN SELECT RAISE(ABORT,'Account deletion in progress'); END;
CREATE TRIGGER deletion_members_update BEFORE UPDATE ON members WHEN EXISTS (SELECT 1 FROM account_deletions WHERE user_id=NEW.user_id) BEGIN SELECT RAISE(ABORT,'Account deletion in progress'); END;
CREATE TRIGGER deletion_reservations_insert BEFORE INSERT ON reservations WHEN EXISTS (SELECT 1 FROM account_deletions WHERE user_id=NEW.user_id) BEGIN SELECT RAISE(ABORT,'Account deletion in progress'); END;
CREATE TRIGGER deletion_reservations_update BEFORE UPDATE ON reservations WHEN EXISTS (SELECT 1 FROM account_deletions WHERE user_id=NEW.user_id) BEGIN SELECT RAISE(ABORT,'Account deletion in progress'); END;
CREATE TRIGGER deletion_notifications_insert BEFORE INSERT ON notifications WHEN EXISTS (SELECT 1 FROM account_deletions WHERE user_id=NEW.user_id) BEGIN SELECT RAISE(ABORT,'Account deletion in progress'); END;
CREATE TRIGGER deletion_notifications_update BEFORE UPDATE ON notifications WHEN EXISTS (SELECT 1 FROM account_deletions WHERE user_id=NEW.user_id) BEGIN SELECT RAISE(ABORT,'Account deletion in progress'); END;
CREATE TRIGGER deletion_listings_insert BEFORE INSERT ON listings WHEN EXISTS (SELECT 1 FROM account_deletions WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'Account deletion in progress'); END;
CREATE TRIGGER deletion_listings_update BEFORE UPDATE ON listings WHEN EXISTS (SELECT 1 FROM account_deletions WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'Account deletion in progress'); END;
CREATE TRIGGER deletion_organizations_insert BEFORE INSERT ON organizations WHEN EXISTS (SELECT 1 FROM account_deletions WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'Account deletion in progress'); END;
CREATE TRIGGER deletion_organizations_update BEFORE UPDATE ON organizations WHEN EXISTS (SELECT 1 FROM account_deletions WHERE user_id=NEW.owner) BEGIN SELECT RAISE(ABORT,'Account deletion in progress'); END;
