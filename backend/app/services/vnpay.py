# backend/app/services/vnpay.py
"""
VNPay Payment Service – Xử lý logic tạo URL thanh toán và xác thực chữ ký.
Dựa trên tài liệu: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
"""
import hashlib
import hmac
import urllib.parse
from datetime import datetime, timedelta, timezone


def build_vnpay_url(vnp_params: dict, secret_key: str, vnp_url: str) -> str:
    # 1. Sắp xếp dictionary theo thứ tự bảng chữ cái (A-Z) của key
    sorted_keys = sorted(vnp_params.keys())
    
    hash_data_parts = []
    
    for key in sorted_keys:
        value = str(vnp_params[key])
        if value:
            # 2. BẮT BUỘC dùng quote_plus để mã hóa (khoảng trắng thành +)
            encoded_key = urllib.parse.quote_plus(key)
            encoded_value = urllib.parse.quote_plus(value)
            
            hash_data_parts.append(f"{encoded_key}={encoded_value}")

    # 3. Nối các phần tử bằng dấu & để tạo chuỗi dữ liệu gốc
    sign_data = "&".join(hash_data_parts)

    # 4. Dùng HMAC-SHA512 để băm chuỗi dữ liệu gốc cùng với Secret Key
    mac = hmac.new(
        secret_key.encode('utf-8'), 
        sign_data.encode('utf-8'), 
        hashlib.sha512
    )
    vnp_SecureHash = mac.hexdigest()

    # 5. Đính kèm chữ ký vào cuối URL
    final_url = f"{vnp_url}?{sign_data}&vnp_SecureHash={vnp_SecureHash}"
    
    return final_url


def create_payment_url(
    vnp_payment_url: str,
    vnp_tmn_code: str,
    vnp_hash_secret: str,
    vnp_return_url: str,
    order_id: int,
    amount: float,
    order_info: str,
    ip_addr: str = "127.0.0.1",
    vnp_txn_ref: str = None,
    bank_code: str = None,
) -> tuple[str, str]:
    """
    Tạo URL thanh toán VNPay.
    
    Returns:
        tuple: (payment_url, vnp_txn_ref)
    """
    gmt7 = timezone(timedelta(hours=7))
    now_gmt7 = datetime.now(timezone.utc).astimezone(gmt7)

    if vnp_txn_ref is None:
        vnp_txn_ref = f"{order_id}_{int(now_gmt7.timestamp())}"
    
    # Số tiền phải nhân 100 (loại bỏ phần thập phân)
    vnp_amount = int(float(amount) * 100)
    
    create_date = now_gmt7.strftime('%Y%m%d%H%M%S')
    expire_date = (now_gmt7 + timedelta(minutes=15)).strftime('%Y%m%d%H%M%S')
    
    # Chuẩn bị tham số
    input_data = {
        "vnp_Version": "2.1.0",
        "vnp_Command": "pay",
        "vnp_TmnCode": vnp_tmn_code,
        "vnp_Amount": str(vnp_amount),
        "vnp_CurrCode": "VND",
        "vnp_TxnRef": vnp_txn_ref,
        "vnp_OrderInfo": order_info,
        "vnp_OrderType": "other",
        "vnp_Locale": "vn",
        "vnp_ReturnUrl": vnp_return_url,
        "vnp_IpAddr": ip_addr,
        "vnp_CreateDate": create_date,
        "vnp_ExpireDate": expire_date,
    }
    
    if bank_code:
        input_data["vnp_BankCode"] = bank_code
        
    payment_url = build_vnpay_url(input_data, vnp_hash_secret, vnp_payment_url)
    
    print("=================== VNPAY DEBUG ===================")
    print(f"[VNPAY DEBUG] input_data: {input_data}")
    print(f"[VNPAY DEBUG] vnp_hash_secret: {vnp_hash_secret}")
    print(f"[VNPAY DEBUG] payment_url: {payment_url}")
    print("===================================================")
    
    return payment_url, vnp_txn_ref


def verify_vnpay_signature(vnp_params: dict, vnp_hash_secret: str) -> bool:
    """
    Xác thực chữ ký từ VNPay (dùng cho IPN và Return URL).
    
    Args:
        vnp_params: Dict các tham số VNPay gửi về
        vnp_hash_secret: Chuỗi bí mật
    
    Returns:
        bool: True nếu chữ ký hợp lệ
    """
    # Lấy secure hash từ params
    vnp_secure_hash = vnp_params.get("vnp_SecureHash", "")
    
    # Tạo bản sao và loại bỏ các trường hash
    input_data = {}
    for key, value in vnp_params.items():
        if key.startswith("vnp_") and key not in ("vnp_SecureHash", "vnp_SecureHashType"):
            input_data[key] = value
            
    # Sắp xếp dictionary theo thứ tự bảng chữ cái (A-Z) của key
    sorted_keys = sorted(input_data.keys())
    
    hash_data_parts = []
    
    for key in sorted_keys:
        value = str(input_data[key])
        if value:
            # BẮT BUỘC dùng quote_plus để mã hóa (khoảng trắng thành +)
            encoded_key = urllib.parse.quote_plus(key)
            encoded_value = urllib.parse.quote_plus(value)
            
            hash_data_parts.append(f"{encoded_key}={encoded_value}")

    # Nối các phần tử bằng dấu & để tạo chuỗi dữ liệu gốc
    sign_data = "&".join(hash_data_parts)

    # Dùng HMAC-SHA512 để băm chuỗi dữ liệu gốc cùng với Secret Key
    computed_hash = hmac.new(
        vnp_hash_secret.encode('utf-8'), 
        sign_data.encode('utf-8'), 
        hashlib.sha512
    ).hexdigest()
    
    return computed_hash.lower() == vnp_secure_hash.lower()
