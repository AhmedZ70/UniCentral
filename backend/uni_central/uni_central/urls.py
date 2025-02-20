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
from .views import (
    DepartmentListView,
    DepartmentCoursesView,
    CourseReviewListView,
    CreateReviewAPIView,
    CourseProfessorsAPIView,
    DepartmentProfessorsView,
    CreateUserView,
    ProfessorReviewListView,
    CreateProfessorReviewAPIView,
    CourseFilteringView,
    ProfessorCoursesAPIView,
    EnrollView,
    UnEnrollView,
    MyCoursesView,
    MyProfessorsView,
    MyReviewsView,
    MyClassmatesView,
    UserDetailsView,
    home,
    courses,
    about_page,
    signup_page,
    login_page,
    course_detail,
    review_form_page,
    professors,
    course_filtering,
    my_account,
    my_courses,
    my_professors,
    my_classmates,
    my_reviews,
    course_planner, 
    professor_detail,
)

urlpatterns = [
    path('', home, name='home'),  # Home page route (renders index.html)
    path('signup/', signup_page, name='signup'),
    path('login/', login_page, name='login'),
    path('courses/', courses, name='courses'),  # Render courses.html (user-facing view)
    path('courses/<int:course_id>/', course_detail, name='course-detail'), 


    path(
        'courses/<int:context_id>/review/',
        review_form_page,
        {'context_type': 'course'},
        name='course-review-form'
    ),
    path(
        'professors/<int:context_id>/review/',
        review_form_page,
        {'context_type': 'professor'},
        name='professor-review-form'
    ),


    path('professors/', professors, name='professors'),
    path('professors/<int:professor_id>/', professor_detail, name='professor-detail'),
    path('course_filtering', course_filtering, name='course_filtering'),
    path('about/', about_page, name='about'),

    path('my_account/', my_account, name='my_account'),
    path('my_courses/', my_courses, name='my_courses'),
    path('my_professors/', my_professors, name='my_professors'),
    path('my_classmates/', my_classmates, name='my_classmates'),
    path('my_reviews/', my_reviews, name='my_reviews'),
    path('course_planner/', course_planner, name='course_planner'),    
    
    ############
    # API URLs #
    ############
    
    # Department URLs
    path('api/departments/', DepartmentListView.as_view(), name='department-list'),
    
    # Course URLs
    path('api/departments/<int:department_id>/courses/', DepartmentCoursesView.as_view(), name='department-courses'),
    
    # Review URLs
    path('api/courses/<int:course_id>/reviews/', CourseReviewListView.as_view(), name='course-reviews'),
    path('api/courses/<int:course_id>/reviews/enroll/', EnrollView.as_view(), name='api-course-enroll'),
    path('api/courses/<int:course_id>/reviews/un_enroll/', UnEnrollView.as_view(), name='api-course-un-enroll'),
    path('api/courses/<int:course_id>/reviews/create/', CreateReviewAPIView.as_view(), name='api-review-create'),
    path('api/professors/<int:professor_id>/reviews/', ProfessorReviewListView.as_view(), name='professor-reviews'),
    path('api/professors/<int:professor_id>/reviews/create/', CreateProfessorReviewAPIView.as_view(), name='create-professor-review'),

    
    # Professor URLs
    path('api/courses/<int:course_id>/professors/', CourseProfessorsAPIView.as_view(), name='course-professors'),
    path('api/professors/<int:professor_id>/courses/', ProfessorCoursesAPIView.as_view(), name='professor-courses'),
    path('api/departments/<int:department_id>/professors/', DepartmentProfessorsView.as_view(), name='department_professors'),
   

    # User URLs
    path('api/create_user/', CreateUserView.as_view(), name='create_user'),
    path('api/my_courses/<str:email_address>/', MyCoursesView.as_view(), name='api-my_courses'),
    path('api/my_professors/', MyProfessorsView.as_view(), name='api-my_professors'),
    path('api/my_reviews/', MyReviewsView.as_view(), name='api-my_reviews'),
    path('api/my_classmates/', MyClassmatesView.as_view(), name='api-my_classmates'),
     
    # Course Filtering URLs
    path('api/filter-courses/', CourseFilteringView.as_view(), name='api-filter_courses'),

    path('api/users/<str:email_address>/details/', UserDetailsView.as_view(), name='user-details'),
]
