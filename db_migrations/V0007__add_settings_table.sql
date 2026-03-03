CREATE TABLE IF NOT EXISTS t_p43528340_family_connect_netwo.settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO t_p43528340_family_connect_netwo.settings (key, value)
VALUES ('site_name', 'Альфа Семья')
ON CONFLICT (key) DO NOTHING;
