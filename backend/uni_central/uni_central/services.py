from .models import Department, User, Review, Course, Professor
from django.db.models import Avg
from .serializers import (
    DepartmentSerializer,
    UserSerializer,
    CourseSerializer,
    ProfessorSerializer,
    ReviewSerializer,
)
from django.shortcuts import get_object_or_404

class FirebaseService:
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
        
class DepartmentService:
    @staticmethod
    def get_all_departments():
        return Department.objects.all()
    
    @staticmethod
    def get_department(department_id):
        return get_object_or_404(Department, id=department_id)
    
class CourseService:
    @staticmethod
    def get_courses_by_department(department_id):
        department = DepartmentService.get_department(department_id)
        return Course.objects.filter(department=department)
    
    @staticmethod
    def get_course(course_id):
        return get_object_or_404(Course, id=course_id)
    
class ReviewService:
    @staticmethod
    def get_reviews_by_course(course_id):
        """
        Fetch all reviews for a given course ID.
        """
        course = CourseService.get_course(course_id)  
        reviews = Review.objects.filter(course=course)
        return reviews
    
    def create_review(request, course_id):
        """
        Creates a review for a course, and updates the course's avg_rating and avg_difficulty.
        """
        course = get_object_or_404(Course, id=course_id)
        # Fetch professors related to the course
        professors = course.professors.all()

        if request.method == 'POST':
            user = request.user if request.user.is_authenticated else get_object_or_404(User, id=1)
            professor_id = request.POST.get('professor')
            professor = get_object_or_404(Professor, id=professor_id) if professor_id else None

            review_text = request.POST.get('review')
            rating = request.POST.get('rating')
            difficulty = request.POST.get('difficulty')
            estimated_hours = request.POST.get('estimated_hours')
            grade = request.POST.get('grade')

            # Boolean fields
            would_take_again = request.POST.get('would_take_again') == 'on'
            for_credit = request.POST.get('for_credit') == 'on'
            mandatory_attendance = request.POST.get('mandatory_attendance') == 'on'
            required_course = request.POST.get('required_course') == 'on'
            is_gened = request.POST.get('is_gened') == 'on'
            in_person = request.POST.get('in_person') == 'on'
            online = request.POST.get('online') == 'on'
            hybrid = request.POST.get('hybrid') == 'on'
            no_exams = request.POST.get('no_exams') == 'on'
            presentations = request.POST.get('presentations') == 'on'

            # Save the review
            Review.objects.create(
                user=user,
                course=course,
                professor=professor,
                review=review_text,
                rating=float(rating) if rating else None,
                difficulty=int(difficulty) if difficulty else None,
                estimated_hours=float(estimated_hours) if estimated_hours else None,
                grade=grade,
                would_take_again=would_take_again,
                for_credit=for_credit,
                mandatory_attendance=mandatory_attendance,
                required_course=required_course,
                is_gened=is_gened,
                in_person=in_person,
                online=online,
                hybrid=hybrid,
                no_exams=no_exams,
                presentations=presentations,
            )

            # Update course averages
            course.update_averages()
        

class UserService:
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