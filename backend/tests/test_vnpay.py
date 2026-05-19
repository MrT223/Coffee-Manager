import hmac
import hashlib
import urllib.parse
from datetime import datetime
import requests

# Cấu hình kiểm thử
VNPAY_HASH_SECRET = "GUWSWREIPXASZREONYRYTMYAVNLAOVCO"
BACKEND_URL = "http://127.0.0.1:8000/api/vnpay/ipn"

def simulate_vnpay_ipn(vnp_txn_ref: str, amount: int, response_code: str = "00"):
    # 1. Chuẩn bị các tham số giả lập giống hệt VNPay gửi về
    vnp_params = {
        "vnp_Version": "2.1.0",
        "vnp_Command": "pay",
        "vnp_TmnCode": "2QX8WY5Z",
        "vnp_Amount": str(amount * 100), # VNPay nhân 100 số tiền
        "vnp_CurrCode": "VND",
        "vnp_TxnRef": vnp_txn_ref,
        "vnp_OrderInfo": f"Thanh toan don hang Coffee Manager mock",
        "vnp_ResponseCode": response_code,
        "vnp_TransactionNo": "14123456",
        "vnp_TransactionStatus": "00" if response_code == "00" else "02",
        "vnp_BankCode": "NCB",
        "vnp_PayDate": datetime.now().strftime('%Y%m%d%H%M%S'),
    }

    # 2. Sắp xếp và tạo chuỗi dữ liệu ký
    sorted_keys = sorted(vnp_params.keys())
    hash_data_parts = []
    for key in sorted_keys:
        value = str(vnp_params[key])
        if value:
            encoded_key = urllib.parse.quote(key, safe='')
            encoded_value = urllib.parse.quote(value, safe='')
            hash_data_parts.append(f"{encoded_key}={encoded_value}")
    
    sign_data = "&".join(hash_data_parts)

    # 3. Ký HMAC-SHA512 bằng secret key
    mac = hmac.new(
        VNPAY_HASH_SECRET.encode('utf-8'),
        sign_data.encode('utf-8'),
        hashlib.sha512
    )
    vnp_SecureHash = mac.hexdigest()

    # 4. Thêm signature vào params
    vnp_params["vnp_SecureHash"] = vnp_SecureHash

    # 5. Gửi request tới backend endpoint IPN
    print(f"--> Dang gui mock IPN cho giao dich {vnp_txn_ref}...")
    response = requests.get(BACKEND_URL, params=vnp_params)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")

if __name__ == "__main__":
    # Nhập mã txn_ref của đơn hàng bạn vừa tạo qua frontend để test
    import sys
    if len(sys.argv) < 3:
        print("Cú pháp: python test_vnpay.py <vnp_txn_ref> <amount>")
    else:
        simulate_vnpay_ipn(sys.argv[1], int(sys.argv[2]))
