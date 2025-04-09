from .models import (
    Department, 
    User, 
    Review, 
    Course, 
    Professor,
    Thread,
    Comment,
    CommentUpvote,
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
            Review: The created review object.
        """
        course = CourseService.get_course(course_id)
        professor_id = review_data.get('professor')
        professor = get_object_or_404(Professor, id=professor_id) if professor_id else None
        is_anonymous = review_data.get('is_anonymous')
            
        if isinstance(is_anonymous, str):
            is_anonymous = is_anonymous.lower() == 'true'
        else:
            is_anonymous = bool(is_anonymous)
        review = Review.objects.create(
            user=user,
            course=course,
            professor=professor,

            # Text / string fields
            review=review_data.get('review'),
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

        return review
    
    @staticmethod
    def create_review_for_professor(professor_id, user, review_data):
        """
        Creates a review for a professor and associates it with the selected course.
        """
        professor = ProfessorService.get_professor(professor_id)

        course_id = review_data.get("course")
        course = get_object_or_404(Course, id=course_id) if course_id else None
        is_anonymous = review_data.get('is_anonymous')
            
        if isinstance(is_anonymous, str):
            is_anonymous = is_anonymous.lower() == 'true'
        else:
            is_anonymous = bool(is_anonymous)

        review = Review.objects.create(
            user=user,
            professor=professor,
            course=course,  

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
            is_anonymous=is_anonymous,        
            )

        professor.update_averages()
        if course:
            course.update_averages()

        return review
    
    @staticmethod
    def get_user_course_reviews(user):
        """
        Get all course reviews by a specific user.
        """
        return Review.objects.filter(user=user, course__isnull=False)

    @staticmethod
    def get_user_professor_reviews(user):
        """
        Get all professor reviews by a specific user.
        """
        return Review.objects.filter(user=user, professor__isnull=False)

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
        if "is_anonymous" in review_data:
            review.is_anonymous = review_data["is_anonymous"] == "true"

        review.save()

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

class TranscriptService:
    """
    Service class for handling transcript processing and course extraction.
    """
    
    @staticmethod
    def process_transcript(file_obj, file_type, user=None):
        """
        Process uploaded transcript file and extract course information.
        Args:
            file_obj: The uploaded file object
            file_type: The MIME type of the file
            user: Optional User instance to update course plan
        """
        if file_type.startswith('image/'):
            courses = TranscriptService._process_image(file_obj)
            
            # If user is provided, update their course plan
            if user and courses:
                TranscriptService._update_user_course_plan(user, courses)
                
            return courses
        else:
            raise ValueError('Currently only supporting image files')

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
                semester = course['semester']  # This comes from _process_image
                if semester not in courses_by_semester:
                    courses_by_semester[semester] = []
                courses_by_semester[semester].append(course)
            
            # Update each semester in the course plan
            for semester_name, semester_courses in courses_by_semester.items():
                # Parse semester information
                try:
                    term, year = semester_name.split(' ')
                    year = int(year)
                except (ValueError, TypeError) as e:
                    print(f"Error parsing semester '{semester_name}': {e}")
                    continue

                # Find or create semester in course plan
                semester_entry = None
                for s in user.course_plan["semesters"]:
                    if s.get("term") == term and s.get("year") == year:
                        semester_entry = s
                        break
                
                if not semester_entry:
                    semester_entry = {
                        "id": f"{term.lower()}-{year}",
                        "term": term,
                        "year": year,
                        "courses": []
                    }
                    user.course_plan["semesters"].append(semester_entry)
                
                # Add new courses to semester
                for course in semester_courses:
                    # Check if course already exists
                    course_exists = any(
                        c.get("courseCode", "").lower() == course["code"].lower()
                        for c in semester_entry["courses"]
                    )
                    
                    if not course_exists:
                        new_course = {
                            "id": f"{course['code'].replace(' ', '-')}-{len(semester_entry['courses'])}",
                            "courseCode": course["code"],
                            "courseName": course["name"],
                            "credits": course["credits"]
                        }
                        semester_entry["courses"].append(new_course)
                        print(f"Added course {course['code']} to {semester_name}")

            # Sort semesters by year and term
            term_order = {"spring": 0, "summer": 1, "fall": 2, "winter": 3}
            user.course_plan["semesters"].sort(
                key=lambda x: (x["year"], term_order.get(x["term"].lower(), 0))
            )

            # Save changes to database
            print(f"Saving updated course plan: {user.course_plan}")
            user.save()
            return True
            
        except Exception as e:
            print(f"Error updating course plan: {e}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
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
                from datetime import datetime
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
                            'confidence': 1.0,
                            'db_match': True,
                            'course_id': db_course.id,
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
