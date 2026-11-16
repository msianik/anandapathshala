"""
ZKTeco SenseFP M1 Direct Local Network (Wi-Fi/LAN) Sync Script
--------------------------------------------------------------
এই স্ক্রিপ্টটি Zlink ক্লাউড বাদে সরাসরি আপনার স্কুলের ওয়াই-ফাই/লোকাল নেটওয়ার্কের
মাধ্যমে SenseFP M1 ডিভাইসের সাথে পোর্ট ৪৩৭০ এ যুক্ত হয়ে উপস্থিতি ডাটা নিয়ে আসে।

প্রয়োজনীয়তা:
1. ডিভাইস এবং আপনার কম্পিউটার একই Wi-Fi / রাউটারে যুক্ত থাকতে হবে।
2. পাইথন প্যাকেজ ইনস্টল:
   pip install pyzk
3. স্ক্রিপ্টটি চালান:
   python scripts/zk_direct_lan_bridge.py
"""

import sys
import time
import json
import os
from datetime import datetime

# ================= কনফিগারেশন =================
DEVICE_IP = "192.168.1.201"      # ডিভাইসের লোকাল আইপি অ্যাড্রেস
DEVICE_PORT = 4370               # ZKTeco স্ট্যান্ডার্ড পোর্ট
SYNC_INTERVAL_SECONDS = 60       # প্রতি কত সেকেন্ড পর পর চেক করবে
OUTPUT_JSON = "public/attendance_synced_logs.json"
# ============================================

def sync_direct_zk():
    try:
        from zk import ZK
    except ImportError:
        print("[!] pyzk লাইব্রেরি পাওয়া যায়নি। ইনস্টল করতে লিখুন: pip install pyzk")
        sys.exit(1)

    zk = ZK(DEVICE_IP, port=DEVICE_PORT, timeout=5, password=0, force_udp=False, ommit_ping=False)
    conn = None
    try:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {DEVICE_IP}:{DEVICE_PORT}-এ সংযোগ করা হচ্ছে...")
        conn = zk.connect()
        conn.disable_device()
        
        # উপস্থিতি রেকর্ড আনা
        attendances = conn.get_attendance()
        print(f"[+] ডিভাইসে মোট পাওয়া রেকর্ড: {len(attendances)}")

        logs = []
        for att in attendances[-100:]:  # সর্বশেষ ১০০টি পাঞ্চ
            logs.append({
                "user_id": str(att.user_id),
                "timestamp": att.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "status": att.status,
                "punch": att.punch,
            })

        os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
        with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
            json.dump({
                "device_ip": DEVICE_IP,
                "synced_at": datetime.now().isoformat(),
                "count": len(logs),
                "logs": logs
            }, f, indent=2, ensure_ascii=False)

        print(f"[✓] {len(logs)}টি ডাটা সফলভাবে {OUTPUT_JSON} ফাইলে সেভ হয়েছে।")
        conn.enable_device()

    except Exception as e:
        print(f"[X] ডিভাইসের সাথে সরাসরি কানেক্ট করা যায়নি: {e}")
    finally:
        if conn:
            conn.disconnect()

if __name__ == "__main__":
    print(f"[*] ZKTeco SenseFP M1 সরাসরি LAN সংযোগ ট্র্যাকার চালু হয়েছে...")
    while True:
        sync_direct_zk()
        time.sleep(SYNC_INTERVAL_SECONDS)
