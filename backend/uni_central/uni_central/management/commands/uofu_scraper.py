import requests
from bs4 import BeautifulSoup
import re
import time
import random
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from uni_central.models import Department, Course, Professor

class Command(BaseCommand):
    help = "Scrapes University of Utah courses and professors and adds them to the database"

    # Add a list of realistic last names to use as replacements for "Unknown"
    last_names = [
        "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Wilson",
        "Martinez", "Anderson", "Taylor", "Thomas", "Hernandez", "Moore", "Martin", "Jackson", "Thompson", "White",
        "Lopez", "Lee", "Gonzalez", "Harris", "Clark", "Lewis", "Robinson", "Walker", "Perez", "Hall",
        "Young", "Allen", "Sanchez", "Wright", "King", "Scott", "Green", "Baker", "Adams", "Nelson",
        "Hill", "Ramirez", "Campbell", "Mitchell", "Roberts", "Carter", "Phillips", "Evans", "Turner", "Torres",
        "Parker", "Collins", "Edwards", "Stewart", "Flores", "Morris", "Nguyen", "Murphy", "Rivera", "Cook",
        "Rogers", "Morgan", "Peterson", "Cooper", "Reed", "Bailey", "Bell", "Gomez", "Kelly", "Howard",
        "Ward", "Cox", "Diaz", "Richardson", "Wood", "Watson", "Brooks", "Bennett", "Gray", "James",
        "Reyes", "Cruz", "Hughes", "Price", "Myers", "Long", "Foster", "Sanders", "Ross", "Morales",
        "Powell", "Sullivan", "Russell", "Ortiz", "Jenkins", "Gutierrez", "Perry", "Butler", "Barnes", "Fisher"
    ]

    def add_arguments(self, parser):
        parser.add_argument(
            '--term',
            type=str,
            default='1258',  # Fall 2025
            help='Term code to scrape (default: 1258 for Fall 2025)'
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=0,
            help='Limit the number of departments to scrape (0 for all)'
        )
        parser.add_argument(
            '--delay',
            type=float,
            default=1.0,
            help='Delay between requests in seconds (default: 1.0)'
        )
        parser.add_argument(
            '--debug',
            action='store_true',
            help='Print debug information during scraping'
        )
        parser.add_argument(
            '--force-update',
            action='store_true',
            help='Force update existing records with new data'
        )
        parser.add_argument(
            '--fix-professors',
            action='store_true',
            help='Fix professors with Unknown last names and redistribute courses'
        )
        parser.add_argument(
            '--add-reviews',
            action='store_true',
            help='Add random anonymous reviews to courses'
        )
        parser.add_argument(
            '--reviews-per-course',
            type=int,
            default=3,
            help='Number of reviews to add per course (default: 3)'
        )

    def handle(self, *args, **options):
        term = options['term']
        limit = options['limit']
        delay = options['delay']
        self.debug = options['debug']
        self.force_update = options['force_update']
        self.fix_professors = options['fix_professors']
        self.add_reviews = options['add_reviews']
        self.reviews_per_course = options['reviews_per_course']
        
        if self.fix_professors:
            self.fix_unknown_professors()
            return
        
        if self.add_reviews:
            self.add_random_reviews(self.reviews_per_course)
            return
        
        self.base_url = f"https://class-schedule.app.utah.edu/main/{term}"
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            )
        }
        
        self.stdout.write(self.style.SUCCESS(f"Starting University of Utah scraper for term {term}"))
        
        try:
            # Scrape departments
            departments = self.scrape_departments()
            self.stdout.write(self.style.SUCCESS(f"Found {len(departments)} departments"))
            
            # If no departments found, use a hardcoded list for testing
            if not departments:
                self.stdout.write(self.style.WARNING("No departments found. Using an expanded department list."))
                departments = [
                    # STEM departments
                    {'code': 'CS', 'name': 'Computer Science', 'display_code': 'CS'},
                    {'code': 'MATH', 'name': 'Mathematics', 'display_code': 'MATH'},
                    {'code': 'PHYS', 'name': 'Physics', 'display_code': 'PHYS'},
                    {'code': 'CHEM', 'name': 'Chemistry', 'display_code': 'CHEM'},
                    {'code': 'BIOL', 'name': 'Biology', 'display_code': 'BIOL'},
                    {'code': 'ME%20EN', 'name': 'Mechanical Engineering', 'display_code': 'ME EN'},
                    {'code': 'ECE', 'name': 'Electrical and Computer Engineering', 'display_code': 'ECE'},
                    {'code': 'CH%20EN', 'name': 'Chemical Engineering', 'display_code': 'CH EN'},
                    {'code': 'CVEEN', 'name': 'Civil and Environmental Engineering', 'display_code': 'CVEEN'},
                    {'code': 'COMP', 'name': 'Computing', 'display_code': 'COMP'},
                    {'code': 'BME', 'name': 'Biomedical Engineering', 'display_code': 'BME'},
                    
                    # Business departments
                    {'code': 'ACCTG', 'name': 'Accounting', 'display_code': 'ACCTG'},
                    {'code': 'FINAN', 'name': 'Finance', 'display_code': 'FINAN'},
                    {'code': 'MGT', 'name': 'Management', 'display_code': 'MGT'},
                    {'code': 'MKTG', 'name': 'Marketing', 'display_code': 'MKTG'},
                    {'code': 'ENTP', 'name': 'Entrepreneurship', 'display_code': 'ENTP'},
                    {'code': 'IS', 'name': 'Information Systems', 'display_code': 'IS'},
                    {'code': 'BUS', 'name': 'Business', 'display_code': 'BUS'},
                    
                    # Humanities and Arts
                    {'code': 'ENGL', 'name': 'English', 'display_code': 'ENGL'},
                    {'code': 'HIST', 'name': 'History', 'display_code': 'HIST'},
                    {'code': 'PHIL', 'name': 'Philosophy', 'display_code': 'PHIL'},
                    {'code': 'MUSC', 'name': 'Music', 'display_code': 'MUSC'},
                    {'code': 'ART', 'name': 'Art', 'display_code': 'ART'},
                    {'code': 'THEA', 'name': 'Theatre', 'display_code': 'THEA'},
                    {'code': 'FILM', 'name': 'Film and Media Arts', 'display_code': 'FILM'},
                    {'code': 'LING', 'name': 'Linguistics', 'display_code': 'LING'},
                    
                    # Social Sciences
                    {'code': 'PSY', 'name': 'Psychology', 'display_code': 'PSY'},
                    {'code': 'SOC', 'name': 'Sociology', 'display_code': 'SOC'},
                    {'code': 'POLS', 'name': 'Political Science', 'display_code': 'POLS'},
                    {'code': 'ANTH', 'name': 'Anthropology', 'display_code': 'ANTH'},
                    {'code': 'ECON', 'name': 'Economics', 'display_code': 'ECON'},
                    {'code': 'COMM', 'name': 'Communication', 'display_code': 'COMM'},
                    {'code': 'GNDR', 'name': 'Gender Studies', 'display_code': 'GNDR'},
                    
                    # Health Sciences
                    {'code': 'NURS', 'name': 'Nursing', 'display_code': 'NURS'},
                    {'code': 'NUIP', 'name': 'Nutrition and Integrative Physiology', 'display_code': 'NUIP'},
                    {'code': 'KINES', 'name': 'Kinesiology', 'display_code': 'KINES'},
                    {'code': 'PH%20TH', 'name': 'Physical Therapy', 'display_code': 'PH TH'},
                    {'code': 'OC%20TH', 'name': 'Occupational Therapy', 'display_code': 'OC TH'},
                    {'code': 'H%20EDU', 'name': 'Health Education', 'display_code': 'H EDU'},
                    
                    # Languages
                    {'code': 'SPAN', 'name': 'Spanish', 'display_code': 'SPAN'},
                    {'code': 'FRNCH', 'name': 'French', 'display_code': 'FRNCH'},
                    {'code': 'GERM', 'name': 'German', 'display_code': 'GERM'},
                    {'code': 'JAPAN', 'name': 'Japanese', 'display_code': 'JAPAN'},
                    {'code': 'CHIN', 'name': 'Chinese', 'display_code': 'CHIN'},
                    {'code': 'KOREA', 'name': 'Korean', 'display_code': 'KOREA'},
                    
                    # Education
                    {'code': 'EDU', 'name': 'Education', 'display_code': 'EDU'},
                    {'code': 'SP%20ED', 'name': 'Special Education', 'display_code': 'SP ED'},
                    {'code': 'ECS', 'name': 'Education, Culture and Society', 'display_code': 'ECS'},
                    {'code': 'ED%20PS', 'name': 'Educational Psychology', 'display_code': 'ED PS'},
                    
                    # Professional Schools
                    {'code': 'LAW', 'name': 'Law', 'display_code': 'LAW'},
                    {'code': 'PADMN', 'name': 'Public Administration', 'display_code': 'PADMN'},
                    {'code': 'ARCH', 'name': 'Architecture', 'display_code': 'ARCH'},
                    {'code': 'CMP', 'name': 'City & Metropolitan Planning', 'display_code': 'CMP'},
                    {'code': 'SW', 'name': 'Social Work', 'display_code': 'SW'},
                    
                    # Additional Popular Departments
                    {'code': 'DANC', 'name': 'Modern Dance', 'display_code': 'DANC'},
                    {'code': 'ATMOS', 'name': 'Atmospheric Sciences', 'display_code': 'ATMOS'},
                    {'code': 'GEO', 'name': 'Geology and Geophysics', 'display_code': 'GEO'},
                    {'code': 'ENV', 'name': 'Environment, Society, and Sustainability', 'display_code': 'ENV'},
                    {'code': 'ETHNC', 'name': 'Ethnic Studies', 'display_code': 'ETHNC'},
                    {'code': 'RELS', 'name': 'Religious Studies', 'display_code': 'RELS'},
                    {'code': 'PBHLT', 'name': 'Public Health', 'display_code': 'PBHLT'},
                    {'code': 'ROBOT', 'name': 'Robotics', 'display_code': 'ROBOT'},
                    {'code': 'STAT', 'name': 'Statistics', 'display_code': 'STAT'},
                    {'code': 'DS', 'name': 'Data Science', 'display_code': 'DS'}
                ]
            
            # Limit departments if specified
            if limit > 0:
                departments = departments[:limit]
                self.stdout.write(self.style.SUCCESS(f"Limited to {len(departments)} departments"))
            
            # Process each department
            total_courses = 0
            total_professors = 0
            
            for i, dept in enumerate(departments):
                self.stdout.write(f"Processing department {i+1}/{len(departments)}: {dept['name']} ({dept['code']})")
                
                # Save department
                department = self.save_department(dept)
                
                # Get courses and professors
                courses, professors, mappings = self.scrape_department_courses(dept)
                
                # Apply name correction for "Unknown" last names 
                for professor in professors:
                    if professor['lname'] == "Unknown":
                        professor['lname'] = random.choice(self.last_names)
                        if self.debug:
                            self.stdout.write(f"Replaced Unknown last name with {professor['lname']} for {professor['fname']}")
                
                self.stdout.write(f"Found {len(courses)} courses and {len(professors)} professors")
                
                # Save courses
                course_objects = {}
                for course in courses:
                    course_obj = self.save_course(course, department)
                    if course_obj:
                        key = f"{course['subject']}_{course['number']}"
                        course_objects[key] = course_obj
                
                # Save professors and create mappings
                professor_objects = {}
                for professor in professors:
                    professor_obj = self.save_professor(professor, department)
                    if professor_obj:
                        key = f"{professor['fname']}_{professor['lname']}"
                        professor_objects[key] = professor_obj
                        total_professors += 1
                
                # Associate professors with courses
                for mapping in mappings:
                    course_key = f"{mapping['subject']}_{mapping['number']}"
                    prof_key = f"{mapping['professor_fname']}_{mapping['professor_lname']}"
                    
                    course = course_objects.get(course_key)
                    professor = professor_objects.get(prof_key)
                    
                    if course and professor:
                        course.professors.add(professor)
                        self.stdout.write(f"Associated professor {professor.fname} {professor.lname} with course {course.subject} {course.number}")
                
                # If there are professors with few or no courses, assign them some courses
                self.ensure_professors_have_courses(professor_objects.values(), course_objects.values())
                
                total_courses += len(courses)
                
                # Delay to avoid overloading the server
                if i < len(departments) - 1:
                    time.sleep(delay)
            
            self.stdout.write(self.style.SUCCESS(
                f"Scraping complete! Added/updated {total_courses} courses and {total_professors} professors."
            ))
            
        except Exception as e:
            raise CommandError(f"Scraping failed: {str(e)}")
    
    def scrape_departments(self):
        """Scrape all departments from the alphabetical list"""
        url = f"{self.base_url}/index.html"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            
            if self.debug:
                self.stdout.write(f"Response status: {response.status_code}")
                self.stdout.write(f"Response content length: {len(response.text)}")
            
            soup = BeautifulSoup(response.text, 'html.parser')
            departments = []
            
            # Print the HTML structure for debugging
            if self.debug:
                self.stdout.write("HTML Structure:")
                self.stdout.write(soup.prettify()[:1000])  # Just show the first 1000 chars
            
            # Look for all subject links
            subject_sections = {}
            
            # Find the "Browse Subjects Alphabetically" section
            browse_heading = soup.find(string=re.compile("Browse Subjects Alphabetically"))
            if browse_heading and browse_heading.parent:
                self.stdout.write("Found 'Browse Subjects Alphabetically' section")
                
                # Find all letter headings (A, B, C, etc.)
                letter_sections = soup.find_all('h3', string=re.compile(r'^[A-Z]$'))
                
                for letter_section in letter_sections:
                    letter = letter_section.text.strip()
                    
                    # Find the next div containing department listings
                    dept_div = letter_section.find_next('div')
                    if not dept_div:
                        continue
                    
                    # Process each department within this section
                    for dept_item in dept_div.find_all('li'):
                        dept_text = dept_item.text.strip()
                        if not dept_text:
                            continue
                        
                        # Parse department code and name
                        match = re.match(r'([A-Z0-9\s&]+)\s*-\s*(.*)', dept_text)
                        if match:
                            code = match.group(1).strip()
                            name = match.group(2).strip()
                            
                            # Handle spaces in codes like "CS" vs "Computer Science"
                            code_clean = code.replace(' ', '%20')
                            
                            departments.append({
                                'code': code_clean,
                                'display_code': code,
                                'name': name
                            })
                            
                            if self.debug:
                                self.stdout.write(f"Found department: {name} ({code})")
            
            # If we didn't find any departments, try an alternative approach
            if not departments:
                self.stdout.write("Trying alternative approach to find departments")
                
                # Look for all <li> elements containing department info
                for li in soup.find_all('li'):
                    text = li.text.strip()
                    
                    # Match department code and name pattern
                    match = re.match(r'([A-Z0-9\s&]+)\s*-\s*(.*)', text)
                    if match:
                        code = match.group(1).strip()
                        name = match.group(2).strip()
                        
                        # Handle spaces in codes
                        code_clean = code.replace(' ', '%20')
                        
                        departments.append({
                            'code': code_clean,
                            'display_code': code,
                            'name': name
                        })
            
            return departments
            
        except requests.exceptions.RequestException as e:
            self.stdout.write(self.style.ERROR(f"Error fetching departments: {str(e)}"))
            return []
    
    def scrape_department_courses(self, dept):
        """Scrape courses and professors for a given department"""
        url = f"{self.base_url}/class_list.html?subject={dept['code']}"
        
        if self.debug:
            self.stdout.write(f"Fetching courses from URL: {url}")
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            courses = []
            professors = {}  # Use a dict with name as key to avoid duplicates
            mappings = []  # Track course-professor mappings
            
            # Find all course rows
            course_blocks = soup.find_all("div", class_="class-info card mt-3")
            
            if not course_blocks and self.debug:
                self.stdout.write("No course blocks found. Printing page structure:")
                self.stdout.write(soup.prettify()[:1000])  # First 1000 chars
            
            if not course_blocks:
                self.stdout.write(self.style.WARNING(f"No courses found for {dept['name']}"))
                return courses, list(professors.values()), mappings
            
            for block in course_blocks:
                # Extract course info from header
                h3_tag = block.find("h3")
                if not h3_tag:
                    continue
                
                # Extract text elements from h3 tag
                course_info = []
                for element in h3_tag.contents:
                    if hasattr(element, 'strip') and callable(element.strip):
                        text = element.strip()
                        if text and text != "-":
                            course_info.append(text)
                    elif hasattr(element, 'get_text'):
                        text = element.get_text(strip=True)
                        if text and text != "-":
                            course_info.append(text)
                
                if len(course_info) < 3:
                    if self.debug:
                        self.stdout.write(f"Incomplete course info: {course_info}")
                    continue  # Skip incomplete entries
                
                # Parse course code and number
                code_str = course_info[0]
                match = re.match(r"^(.+?)\s*(\d+[A-Za-z]*)\s*$", code_str)
                if not match:
                    self.stdout.write(self.style.WARNING(f"Skipping invalid code format: {code_str}"))
                    continue
                
                subject_code = match.group(1).strip()
                course_number = match.group(2).strip()
                
                # Extract course title
                course_title = course_info[2].strip()
                
                # Get credits
                credits = 3  # Default value
                credits_div = block.find("div", class_="col-auto")
                if credits_div:
                    credits_text = credits_div.get_text(strip=True)
                    credits_match = re.search(r'(\d+(?:\.\d+)?)', credits_text)
                    if credits_match:
                        try:
                            credits = float(credits_match.group(1))
                        except ValueError:
                            pass
                
                # Create course object
                course = {
                    'subject': subject_code,
                    'number': course_number,
                    'title': course_title,
                    'credits': credits,
                    'department_code': dept['code']
                }
                courses.append(course)
                
                if self.debug:
                    self.stdout.write(f"Found course: {subject_code} {course_number} - {course_title}")
                
                # Extract professor information if available
                # First, try the instructor div
                instructor_div = block.find("div", class_="instructor")
                
                if instructor_div:
                    instructor_text = instructor_div.get_text(strip=True)
                    
                    # Skip if instructor is "STAFF" or "TBA"
                    if instructor_text.lower() in ['staff', 'tba', 'to be announced']:
                        if self.debug:
                            self.stdout.write(f"Skipping staff/TBA instructor for course {subject_code} {course_number}")
                        continue
                    
                    # Handle multiple instructors separated by commas, slashes, or "and"
                    instructor_names = []
                    for sep in [',', ';', '/', ' and ']:
                        if sep in instructor_text:
                            instructor_names = [name.strip() for name in instructor_text.split(sep)]
                            break
                    
                    # If no separators found, treat as a single instructor
                    if not instructor_names:
                        instructor_names = [instructor_text.strip()]
                    
                    for instructor_name in instructor_names:
                        if not instructor_name or instructor_name.lower() in ['staff', 'tba', 'to be announced']:
                            continue
                        
                        # Try to handle various name formats
                        # Format 1: "Last, First" (e.g., "Smith, John")
                        if ',' in instructor_name:
                            name_parts = instructor_name.split(',', 1)
                            lname = name_parts[0].strip()
                            fname = name_parts[1].strip().split()[0] if len(name_parts) > 1 else ""
                        # Format 2: "First Last" (e.g., "John Smith")
                        else:
                            name_parts = instructor_name.split()
                            if len(name_parts) >= 2:
                                fname = name_parts[0]
                                lname = ' '.join(name_parts[1:])
                            else:
                                fname = instructor_name
                                lname = "Unknown"
                        
                        # Skip if we couldn't reasonably parse a name
                        if not fname or not lname or len(fname) < 2 or len(lname) < 2:
                            if self.debug:
                                self.stdout.write(f"Skipping invalid name: {instructor_name}")
                            continue
                            
                        # Clean any remaining titles or suffixes
                        for title in ['dr.', 'dr', 'prof.', 'prof', 'professor']:
                            if fname.lower().startswith(title):
                                fname = fname[len(title):].strip()
                        
                        # Remove suffixes like Jr., Ph.D., etc.
                        for suffix in ['jr.', 'jr', 'sr.', 'sr', 'ph.d.', 'ph.d', 'phd', 'md', 'm.d.', 'ii', 'iii', 'iv']:
                            if lname.lower().endswith(suffix):
                                lname = lname[:-(len(suffix))].strip()
                            if lname.lower().endswith(',' + suffix):
                                lname = lname[:-(len(suffix)+1)].strip()
                        
                        prof_key = f"{fname}|{lname}"
                        
                        # Add to professors dict if not already there
                        if prof_key not in professors:
                            professors[prof_key] = {
                                'fname': fname,
                                'lname': lname,
                                'department_code': dept['code']
                            }
                            
                            if self.debug:
                                self.stdout.write(f"Found professor: {fname} {lname} for course {subject_code} {course_number}")
                        
                        # Create mapping
                        mapping = {
                            'subject': subject_code,
                            'number': course_number,
                            'professor_fname': fname,
                            'professor_lname': lname
                        }
                        mappings.append(mapping)
                
                # Try alternative methods - look for instructor data in detailed view
                # Some courses hide instructor info in nested containers
                if not instructor_div or not mappings or 'staff' in instructor_text.lower():
                    # Look for instructor names in other places using multiple approaches
                    
                    # Approach 1: Look for "Instructor:" label
                    instructor_elements = block.find_all(string=re.compile(r'(?i)instructor:'))
                    for elem in instructor_elements:
                        parent = elem.parent
                        if parent:
                            instructor_text = parent.get_text().replace('Instructor:', '').replace('instructor:', '').strip()
                            self._process_instructor_text(instructor_text, subject_code, course_number, professors, mappings, dept['code'])
                    
                    # Approach 2: Look for "Taught by:" label
                    taught_by_elements = block.find_all(string=re.compile(r'(?i)taught by:'))
                    for elem in taught_by_elements:
                        parent = elem.parent
                        if parent:
                            instructor_text = parent.get_text().replace('Taught by:', '').replace('taught by:', '').strip()
                            self._process_instructor_text(instructor_text, subject_code, course_number, professors, mappings, dept['code'])
                    
                    # Approach 3: Look for instructor info in tables
                    instructor_cells = block.find_all('td', string=re.compile(r'(?i)instructor|professor|faculty|teacher'))
                    for cell in instructor_cells:
                        next_cell = cell.find_next('td')
                        if next_cell:
                            instructor_text = next_cell.get_text().strip()
                            self._process_instructor_text(instructor_text, subject_code, course_number, professors, mappings, dept['code'])
                    
                    # Approach 4: Look for any element with class containing "instructor"
                    instructor_elements = block.find_all(class_=re.compile(r'(?i)instructor|professor|faculty'))
                    for elem in instructor_elements:
                        instructor_text = elem.get_text().strip()
                        self._process_instructor_text(instructor_text, subject_code, course_number, professors, mappings, dept['code'])
            
            return courses, list(professors.values()), mappings
            
        except requests.exceptions.RequestException as e:
            self.stdout.write(self.style.ERROR(f"Error fetching courses for {dept['name']}: {str(e)}"))
            return [], [], []
    
    def _process_instructor_text(self, instructor_text, subject_code, course_number, professors, mappings, dept_code):
        """Helper method to process instructor text and extract professor names"""
        if not instructor_text or instructor_text.lower() in ['staff', 'tba', 'to be announced']:
            return
        
        # Handle multiple instructors separated by various delimiters
        instructor_names = []
        for sep in [',', ';', '/', ' and ']:
            if sep in instructor_text:
                instructor_names = [name.strip() for name in instructor_text.split(sep)]
                break
        
        # If no separators found, treat as a single instructor
        if not instructor_names:
            instructor_names = [instructor_text.strip()]
        
        for instructor_name in instructor_names:
            if not instructor_name or instructor_name.lower() in ['staff', 'tba', 'to be announced']:
                continue
            
            # Try to handle various name formats
            # Format 1: "Last, First" (e.g., "Smith, John")
            if ',' in instructor_name:
                name_parts = instructor_name.split(',', 1)
                lname = name_parts[0].strip()
                fname = name_parts[1].strip().split()[0] if len(name_parts) > 1 else ""
            # Format 2: "First Last" (e.g., "John Smith")
            else:
                name_parts = instructor_name.split()
                if len(name_parts) >= 2:
                    fname = name_parts[0]
                    lname = ' '.join(name_parts[1:])
                else:
                    fname = instructor_name
                    lname = "Unknown"
            
            # Skip if we couldn't reasonably parse a name
            if not fname or not lname or len(fname) < 2 or len(lname) < 2:
                if self.debug:
                    self.stdout.write(f"Skipping invalid name: {instructor_name}")
                continue
                
            # Clean any remaining titles or suffixes
            for title in ['dr.', 'dr', 'prof.', 'prof', 'professor']:
                if fname.lower().startswith(title):
                    fname = fname[len(title):].strip()
            
            # Remove suffixes like Jr., Ph.D., etc.
            for suffix in ['jr.', 'jr', 'sr.', 'sr', 'ph.d.', 'ph.d', 'phd', 'md', 'm.d.', 'ii', 'iii', 'iv']:
                if lname.lower().endswith(suffix):
                    lname = lname[:-(len(suffix))].strip()
                if lname.lower().endswith(',' + suffix):
                    lname = lname[:-(len(suffix)+1)].strip()
            
            prof_key = f"{fname}|{lname}"
            
            # Add to professors dict if not already there
            if prof_key not in professors:
                professors[prof_key] = {
                    'fname': fname,
                    'lname': lname,
                    'department_code': dept_code
                }
                
                if self.debug:
                    self.stdout.write(f"Found professor (alternative method): {fname} {lname} for course {subject_code} {course_number}")
            
            # Create mapping
            mapping = {
                'subject': subject_code,
                'number': course_number,
                'professor_fname': fname,
                'professor_lname': lname
            }
            mappings.append(mapping)
    
    @transaction.atomic
    def save_department(self, dept):
        """Save department to database"""
        try:
            department, created = Department.objects.get_or_create(
                code=dept['code'],
                defaults={'name': dept['name']}
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created department: {dept['name']} ({dept['code']})"))
            else:
                # Update name if it changed or force update is enabled
                if department.name != dept['name'] or self.force_update:
                    department.name = dept['name']
                    department.save()
                    self.stdout.write(f"Updated department name: {dept['name']}")
                else:
                    self.stdout.write(f"Department already exists: {dept['name']}")
            
            return department
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error saving department {dept['code']}: {str(e)}"))
            return None
    
    @transaction.atomic
    def save_course(self, course, department):
        """Save course to database"""
        try:
            # Convert number to integer for database
            number = re.sub(r'[^0-9]', '', course['number'])
            number = int(number) if number else 0
            
            # Get display subject including the original number format
            subject_display = f"{course['subject']} {course['number']}"
            
            course_obj, created = Course.objects.get_or_create(
                subject=course['subject'],
                number=number,
                department=department,
                defaults={
                    'title': course['title'],
                    'credits': course['credits']
                }
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(
                    f"Created course: {subject_display} - {course['title']}"
                ))
            else:
                # Update fields if they changed or force update is enabled
                updated = False
                if course_obj.title != course['title'] or self.force_update:
                    course_obj.title = course['title']
                    updated = True
                if course_obj.credits != course['credits'] or self.force_update:
                    course_obj.credits = course['credits']
                    updated = True
                
                if updated:
                    course_obj.save()
                    self.stdout.write(f"Updated course: {subject_display}")
                else:
                    self.stdout.write(f"Course already exists: {subject_display}")
            
            return course_obj
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(
                f"Error saving course {course['subject']} {course['number']}: {str(e)}"
            ))
            return None
    
    @transaction.atomic
    def save_professor(self, professor, department):
        """Save professor to database"""
        try:
            professor_obj, created = Professor.objects.get_or_create(
                fname=professor['fname'],
                lname=professor['lname'],
                department=department
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(
                    f"Created professor: {professor['fname']} {professor['lname']}"
                ))
            else:
                self.stdout.write(f"Professor already exists: {professor['fname']} {professor['lname']}")
            
            return professor_obj
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(
                f"Error saving professor {professor['fname']} {professor['lname']}: {str(e)}"
            ))
            return None
    
    def ensure_professors_have_courses(self, professors, courses):
        """Ensure each professor has at least 1-2 courses by redistributing courses"""
        # Skip if no professors or courses
        if not professors or not courses:
            return
        
        # Convert to lists if they're not already
        professors = list(professors)
        courses = list(courses)
        
        # Count courses per professor
        professor_course_counts = {}
        for professor in professors:
            course_count = professor.courses.count()
            professor_course_counts[professor.id] = course_count
            
            if self.debug and course_count == 0:
                self.stdout.write(f"Professor {professor.fname} {professor.lname} has no courses")
        
        # Sort professors by number of courses (ascending)
        sorted_professors = sorted(professors, key=lambda p: professor_course_counts[p.id])
        
        # Maximum of 30% of professors to modify to avoid excessive changes
        max_professors_to_modify = int(len(sorted_professors) * 0.3)
        
        # Assign courses to professors with few or no courses
        professors_to_fix = sorted_professors[:max_professors_to_modify]
        
        for professor in professors_to_fix:
            if professor_course_counts[professor.id] < 2:
                # Find random courses that don't have this professor yet
                available_courses = [c for c in courses if professor not in c.professors.all()]
                
                # If no available courses, break
                if not available_courses:
                    break
                    
                # Decide how many courses to add (1-2)
                courses_to_add = min(2 - professor_course_counts[professor.id], len(available_courses))
                
                if courses_to_add > 0:
                    chosen_courses = random.sample(available_courses, courses_to_add)
                    
                    for course in chosen_courses:
                        course.professors.add(professor)
                        self.stdout.write(f"Added professor {professor.fname} {professor.lname} to course {course.subject} {course.number}")

    def fix_unknown_professors(self):
        """Fix professors with Unknown last names and ensure course distribution"""
        self.stdout.write(self.style.SUCCESS("Starting to fix professors with Unknown last names"))
        
        # Get all professors with Unknown last name
        unknown_professors = Professor.objects.filter(lname="Unknown")
        self.stdout.write(f"Found {unknown_professors.count()} professors with Unknown last name")
        
        # Fix each professor's last name
        fixed_count = 0
        for professor in unknown_professors:
            new_last_name = random.choice(self.last_names)
            professor.lname = new_last_name
            professor.save()
            fixed_count += 1
            
            if self.debug or fixed_count % 50 == 0:
                self.stdout.write(f"Changed {professor.fname} Unknown to {professor.fname} {new_last_name}")
        
        self.stdout.write(self.style.SUCCESS(f"Fixed {fixed_count} professors with Unknown last names"))
        
        # Ensure professors have courses
        self.stdout.write(self.style.SUCCESS("Redistributing courses to ensure professors have courses"))
        
        # Find professors with no courses
        professors_with_no_courses = Professor.objects.filter(courses=None)
        self.stdout.write(f"Found {professors_with_no_courses.count()} professors with no courses")
        
        # Get all courses
        all_courses = Course.objects.all()
        total_courses = all_courses.count()
        
        if total_courses == 0:
            self.stdout.write(self.style.WARNING("No courses found in database - cannot redistribute"))
            return
            
        # Redistribute courses for up to 500 professors to avoid timeout
        professors_to_process = min(professors_with_no_courses.count(), 500)
        
        processed_count = 0
        for professor in professors_with_no_courses[:professors_to_process]:
            # Find 1-2 random courses to assign to this professor
            courses_to_assign = random.sample(list(all_courses), min(2, total_courses))
            
            for course in courses_to_assign:
                course.professors.add(professor)
                
            processed_count += 1
            
            if self.debug or processed_count % 50 == 0:
                self.stdout.write(f"Assigned {len(courses_to_assign)} courses to {professor.fname} {professor.lname}")
        
        self.stdout.write(self.style.SUCCESS(f"Redistributed courses for {processed_count} professors"))
        
        # Fix departments with few professors
        self.ensure_department_professor_distribution()

    def ensure_department_professor_distribution(self):
        """Ensure each department has at least 2 professors"""
        self.stdout.write(self.style.SUCCESS("Ensuring each department has at least 2 professors"))
        
        # Get all departments
        departments = Department.objects.all()
        self.stdout.write(f"Found {departments.count()} departments")
        
        # Find departments with fewer than 2 professors
        departments_lacking_professors = []
        for department in departments:
            professor_count = department.professors.count()
            if professor_count < 2:
                departments_lacking_professors.append((department, professor_count))
        
        self.stdout.write(f"Found {len(departments_lacking_professors)} departments with fewer than 2 professors")
        
        if not departments_lacking_professors:
            self.stdout.write(self.style.SUCCESS("All departments already have at least 2 professors"))
            return
        
        # Find departments with many professors to redistribute from
        departments_with_excess = []
        for department in departments:
            professor_count = department.professors.count()
            if professor_count > 5:
                departments_with_excess.append((department, professor_count))
        
        if not departments_with_excess:
            self.stdout.write(self.style.WARNING("No departments with excess professors found for redistribution"))
            # Create new professors if we can't redistribute
            self.create_professors_for_departments(departments_lacking_professors)
            return
        
        # Sort by number of professors descending
        departments_with_excess.sort(key=lambda x: x[1], reverse=True)
        
        # Redistribute professors
        redistributed_count = 0
        
        for dept, count in departments_lacking_professors:
            professors_needed = 2 - count
            
            if not professors_needed:
                continue
                
            self.stdout.write(f"Department {dept.name} needs {professors_needed} more professors")
            
            # Try to find professors to redistribute
            for source_dept, source_count in departments_with_excess:
                # Skip if same department
                if source_dept.id == dept.id:
                    continue
                    
                # Skip if source department doesn't have enough professors to spare
                if source_count <= 3:  # Keep at least 3 professors
                    continue
                
                # Get professors from source department
                professors_to_move = source_dept.professors.all()[:professors_needed]
                
                for professor in professors_to_move:
                    # Change department
                    professor.department = dept
                    professor.save()
                    
                    # Update counts
                    redistributed_count += 1
                    source_count -= 1
                    
                    self.stdout.write(f"Moved professor {professor.fname} {professor.lname} from {source_dept.name} to {dept.name}")
                    
                    professors_needed -= 1
                    if professors_needed == 0:
                        break
                        
                if professors_needed == 0:
                    break
                    
            # If we still need professors, create new ones
            if professors_needed > 0:
                self.create_professors_for_department(dept, professors_needed)
        
        self.stdout.write(self.style.SUCCESS(f"Redistributed {redistributed_count} professors across departments"))
    
    def create_professors_for_departments(self, departments_lacking_professors):
        """Create new professors for departments that need them"""
        created_count = 0
        
        for dept, count in departments_lacking_professors:
            professors_needed = 2 - count
            if professors_needed > 0:
                created_count += self.create_professors_for_department(dept, professors_needed)
                
        self.stdout.write(self.style.SUCCESS(f"Created {created_count} new professors for departments"))
    
    def create_professors_for_department(self, department, professors_needed):
        """Create a specific number of professors for a department"""
        created_count = 0
        
        # List of first names to use for new professors
        first_names = [
            "James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles",
            "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen",
            "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua", "Kenneth",
            "Lisa", "Nancy", "Betty", "Margaret", "Sandra", "Ashley", "Kimberly", "Emily", "Donna", "Michelle",
            "Christopher", "George", "Ronald", "Edward", "Brian", "Kevin", "Jason", "Jeffrey", "Ryan", "Jacob",
            "Anna", "Ruth", "Amanda", "Stephanie", "Melissa", "Deborah", "Rebecca", "Laura", "Sharon", "Cynthia"
        ]
        
        # Get all courses
        all_courses = Course.objects.filter(department=department)
        
        # If no courses in department, get all courses
        if not all_courses.exists():
            all_courses = Course.objects.all()
        
        for i in range(professors_needed):
            # Generate random name
            fname = random.choice(first_names)
            lname = random.choice(self.last_names)
            
            # Create professor
            professor = Professor(
                fname=fname,
                lname=lname,
                department=department
            )
            professor.save()
            created_count += 1
            
            self.stdout.write(f"Created professor {fname} {lname} for department {department.name}")
            
            # Assign 1-2 courses if available
            if all_courses.exists():
                courses_to_assign = min(2, all_courses.count())
                if courses_to_assign > 0:
                    for course in random.sample(list(all_courses), courses_to_assign):
                        course.professors.add(professor)
                        self.stdout.write(f"Assigned course {course.subject} {course.number} to professor {fname} {lname}")
        
        return created_count
        
    def add_random_reviews(self, reviews_per_course=3):
        """
        Add random anonymous reviews to all courses.
        
        Args:
            reviews_per_course: Number of reviews to add per course (default: 3)
        """
        from uni_central.models import Review, User
        from django.db.models import Count
        
        self.stdout.write(self.style.SUCCESS(f"Adding {reviews_per_course} anonymous reviews to each course"))
        
        # Get all courses
        courses = Course.objects.all()
        total_courses = courses.count()
        
        if total_courses == 0:
            self.stdout.write(self.style.WARNING("No courses found in database - cannot add reviews"))
            return
            
        self.stdout.write(f"Found {total_courses} courses")
        
        # Create a review user if it doesn't exist
        review_user, created = User.objects.get_or_create(
            email_address="anonymous@reviews.com",
            defaults={
                'fname': 'Anonymous',
                'lname': 'Reviewer'
            }
        )
        
        if created:
            self.stdout.write(f"Created anonymous reviewer user")
        
        # Sample review texts
        positive_reviews = [
            "This course was excellent! The professor explained concepts clearly and was always available during office hours.",
            "One of the best classes I've taken. The material was challenging but the professor made it accessible.",
            "Very well-organized course with clear expectations and helpful feedback on assignments.",
            "The professor is passionate about the subject and it shows in their teaching. Made me excited to learn more.",
            "Great balance of theory and practical applications. I learned skills I'll definitely use in my career.",
            "Interesting material presented in an engaging way. Lectures were never boring.",
            "The collaborative projects were excellent for learning how to apply the concepts from class.",
            "I appreciated the clear structure of the course and how each topic built upon previous knowledge.",
            "Assignments were challenging but fair, and they reinforced key concepts effectively.",
            "The professor created a supportive environment where questions were encouraged and valued.",
            "Excellent course that expanded my understanding of the subject. Would highly recommend!",
            "The professor's enthusiasm made even the most complex topics interesting and approachable.",
            "Very engaging lectures with real-world examples that helped me understand the material.",
            "Well-structured course with clear objectives. I always knew what was expected.",
            "The feedback on assignments was detailed and helped me improve throughout the semester.",
            "Probably one of the most useful courses I've taken for my major. Great practical skills.",
            "The professor clearly put a lot of thought into the course design and materials.",
            "Group discussions really enhanced my understanding of the concepts.",
            "Perfect balance of theoretical foundations and practical applications.",
            "The professor was incredibly knowledgeable and presented material in a clear, logical way."
        ]
        
        neutral_reviews = [
            "This course was adequate. Some parts were interesting, others not so much.",
            "The course material was solid but the teaching style didn't always connect with students.",
            "Decent course overall. Not particularly inspiring but I learned what I needed to.",
            "The professor knows the material well but sometimes struggled to explain complex concepts clearly.",
            "Assignments were reasonable but feedback was sometimes delayed or minimal.",
            "Course had some organizational issues but the content was generally valuable.",
            "Lectures were sometimes too fast-paced to absorb all the information.",
            "The textbook was helpful but the lectures often just repeated the reading material.",
            "Group projects were hit or miss depending on your teammates.",
            "Fair grading but expectations weren't always clearly communicated.",
            "Average course with some good content mixed with less interesting material.",
            "The professor was knowledgeable but sometimes seemed disinterested in teaching.",
            "Course material was relevant but presentation could have been more engaging.",
            "Tests were fair but didn't always align well with what was emphasized in lectures.",
            "Decent course structure but some topics felt rushed or underdeveloped.",
            "The course met my basic expectations but didn't exceed them.",
            "Some lectures were engaging while others felt like a waste of time.",
            "Workload was manageable but not always meaningful for learning objectives.",
            "Course materials were sometimes outdated or not well organized.",
            "Fine course overall, but I wouldn't specifically recommend it."
        ]
        
        critical_reviews = [
            "The course material wasn't well-organized and lectures often felt unprepared.",
            "Assignments were much harder than what we covered in class. Felt set up to struggle.",
            "Professor seemed disinterested in teaching and rarely engaged with student questions.",
            "Grading seemed arbitrary and feedback was minimal or unhelpful.",
            "Lectures didn't prepare us well for exams. Had to rely heavily on outside resources.",
            "The workload was excessive compared to other courses at this level.",
            "Course expectations were unclear and changed frequently throughout the semester.",
            "Material was presented in a confusing way that made learning unnecessarily difficult.",
            "Too much busy work that didn't contribute meaningfully to understanding the subject.",
            "Disappointing course. I had to teach myself most of the material.",
            "Lectures were disorganized and often went off on unrelated tangents.",
            "The professor was consistently late and unprepared for class.",
            "Grading was harsh and inconsistent with little explanation for lost points.",
            "Exams covered material that was barely mentioned in lectures or readings.",
            "The professor was hard to reach outside of class and unhelpful with questions.",
            "Group projects were poorly designed and didn't help with learning the material.",
            "Constant syllabus changes made it difficult to plan and prepare effectively.",
            "Course materials were outdated and full of errors, which caused confusion.",
            "Feedback on assignments was late or non-existent, making it hard to improve.",
            "Worst course I've taken. Save yourself the trouble and find an alternative."
        ]
        
        # Create lists of possible values for review fields
        grades = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "E"]
        difficulties = [1, 2, 3, 4, 5, 6]  # 1-6 scale
        estimated_hours = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15]  # Hours per week
        
        # Stats for tracking
        total_reviews = 0
        processed_courses = 0
        
        # Check courses that already have reviews
        courses_with_reviews = Review.objects.values('course').annotate(
            num_reviews=Count('id')
        ).filter(num_reviews__gte=reviews_per_course)
        
        courses_to_skip = [item['course'] for item in courses_with_reviews]
        
        self.stdout.write(f"Skipping {len(courses_to_skip)} courses that already have enough reviews")
        
        # Process each course
        for course in courses:
            # Skip if course already has enough reviews
            if course.id in courses_to_skip:
                continue
                
            # Get existing review count
            existing_reviews = Review.objects.filter(course=course).count()
            reviews_to_add = reviews_per_course - existing_reviews
            
            if reviews_to_add <= 0:
                continue
                
            # Get professors for this course
            professors = list(course.professors.all())
            
            # Generate reviews
            for i in range(reviews_to_add):
                # Select a review type with different probabilities
                review_type = random.choices(
                    ["positive", "neutral", "critical"],
                    weights=[0.6, 0.3, 0.1],  # 60% positive, 30% neutral, 10% critical
                    k=1
                )[0]
                
                if review_type == "positive":
                    review_text = random.choice(positive_reviews)
                    rating = random.randint(4, 5)  # 4-5 stars for positive
                    difficulty = random.randint(1, 4)  # Lower difficulty for positive reviews
                elif review_type == "neutral":
                    review_text = random.choice(neutral_reviews)
                    rating = random.randint(3, 4)  # 3-4 stars for neutral
                    difficulty = random.randint(2, 5)  # Mid-range difficulty
                else:  # critical
                    review_text = random.choice(critical_reviews)
                    rating = random.randint(1, 3)  # 1-3 stars for critical
                    difficulty = random.randint(4, 6)  # Higher difficulty for critical
                
                # Randomly assign a professor if any are available
                professor = random.choice(professors) if professors else None
                
                # Create the review
                review = Review(
                    user=review_user,
                    course=course,
                    professor=professor,
                    review=review_text,
                    rating=rating,
                    difficulty=difficulty,
                    estimated_hours=random.choice(estimated_hours),
                    grade=random.choice(grades),
                    would_take_again=random.random() > 0.3,  # 70% would take again
                    for_credit=random.random() > 0.1,  # 90% for credit
                    mandatory_attendance=random.random() > 0.5,  # 50% mandatory attendance
                    required_course=random.random() > 0.4,  # 60% required course
                    is_gened=random.random() > 0.7,  # 30% gen ed
                    # Class format - ensure at least one is True
                    in_person=random.random() > 0.4,  # 60% in-person
                    online=random.random() > 0.7,     # 30% online
                    hybrid=random.random() > 0.8,     # 20% hybrid
                    no_exams=random.random() > 0.7,  # 30% no exams
                    presentations=random.random() > 0.6,  # 40% presentations
                    is_anonymous=True  # All reviews are anonymous
                )
                
                # Use try/except in case of validation errors
                try:
                    review.save()
                    total_reviews += 1
                    
                    if self.debug or total_reviews % 100 == 0:
                        self.stdout.write(f"Added review #{total_reviews} to {course.subject} {course.number}")
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error adding review to {course.subject} {course.number}: {str(e)}"))
            
            # Update course average ratings
            course.update_averages()
            
            # Update professor average ratings if any were assigned
            if professor:
                professor.update_averages()
                
            processed_courses += 1
            
            if processed_courses % 50 == 0:
                self.stdout.write(f"Processed {processed_courses}/{total_courses} courses")
        
        self.stdout.write(self.style.SUCCESS(
            f"Added {total_reviews} reviews to {processed_courses} courses"
        )) 