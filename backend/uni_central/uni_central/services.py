from .models import (
    Department, 
    User, 
    Review, 
    Course, 
    Professor,
    Thread,
    Comment,
    )
from django.shortcuts import get_object_or_404
from django.db.models import Q
import pytesseract
from pdf2image import convert_from_path
import csv
import io
from PIL import Image, ImageEnhance, ImageFilter
import re
from fuzzywuzzy import fuzz
from django.core.files.uploadedfile import InMemoryUploadedFile
import numpy as np
import cv2

###############################
# Department-Related Services #
###############################
class DepartmentService:
    """
    A service class to handle operations related to the Department model.
    """

    @staticmethod
    def get_all_departments():
        return Department.objects.all()

    @staticmethod
    def get_department(department_id):
        return get_object_or_404(Department, id=department_id)

###########################
# Course-Related Services #
###########################
class CourseService:
    """
    Provides utility methods for retrieving Course data.
    """
    
    @staticmethod
    def get_courses_by_department(department_id):
        department = DepartmentService.get_department(department_id)
        return Course.objects.filter(department=department)
    
    @staticmethod
    def get_courses_by_professor(professor_id):
        return Course.objects.filter(professors__id=professor_id)

    @staticmethod
    def get_course(course_id):
        return get_object_or_404(Course, id=course_id)
    
###########################
# Review-Related Services #
###########################
class ReviewService:
    """
    Provides utility methods for retrieving Review data.
    """
    
    @staticmethod
    def get_review_by_id(review_id):
        """
        Fetch a review by its ID.
        """
        try:
            return Review.objects.get(id=review_id)
        except Review.DoesNotExist:
            return None

    @staticmethod
    def get_reviews_by_course(course_id):
        """
        Fetch all reviews for a given course ID.
        """
        course = CourseService.get_course(course_id)
        reviews = Review.objects.filter(course=course)
        return reviews
        
    @staticmethod
    def get_reviews_by_professor(professor_id):
        """
        Fetch all reviews for a given professor ID.
        """
        professor = ProfessorService.get_professor(professor_id)  # Use ProfessorService to fetch the professor
        reviews = Review.objects.filter(professor=professor)
        return reviews
    
    @staticmethod
    def create_review_for_course(course_id, user, review_data):
        """
        Creates a review for a course and updates the course's avg_rating and avg_difficulty.
        Args:
            course_id (int): The ID of the course.
            user (User): The user creating the review.
            review_data (dict): A dictionary containing the review details.
        Returns:
            Review: The created review object.
        """
        # 1. Fetch the course
        course = CourseService.get_course(course_id)

        # 2. Fetch the professor if provided
        professor_id = review_data.get('professor')
        professor = get_object_or_404(Professor, id=professor_id) if professor_id else None

        # 3. Create the Review, carefully converting fields
        review = Review.objects.create(
            user=user,
            course=course,
            professor=professor,
            
            # Text / string fields
            review=review_data.get('review'),
            grade=review_data.get('grade'),

            # Numeric fields (convert strings to float/int, or None if empty)
            rating=float(review_data.get('rating')) if review_data.get('rating') else None,
            difficulty=int(review_data.get('difficulty')) if review_data.get('difficulty') else None,
            estimated_hours=float(review_data.get('estimated_hours')) if review_data.get('estimated_hours') else None,

            # Boolean fields (check if the string is 'true')
            would_take_again=(review_data.get('would_take_again') == 'true'),
            for_credit=(review_data.get('for_credit') == 'true'),
            mandatory_attendance=(review_data.get('mandatory_attendance') == 'true'),
            required_course=(review_data.get('required_course') == 'true'),
            is_gened=(review_data.get('is_gened') == 'true'),
            in_person=(review_data.get('in_person') == 'true'),
            online=(review_data.get('online') == 'true'),
            hybrid=(review_data.get('hybrid') == 'true'),
            no_exams=(review_data.get('no_exams') == 'true'),
            presentations=(review_data.get('presentations') == 'true'),
        )

        course.update_averages()
        if professor:
            professor.update_averages()

        return review
    
    @staticmethod
    def create_review_for_professor(professor_id, user, review_data):
        """
        Creates a review for a professor and associates it with the selected course.
        """
        professor = ProfessorService.get_professor(professor_id)

        # Fetch the course if provided
        course_id = review_data.get("course")
        course = get_object_or_404(Course, id=course_id) if course_id else None

        # Create the Review object
        review = Review.objects.create(
            user=user,
            professor=professor,
            course=course,  # Associate the selected course

            # Text / string fields
            review=review_data.get("review"),
            grade=review_data.get("grade"),

            # Numeric fields
            rating=float(review_data.get("rating")) if review_data.get("rating") else None,
            difficulty=int(review_data.get("difficulty")) if review_data.get("difficulty") else None,
            estimated_hours=float(review_data.get("estimated_hours")) if review_data.get("estimated_hours") else None,

            # Boolean fields
            would_take_again=review_data.get("would_take_again") == "true",
            for_credit=review_data.get("for_credit") == "true",
            mandatory_attendance=review_data.get("mandatory_attendance") == "true",
            in_person=review_data.get("in_person") == "true",
            online=review_data.get("online") == "true",
            hybrid=review_data.get("hybrid") == "true",
            no_exams=review_data.get("no_exams") == "true",
            presentations=review_data.get("presentations") == "true",
        )

        professor.update_averages()
        if course:
            course.update_averages()

        return review

    @staticmethod
    def update_review(review_id, review_data):
        """
        Updates an existing review.

        Args:
            review_id (int): The ID of the review to update.
            review_data (dict): A dictionary containing the updated review details.

        Returns:
            Review: The updated review object.
        """
        review = ReviewService.get_review_by_id(review_id)
        if review == None:
            return None

        # Update fields only if provided in review_data
        if "review" in review_data:
            review.review = review_data["review"]
        if "rating" in review_data:
            review.rating = float(review_data["rating"])
        if "difficulty" in review_data:
            review.difficulty = int(review_data["difficulty"])
        if "estimated_hours" in review_data:
            review.estimated_hours = float(review_data["estimated_hours"])
        if "would_take_again" in review_data:
            review.would_take_again = review_data["would_take_again"] == "true"
        if "for_credit" in review_data:
            review.for_credit = review_data["for_credit"] == "true"
        if "mandatory_attendance" in review_data:
            review.mandatory_attendance = review_data["mandatory_attendance"] == "true"

        # Save the updated review
        review.save()

        # Update course and professor averages if applicable
        if review.course:
            review.course.update_averages()
        if review.professor:
            review.professor.update_averages()

        return review
    
    @staticmethod
    def delete_review(review):
        if not review:
            return {"success": False, "error": "Review not found"}
        
        course = review.course
        professor = review.professor
        
        review.delete()
        
        if course:
            course.update_averages()
        if professor:
            professor.update_averages()
            
        return {"success": True, "message": "Review deleted successfully"}

##############################
# Professor-Related Services #
##############################
class ProfessorService:
    """
    Provides utility methods for retrieving Professor data.
    """
    @staticmethod
    def get_professor(professor_id):
        """
        Fetch a professor by their ID.
        """
        return get_object_or_404(Professor, id=professor_id)
    
    @staticmethod
    def get_professors_by_course(course_id):
        """
        Fetch all professors associated with a specific course.
        """
        course = CourseService.get_course(course_id)
        return course.professors.all()
    
    @staticmethod
    def get_professors_by_department(department_id):
        """
        Fetch all professors associated with a specific course.
        """
        department = DepartmentService.get_department(department_id)
        return department.professors.all()
    
#########################
# User-Related Services #
#########################
class UserService:
    """
    Provides utility methods for managing User data.
    """
    
    @staticmethod
    def get_user(email_address):
        return get_object_or_404(User, email_address=email_address)
    
    @staticmethod
    def get_courses(user):
        courses = user.courses.all()
        return courses
    
    @staticmethod
    def get_professors(user):
        return user.professors.all()
    
    @staticmethod
    def get_reviews(user):
        reviews = Review.objects.filter(user=user)
        return reviews
    
    @staticmethod
    def get_classmates(user):
        courses = user.courses.all()
        classmates = User.objects.filter(courses__in=courses).exclude(id=user.id).distinct()
        return classmates
    
    @staticmethod
    def add_course(user, course):
        user.courses.add(course)
        user.save()
        
    @staticmethod
    def remove_course(user, course):
        if course in user.courses.all():
            user.courses.remove(course)
            return True
        return False
    
    @staticmethod
    def add_professor(user, professor):
        user.professors.add(professor)
        user.save()
        
    @staticmethod
    def remove_professor(user, professor):
        if professor in user.professors.all():
            user.professors.remove(professor)
            return True
        return False
    
    @staticmethod
    def change_account_info(user, university, year, major):
        if not user:
            raise ValueError("User profile does not exist")

        user.university = university
        user.major = major
        user.year = year
        user.save()
        return user
    
    @staticmethod
    def update_course_plan(user, course_plan):
        """
        Updates the user's course plan.
        """
        if not user:
            raise ValueError("User not found")

        user.course_plan = course_plan
        user.save()
        return user
    
    @staticmethod
    def create_user(email_address, fname, lname):
        """
        Creates a new user in the SQLite database.
        Args:
            email_address (str): User's email address.
            fname (str): User's first name.
            lname (str): User's last name.
        Returns:
            User: The created user object.
        """
        try:
            # Attempt to create a new user
            user = User.objects.create(
                email_address=email_address,
                fname=fname,
                lname=lname
            )
            return user
        except Exception as e:
            print(f"Error creating user: {e}")
            return None

    @staticmethod
    def delete_user(user_id):
        """
        Deletes a user from the SQLite database by user_id.
        Args:
            user_id (int): The ID of the user to delete.
        Returns:
            bool: True if user was deleted, False if user not found.
        """
        try:
            user = User.objects.get(id=user_id)
            user.delete()
            return True
        except User.DoesNotExist:
            # If user is not found, return False
            return False

    
class FirebaseService:
    """
    Provides utility methods for syncing Firebase user data with the SQL database.
    """
    
    @staticmethod
    def create_or_update_user(firebase_user):
        """
        Sync Firebase user data with SQL database
        """
        user, created = User.objects.get_or_create(
            firebase_uid=firebase_user.uid,
            defaults={
                'email': firebase_user.email,
                'name': firebase_user.display_name or ''
            }
        )
        if not created:
            user.email = firebase_user.email
            user.name = firebase_user.display_name or ''
            user.save()
        return user

    @staticmethod
    def delete_user(firebase_uid):
        """
        Delete user from SQL database when deleted from Firebase
        """
        User.objects.filter(firebase_uid=firebase_uid).delete()
        
#####################################
# Course-Filtering-Related Services #
#####################################

class CourseFilteringService:
    """
    Provides methods to filter courses dynamically based on query parameters.
    """
    def filter_courses(filters):
        queryset = Course.objects.all()

        department_code = filters.get('department', None)
        min_number = filters.get('min_number', None)
        max_number = filters.get('max_number', None)
        title_contains = filters.get('title', None)
        min_difficulty = filters.get('min_difficulty', None)
        max_difficulty = filters.get('max_difficulty', None)
        min_rating = filters.get('min_rating', None)
        max_rating = filters.get('max_rating', None)
        credits = filters.get('credits', None)
        semester = filters.get('semester', None)
        professor_name = filters.get('professor', None)

        if department_code:
            queryset = queryset.filter(department__code__icontains=department_code)
        if min_number:
            queryset = queryset.filter(number__gte=min_number)
        if max_number:
            queryset = queryset.filter(number__lte=max_number)
        if title_contains:
            queryset = queryset.filter(title__icontains=title_contains)
        if min_difficulty:
            queryset = queryset.filter(avg_difficulty__gte=min_difficulty)
        if max_difficulty:
            queryset = queryset.filter(avg_difficulty__lte=max_difficulty)
        if min_rating:
            queryset = queryset.filter(avg_rating__gte=min_rating)
        if max_rating:
            queryset = queryset.filter(avg_rating__lte=max_rating)
        if credits:
            queryset = queryset.filter(credits=credits)
        if semester:
            queryset = queryset.filter(semester__icontains=semester)
        if professor_name:
            queryset = queryset.filter(
                Q(professors__fname__icontains=professor_name) |
                Q(professors__lname__icontains=professor_name)
            )

        return queryset
    
###########################
# Thread-Related Services #
###########################

class ThreadService:
    """
    Provides methods for managing Threads.
    """
    
    @staticmethod
    def get_threads_by_course(course_id):
        """
        Fetch all threads related to a specific course.
        """
        course = CourseService.get_course(course_id)
        if not course:
            return None

        return Thread.objects.filter(course=course)
    
    @staticmethod
    def get_threads_by_professor(professor_id):
        """
        Fetch all threads related to a specific professor.
        """
        professor = ProfessorService.get_professor(professor_id)
        if not professor:
            return None

        return Thread.objects.filter(professor=professor)

    @staticmethod
    def create_thread(user, thread_data):
        """
        Creates a new thread linked to either a course or a professor.
        """
        course_id = thread_data.get("course_id")
        professor_id = thread_data.get("professor_id")

        if bool(course_id) == bool(professor_id):
            return {"success": False, "error": "A thread must be linked to either a course or a professor, not both."}

        course = CourseService.get_course(course_id) if course_id else None
        professor = ProfessorService.get_professor(professor_id) if professor_id else None

        if course_id and not course:
            return {"success": False, "error": "Course not found"}
        if professor_id and not professor:
            return {"success": False, "error": "Professor not found"}

        try:
            thread = Thread.objects.create(
                title=thread_data.get("title"),
                user=user,
                course=course,
                professor=professor
            )
            return {"success": True, "thread": thread}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def update_thread(thread_id, thread_data):
        """
        Updates an existing thread's title.
        """
        
        thread = ThreadService.get_thread_by_id(thread_id)
        if not thread:
            return {"success": False, "error": "Thread not found"}

        if "title" in thread_data:
            thread.title = thread_data["title"]

        thread.save()
        return {"success": True, "thread": thread}

    @staticmethod
    def get_thread_by_id(thread_id):
        """
        Fetch a thread by its ID.
        """
        try:
            return Thread.objects.get(id=thread_id)
        except Thread.DoesNotExist:
            return None
        
    @staticmethod
    def delete_thread(thread_id):
        """
        Deletes a thread by ID.
        """
        thread = ThreadService.get_thread_by_id(thread_id)
        if not thread:
            return {"success": False, "error": "Thread not found"}

        thread.delete()
        return {"success": True, "message": "Thread deleted successfully"}

############################
# Comment-Related Services #
############################

class CommentService:
    """
    Provides methods for managing Comments.
    """
    
    @staticmethod
    def get_comments_by_thread(thread_id):
        """
        Fetch all comments related to a specific thread.
        """
        thread = ThreadService.get_thread_by_id(thread_id)
        if not thread:
            return None

        return Comment.objects.filter(thread=thread)
   
    @staticmethod
    def create_comment(comment_data):
        """
        Creates a new comment under a thread.
        
        Args:
            comment_data (dict): Dictionary containing comment details
        """
        thread_id = comment_data.get("thread_id")
        thread = ThreadService.get_thread_by_id(thread_id)
        if not thread:
            return {"success": False, "error": "Thread not found"}

        # Extract email from comment data
        email_address = comment_data.get("email_address")
        
        # Try to find existing user by email
        try:
            user = User.objects.get(email_address=email_address)
        except User.DoesNotExist:
            user = User.objects.create(
                email_address=email_address,
                fname=email_address.split('@')[0],  # Use part of email as name if no name provided
            )

        try:
            comment = Comment.objects.create(
                thread=thread,
                user=user,
                content=comment_data.get("content")
            )
            return {"success": True, "comment": comment}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def update_comment(comment_id, comment_data):
        """
        Updates an existing comment.
        """
        
        comment = CommentService.get_comment_by_id(comment_id)
        if not comment:
            return {"success": False, "error": "Comment not found"}

        if "content" in comment_data:
            comment.content = comment_data["content"]

        comment.save()
        return {"success": True, "comment": comment}

    @staticmethod
    def get_comment_by_id(comment_id):
        """
        Fetch a comment by its ID.
        """
        try:
            return Comment.objects.get(id=comment_id)
        except Comment.DoesNotExist:
            return None
    
    @staticmethod
    def delete_comment(comment_id):
        """
        Deletes a comment by ID.
        """
        
        comment = CommentService.get_comment_by_id(comment_id)
        if not comment:
            return {"success": False, "error": "Comment not found"}

        comment.delete()
        return {"success": True, "message": "Comment deleted successfully"}

############################
# Transcript-Related Services #
############################

class TranscriptService:
    """
    Service class for handling transcript processing and course extraction.
    """
    
    @staticmethod
    def process_transcript(file_obj, file_type):
        """
        Process uploaded transcript file and extract course information.
        """
        if file_type.startswith('image/'):
            return TranscriptService._process_image(file_obj)
        else:
            raise ValueError('Currently only supporting image files')

    @staticmethod
    def preprocess_image(image):
        """
        Preprocess image to improve OCR quality.
        """
        try:
            # Convert PIL Image to cv2 format
            img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Apply thresholding to get black and white image
            _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Remove noise
            denoised = cv2.fastNlMeansDenoising(binary)
            
            # Increase contrast
            enhanced = cv2.convertScaleAbs(denoised, alpha=1.2, beta=0)
            
            # Convert back to PIL Image
            enhanced_pil = Image.fromarray(enhanced)
            
            # Increase resolution (can help with OCR)
            width, height = enhanced_pil.size
            enhanced_pil = enhanced_pil.resize((width*2, height*2), Image.Resampling.LANCZOS)
            
            # Sharpen the image
            sharpener = ImageEnhance.Sharpness(enhanced_pil)
            enhanced_pil = sharpener.enhance(2.0)
            
            # Increase contrast one more time
            contraster = ImageEnhance.Contrast(enhanced_pil)
            enhanced_pil = contraster.enhance(2.0)
            
            return enhanced_pil
        except Exception as e:
            print(f"Warning: Image preprocessing failed: {str(e)}")
            return image

    @staticmethod
    def _process_image(file_obj):
        """
        Process image transcript and extract course information.
        """
        print("Processing image file...")
        try:
            # Open and preprocess the image
            image = Image.open(file_obj)
            print(f"Image opened successfully: size={image.size}, mode={image.mode}")
            
            # Preprocess the image
            enhanced_image = TranscriptService.preprocess_image(image)
            print("Image preprocessing completed")
            
            # Configure Tesseract for better accuracy
            custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,-() \'"'
            
            # Convert image to text using Tesseract OCR
            text = pytesseract.image_to_string(enhanced_image, config=custom_config)
            print(f"OCR Text extracted: {len(text)} characters")
            print(f"Extracted text:\n{text}")
            
            # First, split text into lines for better context analysis
            lines = text.split('\n')
            courses = []
            
            # Keywords that indicate a line is not a course
            non_course_keywords = {
                'term gpa', 'dean\'s list', 'semester', 'fall', 'spring', 'summer', 
                'winter', 'quarter', 'year', 'total', 'grade', 'units',
                'intensive', 'exploration', 'requirement', 'continued'
            }
            
            # Common OCR misreadings and their corrections
            dept_corrections = {
                'WRIG': 'WRTG',
                'CS)': 'CS',
                '€S': 'CS',
                'cS': 'CS',
                'cs': 'CS',
                'ETHNC': 'ETHNC',
                'ECON9': 'ECON'
            }
            
            # Pattern to match course lines, more permissive to handle OCR artifacts
            course_pattern = r'^([A-Za-z€)]\S{1,4})\s*[~\'"_\s]*\s*(\d{3,4}[A-Za-z]?)[\\.\s]*\s+([^0-9\n](?:[^\n]*[^0-9\n])?)'
            
            processed_codes = set()  # Keep track of processed courses to avoid duplicates
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                    
                # Skip lines that are clearly not courses
                lower_line = line.lower()
                if any(keyword in lower_line for keyword in non_course_keywords):
                    continue
                
                # Look for course pattern
                match = re.match(course_pattern, line)
                if not match:
                    continue
                    
                dept = match.group(1).strip().upper()  # Convert to uppercase for consistency
                num = match.group(2).strip()
                name = match.group(3).strip()
                
                # Clean up department code
                dept = dept_corrections.get(dept, dept)
                
                # Clean up the course number (remove any non-numeric prefix)
                num = re.sub(r'^[^0-9]+', '', num)
                # Handle special case for ECON 91740 -> 1740
                if len(num) > 4:
                    num = num[-4:]
                
                # Additional validation: must have both department code and course number
                if not dept or not num:
                    continue
                    
                # Clean up the course name
                name = re.sub(r'\s+[A-F][+-]?\s*$', '', name)  # Remove grade
                name = re.sub(r'\s+\d+\.\d+\s*$', '', name)    # Remove credits
                name = re.sub(r'\s+\([^)]*\)', '', name)       # Remove parenthetical notes
                name = re.sub(r'[\\©*=]+', '', name)           # Remove special characters
                name = re.sub(r'\s+', ' ', name)               # Normalize spaces
                
                # Additional validation: course name should be reasonable length
                if len(name) < 3 or len(name) > 100:
                    continue
                
                code = f"{dept} {num}"
                
                # Skip if we've already processed this course
                if code in processed_codes:
                    continue
                    
                print(f"Attempting to match course: {code} - {name}")
                
                # Try to find the course in the database
                try:
                    # Extract just the numeric part for the database query
                    num_only = re.match(r'\d+', num).group(0)
                    
                    # Try exact match first
                    db_course = Course.objects.filter(
                        subject__iexact=dept,
                        number=int(num_only)
                    ).first()
                    
                    if db_course:
                        print(f"Found matching course in database: {db_course}")
                        courses.append({
                            'code': f"{db_course.subject} {db_course.number}",  # Use database values
                            'name': db_course.title,
                            'credits': db_course.credits,
                            'confidence': 1.0,
                            'db_match': True,
                            'course_id': db_course.id
                        })
                        processed_codes.add(code)
                    else:
                        print(f"No database match found for: {code}")
                except Exception as e:
                    print(f"Error matching course {code} in database: {str(e)}")
                    continue
            
            print(f"Total database-matched courses found: {len(courses)}")
            return courses
            
        except Exception as e:
            print(f"Error processing image: {str(e)}")
            raise
