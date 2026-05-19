#!/bin/bash
# ============================================================
# Coffee Manager — One-time AWS EC2 Server Setup Script
# OS: Ubuntu 24.04 LTS
#
# Cách chạy:
#   chmod +x scripts/setup-server.sh
#   ./scripts/setup-server.sh
# ============================================================
set -e

echo "=========================================="
echo "  Coffee Manager — Server Setup"
echo "=========================================="

# --- 1. Cài đặt Docker ---
echo ""
echo ">>> [1/5] Cài đặt Docker..."
if ! command -v docker &> /dev/null; then
    sudo apt-get update
    sudo apt-get install -y docker.io docker-compose-plugin
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker "$USER"
    echo "Docker đã cài xong. Bạn cần logout/login lại để chạy docker không cần sudo."
else
    echo "Docker đã được cài sẵn."
fi

# --- 2. Cài đặt Git (nếu chưa có) ---
echo ""
echo ">>> [2/5] Kiểm tra Git..."
if ! command -v git &> /dev/null; then
    sudo apt-get install -y git
fi
echo "Git OK: $(git --version)"

# --- 3. Clone repository ---
echo ""
echo ">>> [3/5] Clone repository..."
if [ -d "$HOME/Coffee-Manager" ]; then
    echo "Thư mục ~/Coffee-Manager đã tồn tại. Bỏ qua clone."
else
    git clone https://github.com/MrT223/Coffee-Manager.git "$HOME/Coffee-Manager"
    echo "Clone xong."
fi
cd "$HOME/Coffee-Manager"

# --- 4. Tạo file .env ---
echo ""
echo ">>> [4/5] Tạo file .env..."
if [ -f ".env" ]; then
    echo "File .env đã tồn tại. Bỏ qua."
else
    cp .env.example .env
    echo ""
    echo "  HÃY CHỈNH SỬA FILE .env TRƯỚC KHI TIẾP TỤC!"
    echo "   nano ~/Coffee-Manager/.env"
    echo ""
    echo "Đặc biệt chú ý:"
    echo "  - DB_PASSWORD: đổi thành mật khẩu mạnh"
    echo "  - SECRET_KEY: đổi thành chuỗi ngẫu nhiên"
    echo "  - VNPAY_RETURN_URL: đổi thành http://32.236.13.233/payment-return"
    echo "  - SMTP credentials nếu cần gửi mail"
    echo ""
    read -p "Nhấn Enter sau khi đã chỉnh sửa .env để tiếp tục..." _
fi

# --- 5. Khởi chạy Docker ---
echo ""
echo ">>> [5/5] Khởi chạy Docker Compose..."
docker compose up -d --build

echo ""
echo ">>> Chờ database khởi tạo..."
sleep 8

echo ">>> Chạy migrations..."
docker compose exec -T backend python -m database.migrate_vnpay || true
docker compose exec -T backend python -m database.init_db || true

echo ""
echo "=========================================="
echo "   Setup hoàn tất!"
echo "=========================================="
echo ""
echo "Truy cập: http://32.236.13.233"
echo "Health check: http://32.236.13.233/api/health"
echo ""
echo "Kiểm tra logs: docker compose logs -f"
echo "Kiểm tra status: docker compose ps"
echo ""
echo "  Nhớ copy file serviceAccountKey.json (nếu cần Firebase):"
echo "   scp backend/serviceAccountKey.json ubuntu@32.236.13.233:~/Coffee-Manager/backend/"
