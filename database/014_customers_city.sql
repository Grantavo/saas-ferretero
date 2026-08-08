-- ============================================================
-- 014: COLUMNA CIUDAD EN CLIENTES
-- Ejecutar en Supabase SQL Editor (nueva pestaña)
-- ============================================================

alter table customers add column if not exists city text;