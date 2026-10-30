-- Complete Cloudflare D1 Schema & Seed for Imperio Cones / Mr. Cone
DROP VIEW IF EXISTS os_public;
DROP TABLE IF EXISTS page_contents;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS customer_order_items;
DROP TABLE IF EXISTS customer_orders;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS campaigns;
DROP TABLE IF EXISTS testimonials;
DROP TABLE IF EXISTS site_media;
DROP TABLE IF EXISTS site_settings;
DROP TABLE IF EXISTS secure_settings;
DROP TABLE IF EXISTS page_sections;
DROP TABLE IF EXISTS gallery_filters;
DROP TABLE IF EXISTS gallery_photos;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS message_templates;
DROP TABLE IF EXISTS client_purchases;
DROP TABLE IF EXISTS client_messages;
DROP TABLE IF EXISTS client_match_suggestions;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS agenda_events;
DROP TABLE IF EXISTS shopping_list;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS wishlist;
DROP TABLE IF EXISTS contact_messages;
DROP TABLE IF EXISTS newsletter_subscribers;
DROP TABLE IF EXISTS email_send_log;
DROP TABLE IF EXISTS email_send_state;
DROP TABLE IF EXISTS email_unsubscribe_tokens;
DROP TABLE IF EXISTS suppressed_emails;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS storage_objects;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  last_sign_in_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE user_roles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL DEFAULT 0.0,
  price_display TEXT NOT NULL DEFAULT 'R$ 0,00',
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'Personalizados',
  featured INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  allow_direct_purchase INTEGER NOT NULL DEFAULT 1,
  stripe_price_id TEXT,
  weight_grams INTEGER NOT NULL DEFAULT 300,
  height_cm REAL NOT NULL DEFAULT 6,
  width_cm REAL NOT NULL DEFAULT 11,
  length_cm REAL NOT NULL DEFAULT 16,
  material TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE product_images (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  badge TEXT,
  gradient_from TEXT NOT NULL DEFAULT '345 40% 65%',
  gradient_to TEXT NOT NULL DEFAULT '38 60% 55%',
  icon TEXT NOT NULL DEFAULT 'heart',
  active INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE testimonials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  text TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  display_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE site_media (
  key TEXT PRIMARY KEY,
  page TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'image',
  url TEXT,
  meta TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE site_settings (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE secure_settings (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE page_sections (
  id TEXT PRIMARY KEY,
  page_key TEXT NOT NULL,
  section_key TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE gallery_filters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE gallery_photos (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_percent INTEGER NOT NULL DEFAULT 10,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE message_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  template TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  produto TEXT,
  mensagem TEXT,
  status TEXT NOT NULL DEFAULT 'novo',
  status_history TEXT NOT NULL DEFAULT '[]',
  tracking_code TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE customer_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  client_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_provider TEXT DEFAULT 'mercadopago',
  mp_payment_id TEXT,
  mp_preference_id TEXT,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'brl',
  coupon_code TEXT,
  shipping_address TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  whatsapp_paid_notified_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE customer_order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT,
  product_name TEXT NOT NULL,
  product_image TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_cents INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  document TEXT,
  document_type TEXT,
  birthday TEXT,
  cep TEXT,
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  address TEXT,
  notes TEXT,
  is_vip INTEGER NOT NULL DEFAULT 0,
  last_purchase_date TEXT,
  last_message_date TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE client_purchases (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  product TEXT NOT NULL,
  amount REAL DEFAULT 0,
  purchase_date TEXT DEFAULT (date('now')),
  notes TEXT,
  agenda_event_id TEXT,
  customer_order_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE client_messages (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  summary TEXT NOT NULL,
  message_date TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE client_match_suggestions (
  id TEXT PRIMARY KEY,
  customer_order_id TEXT,
  candidate_client_id TEXT,
  created_client_id TEXT,
  score INTEGER,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  resolved_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE agenda_events (
  id TEXT PRIMARY KEY,
  order_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date TEXT NOT NULL,
  end_date TEXT,
  production_start_date TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  tipo TEXT NOT NULL DEFAULT 'encomenda',
  color TEXT,
  valor REAL,
  produto TEXT,
  client_id TEXT,
  client_name TEXT,
  phone TEXT,
  email TEXT,
  endereco TEXT,
  payment_method TEXT,
  shipping_carrier TEXT,
  notes TEXT,
  customer_order_id TEXT,
  mp_preference_id TEXT,
  mp_init_point TEXT,
  mp_payment_status TEXT,
  mp_payment_id TEXT,
  mp_paid_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE shopping_list (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  quantity TEXT,
  category TEXT,
  notes TEXT,
  done INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  name TEXT,
  details TEXT,
  customer_order_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE wishlist (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE contact_messages (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  assunto TEXT,
  mensagem TEXT NOT NULL,
  lida INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE newsletter_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE email_send_log (
  id TEXT PRIMARY KEY,
  message_id TEXT,
  recipient_email TEXT NOT NULL,
  template_name TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE email_send_state (
  id INTEGER PRIMARY KEY,
  batch_size INTEGER NOT NULL DEFAULT 10,
  send_delay_ms INTEGER NOT NULL DEFAULT 200,
  auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15,
  transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60,
  retry_after_until TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE email_unsubscribe_tokens (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  used_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE suppressed_emails (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  reason TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE storage_objects (
  id TEXT PRIMARY KEY,
  bucket TEXT NOT NULL,
  name TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  data_base64 TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(bucket, name)
);

CREATE VIEW os_public AS
SELECT
  id, title, status, tipo, scheduled_date, end_date,
  valor, produto, client_name, endereco, payment_method, notes, created_at
FROM agenda_events;

INSERT INTO users (id, email, password_hash, name, role, last_sign_in_at, created_at, updated_at) VALUES ('78d7aa1f-8a0b-45eb-a35b-82a86e202e25', 'contato@amaryllisnaturais.com.br', 'vinicius', 'Admin Amaryllis', 'admin', datetime('now'), '2026-05-28T18:32:15.000Z', datetime('now'));
INSERT INTO user_roles (id, user_id, role) VALUES ('7928043b-d486-421b-b15e-e07104d31d6e', '78d7aa1f-8a0b-45eb-a35b-82a86e202e25', 'admin');
INSERT INTO categories (id, name, display_order, active, created_at) VALUES ('cat-essential', 'Essential Nutrition', 1, 1, '2026-06-01T10:00:00.000Z');
INSERT INTO categories (id, name, display_order, active, created_at) VALUES ('cat-suplementos', 'Suplementos & Proteínas', 2, 1, '2026-06-01T10:00:00.000Z');
INSERT INTO categories (id, name, display_order, active, created_at) VALUES ('cat-sem-gluten', 'Sem Glúten & Sem Lactose', 3, 1, '2026-06-01T10:00:00.000Z');
INSERT INTO categories (id, name, display_order, active, created_at) VALUES ('cat-organicos', 'Orgânicos & Integrais', 4, 1, '2026-06-01T10:00:00.000Z');
INSERT INTO categories (id, name, display_order, active, created_at) VALUES ('cat-fitoterapicos', 'Fitoterápicos & Chás', 5, 1, '2026-06-01T10:00:00.000Z');
INSERT INTO categories (id, name, display_order, active, created_at) VALUES ('cat-granel', 'Granel & Castanhas', 6, 1, '2026-06-01T10:00:00.000Z');
INSERT INTO products (id, name, description, price, price_display, image_url, category, featured, active, allow_direct_purchase, stripe_price_id, weight_grams, height_cm, width_cm, length_cm, created_at, updated_at) VALUES ('prod-cacao-whey-essential', 'Cacao Whey Essential Nutrition — 450g', 'Combinação nobre de Whey Protein Hidrolisado e Isolado com cacau gourmet 100% puro, peptídeos de colágeno e adoçantes naturais (stevia e taumatina). Zero glúten, zero lactose e zero açúcar.', 229.0, 'R$ 229,00', 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=1000&q=85', 'Essential Nutrition', 1, 1, 1, NULL, 450, 18, 12, 12, '2026-06-01T10:00:00.000Z', '2026-06-01T10:00:00.000Z');
INSERT INTO products (id, name, description, price, price_display, image_url, category, featured, active, allow_direct_purchase, stripe_price_id, weight_grams, height_cm, width_cm, length_cm, created_at, updated_at) VALUES ('prod-collagen-skin-essential', 'Collagen Skin Essential Nutrition — 330g', 'Peptídeos bioativos de colágeno Verisol + ácido ortosilícico estabilizado + vitaminas A, C, E e biotina. Sabor Cranberry ou Neutro. Sem glúten, sem lactose e sem adição de açúcares.', 215.0, 'R$ 215,00', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=85', 'Essential Nutrition', 1, 1, 1, NULL, 330, 16, 11, 11, '2026-06-01T10:00:00.000Z', '2026-06-01T10:00:00.000Z');
INSERT INTO products (id, name, description, price, price_display, image_url, category, featured, active, allow_direct_purchase, stripe_price_id, weight_grams, height_cm, width_cm, length_cm, created_at, updated_at) VALUES ('prod-creatina-creapure', 'Creatina Monohidratada 100% Pura — 300g', 'Creatina micronizada de altíssima pureza para força muscular, foco cognitivo e longevidade. Zero glúten, zero lactose, vegana e sem aditivos.', 169.9, 'R$ 169,90', 'https://images.unsplash.com/photo-1579722820308-d74e571900a9?auto=format&fit=crop&w=1000&q=85', 'Suplementos & Proteínas', 1, 1, 1, NULL, 300, 14, 10, 10, '2026-06-01T10:00:00.000Z', '2026-06-01T10:00:00.000Z');
INSERT INTO products (id, name, description, price, price_display, image_url, category, featured, active, allow_direct_purchase, stripe_price_id, weight_grams, height_cm, width_cm, length_cm, created_at, updated_at) VALUES ('prod-pao-sem-gluten-multigraos', 'Pão Artesanal Sem Glúten & Sem Lactose Multigrãos — 400g', 'Pão macio elaborado com farinha de amêndoas, linhaça dourada, sementes de girassol e chia. Certificação segura sem glúten e zero lácteos — referência no guia Guindy Campinas.', 28.9, 'R$ 28,90', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1000&q=85', 'Sem Glúten & Sem Lactose', 1, 1, 1, NULL, 400, 10, 12, 22, '2026-06-01T10:00:00.000Z', '2026-06-01T10:00:00.000Z');
INSERT INTO products (id, name, description, price, price_display, image_url, category, featured, active, allow_direct_purchase, stripe_price_id, weight_grams, height_cm, width_cm, length_cm, created_at, updated_at) VALUES ('prod-mix-castanhas-nobres', 'Mix de Castanhas Nobres Assadas Sem Sal — 500g', 'Seleção premium de amêndoas, castanha-de-caju W1, castanha-do-pará, nozes chilenas e macadâmias crocantes. Rico em selênio, magnésio e gorduras boas.', 64.9, 'R$ 64,90', 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=1000&q=85', 'Granel & Castanhas', 1, 1, 1, NULL, 500, 18, 14, 8, '2026-06-01T10:00:00.000Z', '2026-06-01T10:00:00.000Z');
INSERT INTO products (id, name, description, price, price_display, image_url, category, featured, active, allow_direct_purchase, stripe_price_id, weight_grams, height_cm, width_cm, length_cm, created_at, updated_at) VALUES ('prod-blend-chas-fitoterapicos', 'Kit Infusões Botânicas & Fitoterápicas Calm & Digest — 150g', 'Seleção de ervas medicinais integrais: camomila flor inteira, melissa, funcho doce, hortelã-pimenta e cúrcuma. Auxilia na digestão leve e no sono reparador.', 39.9, 'R$ 39,90', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1000&q=85', 'Fitoterápicos & Chás', 1, 1, 1, NULL, 150, 15, 12, 8, '2026-06-01T10:00:00.000Z', '2026-06-01T10:00:00.000Z');
INSERT INTO campaigns (id, title, subtitle, badge, gradient_from, gradient_to, icon, active, display_order, created_at, updated_at) VALUES ('camp-essential', 'Parceira Oficial Essential Nutrition', 'Toda a linha de proteínas, colágenos e funcionais à pronta-entrega no Guanabara', 'Oficial', '142 33% 29%', '38 58% 46%', 'flame', 1, 1, '2026-06-01T10:00:00.000Z', '2026-06-01T10:00:00.000Z');
INSERT INTO campaigns (id, title, subtitle, badge, gradient_from, gradient_to, icon, active, display_order, created_at, updated_at) VALUES ('camp-gluten-free', 'Espaço Gluten Free & Sem Lactose', 'Referência no Guia Guindy Campinas — pães, massas, snacks e doces seguros', '100% Seguro', '12 58% 48%', '38 58% 46%', 'heart', 1, 2, '2026-06-01T10:00:00.000Z', '2026-06-01T10:00:00.000Z');
INSERT INTO campaigns (id, title, subtitle, badge, gradient_from, gradient_to, icon, active, display_order, created_at, updated_at) VALUES ('camp-whatsapp-delivery', 'Peça pelo WhatsApp (19) 99351-2766', 'Separamos seu pedido com carinho para entrega rápida em Campinas ou retirada na loja', 'Delivery', '145 35% 18%', '142 33% 29%', 'users', 1, 3, '2026-06-01T10:00:00.000Z', '2026-06-01T10:00:00.000Z');
INSERT INTO testimonials (id, name, text, rating, display_order, active, created_at, updated_at) VALUES ('test-1', 'Dra. Helena M. — Nutricionista Funcional (Cambuí)', 'Indico a Amaryllis para todos os meus pacientes em Campinas. Encontrar toda a linha da Essential Nutrition, fitoterápicos de procedência e opções realmente sem glúten em um só lugar no Jardim Guanabara faz toda a diferença.', 5, 1, 1, '2026-06-01T10:00:00.000Z', '2026-06-01T10:00:00.000Z');
INSERT INTO testimonials (id, name, text, rating, display_order, active, created_at, updated_at) VALUES ('test-2', 'Carolina V. — Cliente Gluten Free (Jardim Guanabara)', 'Conheci pelo guia Guindy por ser celíaca e virei cliente fiel! Atendimento super acolhedor na Rua Camargo Paes e variedade incrível de pães, farinhas e snacks sem glúten e sem lactose.', 5, 2, 1, '2026-06-01T10:00:00.000Z', '2026-06-01T10:00:00.000Z');
INSERT INTO testimonials (id, name, text, rating, display_order, active, created_at, updated_at) VALUES ('test-3', 'Eduardo S. — Taquaral, Campinas', 'Faço meus pedidos pelo WhatsApp (19) 99351-2766 e retiro rapidinho na loja ou recebo em casa. As castanhas e produtos a granel estão sempre fresquinhos e crocantes.', 5, 3, 1, '2026-06-01T10:00:00.000Z', '2026-06-01T10:00:00.000Z');
INSERT INTO testimonials (id, name, text, rating, display_order, active, created_at, updated_at) VALUES ('test-4', 'Patrícia L. — Nova Campinas', 'Loja tradicional, organizada e com curadoria impecável. Sempre encontro meu Cacao Whey, colágeno e chás fitoterápicos com ótimo atendimento e orientação.', 5, 4, 1, '2026-06-01T10:00:00.000Z', '2026-06-01T10:00:00.000Z');
INSERT INTO site_settings (id, key, value, created_at) VALUES ('59ed4e56-95ff-4614-8cd3-57a9c5d7b4ec', 'brand_tagline', 'Produtos Naturais, Dietéticos, Orgânicos, Sem Glúten e Fitoterápicos em Campinas', '2026-06-01T10:00:00.000Z');
INSERT INTO site_settings (id, key, value, created_at) VALUES ('ef48bd4f-2ee4-4b8e-b003-342f3071b17c', 'site_name', 'Amaryllis Produtos Naturais', '2026-06-01T10:00:00.000Z');
INSERT INTO site_settings (id, key, value, created_at) VALUES ('5144c6c6-dae1-4503-9cdd-afb3936def62', 'site_phone', '(19) 3243-5982', '2026-06-01T10:00:00.000Z');
INSERT INTO site_settings (id, key, value, created_at) VALUES ('299be5bb-d235-4251-b06e-40605b74852d', 'site_whatsapp', '5519993512766', '2026-06-01T10:00:00.000Z');
INSERT INTO site_settings (id, key, value, created_at) VALUES ('a2811570-93a7-4182-9081-a582416c7246', 'melhor_envio_origin_cep', '13073350', '2026-06-01T10:00:00.000Z');
INSERT INTO site_settings (id, key, value, created_at) VALUES ('31699d58-4c5c-449d-b836-97655cfeae63', 'site_address', 'Rua Camargo Paes, 65 - Jardim Guanabara, Campinas - SP, CEP: 13073-350', '2026-06-01T10:00:00.000Z');
INSERT INTO site_settings (id, key, value, created_at) VALUES ('4b1a16f9-e865-4d02-b24d-406af447e1c3', 'site_email', 'contato@amaryllisnaturais.com.br', '2026-06-01T10:00:00.000Z');
INSERT INTO site_settings (id, key, value, created_at) VALUES ('6724a42f-53a3-4510-a3e2-3dec30eb7cfc', 'site_hours_weekday', 'Segunda a Sexta das 8h30 às 18h00', '2026-06-01T10:00:00.000Z');
INSERT INTO site_settings (id, key, value, created_at) VALUES ('bd52f76c-75be-45fe-b1fd-bfa63102be43', 'site_hours_saturday', 'Sábado das 8h30 às 13h00', '2026-06-01T10:00:00.000Z');
INSERT INTO site_settings (id, key, value, created_at) VALUES ('cc92abfe-074e-4927-82f0-82086484d508', 'payment_mercadopago_enabled', 'true', '2026-06-01T10:00:00.000Z');
INSERT INTO site_settings (id, key, value, created_at) VALUES ('3b5918c7-16e1-4329-914f-e1229380f809', 'production_lead_days', '1', '2026-06-01T10:00:00.000Z');