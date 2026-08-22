-- ════════════════════════════════════════════════════════════════════════
-- Categorias base — necessário para a app arrancar com opções no registo
-- rápido. Idempotente (on conflict), seguro correr mais do que uma vez.
-- Correr depois de schema.sql + policies.sql.
-- ════════════════════════════════════════════════════════════════════════

insert into public.categories (name, icon, color, is_default, sort_order) values
  ('Supermercado',      'ShoppingCart',    '#16a34a', true, 0),
  ('Farmácia',          'Pill',            '#dc2626', true, 1),
  ('Gasolina',          'Fuel',            '#ea580c', true, 2),
  ('Eletricidade',      'Zap',             '#eab308', true, 3),
  ('Gás',               'Flame',           '#f97316', true, 4),
  ('Água',              'Droplet',         '#0ea5e9', true, 5),
  ('Renda / Prestação', 'Home',            '#7c3aed', true, 6),
  ('Internet',          'Wifi',            '#2563eb', true, 7),
  ('Telemóvel',         'Smartphone',      '#4f46e5', true, 8),
  ('Restaurante',       'UtensilsCrossed', '#db2777', true, 9),
  ('Transportes',       'Bus',             '#0d9488', true, 10),
  ('Saúde',             'HeartPulse',      '#e11d48', true, 11),
  ('Lazer',             'Gamepad2',        '#9333ea', true, 12),
  ('Roupa',             'Shirt',           '#0891b2', true, 13),
  ('Educação',          'GraduationCap',   '#65a30d', true, 14),
  ('Outros',            'MoreHorizontal',  '#6b7280', true, 15)
on conflict (name) do nothing;
