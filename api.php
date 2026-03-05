<?php
/**
 * Akagera Motors Rwanda — Backend API
 * Single-file REST API handling auth, cars, orders, and admin operations.
 * Requires PHP 8.0+ and PDO MySQL extension.
 */

// ── Configuration ─────────────────────────────────────────────────────────────
define('DB_HOST', 'localhost');
define('DB_NAME', 'akagera_motors');
define('DB_USER', 'root');         // Change in production
define('DB_PASS', '');             // Change in production
define('JWT_SECRET', 'CHANGE_THIS_SECRET_IN_PRODUCTION_akagera2024');
define('GOOGLE_CLIENT_ID', 'YOUR_GOOGLE_CLIENT_ID'); // Set in production
define('UPLOAD_DIR', __DIR__ . '/../images/');
define('UPLOAD_URL', '../images/');

// ── CORS & Headers ────────────────────────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// ── Database Connection ───────────────────────────────────────────────────────
function db(): PDO {
    static $pdo = null;
    if (!$pdo) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
                DB_USER, DB_PASS,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                 PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
            );
        } catch (PDOException $e) {
            respond(500, ['error' => 'Database connection failed']);
        }
    }
    return $pdo;
}

// ── JWT Helpers ───────────────────────────────────────────────────────────────
function jwtEncode(array $payload): string {
    $header  = base64url(json_encode(['alg'=>'HS256','typ'=>'JWT']));
    $payload = base64url(json_encode(array_merge($payload, ['exp' => time() + 86400 * 7])));
    $sig     = base64url(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    return "$header.$payload.$sig";
}

function jwtDecode(string $token): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$h, $p, $s] = $parts;
    $expected = base64url(hash_hmac('sha256', "$h.$p", JWT_SECRET, true));
    if (!hash_equals($expected, $s)) return null;
    $payload = json_decode(base64_decode(strtr($p, '-_', '+/')), true);
    if (!$payload || $payload['exp'] < time()) return null;
    return $payload;
}

function base64url(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function authUser(): ?array {
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/Bearer\s+(.+)/i', $h, $m)) return null;
    return jwtDecode($m[1]);
}

function requireAuth(): array {
    $u = authUser();
    if (!$u) respond(401, ['error' => 'Authentication required']);
    return $u;
}

function requireAdmin(): array {
    $u = requireAuth();
    if (!$u['is_admin']) respond(403, ['error' => 'Admin access required']);
    return $u;
}

// ── Response Helper ───────────────────────────────────────────────────────────
function respond(int $code, array $data): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// ── Router ────────────────────────────────────────────────────────────────────
$method = $_SERVER['REQUEST_METHOD'];
$path   = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$parts  = explode('/', $path);
// Remove "php" prefix if present (e.g. php/api/cars → api/cars)
if ($parts[0] === 'php') array_shift($parts);
$endpoint = $parts[1] ?? '';
$idRaw    = $parts[2] ?? '';
$id       = (int)$idRaw;
$body     = json_decode(file_get_contents('php://input'), true) ?? [];

match ($endpoint) {
    // ── AUTH ──────────────────────────────────────────────────────────────────
    'register'      => handleRegister($body),
    'login'         => handleLogin($body),
    'google-login'  => handleGoogleLogin($body),

    // ── CARS (public) ────────────────────────────────────────────────────────
    'cars'          => match ($method) {
        'GET'  => $id ? getCarById($id) : getCars(),
        'POST' => addCar(requireAdmin(), $body),
        'PUT'  => updateCar(requireAdmin(), $id, $body),
        'DELETE' => deleteCar(requireAdmin(), $id),
        default => respond(405, ['error' => 'Method not allowed'])
    },
    'brands'        => getBrands(),

    // ── ORDERS ───────────────────────────────────────────────────────────────
    'orders'        => match ($method) {
        'POST'   => placeOrder(requireAuth(), $body),
        'GET'    => $id ? getOrderById(requireAuth(), $id) : getOrders(requireAuth()),
        'DELETE' => $idRaw === 'all' ? clearOrders(requireAuth()) : ($id ? deleteOrder(requireAuth(), $id) : clearOrders(requireAuth())),
        default  => respond(405, ['error' => 'Method not allowed'])
    },

    // ── ADMIN ────────────────────────────────────────────────────────────────
    'admin-orders'  => getAllOrders(requireAdmin()),
    'admin-users'   => getAllUsers(requireAdmin()),
    'order-status'  => updateOrderStatus(requireAdmin(), $id, $body),

    // ── UPLOAD ───────────────────────────────────────────────────────────────
    'upload'        => handleUpload(requireAdmin()),

    default         => respond(404, ['error' => 'Endpoint not found'])
};

// ── AUTH HANDLERS ─────────────────────────────────────────────────────────────
function handleRegister(array $b): void {
    $name  = trim($b['name']  ?? '');
    $email = trim($b['email'] ?? '');
    $pass  = $b['password']   ?? '';
    if (!$name || !$email || !$pass) respond(400, ['error' => 'Name, email and password required']);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) respond(400, ['error' => 'Invalid email']);
    if (strlen($pass) < 6) respond(400, ['error' => 'Password must be at least 6 characters']);

    $hash = password_hash($pass, PASSWORD_BCRYPT);
    try {
        $stmt = db()->prepare('INSERT INTO users (name,email,password) VALUES (?,?,?)');
        $stmt->execute([$name, $email, $hash]);
        $uid = (int)db()->lastInsertId();
        respond(201, ['token' => jwtEncode(['id'=>$uid,'email'=>$email,'name'=>$name,'is_admin'=>0])]);
    } catch (PDOException $e) {
        if ($e->errorInfo[1] === 1062) respond(409, ['error' => 'Email already registered']);
        respond(500, ['error' => 'Registration failed']);
    }
}

function handleLogin(array $b): void {
    $email = trim($b['email'] ?? '');
    $pass  = $b['password']  ?? '';
    if (!$email || !$pass) respond(400, ['error' => 'Email and password required']);

    $stmt = db()->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($pass, $user['password'] ?? ''))
        respond(401, ['error' => 'Invalid credentials']);

    respond(200, [
        'token'    => jwtEncode(['id'=>$user['id'],'email'=>$user['email'],'name'=>$user['name'],'is_admin'=>(int)$user['is_admin']]),
        'is_admin' => (bool)$user['is_admin'],
        'name'     => $user['name']
    ]);
}

function handleGoogleLogin(array $b): void {
    // Verify Google ID token via Google API
    $idToken = $b['id_token'] ?? '';
    if (!$idToken) respond(400, ['error' => 'Google id_token required']);

    $url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($idToken);
    $response = @file_get_contents($url);
    if (!$response) respond(502, ['error' => 'Could not verify Google token']);

    $gData = json_decode($response, true);
    if (!isset($gData['sub']) || ($gData['aud'] ?? '') !== GOOGLE_CLIENT_ID)
        respond(401, ['error' => 'Invalid Google token']);

    $googleId = $gData['sub'];
    $email    = $gData['email'];
    $name     = $gData['name'] ?? $email;

    // Upsert user
    $stmt = db()->prepare('SELECT * FROM users WHERE google_id=? OR email=? LIMIT 1');
    $stmt->execute([$googleId, $email]);
    $user = $stmt->fetch();

    if ($user) {
        // Update google_id if not set
        if (!$user['google_id']) {
            db()->prepare('UPDATE users SET google_id=? WHERE id=?')->execute([$googleId, $user['id']]);
        }
    } else {
        db()->prepare('INSERT INTO users (name,email,google_id) VALUES (?,?,?)')->execute([$name,$email,$googleId]);
        $user = ['id'=>(int)db()->lastInsertId(),'name'=>$name,'email'=>$email,'is_admin'=>0];
    }

    respond(200, [
        'token'    => jwtEncode(['id'=>$user['id'],'email'=>$user['email'],'name'=>$user['name'],'is_admin'=>(int)$user['is_admin']]),
        'is_admin' => (bool)$user['is_admin'],
        'name'     => $user['name']
    ]);
}

// ── CAR HANDLERS ──────────────────────────────────────────────────────────────
function getCars(): void {
    $stmt = db()->query('
        SELECT c.*, b.name AS brand_name, b.logo_url
        FROM cars c JOIN brands b ON c.brand_id = b.id
        WHERE c.is_active = 1
        ORDER BY b.sort_order, c.name
    ');
    $cars = $stmt->fetchAll();
    foreach ($cars as &$car) {
        $car['colors'] = json_decode($car['colors'] ?? '[]', true);
    }
    respond(200, $cars);
}

function getCarById(int $id): void {
    $stmt = db()->prepare('
        SELECT c.*, b.name AS brand_name, b.logo_url
        FROM cars c JOIN brands b ON c.brand_id = b.id
        WHERE c.id = ? AND c.is_active = 1
    ');
    $stmt->execute([$id]);
    $car = $stmt->fetch();
    if (!$car) respond(404, ['error' => 'Car not found']);
    $car['colors'] = json_decode($car['colors'] ?? '[]', true);
    respond(200, $car);
}

function getBrands(): void {
    $stmt = db()->query('SELECT * FROM brands ORDER BY sort_order');
    respond(200, $stmt->fetchAll());
}

function addCar(array $admin, array $b): void {
    $required = ['brand_id','name','price_rwf','delivery_days'];
    foreach ($required as $f) if (empty($b[$f])) respond(400, ['error' => "Field $f required"]);

    $stmt = db()->prepare('
        INSERT INTO cars (brand_id,name,description,price_rwf,delivery_days,is_electric,image1,image2,image3,colors)
        VALUES (?,?,?,?,?,?,?,?,?,?)
    ');
    $stmt->execute([
        $b['brand_id'], $b['name'], $b['description'] ?? '',
        $b['price_rwf'], $b['delivery_days'], $b['is_electric'] ?? 0,
        $b['image1'] ?? null, $b['image2'] ?? null, $b['image3'] ?? null,
        json_encode($b['colors'] ?? [])
    ]);
    respond(201, ['id' => (int)db()->lastInsertId(), 'message' => 'Car added successfully']);
}

function updateCar(array $admin, int $id, array $b): void {
    if (!$id) respond(400, ['error' => 'Car ID required']);
    $fields = ['brand_id','name','description','price_rwf','delivery_days','is_electric','image1','image2','image3','is_active'];
    $sets = []; $vals = [];
    foreach ($fields as $f) {
        if (array_key_exists($f, $b)) { $sets[] = "$f = ?"; $vals[] = $b[$f]; }
    }
    if (isset($b['colors'])) { $sets[] = 'colors = ?'; $vals[] = json_encode($b['colors']); }
    if (!$sets) respond(400, ['error' => 'Nothing to update']);
    $vals[] = $id;
    db()->prepare('UPDATE cars SET ' . implode(',', $sets) . ' WHERE id = ?')->execute($vals);
    respond(200, ['message' => 'Car updated']);
}

function deleteCar(array $admin, int $id): void {
    db()->prepare('UPDATE cars SET is_active=0 WHERE id=?')->execute([$id]);
    respond(200, ['message' => 'Car removed']);
}

// ── ORDER HANDLERS ────────────────────────────────────────────────────────────
function placeOrder(array $user, array $b): void {
    $required = ['car_id','selected_color','delivery_address','phone'];
    foreach ($required as $f) if (empty($b[$f])) respond(400, ['error' => "Field $f required"]);

    $stmt = db()->prepare('
        INSERT INTO orders (user_id,car_id,selected_color,delivery_address,phone,lat,lng,notes)
        VALUES (?,?,?,?,?,?,?,?)
    ');
    $stmt->execute([
        $user['id'], $b['car_id'], $b['selected_color'],
        $b['delivery_address'], $b['phone'],
        $b['lat'] ?? null, $b['lng'] ?? null, $b['notes'] ?? null
    ]);
    respond(201, ['order_id' => (int)db()->lastInsertId(), 'message' => 'Order placed successfully']);
}

function getOrders(array $user): void {
    $stmt = db()->prepare('
        SELECT o.*, c.name AS car_name, c.image1, b.name AS brand_name
        FROM orders o
        JOIN cars c ON o.car_id = c.id
        JOIN brands b ON c.brand_id = b.id
        WHERE o.user_id = ?
        ORDER BY o.ordered_at DESC
    ');
    $stmt->execute([$user['id']]);
    respond(200, $stmt->fetchAll());
}

function getOrderById(array $user, int $id): void {
    $stmt = db()->prepare('SELECT * FROM orders WHERE id=? AND user_id=?');
    $stmt->execute([$id, $user['id']]);
    $order = $stmt->fetch();
    if (!$order) respond(404, ['error' => 'Order not found']);
    respond(200, $order);
}

function deleteOrder(array $user, int $id): void {
    $stmt = db()->prepare('DELETE FROM orders WHERE id=? AND user_id=?');
    $stmt->execute([$id, $user['id']]);
    respond(200, ['message' => 'Order removed']);
}

function clearOrders(array $user): void {
    db()->prepare('DELETE FROM orders WHERE user_id=?')->execute([$user['id']]);
    respond(200, ['message' => 'All orders cleared']);
}

function getAllOrders(array $admin): void {
    $stmt = db()->query('
        SELECT o.*, u.name AS user_name, u.email AS user_email,
               c.name AS car_name, c.image1, b.name AS brand_name
        FROM orders o
        JOIN users u ON o.user_id = u.id
        JOIN cars c ON o.car_id = c.id
        JOIN brands b ON c.brand_id = b.id
        ORDER BY o.ordered_at DESC
    ');
    respond(200, $stmt->fetchAll());
}

function getAllUsers(array $admin): void {
    $stmt = db()->query('SELECT id,name,email,is_admin,phone,created_at FROM users ORDER BY created_at DESC');
    respond(200, $stmt->fetchAll());
}

function updateOrderStatus(array $admin, int $id, array $b): void {
    $status = $b['status'] ?? '';
    $allowed = ['pending','confirmed','delivered','cancelled'];
    if (!in_array($status, $allowed)) respond(400, ['error' => 'Invalid status']);
    db()->prepare('UPDATE orders SET status=? WHERE id=?')->execute([$status, $id]);
    respond(200, ['message' => 'Status updated']);
}

// ── FILE UPLOAD ───────────────────────────────────────────────────────────────
function handleUpload(array $admin): void {
    if (empty($_FILES['file'])) respond(400, ['error' => 'No file uploaded']);
    $file = $_FILES['file'];
    $allowed = ['image/jpeg','image/png','image/webp'];
    if (!in_array($file['type'], $allowed)) respond(400, ['error' => 'Only JPG/PNG/WebP allowed']);
    if ($file['size'] > 5 * 1024 * 1024) respond(400, ['error' => 'File too large (max 5MB)']);

    $ext  = pathinfo($file['name'], PATHINFO_EXTENSION);
    $name = 'cars/' . uniqid('car_') . '.' . $ext;
    $dest = UPLOAD_DIR . $name;

    if (!is_dir(UPLOAD_DIR . 'cars')) mkdir(UPLOAD_DIR . 'cars', 0755, true);
    if (!move_uploaded_file($file['tmp_name'], $dest)) respond(500, ['error' => 'Upload failed']);

    respond(200, ['url' => UPLOAD_URL . $name]);
}
