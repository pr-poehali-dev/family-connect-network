ALTER TABLE t_p43528340_family_connect_netwo.messages
  ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;

ALTER TABLE t_p43528340_family_connect_netwo.posts
  ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;
