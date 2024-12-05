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

# API Views for Departments
class DepartmentListCreateView(generics.ListCreateAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

# API Views for Courses
class CourseListCreateView(generics.ListCreateAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

# API Views for Professors
class ProfessorListCreateView(generics.ListCreateAPIView):
    queryset = Professor.objects.all()
    serializer_class = ProfessorSerializer

# API Views for Reviews
class ReviewListCreateView(generics.ListCreateAPIView):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
