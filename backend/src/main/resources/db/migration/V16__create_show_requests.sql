CREATE TABLE show_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    kind VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(500),
    user_id BIGINT,
    status VARCHAR(20) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_show_requests_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);
