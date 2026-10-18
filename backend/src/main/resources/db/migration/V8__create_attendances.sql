CREATE TABLE attendances (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    show_id BIGINT NOT NULL,
    show_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT uk_attendances_user_show_date UNIQUE (user_id, show_id, show_date),
    CONSTRAINT fk_attendances_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_attendances_show FOREIGN KEY (show_id) REFERENCES shows (id)
);

INSERT INTO attendances (user_id, show_id, show_date, status, created_at)
SELECT p.user_id, p.show_id, s.start_date, 'GOING', p.created_at
FROM show_plans p
JOIN shows s ON s.id = p.show_id;

UPDATE attendances SET status = 'ATTENDED'
WHERE EXISTS (
    SELECT 1 FROM show_logs l
    WHERE l.user_id = attendances.user_id AND l.show_id = attendances.show_id AND l.status = 'READY'
);

INSERT INTO attendances (user_id, show_id, show_date, status, created_at)
SELECT l.user_id, l.show_id, s.start_date, 'ATTENDED', l.created_at
FROM show_logs l
JOIN shows s ON s.id = l.show_id
WHERE l.status = 'READY'
  AND NOT EXISTS (SELECT 1 FROM attendances a WHERE a.user_id = l.user_id AND a.show_id = l.show_id);

DROP TABLE log_signals;
DROP TABLE show_plans;

ALTER TABLE show_logs DROP COLUMN visibility;
