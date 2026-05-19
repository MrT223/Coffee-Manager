# backend/tests/test_vnpay_service.py
import urllib.parse
from app.services.vnpay import create_payment_url, verify_vnpay_signature

VNPAY_HASH_SECRET = "GUWSWREIPXASZREONYRYTMYAVNLAOVCO"
VNPAY_TMN_CODE = "2QX8WY5Z"
VNPAY_PAYMENT_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
VNPAY_RETURN_URL = "http://localhost:5000/payment-return"

def test_create_payment_url_without_bank_code():
    url, txn_ref = create_payment_url(
        vnp_payment_url=VNPAY_PAYMENT_URL,
        vnp_tmn_code=VNPAY_TMN_CODE,
        vnp_hash_secret=VNPAY_HASH_SECRET,
        vnp_return_url=VNPAY_RETURN_URL,
        order_id=123,
        amount=50000.0,
        order_info="Test order without bank code",
    )
    
    parsed = urllib.parse.urlparse(url)
    params = urllib.parse.parse_qs(parsed.query)
    
    assert "vnp_TmnCode" in params
    assert params["vnp_TmnCode"][0] == VNPAY_TMN_CODE
    assert "vnp_BankCode" not in params
    assert "vnp_SecureHash" in params

def test_create_payment_url_with_bank_code():
    url, txn_ref = create_payment_url(
        vnp_payment_url=VNPAY_PAYMENT_URL,
        vnp_tmn_code=VNPAY_TMN_CODE,
        vnp_hash_secret=VNPAY_HASH_SECRET,
        vnp_return_url=VNPAY_RETURN_URL,
        order_id=123,
        amount=50000.0,
        order_info="Test order with bank code",
        bank_code="NCB"
    )
    
    parsed = urllib.parse.urlparse(url)
    params = urllib.parse.parse_qs(parsed.query)
    
    assert "vnp_TmnCode" in params
    assert params["vnp_TmnCode"][0] == VNPAY_TMN_CODE
    assert "vnp_BankCode" in params
    assert params["vnp_BankCode"][0] == "NCB"
    assert "vnp_SecureHash" in params
    
    # Verify signature
    # Re-construct params for verify
    vnp_params = {k: v[0] for k, v in params.items()}
    assert verify_vnpay_signature(vnp_params, VNPAY_HASH_SECRET) is True
