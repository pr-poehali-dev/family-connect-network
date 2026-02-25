ALTER TABLE t_p43528340_family_connect_netwo.chats
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_id INTEGER REFERENCES t_p43528340_family_connect_netwo.users(id);

UPDATE t_p43528340_family_connect_netwo.chats
  SET admin_id = created_by
  WHERE admin_id IS NULL AND created_by IS NOT NULL;
