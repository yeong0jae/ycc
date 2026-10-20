ALTER TABLE shows ADD COLUMN timetable_published BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE timetable_stages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    show_id BIGINT NOT NULL,
    name VARCHAR(30) NOT NULL,
    position INT NOT NULL,
    CONSTRAINT fk_timetable_stages_show FOREIGN KEY (show_id) REFERENCES shows (id) ON DELETE CASCADE
);

CREATE TABLE timetable_slots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    show_id BIGINT NOT NULL,
    stage_id BIGINT NOT NULL,
    show_day DATE NOT NULL,
    start_minute INT NOT NULL,
    end_minute INT NOT NULL,
    artist VARCHAR(100) NOT NULL,
    CONSTRAINT fk_timetable_slots_show FOREIGN KEY (show_id) REFERENCES shows (id) ON DELETE CASCADE,
    CONSTRAINT fk_timetable_slots_stage FOREIGN KEY (stage_id) REFERENCES timetable_stages (id) ON DELETE CASCADE
);

CREATE TABLE timetable_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    show_id BIGINT NOT NULL,
    show_day DATE NOT NULL,
    position INT NOT NULL,
    storage_key VARCHAR(200) NOT NULL,
    url VARCHAR(500) NOT NULL,
    width INT NOT NULL,
    height INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_timetable_images_show FOREIGN KEY (show_id) REFERENCES shows (id) ON DELETE CASCADE
);
