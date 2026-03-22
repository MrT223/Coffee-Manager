## 1. PHÂN TÍCH TÁC NHÂN (ACTORS)

Hệ thống tập trung vào ba nhóm người dùng chính với các quyền hạn được phân cấp rõ rệt:

- **Khách hàng (Customer):**
  - Thực hiện đăng ký và đăng nhập tài khoản.
  - Truy cập thực đơn, lựa chọn sản phẩm và đặt hàng trực tuyến.
  - Tra cứu số dư điểm tích lũy và thực hiện đổi điểm lấy quà tặng hoặc giảm giá.
- **Nhân viên (Staff):**
  - Theo dõi và xác nhận các đơn hàng mới từ hệ thống.
  - Cập nhật trạng thái chuẩn bị và giao hàng cho khách.
  - Quản lý danh mục sản phẩm (CRUD cơ bản) để cập nhật tình trạng còn hàng hoặc hết hàng.
  - Thực hiện tạo đơn hàng trực tiếp cho khách tại quầy.
- **Quản trị viên (Admin):**
  - Quản lý toàn bộ danh sách tài khoản (Người dùng, Nhân viên).
  - Thiết lập và thay đổi quyền hạn cho các tài khoản trong hệ thống.
  - Quản lý chuyên sâu danh mục sản phẩm và các chương trình tích điểm.

---

## 2. CHỨC NĂNG HỆ THỐNG (CORE FUNCTIONS)

## 2.1 Quản lý Bán hàng và Đơn hàng

- Hiển thị danh sách sản phẩm theo danh mục, tích hợp tính năng tìm kiếm và bộ lọc cơ bản.
- Xử lý luồng đặt hàng (Checkout logic) với kiểm tra trạng thái khả dụng của sản phẩm (Inventory check).
- Quản lý trạng thái đơn hàng theo quy trình tối giản: Chờ xác nhận, Đang chuẩn bị, Đã hoàn thành, Đã hủy.

## 2.2 Hệ thống Tích điểm (Loyalty Program)

- Tự động tính toán điểm thưởng dựa trên giá trị hóa đơn (Ví dụ: 5% giá trị đơn hàng).
- Lưu trữ lịch sử biến động điểm chi tiết để phục vụ việc đối soát và minh bạch dữ liệu.

## 2.3 Quản lý Sản phẩm (Drink CRUD)

- Thêm mới loại nước với các thuộc tính: Tên, Giá, Phân loại, Hình ảnh.
- Cập nhật thông tin và trạng thái khả dụng của sản phẩm.
- Xóa sản phẩm (Sử dụng Soft Delete để bảo toàn dữ liệu lịch sử đơn hàng).

---

## 3. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

Cấu trúc dữ liệu sử dụng mô hình RDBMS, bổ sung các trường thời gian (Timestamps) để theo dõi biến động dữ liệu:

- **Bảng Users:** ID, Username, Password, Role, TotalPoints, CreatedAt, UpdatedAt.
- **Bảng Categories:** ID, CategoryName, CreatedAt.
- **Bảng Products:** ID, Name, Price, CategoryID, Status (In stock / Out of stock), ImageURL, CreatedAt, UpdatedAt.
- **Bảng Orders:** ID, UserID, TotalPrice, Status, CreatedAt, UpdatedAt.
- **Bảng OrderDetails:** ID, OrderID, ProductID, Quantity, PriceAtTime.
- **Bảng PointLogs:** ID, UserID, OrderID (nullable), PointsChanged, Type (Earned / Spent), CreatedAt.

---

## 4. LỰA CHỌN CÔNG NGHỆ (TECH STACK)

- **Backend:** Python (FastAPI).
- **Frontend:** React.js và Tailwind CSS.
- **Database:** PostgreSQL.
- **Giao tiếp:** RESTful API chuẩn JSON.

---

## 5. LỘ TRÌNH TRIỂN KHAI (IMPLEMENTATION ROADMAP)

## Giai đoạn 1: Nền tảng và Xác thực

- Thiết lập cấu trúc dự án và kết nối cơ sở dữ liệu.
- Triển khai hệ thống Đăng ký / Đăng nhập với JWT Authentication ngay từ đầu.
- Xây dựng chức năng CRUD Sản phẩm và Danh mục cho Admin / Nhân viên.

## Giai đoạn 2: Nghiệp vụ Đặt hàng và Tích điểm

- Xây dựng logic giỏ hàng tại Frontend và API tạo đơn hàng tại Backend.
- Triển khai thuật toán tự động tính điểm và ghi nhận vào bảng PointLogs sau khi đơn hàng chuyển sang trạng thái Hoàn thành.

## Giai đoạn 3: Phân quyền và Kiểm thử

- Phân quyền truy cập chi tiết cho các API Endpoint (sử dụng hệ thống Dependency Injection của FastAPI) và giao diện dựa trên Role.
- Kiểm thử luồng nghiệp vụ cuối toàn trình từ khi Khách hàng đặt đơn đến khi Nhân viên hoàn tất và điểm được cộng vào tài khoản.
