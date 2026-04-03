# Coffee Manager

Hệ thống quản lý quán cà phê hiện đại với các chức năng bán hàng, quản lý đơn hàng chuyên sâu và chương trình tích lũy điểm dành cho khách hàng. Hệ thống phục vụ ba nhóm người dùng chính: Khách hàng, Nhân viên và Quản trị viên.

## 1. Giới thiệu

Hệ thống được thiết kế nhằm mục đích tối ưu hóa quy trình bán hàng tại quán cà phê, cung cấp trải nghiệm đặt hàng thuận tiện cho khách hàng và công cụ quản lý hiệu quả cho đội ngũ nhân viên và quản trị viên.

## 2. Tính năng chính

### Khách hàng (Customer)
- Đăng nhập và đăng ký tài khoản.
- Xem thực đơn, tìm kiếm và lọc sản phẩm.
- Thêm sản phẩm vào giỏ hàng và đặt hàng trực tuyến.
- Xem lịch sử đơn hàng và hủy đơn hàng (khi đang ở trạng thái chờ xác nhận).
- Tra cứu số dư và xem lịch sử trạng thái điểm tích lũy.
- Đổi điểm lấy quà tặng hoặc giảm giá.

### Nhân viên (Staff)
- Theo dõi và xử lý danh sách đơn hàng mới.
- Cập nhật trạng thái đơn hàng (Xác nhận, Đang chuẩn bị, Đã hoàn thành).
- Khởi tạo đơn hàng trực tiếp cho khách mua tại quầy.
- Quản lý danh mục sản phẩm ở mức độ cơ bản (Cập nhật trạng thái còn hàng/hết hàng, sửa đổi thông tin hoặc thêm mới).

### Quản trị viên (Admin)
- Quản lý toàn bộ danh sách tài khoản người dùng và phân cấp quyền trong hệ thống.
- Cấu hình chuyên sâu danh mục sản phẩm và các loại đồ uống (bao gồm bảo toàn dữ liệu bằng xóa mềm - Soft Delete).
- Thiết lập và quản lý quy tắc của chương trình tích điểm.

## 3. Công nghệ sử dụng

- Backend: Python với framework FastAPI.
- Frontend: React.js kết hợp cùng Tailwind CSS.
- Cơ sở dữ liệu: PostgreSQL.
- Phương thức giao tiếp: RESTful API với định dạng chuẩn JSON.
- Cơ chế xác thực: JWT Authentication.

## 4. Cấu trúc dữ liệu cơ bản

Hệ thống sử dụng cơ sở dữ liệu quan hệ (PostgreSQL) để duy trì tính toàn vẹn:
- Users: Lưu trữ thông tin định danh, quyền hạn và số điểm tích lũy của cá nhân.
- Categories: Định nghĩa các nhóm danh mục phân loại đồ uống.
- Products: Nắm giữ thông tin chi tiết về từng thức uống và cờ trạng thái thương mại hiện tại.
- Orders: Tổng hợp các thông số cốt lõi và trạng thái tiến trình của mỗi đơn đặt hàng.
- OrderDetails: Ghi chú chi tiết các sản phẩm tồn tại bên trong một đơn hàng cụ thể.
- PointLogs: Nhật ký phản ánh toàn bộ các biến động cộng/trừ điểm tích lũy của khách hàng để phục vụ đối soát.

## 5. Hướng dẫn thiết lập và khởi chạy

Hệ thống hỗ trợ các tệp script tự động để thiết lập và khởi chạy nhanh chóng trên Windows.

### Bước 1: Cài đặt môi trường
Chạy tệp `setup_project.bat` để tự động tạo môi trường ảo Python và cài đặt các thư viện cần thiết cho cả Backend và Frontend.

### Bước 2: Cấu hình cơ sở dữ liệu
1. Tạo cơ sở dữ liệu PostgreSQL (mặc định tên là `coffee_db`).
2. Sao chép tệp `database/.env.example` thành `database/.env` và cập nhật thông tin kết nối.
3. Chạy các lệnh sau từ thư mục gốc để khởi tạo dữ liệu:
   ```powershell
   # Sử dụng môi trường ảo
   .\.venv\Scripts\python -m database.seeds.seed
   # Nạp dữ liệu thử nghiệm (Sản phẩm, Người dùng mẫu)
   .\.venv\Scripts\python -m database.seeds.mock_data
   ```

### Bước 3: Khởi chạy dự án
Sử dụng tệp `run_project.bat` ở thư mục gốc. Script này sẽ tự động mở các cửa sổ terminal riêng biệt cho Backend và Frontend.

## 6. Tài khoản thử nghiệm (Mockup Data)

Sau khi nạp dữ liệu mẫu, bạn có thể sử dụng các thông tin sau để đăng nhập:

- **Quản trị viên (Admin):**
  - Username: `admin`
  - Password: `admin123`
- **Nhân viên (Staff):**
  - Username: `staff01`
  - Password: `staff123`
- **Khách hàng (Customer):**
  - Username: `customer01` (hoặc `customer02`)
  - Password: `password123`
