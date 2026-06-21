UPDATE employees SET password_hash = '$2a$10$AnnaY/hr5cB/.E1QAWX7VuFO5vefXkkuThCYTspvDSewxKT0AGWUC' WHERE id = 1 RETURNING id, full_name;
