-- Add missing DELETE and UPDATE policies for all balance tables
CREATE POLICY "Public delete balances" ON balances FOR DELETE USING (true);
CREATE POLICY "Public update balances" ON balances FOR UPDATE USING (true);

CREATE POLICY "Public delete oficinas" ON balance_oficinas FOR DELETE USING (true);
CREATE POLICY "Public update oficinas" ON balance_oficinas FOR UPDATE USING (true);

CREATE POLICY "Public delete programas" ON balance_programas FOR DELETE USING (true);
CREATE POLICY "Public update programas" ON balance_programas FOR UPDATE USING (true);

CREATE POLICY "Public delete items" ON balance_items FOR DELETE USING (true);
CREATE POLICY "Public update items" ON balance_items FOR UPDATE USING (true);

CREATE POLICY "Public delete alertas" ON balance_alertas FOR DELETE USING (true);
CREATE POLICY "Public update alertas" ON balance_alertas FOR UPDATE USING (true);

-- Add missing policies for app_profiles and access_log
CREATE POLICY "Public insert profiles" ON app_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete profiles" ON app_profiles FOR DELETE USING (true);
