-- Foody seed data (Seville). Run AFTER 0001_init.sql.
-- Safe to re-run: clears tables first.

truncate follows, reviews, places, profiles restart identity cascade;

-- ---- profiles ----
insert into profiles (id, name, username, avatar_url, bio, city, created_at) values
('00000000-0000-0000-0000-000000000001','Marta Ruiz','marta_eats','https://i.pravatar.cc/200?img=47','Tapas hunter. El Arenal native. I eat so you don''t waste a meal.','Sevilla','2026-01-04T10:00:00Z'),
('00000000-0000-0000-0000-000000000002','Diego Santos','seville_bites','https://i.pravatar.cc/200?img=12','Coffee first, vermut later. Old-school bars > trends.','Sevilla','2026-01-10T10:00:00Z'),
('00000000-0000-0000-0000-000000000003','Lucía Pérez','tapas_king','https://i.pravatar.cc/200?img=32','Modern tapas, big wine lists, slow Sundays.','Sevilla','2026-02-01T10:00:00Z'),
('00000000-0000-0000-0000-000000000004','Carlos Gil','sweet_tooth','https://i.pravatar.cc/200?img=15','Dessert is a food group. Queue with me.','Sevilla','2026-02-14T10:00:00Z');

-- ---- places ----
insert into places (id, name, address, city, lat, lng, category, created_at) values
('10000000-0000-0000-0000-000000000001','La Brunilda','C. Galera 5, El Arenal','Sevilla',37.3866,-5.9959,'food','2026-03-01T10:00:00Z'),
('10000000-0000-0000-0000-000000000002','Bar El Comercio','C. Lineros 9','Sevilla',37.3917,-5.9893,'coffee','2026-03-01T10:00:00Z'),
('10000000-0000-0000-0000-000000000003','Eslava','C. Eslava 3','Sevilla',37.4011,-5.9967,'food','2026-03-01T10:00:00Z'),
('10000000-0000-0000-0000-000000000004','El Rinconcillo','C. Gerona 40','Sevilla',37.3955,-5.9889,'bar','2026-03-01T10:00:00Z'),
('10000000-0000-0000-0000-000000000005','Heladería Rayas','C. Almirante Apodaca 1','Sevilla',37.3849,-5.9925,'dessert','2026-03-01T10:00:00Z'),
('10000000-0000-0000-0000-000000000006','Bar Alfalfa','C. Candilejo 1','Sevilla',37.3902,-5.9901,'bar','2026-03-01T10:00:00Z'),
('10000000-0000-0000-0000-000000000007','Confitería La Campana','C. Sierpes 1','Sevilla',37.3923,-5.9933,'dessert','2026-03-01T10:00:00Z'),
('10000000-0000-0000-0000-000000000008','Ovejas Negras','C. Hernando Colón 8','Sevilla',37.3878,-5.9905,'food','2026-03-01T10:00:00Z'),
('10000000-0000-0000-0000-000000000009','Café de Indias','Av. de la Constitución 22','Sevilla',37.3889,-5.9911,'coffee','2026-03-01T10:00:00Z'),
('10000000-0000-0000-0000-000000000010','Mercado Lonja del Barranco','C. Arjona s/n','Sevilla',37.3895,-5.9978,'food','2026-03-01T10:00:00Z');

-- ---- reviews ----
insert into reviews (user_id, place_id, rating, price_per_person, dishes, text, photos, tags, emoji, created_at, updated_at) values
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',5,25,'{"Solomillo al whisky","Carrillada"}','Best tapas in El Arenal, the solomillo melts. Go early, no reservations.','{"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=70&auto=format&fit=crop"}','{"hidden gem","good for groups"}','🍳','2026-06-16T12:30:00Z','2026-06-16T12:30:00Z'),
('00000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001',4,22,'{"Bacalao"}','Crowded but worth it. Wine by the glass is solid.','{}','{"good for groups"}','🍷','2026-06-10T20:00:00Z','2026-06-10T20:00:00Z'),
('00000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002',4,6,'{"Churros con chocolate"}','Churros con chocolate, old-school vibe.','{"https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=70&auto=format&fit=crop"}','{"cheap eats","brunch"}','☕','2026-06-16T09:05:00Z','2026-06-16T09:05:00Z'),
('00000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000003',5,18,'{"Huevo sobre bizcocho de boletus","Costilla"}','Slow-cooked egg over boletus cake. Iconic. The dish that won awards.','{"https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=70&auto=format&fit=crop"}','{"hidden gem"}','🥚','2026-06-15T21:40:00Z','2026-06-15T21:40:00Z'),
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003',5,20,'{"Carrillada","Huevo de boletus"}','My go-to for visitors. Never disappoints.','{}','{"good for groups"}','🍽️','2026-05-30T21:00:00Z','2026-05-30T21:00:00Z'),
('00000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000004',4,15,'{"Jamón","Espinacas con garbanzos"}','Oldest bar in Seville, tab chalked on the counter. Pure history.','{"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=70&auto=format&fit=crop"}','{"date night"}','🍷','2026-06-16T20:10:00Z','2026-06-16T20:10:00Z'),
('00000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000005',5,4,'{"Turrón ice cream"}','Turrón ice cream, worth the queue.','{"https://images.unsplash.com/photo-1488900128323-21503983a07e?w=800&q=70&auto=format&fit=crop"}','{"cheap eats"}','🍦','2026-06-16T18:20:00Z','2026-06-16T18:20:00Z'),
('00000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000006',4,14,'{"Salmorejo","Carrillada"}','Tiny corner bar, killer salmorejo.','{}','{"hidden gem"}','🍅','2026-06-16T13:15:00Z','2026-06-16T13:15:00Z'),
('00000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000007',5,8,'{"Yema","Tocino de cielo"}','Yema and tocino de cielo since 1885. A Sierpes institution.','{"https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=800&q=70&auto=format&fit=crop"}','{"brunch"}','🧁','2026-06-16T11:00:00Z','2026-06-16T11:00:00Z'),
('00000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000008',4,24,'{"Tartar de atún","Croquetas"}','Modern tapas near Santa Cruz, great wine list.','{"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=70&auto=format&fit=crop"}','{"date night"}','🐑','2026-06-16T22:05:00Z','2026-06-16T22:05:00Z'),
('00000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000009',3,5,'{"Flat white"}','Solid flat white, good for working.','{}','{"brunch"}','☕','2026-06-16T08:45:00Z','2026-06-16T08:45:00Z'),
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000010',4,20,'{"Gambas","Ostras"}','Food hall by the river, get the gambas.','{"https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=70&auto=format&fit=crop"}','{"good for groups","date night"}','🦐','2026-06-16T14:30:00Z','2026-06-16T14:30:00Z');

-- ---- follows ----
insert into follows (follower_id, following_id, created_at) values
('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','2026-03-10T10:00:00Z'),
('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','2026-03-12T10:00:00Z'),
('00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','2026-03-15T10:00:00Z'),
('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','2026-03-20T10:00:00Z'),
('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000004','2026-03-22T10:00:00Z');
