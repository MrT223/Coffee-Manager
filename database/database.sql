-- ============================================================
-- HỆ THỐNG QUẢN LÝ QUÁN CÀ PHÊ – PostgreSQL Database Schema
-- Tạo: 2026-03-26
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- NHÓM 1: CÁC BẢNG LOOKUP (Thay thế ENUM)
-- ============================================================

-- 1.1 ROLES – Vai trò hệ thống
CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    role_name   VARCHAR(50)  NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO roles (role_name, description) VALUES
    ('Customer', 'Khách hàng – đặt hàng, tích điểm, đổi quà'),
    ('Staff',    'Nhân viên – xử lý đơn hàng, quản lý sản phẩm cơ bản'),
    ('Admin',    'Quản trị viên – toàn quyền quản lý hệ thống');

-- 1.2 PRODUCT_STATUSES – Trạng thái sản phẩm
CREATE TABLE product_statuses (
    id          SERIAL PRIMARY KEY,
    status_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO product_statuses (status_name, description) VALUES
    ('In stock',     'Sản phẩm đang có sẵn'),
    ('Out of stock', 'Sản phẩm tạm hết');

-- 1.3 ORDER_STATUSES – Trạng thái đơn hàng
CREATE TABLE order_statuses (
    id          SERIAL PRIMARY KEY,
    status_name VARCHAR(50) NOT NULL UNIQUE,
    sort_order  INT NOT NULL DEFAULT 0,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO order_statuses (status_name, sort_order, description) VALUES
    ('Chờ xác nhận',  1, 'Đơn hàng mới, chờ nhân viên xác nhận'),
    ('Đang chuẩn bị', 2, 'Nhân viên đang pha chế'),
    ('Đang giao hàng', 3, 'Đơn hàng đang được giao cho khách'),
    ('Đã hoàn thành', 4, 'Đơn hàng đã giao xong'),
    ('Đã hủy',        5, 'Đơn hàng bị hủy');

-- 1.4 REWARD_TYPES – Loại quà/ưu đãi
CREATE TABLE reward_types (
    id          SERIAL PRIMARY KEY,
    type_name   VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO reward_types (type_name, description) VALUES
    ('Gift',     'Quà tặng vật phẩm'),
    ('Discount', 'Mã giảm giá cho đơn hàng');

-- 1.5 POINT_TYPES – Loại biến động điểm
CREATE TABLE point_types (
    id          SERIAL PRIMARY KEY,
    type_name   VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO point_types (type_name, description) VALUES
    ('Earned', 'Điểm tích lũy từ đơn hàng hoàn thành'),
    ('Spent',  'Điểm sử dụng để đổi quà/ưu đãi');

-- ============================================================
-- NHÓM 2: CÁC BẢNG NGHIỆP VỤ CHÍNH
-- ============================================================

-- 2.1 USERS – Tài khoản người dùng
-- UC: UC-01, UC-02, UC-03, UC-21, UC-25, UC-26
CREATE TABLE users (
    id           SERIAL PRIMARY KEY,
    username     VARCHAR(100) NOT NULL UNIQUE,
    password     VARCHAR(255) NOT NULL,              -- Bcrypt hash
    role_id      INT          NOT NULL DEFAULT 1,
    total_points INT          NOT NULL DEFAULT 0 CHECK (total_points >= 0),
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id) REFERENCES roles (id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_role     ON users (role_id);
CREATE INDEX idx_users_active   ON users (is_active) WHERE is_active = TRUE;

-- 2.2 CATEGORIES – Danh mục sản phẩm
-- UC: UC-04, UC-05, UC-18, UC-19, UC-20
CREATE TABLE categories (
    id            SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2.3 PRODUCTS – Sản phẩm
-- UC: UC-04, UC-05, UC-06, UC-14, UC-15, UC-16, UC-17
CREATE TABLE products (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200)   NOT NULL,
    price       NUMERIC(12, 2) NOT NULL CHECK (price > 0),
    quantity    INT            DEFAULT 0,
    category_id INT            NOT NULL,
    image_url   VARCHAR(500),
    status_id   INT            NOT NULL DEFAULT 1,   -- FK → product_statuses
    is_deleted  BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_products_status
        FOREIGN KEY (status_id) REFERENCES product_statuses (id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX idx_products_menu   ON products (category_id, status_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_products_name   ON products USING gin (name gin_trgm_ops);
CREATE INDEX idx_products_status ON products (status_id);

-- 2.4 ORDERS – Đơn hàng
-- UC: UC-07, UC-08, UC-09, UC-10, UC-11, UC-12, UC-13
CREATE TABLE orders (
    id          SERIAL PRIMARY KEY,
    user_id     INT,                                  -- NULL = đơn tại quầy không TK (UC-10)
    total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
    status_id   INT            NOT NULL DEFAULT 1,    -- FK → order_statuses (1 = Chờ xác nhận)
    channel     VARCHAR(10)    NOT NULL DEFAULT 'ONLINE'
                    CHECK (channel IN ('ONLINE', 'POS')),
    staff_id    INT,                                  -- Nhân viên tạo đơn POS (NULL = đơn online)
    order_date  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_orders_status
        FOREIGN KEY (status_id) REFERENCES order_statuses (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_orders_staff
        FOREIGN KEY (staff_id) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX idx_orders_user_date ON orders (user_id, order_date DESC);
CREATE INDEX idx_orders_status    ON orders (status_id) WHERE status_id IN (1, 2, 3);
CREATE INDEX idx_orders_channel   ON orders (channel);
CREATE INDEX idx_orders_staff     ON orders (staff_id) WHERE staff_id IS NOT NULL;

-- 2.5 ORDER_DETAILS – Chi tiết đơn hàng
-- UC: UC-07, UC-08, UC-10
CREATE TABLE order_details (
    id            SERIAL PRIMARY KEY,
    order_id      INT            NOT NULL,
    product_id    INT            NOT NULL,
    quantity      INT            NOT NULL CHECK (quantity > 0),
    price_at_time NUMERIC(12, 2) NOT NULL CHECK (price_at_time >= 0),

    CONSTRAINT fk_od_order
        FOREIGN KEY (order_id) REFERENCES orders (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_od_product
        FOREIGN KEY (product_id) REFERENCES products (id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX idx_od_order   ON order_details (order_id);
CREATE INDEX idx_od_product ON order_details (product_id);

-- 2.6 REWARDS – Danh sách quà/ưu đãi
-- UC: UC-23, UC-27
CREATE TABLE rewards (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(200)   NOT NULL,
    description     TEXT,
    points_required INT            NOT NULL CHECK (points_required > 0),
    reward_type_id  INT            NOT NULL,          -- FK → reward_types
    discount_value  NUMERIC(12, 2) CHECK (discount_value >= 0),
    image_url       VARCHAR(500),
    is_active       BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_rewards_type
        FOREIGN KEY (reward_type_id) REFERENCES reward_types (id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX idx_rewards_active ON rewards (is_active, points_required) WHERE is_active = TRUE;
CREATE INDEX idx_rewards_type   ON rewards (reward_type_id);

-- 2.7 POINT_LOGS – Lịch sử biến động điểm
-- UC: UC-22, UC-23, UC-24
CREATE TABLE point_logs (
    id             SERIAL PRIMARY KEY,
    user_id        INT          NOT NULL,
    order_id       INT,                               -- Đơn hàng liên quan (Earned)
    reward_id      INT,                               -- Quà đổi (Spent)
    point_type_id  INT          NOT NULL,              -- FK → point_types
    points_changed INT          NOT NULL,
    description    VARCHAR(500),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_pl_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_pl_order
        FOREIGN KEY (order_id) REFERENCES orders (id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_pl_reward
        FOREIGN KEY (reward_id) REFERENCES rewards (id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_pl_type
        FOREIGN KEY (point_type_id) REFERENCES point_types (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    -- Earned (type_id=1) → phải có order_id
    CONSTRAINT chk_pl_earned CHECK (point_type_id != 1 OR order_id IS NOT NULL),
    -- Spent  (type_id=2) → phải có reward_id
    CONSTRAINT chk_pl_spent  CHECK (point_type_id != 2 OR reward_id IS NOT NULL)
);

CREATE INDEX idx_pl_user_date ON point_logs (user_id, created_at DESC);
CREATE INDEX idx_pl_type      ON point_logs (point_type_id);

-- ============================================================
-- NHÓM 3: CẤU HÌNH TÍCH ĐIỂM
-- UC: UC-24, UC-27
-- ============================================================

-- 3.1 LOYALTY_CONFIG – Cấu hình hiện tại (singleton)
CREATE TABLE loyalty_config (
    id           SERIAL PRIMARY KEY,
    earning_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.0500
                     CHECK (earning_rate > 0 AND earning_rate <= 1),
    description  VARCHAR(500),
    is_active    BOOLEAN       NOT NULL DEFAULT TRUE,
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_by   INT,

    CONSTRAINT fk_lc_updater
        FOREIGN KEY (updated_by) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

-- Chỉ cho phép 1 config active
CREATE UNIQUE INDEX idx_lc_single_active ON loyalty_config (is_active) WHERE is_active = TRUE;

INSERT INTO loyalty_config (earning_rate, description, is_active)
VALUES (0.0500, 'Mặc định: tích 5% giá trị đơn hàng thành điểm thưởng', TRUE);

-- 3.2 LOYALTY_CONFIG_HISTORY – Lịch sử thay đổi cấu hình
CREATE TABLE loyalty_config_history (
    id               SERIAL PRIMARY KEY,
    config_id        INT            NOT NULL,
    old_earning_rate NUMERIC(5, 4)  NOT NULL,
    new_earning_rate NUMERIC(5, 4)  NOT NULL,
    changed_by       INT,
    changed_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_lch_config
        FOREIGN KEY (config_id) REFERENCES loyalty_config (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_lch_user
        FOREIGN KEY (changed_by) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

-- ============================================================
-- NHÓM 4: AUDIT LOG – Ghi lại mọi thao tác trong hệ thống
-- ============================================================

CREATE TABLE audit_logs (
    id           BIGSERIAL PRIMARY KEY,
    table_name   VARCHAR(100) NOT NULL,               -- Tên bảng bị thay đổi
    record_id    INT          NOT NULL,                -- ID bản ghi bị thay đổi
    action       VARCHAR(10)  NOT NULL                 -- 'INSERT', 'UPDATE', 'DELETE'
                     CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data     JSONB,                                -- Dữ liệu trước khi thay đổi
    new_data     JSONB,                                -- Dữ liệu sau khi thay đổi
    performed_by INT,                                  -- User thực hiện (NULL = system)
    performed_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    ip_address   VARCHAR(45),                          -- IPv4/IPv6
    user_agent   VARCHAR(500),                         -- Trình duyệt/client

    CONSTRAINT fk_audit_user
        FOREIGN KEY (performed_by) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

-- Indexes cho audit log
CREATE INDEX idx_audit_table    ON audit_logs (table_name, record_id);
CREATE INDEX idx_audit_user     ON audit_logs (performed_by);
CREATE INDEX idx_audit_time     ON audit_logs (performed_at DESC);
CREATE INDEX idx_audit_action   ON audit_logs (action);
-- GIN index cho tìm kiếm trong JSONB
CREATE INDEX idx_audit_old_data ON audit_logs USING gin (old_data);
CREATE INDEX idx_audit_new_data ON audit_logs USING gin (new_data);

-- ============================================================
-- NHÓM 5: TRIGGERS
-- ============================================================

-- 5.1 Auto-update updated_at
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_ts       BEFORE UPDATE ON users           FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_categories_ts  BEFORE UPDATE ON categories      FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_products_ts    BEFORE UPDATE ON products        FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_orders_ts      BEFORE UPDATE ON orders          FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_rewards_ts     BEFORE UPDATE ON rewards         FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_lc_ts          BEFORE UPDATE ON loyalty_config  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- 5.2 Loyalty config history trigger
CREATE OR REPLACE FUNCTION fn_log_loyalty_config_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.earning_rate != NEW.earning_rate THEN
        INSERT INTO loyalty_config_history
            (config_id, old_earning_rate, new_earning_rate, changed_by)
        VALUES
            (OLD.id, OLD.earning_rate, NEW.earning_rate, NEW.updated_by);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lc_history
    AFTER UPDATE ON loyalty_config
    FOR EACH ROW EXECUTE FUNCTION fn_log_loyalty_config_change();

-- 5.3 Generic audit trigger function
CREATE OR REPLACE FUNCTION fn_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', NULL, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), NULL);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Áp dụng audit trigger cho các bảng nghiệp vụ
CREATE TRIGGER trg_audit_users          AFTER INSERT OR UPDATE OR DELETE ON users          FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
CREATE TRIGGER trg_audit_categories     AFTER INSERT OR UPDATE OR DELETE ON categories     FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
CREATE TRIGGER trg_audit_products       AFTER INSERT OR UPDATE OR DELETE ON products       FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
CREATE TRIGGER trg_audit_orders         AFTER INSERT OR UPDATE OR DELETE ON orders         FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
CREATE TRIGGER trg_audit_order_details  AFTER INSERT OR UPDATE OR DELETE ON order_details  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
CREATE TRIGGER trg_audit_rewards        AFTER INSERT OR UPDATE OR DELETE ON rewards        FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
CREATE TRIGGER trg_audit_point_logs     AFTER INSERT OR UPDATE OR DELETE ON point_logs     FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
CREATE TRIGGER trg_audit_loyalty_config AFTER INSERT OR UPDATE OR DELETE ON loyalty_config FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

-- ============================================================
-- GHI CHÚ SỬ DỤNG
-- ============================================================
-- Tạo tài khoản (hash bcrypt):
--   INSERT INTO users (username, password, role_id)
--   VALUES ('customer1', crypt('plain_password', gen_salt('bf')), 1);
--
-- Xác thực đăng nhập:
--   SELECT * FROM users
--   WHERE username = 'customer1'
--     AND password = crypt('plain_password', password);
--
-- Audit log với thông tin user (gọi từ app layer):
--   -- App layer nên SET session variable trước mỗi request:
--   SET LOCAL app.current_user_id = '5';
--   -- Hoặc dùng cột performed_by qua app INSERT trực tiếp
-- ============================================================
