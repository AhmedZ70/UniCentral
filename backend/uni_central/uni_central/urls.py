"""
URL configuration for uni_central project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

# uni_central/urls.py
# uni_central/urls.py
from django.urls import path
from . import views
from .views import (
    DepartmentListCreateView,
    DepartmentDetailView,
    CourseListCreateView,
    CourseDetailView,
    ProfessorListCreateView,
    ReviewListCreateView,
    DepartmentCoursesView,  # Import the DepartmentCoursesView
    home,
    courses,
    signup_page,
    login_page
)

urlpatterns = [
    path('', home, name='home'),  # Home page route (renders index.html)
    path('signup/', signup_page, name='register_signup'),
    path('login/', login_page, name='register_login'),
    path('courses/', courses, name='courses'),  # Render courses.html (user-facing view)
    
    # API URLs
    path('api/departments/', DepartmentListCreateView.as_view(), name='department-list'),
    path('api/departments/<int:pk>/', DepartmentDetailView.as_view(), name='department-detail'),
    path('api/courses/', CourseListCreateView.as_view(), name='course-list'),  # API route for courses
    path('api/courses/<int:pk>/', CourseDetailView.as_view(), name='course-detail'),
    path('api/professors/', ProfessorListCreateView.as_view(), name='professor-list'),
    path('api/reviews/', ReviewListCreateView.as_view(), name='review-list'),
    
    # Department courses URL
    path('api/departments/<int:department_id>/courses/', DepartmentCoursesView.as_view(), name='department-courses'),
]
