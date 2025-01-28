from .models import (
    Department, 
    User, 
    Review, 
    Course, 
    Professor
    # Classmate
    )
from django.shortcuts import get_object_or_404

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
    def get_reviews_by_course(course_id):
        """
        Fetch all reviews for a given course ID.
        """
        course = CourseService.get_course(course_id)
        reviews = Review.objects.filter(course=course)
        return reviews
    
    @staticmethod
    def create_review(course_id, user, review_data):
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

        # 4. Update course averages (assuming your Course model has a method update_averages())
        course.update_averages()

        return review
    @staticmethod
    def get_my_reviews(user_id):
        user = UserService.get_user(user_id)
        reviews = Review.objects.filter(user=user)
        return reviews

##############################
# Professor-Related Services #
##############################
class ProfessorService:
    """
    Provides utility methods for retrieving Professor data.
    """

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