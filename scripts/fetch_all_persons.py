import time
import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import scripts.zlink_automation_scraper as s
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto('https://zlink.minervaiot.com', wait_until='domcontentloaded')
    time.sleep(3)

    try:
        popup_btn = page.locator('.ant-modal-content button:has-text("Confirm")').first
        if popup_btn.is_visible():
            popup_btn.click()
            time.sleep(1)
    except Exception:
        pass

    page.locator('#userName').fill(s.USERNAME)
    page.locator('#password').fill(s.PASSWORD)
    page.locator('.ant-checkbox-wrapper:has-text("agree")').first.click(force=True)
    page.locator('.login-form-button').first.click(force=True)
    
    page.wait_for_url(lambda u: '/home' in u or '/login' not in u, timeout=15000)
    time.sleep(3)

    page.goto('https://zlink.minervaiot.com/org/person/list', wait_until='domcontentloaded')
    time.sleep(5)

    # Change to 100 per page
    try:
        page.locator('.ant-pagination-options-size-changer').first.click()
        time.sleep(1)
        page.locator('.ant-select-item-option:has-text("100")').first.click()
        time.sleep(4)
    except Exception as e:
        print("Size change exception:", e)

    all_persons = []
    page_num = 1

    while True:
        rows = page.locator('.ant-table-tbody tr').all()
        print(f"Reading Page {page_num}: {len(rows)} rows found", flush=True)

        for r in rows:
            cells = [c.strip() for c in r.locator('td').all_text_contents()]
            # Structure: ['', 'Name', 'Mobile', 'Email', 'Person ID', 'Department', 'Job Title', 'Active', 'Access Status', '']
            if len(cells) >= 6:
                name = cells[1].strip()
                mobile = cells[2].replace('\u2066', '').replace('\u2069', '').strip()
                email = cells[3].strip()
                person_id = cells[4].strip()
                department = cells[5].strip()
                job_title = cells[6].strip() if len(cells) > 6 else ""

                if name and person_id:
                    all_persons.append({
                        "name": name,
                        "personId": person_id,
                        "mobile": mobile,
                        "email": email,
                        "department": department,
                        "jobTitle": job_title,
                        "isTeacher": "teacher" in department.lower() or "teacher" in job_title.lower(),
                        "isStudent": "student" in department.lower() or "student" in job_title.lower()
                    })

        # Check if Next Page exists and is NOT disabled
        next_btn = page.locator('.ant-pagination-next:not(.ant-pagination-disabled)').first
        if next_btn.is_visible() and next_btn.is_enabled():
            print(f"Navigating to Page {page_num + 1}...", flush=True)
            next_btn.click(force=True)
            time.sleep(4)
            page_num += 1
        else:
            print("No more pages available.", flush=True)
            break

    print(f"TOTAL PERSONS EXTRACTED: {len(all_persons)}", flush=True)

    teachers = [p for p in all_persons if p["isTeacher"]]
    students = [p for p in all_persons if p["isStudent"]]
    others = [p for p in all_persons if not p["isTeacher"] and not p["isStudent"]]

    print(f"Teachers count: {len(teachers)}")
    print(f"Students count: {len(students)}")
    print(f"Others count: {len(others)}")

    output_data = {
        "total": len(all_persons),
        "teachers_count": len(teachers),
        "students_count": len(students),
        "teachers": teachers,
        "students": students,
        "all": all_persons
    }

    with open("public/zlink_all_persons.json", "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print("Saved public/zlink_all_persons.json successfully!", flush=True)
    browser.close()
