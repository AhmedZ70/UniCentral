import requests
from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand
from uni_central.models import Department, Course  # Adjust if necessary

class Command(BaseCommand):
    help = (
        "For each department link provided, if the department exists then add all new courses. "
        "For each course block, follow the 'Class Details' link to fetch credits and parse course info. "
        "The course number is cleaned to remove non-digit characters."
    )

    def handle(self, *args, **options):
        # Dictionary mapping department names to their course page URLs.
        department_links = {
            "Accounting": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ACCTG",
            "Aerospace Studies": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=AEROS",
            "Neurobiology and Anatomy": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ANAT",
            "Anesthesiology": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ANES",
            "Anthropology": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ANTH",
            "Arabic": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ARAB",
            "Architecture": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ARCH",
            "Art": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ART",
            "Art History": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ARTH",
            "Arts Technology": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ARTX",
            "American Sign Language": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ASL",
            "Asian Studies": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ASTP",
            "Astronomy": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ASTR",
            "Athletics": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ATHL",
            "Atmospheric Sciences": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ATMOS",
            "Athletic Training and Sports Medicine": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ATSM",
            # Add all other extracted subjects here...
        }

        total_courses_added = 0

        for dept_name, dept_url in department_links.items():
            # 1. Find or create the department.
            department, created = Department.objects.get_or_create(
                name=dept_name,
                defaults={"code": dept_name}  # Modify if your Department model uses a different field.
            )
            if created:
                self.stdout.write(f"Created new department: {dept_name}")
            else:
                self.stdout.write(f"Found existing department: {dept_name}")

            self.stdout.write(f"Scraping courses for '{dept_name}' from: {dept_url}")
            response = requests.get(dept_url)
            if response.status_code != 200:
                self.stderr.write(f"Failed to retrieve courses for {dept_name} (status {response.status_code}).")
                continue

            soup = BeautifulSoup(response.text, "html.parser")
            course_blocks = soup.find_all("div", class_="class-info card mt-3")
            if not course_blocks:
                self.stdout.write(f"No course blocks found for {dept_name}.")
                continue

            for block in course_blocks:
                h3_tag = block.find("h3")
                if not h3_tag:
                    continue

                code_elem = h3_tag.find("a")
                if not code_elem:
                    continue
                code_str = code_elem.get_text(strip=True)
                code_parts = code_str.split()
                if len(code_parts) < 2:
                    continue

                subject_code = code_parts[0]
                raw_course_number = code_parts[1]
                clean_number = ''.join(filter(str.isdigit, raw_course_number))
                if not clean_number:
                    self.stdout.write(f"Skipping course {subject_code} due to invalid course number: {raw_course_number}")
                    continue
                course_number = int(clean_number)

                all_children = list(h3_tag.children)
                try:
                    idx = all_children.index(code_elem)
                except ValueError:
                    continue

                info_elems = []
                for child in all_children[idx+1:]:
                    if hasattr(child, "name") and child.name in ["span", "a"]:
                        text = child.get_text(strip=True)
                        if text and text != "-":
                            info_elems.append(child)

                if len(info_elems) < 2:
                    continue

                course_title = info_elems[1].get_text(strip=True)

                # 2. Fetch credits from the "Class Details" page.
                credits = None
                details_link_tag = block.find("a", class_="btn btn-secondary btn-sm")
                if details_link_tag:
                    details_href = details_link_tag.get("href")
                    details_url = requests.compat.urljoin(dept_url, details_href)
                    details_resp = requests.get(details_url)
                    if details_resp.status_code == 200:
                        details_soup = BeautifulSoup(details_resp.text, "html.parser")
                        credit_span = details_soup.find("span", class_="credit-hours")
                        if credit_span:
                            credits_text = credit_span.get_text(strip=True)
                            parts = credits_text.split()
                            if parts and parts[0].replace('.', '', 1).isdigit():
                                credits = float(parts[0])
                if credits is None:
                    credits = 3

                # 3. Check for duplicate: skip if course with same department and number exists.
                if Course.objects.filter(department=department, number=course_number).exists():
                    self.stdout.write(f"Course {subject_code} {course_number} already exists in {dept_name}. Skipping.")
                    continue

                Course.objects.create(
                    department=department,
                    number=course_number,
                    title=course_title,
                    credits=credits,
                    subject=f"{subject_code} {course_number}"  # Updated: subject now contains "course_code course_number"
                )
                total_courses_added += 1
                self.stdout.write(f"Added course: {subject_code} {course_number} - '{course_title}' ({credits} credits) to {dept_name}")

        self.stdout.write(self.style.SUCCESS(f"Scraping complete. Total courses added: {total_courses_added}"))