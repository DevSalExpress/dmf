CREATE TABLE scans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data DATE NOT NULL,
    placa VARCHAR(50) NOT NULL,
    quantidade_total INT NOT NULL,
    quant_atual INT NOT NULL,
    num_pedido VARCHAR(50) NOT NULL,
    num_etiqueta VARCHAR(50) NOT NULL,
    scaned BOOLEAN NOT NULL
);
