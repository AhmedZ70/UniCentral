import requests
import re
from bs4 import BeautifulSoup, NavigableString
from django.core.management.base import BaseCommand
from uni_central.models import Department, Course  # Adjust import as needed

class Command(BaseCommand):
    help = "Scrapes courses from department URLs and adds new courses to the database."

    def handle(self, *args, **options):
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            )
        }

        department_links = {
            # "Accounting": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ACCTG",
            # "Aerospace Studies": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=AEROS",
            # "Neurobiology and Anatomy": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ANAT",
            # "Anesthesiology": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ANES",
            # "Anthropology": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ANTH",
            # "Arabic": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ARAB",
            # "Architecture": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ARCH",
            # "Art": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ART",
            # "Art History": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ARTH",
            # "Arts Technology": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ARTX",
            # "American Sign Language": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ASL",
            # "Asian Studies": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ASTP",
            # "Astronomy": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ASTR",
            # "Athletics": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ATHL",
            # "Atmospheric Sciences": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ATMOS",
            # "Athletic Training and Sports Medicine": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ATSM",
            # "Ballet": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=BALLE",
            # "Book Arts": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=BART",
            # "Bennion Center": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=BENN",
            # "Biochemistry": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=BIO%20C",
            # "Biology": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=BIOL",
            # "Biological Chemistry": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=BLCHM",
            # "Biomedical Engineering": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=BME",
            # "Biomedical Informatics": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=BMI",
            # "Business": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=BUS",
            # "Ceramics": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=CERM",
            # "Chemical Engineering": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=CH%20EN",
            # "Chemistry": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=CHEM",
            # "Chinese": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=CHIN",
            # "Classical Civilization": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=CL%20CV",
            # "Comparative Literary and Cultural Studies": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=CLCS",
            # "City & Metropolitan Planning": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=CMP",
            # "Communication": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=COMM",
            # "Computing": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=COMP",
            # "Criminology": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=CRIM",
            # "Computer Science": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=CS",
            # "Communication Sciences and Disorders": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=CSD",
            # "Center for Teaching Excellence": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=CTLE",
            # "Civil and Environmental Engineering": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=CVEEN",
            # "Cardiovascular Perfusion": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=CVP",
            # "Modern Dance": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=DANC",
            # "Dentistry": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=DENT",
            # "Dermatology": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=DERM",
            # "Design": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=DES",
            # "Graphic Design": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=DESGR",
            # "Disability Studies": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=DISAB",
            # "Drawing": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=DRAW",
            # "Data Science": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=DS",
            # "Electrical and Computer Engineering": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ECE",
            # "Economics": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ECON",
            # "Education, Culture and Society": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ECS",
            # "Educational Psychology": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ED%20PS",
            # "Educational Technology": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=EDTEC",
            # "Education": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=EDU",
            # "Environmental Humanities": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=EHUM",
            # "English Language Institute": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ELI",
            # "Educational Leadership & Policy": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ELP",
            # "Emergency Medicine": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=EMER",
            # "Engineering": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ENGIN",
            # "English": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ENGL",
            # "Entrepreneurship": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ENTP",
            # "Environment, Society, and Sustainability": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ENV",
            # "Environmental and Sustainability Studies": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ENVST",
            # "ESS Fitness Noncredit Certificate": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ESSFC",
            # "ESS Fitness Courses": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ESSF",
            # "Ethnic Studies": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ETHNC",
            # "Fine Arts": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=FA",
            # "Family and Consumer Studies": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=FCS",
            # "Film and Media Arts": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=FILM",
            # "Finance": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=FINAN",
            # "Family and Preventive Medicine": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=FP%20MD",
            # "French": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=FRNCH",
            # "Games": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=GAMES",
            # "Geology and Geophysics": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=GEO",
            # "Geography": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=GEOG",
            # "German": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=GERM",
            # "Gerontology": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=GERON",
            # "Utah Global": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=GLOBL",
            # "Gender Studies": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=GNDR",
            # "Greek": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=GREEK",
            # "Health Promotion & Education": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=H%20EDU",
            # "Health Promotion & Education Noncredit Certificate": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=H%20EDUC",
            # "Human Genetics": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=H%20GEN",
            # "Hindi": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=HINDI",
            # "History": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=HIST",
            # "Health, Kinesiology, and Recreation": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=HKR",
            # "Hinckley Institute": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=HNKLY",
            # "Honors College": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=HONOR",
            # "History & Philosophy of Science": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=HPSCI",
            # "Health, Society and Policy": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=HSP",
            # "Humanities": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=HUM",
            # "International Affairs and Global Enterprise": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=IAGE",
            # "International Studies": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=INTL",
            # "Internal Medicine": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=INTMD",
            # "Information Systems": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=IS",
            # "Italian": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ITAL",
            # "Japanese": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=JAPAN",
            # "Kinesiology": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=KINES",
            # "Korean": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=KOREA",
            # "Latin American Studies": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=LAS",
            # "Latin": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=LATIN",
            # "Law": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=LAW",
            # "Law Noncredit Certificate": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=LAWC",
            # "LEAP Program": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=LEAP",
            # "Linguistics": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=LING",
            # "Art and Photography": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=LLART",
            # "Crafts": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=LLCFT",
            # "Food and Wine": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=LLFW",
            # "Home and Garden": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=LLHG",
            # "Healthy Living": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=LLHL",
            # "Language": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=LLLAN",
            # "Music and Theatre": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=LLMT",
            # "Potpourri": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=LLPOT",
            "Recreation": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=LLREC",
            "Writing/Creative": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=LLWRC",
            "Mathematics": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=MATH",
            "Master Business Administration": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=MBA",
            "Molecular Biology": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=MBIOL",
            "Pharmacy - Medicinal Chemistry": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=MD%20CH",
            "Interdepartmental Medicine": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=MD%20ID",
            "Medical Laboratory Science": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=MD%20LB",
            "Clinical Research Center": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=MDCRC",
            "Mechanical Engineering": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ME%20EN",
            "Metallurgical Engineering": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=MET%20E",
            "Mining Engineering": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=MG%20EN",
            "Management": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=MGT",
            "Master Healthcare Administration": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=MHA",
            "Middle East Language and Area Studies": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=MID%20E",
            "Military Science": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=MIL%20S",
            "Marketing": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=MKTG",
            "Materials Science and Engineering": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=MSE",
            "Master of Science and Technology": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=MST",
            "Music": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=MUSC",
            "Nahuatl": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=NAHTL",
            "Navajo": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=NAVJO",
            "Neurology": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=NEURO",
            "Neuroscience": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=NEUSC",
            "Neurosurgery": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=NSURG",
            "Nuclear Engineering": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=NUCL",
            "Nutrition and Integrative Physiology": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=NUIP",
            "Nursing": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=NURS",
            "Naval Science": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=NV%20SC",
            "Obstetrics": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=OBST",
            "Occupational Therapy": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=OC%20TH",
            "Occupational and Environmental Health": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=OEHS",
            "Oncological Sciences": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ONCSC",
            "Ophthalmology": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=OPHTH",
            "Orthopedics": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ORTHO",
            "Operations and Supply Chain": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=OSC",
            "Osher Lifelong Learning": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=OSHER",
            "Public Administration": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PADMN",
            "Physician Assistant Studies": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PAS",
            "Pathology": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PATH",
            "Public Health": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PBHLT",
            "Pharmacotherapy": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PCTH",
            "Pediatrics": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PED",
            "Persian": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PERS",
            "Phys Med & Rehabilitation": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PH%20MD",
            "Physical Therapy": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PH%20TH",
            "Pharmacology and Toxicology": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PH%20TX",
            "Pharmacy": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PHARM",
            "Molecular Pharmaceutics": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PHCEU",
            "Philosophy": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PHIL",
            "Digital Photography": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PHOTO",
            "Population Health Sciences": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PHS",
            "Physics": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PHYS",
            "Political Science": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=POLS",
            "Printmaking": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PRINT",
            "Professional Education Academies": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PROEA",
            "Professional Education": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PROED",
            "Parks, Recreation and Tourism": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PRT",
            "PRT Outdoor Adventure - Land": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PRTL",
            "PRT Outdoor Adventure - Snow": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PRTS",
            "PRT Outdoor Adventure - Water": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PRTW",
            "Psychology": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PSY",
            "Psychiatry": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PSYCT",
            "Portuguese": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PTGSE",
            "Public Policy": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=PUBPL",
            "Quantitative Analysis of Markets and Organizations": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=QAMO",
            "Quechua": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=QUECH",
            "Radiology": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=RDLGY",
            "Radiation Oncology": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=RDONC",
            "Recreational Therapy": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=RECTH",
            "Real Estate Development": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=REDEV",
            "Religious Studies": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=RELS",
            "Rehabilitation Sciences": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=RHSCI",
            "Robotics": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=ROBOT",
            "Russian": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=RUSS",
            "Samoan": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=SAMOA",
            "Social and Behavioral Science": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=SBS",
            "Science": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=SCI",
            "Sculpture/Intermedia": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=SCLPT",
            "Systems, Industrial, and Management Engineering": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=SIME",
            "Sociology": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=SOC",
            "Special Education": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=SP%20ED",
            "Spanish": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=SPAN",
            "Senior Electives": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=SR%20EL",
            "Statistics": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=STAT",
            "Strategy": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=STRAT",
            "Surgery": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=SURG",
            "Social Work": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=SW",
            "Theatre": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=THEA",
            "Tongan": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=TONGA",
            "Undergraduate Studies": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=UGS",
            "MEd in Health Professions": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=UUHED",
            "Health Sciences Center": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=UUHSC",
            "Vietnamese": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=VIET",
            "World Languages and Cultures": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=WLC",
            "Writing and Rhetoric Studies": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=WRTG",
            "Creative Arts": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=YEART",
            "High School": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=YEHS",
            "Sports and Recreation": "https://class-schedule.app.utah.edu/main/1254/class_list.html?subject=YESPR"
        }

        total_courses_added = 0

        for dept_name, dept_url in department_links.items():
            # Get or create the department
            department, created = Department.objects.get_or_create(
                name=dept_name,
                defaults={"code": dept_name}
            )
            self.stdout.write(f"{'Created' if created else 'Found'} department: {dept_name}")

            try:
                response = requests.get(dept_url, headers=headers, timeout=10)
                response.raise_for_status()
            except requests.exceptions.RequestException as e:
                self.stderr.write(f"Failed to retrieve {dept_name}: {str(e)}")
                continue

            soup = BeautifulSoup(response.text, "html.parser")
            course_blocks = soup.find_all("div", class_="class-info card mt-3")
            
            if not course_blocks:
                self.stdout.write(f"No courses found for {dept_name}")
                continue

            for block in course_blocks:
                h3_tag = block.find("h3")
                if not h3_tag:
                    continue

                # Extract text elements from h3 tag
                valid_elements = []
                for child in h3_tag.contents:
                    if isinstance(child, NavigableString):
                        stripped = child.strip()
                        if stripped and stripped != "-":
                            valid_elements.append(stripped)
                    elif child.name in ["a", "span"]:
                        text = child.get_text(strip=True)
                        if text and text != "-":
                            valid_elements.append(text)

                if len(valid_elements) < 3:
                    continue  # Skip incomplete entries

                # Improved course code parsing with regex
                code_str = valid_elements[0]
                match = re.match(r"^(.+?)\s*(\d+[A-Za-z]*)\s*$", code_str)
                if not match:
                    self.stdout.write(f"Skipping invalid code format: {code_str}")
                    continue

                subject_code = match.group(1).strip()
                raw_course_number = match.group(2).strip()

                # Clean course number (preserve letters in subject, use digits only for number field)
                clean_number = "".join(filter(str.isdigit, raw_course_number))
                if not clean_number:
                    self.stdout.write(f"Skipping invalid course number: {raw_course_number}")
                    continue
                course_number = int(clean_number)

                # Extract course title
                course_title = valid_elements[2].strip()

                # Get credits from details page
                credits = 3  # Default value
                details_link = block.find("a", class_="btn btn-secondary btn-sm")
                if details_link and details_link.has_attr("href"):
                    try:
                        details_url = requests.compat.urljoin(dept_url, details_link["href"])
                        details_resp = requests.get(details_url, headers=headers, timeout=5)
                        if details_resp.status_code == 200:
                            details_soup = BeautifulSoup(details_resp.text, "html.parser")
                            credit_span = details_soup.find("span", class_="credit-hours")
                            if credit_span:
                                credits_text = credit_span.get_text(strip=True).split()[0]
                                credits = float(credits_text) if credits_text.replace('.', '', 1).isdigit() else 3
                    except Exception as e:
                        self.stdout.write(f"Error fetching credits: {str(e)}")

                # Check for existing course
                if Course.objects.filter(department=department, number=course_number).exists():
                    self.stdout.write(f"Skipping duplicate: {subject_code} {raw_course_number}")
                    continue

                # Create course with properly formatted subject
                Course.objects.create(
                    department=department,
                    number=course_number,
                    title=course_title,
                    credits=credits,
                    subject=f"{subject_code} {raw_course_number}"  # Preserves original format
                )
                total_courses_added += 1
                self.stdout.write(f"Added: {subject_code} {raw_course_number} - {course_title}")

        self.stdout.write(self.style.SUCCESS(f"Total courses added: {total_courses_added}"))