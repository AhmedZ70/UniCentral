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

from django.urls import path
from . import views
from .views import (
    DepartmentListCreateView,
    DepartmentDetailView,
    CourseListCreateView,
    CourseDetailView,
    CourseFilteringCreateView,
    ProfessorListCreateView,
    ReviewListCreateView,
    DepartmentCoursesView,
    CreateUserView,
    home,
    courses,
    signup_page,
    login_page,
    course_detail,
    my_classmates
)

urlpatterns = [
    path('', home, name='home'),  # Home page route (renders index.html)
    path('signup/', signup_page, name='signup'),
    path('login/', login_page, name='login'),
    path('courses/', courses, name='courses'),  # Render courses.html (user-facing view)
    path('courses/<int:course_id>/', course_detail, name='course-detail'),  # New route for course detail page

    path('my_classmates/', my_classmates, name='my_classmates'),
    
    # API URLs
    path('api/departments/', DepartmentListCreateView.as_view(), name='department-list'),
    path('api/departments/<int:pk>/', DepartmentDetailView.as_view(), name='department-detail'),
    path('api/courses/', CourseListCreateView.as_view(), name='course-list'),
    path('api/courses/<int:pk>/', CourseDetailView.as_view(), name='course-detail'),
    path('api/professors/', ProfessorListCreateView.as_view(), name='professor-list'),
    path('api/reviews/', ReviewListCreateView.as_view(), name='review-list'),
    path('api/course_filtering/', CourseFilteringCreateView.as_view(), name='course_filtering'),
    path('api/create_user/', views.CreateUserView.create_user, name='create_user'),
    
    # Department courses URL
    path('api/departments/<int:department_id>/courses/', DepartmentCoursesView.as_view(), name='department-courses'),
]
