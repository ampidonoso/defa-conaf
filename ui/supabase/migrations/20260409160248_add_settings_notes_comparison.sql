-- App settings (alert thresholds, display preferences)
CREATE TABLE app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}',
  updated_by uuid REFERENCES app_profiles(id),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public all settings" ON app_settings FOR ALL USING (true) WITH CHECK (true);

-- Default alert thresholds
INSERT INTO app_settings (key, value) VALUES
  ('alert_thresholds', '{"sobregirado": 100, "critico": 90, "alto": 80, "sub_ejecutado": 30}'),
  ('display_preferences', '{"default_format": "pesos", "default_oficina": "consolidado", "show_empty_programs": false}');

-- Notes per program/balance (comments, observations)
CREATE TABLE balance_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  balance_id uuid NOT NULL REFERENCES balances(id) ON DELETE CASCADE,
  programa_codigo text,
  folio int,
  nota text NOT NULL,
  tipo text NOT NULL DEFAULT 'observacion' CHECK (tipo IN ('observacion', 'accion', 'alerta_manual', 'resuelto')),
  created_by uuid REFERENCES app_profiles(id),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES app_profiles(id)
);

CREATE INDEX idx_notes_balance ON balance_notes(balance_id);
CREATE INDEX idx_notes_programa ON balance_notes(programa_codigo);

ALTER TABLE balance_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public all notes" ON balance_notes FOR ALL USING (true) WITH CHECK (true);

-- Modification log (tracks data changes beyond uploads)
CREATE TABLE modification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  balance_id uuid REFERENCES balances(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES app_profiles(id),
  accion text NOT NULL,
  entidad text NOT NULL,
  entidad_id text,
  detalle jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_modlog_balance ON modification_log(balance_id);
ALTER TABLE modification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public all modlog" ON modification_log FOR ALL USING (true) WITH CHECK (true);
