# Akagera Motors Rwanda — Setup Guide

## Project Structure
```
akagera-motors/
├── index.html          ← Main frontend (single page app)
├── css/
│   └── style.css       ← All styles (light/dark, responsive)
├── js/
│   └── app.js          ← All frontend logic (auth, cars, orders, i18n)
├── php/
│   └── api.php         ← Full backend REST API (single file)
├── sql/
│   └── database.sql    ← MySQL schema + seed data
├── images/
│   ├── logos/          ← Brand logo SVGs (add manually)
│   └── cars/           ← Car photos (uploaded via admin or add manually)
└── README.md
```

---

## Quick Start

### 1. Requirements
- PHP 8.0+ with PDO MySQL extension
- MySQL 5.7+ or MariaDB 10.3+
- Web server: Apache or Nginx (or PHP built-in for testing)

### 2. Database Setup
```sql
-- Run this in MySQL:
mysql -u root -p < sql/database.sql
```
This creates the database, all tables, and seeds:
- Default admin user: `admin@akageramotors.rw` / password: `Admin@2024`
- 12 car brands (Toyota, BMW, BYD, Tesla, etc.)
- 8 sample cars

**⚠️ IMPORTANT: Change the admin password immediately after setup.**

### 3. Configure the API
Edit `php/api.php` — update these lines at the top:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'akagera_motors');
define('DB_USER', 'your_mysql_user');
define('DB_PASS', 'your_mysql_password');
define('JWT_SECRET', 'your-long-random-secret-string');
define('GOOGLE_CLIENT_ID', 'your-google-client-id'); // optional
```

### 4. Configure Google Login (Optional)
1. Go to https://console.cloud.google.com
2. Create a new project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add your domain to "Authorized origins"
5. Copy the Client ID into `php/api.php` and `js/app.js`

### 5. Web Server
**Apache** — place project in `/var/www/html/akagera-motors/` or use `.htaccess`:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
</IfModule>
```

**PHP built-in server (for testing only):**
```bash
cd akagera-motors
php -S localhost:8000
```
Then open http://localhost:8000

### 6. Upload Brand Logos
Place SVG logos in `images/logos/`:
- `toyota.svg`, `mitsubishi.svg`, `vw.svg`, `mercedes.svg`
- `bmw.svg`, `nissan.svg`, `byd.svg`, `chery.svg`
- `geely.svg`, `mg.svg`, `tesla.svg`, `hyundai.svg`

Free logos: https://worldvectorlogo.com or https://brandsoftheworld.com

### 7. Admin Login
Visit the site → click Sign In → use:
- Email: `admin@akageramotors.rw`
- Password: `Admin@2024`

Admin panel appears automatically for admin users.

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/register` | — | Register new user |
| POST | `/api/login` | — | Login (returns JWT) |
| POST | `/api/google-login` | — | Google OAuth login |
| GET | `/api/cars` | — | List all cars |
| GET | `/api/cars/{id}` | — | Single car details |
| POST | `/api/cars` | Admin | Add new car |
| PUT | `/api/cars/{id}` | Admin | Update car |
| DELETE | `/api/cars/{id}` | Admin | Remove car |
| GET | `/api/brands` | — | List brands |
| POST | `/api/orders` | User | Place order |
| GET | `/api/orders` | User | My orders |
| GET | `/api/admin-orders` | Admin | All orders |
| GET | `/api/admin-users` | Admin | All users |
| PUT | `/api/order-status/{id}` | Admin | Update order status |
| POST | `/api/upload` | Admin | Upload car image |

---

## Database Tables

### users
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | Auto increment |
| name | VARCHAR(100) | Full name |
| email | VARCHAR(150) | Unique |
| password | VARCHAR(255) | Bcrypt, NULL for Google |
| google_id | VARCHAR(255) | Google OAuth sub |
| is_admin | TINYINT(1) | 0=user, 1=admin |
| phone | VARCHAR(30) | Optional |
| lat, lng | DECIMAL(10,7) | GPS coordinates |

### cars
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| brand_id | INT FK | → brands.id |
| name | VARCHAR(150) | |
| price_rwf | BIGINT | Price in RWF |
| delivery_days | INT | Estimated days |
| is_electric | TINYINT(1) | EV flag |
| image1/2/3 | VARCHAR(500) | Up to 3 images |
| colors | JSON | Array of hex codes |

### orders
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| user_id | INT FK | |
| car_id | INT FK | |
| selected_color | VARCHAR(20) | Hex code |
| delivery_address | TEXT | |
| phone | VARCHAR(30) | |
| lat, lng | DECIMAL(10,7) | GPS |
| status | ENUM | pending/confirmed/delivered/cancelled |

---

## Languages Supported
- 🇬🇧 English (`en`)
- 🇫🇷 French (`fr`)
- 🇷🇼 Kinyarwanda (`rw`)
- 🇰🇪 Kiswahili (`sw`)

Switch languages using the EN/FR/RW/SW buttons in the navigation bar.

---

## Production Checklist
- [ ] Change admin password
- [ ] Set strong JWT_SECRET (32+ random chars)
- [ ] Configure real DB credentials
- [ ] Set up Google OAuth Client ID
- [ ] Enable HTTPS (SSL certificate)
- [ ] Set PHP error display OFF in php.ini
- [ ] Configure proper file upload limits
- [ ] Add real car images
- [ ] Add brand logos
- [ ] Test all flows: register → browse → order → admin
