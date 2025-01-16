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
    DepartmentListView,
    DepartmentCoursesView,
    CourseReviewListView,
    CreateReviewAPIView,
    CourseProfessorsAPIView,
    home,
    courses,
    signup_page,
    login_page,
    course_detail,
    review_form_page,
    my_classmates
)

urlpatterns = [
    path('', home, name='home'),  # Home page route (renders index.html)
    path('signup/', signup_page, name='signup'),
    path('login/', login_page, name='login'),
    path('courses/', courses, name='courses'),  # Render courses.html (user-facing view)
    path('courses/<int:course_id>/', course_detail, name='course-detail'),  # New route for course detail page
    path('courses/<int:course_id>/review/', review_form_page, name='review-form-page'),

    path('my_classmates/', my_classmates, name='my_classmates'),
    
    ############
    # API URLs #
    ############
    
    # Department URLsç
    path('api/departments/', DepartmentListView.as_view(), name='department-list'),
    
    # Course URLs
    path('api/departments/<int:department_id>/courses/', DepartmentCoursesView.as_view(), name='department-courses'),
    path('api/courses/<int:course_id>/reviews/', CourseReviewListView.as_view(), name='course-reviews'),
    path('api/courses/<int:course_id>/reviews/create/', CreateReviewAPIView.as_view(), name='api-review-create'),
    
    # an endpoint to fetch professors for a given course:
    path('api/courses/<int:course_id>/professors/', CourseProfessorsAPIView.as_view(), name='course-professors'),

    path('api/create_user/', views.CreateUserView.as_view(), name='create_user'),
     
]
