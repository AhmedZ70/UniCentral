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
    AddProfessorView,
    RemoveProfessorView,
    MyCoursesView,
    MyProfessorsView,
    MyReviewsView,
    MyClassmatesView,
    MyAccountView,
    EditAccountView,
    UpdateReviewAPIView,
    DeleteReviewAPIView,
    CreateThreadAPIView,
    UpdateThreadAPIView,
    DeleteThreadAPIView,
    CourseThreadsAPIView,
    ProfessorThreadsAPIView,
    ThreadCommentsAPIView,
    CreateCommentAPIView,
    UpdateCommentAPIView,
    DeleteCommentAPIView,
    ThreadSearchAPIView,
    CommentUpvotesView,
    UserCommentUpvoteView,
    ToggleCommentUpvoteView,
    CoursePlanUpdateAPIView,
    ReviewVotesView,
    UserReviewVoteView,
    SubmitReviewVoteView,
    CoursePlanGetAPIView,
    CategoryCountsView,
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
    discussion_board,
    TranscriptUploadView,
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
    path('courses/<int:context_id>/discussion_board/', 
         discussion_board, 
         {'context_type': 'course'}, 
         name='course_discussion_board'),
    path('professors/<int:context_id>/discussion_board/', 
         discussion_board, 
         {'context_type': 'professor'}, 
         name='professor_discussion_board'),
    
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
    path('api/reviews/<int:review_id>/update/', UpdateReviewAPIView.as_view(), name='api-review-update'),
    path('api/reviews/<int:review_id>/delete/', DeleteReviewAPIView.as_view(), name='api-delete-review'),
    path('api/professors/<int:professor_id>/reviews/', ProfessorReviewListView.as_view(), name='professor-reviews'),
    path('api/professors/<int:professor_id>/reviews/create/', CreateProfessorReviewAPIView.as_view(), name='create-professor-review'),
    path('api/professors/<int:professor_id>/reviews/add/', AddProfessorView.as_view(), name='api-professor-add'),
    path('api/professors/<int:professor_id>/reviews/remove/', RemoveProfessorView.as_view(), name='api-professor-remove'),
    
    # Review Votes URLs
    path('api/reviews/<int:review_id>/votes/', ReviewVotesView.as_view(), name='review-votes'),
    path('api/reviews/<int:review_id>/user-vote/', UserReviewVoteView.as_view(), name='user-review-vote'),
    path('api/reviews/<int:review_id>/vote/', SubmitReviewVoteView.as_view(), name='submit-review-vote'),
    
    # Professor URLs
    path('api/courses/<int:course_id>/professors/', CourseProfessorsAPIView.as_view(), name='course-professors'),
    path('api/professors/<int:professor_id>/courses/', ProfessorCoursesAPIView.as_view(), name='professor-courses'),
    path('api/departments/<int:department_id>/professors/', DepartmentProfessorsView.as_view(), name='department_professors'),
   
    # User URLs
    path('api/create_user/', CreateUserView.as_view(), name='create_user'),
    path('api/my_courses/<str:email_address>/', MyCoursesView.as_view(), name='api-my_courses'),
    path('api/my_professors/<str:email_address>/', MyProfessorsView.as_view(), name='api-my_professors'),
    path('api/my_reviews/<str:email_address>/', MyReviewsView.as_view(), name='api-my_reviews'),
    path('api/my_classmates/<str:email_address>/', MyClassmatesView.as_view(), name='api-my_classmates'),
    path('api/users/<str:email_address>/details/', MyAccountView.as_view(), name='user-details'),
    path('api/users/details/edit-details', EditAccountView.as_view(), name='edit-user-details'),
    path('api/users/update-course-plan/', CoursePlanUpdateAPIView.as_view(), name='update-course-plan'),
     
    # Course Filtering URLs
    path('api/filter-courses/', CourseFilteringView.as_view(), name='api-filter_courses'),
    
    # Thread URLs
    path("api/threads/create/", CreateThreadAPIView.as_view(), name="api-create-thread"),
    path("api/threads/<int:thread_id>/update/", UpdateThreadAPIView.as_view(), name="api-update-thread"),
    path("api/threads/<int:thread_id>/delete/", DeleteThreadAPIView.as_view(), name="api-delete-thread"),
    path('api/threads/search/', ThreadSearchAPIView.as_view(), name='thread_search'),
    path("api/courses/<int:course_id>/threads/", CourseThreadsAPIView.as_view(), name="course-threads"),
    path("api/professors/<int:professor_id>/threads/", ProfessorThreadsAPIView.as_view(), name="professor-threads"),
    path('api/courses/<int:course_id>/category-counts/', CategoryCountsView.as_view(), name='category-counts'),

    # Comment URLs
    path("api/threads/<int:thread_id>/comments/create/", CreateCommentAPIView.as_view(), name="api-create-comment"),
    path("api/comments/<int:comment_id>/update/", UpdateCommentAPIView.as_view(), name="api-update-comment"),
    path("api/comments/<int:comment_id>/delete/", DeleteCommentAPIView.as_view(), name="api-delete-comment"),
    path('api/comments/<int:comment_id>/upvotes/', CommentUpvotesView.as_view(), name='comment-upvotes'),
    path('api/comments/<int:comment_id>/user-upvote/', UserCommentUpvoteView.as_view(), name='user-comment-upvote'),
    path('api/comments/<int:comment_id>/upvote/', ToggleCommentUpvoteView.as_view(), name='toggle-comment-upvote'),
    path("api/threads/<int:thread_id>/comments/", ThreadCommentsAPIView.as_view(), name="thread-comments"),

    # Transcript Upload URL
    path('api/transcript/upload/', TranscriptUploadView.as_view(), name='upload_transcript'),

    # Course Plan URLs
    path('api/get-course-plan/<str:email_address>/', CoursePlanGetAPIView.as_view(), name='get_course_plan'),
    path('api/update-course-plan/<str:email_address>/', CoursePlanUpdateAPIView.as_view(), name='update_course_plan'),
]
