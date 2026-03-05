-- ============================================================
-- Akagera Motors Rwanda - Database Setup Script
-- Run this once to initialize the full database
-- ============================================================

CREATE DATABASE IF NOT EXISTS akagera_motors CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE akagera_motors;

-- ============================================================
-- TABLE: users
-- Stores customer and admin accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)  NOT NULL,
    email       VARCHAR(150)  NOT NULL UNIQUE,
    password    VARCHAR(255)  NULL COMMENT 'NULL if Google login',
    google_id   VARCHAR(255)  NULL COMMENT 'Google OAuth sub ID',
    is_admin    TINYINT(1)    NOT NULL DEFAULT 0 COMMENT '1 = admin, 0 = customer',
    phone       VARCHAR(30)   NULL,
    lat         DECIMAL(10,7) NULL COMMENT 'Device GPS latitude',
    lng         DECIMAL(10,7) NULL COMMENT 'Device GPS longitude',
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_google (google_id)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: brands
-- Car brands/manufacturers
-- ============================================================
CREATE TABLE IF NOT EXISTS brands (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(80)  NOT NULL UNIQUE,
    logo_url   VARCHAR(500) NULL COMMENT 'Path to brand logo image',
    sort_order INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: cars
-- All cars available for sale
-- ============================================================
CREATE TABLE IF NOT EXISTS cars (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    brand_id      INT           NOT NULL,
    name          VARCHAR(150)  NOT NULL,
    description   TEXT          NULL,
    price_rwf     BIGINT        NOT NULL COMMENT 'Price in Rwandan Francs',
    delivery_days INT           NOT NULL DEFAULT 30 COMMENT 'Estimated delivery in days',
    is_electric   TINYINT(1)    NOT NULL DEFAULT 0,
    image1        VARCHAR(500)  NULL,
    image2        VARCHAR(500)  NULL,
    image3        VARCHAR(500)  NULL,
    colors        JSON          NULL COMMENT 'Array of hex color codes e.g. ["#000000","#FFFFFF"]',
    is_active     TINYINT(1)    NOT NULL DEFAULT 1,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
    INDEX idx_brand (brand_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: orders
-- Customer car orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT          NOT NULL,
    car_id           INT          NOT NULL,
    selected_color   VARCHAR(20)  NOT NULL COMMENT 'Hex color chosen by user',
    delivery_address TEXT         NOT NULL,
    phone            VARCHAR(30)  NOT NULL,
    lat              DECIMAL(10,7) NULL,
    lng              DECIMAL(10,7) NULL,
    status           ENUM('pending','confirmed','delivered','cancelled') NOT NULL DEFAULT 'pending',
    notes            TEXT         NULL,
    ordered_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (car_id)  REFERENCES cars(id)  ON DELETE CASCADE,
    INDEX idx_user   (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- SEED: Default admin user
-- Password: Admin@2024  (bcrypt hash below)
-- CHANGE THIS PASSWORD IMMEDIATELY IN PRODUCTION
-- ============================================================
INSERT IGNORE INTO users (name, email, password, is_admin)
VALUES ('Admin', 'admin@akageramotors.rw',
        '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1);

-- ============================================================
-- SEED: Car brands
-- ============================================================
INSERT IGNORE INTO brands (name, logo_url, sort_order) VALUES
('Toyota',      'images/logos/toyota.svg',   1),
('Mitsubishi',  'images/logos/mitsubishi.svg',2),
('Volkswagen',  'images/logos/vw.svg',        3),
('Mercedes-Benz','images/logos/mercedes.svg', 4),
('BMW',         'images/logos/bmw.svg',       5),
('Nissan',      'images/logos/nissan.svg',    6),
('BYD',         'images/logos/byd.svg',       7),
('Chery',       'images/logos/chery.svg',     8),
('Geely',       'images/logos/geely.svg',     9),
('MG',          'images/logos/mg.svg',       10),
('Tesla',       'images/logos/tesla.svg',    11),
('Hyundai',     'images/logos/hyundai.svg',  12);

-- ============================================================
-- SEED: Sample cars
-- ============================================================
INSERT IGNORE INTO cars (brand_id, name, description, price_rwf, delivery_days, is_electric, image1, colors) VALUES
(1, 'Toyota Land Cruiser 300', 'The iconic off-roader, reimagined for modern Rwanda.', 85000000, 45, 0, 'images/cars/landcruiser.jpg', '["#1C1C1E","#F5F5F0","#8E8E93","#C0392B"]'),
(1, 'Toyota Hilux 2024',       'Rwanda\'s most trusted pickup, built for every road.', 42000000, 30, 0, 'images/cars/hilux.jpg',      '["#1C1C1E","#F5F5F0","#3D6B9E","#8E8E93"]'),
(2, 'Mitsubishi Pajero Sport', 'Bold, capable, and refined for African terrain.',       55000000, 35, 0, 'images/cars/pajero.jpg',     '["#1C1C1E","#E8E8E3","#5D4037"]'),
(4, 'Mercedes GLE 450',        'Luxury SUV with unmatched comfort and presence.',      120000000, 60, 0, 'images/cars/gle.jpg',        '["#1C1C1E","#F5F5F0","#C0B080","#2C3E50"]'),
(7, 'BYD Atto 3',              '100% electric — zero emissions, maximum range.',        48000000, 40, 1, 'images/cars/atto3.jpg',      '["#1C1C1E","#F5F5F0","#3D9970","#2980B9"]'),
(7, 'BYD Han EV',              'Premium electric sedan with 550km range.',              72000000, 50, 1, 'images/cars/han.jpg',        '["#1C1C1E","#F5F5F0","#8E44AD"]'),
(11,'Tesla Model 3',           'The world\'s best-selling electric car.',               65000000, 90, 1, 'images/cars/model3.jpg',     '["#1C1C1E","#F5F5F0","#E74C3C","#3498DB"]'),
(10,'MG ZS EV',                'Affordable electric SUV for city and highway.',         38000000, 35, 1, 'images/cars/mgzs.jpg',       '["#1C1C1E","#E8E8E3","#E74C3C","#2980B9"]');
