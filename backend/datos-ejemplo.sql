INSERT INTO business_info (name, social_links)
SELECT 'La Esquina Gourmet', '{}'
WHERE NOT EXISTS (SELECT 1 FROM business_info);

UPDATE business_info SET
  name = 'La Esquina Gourmet',
  description = 'Cocina de autor, pizzas a la piedra y parrilla. Ingredientes frescos y recetas de la casa desde 2015.',
  address = 'Av. Corrientes 1234, CABA',
  phone = '+54 11 4567-8900',
  hours = 'Mar a Dom de 12 a 16 y de 20 a 00',
  social_links = '{"instagram":"https://instagram.com/laesquinagourmet","facebook":"https://facebook.com/laesquinagourmet","whatsapp":"https://wa.me/5491145678900","web":"https://laesquinagourmet.com"}'
WHERE id = (SELECT MIN(id) FROM business_info);

INSERT INTO categories (name, "order") VALUES
  ('Pizzas', 1),
  ('Pastas', 2),
  ('Carnes', 3),
  ('Hamburguesas', 4),
  ('Postres', 5),
  ('Bebidas', 6)
ON CONFLICT (name) DO NOTHING;

INSERT INTO products (category_id, name, description, price, discount_price, badge_type, badge_expires_at, is_available, "order")
SELECT c.id, v.name, v.description, v.price, v.discount_price, v.badge_type::enum_products_badge_type, v.badge_expires_at, v.is_available, v.ord
FROM (VALUES
  ('Pizzas', 'Margherita', 'Salsa de tomate San Marzano, mozzarella fior di latte, albahaca fresca y oliva extra virgen.', 13500, NULL, 'mas_vendido', NULL, TRUE, 1),
  ('Pizzas', 'Diavola', 'Tomate, mozzarella, salame picante y un toque de miel picante.', 15500, 12900, 'descuento', NOW() + INTERVAL '30 days', TRUE, 2),
  ('Pizzas', 'Vegetariana', 'Morrones asados, cebolla morada, aceitunas negras y rúcula fresca.', 14800, NULL, 'nuevo', NULL, TRUE, 3),
  ('Pastas', 'Penne all''arrabbiata', 'Salsa de tomate picante con ajo, perejil y parmesano.', 12800, NULL, 'ninguno', NULL, TRUE, 1),
  ('Pastas', 'Fettuccine con lomo y hongos', 'Fettuccine caseros con tiras de lomo, hongos de pino y crema.', 16900, NULL, 'recomendado_chef', NULL, TRUE, 2),
  ('Pastas', 'Farfalle al pesto', 'Pesto de albahaca, tomates cherry y hojas verdes.', 11900, NULL, 'ninguno', NULL, FALSE, 3),
  ('Pastas', 'Spaghetti frutti di mare', 'Langostinos, tomates cherry, ajo y vino blanco.', 18900, NULL, 'ultimas_unidades', NULL, TRUE, 4),
  ('Carnes', 'Bife de chorizo con papas', 'Bife de 400 g a la parrilla con papas rústicas y chimichurri.', 22500, NULL, 'mas_vendido', NULL, TRUE, 1),
  ('Carnes', 'Entraña a la parrilla', 'Entraña jugosa cortada en tiras con sal de Maldon.', 21000, 17500, 'descuento', NOW() - INTERVAL '2 days', TRUE, 2),
  ('Carnes', 'Parrillada para compartir', 'Brochettes de pollo y carne, vegetales asados y salsas de la casa. Para 2 personas.', 39900, NULL, 'nuevo', NULL, TRUE, 3),
  ('Carnes', 'Albóndigas caseras', 'Albóndigas de carne al horno sobre colchón de rúcula.', 13900, NULL, 'ninguno', NULL, TRUE, 4),
  ('Hamburguesas', 'Clásica', 'Medallón de 180 g, lechuga, tomate, queso y pan de papa.', 12500, NULL, 'ninguno', NULL, TRUE, 1),
  ('Hamburguesas', 'Doble cheddar', 'Doble medallón, doble cheddar, cebolla y salsa de la casa.', 15900, 13500, 'descuento', NULL, TRUE, 2),
  ('Postres', 'Tiramisú', 'Vainillas embebidas en café, crema de mascarpone y cacao amargo.', 7900, NULL, 'recomendado_chef', NULL, TRUE, 1),
  ('Postres', 'Panna cotta de frutillas', 'Panna cotta de vainilla con coulis y frutillas frescas.', 6900, NULL, 'ninguno', NULL, TRUE, 2),
  ('Postres', 'Copa chocotorta', 'Capas de galletitas de chocolate, dulce de leche y queso crema.', 7500, NULL, 'nuevo', NULL, TRUE, 3),
  ('Postres', 'Donas glaseadas', 'Dos donas caseras con glaseado de chocolate y granas.', 5900, NULL, 'ultimas_unidades', NULL, TRUE, 4),
  ('Bebidas', 'Cócteles de autor', 'Consultá la carta de tragos del día.', 8500, NULL, 'ninguno', NULL, TRUE, 1),
  ('Bebidas', 'Cuba libre', 'Ron, cola, lima y mucho hielo.', 7200, NULL, 'mas_vendido', NULL, TRUE, 2)
) AS v(category, name, description, price, discount_price, badge_type, badge_expires_at, is_available, ord)
JOIN categories c ON c.name = v.category
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.name = v.name);

INSERT INTO product_images (product_id, url, "order")
SELECT p.id, 'https://images.unsplash.com/photo-' || v.photo || '?w=1080&q=80', v.ord
FROM (VALUES
  ('Margherita', '1574071318508-1cdbab80d002', 0),
  ('Margherita', '1513104890138-7c749659a591', 1),
  ('Diavola', '1604382354936-07c5d9983bd3', 0),
  ('Vegetariana', '1565299624946-b28f40a0ae38', 0),
  ('Penne all''arrabbiata', '1621996346565-e3dbc646d9a9', 0),
  ('Fettuccine con lomo y hongos', '1551183053-bf91a1d81141', 0),
  ('Farfalle al pesto', '1473093295043-cdd812d0e601', 0),
  ('Spaghetti frutti di mare', '1563379926898-05f4575a45d8', 0),
  ('Bife de chorizo con papas', '1600891964092-4316c288032e', 0),
  ('Bife de chorizo con papas', '1558030006-450675393462', 1),
  ('Entraña a la parrilla', '1558030006-450675393462', 0),
  ('Parrillada para compartir', '1555939594-58d7cb561ad1', 0),
  ('Albóndigas caseras', '1529042410759-befb1204b468', 0),
  ('Clásica', '1568901346375-23c9450c58cd', 0),
  ('Doble cheddar', '1571091718767-18b5b1457add', 0),
  ('Tiramisú', '1766232333746-b0a2697d6d0d', 0),
  ('Panna cotta de frutillas', '1488477181946-6428a0291777', 0),
  ('Copa chocotorta', '1563805042-7684c019e1cb', 0),
  ('Donas glaseadas', '1551024601-bec78aea704b', 0),
  ('Cócteles de autor', '1544145945-f90425340c7e', 0),
  ('Cuba libre', '1611464320499-e655ef77f4f0', 0)
) AS v(product, photo, ord)
JOIN products p ON p.name = v.product
WHERE NOT EXISTS (
  SELECT 1 FROM product_images i
  WHERE i.product_id = p.id AND i.url = 'https://images.unsplash.com/photo-' || v.photo || '?w=1080&q=80'
);

INSERT INTO contact_messages (name, email, phone, subject, message, status, created_at)
SELECT * FROM (VALUES
  ('Lucía Fernández', 'lucia@example.com', '1155550001', 'Consulta sobre: Parrillada para compartir', '¿La parrillada alcanza para 3 personas? ¿Se puede reservar para el sábado?', 'pendiente'::enum_contact_messages_status, NOW() - INTERVAL '2 hours'),
  ('Martín Gómez', 'martin@example.com', NULL, 'Consulta sobre: Margherita', '¿Tienen opción de masa sin TACC?', 'leido'::enum_contact_messages_status, NOW() - INTERVAL '1 day')
) AS v(name, email, phone, subject, message, status, created_at)
WHERE NOT EXISTS (SELECT 1 FROM contact_messages);
