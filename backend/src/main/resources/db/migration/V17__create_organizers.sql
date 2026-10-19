CREATE TABLE organizers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(30) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    display_name VARCHAR(50) NOT NULL,
    show_id BIGINT NOT NULL,
    active BOOLEAN NOT NULL,
    failed_logins INT NOT NULL,
    locked_until DATETIME(6),
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT uk_organizers_username UNIQUE (username),
    CONSTRAINT uk_organizers_show UNIQUE (show_id),
    CONSTRAINT fk_organizers_show FOREIGN KEY (show_id) REFERENCES shows (id)
);
