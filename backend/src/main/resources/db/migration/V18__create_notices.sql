CREATE TABLE notices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    show_id BIGINT NOT NULL,
    organizer_id BIGINT NOT NULL,
    kind VARCHAR(20) NOT NULL,
    title VARCHAR(60) NOT NULL,
    body TEXT,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6),
    deleted_at DATETIME(6),
    CONSTRAINT fk_notices_show FOREIGN KEY (show_id) REFERENCES shows (id),
    CONSTRAINT fk_notices_organizer FOREIGN KEY (organizer_id) REFERENCES organizers (id),
    INDEX idx_notices_show_created (show_id, created_at)
);

CREATE TABLE notice_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    show_id BIGINT NOT NULL,
    organizer_id BIGINT NOT NULL,
    notice_id BIGINT,
    position INT NOT NULL,
    storage_key VARCHAR(200) NOT NULL,
    url VARCHAR(500) NOT NULL,
    width INT NOT NULL,
    height INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_notice_images_show FOREIGN KEY (show_id) REFERENCES shows (id),
    CONSTRAINT fk_notice_images_organizer FOREIGN KEY (organizer_id) REFERENCES organizers (id),
    CONSTRAINT fk_notice_images_notice FOREIGN KEY (notice_id) REFERENCES notices (id)
);
