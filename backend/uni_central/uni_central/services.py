from .models import User, Review, Course, Professor
from django.db.models import Avg

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

class UserService:
    @staticmethod
    def create_user(email_address, fname, lname):
        """
        Creates a new user in the SQLite database.
        """
        try:
            print(f"Attempting to create user with email: {email_address}, fname: {fname}, lname: {lname}")
            
            # Attempt to create a new user
            user = User.objects.create(
                email_address=email_address,
                fname=fname,
                lname=lname
            )
            print(f"Successfully created user: {user}")
            return user
            
        except Exception as e:
            # Print the full error details
            print(f"Error creating user in UserService: {str(e)}")
            print(f"Error type: {type(e)}")
            import traceback
            print(f"Full traceback: {traceback.format_exc()}")
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

class ReviewService:
    @staticmethod
    def create_review(user, course, rating, difficulty, professor, review, **kwargs):
        """
        Create a review for a course, update the course's averages,
        and include optional fields such as estimated_hours, etc.
        """
        try:
            # Ensure the course exists
            if not Course.objects.filter(id=course.id).exists():
                return {"error": "Course does not exist."}

            # Ensure the professor exists if provided
            if professor and not Professor.objects.filter(id=professor.id).exists():
                return {"error": "Professor does not exist."}

            # Create the review
            review_instance = Review.objects.create(
                user=user,
                course=course,
                rating=rating,
                difficulty=difficulty,
                professor=professor,
                review=review,
                **kwargs
            )

            # Recalculate the course's average rating and difficulty
            course_reviews = course.reviews.all()
            avg_rating = course_reviews.aggregate(Avg('rating'))['rating__avg'] or 0
            avg_difficulty = course_reviews.aggregate(Avg('difficulty'))['difficulty__avg'] or 0

            course.avg_rating = avg_rating
            course.avg_difficulty = avg_difficulty
            course.save()

            return review_instance

        except Exception as e:
            print(f"Error creating review: {e}")
            return None

    @staticmethod
    def delete_review(review_id):
        """
        Delete a review by ID, and update the course's average ratings and difficulty.
        """
        try:
            # Ensure the review exists
            review_instance = Review.objects.filter(id=review_id).first()
            if not review_instance:
                return {"error": "Review does not exist."}

            # Get the related course
            course = review_instance.course

            # Delete the review
            review_instance.delete()

            # Recalculate the course's average rating and difficulty
            course_reviews = course.reviews.all()
            avg_rating = course_reviews.aggregate(Avg('rating'))['rating__avg'] or 0
            avg_difficulty = course_reviews.aggregate(Avg('difficulty'))['difficulty__avg'] or 0

            course.avg_rating = avg_rating
            course.avg_difficulty = avg_difficulty
            course.save()

            return {"message": "Review deleted successfully."}

        except Exception as e:
            print(f"Error deleting review: {e}")
            return {"error": "An error occurred while deleting the review."}
