from rest_framework import generics
from django.shortcuts import render, get_object_or_404
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from .models import Department, User, Course, Professor, Review
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
    return render(request, 'register_signup.html')

# Render Login Page
def login_page(request):
    return render(request, 'register_login.html')

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