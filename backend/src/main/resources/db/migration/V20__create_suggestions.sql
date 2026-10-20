ALTER TABLE shows ADD COLUMN site_code VARCHAR(16);
CREATE UNIQUE INDEX uk_shows_site_code ON shows (site_code);

CREATE TABLE site_passes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    show_id BIGINT NOT NULL,
    device_id VARCHAR(36) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_site_passes_show FOREIGN KEY (show_id) REFERENCES shows (id) ON DELETE CASCADE,
    CONSTRAINT uk_site_passes_show_device UNIQUE (show_id, device_id)
);

CREATE TABLE suggestions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    show_id BIGINT NOT NULL,
    source VARCHAR(20) NOT NULL,
    device_id VARCHAR(36) NOT NULL,
    body VARCHAR(500) NOT NULL,
    image_key VARCHAR(200),
    image_url VARCHAR(500),
    image_width INT,
    image_height INT,
    created_at DATETIME(6) NOT NULL,
    hidden_at DATETIME(6),
    reply TEXT,
    reply_organizer_id BIGINT,
    replied_at DATETIME(6),
    reply_updated_at DATETIME(6),
    CONSTRAINT fk_suggestions_show FOREIGN KEY (show_id) REFERENCES shows (id) ON DELETE CASCADE,
    CONSTRAINT fk_suggestions_reply_organizer FOREIGN KEY (reply_organizer_id) REFERENCES organizers (id) ON DELETE SET NULL,
    INDEX idx_suggestions_show_created (show_id, created_at),
    INDEX idx_suggestions_device (device_id, show_id, created_at)
);
