CREATE TABLE festival (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    venue VARCHAR(100) NOT NULL,
    poster_url VARCHAR(500) NOT NULL,
    lineup VARCHAR(1000) NOT NULL,
    ticket_url VARCHAR(500) NOT NULL,
    official_url VARCHAR(500) NOT NULL
);
