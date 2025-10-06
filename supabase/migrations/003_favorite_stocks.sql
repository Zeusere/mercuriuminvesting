-- Tabla para almacenar acciones favoritas de los usuarios
CREATE TABLE IF NOT EXISTS favorite_stocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, symbol)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_favorite_stocks_user_id ON favorite_stocks(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_stocks_symbol ON favorite_stocks(symbol);

-- Habilitar Row Level Security
ALTER TABLE favorite_stocks ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
-- Los usuarios solo pueden ver sus propios favoritos
CREATE POLICY "Users can view their own favorite stocks"
  ON favorite_stocks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios solo pueden insertar sus propios favoritos
CREATE POLICY "Users can insert their own favorite stocks"
  ON favorite_stocks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios solo pueden eliminar sus propios favoritos
CREATE POLICY "Users can delete their own favorite stocks"
  ON favorite_stocks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comentarios
COMMENT ON TABLE favorite_stocks IS 'Almacena las acciones favoritas de cada usuario';
COMMENT ON COLUMN favorite_stocks.symbol IS 'Símbolo de la acción (ej: AAPL, MSFT)';
COMMENT ON COLUMN favorite_stocks.name IS 'Nombre de la empresa';
