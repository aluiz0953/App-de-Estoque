-- Perfume Inventory Management System - Database Schema
-- MySQL Relational Model

-- Drop views/tables if they exist (for development purposes)
DROP VIEW IF EXISTS view_estoque_operacional;
DROP VIEW IF EXISTS view_estoque_financeiro;
-- These two are created by Hibernate (ddl-auto=update), not by this script,
-- but they FK-reference usuarios/produtos/lotes, so they must go first.
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS notificacoes;
DROP TABLE IF EXISTS movimentacoes_estoque;
DROP TABLE IF EXISTS lotes;
DROP TABLE IF EXISTS produtos;
DROP TABLE IF EXISTS linhas;
DROP TABLE IF EXISTS marcas;
DROP TABLE IF EXISTS fornecedores;
DROP TABLE IF EXISTS usuarios;

-- Usuarios table (with permissions/roles)
CREATE TABLE usuarios (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('ADMIN', 'OPERATOR', 'MANAGER', 'AUDITOR') NOT NULL DEFAULT 'OPERATOR',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL
) ENGINE=InnoDB;

-- Fornecedores table (Suppliers)
CREATE TABLE fornecedores (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cnpj VARCHAR(18) UNIQUE,
    razao_social VARCHAR(200) NOT NULL,
    nome_fantasia VARCHAR(200),
    contato_principal VARCHAR(100),
    telefone VARCHAR(20),
    email VARCHAR(100),
    endereco VARCHAR(255),
    cidade VARCHAR(100),
    estado CHAR(2),
    cep VARCHAR(10),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Marcas table (Brands)
CREATE TABLE marcas (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    logo_url VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Linhas table (Product Lines, related to Marcas)
CREATE TABLE linhas (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    marca_id BIGINT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_marca_linha (marca_id, nome)
) ENGINE=InnoDB;

-- Produtos table (Base Product Data)
CREATE TABLE produtos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    linha_id BIGINT NOT NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    barcode_ean13 VARCHAR(13) UNIQUE,
    barcode_upc VARCHAR(12) UNIQUE,
    altura_cm DECIMAL(5,2),
    largura_cm DECIMAL(5,2),
    profundidade_cm DECIMAL(5,2),
    peso_gramas DECIMAL(8,3),
    preco_custo DECIMAL(10,2) NOT NULL,
    preco_venda DECIMAL(10,2) NOT NULL,
    margem_lucro_percentual DECIMAL(5,2) AS ((preco_venda - preco_custo) / preco_venda * 100) STORED,
    estoque_minimo INT DEFAULT 0,
    estoque_maximo INT DEFAULT 999999,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (linha_id) REFERENCES linhas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Lotes table (Physical Inventory Instances)
CREATE TABLE lotes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    produto_id BIGINT NOT NULL,
    numero_lote VARCHAR(50) NOT NULL,
    quantidade INT NOT NULL CHECK (quantidade >= 0),
    unidade_medida ENUM('UNIDADE', 'CAIXA', 'FRASCO', 'ML', 'L', 'G', 'KG') DEFAULT 'UNIDADE',
    data_fabricacao DATE,
    data_validade DATE NOT NULL,
    preco_custo_lote DECIMAL(10,2),
    fornecedor_id BIGINT,
    localizacao_arquivo VARCHAR(100), -- For physical warehouse location (prateleira, gaveta, etc.)
    status ENUM('ATIVO', 'VENCIDO', 'RESERVADO', 'BLOQUEADO') DEFAULT 'ATIVO',
    criado_por BIGINT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_por BIGINT,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL,
    FOREIGN KEY (criado_por) REFERENCES usuarios(id),
    FOREIGN KEY (atualizado_por) REFERENCES usuarios(id),
    INDEX idx_data_validade (data_validade),
    INDEX idx_produto_status (produto_id, status),
    INDEX idx_numero_lote (numero_lote)
) ENGINE=InnoDB;

-- Insert some initial data for testing
-- Password hash below is a real bcrypt hash of "admin123" (dev/test credential only)
INSERT INTO usuarios (username, password_hash, email, full_name, role) VALUES
('admin', '$2a$10$nq27GoZJ/A5vgmVy2d73BO3WsxGNUGIDUYo8FQYGtvKmB55FQT.oq', 'admin@perfumaria.com', 'Administrador Sistema', 'ADMIN'),
('operador1', '$2a$10$nq27GoZJ/A5vgmVy2d73BO3WsxGNUGIDUYo8FQYGtvKmB55FQT.oq', 'operador1@perfumaria.com', 'Operador Estoque', 'OPERATOR'),
('gerente1', '$2a$10$nq27GoZJ/A5vgmVy2d73BO3WsxGNUGIDUYo8FQYGtvKmB55FQT.oq', 'gerente1@perfumaria.com', 'Gerente de Vendas', 'MANAGER');

INSERT INTO fornecedores (cnpj, razao_social, nome_fantasia, contato_principal, telefone, email, endereco, cidade, estado, cep) VALUES
('12.345.678/0001-90', 'Perfume Brasil Ltda.', 'Perfume Brasil', 'João Silva', '(11) 99999-1111', 'contato@perfumebrasil.com', 'Rua das Flores, 123', 'São Paulo', 'SP', '01234-567'),
('98.765.432/0001-10', 'Essências Finas S.A.', 'Essências Finas', 'Maria Oliveira', '(11) 88888-2222', 'vendas@essenciasfinas.com', 'Av. Paulista, 1000', 'São Paulo', 'SP', '01310-100');

INSERT INTO marcas (nome, descricao) VALUES
('Chanel', 'Marca francesa de luxo conhecida por perfumes icônicos'),
('Dior', 'Casa de moda francesa com linha de prestígio de fragrâncias'),
('O Boticário', 'Marca brasileira de cosméticos e perfumes acessíveis');

INSERT INTO linhas (marca_id, nome, descricao) VALUES
(1, 'Chanel No. 5', 'Linha clássica com o famoso perfume Chanel No. 5'),
(1, 'Chanel Chance', 'Linha jovem e florestal da Chanel'),
(2, 'Dior Sauvage', 'Linha masculina amadeirada do Dior'),
(2, 'Dior J''adore', 'Linha floral feminina do Dior'),
(3, 'Floratta', 'Linha de fragrâncias florais do O Boticário'),
(3, 'Malbec', 'Linha amadeirada e sofisticada do O Boticário');

INSERT INTO produtos (linha_id, sku, nome, descricao, barcode_ean13, preco_custo, preco_venda, altura_cm, largura_cm, profundidade_cm, peso_gramas) VALUES
(1, 'CHANEL-N5-50ML', 'Chanel No. 5 Eau de Parfum 50ml', 'Perfume icônico aldeído-floral', '7891234567890', 150.00, 350.00, 10.0, 5.0, 5.0, 120),
(2, 'CHANEL-CHANCE-30ML', 'Chanel Chance Eau Tendre 30ml', 'Perfume floral-fruttado', '7891234567891', 120.00, 280.00, 8.0, 4.0, 4.0, 100),
(3, 'DIOR-SAUVAGE-100ML', 'Dior Sauvage Eau de Toilette 100ml', 'Perfume masculino amadeirada-especiado', '7891234567892', 180.00, 420.00, 12.0, 6.0, 6.0, 180),
(4, 'DIOR-JADORE-50ML', 'Dior J''adore Eau de Parfum 50ml', 'Perfume floral feminino luxuoso', '7891234567893', 160.00, 380.00, 10.0, 5.0, 5.0, 150),
(5, 'BOTICARIO-FLORATTA-100ML', 'Floratta Eau de Toilette 100ml', 'Fraudade floral feminina', '7891234567894', 25.00, 60.00, 9.0, 4.5, 4.5, 130),
(6, 'BOTICARIO-MALBEC-50ML', 'Malbec Eau de Parfum 50ml', 'Fragrância amadeirada sofisticada', '7891234567895', 30.00, 75.00, 8.5, 4.0, 4.0, 110);

INSERT INTO lotes (produto_id, numero_lote, quantidade, unidade_medida, data_fabricacao, data_validade, preco_custo_lote, fornecedor_id, localizacao_arquivo, status, criado_por) VALUES
(1, 'LOTE-CHANEL-N5-001', 50, 'UNIDADE', '2024-01-15', '2027-01-15', 150.00, 1, 'Prateleira A1', 'ATIVO', 2),
(1, 'LOTE-CHANEL-N5-002', 30, 'UNIDADE', '2024-03-20', '2027-03-20', 155.00, 1, 'Prateleira A1', 'ATIVO', 2),
(2, 'LOTE-CHANEL-CHANCE-001', 25, 'UNIDADE', '2024-02-10', '2027-02-10', 120.00, 1, 'Prateleira A2', 'ATIVO', 2),
(3, 'LOTE-DIOR-SAUVAGE-001', 40, 'UNIDADE', '2024-01-05', '2027-01-05', 180.00, 2, 'Prateleira B1', 'ATIVO', 2),
(4, 'LOTE-DIOR-JADORE-001', 35, 'UNIDADE', '2024-02-28', '2027-02-28', 160.00, 2, 'Prateleira B2', 'ATIVO', 2),
(5, 'LOTE-BOTICARIO-FLORATTA-001', 100, 'UNIDADE', '2024-03-01', '2026-09-01', 25.00, 2, 'Prateleira C1', 'ATIVO', 2),
(6, 'LOTE-BOTICARIO-MALBEC-001', 75, 'UNIDADE', '2024-03-15', '2026-12-15', 30.00, 2, 'Prateleira C2', 'ATIVO', 2);

-- Create indexes for better performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_role ON usuarios(role);
CREATE INDEX idx_fornecedores_cnpj ON fornecedores(cnpj);
CREATE INDEX idx_marcas_nome ON marcas(nome);
CREATE INDEX idx_linhas_marca_id ON linhas(marca_id);
CREATE INDEX idx_produtos_sku ON produtos(sku);
CREATE INDEX idx_produtos_barcode ON produtos(barcode_ean13);
CREATE INDEX idx_lotes_numero_lote ON lotes(numero_lote);
CREATE INDEX idx_lotes_data_validade ON lotes(data_validade);
CREATE INDEX idx_lotes_produto_id ON lotes(produto_id);

-- Create view for dashboard operational view (ruptures and expirations)
CREATE VIEW view_estoque_operacional AS
SELECT
    p.id as produto_id,
    p.sku,
    p.nome as produto_nome,
    m.nome as marca,
    l.nome as linha,
    p.estoque_minimo,
    SUM(CASE WHEN lote.status = 'ATIVO' THEN lote.quantidade ELSE 0 END) as quantidade_total,
    SUM(CASE WHEN lote.data_validade < DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND lote.status = 'ATIVO' THEN lote.quantidade ELSE 0 END) as quantidade_vencendo_30_dias,
    SUM(CASE WHEN lote.data_validade < CURDATE() AND lote.status = 'ATIVO' THEN lote.quantidade ELSE 0 END) as quantidade_vencida,
    SUM(CASE WHEN lote.status = 'ATIVO' THEN lote.quantidade ELSE 0 END) * p.preco_venda as valor_total_estoque,
    MIN(lote.data_validade) as proximo_vencimento
FROM produtos p
JOIN linhas l ON p.linha_id = l.id
JOIN marcas m ON l.marca_id = m.id
LEFT JOIN lotes lote ON p.id = lote.produto_id AND lote.status IN ('ATIVO', 'RESERVADO')
WHERE p.is_active = TRUE AND l.is_active = TRUE AND m.is_active = TRUE
GROUP BY p.id, p.sku, p.nome, m.nome, l.nome, p.preco_venda, p.estoque_minimo
HAVING quantidade_total < estoque_minimo OR quantidade_vencendo_30_dias > 0 OR quantidade_vencida > 0
ORDER BY quantidade_total ASC, proximo_vencimento ASC;

-- Create view for dashboard financial view (capital tied up)
CREATE VIEW view_estoque_financeiro AS
SELECT
    p.id as produto_id,
    p.sku,
    p.nome as produto_nome,
    m.nome as marca,
    l.nome as linha,
    SUM(lote.quantidade) as quantidade_total,
    SUM(lote.quantidade * lote.preco_custo_lote) as valor_custo_total,
    SUM(lote.quantidade * p.preco_venda) as valor_venda_total,
    (SUM(lote.quantidade * p.preco_venda) - SUM(lote.quantidade * lote.preco_custo_lote)) as lucro_potencial,
    AVG(p.margem_lucro_percentual) as margem_media_ponderada
FROM produtos p
JOIN linhas l ON p.linha_id = l.id
JOIN marcas m ON l.marca_id = m.id
JOIN lotes lote ON p.id = lote.produto_id AND lote.status = 'ATIVO'
WHERE p.is_active = TRUE AND l.is_active = TRUE AND m.is_active = TRUE
GROUP BY p.id, p.sku, p.nome, m.nome, l.nome
ORDER BY valor_custo_total DESC;