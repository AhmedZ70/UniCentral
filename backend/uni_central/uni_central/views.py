from django.shortcuts import render, get_object_or_404, redirect
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from .models import Comment
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

# API View for Getting Courses in a Specific Department
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
        # Use service layer to retrieve data
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

        try:
            review = ReviewService.create_review_for_course(course_id, user, review_data)
            return Response(
                {"message": "Review created successfully", "review_id": review.id},
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
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

        try:
            review = ReviewService.create_review_for_professor(professor_id, user, review_data)
            return Response(
                {"message": "Review created successfully", "review_id": review.id},
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

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

        try:
            review = ReviewService.create_review_for_course(course_id, user, review_data)
            return Response(
                {"message": "Review created successfully", "review_id": review.id},
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
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

        try:
            review = ReviewService.create_review_for_professor(professor_id, user, review_data)
            return Response(
                {"message": "Review created successfully", "review_id": review.id},
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
            
class UpdateReviewAPIView(APIView):
    """
    API View to update an existing review by review_id.
    """
    def put(self, request, review_id=None):
        """
        Handles PUT requests to update a review.
        Accepts review_id from the URL or from request.data.
        """
        try:
            print(f"Update request data: {request.data}")

            # Prefer review_id from URL, fallback to request data
            review_id = review_id or request.data.get('review_id')
            print(f"Using review_id: {review_id}")

            if not review_id:
                return Response({"error": "Review ID is required"}, status=status.HTTP_400_BAD_REQUEST)

            result = ReviewService.update_review(review_id, request.data)

            if isinstance(result, dict) and not result.get("success"):
                error_msg = result.get("error", "Unknown error")
                if any(word in error_msg.lower() for word in ["inappropriate", "toxicity", "profanity", "slurs"]):
                    error_msg = "Your review contains profanity. Please revise and try again."

                return Response({"error": error_msg}, status=status.HTTP_400_BAD_REQUEST)

            review = result["review"] if isinstance(result, dict) else result
            serializer = ReviewSerializer(review)
            return Response(
                {"message": "Review updated successfully", "review": serializer.data},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            import traceback
            error_traceback = traceback.format_exc()
            print(f"Error updating review: {str(e)}")
            print(error_traceback)

            return Response({
                "error": str(e),
                "traceback": error_traceback.split("\n")  # Helpful during development
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class UserCourseReviewsAPIView(APIView):
    """
    API View to get all course reviews by a specific user.
    """
    def get(self, request):
        email = request.GET.get('email')
        if not email:
            return Response({"error": "Email parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = UserService.get_user(email)
            reviews = ReviewService.get_user_reviews(user)
            serializer = ReviewSerializer(reviews, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserProfessorReviewsAPIView(APIView):
    """
    API View to get all professor reviews by a specific user.
    """
    def get(self, request):
        email = request.GET.get('email')
        if not email:
            return Response({"error": "Email parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = UserService.get_user(email)
            reviews = ReviewService.get_user_professor_reviews(user)
            serializer = ReviewSerializer(reviews, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        
class CourseReviewFormView(APIView):
    def get(self, request, context_id=None, review_id=None):
        if review_id:
            review = ReviewService.get_review_by_id(review_id)
            course = review.course
            rating = review.rating
            difficulty = review.difficulty
            grade = review.grade
            estimated_hours = review.estimated_hours
            
            # Pre-fill with existing data
            context = {
                'course': course,
                'review': review,
                'grade': grade,
                'rating': rating,
                'difficulty': difficulty,
                'estimates_hours': estimated_hours,
                'is_edit': True,
                'form_action': f'/api/reviews/{review_id}/update/'
            }
        else:
            course = CourseService.get_course_by_id(context_id)
            
            context = {
                'course': course,
                'is_edit': False,
                'form_action': f'/api/reviews/{context_id}/update/'
            }
        return render(request, 'course_review_form.html', context)
    
class ProfessorReviewFormView(APIView):
    def get(self, request, context_id=None, review_id=None):
        if review_id:
            review = ReviewService.get_review_by_id(review_id)
            professor = review.professor
            rating = review.rating
            difficulty = review.difficulty
            grade = review.grade
            estimated_hours = review.estimated_hours
            
            # Pre-fill form with existing data
            context = {
                'professor': professor,
                'review': review,
                'grade': grade,
                'rating': rating,
                'difficulty': difficulty,
                'estimates_hours': estimated_hours,
                'is_edit': True,
                'form_action': f'/api/reviews/{review_id}/update/'
            }
        else:
            course = ProfessorService.get_professor_by_id(context_id)
            
            context = {
                'professor': professor,
                'is_edit': False,
                'form_action': f'/api/reviews/{context_id}/update/'
            }
            
        return render(request, 'review_form.html', context)
        
class EditCourseReviewView(APIView):
    def get(self, request, review_id):
        try:
            review = ReviewService.get_review_by_id(review_id)
            course = review.course
            
            context = {
                'course': course,
                'course_id': course.id,
                'review': review,
                'is_edit': True,
                'context_type': 'course' 
            }
            
            return render(request, 'edit_review.html', context)
        except Exception as e:
            print(f"Error editing review {review_id}: {str(e)}")
            import traceback
            print(traceback.format_exc())
            return redirect('my_reviews')

class EditProfessorReviewView(APIView):
    def get(self, request, review_id):
        try:
            review = ReviewService.get_review_by_id(review_id)
            professor = review.professor
            
            context = {
                'professor': professor,
                'professor_id': professor.id,  
                'review': review,
                'is_edit': True,
                'context_type': 'professor' 
            }
            
            return render(request, 'edit_review.html', context)
        except Exception as e:
            return redirect('my_reviews')

class DeleteReviewAPIView(APIView):
    """
    API View to delete an existing review by review_id.
    """
    
    def delete(self, request):
        """
        Calls the ReviewService to delete a review.
        """
        review_id = request.data.get('review_id')
        review = ReviewService.get_review_by_id(review_id)
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
            
            user = UserService.get_user(email)
            review = ReviewService.get_review_by_id(review_id)
            
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
        
        print(f"Thread creation failed: {result['error']}")
        return Response({"error": result["error"]}, status=status.HTTP_400_BAD_REQUEST)

class UpdateThreadAPIView(APIView):
    """
    API View to update an existing thread.
    """

    def put(self, request, thread_id):
        result = ThreadService.update_thread(thread_id, request.data)

        if result["success"]:
            serializer = ThreadSerializer(result["thread"])
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response({"error": result["error"]}, status=status.HTTP_400_BAD_REQUEST)

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
        
        return Response({"error": result["error"]}, status=status.HTTP_400_BAD_REQUEST)

class UpdateCommentAPIView(APIView):
    """
    API View to update an existing comment.
    """

    def put(self, request, comment_id):
        result = CommentService.update_comment(comment_id, request.data)

        if result["success"]:
            serializer = CommentSerializer(result["comment"])
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response({"error": result["error"]}, status=status.HTTP_400_BAD_REQUEST)


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
            
            if not file.content_type.startswith(('image/', 'application/pdf', 'text/csv')):
                return JsonResponse(
                    {'error': f'Unsupported file type: {file.content_type}'}, 
                    status=400
                )
            
            # Pass user to process_transcript
            courses = TranscriptService.process_transcript(file, file.content_type, user)
            print(f"Found {len(courses)} courses in transcript")
            
            if not courses:
                return JsonResponse(
                    {'courses': []}, 
                    status=200  # Return empty array instead of 404
                )
                
            return JsonResponse({
                'courses': courses,
                'message': 'Courses have been added to your course plan'
            }, status=200)
            
        except Exception as e:
            import traceback
            print(f"Error processing transcript: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            return JsonResponse(
                {'error': str(e)}, 
                status=500
            )