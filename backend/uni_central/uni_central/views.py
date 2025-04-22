from django.shortcuts import render, get_object_or_404
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from .models import Comment, Course
from .services import (
    UserService,
    DepartmentService,
    CourseService, 
    ReviewService,
    ReviewVoteService, 
    ProfessorService,
    CourseFilteringService,
    ThreadService,
    CommentService,
    CommentUpvoteService,
    TranscriptService,
    StudyBuddyService,
    )
from .serializers import (
    DepartmentSerializer,
    UserSerializer,
    CourseSerializer,
    ProfessorSerializer,
    ReviewSerializer,
    ThreadSerializer,
    CommentSerializer,
)
from django.http import JsonResponse
import time
import json
from django.http import StreamingHttpResponse

######################
# General Page Views #
######################

def home(request):
    """
    Render the Home page.
    """
    return render(request, 'index.html')

def signup_page(request):
    """
    Render the Signup page.
    """
    return render(request, 'signup.html')

def login_page(request):
    """
    Render the Login page.
    """
    return render(request, 'login.html')

def my_account(request):
    """
    Render the My Account page.
    """    
    context = {
        'userEmail': request.user.email if request.user.is_authenticated else None
    }
    return render(request, 'my_account.html', context)

def my_courses(request):
    """
    Render the My Courses page.
    """
    return render(request, 'my_courses.html')

def my_professors(request):
    """
    Render the My Professors page.
    """
    return render(request, 'my_professors.html')

def my_classmates(request):
    """
    Render the My Classmates page.
    """
    return render(request, 'my_classmates.html')

def my_reviews(request):
    """
    Render the My Reviews page.
    """
    return render(request, 'my_reviews.html')

def course_planner(request):
    """
    Render the Course Planner page.
    """
    return render(request, 'course_planner.html')

def courses(request):
    """
    Render the Courses page.
    """
    return render(request, 'courses.html')

def course_filtering(request):
    """
    Render the Course Filtering page.
    """
    return render(request, 'course_filtering.html')

def discussion_board(request, context_id, context_type):
    """
    Render discussion board for either a course or professor
    
    Args:
        request: HTTP request
        context_id: ID of the course or professor
        context_type: 'course' or 'professor'
    """
    if context_type not in ['course', 'professor']:
        raise ValueError("Invalid context type")

    if context_type == 'course':
        context_object = CourseService.get_course(context_id)
        name = context_object.title  # Using 'title' from your Course model
    elif context_type == 'professor':
        context_object = ProfessorService.get_professor(context_id)
        name = f"{context_object.fname} {context_object.lname}"  # Using fname/lname from your Professor model
    
    if context_type == 'course':
        threads = ThreadService.get_threads_by_course(context_id)
    else:
        threads = ThreadService.get_threads_by_professor(context_id)

    context = {
        'context_id': context_id,
        'context_type': context_type,
        'name': name,
        'threads': threads
    }
    return render(request, 'discussion_board.html', context)

def about_page(request):
    """
    Render the About page.
    """
    return render(request, 'about.html')

def course_detail(request, course_id):
    """
    Render the template for a Course Detail page.
    The frontend (JS) will call the API endpoint below to get course + reviews.
    """
    context = {
        'course_id': course_id, 
    }
    return render(request, 'course_detail.html', context)

def professor_detail(request, professor_id):
    """
    Render the template for a professor Detail page.
    The frontend (JS) will call the API endpoint below to get course + reviews.
    """
    context = {
        'professor_id': professor_id, 
    }
    return render(request, 'professor_detail.html', context)


def review_form_page(request, context_type, context_id):
    # context_type should be either "course" or "professor"
    context = {
        'context_type': context_type,
        'context_id': context_id,
        
    }
    return render(request, 'review_form.html', context)

def professors(request):
    """
    Render the Professors page.
    """
    return render(request, 'professors.html')

def privacy_policy(request):
    """Render the privacy policy page."""
    return render(request, 'privacy_policy.html')

def help_feedback(request):
    """Render the help and feedback page."""
    return render(request, 'help_feedback.html')

def team_members(request):
    """Render the team members page."""
    return render(request, 'team_members.html')

def user_tutorial(request):
    """Render the user tutorial page."""
    return render(request, 'user_tutorial.html')

#####################################
# Department-Related Views and APIs #
#####################################

class DepartmentListView(APIView):
    """
    Lists all departments or creates a new one.
    """
    def get(self, request):
        """
        Handles GET requests to list all departments.
        """
        query = DepartmentService.get_all_departments()
        serialized = DepartmentSerializer(query, many=True)
        return Response(serialized.data)

#################################
# Course-Related Views and APIs #
#################################

class DepartmentCoursesView(APIView):
    """
    Retrieves courses for a specific department by ID.
    """
    def get(self, request, department_id):
        """
        Fetches courses for the given department ID.
        """        
        # ForeignKey relationship from Course to Department
        courses = CourseService.get_courses_by_department(department_id)
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data)
    
class CourseReviewListView(APIView):
    """
    API View to fetch details of a course and its reviews.
    """
    def get(self, request, course_id):
        course = CourseService.get_course(course_id)
        reviews = ReviewService.get_reviews_by_course_sorted(course_id)

        # Serialize data
        course_serializer = CourseSerializer(course)
        review_serializer = ReviewSerializer(reviews, many=True)

        # Combine data
        data = {
            'course': course_serializer.data,
            'reviews': review_serializer.data
        }
        return Response(data, status=status.HTTP_200_OK)

class ProfessorCoursesAPIView(APIView):
    """
    Fetch all courses for a given professor (GET /api/professors/<professor_id>/courses/).
    """
    def get(self, request, professor_id):
        """
        Handles GET requests to fetch courses for the given professor.
        """
        try:
            # Fetch courses using the service layer
            courses = CourseService.get_courses_by_professor(professor_id)
            serialized = CourseSerializer(courses, many=True)
            return Response(serialized.data, status=status.HTTP_200_OK)
        except Exception as e:
            # Handle cases like invalid professor_id
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
####################################
# Review-Related Views and APIs #
####################################

class CreateReviewAPIView(APIView):
    """
    Handle the creation of a Review for a given course (POST).
    """
    def post(self, request, course_id):
        email_address = request.data.get('email_address')
        user = UserService.get_user(email_address)
        review_data = request.data

        result = ReviewService.create_review_for_course(course_id, user, review_data)
        
        if result["success"]:
            review = result["review"]
            return Response(
                {"message": "Review created successfully", "review_id": review.id},
                status=status.HTTP_201_CREATED
            )
        else:
            # Check if the error message is related to content moderation
            error_msg = result["error"]
            if "inappropriate" in error_msg.lower() or "toxicity" in error_msg.lower() or "profanity" in error_msg.lower() or "slurs" in error_msg.lower():
                error_msg = "Your review contains profanity. Please revise and try again."
            
            return Response(
                {"error": error_msg},
                status=status.HTTP_400_BAD_REQUEST
            )
            
class CreateProfessorReviewAPIView(APIView):
    """
    API View to handle the creation of a review for a professor.
    """
    def post(self, request, professor_id):
        email_address = request.data.get('email_address')
        user = UserService.get_user(email_address)
        review_data = request.data

        result = ReviewService.create_review_for_professor(professor_id, user, review_data)
        
        if result["success"]:
            review = result["review"]
            return Response(
                {"message": "Review created successfully", "review_id": review.id},
                status=status.HTTP_201_CREATED
            )
        else:
            # Check if the error message is related to content moderation
            error_msg = result["error"]
            if "inappropriate" in error_msg.lower() or "toxicity" in error_msg.lower() or "profanity" in error_msg.lower() or "slurs" in error_msg.lower():
                error_msg = "Your review contains profanity. Please revise and try again."
            
            return Response(
                {"error": error_msg},
                status=status.HTTP_400_BAD_REQUEST
            )
            
class UpdateReviewAPIView(APIView):
    """
    API View to update an existing review by review_id.
    """

    def put(self, request, review_id):
        """
        Handles PUT requests to update a review.
        """
        try:
            import logging
            logging.warning(f"Received update request for review {review_id} with data: {request.data}")
            
            review = ReviewService.get_review_by_id(review_id)
            if review and 'review' not in request.data and review.review:
                modified_data = dict(request.data)
                modified_data['review'] = review.review
                result = ReviewService.update_review(review_id, modified_data)
            else:
                result = ReviewService.update_review(review_id, request.data)
            
            if result["success"]:
                review = result["review"]
                serializer = ReviewSerializer(review)
                return Response(
                    {"message": "Review updated successfully", "review": serializer.data}, 
                    status=status.HTTP_200_OK
                )
            else:
                error_msg = result["error"]
                return Response(
                    {"error": error_msg},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class DeleteReviewAPIView(APIView):
    """
    API View to delete an existing review by review_id.
    """
    
    def delete(self, request, review_id):
        """
        Calls the ReviewService to delete a review.
        """
        review = ReviewService.get_review_by_id(review_id)
        
        if not review:
            return Response(
                {"success": False, "error": "Review not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if the user has permission to delete this review
        email_address = request.data.get('email_address')
        if email_address and email_address != review.user.email_address:
            return Response(
                {"success": False, "error": "You don't have permission to delete this review"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        result = ReviewService.delete_review(review)
        return Response(result)
    
####################################
# Review Vote-Related Views and APIs #
####################################

class ReviewVotesView(APIView):
    """
    API View to get vote counts for a review.
    """
    def get(self, request, review_id):
        try:
            # Get the review
            review = ReviewService.get_review_by_id(review_id)
            
            # Count likes and dislikes
            likes = ReviewVoteService.count_votes(review, 'like')
            dislikes = ReviewVoteService.count_votes(review, 'dislike')
            
            return Response({
                'likes': likes,
                'dislikes': dislikes
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserReviewVoteView(APIView):
    """
    API View to check if a user has voted on a review.
    """
    def get(self, request, review_id):
        try:
            # Get email from query parameter
            email = request.GET.get('email')
            if not email:
                return Response({'error': 'Email required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get the user and review
            user = UserService.get_user(email)
            review = ReviewService.get_review_by_id(review_id)
            
            # Check if user has voted
            vote = ReviewVoteService.get_user_vote(user, review)
            
            if vote:
                return Response({'vote': vote.vote_type})
            else:
                return Response({'vote': None})
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SubmitReviewVoteView(APIView):
    """
    API View to submit or update a vote on a review.
    """
    def post(self, request, review_id):
        try:
            # Parse request body
            email = request.data.get('email')
            vote_type = request.data.get('vote_type')
            
            if not email or not vote_type:
                return Response({'error': 'Email and vote_type required'}, status=status.HTTP_400_BAD_REQUEST)
            
            if vote_type not in ['like', 'dislike']:
                return Response({'error': 'Vote type must be like or dislike'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get the user and review
            user = UserService.get_user(email)
            review = ReviewService.get_review_by_id(review_id)
            
            # Submit/update the vote
            result = ReviewVoteService.submit_vote(user, review, vote_type)
            
            return Response({
                'likes': result['likes'],
                'dislikes': result['dislikes'],
                'user_vote': result['user_vote']
            })
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

####################################
# Professor-Related Views and APIs #
####################################

class CourseProfessorsAPIView(APIView):
    """
    Fetch all professors for a given course (GET /api/courses/<course_id>/professors/).
    """
    def get(self, request, course_id):
        """
        Handles GET requests to fetch professors for the given course.
        """
        professors = ProfessorService.get_professors_by_course(course_id)
        serialized = ProfessorSerializer(professors, many=True)
        return Response(serialized.data, status=status.HTTP_200_OK)

class DepartmentProfessorsView(APIView):
    """
    Retrieves professors for a specific department by ID.
    """
    def get(self, request, department_id):
        """
        Fetches courses for the given department ID.
        """        
        # ForeignKey relationship from Course to Department
        professors = ProfessorService.get_professors_by_department(department_id)
        serializer = ProfessorSerializer(professors, many=True)
        return Response(serializer.data)
    
class ProfessorReviewListView(APIView):
    """
    API View to fetch professor details, their reviews, and courses taught.
    """
    def get(self, request, professor_id):
        professor = ProfessorService.get_professor(professor_id)
        reviews = ReviewService.get_reviews_by_professor_sorted(professor_id)

        courses_taught = CourseService.get_courses_by_professor(professor_id)

        professor_serializer = ProfessorSerializer(professor)
        review_serializer = ReviewSerializer(reviews, many=True)
        course_serializer = CourseSerializer(courses_taught, many=True)

        data = {
            'professor': professor_serializer.data,
            'reviews': review_serializer.data,
            'courses_taught': course_serializer.data,
        }
        return Response(data, status=status.HTTP_200_OK)

####################################
# User-Related Views and APIs #
####################################

class AddProfessorView(APIView):
    """
    API View to add a professor to a user when they add.
    """
    def post(self, request, professor_id):
        email_address = request.data.get('email_address')
        user = UserService.get_user(email_address)
        professor = ProfessorService.get_professor(professor_id)
        UserService.add_professor(user, professor)
        
        return Response(
            {
                "message": "Added Professor to Professors successfully",
                "professor_id": professor_id
            },
            status=status.HTTP_201_CREATED
        )
        
class RemoveProfessorView(APIView):
    """
    API View to remove a proffesor from a users account.
    """
    def delete(self, request, professor_id):
        email_address = request.data.get('email_address')
        user = UserService.get_user(email_address)
        professor = ProfessorService.get_professor(professor_id)

        success = UserService.remove_professor(user, professor)

        if success:
            return Response({"message": "Professor removed successfully."}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Professor was not removed from this user."}, status=status.HTTP_400_BAD_REQUEST)

class EnrollView(APIView):
    """
    API View to add a course to a user when they enroll.
    """
    def post(self, request, course_id):
        email_address = request.data.get('email_address')
        user = UserService.get_user(email_address)
        course = CourseService.get_course(course_id)
        UserService.add_course(user, course)
        
        return Response(
            {
                "message": "Enrolled in course successfully",
                "course_id": course_id
            },
            status=status.HTTP_201_CREATED
        )

class UnEnrollView(APIView):
    """
    API View to remove a course to a user when they un-enroll.
    """
    def delete(self, request, course_id):
        email_address = request.data.get('email_address')
        user = UserService.get_user(email_address)
        course = CourseService.get_course(course_id)

        success = UserService.remove_course(user, course)

        if success:
            return Response({"message": "Course removed successfully."}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "User was not enrolled in this course."}, status=status.HTTP_400_BAD_REQUEST)
        
class MyAccountView(APIView):
    def get(self, request, email_address):
        try:
            user = UserService.get_user(email_address)
            
            if not user:
                return Response(
                    {"error": "User not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
                
            data = UserSerializer(user).data
            data['university'] = user.university
            data['major'] = user.major
            data['year'] = user.year
            
            return Response(data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error in MyAccountView: {str(e)}")  
            import traceback
            print(f"Full traceback: {traceback.format_exc()}") 
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class EditAccountView(APIView):
    """
    API View to edit account information of a user.
    """
    def post(self, request):
        try:
            email_address = request.data.get('email_address')
            user = UserService.get_user(email_address=email_address)
            university = request.data.get('university')
            major = request.data.get('major')
            year = request.data.get('year')
            
            updated_user = UserService.change_account_info(
                user=user, 
                university=university,
                year=year, 
                major=major
            )
            
            return Response({
                "message": "Profile updated successfully",
                "data": {
                    "university": updated_user.university,
                    "major": updated_user.major,
                    "year": updated_user.year
                }
            })
            
        except Exception as e:
            print("Error:", str(e))  # For debugging
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class MyCoursesView(APIView):
    """
    API View to fetch courses that a user is in.
    """
    def get(self, request, email_address):
        user = UserService.get_user(email_address)
        courses = UserService.get_courses(user)
        
        serialized = CourseSerializer(courses, many=True)
        return Response(serialized.data, status=status.HTTP_200_OK)
    
class MyProfessorsView(APIView):
    """
    API View to fetch the list of professors added by a user.
    """
    def get(self, request, email_address):  # Accept email_address as a positional argument
        # Fetch the user by email address
        user = UserService.get_user(email_address)
        
        # Fetch the professors added by the user
        professors = UserService.get_professors(user)
        
        # Serialize the professors
        serializer = ProfessorSerializer(professors, many=True)
        
        # Return the serialized data
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class MyReviewsView(APIView):
    """
    API View to fetch reviews of courses that a user has made.
    """
    def get(self, request, email_address):
        user = UserService.get_user(email_address)
        
        reviews = UserService.get_reviews(user)
        serialized = ReviewSerializer(reviews, many=True)
        return Response(serialized.data, status=status.HTTP_200_OK)
    

class MyClassmatesView(APIView):
    def get(self, request, email_address, *args, **kwargs):
        user = UserService.get_user(email_address)
        
        if user is None:
            # Return a custom 404 response or a JSON error message
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        classmates = UserService.get_classmates(user)
        serialized = UserSerializer(classmates, many=True, context={'current_user': user})
        
        return Response(serialized.data, status=status.HTTP_200_OK)
    
class CoursePlanGetAPIView(APIView):
    """
    API View to get the user's course plan.
    """
    def get(self, request, email_address):
        try:
            user = UserService.get_user(email_address=email_address)
            if not user:
                return Response(
                    {"error": "User not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )

            # Initialize default course plan if none exists
            if not user.course_plan:
                user.course_plan = {
                    "semesters": []
                }
                user.save()

            return Response({
                "course_plan": user.course_plan
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CoursePlanUpdateAPIView(APIView):
    """
    API View to update the user's course plan.
    """
    def put(self, request, email_address):
        try:
            user = UserService.get_user(email_address=email_address)
            if not user:
                return Response(
                    {"error": "User not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )

            course_plan = request.data.get('course_plan')
            if not course_plan:
                return Response(
                    {"error": "No course plan provided"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            updated_user = UserService.update_course_plan(user, course_plan)
            return Response({
                "message": "Course plan updated successfully",
                "course_plan": updated_user.course_plan
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CreateUserView(APIView):
    """
    Handles user creation requests.
    """

    def post(self, request):
        try:
            email_address = request.data.get('email')
            fname = request.data.get('fname')
            lname = request.data.get('lname')
            
            if not email_address or not fname or not lname:
                print("Missing required fields")
                return Response({
                    "success": False,
                    "message": "Missing required fields.",
                    "received": {
                        "email_address": email_address,
                        "fname": fname,
                        "lname": lname
                    }
                }, status=status.HTTP_400_BAD_REQUEST)

            user = UserService.create_user(email_address, fname, lname)
            
            if user:
                print(f"User created successfully: {user}")
                return Response({
                    "success": True,
                    "message": "User created successfully.",
                    "data": {
                        "email_address": user.email_address,
                        "fname": user.fname,
                        "lname": user.lname
                    }
                }, status=status.HTTP_201_CREATED)
            else:
                print("UserService.create_user returned None")
                return Response({
                    "success": False,
                    "message": "Error creating user in database"
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print(f"Exception in CreateUserView: {str(e)}")
            import traceback
            print(f"Full traceback: {traceback.format_exc()}")
            return Response({
                "success": False,
                "message": f"Server error: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
####################################
# Course-Filtering Views and APIs #
####################################

class CourseFilteringView(APIView):
    """
    API View to dynamically filter courses based on query parameters.
    """
    
    def get(self, request):
        try:
            filters = request.query_params  # <-- Changed from request.data to request.query_params
            filtered_courses = CourseFilteringService.filter_courses(filters)
            serialized = CourseSerializer(filtered_courses, many=True)
            return Response(serialized.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

#########################
# Thread Views and APIs #
#########################

class CourseThreadsAPIView(APIView):
    """
    API View to fetch all threads related to a specific course.
    """

    def get(self, request, course_id):
        search_term = request.GET.get('search', '').strip().lower()
        include_comments = request.GET.get('include_comments', 'true').lower() == 'true'
        sort_by = request.GET.get('sort_by', 'recent')  
        filter_by = request.GET.get('filter_by', '') 
        
        print(f"Course threads request - search: '{search_term}', sort: '{sort_by}', filter: '{filter_by}', include_comments: {include_comments}")
        
        threads = ThreadService.get_threads_by_course(course_id)

        if threads is None:
            return Response({"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND)

        if search_term:
            filtered_threads = []
            
            for thread in threads:
                title_match = search_term in thread.title.lower()
                
                if title_match:
                    filtered_threads.append(thread)
                    continue
                
                if include_comments:
                    comments = CommentService.get_comments_by_thread(thread.id)
                    comment_match = any(search_term in comment.content.lower() for comment in comments if hasattr(comment, 'content'))
                    
                    if comment_match:
                        filtered_threads.append(thread)
            
            threads = filtered_threads
            
        if filter_by and filter_by.lower() != 'all':
            threads = [t for t in threads if hasattr(t, 'category') and t.category.lower() == filter_by.lower()]
            print(f"Filtered to {len(threads)} threads with category: {filter_by}")
            
        print(f"Applying sort_by: {sort_by}")
        if sort_by == 'recent':
            threads = sorted(threads, key=lambda x: x.created_at, reverse=True)
        elif sort_by == 'popular':
            thread_comments = {}
            for thread in threads:
                comments = Comment.objects.filter(thread=thread)
                thread_comments[thread.id] = list(comments)
                print(f"Thread {thread.id} has {len(thread_comments[thread.id])} comments")
            
            threads = sorted(
                threads, 
                key=lambda x: (len(thread_comments.get(x.id, [])), x.created_at.timestamp() if hasattr(x, 'created_at') else 0),
                reverse=True
            )
        elif sort_by == 'unanswered':
            thread_comments = {}
            for thread in threads:
                comments = Comment.objects.filter(thread=thread)
                thread_comments[thread.id] = list(comments)
            
            threads = sorted(
                threads, 
                key=lambda x: (len(thread_comments.get(x.id, [])), -(x.created_at.timestamp() if hasattr(x, 'created_at') else 0))
            )
        
        for thread in threads[:5]:  
            comment_count = Comment.objects.filter(thread=thread).count()
            print(f"Thread {thread.id}: '{thread.title}', category: {getattr(thread, 'category', 'N/A')}, comments: {comment_count}")

        serialized = ThreadSerializer(threads, many=True)
        return Response(serialized.data)

class ProfessorThreadsAPIView(APIView):
    """
    API View to fetch all threads related to a specific professor.
    """

    def get(self, request, professor_id):
        search_term = request.GET.get('search', '').strip().lower()
        include_comments = request.GET.get('include_comments', 'true').lower() == 'true'
        sort_by = request.GET.get('sort_by', 'recent')  # Default to recent
        filter_by = request.GET.get('filter_by', '')  # Category filter
        
        print(f"Professor threads request - search: '{search_term}', sort: '{sort_by}', filter: '{filter_by}', include_comments: {include_comments}")
        
        threads = ThreadService.get_threads_by_professor(professor_id)

        if threads is None:
            return Response({"error": "Professor not found"}, status=status.HTTP_404_NOT_FOUND)

        if search_term:
            filtered_threads = []
            
            for thread in threads:
                title_match = search_term in thread.title.lower()
                
                if title_match:
                    filtered_threads.append(thread)
                    continue
                
                if include_comments:
                    comments = CommentService.get_comments_by_thread(thread.id)                    
                    comment_match = any(search_term in comment.content.lower() for comment in comments if hasattr(comment, 'content'))
                    
                    if comment_match:
                        filtered_threads.append(thread)
            
            threads = filtered_threads
            
        if filter_by and filter_by.lower() != 'all':
            threads = [t for t in threads if hasattr(t, 'category') and t.category.lower() == filter_by.lower()]
            print(f"Filtered to {len(threads)} threads with category: {filter_by}")
            
        print(f"Applying sort_by: {sort_by}")
        if sort_by == 'recent':
            threads = sorted(threads, key=lambda x: x.created_at, reverse=True)
        elif sort_by == 'popular':
            thread_comments = {}
            for thread in threads:
                comments = Comment.objects.filter(thread=thread)
                thread_comments[thread.id] = list(comments)
                print(f"Thread {thread.id} has {len(thread_comments[thread.id])} comments")
            
            threads = sorted(
                threads, 
                key=lambda x: (len(thread_comments.get(x.id, [])), x.created_at.timestamp() if hasattr(x, 'created_at') else 0),
                reverse=True
            )
        elif sort_by == 'unanswered':
            thread_comments = {}
            for thread in threads:
                comments = Comment.objects.filter(thread=thread)
                thread_comments[thread.id] = list(comments)
            
            threads = sorted(
                threads, 
                key=lambda x: (len(thread_comments.get(x.id, [])), -(x.created_at.timestamp() if hasattr(x, 'created_at') else 0))
            )

        for thread in threads[:5]:  
            comment_count = Comment.objects.filter(thread=thread).count()
            print(f"Thread {thread.id}: '{thread.title}', category: {getattr(thread, 'category', 'N/A')}, comments: {comment_count}")

        serialized = ThreadSerializer(threads, many=True)
        return Response(serialized.data)
    
class CreateThreadAPIView(APIView):
    """
    API View to create a new thread.
    """
    def post(self, request):
        print(f"Thread creation request data: {request.data}")
        
        user = UserService.get_user(request.data.get("email_address"))
        
        if 'category' not in request.data:
            print("No category provided, using default")
            request_data = request.data.copy()
            request_data['category'] = 'general'
        else:
            request_data = request.data
            print(f"Category provided: {request_data['category']}")
        
        result = ThreadService.create_thread(user, request_data)

        if result["success"]:
            serializer = ThreadSerializer(result["thread"])
            print(f"Thread created successfully with data: {serializer.data}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        # Check if the error message is related to content moderation
        error_msg = result["error"]
        if "inappropriate" in error_msg.lower() or "toxicity" in error_msg.lower() or "profanity" in error_msg.lower() or "slurs" in error_msg.lower():
            error_msg = "Your thread title contains profanity. Please revise and try again."
        
        print(f"Thread creation failed: {error_msg}")
        return Response({"error": error_msg}, status=status.HTTP_400_BAD_REQUEST)

class UpdateThreadAPIView(APIView):
    """
    API View to update an existing thread.
    """

    def put(self, request, thread_id):
        result = ThreadService.update_thread(thread_id, request.data)

        if result["success"]:
            serializer = ThreadSerializer(result["thread"])
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        # Check if the error message is related to content moderation
        error_msg = result["error"]
        if "inappropriate" in error_msg.lower() or "toxicity" in error_msg.lower() or "profanity" in error_msg.lower() or "slurs" in error_msg.lower():
            error_msg = "Your thread title contains profanity. Please revise and try again."
        
        return Response({"error": error_msg}, status=status.HTTP_400_BAD_REQUEST)

class DeleteThreadAPIView(APIView):
    """
    API View to delete an existing thread.
    """

    def delete(self, request, thread_id):
        result = ThreadService.delete_thread(thread_id)

        if result["success"]:
            return Response({"message": result["message"]}, status=status.HTTP_200_OK)
        
        return Response({"error": result["error"]}, status=status.HTTP_400_BAD_REQUEST)

class ThreadSearchAPIView(APIView):
    """
    A unified API view for searching threads across different contexts
    with advanced filtering and sorting capabilities.
    """
    def get(self, request):
        search_term = request.GET.get('search', '').strip()
        context_type = request.GET.get('context_type')
        context_id = request.GET.get('context_id')
        sort_by = request.GET.get('sort_by', 'recent')
        category = request.GET.get('category')
        include_comments = request.GET.get('include_comments', 'true').lower() == 'true'
        
        if not context_type or not context_id:
            return Response(
                {"error": "Context type and ID are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if context_type == 'course':
            threads = ThreadService.get_threads_by_course(context_id)
        elif context_type == 'professor':
            threads = ThreadService.get_threads_by_professor(context_id)
        else:
            return Response(
                {"error": "Invalid context type"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if search_term:
            filtered_threads = []
            
            for thread in threads:
                title_match = search_term.lower() in thread.title.lower()
                
                if title_match:
                    filtered_threads.append(thread)
                    continue
                
                if include_comments:
                    comments = CommentService.get_comments_by_thread(thread.id)
                    comment_match = any(search_term.lower() in comment.content.lower() for comment in comments if hasattr(comment, 'content'))
                    
                    if comment_match:
                        filtered_threads.append(thread)
            
            threads = filtered_threads
        
        if category:
            threads = [
                thread for thread in threads 
                if thread.category.lower() == category.lower()
            ]
        
        if sort_by == 'recent':
            threads = sorted(
                threads, 
                key=lambda x: x.created_at, 
                reverse=True
            )
        elif sort_by == 'popular':
            threads = sorted(
                threads, 
                key=lambda x: len(x.comments), 
                reverse=True
            )
        elif sort_by == 'unanswered':
            threads = sorted(
                threads, 
                key=lambda x: len(x.comments)
            )
        
        serialized = ThreadSerializer(threads, many=True)
        return Response({
            'threads': serialized.data,
            'total_count': len(threads)
        })
        
class CategoryCountsView(APIView):
    """
    View to get the category counts for a specific course.
    """
    def get(self, request, course_id):
        # Call the service to get category counts
        category_counts = ThreadService.get_category_counts(course_id)
        return JsonResponse(category_counts)
    
##########################
# Comment Views and APIs #
##########################
    
class ThreadCommentsAPIView(APIView):
    """
    API View to fetch all comments related to a specific thread.
    """
    def get(self, request, thread_id):
        try:
            # Get comments for the thread
            thread = ThreadService.get_thread_by_id(thread_id)
            if not thread:
                return Response({"error": "Thread not found"}, status=status.HTTP_404_NOT_FOUND)
            
            comments = CommentService.get_comments_by_thread(thread_id)
            
            sorted_comments = CommentService.sort_comments_by_popularity(comments)
            
            email = request.GET.get('email')
            if email:
                request.user_email = email
                
            serializer = CommentSerializer(sorted_comments, many=True, context={'request': request})
            return Response(serializer.data)
        
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class CreateCommentAPIView(APIView):
    """
    API View to create a new comment.
    """

    def post(self, request, thread_id):
        comment_data = request.data.copy()
        comment_data['thread_id'] = thread_id

        result = CommentService.create_comment(comment_data)

        if result["success"]:
            serializer = CommentSerializer(result["comment"])
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        # Check if the error message is related to content moderation
        error_msg = result["error"]
        if "inappropriate" in error_msg.lower() or "toxicity" in error_msg.lower() or "profanity" in error_msg.lower() or "slurs" in error_msg.lower():
            error_msg = "Your comment contains profanity. Please revise and try again."
        
        return Response({"error": error_msg}, status=status.HTTP_400_BAD_REQUEST)

class UpdateCommentAPIView(APIView):
    """
    API View to update an existing comment.
    """

    def put(self, request, comment_id):
        result = CommentService.update_comment(comment_id, request.data)

        if result["success"]:
            serializer = CommentSerializer(result["comment"])
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        # Check if the error message is related to content moderation
        error_msg = result["error"]
        if "inappropriate" in error_msg.lower() or "toxicity" in error_msg.lower() or "profanity" in error_msg.lower() or "slurs" in error_msg.lower():
            error_msg = "Your comment contains profanity. Please revise and try again."
        
        return Response({"error": error_msg}, status=status.HTTP_400_BAD_REQUEST)


class DeleteCommentAPIView(APIView):
    """
    API View to delete an existing comment.
    """

    def delete(self, request, comment_id):
        result = CommentService.delete_comment(comment_id)

        if result["success"]:
            return Response({"message": result["message"]}, status=status.HTTP_200_OK)
        
        return Response({"error": result["error"]}, status=status.HTTP_400_BAD_REQUEST)
    
class CommentUpvotesView(APIView):
    """
    API View to get upvote count for a comment.
    """
    def get(self, request, comment_id):
        try:
            comment = CommentService.get_comment_by_id(comment_id)
            if not comment:
                return Response({'error': 'Comment not found'}, status=status.HTTP_404_NOT_FOUND)
                
            upvotes = CommentUpvoteService.count_upvotes(comment)
            
            return Response({
                'upvotes': upvotes
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserCommentUpvoteView(APIView):
    """
    API View to check if a user has upvoted a comment.
    """
    def get(self, request, comment_id):
        try:
            email = request.GET.get('email')
            if not email:
                return Response({'error': 'Email required'}, status=status.HTTP_400_BAD_REQUEST)
            
            user = UserService.get_user(email)
            comment = CommentService.get_comment_by_id(comment_id)
            if not comment:
                return Response({'error': 'Comment not found'}, status=status.HTTP_404_NOT_FOUND)
                
            upvote = CommentUpvoteService.get_user_upvote(user, comment)
            
            return Response({
                'upvoted': upvote is not None
            })
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ToggleCommentUpvoteView(APIView):
    """
    API View to toggle an upvote on a comment.
    """
    def post(self, request, comment_id):
        try:
            email = request.data.get('email')
            print(f"Received upvote request for comment {comment_id} from email: {email}")
            
            if not email:
                return Response({'error': 'Email required'}, status=status.HTTP_400_BAD_REQUEST)
            
            user = UserService.get_user(email)
            comment = CommentService.get_comment_by_id(comment_id)
            
            if not comment:
                return Response({'error': 'Comment not found'}, status=status.HTTP_404_NOT_FOUND)
            
            existing = CommentUpvoteService.get_user_upvote(user, comment)
            print(f"User {email} has existing upvote: {existing is not None}")
            
            result = CommentUpvoteService.toggle_upvote(user, comment)
            print(f"Toggle result: {result}")
            
            return Response({
                'upvotes': result['upvotes'],
                'user_upvoted': result['user_upvoted']
            })
            
        except Exception as e:
            import traceback
            print(f"Error in ToggleCommentUpvoteView: {str(e)}")
            print(traceback.format_exc())
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TranscriptUploadView(APIView):
    def post(self, request):
        if 'file' not in request.FILES:
            return JsonResponse(
                {'error': 'No file provided'}, 
                status=400
            )
            
        try:
            # Get user from email in request data
            email_address = request.data.get('email_address')
            if not email_address:
                return JsonResponse(
                    {'error': 'No email address provided'}, 
                    status=400
                )
            
            user = UserService.get_user(email_address)
            if not user:
                return JsonResponse(
                    {'error': 'User not found'}, 
                    status=404
                )
            
            file = request.FILES['file']
            print(f"Processing file: {file.name}, type: {file.content_type}, size: {file.size}")
            
            if not file.content_type.startswith(('image/', 'application/pdf')):
                return JsonResponse(
                    {'error': f'Unsupported file type: {file.content_type}'}, 
                    status=400
                )
            
            # Don't update user's course plan, just detect courses
            # Explicitly pass update_plan=False
            courses = TranscriptService.process_transcript(file, file.content_type, user=None, update_plan=False)
            print(f"Found {len(courses)} courses in transcript")
            
            if not courses:
                return JsonResponse(
                    {'courses': []}, 
                    status=200  # Return empty array instead of 404
                )
                
            # Send the courses back to the client
            return JsonResponse({
                'courses': courses,
                'message': 'Courses detected in your transcript. Please select the ones you want to add to your plan.'
            }, status=200)
            
        except Exception as e:
            import traceback
            print(f"Error processing transcript: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            return JsonResponse(
                {'error': str(e)}, 
                status=500
            )

class GetReviewAPIView(APIView):
    """
    API View to get a single review by ID.
    """
    def get(self, request, review_id):
        """
        Handles GET requests to fetch a specific review.
        """
        try:
            review = ReviewService.get_review_by_id(review_id)
            
            if not review:
                return Response(
                    {"error": "Review not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            email = request.GET.get('email')
            
            print(f"GetReviewAPIView - Email from request: {email}")
            print(f"GetReviewAPIView - Review author: {review.user.email_address}")
            
            if email and email != "null" and email != review.user.email_address:
                return Response(
                    {"error": "You don't have permission to access this review"},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            serializer = ReviewSerializer(review)
            return Response(
                serializer.data, 
                status=status.HTTP_200_OK
            )
        except Exception as e:
            print(f"Error in GetReviewAPIView: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CreateStudyBuddyRequestView(APIView):
    """
    API View to create a new study buddy request.
    """
    def post(self, request):
        try:
            sender_email = request.data.get('sender_email')
            receiver_id = request.data.get('receiver_id')
            course = request.data.get('course')
            message = request.data.get('message')
            
            if not all([sender_email, receiver_id, course, message]):
                return Response(
                    {"error": "Missing required fields"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            result = StudyBuddyService.create_request(
                sender_email=sender_email,
                receiver_id=receiver_id,
                course_name=course,
                message=message
            )
            
            if result["success"]:
                return Response(
                    {"message": "Study buddy request sent successfully", "data": result["request"]},
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {"error": result["error"]},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            print(f"Error creating study buddy request: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class GetStudyBuddyRequestsView(APIView):
    """
    API View to get all study buddy requests for a user.
    """
    def get(self, request, email_address):
        try:
            result = StudyBuddyService.get_requests_by_user(email_address)
            
            if result["success"]:
                return Response(
                    {
                        "sent_requests": result["sent_requests"],
                        "received_requests": result["received_requests"]
                    },
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {"error": result["error"]},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            print(f"Error fetching study buddy requests: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UpdateStudyBuddyRequestView(APIView):
    """
    API View to update the status of a study buddy request.
    """
    def put(self, request, request_id):
        try:
            new_status = request.data.get('status')
            
            if not new_status:
                return Response(
                    {"error": "Missing status field"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            result = StudyBuddyService.update_request_status(
                request_id=request_id,
                new_status=new_status
            )
            
            if result["success"]:
                return Response(
                    {"message": f"Study buddy request {new_status}", "data": result["request"]},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {"error": result["error"]},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            print(f"Error updating study buddy request: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class StudyBuddyMessagesView(APIView):
    """
    API View to get messages for a study buddy request.
    """
    def get(self, request, request_id):
        try:
            result = StudyBuddyService.get_messages(request_id)
            
            if result["success"]:
                return Response(
                    {"messages": result["messages"]},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {"error": result["error"]},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            print(f"Error fetching study buddy messages: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
class SendStudyBuddyMessageView(APIView):
    """
    API View to send a message to a study buddy.
    """
    def post(self, request, request_id):
        try:
            sender_email = request.data.get('sender_email')
            receiver_id = request.data.get('receiver_id')
            content = request.data.get('content')
            
            if not all([sender_email, receiver_id, content]):
                return Response(
                    {"error": "Missing required fields"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            result = StudyBuddyService.send_message(
                sender_email=sender_email,
                receiver_id=receiver_id,
                request_id=request_id,
                content=content
            )
            
            if result["success"]:
                return Response(
                    {"message": "Message sent successfully", "data": result["message"]},
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {"error": result["error"]},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            print(f"Error sending study buddy message: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
class MarkMessagesAsReadView(APIView):
    """
    API View to mark messages as read.
    """
    def post(self, request, request_id):
        try:
            user_email = request.data.get('user_email')
            
            if not user_email:
                return Response(
                    {"error": "Missing user_email field"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            result = StudyBuddyService.mark_messages_as_read(
                user_email=user_email,
                request_id=request_id
            )
            
            if result["success"]:
                return Response(
                    {"message": f"Marked {result['count']} messages as read"},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {"error": result["error"]},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            print(f"Error marking messages as read: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class MessageUpdatesSSEView(APIView):
    """
    Server-Sent Events (SSE) API for real-time message updates.
    """
    def get(self, request, email_address):
        # Set response headers for SSE
        response = StreamingHttpResponse(
            streaming_content=self.event_stream(email_address),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'  # For Nginx
        return response
    
    def event_stream(self, email_address):
        """Generate SSE events for message updates."""
        last_check = {}
        user_status = {}
        last_status_update = 0
        
        try:
            user = UserService.get_user(email_address)
            if user:
                user_id = user.id
                last_ping = time.time()
                
                while True:
                    current_time = time.time()
                    
                    result = StudyBuddyService.get_unread_message_count(email_address)
                    
                    if result["success"]:
                        current_state = json.dumps(result["unread_counts"])
                        if current_state != last_check.get('unread_counts'):
                            last_check['unread_counts'] = current_state
                            
                            data = {
                                'event': 'message_update',
                                'unread_counts': result["unread_counts"],
                                'sender_info': result["sender_info"],
                                'timestamp': int(current_time)
                            }
                            
                            yield f"event: message_update\ndata: {json.dumps(data)}\n\n"
                    
                    if current_time - last_ping > 15:  # Every 15 seconds
                        ping_data = {
                            'timestamp': int(current_time)
                        }
                        yield f"event: ping\ndata: {json.dumps(ping_data)}\n\n"
                        last_ping = current_time
                    
                    if current_time - last_status_update > 30:
                        buddy_requests = StudyBuddyService.get_buddy_status_updates(email_address)
                        if buddy_requests["success"]:
                            statuses = {}
                            for buddy in buddy_requests.get("buddies", []):
                                import random
                                status = "online" if random.random() > 0.3 else "offline"
                                statuses[buddy["id"]] = {
                                    "status": status,
                                    "last_active": int(current_time - random.randint(0, 3600))
                                }
                            
                            status_data = {
                                "buddies": statuses
                            }
                            
                            yield f"event: status_update\ndata: {json.dumps(status_data)}\n\n"
                            last_status_update = current_time
                    
                    time.sleep(3)
                
        except Exception as e:
            print(f"SSE connection closed: {str(e)}")
            
            yield f"event: error\ndata: Connection closed\n\n"