CREATE TABLE show_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    show_id BIGINT NOT NULL,
    song VARCHAR(100),
    note VARCHAR(100),
    visibility VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    video_path VARCHAR(300),
    thumbnail_path VARCHAR(300),
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT uk_show_logs_user_show UNIQUE (user_id, show_id),
    CONSTRAINT fk_show_logs_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_show_logs_show FOREIGN KEY (show_id) REFERENCES shows (id)
);

CREATE TABLE show_log_clips (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    log_id BIGINT NOT NULL,
    moment VARCHAR(20) NOT NULL,
    duration_ms INT NOT NULL,
    path VARCHAR(300),
    CONSTRAINT uk_show_log_clips_log_moment UNIQUE (log_id, moment),
    CONSTRAINT fk_show_log_clips_log FOREIGN KEY (log_id) REFERENCES show_logs (id) ON DELETE CASCADE
);

CREATE TABLE show_plans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    show_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT uk_show_plans_user_show UNIQUE (user_id, show_id),
    CONSTRAINT fk_show_plans_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_show_plans_show FOREIGN KEY (show_id) REFERENCES shows (id)
);

CREATE TABLE log_signals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    from_user_id BIGINT NOT NULL,
    to_user_id BIGINT NOT NULL,
    show_id BIGINT NOT NULL,
    kind VARCHAR(20) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT uk_log_signals UNIQUE (from_user_id, to_user_id, show_id, kind),
    CONSTRAINT fk_log_signals_from FOREIGN KEY (from_user_id) REFERENCES users (id),
    CONSTRAINT fk_log_signals_to FOREIGN KEY (to_user_id) REFERENCES users (id),
    CONSTRAINT fk_log_signals_show FOREIGN KEY (show_id) REFERENCES shows (id)
);
