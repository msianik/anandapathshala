"""
ZKBio Zlink (Minerva IoT) Attendance Automation Scraper
-------------------------------------------------------
আনন্দ পাঠশালা (Anando Pathshala) - বায়োমেট্রিক উপস্থিতি অটোমেশন স্ক্রিপ্ট
ডিভাইস: ZKTeco SenseFP M1 (SN: JUS3251800031)

স্বয়ংক্রিয় কার্যপ্রণালী:
১. Zlink ক্লাউডে লগইন (পপআপ নোটিফিকেশন হ্যান্ডলিং ও ইউজার এগ্রিমেন্ট টিক সহ)।
২. সরাসরি ট্রানজেকশন রিপোর্ট পেজে নেভিগেশন:
   https://zlink.minervaiot.com/zkbio_att/attendance/report/transaction
৩. শিক্ষার্থী ও শিক্ষকদের লাইভ পাঞ্চ রেকর্ড (কার্ড ও ফিঙ্গারপ্রিন্ট) ফেচ করা।
৪. public/attendance_synced_logs.json ফাইলে সংরক্ষণ করা, যা সফটওয়্যারে স্বয়ংক্রিয়ভাবে সিঙ্ক হয়।
"""

import os
import sys
import time
import json
from datetime import datetime

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "zlink_config.json")
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "attendance_synced_logs.json")

# কনফিগারেশন লোড করা
config = {
    "zlink_url": "https://zlink.minervaiot.com",
    "username": "msianik.bd@gmail.com",
    "password": "",
    "sync_interval_minutes": 15,
    "headless": True
}

if os.path.exists(CONFIG_PATH):
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            config.update(json.load(f))
    except Exception as e:
        print(f"[!] কনফিগ ফাইল লোড করতে সমস্যা: {e}", flush=True)

ZLINK_URL = config.get("zlink_url", "https://zlink.minervaiot.com")
USERNAME = config.get("username", "").strip()
PASSWORD = config.get("password", "").strip()
SYNC_INTERVAL_MINUTES = int(config.get("sync_interval_minutes", 15))
HEADLESS = bool(config.get("headless", True))

def run_scraper():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("[!] Playwright পাওয়া যায়নি। ইনস্টল করতে লিখুন: py -m pip install playwright", flush=True)
        return False

    print(f"\n{'='*65}", flush=True)
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ZKBio Zlink অটো-সিঙ্ক শুরু হচ্ছে...", flush=True)
    print(f"{'='*65}", flush=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=HEADLESS)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        try:
            # ১. লগইন পেজ ওপেন
            print(f"[*] {ZLINK_URL} সাইটে সংযোগ করা হচ্ছে...", flush=True)
            page.goto(ZLINK_URL, timeout=45000, wait_until="domcontentloaded")
            time.sleep(3)

            # নোটিফিকেশন মডাল বন্ধ
            try:
                popup_btn = page.locator('.ant-modal-content button:has-text("Confirm")').first
                if popup_btn.is_visible():
                    print("[*] নোটিফিকেশন পপআপ বন্ধ করা হয়েছে...", flush=True)
                    popup_btn.click()
                    time.sleep(1)
            except Exception:
                pass

            # লগইন ফর্ম পূরণ
            print(f"[*] ব্যবহারকারী '{USERNAME}' লগইন করা হচ্ছে...", flush=True)
            page.locator('#userName').fill(USERNAME)
            page.locator('#password').fill(PASSWORD)
            
            # ইউজার এগ্রিমেন্ট টিক
            agree_cb = page.locator('.ant-checkbox-wrapper:has-text("agree")').first
            if agree_cb.is_visible():
                agree_cb.click(force=True)

            auto_login = page.locator('.ant-checkbox-wrapper:has-text("Auto-login")').first
            if auto_login.is_visible():
                auto_login.click(force=True)

            # লগইন বাটন ক্লিক
            page.locator('.login-form-button').first.click(force=True)
            page.wait_for_url(lambda u: '/home' in u or '/login' not in u, timeout=15000)
            time.sleep(3)
            print("[✓] সফলভাবে ZKBio Zlink পোর্টালে লগইন সম্পন্ন হয়েছে!", flush=True)

            # ২. উপস্থিতি ট্রানজেকশন পেজে নেভিগেট
            transaction_url = "https://zlink.minervaiot.com/zkbio_att/attendance/report/transaction"
            print(f"[*] ট্রানজেকশন রিপোর্ট পেজে যাওয়া হচ্ছে: {transaction_url}", flush=True)
            page.goto(transaction_url, wait_until="domcontentloaded")
            time.sleep(5)

            # ৩. টেবিল থেকে লাইভ পাঞ্চ ডাটা সংগ্রহ
            try:
                page.wait_for_selector(".ant-table-tbody tr", timeout=15000)
            except Exception:
                pass
            time.sleep(2)

            rows = page.locator(".ant-table-tbody tr").all()
            print(f"[*] টেবিলে প্রাপ্ত লাইভ রেকর্ড সংখ্যা: {len(rows)}", flush=True)

            records = []
            for idx, r in enumerate(rows):
                cols = [c.strip() for c in r.locator("td").all_text_contents() if c.strip()]
                if idx < 3:
                    print(f"DEBUG ROW {idx} cols count={len(cols)}: {cols}", flush=True)

                if cols and len(cols) >= 5:
                    person_id = cols[0].strip()
                    name = cols[1].strip() if len(cols) > 1 else ""
                    department = cols[2].strip() if len(cols) > 2 else "Student"
                    
                    # ফাইন্ড পাঞ্চ টাইম (যেকোনো কলাম যাতে YYYY-MM-DD বা HH:MM আছে)
                    punch_time = ""
                    for c in cols:
                        if ("-" in c and ":" in c) or ("2026" in c) or ("2025" in c):
                            punch_time = c
                            break
                    if not punch_time and len(cols) >= 7:
                        punch_time = cols[6]

                    verification = "fingerprint"
                    for c in cols:
                        if "card" in c.lower():
                            verification = "card"
                            break
                        elif "finger" in c.lower():
                            verification = "fingerprint"
                            break

                    device_sn = "JUS3251800031"

                    if person_id:
                        records.append({
                            "userId": person_id,
                            "enrollId": person_id,
                            "name": name,
                            "department": department,
                            "personType": "teacher" if "teacher" in department.lower() else "student",
                            "punchTime": punch_time,
                            "time": punch_time,
                            "verificationMode": verification,
                            "deviceSn": device_sn,
                            "status": "on_time",
                            "fetchedAt": datetime.now().isoformat()
                        })

            # ৪. JSON ফাইলে আউটপুট সেভ
            payload = {
                "last_synced_at": datetime.now().isoformat(),
                "device_sn": "JUS3251800031",
                "device_model": "ZKTeco SenseFP M1",
                "status": "success",
                "total_records": len(records),
                "records": records,
                "data": records
            }

            os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
            with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)

            print(f"[✓] আনন্দ পাঠশালা পোর্টালে {len(records)} টি লাইভ পাঞ্চ সফলভাবে সংরক্ষিত হয়েছে!", flush=True)
            print(f"[✓] আউটপুট ফাইল: {OUTPUT_FILE}", flush=True)
            return True

        except Exception as e:
            print(f"[X] অটোমেশনে ত্রুটি: {str(e)}", flush=True)
            return False
        finally:
            browser.close()

if __name__ == "__main__":
    print(f"[*] আনন্দ পাঠশালা Zlink অটো-সিঙ্ক সার্ভিস চালু রয়েছে। প্রতি {SYNC_INTERVAL_MINUTES} মিনিট পর পর রান হবে...")
    print("[*] বন্ধ করতে কীবোর্ডে Ctrl + C চাপুন।\n", flush=True)

    while True:
        run_scraper()
        print(f"\n[*] পরবর্তী সিঙ্ক {SYNC_INTERVAL_MINUTES} মিনিট পর ({datetime.now().strftime('%H:%M:%S')})...\n", flush=True)
        time.sleep(SYNC_INTERVAL_MINUTES * 60)
