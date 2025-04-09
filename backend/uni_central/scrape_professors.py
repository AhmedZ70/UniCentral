import sqlite3
import time
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

# ---------- Database Setup ----------
# Connect to (or create) the SQLite database
conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

# (Assumes your provided schema is already executed; if not, you can run the schema SQL here)

def setup_defaults():
    # Ensure a default department exists (used when no department info is available)
    cursor.execute("SELECT id FROM departments WHERE code = ?", ("UNKNOWN",))
    dep = cursor.fetchone()
    if dep:
        default_dep_id = dep[0]
    else:
        cursor.execute("INSERT INTO departments (name, code) VALUES (?, ?)", ("Unknown", "UNKNOWN"))
        default_dep_id = cursor.lastrowid
        conn.commit()
    
    # Ensure a default user exists for scraped reviews
    cursor.execute("SELECT id FROM users WHERE email_address = ?", ("scraper@ratemyprofessors.com",))
    user = cursor.fetchone()
    if user:
        default_user_id = user[0]
    else:
        # Minimal fields provided for the default user; adjust as needed.
        cursor.execute("INSERT INTO users (email_address, fname, lname, course_plan) VALUES (?, ?, ?, ?)", 
                       ("scraper@ratemyprofessors.com", "Scraper", "User", "{}"))
        default_user_id = cursor.lastrowid
        conn.commit()
    
    return default_dep_id, default_user_id

default_dep_id, default_user_id = setup_defaults()

# ---------- Selenium Setup ----------
chrome_options = Options()
chrome_options.add_argument("--headless")  # Run headless browser
driver = webdriver.Chrome(options=chrome_options)

# URL for University of Utah on RateMyProfessors
school_url = "https://www.ratemyprofessors.com/school/1606"
driver.get(school_url)
time.sleep(3)  # Allow time for the page to load

# ---------- Load All Professors ----------
# Click the "Load More" button until all professors are loaded.
while True:
    try:
        load_more_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Load More')]")
        driver.execute_script("arguments[0].click();", load_more_button)
        time.sleep(2)
    except Exception:
        break  # No more "Load More" button found

# Use BeautifulSoup to parse the fully loaded page.
soup = BeautifulSoup(driver.page_source, 'html.parser')

# Adjust the selector based on the actual page structure.
# Here we assume professor cards are clickable links with a known class.
professor_elements = soup.select("a.TeacherCard__StyledTeacherCard-syjs0d-0")
print(f"Found {len(professor_elements)} professors.")

# ---------- Iterate Through Each Professor ----------
for prof_elem in professor_elements:
    prof_name = prof_elem.get_text().strip()
    prof_href = prof_elem.get("href")
    prof_url = "https://www.ratemyprofessors.com" + prof_href

    # Split full name into first and last name (simple heuristic)
    name_parts = prof_name.split()
    if len(name_parts) >= 2:
        fname = name_parts[0]
        lname = " ".join(name_parts[1:])
    else:
        fname = prof_name
        lname = ""
    
    # Check if the professor is already in our database
    cursor.execute("SELECT id FROM professors WHERE fname = ? AND lname = ?", (fname, lname))
    row = cursor.fetchone()
    if row:
        professor_id = row[0]
    else:
        # Visit the professor's page to get additional details
        driver.get(prof_url)
        time.sleep(2)
        prof_page = BeautifulSoup(driver.page_source, 'html.parser')
        
        # Extract average rating (adjust the CSS selectors as necessary)
        try:
            avg_rating_text = prof_page.select_one(".RatingValue__Numerator").get_text().strip()
            avg_rating = float(avg_rating_text)
        except Exception:
            avg_rating = 0.0
        
        # Extract average difficulty if available; else use 0.0
        try:
            avg_diff_text = prof_page.select_one(".RatingValue__Numerator--difficulty").get_text().strip()
            avg_difficulty = float(avg_diff_text)
        except Exception:
            avg_difficulty = 0.0

        # Insert the professor into the database
        cursor.execute("""
            INSERT INTO professors (fname, lname, avg_rating, avg_difficulty, department_id)
            VALUES (?, ?, ?, ?, ?)
        """, (fname, lname, avg_rating, avg_difficulty, default_dep_id))
        professor_id = cursor.lastrowid
        conn.commit()
        print(f"Inserted professor: {fname} {lname}")

    # ---------- Scrape Reviews for the Professor ----------
    # Assume reviews are on the same page as professor details
    reviews_scraped = []
    while True:
        # Wait a bit for reviews to load on the page.
        time.sleep(1)
        review_elements = driver.find_elements(By.CSS_SELECTOR, ".Rating__RatingBody")
        for rev_elem in review_elements:
            review_text = rev_elem.text.strip()
            # Try extracting a rating value within the review element.
            try:
                rating_val = rev_elem.find_element(By.CSS_SELECTOR, ".RatingValue__Numerator").text.strip()
                rating = float(rating_val)
            except Exception:
                rating = None
            # Other fields (difficulty, estimated_hours, etc.) are not directly available;
            # set default values (or extend extraction logic as needed).
            difficulty = None
            estimated_hours = None
            grade = None
            would_take_again = 0  # Default False
            
            reviews_scraped.append((review_text, rating, difficulty, estimated_hours, grade, would_take_again))
        
        # Attempt to click the "Next" button for reviews pagination.
        try:
            next_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Next')]")
            if next_button and next_button.is_enabled():
                next_button.click()
                time.sleep(2)
            else:
                break
        except Exception:
            break  # No "Next" button found, assume all reviews are loaded

    print(f"Found {len(reviews_scraped)} reviews for {fname} {lname}")

    # Insert each review into the database.
    for review in reviews_scraped:
        review_text, rating, difficulty, estimated_hours, grade, would_take_again = review
        cursor.execute("""
            INSERT INTO reviews 
            (review, rating, difficulty, estimated_hours, grade, would_take_again, 
             for_credit, mandatory_attendance, required_course, is_gened, 
             in_person, online, hybrid, no_exams, presentations, course_id, professor_id, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            review_text, rating, difficulty, estimated_hours, grade, would_take_again,
            0, 0, 0, 0,   # for_credit, mandatory_attendance, required_course, is_gened
            0, 0, 0, 0,   # in_person, online, hybrid, no_exams
            0,            # presentations (adjust these default booleans as needed)
            None,         # course_id (if not applicable, pass None)
            professor_id,
            default_user_id
        ))
    conn.commit()

# ---------- Cleanup ----------
driver.quit()
conn.close()
print("Scraping complete and data stored in the database.")