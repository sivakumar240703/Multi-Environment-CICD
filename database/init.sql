CREATE TABLE IF NOT EXISTS customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL
);

INSERT INTO customers (name, email)
VALUES
('Siva Kumar', 'datasciencesivakumarr@gmail.com'),
('Arun Kumar', 'arunpr342@gmail.com'),
('sundar', 'soulsundar@gmail.com');