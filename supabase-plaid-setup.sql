-- ============================================
-- PLAID INTEGRATION - DATABASE SCHEMA
-- ============================================
-- Execute this in Supabase SQL Editor

-- 1. Tabla para conexiones de Plaid (cuentas de brokerage conectadas)
CREATE TABLE IF NOT EXISTS plaid_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL UNIQUE,              -- Plaid item_id (identificador único de la conexión)
  access_token TEXT NOT NULL,                -- Token de acceso de Plaid (DEBE estar encriptado)
  institution_id TEXT,                       -- ID de la institución (ej: ins_3)
  institution_name TEXT,                     -- Nombre del broker (ej: "Robinhood", "Fidelity")
  account_type TEXT,                         -- Tipo: 'brokerage', 'ira', '401k', 'roth'
  status TEXT DEFAULT 'active',              -- 'active', 'disconnected', 'error', 'reauth_required'
  last_synced_at TIMESTAMP WITH TIME ZONE,   -- Última sincronización exitosa
  error_message TEXT,                        -- Mensaje de error si status = 'error'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices
  CONSTRAINT unique_user_item UNIQUE(user_id, item_id)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_plaid_connections_user_id ON plaid_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_connections_status ON plaid_connections(status);

-- 2. Tabla para cuentas individuales (un item puede tener múltiples cuentas)
CREATE TABLE IF NOT EXISTS plaid_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID NOT NULL REFERENCES plaid_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,                  -- Plaid account_id
  account_name TEXT,                         -- Nombre de la cuenta (ej: "Brokerage Account")
  account_mask TEXT,                         -- Últimos 4 dígitos
  account_type TEXT,                         -- 'brokerage', 'ira', '401k'
  account_subtype TEXT,                      -- Subtipo específico
  balance_current DECIMAL(15, 2),            -- Balance actual
  balance_available DECIMAL(15, 2),          -- Balance disponible
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_connection_account UNIQUE(connection_id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_plaid_accounts_user_id ON plaid_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_accounts_connection_id ON plaid_accounts(connection_id);

-- 3. Tabla para holdings (posiciones actuales en cada cuenta)
CREATE TABLE IF NOT EXISTS real_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES plaid_accounts(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES plaid_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Información del security
  security_id TEXT NOT NULL,                 -- Plaid security_id
  symbol TEXT,                               -- Ticker (ej: "AAPL")
  name TEXT,                                 -- Nombre completo (ej: "Apple Inc.")
  type TEXT,                                 -- 'equity', 'etf', 'mutual fund', etc.
  
  -- Información de la posición
  quantity DECIMAL(15, 6),                   -- Cantidad de acciones/unidades
  price DECIMAL(15, 4),                      -- Precio actual por unidad
  value DECIMAL(15, 2),                      -- Valor total (quantity * price)
  cost_basis DECIMAL(15, 2),                 -- Costo base (lo que se pagó originalmente)
  
  -- Información adicional
  institution_price DECIMAL(15, 4),          -- Precio según la institución
  institution_value DECIMAL(15, 2),          -- Valor según la institución
  iso_currency_code TEXT DEFAULT 'USD',
  
  -- Metadata
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_account_security UNIQUE(account_id, security_id)
);

CREATE INDEX IF NOT EXISTS idx_real_holdings_user_id ON real_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_real_holdings_account_id ON real_holdings(account_id);
CREATE INDEX IF NOT EXISTS idx_real_holdings_symbol ON real_holdings(symbol);
CREATE INDEX IF NOT EXISTS idx_real_holdings_synced_at ON real_holdings(synced_at);

-- 4. Tabla para transacciones históricas
CREATE TABLE IF NOT EXISTS plaid_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES plaid_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  transaction_id TEXT NOT NULL,              -- Plaid transaction_id
  security_id TEXT,                          -- Plaid security_id
  symbol TEXT,                               -- Ticker
  name TEXT,                                 -- Nombre del security
  
  type TEXT,                                 -- 'buy', 'sell', 'dividend', 'fee', etc.
  subtype TEXT,                              -- Subtipo específico
  quantity DECIMAL(15, 6),                   -- Cantidad
  price DECIMAL(15, 4),                      -- Precio por unidad
  amount DECIMAL(15, 2),                     -- Monto total
  fees DECIMAL(15, 2),                       -- Comisiones
  
  date DATE NOT NULL,                        -- Fecha de la transacción
  currency TEXT DEFAULT 'USD',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_transaction UNIQUE(account_id, transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_plaid_transactions_user_id ON plaid_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_transactions_account_id ON plaid_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_plaid_transactions_date ON plaid_transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_plaid_transactions_symbol ON plaid_transactions(symbol);

-- 5. Tabla para análisis AI de portfolios reales
CREATE TABLE IF NOT EXISTS real_portfolio_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES plaid_connections(id) ON DELETE CASCADE,
  account_id UUID REFERENCES plaid_accounts(id) ON DELETE CASCADE,
  
  -- Resultados del análisis
  analysis_data JSONB NOT NULL,             -- Análisis completo de la AI
  recommendations JSONB,                     -- Recomendaciones específicas
  
  -- Scores
  overall_score DECIMAL(3, 1),              -- Score general (1-10)
  risk_score DECIMAL(3, 1),                 -- Nivel de riesgo (1-10)
  diversification_score DECIMAL(3, 1),      -- Diversificación (1-10)
  
  -- Metadata
  total_value DECIMAL(15, 2),               -- Valor total del portfolio en el momento del análisis
  holdings_count INTEGER,                   -- Número de posiciones
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_real_portfolio_analyses_user_id ON real_portfolio_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_real_portfolio_analyses_created_at ON real_portfolio_analyses(created_at DESC);

-- 6. Tabla para logs de sincronización
CREATE TABLE IF NOT EXISTS plaid_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID NOT NULL REFERENCES plaid_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  sync_type TEXT NOT NULL,                   -- 'manual', 'automatic', 'webhook'
  status TEXT NOT NULL,                      -- 'success', 'error', 'partial'
  
  holdings_synced INTEGER DEFAULT 0,
  transactions_synced INTEGER DEFAULT 0,
  
  error_message TEXT,
  duration_ms INTEGER,                       -- Duración en milisegundos
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plaid_sync_logs_connection_id ON plaid_sync_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_plaid_sync_logs_created_at ON plaid_sync_logs(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE plaid_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_portfolio_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_sync_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para plaid_connections
CREATE POLICY "Users can view their own connections" ON plaid_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connections" ON plaid_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections" ON plaid_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections" ON plaid_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para plaid_accounts
CREATE POLICY "Users can view their own accounts" ON plaid_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts" ON plaid_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts" ON plaid_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts" ON plaid_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para real_holdings
CREATE POLICY "Users can view their own holdings" ON real_holdings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own holdings" ON real_holdings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own holdings" ON real_holdings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own holdings" ON real_holdings
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para plaid_transactions
CREATE POLICY "Users can view their own transactions" ON plaid_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON plaid_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para real_portfolio_analyses
CREATE POLICY "Users can view their own analyses" ON real_portfolio_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses" ON real_portfolio_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses" ON real_portfolio_analyses
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para plaid_sync_logs
CREATE POLICY "Users can view their own sync logs" ON plaid_sync_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync logs" ON plaid_sync_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_plaid_connections_updated_at BEFORE UPDATE ON plaid_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plaid_accounts_updated_at BEFORE UPDATE ON plaid_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_real_holdings_updated_at BEFORE UPDATE ON real_holdings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_real_portfolio_analyses_updated_at BEFORE UPDATE ON real_portfolio_analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS ÚTILES
-- ============================================

-- Vista para resumen de portfolios reales por usuario
CREATE OR REPLACE VIEW user_real_portfolio_summary AS
SELECT 
  u.id as user_id,
  u.email,
  COUNT(DISTINCT pc.id) as connected_accounts,
  COUNT(DISTINCT rh.id) as total_holdings,
  SUM(rh.value) as total_portfolio_value,
  MAX(pc.last_synced_at) as last_sync,
  COUNT(CASE WHEN pc.status = 'active' THEN 1 END) as active_connections,
  COUNT(CASE WHEN pc.status = 'error' THEN 1 END) as error_connections
FROM auth.users u
LEFT JOIN plaid_connections pc ON u.id = pc.user_id
LEFT JOIN real_holdings rh ON u.id = rh.user_id
GROUP BY u.id, u.email;

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE plaid_connections IS 'Conexiones de usuarios con sus cuentas de brokerage a través de Plaid';
COMMENT ON TABLE plaid_accounts IS 'Cuentas individuales dentro de cada conexión de Plaid';
COMMENT ON TABLE real_holdings IS 'Holdings (posiciones) actuales en cuentas reales de brokerage';
COMMENT ON TABLE plaid_transactions IS 'Historial de transacciones de compra/venta en cuentas reales';
COMMENT ON TABLE real_portfolio_analyses IS 'Análisis generados por AI de portfolios reales';
COMMENT ON TABLE plaid_sync_logs IS 'Logs de sincronizaciones con Plaid para debugging';

-- ============================================
-- DATOS DE EJEMPLO (OPCIONAL - SOLO PARA DEV)
-- ============================================

-- Descomentar para insertar datos de prueba
-- INSERT INTO plaid_connections (user_id, item_id, access_token, institution_name, account_type, status)
-- VALUES (
--   (SELECT id FROM auth.users LIMIT 1),
--   'test_item_123',
--   'access-sandbox-test-token',
--   'Robinhood',
--   'brokerage',
--   'active'
-- );

