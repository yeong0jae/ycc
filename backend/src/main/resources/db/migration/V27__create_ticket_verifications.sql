CREATE TABLE ticket_verifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    show_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    reject_reason VARCHAR(20),
    image_key VARCHAR(200),
    image_width INT,
    image_height INT,
    created_at DATETIME(6) NOT NULL,
    decided_at DATETIME(6),
    developer_id BIGINT,
    CONSTRAINT fk_ticket_verifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_ticket_verifications_show FOREIGN KEY (show_id) REFERENCES shows (id) ON DELETE CASCADE,
    CONSTRAINT fk_ticket_verifications_developer FOREIGN KEY (developer_id) REFERENCES developers (id) ON DELETE SET NULL,
    CONSTRAINT uk_ticket_verifications_user_show UNIQUE (user_id, show_id),
    INDEX idx_ticket_verifications_status (status, created_at)
);

ALTER TABLE suggestions MODIFY device_id VARCHAR(36);
ALTER TABLE suggestions ADD COLUMN user_id BIGINT;
ALTER TABLE suggestions ADD CONSTRAINT fk_suggestions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL;
CREATE INDEX idx_suggestions_user ON suggestions (user_id, show_id, created_at);
