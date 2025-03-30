from django.test import SimpleTestCase
from django.urls import reverse, resolve
from uni_central.views import (
    home, signup_page, login_page, courses, about_page, course_detail, review_form_page,
    professors, course_filtering, my_account, my_courses, my_professors, my_classmates,
    my_reviews, course_planner, professor_detail, discussion_board
)
from uni_central.views import (
    DepartmentListView, DepartmentCoursesView, CourseReviewListView, CreateReviewAPIView,
    CourseProfessorsAPIView, DepartmentProfessorsView, CreateUserView, ProfessorReviewListView,
    CreateProfessorReviewAPIView, CourseFilteringView, ProfessorCoursesAPIView, EnrollView,
    UnEnrollView, AddProfessorView, RemoveProfessorView, MyCoursesView, MyProfessorsView,
    MyReviewsView, MyClassmatesView, MyAccountView, EditAccountView, UpdateReviewAPIView,
    DeleteReviewAPIView, CreateThreadAPIView, UpdateThreadAPIView, DeleteThreadAPIView,
    CourseThreadsAPIView, ProfessorThreadsAPIView, ThreadCommentsAPIView, CreateCommentAPIView,
    UpdateCommentAPIView, DeleteCommentAPIView, CoursePlanUpdateAPIView
)

class ViewURLTests(SimpleTestCase):
    """Test cases to ensure that key views resolve correctly."""
    
    ###############################
    # General-Page View URL Tests #
    ###############################

    def test_home_url_resolves(self):
        """Test home page URL."""
        url = reverse('home')
        self.assertEqual(resolve(url).func, home)

    def test_signup_url_resolves(self):
        """Test signup page URL."""
        url = reverse('signup')
        self.assertEqual(resolve(url).func, signup_page)

    def test_login_url_resolves(self):
        """Test login page URL."""
        url = reverse('login')
        self.assertEqual(resolve(url).func, login_page)

    def test_courses_url_resolves(self):
        """Test courses page URL."""
        url = reverse('courses')
        self.assertEqual(resolve(url).func, courses)

    def test_about_url_resolves(self):
        """Test about page URL."""
        url = reverse('about')
        self.assertEqual(resolve(url).func, about_page)

    def test_course_detail_url_resolves(self):
        """Test course detail page URL."""
        url = reverse('course-detail', args=[1])
        self.assertEqual(resolve(url).func, course_detail)

    def test_professor_detail_url_resolves(self):
        """Test professor detail page URL."""
        url = reverse('professor-detail', args=[1])
        self.assertEqual(resolve(url).func, professor_detail)

    def test_review_form_course_url_resolves(self):
        """Test review form URL for a course."""
        url = reverse('course-review-form', args=[1])
        self.assertEqual(resolve(url).func, review_form_page)

    def test_review_form_professor_url_resolves(self):
        """Test review form URL for a professor."""
        url = reverse('professor-review-form', args=[1])
        self.assertEqual(resolve(url).func, review_form_page)

    def test_professors_url_resolves(self):
        """Test professors page URL."""
        url = reverse('professors')
        self.assertEqual(resolve(url).func, professors)

    def test_course_filtering_url_resolves(self):
        """Test course filtering page URL."""
        url = reverse('course_filtering')
        self.assertEqual(resolve(url).func, course_filtering)

    def test_my_account_url_resolves(self):
        """Test my account page URL."""
        url = reverse('my_account')
        self.assertEqual(resolve(url).func, my_account)

    def test_my_courses_url_resolves(self):
        """Test my courses page URL."""
        url = reverse('my_courses')
        self.assertEqual(resolve(url).func, my_courses)

    def test_my_professors_url_resolves(self):
        """Test my professors page URL."""
        url = reverse('my_professors')
        self.assertEqual(resolve(url).func, my_professors)

    def test_my_classmates_url_resolves(self):
        """Test my classmates page URL."""
        url = reverse('my_classmates')
        self.assertEqual(resolve(url).func, my_classmates)

    def test_my_reviews_url_resolves(self):
        """Test my reviews page URL."""
        url = reverse('my_reviews')
        self.assertEqual(resolve(url).func, my_reviews)

    def test_course_planner_url_resolves(self):
        """Test course planner page URL."""
        url = reverse('course_planner')
        self.assertEqual(resolve(url).func, course_planner)

    def test_course_discussion_board_url_resolves(self):
        """Test discussion board for a course."""
        url = reverse('course_discussion_board', args=[1])
        self.assertEqual(resolve(url).func, discussion_board)

    def test_professor_discussion_board_url_resolves(self):
        """Test discussion board for a professor."""
        url = reverse('professor_discussion_board', args=[1])
        self.assertEqual(resolve(url).func, discussion_board)
        

    ###########################
    # API-Page View URL Tests #
    ###########################

    # Department URLs
    def test_department_list_url_resolves(self):
        """Test department list API URL."""
        url = reverse('department-list')
        self.assertEqual(resolve(url).func.view_class, DepartmentListView)

    # Course URLs
    def test_department_courses_url_resolves(self):
        """Test department courses API URL."""
        url = reverse('department-courses', args=[1])
        self.assertEqual(resolve(url).func.view_class, DepartmentCoursesView)

    # Review URLs
    def test_course_reviews_url_resolves(self):
        """Test course reviews API URL."""
        url = reverse('course-reviews', args=[1])
        self.assertEqual(resolve(url).func.view_class, CourseReviewListView)
        
    def test_enroll_course_url_resolves(self):
        url = reverse('api-course-enroll', args=[1])
        self.assertEqual(resolve(url).func.view_class, EnrollView)

    def test_unenroll_course_url_resolves(self):
        url = reverse('api-course-un-enroll', args=[1])
        self.assertEqual(resolve(url).func.view_class, UnEnrollView)

    def test_create_review_url_resolves(self):
        """Test create review API URL."""
        url = reverse('api-review-create', args=[1])
        self.assertEqual(resolve(url).func.view_class, CreateReviewAPIView)
        
    def test_update_review_url_resolves(self):
        url = reverse('api-review-update', args=[1])
        self.assertEqual(resolve(url).func.view_class, UpdateReviewAPIView)

    def test_delete_review_url_resolves(self):
        url = reverse('api-delete-review', args=[1])
        self.assertEqual(resolve(url).func.view_class, DeleteReviewAPIView)
        
    def test_professor_reviews_url_resolves(self):
        url = reverse('professor-reviews', args=[1])
        self.assertEqual(resolve(url).func.view_class, ProfessorReviewListView)

    def test_create_professor_review_url_resolves(self):
        url = reverse('create-professor-review', args=[1])
        self.assertEqual(resolve(url).func.view_class, CreateProfessorReviewAPIView)

    def test_add_professor_url_resolves(self):
        url = reverse('api-professor-add', args=[1])
        self.assertEqual(resolve(url).func.view_class, AddProfessorView)

    def test_remove_professor_url_resolves(self):
        url = reverse('api-professor-remove', args=[1])
        self.assertEqual(resolve(url).func.view_class, RemoveProfessorView)
        
    # Professor URLs
    def test_course_professors_url_resolves(self):
        url = reverse('course-professors', args=[1])
        self.assertEqual(resolve(url).func.view_class, CourseProfessorsAPIView)

    def test_professor_courses_url_resolves(self):
        url = reverse('professor-courses', args=[1])
        self.assertEqual(resolve(url).func.view_class, ProfessorCoursesAPIView)

    def test_department_professors_url_resolves(self):
        url = reverse('department_professors', args=[1])
        self.assertEqual(resolve(url).func.view_class, DepartmentProfessorsView)

    # User URLs
    def test_create_user_url_resolves(self):
        url = reverse('create_user')
        self.assertEqual(resolve(url).func.view_class, CreateUserView)

    def test_my_courses_api_url_resolves(self):
        url = reverse('api-my_courses', args=["test@example.com"])
        self.assertEqual(resolve(url).func.view_class, MyCoursesView)

    def test_my_professors_api_url_resolves(self):
        url = reverse('api-my_professors', args=["test@example.com"])
        self.assertEqual(resolve(url).func.view_class, MyProfessorsView)

    def test_my_reviews_api_url_resolves(self):
        url = reverse('api-my_reviews')
        self.assertEqual(resolve(url).func.view_class, MyReviewsView)

    def test_my_classmates_api_url_resolves(self):
        url = reverse('api-my_classmates', args=["test@example.com"])
        self.assertEqual(resolve(url).func.view_class, MyClassmatesView)

    def test_user_details_api_url_resolves(self):
        url = reverse('user-details', args=["test@example.com"])
        self.assertEqual(resolve(url).func.view_class, MyAccountView)

    def test_edit_user_details_api_url_resolves(self):
        url = reverse('edit-user-details')
        self.assertEqual(resolve(url).func.view_class, EditAccountView)

    def test_update_course_plan_api_url_resolves(self):
        url = reverse('update-course-plan')
        self.assertEqual(resolve(url).func.view_class, CoursePlanUpdateAPIView)

    # Course-Filtering URLs
    def test_api_filter_courses_url_resolves(self):
        url = reverse('api-filter_courses')
        self.assertEqual(resolve(url).func.view_class, CourseFilteringView)

    # Thread URLs
    def test_create_thread_url_resolves(self):
        url = reverse('api-create-thread')
        self.assertEqual(resolve(url).func.view_class, CreateThreadAPIView)

    def test_update_thread_url_resolves(self):
        url = reverse('api-update-thread', args=[1])
        self.assertEqual(resolve(url).func.view_class, UpdateThreadAPIView)

    def test_delete_thread_url_resolves(self):
        url = reverse('api-delete-thread', args=[1])
        self.assertEqual(resolve(url).func.view_class, DeleteThreadAPIView)

    def test_course_threads_url_resolves(self):
        url = reverse('course-threads', args=[1])
        self.assertEqual(resolve(url).func.view_class, CourseThreadsAPIView)

    def test_professor_threads_url_resolves(self):
        url = reverse('professor-threads', args=[1])
        self.assertEqual(resolve(url).func.view_class, ProfessorThreadsAPIView)

    # Comment URLs
    def test_create_comment_url_resolves(self):
        url = reverse('api-create-comment', args=[1])
        self.assertEqual(resolve(url).func.view_class, CreateCommentAPIView)

    def test_update_comment_url_resolves(self):
        url = reverse('api-update-comment', args=[1])
        self.assertEqual(resolve(url).func.view_class, UpdateCommentAPIView)

    def test_delete_comment_url_resolves(self):
        url = reverse('api-delete-comment', args=[1])
        self.assertEqual(resolve(url).func.view_class, DeleteCommentAPIView)

    def test_thread_comments_url_resolves(self):
        url = reverse('thread-comments', args=[1])
        self.assertEqual(resolve(url).func.view_class, ThreadCommentsAPIView)