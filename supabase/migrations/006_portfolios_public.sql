-- Añadir columna is_public a portfolios
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Índice para portfolios públicos
CREATE INDEX IF NOT EXISTS idx_portfolios_public ON portfolios(is_public) WHERE is_public = true;

-- Actualizar RLS para permitir ver portfolios públicos
DROP POLICY IF EXISTS "Users can view their own portfolios" ON portfolios;

CREATE POLICY "Users can view their own portfolios and public portfolios" ON portfolios
  FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

COMMENT ON COLUMN portfolios.is_public IS 'Si el portfolio es visible públicamente en la red social';

