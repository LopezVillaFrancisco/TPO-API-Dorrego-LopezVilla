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

INSERT INTO products (category_id, name, price, discount_price, badge_type, badge_expires_at, is_available, "order")
SELECT c.id, v.name, v.price, v.discount_price, v.badge_type::enum_products_badge_type, v.badge_expires_at, v.is_available, v.ord
FROM (VALUES
  ('Pizzas', 'Margherita', 13500, NULL, 'mas_vendido', NULL, TRUE, 1),
  ('Pizzas', 'Diavola', 15500, 12900, 'descuento', NOW() + INTERVAL '30 days', TRUE, 2),
  ('Pizzas', 'Vegetariana', 14800, NULL, 'nuevo', NULL, TRUE, 3),
  ('Pastas', 'Penne all''arrabbiata', 12800, NULL, 'ninguno', NULL, TRUE, 1),
  ('Pastas', 'Fettuccine con lomo y hongos', 16900, NULL, 'recomendado_chef', NULL, TRUE, 2),
  ('Pastas', 'Farfalle al pesto', 11900, NULL, 'ninguno', NULL, FALSE, 3),
  ('Pastas', 'Spaghetti frutti di mare', 18900, NULL, 'ultimas_unidades', NULL, TRUE, 4),
  ('Carnes', 'Bife de chorizo con papas', 22500, NULL, 'mas_vendido', NULL, TRUE, 1),
  ('Carnes', 'Entraña a la parrilla', 21000, 17500, 'descuento', NOW() - INTERVAL '2 days', TRUE, 2),
  ('Carnes', 'Parrillada para compartir', 39900, NULL, 'nuevo', NULL, TRUE, 3),
  ('Carnes', 'Albóndigas caseras', 13900, NULL, 'ninguno', NULL, TRUE, 4),
  ('Hamburguesas', 'Clásica', 12500, NULL, 'ninguno', NULL, TRUE, 1),
  ('Hamburguesas', 'Doble cheddar', 15900, 13500, 'descuento', NULL, TRUE, 2),
  ('Postres', 'Tiramisú', 7900, NULL, 'recomendado_chef', NULL, TRUE, 1),
  ('Postres', 'Panna cotta de frutillas', 6900, NULL, 'ninguno', NULL, TRUE, 2),
  ('Postres', 'Copa chocotorta', 7500, NULL, 'nuevo', NULL, TRUE, 3),
  ('Postres', 'Donas glaseadas', 5900, NULL, 'ultimas_unidades', NULL, TRUE, 4),
  ('Bebidas', 'Cócteles de autor', 8500, NULL, 'ninguno', NULL, TRUE, 1),
  ('Bebidas', 'Cuba libre', 7200, NULL, 'mas_vendido', NULL, TRUE, 2)
) AS v(category, name, price, discount_price, badge_type, badge_expires_at, is_available, ord)
JOIN categories c ON c.name = v.category
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.name = v.name);

-- Descripciones y etiquetas. Es un UPDATE para que también se actualicen los productos de ejemplo ya cargados.
UPDATE products p SET description = v.description, tags = v.tags::varchar(30)[]
FROM (VALUES
  ('Margherita', 'La clásica napolitana. Masa de 48 horas de fermentación, salsa de tomate San Marzano, mozzarella fior di latte, albahaca fresca y un hilo de oliva extra virgen. Se cocina a la piedra en horno a leña. 8 porciones, ideal para 2 personas.', '{vegetariano}'),
  ('Diavola', 'Para los que buscan algo con carácter. Salsa de tomate, mozzarella, rodajas de salame picante y, al salir del horno, un toque de miel con ají que equilibra lo dulce y lo picante. 8 porciones.', '{picante}'),
  ('Vegetariana', 'Morrones rojos y amarillos asados, cebolla morada, aceitunas negras y mozzarella sobre salsa de tomate. Se termina con rúcula fresca y parmesano en lascas. Sin carne y con mucho sabor. 8 porciones.', '{vegetariano}'),
  ('Penne all''arrabbiata', 'Penne al dente en salsa de tomate cocida a fuego lento con ajo, ají molido y perejil fresco. Se sirve con parmesano rallado aparte, así lo agregás a gusto. Nivel de picante: medio. Porción individual abundante.', '{vegetariano,picante}'),
  ('Fettuccine con lomo y hongos', 'Fettuccine hechos en casa cada mañana, con tiras de lomo salteadas, hongos de pino y champiñones en una salsa de crema y vino blanco. Terminado con ciboulette. El plato preferido del chef.', '{}'),
  ('Farfalle al pesto', 'Farfalle con pesto de albahaca, piñones y parmesano preparado en el día, tomates cherry confitados y hojas verdes. Fresco y liviano. Contiene frutos secos.', '{vegetariano,frutos_secos}'),
  ('Spaghetti frutti di mare', 'Spaghetti con langostinos, mejillones y calamares salteados en oliva con ajo, tomates cherry y un toque de vino blanco. Sin crema ni manteca: todo el sabor viene de los mariscos. Contiene mariscos.', '{sin_lactosa}'),
  ('Bife de chorizo con papas', 'Bife de chorizo de 400 g de novillo, a la parrilla con leña y en el punto que pidas. Viene con papas rústicas al horno con romero y chimichurri de la casa. Apto celíacos: lo cocinamos en una zona separada de la parrilla.', '{sin_tacc,sin_lactosa}'),
  ('Entraña a la parrilla', 'Entraña jugosa de 350 g, cortada en tiras y terminada con sal de Maldon. Se acompaña con ensalada de hojas verdes y tomate. Un corte sabroso y tierno, ideal jugoso.', '{sin_tacc,sin_lactosa}'),
  ('Parrillada para compartir', 'Tabla con brochettes de pollo y de carne, chorizo, morcilla, vegetales asados (zapallo, morrón y cebolla) y tres salsas de la casa: chimichurri, criolla y alioli. Alcanza para 2 personas con buen apetito.', '{sin_lactosa,para_compartir}'),
  ('Albóndigas caseras', 'Seis albóndigas de carne vacuna y cerdo, hechas a mano y horneadas en salsa de tomate. Se sirven sobre colchón de rúcula con parmesano y pan casero para mojar en la salsa.', '{}'),
  ('Clásica', 'Medallón de 180 g de carne vacuna, a la plancha, con queso tybo, lechuga, tomate, cebolla y mayonesa de la casa en pan de papa tostado. Viene con papas fritas.', '{}'),
  ('Doble cheddar', 'Dos medallones de 120 g, doble cheddar fundido, cebolla caramelizada, pepinos encurtidos y salsa de la casa en pan de papa con sésamo. Viene con papas fritas. Para los que tienen hambre de verdad.', '{}'),
  ('Tiramisú', 'Receta italiana: vainillas embebidas en café espresso y licor de café, intercaladas con crema de mascarpone y terminadas con cacao amargo. Lo preparamos en el día y lo servimos bien frío.', '{vegetariano,con_alcohol}'),
  ('Panna cotta de frutillas', 'Crema cocida con vaina de vainilla natural, suave y cremosa, con coulis de frutillas y frutillas frescas cortadas. Un postre liviano para cerrar la comida.', '{vegetariano,sin_tacc}'),
  ('Copa chocotorta', 'Nuestra versión en copa del clásico argentino: capas de galletitas de chocolate humedecidas en café, crema de dulce de leche y queso crema, con chocolate rallado arriba.', '{vegetariano}'),
  ('Donas glaseadas', 'Dos donas caseras fritas en el momento, esponjosas por dentro, con glaseado de chocolate semiamargo y granas de colores. Van muy bien con un café.', '{vegetariano}'),
  ('Cócteles de autor', 'Tragos creados por nuestro bartender con frutas de estación, hierbas frescas y destilados seleccionados. La propuesta cambia cada día: preguntale al mozo cuál es el de hoy. También hay versiones sin alcohol.', '{con_alcohol,vegano}'),
  ('Cuba libre', 'Ron añejo, cola bien fría, jugo de lima recién exprimido y mucho hielo. Se sirve en vaso alto con una rodaja de lima. Refrescante y fácil de tomar.', '{con_alcohol,vegano,sin_tacc}')
) AS v(name, description, tags)
WHERE p.name = v.name;

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

INSERT INTO quick_replies (title, text, "order")
SELECT * FROM (VALUES
  ('Sin TACC', 'Sí, tenemos opciones sin TACC: las pizzas se pueden pedir con masa sin gluten y las carnes salen con guarnición apta. Avisanos al pedir así las preparamos por separado.', 0),
  ('Reservas', 'Las reservas las tomamos por teléfono o por WhatsApp. Pasanos día, horario y cantidad de personas y te confirmamos.', 1),
  ('Porciones', 'La parrillada está pensada para 2 personas; para 3 te recomendamos sumar una guarnición.', 2)
) AS v(title, text, ord)
WHERE NOT EXISTS (SELECT 1 FROM quick_replies);
