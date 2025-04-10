from .models import (
    Department, 
    User, 
    Review, 
    Course, 
    Professor,
    Thread,
    Comment,
    CommentUpvote,
    StudyBuddyRequest,
    StudyBuddyMessage,
    )
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, F, ExpressionWrapper, IntegerField
import pytesseract
from pdf2image import convert_from_path
import csv
import io
from PIL import Image
import re
from fuzzywuzzy import fuzz
from django.core.files.uploadedfile import InMemoryUploadedFile
import logging
from datetime import datetime
import time
import string
import requests
import json
from django.conf import settings

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
    def get_reviews_by_course_sorted(course_id):
        """
        Fetch all reviews for a given course ID, sorted by net upvotes (likes - dislikes)
        with a fallback to creation date for reviews with equal upvotes.
        """        
        course = CourseService.get_course(course_id)
        reviews = Review.objects.filter(course=course)
        
        reviews = reviews.annotate(
            likes=Count('votes', filter=Q(votes__vote_type='like')),
            dislikes=Count('votes', filter=Q(votes__vote_type='dislike')),
        )
        reviews = reviews.annotate(
            score=ExpressionWrapper(F('likes') - F('dislikes'), output_field=IntegerField())
        )
        
        return reviews.order_by('-score', '-id')
    
    @staticmethod
    def get_reviews_by_professor_sorted(professor_id):
        """
        Fetch all reviews for a given professor ID, sorted by net upvotes.
        """
        professor = ProfessorService.get_professor(professor_id)
        reviews = Review.objects.filter(professor=professor)
        
        reviews = reviews.annotate(
            likes=Count('votes', filter=Q(votes__vote_type='like')),
            dislikes=Count('votes', filter=Q(votes__vote_type='dislike')),
        )
    
        reviews = reviews.annotate(
            score=ExpressionWrapper(F('likes') - F('dislikes'), output_field=IntegerField())
        )
        
        return reviews.order_by('-score', '-id')
    
    @staticmethod
    def create_review_for_course(course_id, user, review_data):
        """
        Creates a review for a course and updates the course's avg_rating and avg_difficulty.
        Args:
            course_id (int): The ID of the course.
            user (User): The user creating the review.
            review_data (dict): A dictionary containing the review details.
        Returns:
            dict: A dictionary with success/error information and the review object if successful.
        """
        # Check review text for inappropriate content if present
        review_text = review_data.get('review')
        if review_text:
            is_appropriate, message = ContentModerationService.moderate_text(review_text)
            if not is_appropriate:
                return {
                    "success": False,
                    "error": message
                }
        
        course = CourseService.get_course(course_id)
        professor_id = review_data.get('professor')
        professor = get_object_or_404(Professor, id=professor_id) if professor_id else None
        is_anonymous = review_data.get('is_anonymous')
            
        if isinstance(is_anonymous, str):
            is_anonymous = is_anonymous.lower() == 'true'
        else:
            is_anonymous = bool(is_anonymous)
            
        try:
            review = Review.objects.create(
                user=user,
                course=course,
                professor=professor,

                # Text / string fields
                review=review_text,
                grade=review_data.get('grade'),

                # Numeric fields
                rating=float(review_data.get('rating')) if review_data.get('rating') else None,
                difficulty=int(review_data.get('difficulty')) if review_data.get('difficulty') else None,
                estimated_hours=float(review_data.get('estimated_hours')) if review_data.get('estimated_hours') else None,

                # Boolean fields
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
                is_anonymous=is_anonymous,
            )

            course.update_averages()
            if professor:
                professor.update_averages()

            return {
                "success": True,
                "review": review
            }
        except Exception as e:
            logging.error(f"Error creating review: {str(e)}")
            return {
                "success": False,
                "error": "Failed to create review. Please try again."
            }
    
    @staticmethod
    def create_review_for_professor(professor_id, user, review_data):
        """
        Creates a review for a professor and associates it with the selected course.
        
        Returns:
            dict: A dictionary with success/error information and the review object if successful.
        """
        # Check review text for inappropriate content if present
        review_text = review_data.get('review')
        if review_text:
            is_appropriate, message = ContentModerationService.moderate_text(review_text)
            if not is_appropriate:
                return {
                    "success": False,
                    "error": message
                }
        
        professor = ProfessorService.get_professor(professor_id)

        course_id = review_data.get("course")
        course = get_object_or_404(Course, id=course_id) if course_id else None
        is_anonymous = review_data.get('is_anonymous')
            
        if isinstance(is_anonymous, str):
            is_anonymous = is_anonymous.lower() == 'true'
        else:
            is_anonymous = bool(is_anonymous)

        try:
            review = Review.objects.create(
                user=user,
                professor=professor,
                course=course,  

                # Text / string fields
                review=review_text,
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
                is_anonymous=is_anonymous,        
                )

            professor.update_averages()
            if course:
                course.update_averages()

            return {
                "success": True,
                "review": review
            }
        except Exception as e:
            logging.error(f"Error creating review: {str(e)}")
            return {
                "success": False,
                "error": "Failed to create review. Please try again."
            }

    @staticmethod
    def update_review(review_id, review_data):
        """
        Updates an existing review.

        Args:
            review_id (int): The ID of the review to update.
            review_data (dict): A dictionary containing the updated review details.

        Returns:
            dict: A dictionary with success/error information and the review object if successful.
        """
        import logging
        logging.warning(f"Updating review {review_id} with data: {review_data}")
        
        review = ReviewService.get_review_by_id(review_id)
        if review == None:
            return {
                "success": False,
                "error": "Review not found"
            }
        
        # Verify that email_address matches the review's user
        email_address = review_data.get('email_address')
        if email_address and email_address != review.user.email_address:
            return {
                "success": False,
                "error": "You don't have permission to edit this review"
            }

        # Check review text for inappropriate content if present
        if "review" in review_data:
            review_text = review_data.get("review")
            if review_text:
                logging.warning(f"Checking review text for profanity: {review_text}")
                is_appropriate, message = ContentModerationService.moderate_text(review_text)
                if not is_appropriate:
                    logging.warning(f"Content moderation failed: {message}")
                    return {
                        "success": False,
                        "error": message
                    }
                review.review = review_text

        try:
            # Update numeric fields
            if "rating" in review_data:
                review.rating = float(review_data["rating"])
            if "difficulty" in review_data:
                review.difficulty = int(review_data["difficulty"])
            if "estimated_hours" in review_data:
                review.estimated_hours = float(review_data["estimated_hours"]) if review_data["estimated_hours"] else None
                
            # Update string fields
            if "grade" in review_data:
                review.grade = review_data["grade"]
                
            # Update boolean fields
            if "would_take_again" in review_data:
                review.would_take_again = review_data["would_take_again"] == True or review_data["would_take_again"] == "true"
            if "for_credit" in review_data:
                review.for_credit = review_data["for_credit"] == True or review_data["for_credit"] == "true"
            if "mandatory_attendance" in review_data:
                review.mandatory_attendance = review_data["mandatory_attendance"] == True or review_data["mandatory_attendance"] == "true"
            if "required_course" in review_data:
                review.required_course = review_data["required_course"] == True or review_data["required_course"] == "true"
            if "is_gened" in review_data:
                review.is_gened = review_data["is_gened"] == True or review_data["is_gened"] == "true"
            if "in_person" in review_data:
                review.in_person = review_data["in_person"] == True or review_data["in_person"] == "true"
            if "online" in review_data:
                review.online = review_data["online"] == True or review_data["online"] == "true"
            if "hybrid" in review_data:
                review.hybrid = review_data["hybrid"] == True or review_data["hybrid"] == "true"
            if "no_exams" in review_data:
                review.no_exams = review_data["no_exams"] == True or review_data["no_exams"] == "true"
            if "presentations" in review_data:
                review.presentations = review_data["presentations"] == True or review_data["presentations"] == "true"
            if "is_anonymous" in review_data:
                review.is_anonymous = review_data["is_anonymous"] == True or review_data["is_anonymous"] == "true"

            # Save the updated review
            review.save()

            # Update averages
            if review.course:
                review.course.update_averages()
            if review.professor:
                review.professor.update_averages()

            return {
                "success": True,
                "review": review
            }
        except Exception as e:
            logging.error(f"Error updating review: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to update review: {str(e)}"
            }
    
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
    
################################
# Review Vote-Related Services #
################################
class ReviewVoteService:
    """
    Service class for handling operations related to review votes.
    """
    
    @staticmethod
    def count_votes(review, vote_type):
        """
        Count the number of votes of a specific type for a review.
        
        Args:
            review: Review object
            vote_type: String ('like' or 'dislike')
            
        Returns:
            int: Number of votes
        """
        from .models import ReviewVote
        return ReviewVote.objects.filter(review=review, vote_type=vote_type).count()
    
    @staticmethod
    def get_user_vote(user, review):
        """
        Check if a user has voted on a review.
        
        Args:
            user: User object
            review: Review object
            
        Returns:
            ReviewVote object or None
        """
        from .models import ReviewVote
        try:
            return ReviewVote.objects.get(user=user, review=review)
        except ReviewVote.DoesNotExist:
            return None
    
    @staticmethod
    def submit_vote(user, review, vote_type):
        """
        Submit or update a vote.
        
        Args:
            user: User object
            review: Review object
            vote_type: String ('like' or 'dislike')
            
        Returns:
            dict: Result with updated vote counts and user vote
        """
        from .models import ReviewVote
        
        # Check if user has already voted
        existing_vote = ReviewVoteService.get_user_vote(user, review)
        
        if existing_vote:
            if existing_vote.vote_type == vote_type:
                # If clicking the same button again, remove the vote
                existing_vote.delete()
                user_vote = None
            else:
                # Update the vote
                existing_vote.vote_type = vote_type
                existing_vote.save()
                user_vote = vote_type
        else:
            # Create new vote
            ReviewVote.objects.create(user=user, review=review, vote_type=vote_type)
            user_vote = vote_type
        
        # Count likes and dislikes after the update
        likes = ReviewVoteService.count_votes(review, 'like')
        dislikes = ReviewVoteService.count_votes(review, 'dislike')
        
        return {
            'likes': likes,
            'dislikes': dislikes,
            'user_vote': user_vote
        }

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
        """Get a user by their email address."""
        try:
            return User.objects.get(email_address=email_address)
        except User.DoesNotExist:
            return None

    @staticmethod
    def get_course_plan(user):
        """Get a user's course plan."""
        return user.course_plan

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
        """Update a user's course plan."""
        try:
            # Validate the course plan structure
            if not isinstance(course_plan, dict):
                raise ValueError("Course plan must be a dictionary")
            
            if 'semesters' not in course_plan:
                course_plan = {'semesters': []}
            
            # Ensure each semester has the required fields
            for semester in course_plan['semesters']:
                if not all(key in semester for key in ['id', 'term', 'year', 'courses']):
                    raise ValueError("Invalid semester structure")
                
                if not isinstance(semester['courses'], list):
                    raise ValueError("Courses must be a list")
                
                # Ensure each course has the required fields
                for course in semester['courses']:
                    if not all(key in course for key in ['courseCode', 'courseName', 'credits', 'id']):
                        raise ValueError("Invalid course structure")

            # Save the course plan
            user.course_plan = course_plan
            user.save()
            return user
        except Exception as e:
            print(f"Error updating course plan: {e}")
            raise
    
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
        Create a new thread.
        """
        try:
            print(f"Creating thread with data: {thread_data}")
            
            category = thread_data.get('category', 'general')
            title = thread_data.get('title')
            
            if not title:
                return {"success": False, "error": "Title is required"}
            
            # Check title for inappropriate content
            is_appropriate, message = ContentModerationService.moderate_text(title)
            if not is_appropriate:
                return {"success": False, "error": message}
            
            thread = Thread(
                title=title,
                category=category, 
                user=user
            )
            
            if 'course_id' in thread_data:
                course_id = thread_data.get('course_id')
                try:
                    course = Course.objects.get(id=course_id)
                    thread.course = course
                except Course.DoesNotExist:
                    return {"success": False, "error": f"Course with ID {course_id} not found"}
                
            elif 'professor_id' in thread_data:
                professor_id = thread_data.get('professor_id')
                try:
                    professor = Professor.objects.get(id=professor_id)
                    thread.professor = professor
                except Professor.DoesNotExist:
                    return {"success": False, "error": f"Professor with ID {professor_id} not found"}
            thread.save()
            print(f"Thread saved with ID {thread.id}, category: {thread.category}")
            
            return {"success": True, "thread": thread}
        except Exception as e:
            print(f"Error creating thread: {str(e)}")
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
            new_title = thread_data["title"]
            if new_title:
                # Check updated title for inappropriate language
                is_appropriate, message = ContentModerationService.moderate_text(new_title)
                if not is_appropriate:
                    return {"success": False, "error": message}
                thread.title = new_title

        try:
            thread.save()
            return {"success": True, "thread": thread}
        except Exception as e:
            logging.error(f"Error updating thread: {str(e)}")
            return {"success": False, "error": "Failed to update thread. Please try again."}

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
    
    @staticmethod
    def get_threads_with_stats(threads):
        """
        Enhance thread data with stats including upvote counts
        """
        for thread in threads:
            comments = CommentService.get_comments_by_thread(thread.id)
            thread.comment_count = len(comments)
            
            total_upvotes = 0
            for comment in comments:
                upvotes = CommentUpvoteService.count_upvotes(comment)
                total_upvotes += upvotes
            
            thread.total_upvotes = total_upvotes
        
        return threads
    
    @staticmethod
    def get_category_counts(course_id):
        """
        Fetch the count of threads by category for a specific course.
        """
        categories = ['general', 'exams', 'homework', 'projects']
        counts = {category: Thread.objects.filter(course_id=course_id, category=category).count() for category in categories}
        return counts

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

        content = comment_data.get("content")
        if not content:
            return {"success": False, "error": "Comment content is required"}
            
        # Check comment content for inappropriate language
        is_appropriate, message = ContentModerationService.moderate_text(content)
        if not is_appropriate:
            return {"success": False, "error": message}

        email_address = comment_data.get("email_address")
        
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
                content=content
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
            new_content = comment_data["content"]
            if new_content:
                # Check updated content for inappropriate language
                is_appropriate, message = ContentModerationService.moderate_text(new_content)
                if not is_appropriate:
                    return {"success": False, "error": message}
                comment.content = new_content

        try:
            comment.save()
            return {"success": True, "comment": comment}
        except Exception as e:
            logging.error(f"Error updating comment: {str(e)}")
            return {"success": False, "error": "Failed to update comment. Please try again."}

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
    def sort_comments_by_popularity(comments):
        """
        Sort comments by upvote count (descending), then by date (descending) if upvotes are equal.
        """        
        comments_with_counts = comments.annotate(upvote_count=Count('upvotes'))
        return comments_with_counts.order_by('-upvote_count', '-created_at')
        
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

class CommentUpvoteService:
    """
    Service class for handling operations related to comment upvotes.
    """
    
    @staticmethod
    def count_upvotes(comment):
        """
        Count the number of upvotes for a comment.
        """
        return CommentUpvote.objects.filter(comment=comment).count()
    
    @staticmethod
    def get_user_upvote(user, comment):
        """
        Check if a user has upvoted a comment.
        """
        from .models import CommentUpvote
        try:
            return CommentUpvote.objects.get(user=user, comment=comment)
        except CommentUpvote.DoesNotExist:
            return None
    
    def get_user_has_upvoted(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user_email'):
            email = request.user_email
            try:
                from .services import UserService, CommentUpvoteService
                user = UserService.get_user(email)
                if user:
                    upvote = CommentUpvoteService.get_user_upvote(user, obj)
                    return upvote is not None
            except Exception as e:
                print(f"Error in get_user_has_upvoted: {e}")
                return False
        return False
    
    @staticmethod
    def toggle_upvote(user, comment):
        """
        Toggle upvote for a comment.
        """
        from .models import CommentUpvote
        
        existing_upvote = CommentUpvoteService.get_user_upvote(user, comment)
        
        if existing_upvote:
            existing_upvote.delete()
            user_upvoted = False
        else:
            CommentUpvote.objects.create(user=user, comment=comment)
            user_upvoted = True
        
        upvotes = CommentUpvoteService.count_upvotes(comment)
        
        return {
            'upvotes': upvotes,
            'user_upvoted': user_upvoted
        } 

############################
# Transcript-Related Services #
############################

################################
# Content Moderation Service #
################################
class ContentModerationService:
    """
    Service class for moderating content using Google's Perspective API
    to detect profanity, slurs, and other inappropriate content.
    """
    
    @staticmethod
    def moderate_text(text):
        """
        Moderates text content using Perspective API.
        
        Args:
            text (str): The text content to moderate
            
        Returns:
            tuple: (is_appropriate, message)
                - is_appropriate (bool): True if content passes moderation
                - message (str): Explanation message if content fails moderation
        """
        try:
            api_key = settings.PERSPECTIVE_API_KEY
            url = f"https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key={api_key}"
            
            analyze_request = {
                'comment': {'text': text},
                'requestedAttributes': {
                    'TOXICITY': {},
                    'SEVERE_TOXICITY': {},
                    'IDENTITY_ATTACK': {},
                    'INSULT': {},
                    'PROFANITY': {},
                    'THREAT': {}
                },
                'languages': ['en'],
                'doNotStore': True
            }
            
            response = requests.post(
                url=url, 
                data=json.dumps(analyze_request),
                headers={'Content-Type': 'application/json'}
            )
            
            response_data = response.json()


            thresholds = {
                'TOXICITY': 1.0,          
                'SEVERE_TOXICITY': 1.0,
                'IDENTITY_ATTACK': 1.0,
                'INSULT': 1.0,
                'PROFANITY': 0.5,
                'THREAT': 1.0
            }
            
            # Check if any attribute exceeds its threshold
            failed_attributes = []
            for attr, threshold in thresholds.items():
                if attr in response_data.get('attributeScores', {}):
                    score = response_data['attributeScores'][attr]['summaryScore']['value']
                    if score > threshold:
                        failed_attributes.append(attr.lower())
            
            if failed_attributes:
                # Only show "profanity" in the error message
                message = "Your submission contains profanity. Please revise and try again."
                return False, message
            
            return True, None
            
        except Exception as e:
            logging.error(f"Error using Perspective API: {str(e)}")
            # If API fails, reject content as a safety measure
            return False, "Content moderation service unavailable. Please try again later."

class TranscriptService:
    """
    Service class for handling transcript processing and course extraction with improved course matching 
    and support for PDF files.
    """
    
    @staticmethod
    def process_transcript(file_obj, file_type, user=None, update_plan=False):
        """
        Process uploaded transcript file and extract course information.
        Args:
            file_obj: The uploaded file object
            file_type: The MIME type of the file
            user: Optional User instance to update course plan
            update_plan: Boolean flag to indicate if user's plan should be updated
        """
        if file_type.startswith('image/'):
            courses = TranscriptService._process_image(file_obj)
        elif file_type == 'application/pdf':
            courses = TranscriptService._process_pdf(file_obj)
        else:
            raise ValueError('Currently only supporting image and PDF files')
        
        # Only update user's course plan if user is provided AND explicitly requested
        # This step is now skipped for the initial transcript analysis
        if user and update_plan:
            TranscriptService._update_user_course_plan(user, courses)
            
        return courses

    @staticmethod
    def _process_image(file_obj):
        """
        Process image transcript and extract course information.
        """
        print("Processing image file...")
        try:
            image = Image.open(file_obj)
            print(f"Image opened successfully: size={image.size}, mode={image.mode}")
            
            # Convert image to text using Tesseract OCR
            text = pytesseract.image_to_string(image)
            print(f"OCR Text extracted: {len(text)} characters")
            
            # Extract courses from the text
            return TranscriptService._extract_courses_from_text(text)
            
        except Exception as e:
            print(f"Error processing image: {str(e)}")
            raise

    @staticmethod
    def _process_pdf(file_obj):
        """
        Process PDF transcript and extract course information.
        """
        print("Processing PDF file...")
        try:
            # Try to extract text directly from PDF
            import pdfplumber
            import tempfile
            
            # Save the InMemoryUploadedFile to a temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                for chunk in file_obj.chunks():
                    temp_file.write(chunk)
                temp_path = temp_file.name
            
            all_text = ""
            try:
                # Try to extract text directly from PDF
                with pdfplumber.open(temp_path) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            all_text += page_text + "\n\n"
                
                print(f"Extracted {len(all_text)} characters from PDF text layer")
                
                # If we got enough text, process it
                if len(all_text.strip()) > 100:  # Minimum threshold to consider it valid text
                    return TranscriptService._extract_courses_from_text(all_text)
            except Exception as pdf_text_error:
                print(f"Error extracting PDF text layer: {str(pdf_text_error)}")
                all_text = ""  # Reset text if extraction failed
            
            # If text extraction failed or returned too little text, try OCR
            if len(all_text.strip()) <= 100:
                print("PDF text extraction failed or insufficient text, falling back to OCR")
                
                # Convert PDF to images and OCR
                from pdf2image import convert_from_path
                
                images = convert_from_path(temp_path)
                all_text = ""
                
                for i, image in enumerate(images):
                    print(f"OCR processing page {i+1}/{len(images)}")
                    page_text = pytesseract.image_to_string(image)
                    all_text += page_text + "\n\n"
                
                print(f"Extracted {len(all_text)} characters using OCR on PDF")
            
            # Clean up the temporary file
            import os
            os.unlink(temp_path)
            
            return TranscriptService._extract_courses_from_text(all_text)
            
        except Exception as e:
            print(f"Error processing PDF: {str(e)}")
            raise

    @staticmethod
    def _extract_courses_from_text(text):
        """
        Extracts course information from text extracted from a transcript.
        Only includes courses that match to the database.
        """
        print("Extracting courses from text...")
        # First, split text into lines for better context analysis
        lines = text.split('\n')
        courses = []
        current_semester = None
        default_semester = None  # Will be set to the most recent semester found
        
        # Keywords that indicate a line is not a course
        non_course_keywords = {
            'term gpa', 'dean\'s list', 'semester', 'quarter', 'year', 'total', 'grade', 'units',
            'intensive', 'exploration', 'requirement', 'continued', 'advisor', 'student id'
        }
        
        # Common OCR misreadings and their corrections
        dept_corrections = {
            'WRIG': 'WRTG',
            'CS)': 'CS',
            '€S': 'CS',
            'cS': 'CS',
            'cs': 'CS',
            'CS.': 'CS',
            '€S_' : 'CS',
            'ETHNC': 'ETHNC',
            'ECON9': 'ECON'
        }
        
        # Pattern to match semester lines (e.g., "Fall 2023", "Spring 2024")
        semester_pattern = r'(Spring|Summer|Fall|Winter)\s+(\d{4})'
        
        # Pattern to match course lines, more permissive to handle OCR artifacts
        course_pattern = r'^([A-Za-z€)]\S{1,4})\s*[~\'"_\s]*\s*(\d{3,4}[A-Za-z]?)[\\.\s]*\s+([^0-9\n](?:[^\n]*[^0-9\n])?)'
        
        # First pass: find the most recent semester
        for line in lines:
            semester_match = re.search(semester_pattern, line, re.IGNORECASE)
            if semester_match:
                term = semester_match.group(1).capitalize()
                year = semester_match.group(2)
                semester = f"{term} {year}"
                if not default_semester or int(year) > int(default_semester.split()[-1]):
                    default_semester = semester

        if not default_semester:
            # If no semester found, use current year
            current_year = datetime.now().year
            default_semester = f"Fall {current_year}"  # Default to Fall of current year
            print(f"No semester found in transcript, using default: {default_semester}")

        matched_courses = []

        # Second pass: process courses
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check for semester header
            semester_match = re.search(semester_pattern, line, re.IGNORECASE)
            if semester_match:
                term = semester_match.group(1).capitalize()
                year = semester_match.group(2)
                current_semester = f"{term} {year}"
                print(f"Found semester: {current_semester}")
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
            name = re.sub(r'\s+', ' ', name)
            
            # Additional validation: course name should be reasonable length
            if len(name) < 3 or len(name) > 100:
                continue
            
            code = f"{dept} {num}"
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
                    matched_courses.append({
                        'code': f"{db_course.subject} {db_course.number}",  # Use database values
                        'name': db_course.title,
                        'credits': db_course.credits,
                        'rating': db_course.avg_rating,  # Use the average rating field
                        'difficulty': db_course.avg_difficulty,  # Use the average difficulty field
                        'confidence': 1.0,
                        'db_match': True,
                        'course_id': db_course.id,  # This is the actual database ID
                        'semester': current_semester or default_semester  # Use current semester or default
                    })
                else:
                    # Skip custom courses - don't include them
                    print(f"No database match found for: {code}, skipping")
            except Exception as e:
                print(f"Error matching course {code} in database: {str(e)}")
                continue
        
        # Convert courses to JSON-serializable dictionaries to avoid any serialization issues
        serializable_courses = []
        for course in matched_courses:
            course_dict = dict(course)
            # Ensure numeric values are serializable
            course_dict['rating'] = float(course_dict['rating']) if course_dict['rating'] is not None else 0
            course_dict['difficulty'] = float(course_dict['difficulty']) if course_dict['difficulty'] is not None else 0
            course_dict['credits'] = int(course_dict['credits']) if course_dict['credits'] is not None else 3
            serializable_courses.append(course_dict)
        
        print(f"Total database-matched courses found: {len(serializable_courses)}")
        return serializable_courses
        
    @staticmethod
    def _update_user_course_plan(user, courses):
        """
        Update the user's course plan with the processed courses.
        Args:
            user: User instance to update
            courses: List of course dictionaries from transcript processing
        """
        try:
            print(f"Updating course plan for user {user.email_address}")
            
            # Initialize course plan if it doesn't exist
            if not user.course_plan:
                user.course_plan = {"semesters": []}
            
            # Group courses by semester
            courses_by_semester = {}
            for course in courses:
                semester = course['semester']
                if semester not in courses_by_semester:
                    courses_by_semester[semester] = []
                courses_by_semester[semester].append(course)
            
            # Update each semester in the course plan
            for semester_name, semester_courses in courses_by_semester.items():
                # Parse semester term and year
                parts = semester_name.split(' ')
                if len(parts) != 2:
                    print(f"Invalid semester format: {semester_name}, skipping")
                    continue
                    
                term, year_str = parts
                try:
                    year = int(year_str)
                except ValueError:
                    print(f"Invalid year in semester: {semester_name}, skipping")
                    continue
                
                # Look for existing semester in user's course plan
                semester_entry = None
                for s in user.course_plan["semesters"]:
                    if s.get("term") == term and s.get("year") == year:
                        semester_entry = s
                        break
                
                # Create new semester if needed
                if not semester_entry:
                    semester_entry = {
                        "id": f"{term.lower()}-{year}",
                        "term": term,
                        "year": year,
                        "courses": []
                    }
                    user.course_plan["semesters"].append(semester_entry)
                    print(f"Created new semester: {term} {year}")
                
                # Add courses to the semester
                for course in semester_courses:
                    # Check if course already exists in this semester
                    course_exists = any(
                        c.get("courseCode", "").lower() == course["code"].lower() or
                        c.get("code", "").lower() == course["code"].lower()
                        for c in semester_entry["courses"]
                    )
                    
                    if not course_exists:
                        # Generate a unique ID for the course
                        unique_id = str(course.get('course_id', f"transcript-{course['code'].replace(' ', '-')}-{int(time.time() * 1000)}"))
                        
                        # Create a new course entry with unified property names
                        # These property names should match the ones used in manually added courses
                        new_course = {
                            "id": unique_id,
                            "courseCode": course["code"],  # Use consistent property name
                            "courseName": course["name"],  # Use consistent property name
                            "credits": course["credits"],
                            "rating": course.get("rating", 0),
                            "difficulty": course.get("difficulty", 0)
                        }
                        semester_entry["courses"].append(new_course)
                        print(f"Added course {course['code']} to {semester_name}")

            # Save the course plan
            user.save()
            return True
            
        except Exception as e:
            print(f"Error updating course plan: {e}")
            return False

    @staticmethod
    def _process_image(file_obj):
        """
        Process image transcript and extract course information.
        """
        print("Processing image file...")
        try:
            image = Image.open(file_obj)
            print(f"Image opened successfully: size={image.size}, mode={image.mode}")
            
            # Convert image to text using Tesseract OCR
            text = pytesseract.image_to_string(image)
            print(f"OCR Text extracted: {len(text)} characters")
            print(f"Extracted text:\n{text}")
            
            # First, split text into lines for better context analysis
            lines = text.split('\n')
            courses = []
            current_semester = None
            default_semester = None  # Will be set to the most recent semester found
            
            # Keywords that indicate a line is not a course
            non_course_keywords = {
                'term gpa', 'dean\'s list', 'semester', 'quarter', 'year', 'total', 'grade', 'units',
                'intensive', 'exploration', 'requirement', 'continued'
            }
            
            # Common OCR misreadings and their corrections
            dept_corrections = {
                'WRIG': 'WRTG',
                'CS)': 'CS',
                '€S': 'CS',
                'cS': 'CS',
                'cs': 'CS',
                'CS.': 'CS',
                '€S_' : 'CS',
                'ETHNC': 'ETHNC',
                'ECON9': 'ECON'
            }
            
            # Pattern to match semester lines (e.g., "Fall 2023", "Spring 2024")
            semester_pattern = r'(Spring|Summer|Fall|Winter)\s+(\d{4})'
            
            # Pattern to match course lines, more permissive to handle OCR artifacts
            course_pattern = r'^([A-Za-z€)]\S{1,4})\s*[~\'"_\s]*\s*(\d{3,4}[A-Za-z]?)[\\.\s]*\s+([^0-9\n](?:[^\n]*[^0-9\n])?)'
            
            # First pass: find the most recent semester
            for line in lines:
                semester_match = re.search(semester_pattern, line, re.IGNORECASE)
                if semester_match:
                    term = semester_match.group(1).capitalize()
                    year = semester_match.group(2)
                    semester = f"{term} {year}"
                    if not default_semester or int(year) > int(default_semester.split()[-1]):
                        default_semester = semester

            if not default_semester:
                # If no semester found, use current year
                current_year = datetime.now().year
                default_semester = f"Fall {current_year}"  # Default to Fall of current year
                print(f"No semester found in transcript, using default: {default_semester}")

            # Second pass: process courses
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Check for semester header
                semester_match = re.search(semester_pattern, line, re.IGNORECASE)
                if semester_match:
                    term = semester_match.group(1).capitalize()
                    year = semester_match.group(2)
                    current_semester = f"{term} {year}"
                    print(f"Found semester: {current_semester}")
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
                name = re.sub(r'\s+', ' ', name)
                
                # Additional validation: course name should be reasonable length
                if len(name) < 3 or len(name) > 100:
                    continue
                
                code = f"{dept} {num}"
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
                            'rating': db_course.avg_rating,  # Use the average rating field
                            'difficulty': db_course.avg_difficulty,  # Use the average difficulty field
                            'confidence': 1.0,
                            'db_match': True,
                            'course_id': db_course.id,  # This is the actual database ID
                            'semester': current_semester or default_semester  # Use current semester or default
                        })
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

##############################
# Study Buddy-Related Services #
##############################
class StudyBuddyService:
    """
    Provides utility methods for managing study buddy requests.
    """
    
    @staticmethod
    def create_request(sender_email, receiver_id, course_name, message):
        """
        Create a new study buddy request.
        
        Args:
            sender_email (str): Email of the user sending the request
            receiver_id (int): ID of the user receiving the request
            course_name (str): Name of the course to study together
            message (str): Message from sender to receiver
            
        Returns:
            dict: Result with success status and data or error message
        """
        try:
            from .models import User
            
            # Get sender and receiver
            sender = User.objects.get(email_address=sender_email)
            receiver = User.objects.get(id=receiver_id)
            
            # Check if request already exists
            existing_request = StudyBuddyRequest.objects.filter(
                sender=sender,
                receiver=receiver,
                course_name=course_name
            ).first()
            
            if existing_request:
                return {
                    "success": False,
                    "error": "You already sent a study buddy request to this user for this course."
                }
            
            # Create new request
            request = StudyBuddyRequest.objects.create(
                sender=sender,
                receiver=receiver,
                course_name=course_name,
                message=message,
                status='pending'
            )
            
            return {
                "success": True,
                "request": {
                    "id": request.id,
                    "sender": f"{request.sender.fname} {request.sender.lname}",
                    "receiver": f"{request.receiver.fname} {request.receiver.lname}",
                    "course_name": request.course_name,
                    "status": request.status,
                    "created_at": request.created_at.isoformat()
                }
            }
            
        except User.DoesNotExist:
            return {
                "success": False,
                "error": "User not found."
            }
        except Exception as e:
            print(f"Error creating study buddy request: {str(e)}")
            return {
                "success": False,
                "error": "Failed to create study buddy request."
            }
    
    @staticmethod
    def get_requests_by_user(email):
        """
        Get all study buddy requests for a user (both sent and received).
        
        Args:
            email (str): Email of the user
            
        Returns:
            dict: Result with success status and request data or error message
        """
        try:
            from .models import User
            
            user = User.objects.get(email_address=email)
            
            # Get sent requests
            sent_requests = StudyBuddyRequest.objects.filter(sender=user)
            
            # Get received requests
            received_requests = StudyBuddyRequest.objects.filter(receiver=user)
            
            # Convert to dicts for JSON serialization
            sent_data = [{
                "id": req.id,
                "receiver_id": req.receiver.id,
                "receiver_name": f"{req.receiver.fname} {req.receiver.lname}",
                "course": req.course_name,
                "message": req.message,
                "status": req.status,
                "created_at": req.created_at.isoformat(),
                "type": "sent"
            } for req in sent_requests]
            
            received_data = [{
                "id": req.id,
                "sender_id": req.sender.id,
                "sender_name": f"{req.sender.fname} {req.sender.lname}",
                "course": req.course_name,
                "message": req.message,
                "status": req.status,
                "created_at": req.created_at.isoformat(),
                "type": "received"
            } for req in received_requests]
            
            return {
                "success": True,
                "sent_requests": sent_data,
                "received_requests": received_data
            }
            
        except User.DoesNotExist:
            return {
                "success": False,
                "error": "User not found."
            }
        except Exception as e:
            print(f"Error fetching study buddy requests: {str(e)}")
            return {
                "success": False,
                "error": "Failed to fetch study buddy requests."
            }
    
    @staticmethod
    def update_request_status(request_id, new_status):
        """
        Update the status of a study buddy request.
        
        Args:
            request_id (int): ID of the request to update
            new_status (str): New status ('accepted' or 'declined')
            
        Returns:
            dict: Result with success status and updated request or error message
        """
        try:
            from .models import StudyBuddyRequest
            
            request = StudyBuddyRequest.objects.get(id=request_id)
            
            if new_status not in ['accepted', 'declined']:
                return {
                    "success": False,
                    "error": "Invalid status. Must be 'accepted' or 'declined'."
                }
            
            request.status = new_status
            request.save()
            
            return {
                "success": True,
                "request": {
                    "id": request.id,
                    "sender": f"{request.sender.fname} {request.sender.lname}",
                    "receiver": f"{request.receiver.fname} {request.receiver.lname}",
                    "course_name": request.course_name,
                    "status": request.status,
                    "updated_at": request.updated_at.isoformat()
                }
            }
            
        except StudyBuddyRequest.DoesNotExist:
            return {
                "success": False,
                "error": "Study buddy request not found."
            }
        except Exception as e:
            print(f"Error updating study buddy request: {str(e)}")
            return {
                "success": False,
                "error": "Failed to update study buddy request."
            }

    @staticmethod
    def get_messages(request_id):
        """
        Get all messages for a specific study buddy request.
        
        Args:
            request_id (int): ID of the study buddy request
            
        Returns:
            dict: Result with success status and messages data or error message
        """
        try:
            from .models import StudyBuddyRequest, StudyBuddyMessage
            
            request = StudyBuddyRequest.objects.get(id=request_id)
            
            # Verify that the request has been accepted
            if request.status != 'accepted':
                return {
                    "success": False,
                    "error": "Messages are only available for accepted study buddy requests"
                }
            
            messages = StudyBuddyMessage.objects.filter(study_buddy_request=request).order_by('created_at')
            
            # Convert to dicts for JSON serialization
            messages_data = [{
                "id": msg.id,
                "sender_id": msg.sender.id,
                "sender_name": f"{msg.sender.fname} {msg.sender.lname}",
                "receiver_id": msg.receiver.id,
                "content": msg.content,
                "is_read": msg.is_read,
                "created_at": msg.created_at.isoformat()
            } for msg in messages]
            
            return {
                "success": True,
                "messages": messages_data
            }
            
        except StudyBuddyRequest.DoesNotExist:
            return {
                "success": False,
                "error": "Study buddy request not found"
            }
        except Exception as e:
            print(f"Error getting messages: {str(e)}")
            return {
                "success": False,
                "error": "Failed to get messages"
            }

    @staticmethod
    def send_message(sender_email, receiver_id, request_id, content):
        """
        Send a message between study buddies.
        
        Args:
            sender_email (str): Email of the user sending the message
            receiver_id (int): ID of the user receiving the message
            request_id (int): ID of the study buddy request
            content (str): Message content
            
        Returns:
            dict: Result with success status and message data or error message
        """
        try:
            from .models import StudyBuddyRequest, StudyBuddyMessage, User
            
            # Verify users and request exist
            sender = User.objects.get(email_address=sender_email)
            receiver = User.objects.get(id=receiver_id)
            request = StudyBuddyRequest.objects.get(id=request_id)
            
            # Verify that the request has been accepted
            if request.status != 'accepted':
                return {
                    "success": False,
                    "error": "Messages can only be sent for accepted study buddy requests"
                }
            
            # Verify that the sender and receiver are the users in the request
            if not ((sender == request.sender and receiver == request.receiver) or 
                    (sender == request.receiver and receiver == request.sender)):
                return {
                    "success": False,
                    "error": "You can only message your study buddy"
                }
            
            # Check for inappropriate content
            is_appropriate, message = ContentModerationService.moderate_text(content)
            if not is_appropriate:
                return {
                    "success": False,
                    "error": message
                }
            
            # Create the message
            message = StudyBuddyMessage.objects.create(
                sender=sender,
                receiver=receiver,
                study_buddy_request=request,
                content=content,
                is_read=False
            )
            
            return {
                "success": True,
                "message": {
                    "id": message.id,
                    "sender_name": f"{sender.fname} {sender.lname}",
                    "content": message.content,
                    "created_at": message.created_at.isoformat()
                }
            }
            
        except User.DoesNotExist:
            return {
                "success": False,
                "error": "User not found"
            }
        except StudyBuddyRequest.DoesNotExist:
            return {
                "success": False,
                "error": "Study buddy request not found"
            }
        except Exception as e:
            print(f"Error sending message: {str(e)}")
            return {
                "success": False,
                "error": "Failed to send message"
            }

    @staticmethod
    def mark_messages_as_read(user_email, request_id):
        """
        Mark all messages for a user in a study buddy request as read.
        
        Args:
            user_email (str): Email of the user
            request_id (int): ID of the study buddy request
            
        Returns:
            dict: Result with success status or error message
        """
        try:
            from .models import StudyBuddyRequest, StudyBuddyMessage, User
            
            user = User.objects.get(email_address=user_email)
            request = StudyBuddyRequest.objects.get(id=request_id)
            
            # Mark messages as read
            updated_count = StudyBuddyMessage.objects.filter(
                receiver=user,
                study_buddy_request=request,
                is_read=False
            ).update(is_read=True)
            
            return {
                "success": True,
                "count": updated_count
            }
            
        except User.DoesNotExist:
            return {
                "success": False,
                "error": "User not found"
            }
        except StudyBuddyRequest.DoesNotExist:
            return {
                "success": False,
                "error": "Study buddy request not found"
            }
        except Exception as e:
            print(f"Error marking messages as read: {str(e)}")
            return {
                "success": False,
                "error": "Failed to mark messages as read"
            }

    @staticmethod
    def get_unread_message_count(user_email):
        """
        Get the count of unread messages for a user.
        
        Args:
            user_email (str): Email of the user
            
        Returns:
            dict: Result with success status and unread counts by request ID
        """
        try:
            from .models import User, StudyBuddyMessage
            
            user = User.objects.get(email_address=user_email)
            
            # Get count of unread messages by request
            unread_counts = {}
            
            # Find all messages where the user is the receiver and messages are unread
            unread_messages = StudyBuddyMessage.objects.filter(
                receiver=user,
                is_read=False
            )
            
            # Group by request ID and count
            for message in unread_messages:
                request_id = message.study_buddy_request.id
                if request_id in unread_counts:
                    unread_counts[request_id] += 1
                else:
                    unread_counts[request_id] = 1
                
            # Also include sender info
            sender_info = {}
            for request_id in unread_counts.keys():
                # Get the latest unread message for this request
                latest_message = StudyBuddyMessage.objects.filter(
                    study_buddy_request_id=request_id,
                    receiver=user,
                    is_read=False
                ).order_by('-created_at').first()
                
                if latest_message:
                    sender_info[request_id] = {
                        'id': latest_message.sender.id,
                        'name': f"{latest_message.sender.fname} {latest_message.sender.lname}",
                        'preview': latest_message.content[:30] + ('...' if len(latest_message.content) > 30 else '')
                    }
            
            return {
                "success": True,
                "unread_counts": unread_counts,
                "sender_info": sender_info
            }
            
        except User.DoesNotExist:
            return {
                "success": False,
                "error": "User not found"
            }
        except Exception as e:
            print(f"Error getting unread message count: {str(e)}")
            return {
                "success": False,
                "error": "Failed to get unread message count"
            }
            
    @staticmethod
    def get_buddy_status_updates(user_email):
        """
        Get study buddies with their status information.
        
        Args:
            user_email (str): Email of the user
            
        Returns:
            dict: Result with success status and list of buddies with their status
        """
        try:
            from .models import User, StudyBuddyRequest
            
            user = User.objects.get(email_address=user_email)
            
            # Get all accepted study buddy requests
            sent_requests = StudyBuddyRequest.objects.filter(
                sender=user,
                status='accepted'
            )
            
            received_requests = StudyBuddyRequest.objects.filter(
                receiver=user,
                status='accepted'
            )
            
            # Extract buddy information
            buddies = []
            
            for request in sent_requests:
                buddies.append({
                    'id': request.receiver.id,
                    'name': f"{request.receiver.fname} {request.receiver.lname}",
                    'request_id': request.id
                })
                
            for request in received_requests:
                buddies.append({
                    'id': request.sender.id,
                    'name': f"{request.sender.fname} {request.sender.lname}",
                    'request_id': request.id
                })
            
            return {
                "success": True,
                "buddies": buddies
            }
            
        except User.DoesNotExist:
            return {
                "success": False,
                "error": "User not found"
            }
        except Exception as e:
            print(f"Error getting buddy status updates: {str(e)}")
            return {
                "success": False,
                "error": "Failed to get buddy status updates"
            }
