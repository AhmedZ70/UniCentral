from django.shortcuts import render, get_object_or_404
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from .models import User
from .services import (
    UserService,
    DepartmentService,
    CourseService, 
    ReviewService, 
    ProfessorService
    )
from .serializers import (
    DepartmentSerializer,
    UserSerializer,
    CourseSerializer,
    ProfessorSerializer,
    ReviewSerializer,
)

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

def my_classmates(request):
    """
    Render the My Classmates page.
    """
    return render(request, 'my_classmates.html')

def courses(request):
    """
    Render the Courses page.
    """
    return render(request, 'courses.html')

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

def review_form_page(request, course_id):
    """
    Renders an empty form (no DB lookups).
    The frontend will fetch the professors and other course data via API.
    """
    context = {
        'course_id': course_id,
    }
    return render(request, 'review_form.html', context)

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
        reviews = ReviewService.get_reviews_by_course(course_id)

        # Serialize data
        course_serializer = CourseSerializer(course)
        review_serializer = ReviewSerializer(reviews, many=True)

        # Combine data
        data = {
            'course': course_serializer.data,
            'reviews': review_serializer.data
        }
        return Response(data, status=status.HTTP_200_OK)
            
####################################
# Review-Related Views and APIs #
####################################

class CreateReviewAPIView(APIView):
    """
    Handle the creation of a Review for a given course (POST).
    """
    def post(self, request, course_id):
        # Identify the user. 
        # If unauthenticated, fallback to a default user with ID=1, or raise 404 if not found.
        # Parse email from request.
        # email_address = request.email
        # user = UserService.get_user(email_address)
        user = request.user if request.user.is_authenticated else get_object_or_404(User, id=1)

        # Delegate review creation to the service layer
        review = ReviewService.create_review(course_id, user, request.data)

        return Response(
            {
                "message": "Review created successfully",
                "review_id": review.id
            },
            status=status.HTTP_201_CREATED
        )

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
    
####################################
# User-Related Views and APIs #
####################################
    
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