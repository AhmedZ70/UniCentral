import requests
from bs4 import BeautifulSoup
from uni_central.models import Department, Course, Professor

BASE_URL = "https://class-schedule.app.utah.edu/main/1254/"

def get_department_codes():
    """
    Scrape the department listing page and extract department codes.
    """
    response = requests.get(BASE_URL + "index.html")
    if response.status_code != 200:
        print("Failed to retrieve department list.")
        return {}

    soup = BeautifulSoup(response.text, "html.parser")
    department_links = soup.select("a[href*='class_list.html?subject=']")
    
    departments = {}
    for link in department_links:
        href = link.get('href')
        code = href.split('=')[-1]
        name = link.text.strip()
        departments[code] = name

    return departments

def scrape_courses(department_code):
    """
    Scrape all courses for a given department, including credits.
    """
    url = f"{BASE_URL}class_list.html?subject={department_code}"
    response = requests.get(url)
    if response.status_code != 200:
        print(f"Failed to retrieve courses for department {department_code}")
        return []

    soup = BeautifulSoup(response.text, "html.parser")
    course_elements = soup.find_all("div", class_="course")

    courses = []
    for element in course_elements:
        try:
            course_number = element.find("span", class_="course_number").text.strip()
            title = element.find("span", class_="course_title").text.strip()
            instructor_name = element.find("span", class_="instructor").text.strip() if element.find("span", class_="instructor") else "Unknown Instructor"
            schedule = element.find("span", class_="schedule").text.strip() if element.find("span", class_="schedule") else "TBA"
            location = element.find("span", class_="location").text.strip() if element.find("span", class_="location") else "TBA"

            # Extract first and last name of the professor
            instructor_split = instructor_name.split()
            fname = instructor_split[0] if instructor_split else "Unknown"
            lname = " ".join(instructor_split[1:]) if len(instructor_split) > 1 else "Unknown"

            # Extract credits (assuming it's in a <span> tag with class 'credits')
            credits_tag = element.find("span", class_="credits")
            credits = int(credits_tag.text.strip().split()[0]) if credits_tag else 3  # Default to 3 if not found

            courses.append({
                "course_number": course_number,
                "title": title,
                "instructor_fname": fname,
                "instructor_lname": lname,
                "schedule": schedule,
                "location": location,
                "credits": credits
            })
        except AttributeError:
            print(f"Skipping malformed course entry in {department_code}")

    return courses

def update_database():
    """
    Scrape and store all departments, courses, and professors in the database.
    """
    departments = get_department_codes()

    for code, name in departments.items():
        try:
            # Create or get department
            department, created = Department.objects.get_or_create(code=code, defaults={"name": name})
            if created:
                print(f"Added new department: {department.name}")

            courses = scrape_courses(code)

            for course_data in courses:
                # Create or get professor
                professor, prof_created = Professor.objects.get_or_create(
                    fname=course_data["instructor_fname"], 
                    lname=course_data["instructor_lname"],
                    defaults={"department": department}
                )
                if prof_created:
                    print(f"Added new professor: {professor.fname} {professor.lname}")

                # Create or get course
                course, course_created = Course.objects.get_or_create(
                    department=department,
                    subject=code,
                    number=course_data["course_number"],
                    defaults={
                        "title": course_data["title"],
                        "credits": course_data["credits"],
                        "semester": "Spring 2025"
                    }
                )

                # Associate professor with the course
                course.professors.add(professor)

                if course_created:
                    print(f"Added new course: {course.title} ({course_data['credits']} credits)")
                else:
                    print(f"Updated course: {course.title} ({course_data['credits']} credits)")

        except Exception as e:
            print(f"Error processing department {name} ({code}): {e}")

