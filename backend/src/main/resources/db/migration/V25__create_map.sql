ALTER TABLE shows ADD COLUMN map_published BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE map_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    show_id BIGINT NOT NULL,
    position INT NOT NULL,
    storage_key VARCHAR(200) NOT NULL,
    url VARCHAR(500) NOT NULL,
    width INT NOT NULL,
    height INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_map_images_show FOREIGN KEY (show_id) REFERENCES shows (id) ON DELETE CASCADE
);

CREATE TABLE map_pins (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    show_id BIGINT NOT NULL,
    image_id BIGINT NOT NULL,
    kind VARCHAR(20) NOT NULL,
    name VARCHAR(60) NOT NULL,
    description VARCHAR(300),
    x DOUBLE NOT NULL,
    y DOUBLE NOT NULL,
    stage_id BIGINT,
    ai BOOLEAN NOT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_map_pins_show FOREIGN KEY (show_id) REFERENCES shows (id) ON DELETE CASCADE,
    CONSTRAINT fk_map_pins_image FOREIGN KEY (image_id) REFERENCES map_images (id) ON DELETE CASCADE,
    CONSTRAINT fk_map_pins_stage FOREIGN KEY (stage_id) REFERENCES timetable_stages (id) ON DELETE SET NULL
);
