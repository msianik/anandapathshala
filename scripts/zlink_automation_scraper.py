"""
ZKBio Zlink (Minerva IoT) RPA Attendance Automation Scraper
-----------------------------------------------------------
ব্যবহার পদ্ধতি:
1. Python ও Playwright ইনস্টল করুন:
   pip install playwright
   playwright install chromium
2. নিচে আপনার Zlink লগইন তথ্য (Email/Username, Password, Company/Org Code) বসান।
3. স্ক্রিপ্টটি রান করুন:
   python scripts/zlink_automation_scraper.py
"""

import os
import sys
import time
import json
from datetime import datetime

# ================= কনফিগারেশন =================
ZLINK_URL = "https://zlink.minervaiot.com"
USERNAME = "your_email_or_username"       # আপনার Zlink ইউজারনেম/ইমেইল
PASSWORD = "your_password"                # আপনার Zlink পাসওয়ার্ড
COMPANY_CODE = "ANANDO-PATHSHALA-2026"   # আপনার কোম্পানি বা অর্গানাইজেশন কোড (যদি থাকে)
SYNC_INTERVAL_MINUTES = 15                # প্রতি কত মিনিট পর পর ডাটা আনবে
HEADLESS = True                           # ব্রাউজার ব্যাকগ্রাউন্ডে চালাতে True, দেখতে চাইলে False
OUTPUT_FILE = "public/attendance_synced_logs.json"
# ============================================

def run_scraper():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("[!] Playwright ইনস্টল করা নেই। অনুগ্রহ করে চালান: pip install playwright && playwright install chromium")
        sys.exit(1)

    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ZKBio Zlink অটোমেশন শুরু হচ্ছে...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=HEADLESS)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        try:
            # ১. Zlink লগইন পেজ ওপেন
            print(f"[*] {ZLINK_URL} পেজে যাচ্ছি...")
            page.goto(ZLINK_URL, timeout=60000)
            page.wait_for_load_state("networkidle")

            # ২. লগইন ইনপুট ফিল্ড খোঁজা ও পূরণ
            print("[*] লগইন তথ্য পূরণ করা হচ্ছে...")
            # Zlink কমন ইনপুট সিলেক্টর
            if page.locator('input[type="text"], input[type="email"]').first.is_visible():
                page.locator('input[type="text"], input[type="email"]').first.fill(USERNAME)
            if page.locator('input[type="password"]').first.is_visible():
                page.locator('input[type="password"]').first.fill(PASSWORD)
            
            # লগইন বাটন ক্লিক
            login_btn = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first
            if login_btn.is_visible():
                login_btn.click()
                page.wait_for_load_state("networkidle")
                time.sleep(3)

            print("[+] সফলভাবে লগইন হয়েছে (অথবা ড্যাশবোর্ডে প্রবেশ করেছে)।")

            # ৩. অ্যাটেনডেন্স বা টাইম ট্র্যাকিং পেজে নেভিগেট
            # ZLink মেনু থেকে Attendance/Punch Records এ যাওয়া
            print("[*] উপস্থিতি রেকর্ড পেজ খোঁজা হচ্ছে...")
            punch_menu = page.locator('a:has-text("Attendance"), a:has-text("Time Attendance"), a:has-text("Punch Record"), a:has-text("Records")').first
            if punch_menu.is_visible():
                punch_menu.click()
                time.sleep(3)

            # ৪. টেবিল থেকে ডাটা রিড করা অথবা এক্সপোর্ট বাটন ট্রিগার
            records = []
            rows = page.locator("table tbody tr").all()
            print(f"[*] প্রাপ্ত রেকর্ডের সংখ্যা: {len(rows)}")

            for row in rows[:50]:  # সর্বশেষ ৫০টি রেকর্ড
                cols = row.locator("td").all_text_contents()
                if cols and len(cols) >= 3:
                    records.append({
                        "raw_cols": [c.strip() for c in cols],
                        "fetched_at": datetime.now().isoformat()
                    })

            # ৫. ডাটা সংরক্ষণ
            os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
            with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                json.dump({
                    "last_updated": datetime.now().isoformat(),
                    "total_records": len(records),
                    "records": records
                }, f, ensure_ascii=False, indent=2)

            print(f"[✓] সফলভাবে {len(records)} টি রেকর্ড {OUTPUT_FILE}-এ সংরক্ষিত হয়েছে।")

        except Exception as e:
            print(f"[X] স্ক্র্যাপিং চলাকালীন সমস্যা: {str(e)}")
        finally:
            browser.close()

if __name__ == "__main__":
    print(f"ZKBio Zlink অটো-সিঙ্ক সার্ভিস চালু হয়েছে। প্রতি {SYNC_INTERVAL_MINUTES} মিনিট পর পর চলবে...")
    while True:
        run_scraper()
        print(f"[*] পরবর্তী সিঙ্ক {SYNC_INTERVAL_MINUTES} মিনিট পর...")
        time.sleep(SYNC_INTERVAL_MINUTES * 60)
