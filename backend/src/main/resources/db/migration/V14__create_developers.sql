CREATE TABLE developers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    CONSTRAINT uk_developers_username UNIQUE (username)
);

ALTER TABLE users DROP COLUMN role;
