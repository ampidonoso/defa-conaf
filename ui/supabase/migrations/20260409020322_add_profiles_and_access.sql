CREATE TABLE app_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  cargo text NOT NULL,
  iniciales text NOT NULL,
  codigo text NOT NULL UNIQUE,
  rol text NOT NULL CHECK (rol IN ('admin', 'editor', 'viewer')),
  color text DEFAULT '#059669',
  activo boolean DEFAULT true,
  ultimo_acceso timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES app_profiles(id) ON DELETE SET NULL,
  accion text NOT NULL,
  detalle text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_profiles_codigo ON app_profiles(codigo);
CREATE INDEX idx_access_log_profile ON access_log(profile_id);

ALTER TABLE app_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read profiles" ON app_profiles FOR SELECT USING (true);
CREATE POLICY "Public update profiles" ON app_profiles FOR UPDATE USING (true);
CREATE POLICY "Public insert log" ON access_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read log" ON access_log FOR SELECT USING (true);

INSERT INTO app_profiles (nombre, cargo, iniciales, codigo, rol, color) VALUES
  ('René Hernández', 'Director Regional', 'RH', '2025', 'admin', '#059669'),
  ('Analista DEFA', 'Analista Presupuestario', 'AP', '1234', 'editor', '#2563eb'),
  ('Consulta', 'Solo Lectura', 'CL', '0000', 'viewer', '#7c3aed');
