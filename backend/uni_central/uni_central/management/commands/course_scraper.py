import requests
from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand
from uni_central.models import Department, Course  # Adjust if necessary

class Command(BaseCommand):
    help = "Scrapes courses from department URLs and adds new courses to the database."

    def handle(self, *args, **options):
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            )
        }

        # Dictionary mapping department names to their course list URLs.
        department_links = {
            "Biochemistry": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=BIO%20C",
            "Chemical Engineering": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=CH%20EN",
            "Classical Civilization": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=CL%20CV",
            "Educational Psychology": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ED%20PS",
            "Family and Preventive Medicine": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=FP%20MD",
            "Health Promotion & Education": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=H%20EDU",
            "Health Promotion & Education Noncredit Certificate": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=H%20EDUC",
            "Human Genetics": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=H%20GEN",
            "Pharmacy - Medicinal Chemistry": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=MD%20CH",
            "Interdepartmental Medicine": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=MD%20ID",
            "Medical Laboratory Science": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=MD%20LB",
            "Mechanical Engineering": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ME%20EN",
            "Metallurgical Engineering": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=MET%20E",
            "Mining Engineering": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=MG%20EN",
            "Middle East Language and Area Studies": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=MID%20E",
            "Military Science": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=MIL%20S",
            "Naval Science": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=NV%20SC",
            "Occupational Therapy": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=OC%20TH",
            "Phys Med & Rehabilitation": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PH%20MD",
            "Physical Therapy": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PH%20TH",
            "Pharmacology and Toxicology": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PH%20TX",
            "Special Education": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=SP%20ED",
            "Senior Electives": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=SR%20EL"
        }

        total_courses_added = 0

        for dept_name, dept_url in department_links.items():
            # Get or create the department
            department, created = Department.objects.get_or_create(
                name=dept_name,
                defaults={"code": dept_name}
            )
            if created:
                self.stdout.write(f"Created new department: {dept_name}")
            else:
                self.stdout.write(f"Found existing department: {dept_name}")

            self.stdout.write(f"Scraping courses for '{dept_name}' from: {dept_url}")
            
            try:
                response = requests.get(dept_url, headers=headers, timeout=10)
                response.raise_for_status()
            except requests.exceptions.RequestException as e:
                self.stderr.write(f"Failed to retrieve {dept_name}: {str(e)}")
                continue

            soup = BeautifulSoup(response.text, "html.parser")
            # Using full class string to locate course blocks
            course_blocks = soup.find_all("div", class_="class-info card mt-3")
            if not course_blocks:
                self.stdout.write(f"No course blocks found for {dept_name}. Check HTML structure.")
                continue

            for block in course_blocks:
                h3_tag = block.find("h3")
                if not h3_tag:
                    continue

                # The first <a> in the <h3> holds the full course code, e.g., "H EDU 2020" or "ARTX 200"
                a_tag = h3_tag.find("a")
                if not a_tag:
                    continue

                code_str = a_tag.get_text(strip=True)
                code_parts = code_str.split()
                if len(code_parts) < 2:
                    continue

                # Assume the last token is the course number and the rest form the subject code.
                raw_course_number = code_parts[-1]
                subject_code = " ".join(code_parts[:-1])
                # Clean the course number (remove any non-digits)
                clean_number = ''.join(filter(str.isdigit, raw_course_number))
                if not clean_number:
                    self.stdout.write(f"Skipping invalid course number: {code_str}")
                    continue
                course_number = int(clean_number)

                # Extract the course title from the second tag element after the course code.
                # We assume that after the first <a>, the next valid element (typically a <span>)
                # contains the section and then the course title.
                span_tags = h3_tag.find_all("span")
                if len(span_tags) < 2:
                    self.stdout.write(f"Skipping course {code_str} (insufficient span elements)")
                    continue
                # We ignore the section (first span) and take the second span as the title.
                course_title = span_tags[1].get_text(strip=True)

                # Fetch credits from the "Class Details" page.
                credits = None
                details_link_tag = block.find("a", class_="btn btn-secondary btn-sm")
                if details_link_tag and details_link_tag.has_attr("href"):
                    details_href = details_link_tag["href"]
                    details_url = requests.compat.urljoin(dept_url, details_href)
                    try:
                        details_resp = requests.get(details_url, headers=headers, timeout=5)
                        if details_resp.status_code == 200:
                            details_soup = BeautifulSoup(details_resp.text, "html.parser")
                            credit_span = details_soup.find("span", class_="credit-hours")
                            if credit_span:
                                credits_text = credit_span.get_text(strip=True)
                                parts = credits_text.split()
                                if parts and parts[0].replace('.', '', 1).isdigit():
                                    credits = float(parts[0])
                    except requests.exceptions.RequestException:
                        pass
                if credits is None:
                    credits = 3  # default value if not found

                # Skip if a course with this department and course number already exists.
                if Course.objects.filter(department=department, number=course_number).exists():
                    self.stdout.write(f"Skipping duplicate: {subject_code} {course_number}")
                    continue

                # Create the course.
                Course.objects.create(
                    department=department,
                    number=course_number,
                    title=course_title,
                    credits=credits,
                    subject=f"{subject_code} {course_number}"
                )
                total_courses_added += 1
                self.stdout.write(f"Added: {subject_code} {course_number} - {course_title} ({credits} credits)")

        self.stdout.write(self.style.SUCCESS(f"Total courses added: {total_courses_added}"))