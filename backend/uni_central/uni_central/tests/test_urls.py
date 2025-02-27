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

    def test_department_list_url_resolves(self):
        """Test department list API URL."""
        url = reverse('department-list')
        self.assertEqual(resolve(url).func.view_class, DepartmentListView)

    def test_department_courses_url_resolves(self):
        """Test department courses API URL."""
        url = reverse('department-courses', args=[1])
        self.assertEqual(resolve(url).func.view_class, DepartmentCoursesView)

    def test_course_reviews_url_resolves(self):
        """Test course reviews API URL."""
        url = reverse('course-reviews', args=[1])
        self.assertEqual(resolve(url).func.view_class, CourseReviewListView)

    def test_create_review_url_resolves(self):
        """Test create review API URL."""
        url = reverse('api-review-create', args=[1])
        self.assertEqual(resolve(url).func.view_class, CreateReviewAPIView)