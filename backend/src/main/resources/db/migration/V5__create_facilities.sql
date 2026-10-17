CREATE TABLE facilities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    kopis_id VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    address VARCHAR(300),
    latitude DOUBLE,
    longitude DOUBLE,
    CONSTRAINT uk_facilities_kopis_id UNIQUE (kopis_id)
);

ALTER TABLE shows ADD COLUMN facility_id BIGINT;
ALTER TABLE shows ADD CONSTRAINT fk_shows_facility FOREIGN KEY (facility_id) REFERENCES facilities (id);
