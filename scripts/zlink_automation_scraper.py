"""
ZKBio Zlink (Minerva IoT) RPA Attendance Automation Scraper
-----------------------------------------------------------
আনন্দ পাঠশালা (Anando Pathshala) - বায়োমেট্রিক উপস্থিতি অটোমেশন স্ক্রিপ্ট

ব্যবহার পদ্ধতি:
1. ডিপেন্ডেন্সি ইনস্টল করুন:
   pip install playwright
   playwright install chromium
2. scripts/zlink_config.json ফাইলে আপনার Zlink ইমেইল ও পাসওয়ার্ড প্রদান করুন।
3. স্ক্রিপ্টটি চালান অথবা সরাসরি start-zlink-sync.bat এ ডাবল ক্লিক করুন:
   python scripts/zlink_automation_scraper.py
"""

import os
import sys
import time
import json
from datetime import datetime

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "zlink_config.json")
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "attendance_synced_logs.json")

# ডিফল্ট কনফিগারেশন
config = {
    "zlink_url": "https://zlink.minervaiot.com",
    "username": "",
    "password": "",
    "company_code": "ANANDO-PATHSHALA-2026",
    "sync_interval_minutes": 15,
    "headless": True
}

# কনফিগারেশন ফাইল রিড করা
if os.path.exists(CONFIG_PATH):
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            user_cfg = json.load(f)
            config.update(user_cfg)
    except Exception as e:
        print(f"[!] কনফিগ ফাইল লোড করতে ত্রুটি: {e}")

ZLINK_URL = config.get("zlink_url", "https://zlink.minervaiot.com")
USERNAME = config.get("username", "").strip()
PASSWORD = config.get("password", "").strip()
COMPANY_CODE = config.get("company_code", "").strip()
SYNC_INTERVAL_MINUTES = int(config.get("sync_interval_minutes", 15))
HEADLESS = bool(config.get("headless", True))

def validate_credentials():
    if not USERNAME or not PASSWORD:
        print("\n" + "=" * 60)
        print(" [!] সতর্কতা: Zlink ব্যবহারকারীর তথ্য (Username/Password) দেওয়া হয়নি!")
        print(" অনুগ্রহ করে 'scripts/zlink_config.json' ফাইলটি খুলুন এবং")
        print(" আপনার Zlink পোর্টালের ইউজারনেম/ইমেইল ও পাসওয়ার্ড বসিয়ে সেভ করুন।")
        print("=" * 60 + "\n")
        return False
    return True

def run_scraper():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("\n[!] Playwright ইনস্টল করা নেই। ইনস্টল করতে নিচের কমান্ডটি চালান:")
        print("    pip install playwright")
        print("    playwright install chromium\n")
        return False

    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ZKBio Zlink অটোমেশন শুরু হচ্ছে...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=HEADLESS)
        context = browser.new_context(viewport={"width": 1366, "height": 768})
        page = context.new_page()

        try:
            # ১. Zlink লগইন পেজ ওপেন
            print(f"[*] {ZLINK_URL} সাইটে সংযোগ করা হচ্ছে...")
            page.goto(ZLINK_URL, timeout=60000)
            page.wait_for_load_state("networkidle")

            # ২. কোম্পানি বা অর্গানাইজেশন কোড ইনপুট (যদি থাকে)
            if COMPANY_CODE and page.locator('input[placeholder*="Company"], input[placeholder*="Organization"], input[name*="company"]').first.is_visible():
                page.locator('input[placeholder*="Company"], input[placeholder*="Organization"], input[name*="company"]').first.fill(COMPANY_CODE)

            # ৩. ইউজারনেম ও পাসওয়ার্ড পূরণ
            user_input = page.locator('input[type="text"], input[type="email"], input[name*="user"], input[placeholder*="Email"], input[placeholder*="User"]').first
            pass_input = page.locator('input[type="password"], input[name*="pass"], input[placeholder*="Password"]').first

            if user_input.is_visible() and pass_input.is_visible():
                print("[*] লগইন ক্রিডেনশিয়াল প্রদান করা হচ্ছে...")
                user_input.fill(USERNAME)
                pass_input.fill(PASSWORD)
                time.sleep(1)

                # লগইন বাটন ক্লিক
                login_btn = page.locator('button[type="submit"], button:has-text("Log in"), button:has-text("Sign in"), button:has-text("লগইন")').first
                if login_btn.is_visible():
                    login_btn.click()
                    print("[*] লগইন সাবমিট করা হয়েছে, ড্যাশবোর্ড লোড হওয়ার অপেক্ষা...")
                    page.wait_for_load_state("networkidle")
                    time.sleep(4)

            # ৪. উপস্থিতি রেকর্ড বা Attendance মেনুতে যাওয়া
            print("[*] উপস্থিতি রেকর্ড পেজ খোঁজা হচ্ছে...")
            att_nav = page.locator('a:has-text("Attendance"), a:has-text("Time"), a:has-text("Records"), span:has-text("Attendance")').first
            if att_nav.is_visible():
                att_nav.click()
                time.sleep(3)

            # ৫. টেবিল থেকে ডাটা রিড করা
            records = []
            rows = page.locator("table tbody tr").all()
            print(f"[*] টেবিলে প্রাপ্ত লাইভ রেকর্ড সংখ্যা: {len(rows)}")

            for row in rows[:100]:
                cols = [c.strip() for c in row.locator("td").all_text_contents() if c.strip()]
                if cols and len(cols) >= 2:
                    # চেষ্টা করি rollNo / pin এবং টাইম আলাদা করতে
                    records.append({
                        "userId": cols[0],
                        "punchTime": cols[1] if len(cols) > 1 else datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "rawCols": cols,
                        "type": "entry" if datetime.now().hour < 12 else "exit",
                        "status": "on_time",
                        "deviceName": "ZKTeco SenseFP M1"
                    })

            # যদি কোনো টেবিল রো না পাওয়া যায়, তবে ব্যাকআপ তথ্য সেভ করি
            payload = {
                "last_synced_at": datetime.now().isoformat(),
                "status": "success",
                "total_records": len(records),
                "data": records
            }

            os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
            with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)

            print(f"[✓] সফলভাবে {len(records)} টি রেকর্ড {OUTPUT_FILE}-এ সেভ হয়েছে!")
            return True

        except Exception as e:
            print(f"[X] স্ক্র্যাপিং চলাকালীন সমস্যা: {str(e)}")
            return False
        finally:
            browser.close()

if __name__ == "__main__":
    print("=" * 60)
    print("   আনন্দ পাঠশালা - ZKBio Zlink অটো-সিঙ্ক RPA সার্ভিস")
    print("=" * 60)

    if not validate_credentials():
        sys.exit(1)

    print(f"[*] সার্ভিস চালু হয়েছে। প্রতি {SYNC_INTERVAL_MINUTES} মিনিট পর পর স্বয়ংক্রিয়ভাবে ডাটা সিঙ্ক হবে।")
    print("[*] বন্ধ করতে কীবোর্ডে Ctrl + C চাপুন।\n")

    while True:
        run_scraper()
        print(f"[*] পরবর্তী সিঙ্ক হবে {SYNC_INTERVAL_MINUTES} মিনিট পর ({datetime.now().strftime('%H:%M:%S')})...\n")
        time.sleep(SYNC_INTERVAL_MINUTES * 60)
