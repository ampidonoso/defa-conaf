-- Balance reports (one per uploaded file)
CREATE TABLE balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo text NOT NULL,
  fecha_corte date,
  fecha_generacion timestamptz DEFAULT now(),
  total_presupuesto bigint NOT NULL DEFAULT 0,
  total_compromiso bigint NOT NULL DEFAULT 0,
  total_saldo bigint NOT NULL DEFAULT 0,
  pct_avance_global numeric(5,1) DEFAULT 0,
  total_rows int DEFAULT 0,
  total_items int DEFAULT 0,
  archivo_nombre text,
  created_at timestamptz DEFAULT now()
);

-- Oficinas within a balance (Regional, Valdivia, Panguipulli, Ranco)
CREATE TABLE balance_oficinas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  balance_id uuid NOT NULL REFERENCES balances(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  total_presupuesto bigint NOT NULL DEFAULT 0,
  total_compromiso bigint NOT NULL DEFAULT 0,
  total_saldo bigint NOT NULL DEFAULT 0,
  pct_avance numeric(5,1) DEFAULT 0
);

-- Programas within an oficina
CREATE TABLE balance_programas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  balance_id uuid NOT NULL REFERENCES balances(id) ON DELETE CASCADE,
  oficina_id uuid NOT NULL REFERENCES balance_oficinas(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  nombre text NOT NULL,
  presupuesto bigint NOT NULL DEFAULT 0,
  compromiso bigint NOT NULL DEFAULT 0,
  saldo bigint NOT NULL DEFAULT 0,
  pct_avance numeric(5,1) DEFAULT 0
);

-- Line items (ByS / Viatico) within a programa
CREATE TABLE balance_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  balance_id uuid NOT NULL REFERENCES balances(id) ON DELETE CASCADE,
  programa_id uuid NOT NULL REFERENCES balance_programas(id) ON DELETE CASCADE,
  folio int,
  titulo text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('bys', 'viatico')),
  presupuesto bigint NOT NULL DEFAULT 0,
  compromiso bigint NOT NULL DEFAULT 0,
  saldo bigint NOT NULL DEFAULT 0,
  pct_avance numeric(5,1) DEFAULT 0,
  ue int,
  prog text,
  subt text,
  centro_costo text,
  sigfe int
);

-- Alertas generated from a balance
CREATE TABLE balance_alertas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  balance_id uuid NOT NULL REFERENCES balances(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('sobregirado', 'alto', 'bajo')),
  programa text NOT NULL,
  folio int,
  titulo text NOT NULL,
  pct numeric(5,1) NOT NULL,
  mensaje text NOT NULL
);

-- Indexes
CREATE INDEX idx_oficinas_balance ON balance_oficinas(balance_id);
CREATE INDEX idx_programas_balance ON balance_programas(balance_id);
CREATE INDEX idx_programas_oficina ON balance_programas(oficina_id);
CREATE INDEX idx_items_balance ON balance_items(balance_id);
CREATE INDEX idx_items_programa ON balance_items(programa_id);
CREATE INDEX idx_alertas_balance ON balance_alertas(balance_id);

-- Enable RLS
ALTER TABLE balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_oficinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_programas ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_alertas ENABLE ROW LEVEL SECURITY;

-- Public read/insert policies (no auth required for now)
CREATE POLICY "Public read balances" ON balances FOR SELECT USING (true);
CREATE POLICY "Public insert balances" ON balances FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read oficinas" ON balance_oficinas FOR SELECT USING (true);
CREATE POLICY "Public insert oficinas" ON balance_oficinas FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read programas" ON balance_programas FOR SELECT USING (true);
CREATE POLICY "Public insert programas" ON balance_programas FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read items" ON balance_items FOR SELECT USING (true);
CREATE POLICY "Public insert items" ON balance_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read alertas" ON balance_alertas FOR SELECT USING (true);
CREATE POLICY "Public insert alertas" ON balance_alertas FOR INSERT WITH CHECK (true);
