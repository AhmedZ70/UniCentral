from rest_framework import generics
from django.shortcuts import render, get_object_or_404
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from django.shortcuts import redirect
from django.http import HttpResponseBadRequest
from .models import Department, User, Course, Professor, Review
from .services import UserService, ReviewService
from .serializers import (
    DepartmentSerializer,
    UserSerializer,
    CourseSerializer,
    ProfessorSerializer,
    ReviewSerializer,
)

# Render Home Page
def home(request):
    return render(request, 'index.html')

# Render Signup Page
def signup_page(request):
    return render(request, 'signup.html')

# Render Login Page
def login_page(request):
    return render(request, 'login.html')

# Render Courses Page
def courses(request):
    return render(request, 'courses.html')

# Render Course Detail Page with Reviews
def course_detail(request, course_id):
    # Get the specific course and related reviews
    course = get_object_or_404(Course, id=course_id)
    reviews = Review.objects.filter(course=course)

    # Pass course and reviews to the template context
    context = {
        'course': course,
        'reviews': reviews,
    }
    return render(request, 'course_detail.html', context)


def create_review(request, course_id):
    course = get_object_or_404(Course, id=course_id)
    professors = course.professors.all()  # Fetch professors related to the course

    if request.method == 'POST':
        user = request.user if request.user.is_authenticated else get_object_or_404(User, id=1)

        professor_id = request.POST.get('professor')
        professor = get_object_or_404(Professor, id=professor_id) if professor_id else None

        review_text = request.POST.get('review')
        rating = request.POST.get('rating')
        difficulty = request.POST.get('difficulty')
        estimated_hours = request.POST.get('estimated_hours')
        grade = request.POST.get('grade')

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

        return redirect('course-detail', course_id=course_id)

    return render(request, 'review_form.html', {'course': course, 'professors': professors})

# API View for Getting Courses in a Specific Department
class DepartmentCoursesView(APIView):
    def get(self, request, department_id):
        department = get_object_or_404(Department, id=department_id)
        courses = department.courses.all()  # Assuming a ForeignKey relationship from Course to Department
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

# API View for Getting Reviews for a Specific Course
class CourseReviewsView(APIView):
    def get(self, request, course_id):
        course = get_object_or_404(Course, id=course_id)
        reviews = Review.objects.filter(course=course)
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class CreateUserView(APIView):
    @api_view(['POST'])
    def create_user(request):
        """
        Endpoint to create a new user.
        """
        if request.method == 'POST':
            # Retrieve user data from the request body
            email = request.data.get('email')
            fname = request.data.get('fname')
            lname = request.data.get('lname')

            # Validate that necessary fields are provided
            if not email or not fname or not lname:
                return Response({"error": "Missing required fields."}, status=status.HTTP_400_BAD_REQUEST)

            # Create the user using the UserService
            user = UserService.create_user(email, fname, lname)

            if user:
                serializer = UserSerializer(user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response({"error": "Error creating user."}, status=status.HTTP_400_BAD_REQUEST)


# Departments pages
class DepartmentListCreateView(generics.ListCreateAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

# Course pages
class CourseListCreateView(generics.ListCreateAPIView):
    """
    API View for returning course list view
    """
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API View for returning course detail view
    """
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

# Professor page
class ProfessorListCreateView(generics.ListCreateAPIView):
    """
    API View for returning professor list view
    """
    queryset = Professor.objects.all()
    serializer_class = ProfessorSerializer

# Review page
class ReviewListCreateView(generics.ListCreateAPIView):
    """
    API View for returning review list view.
    """
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    
class CreateReviewView(APIView):
    def create_review(request):
        """
        Creates a review for a course, and updates the course's avg_rating and avg_difficulty.
        """
        if request.method == 'POST':
            try:
                data = request.POST  # Retrieve data from the request body

                # Extract the necessary data from the request
                user = request.user  # Assuming the user is authenticated
                course_id = data.get('course_id')
                professor_id = data.get('professor_id')
                review_text = data.get('review')
                rating = float(data.get('rating'))
                difficulty = int(data.get('difficulty'))
                estimated_hours = float(data.get('estimated_hours', 0))  # Optional
                grade = data.get('grade', '')  # Optional

                # Get the course and professor objects
                course = get_object_or_404(Course, id=course_id)
                professor = get_object_or_404(Professor, id=professor_id) if professor_id else None

                # Create the review using ReviewService
                review = ReviewService.create_review(
                    user=user,
                    course=course,
                    rating=rating,
                    difficulty=difficulty,
                    professor=professor,
                    review=review_text,
                    estimated_hours=estimated_hours,
                    grade=grade
                )

                # If review creation was successful, return success response
                if review:
                    return Response({"message": "Review created successfully."}, status=201)
                else:
                    return Response({"message": "Error creating review."}, status=400)

            except Exception as e:
                return Response({"message": f"Error creating review: {e}"}, status=400)

        else:
            return Response({"message": "Invalid request method."}, status=405)

# Course Filtering page
class CourseFilteringCreateView(generics.ListAPIView):
    """
    API View for filtering courses based on query parameters.
    """
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

    def get_queryset(self):
        """
        Dynamically filters courses based on query parameters.
        """
        queryset = super().get_queryset()
        department_code = self.request.query_params.get('department', None)
        min_number = self.request.query_params.get('min_number', None)
        max_number = self.request.query_params.get('max_number', None)
        title_contains = self.request.query_params.get('title', None)
        min_difficulty = self.request.query_params.get('min_difficulty', None)
        max_difficulty = self.request.query_params.get('max_difficulty', None)
        min_rating = self.request.query_params.get('min_rating', None)
        max_rating = self.request.query_params.get('max_rating', None)
        credits = self.request.query_params.get('credits', None)
        semester = self.request.query_params.get('semester', None)
        professor_name = self.request.query_params.get('professor', None)

        # Apply filters dynamically
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