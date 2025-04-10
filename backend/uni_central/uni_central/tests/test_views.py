from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from uni_central.models import User, Department, Course, Professor, Review, Thread, Comment

class GeneralPageViewsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.department = Department.objects.create(name="CS", code="CS")
        self.professor = Professor.objects.create(fname="Daniel", lname="Kopta", department=self.department)
        self.course = Course.objects.create(title="Test Course", subject="CS", number=101, department=self.department, credits=3)
        self.course.professors.add(self.professor)
        self.user = User.objects.create(email_address="student@example.com", fname="John", lname="Doe")
        self.thread = Thread.objects.create(title="Test Thread", user=self.user, course=self.course)

    def test_home_view(self):
        response = self.client.get(reverse('home'))
        self.assertEqual(response.status_code, 200)

    def test_signup_page_view(self):
        response = self.client.get(reverse('signup'))
        self.assertEqual(response.status_code, 200)

    def test_login_page_view(self):
        response = self.client.get(reverse('login'))
        self.assertEqual(response.status_code, 200)
        
    def test_my_account_view(self):
        response = self.client.get(reverse('my_account'))
        self.assertEqual(response.status_code, 200)

    def test_my_courses_view(self):
        response = self.client.get(reverse('my_courses'))
        self.assertEqual(response.status_code, 200)
        
    def test_my_professors_view(self):
        response = self.client.get(reverse('my_professors'))
        self.assertEqual(response.status_code, 200)

    def test_my_classmates_view(self):
        response = self.client.get(reverse('my_classmates'))
        self.assertEqual(response.status_code, 200)

    def test_my_reviews_view(self):
        response = self.client.get(reverse('my_reviews'))
        self.assertEqual(response.status_code, 200)
        
    def test_course_planner_view(self):
        response = self.client.get(reverse('course_planner'))
        self.assertEqual(response.status_code, 200)

    def test_courses_view(self):
        response = self.client.get(reverse('courses'))
        self.assertEqual(response.status_code, 200)
        
    def test_course_filtering_view(self):
        response = self.client.get(reverse('course_filtering'))
        self.assertEqual(response.status_code, 200)
        
    def test_course_discussion_board_view(self):
        response = self.client.get(reverse('course_discussion_board', args=[self.course.id]))
        self.assertEqual(response.status_code, 200)
        
    def test_about_page_view(self):
        response = self.client.get(reverse('about'))
        self.assertEqual(response.status_code, 200)
        
    def test_course_detail_view(self):
        response = self.client.get(reverse('course-detail', args=[self.course.id]))
        self.assertEqual(response.status_code, 200)

    def test_professors_view(self):
        response = self.client.get(reverse('professors'))
        self.assertEqual(response.status_code, 200)

    def test_course_review_form_view(self):
        response = self.client.get(reverse('course-review-form', args=[self.course.id]))
        self.assertEqual(response.status_code, 200)

    def test_professor_review_form_view(self):
        response = self.client.get(reverse('professor-review-form', args=[self.professor.id]))
        self.assertEqual(response.status_code, 200)

    def test_professor_discussion_board_view(self):
        response = self.client.get(reverse('professor_discussion_board', args=[self.professor.id]))
        self.assertEqual(response.status_code, 200)
    
    def test_professor_detail_view(self):
        response = self.client.get(reverse('professor-detail', args=[self.professor.id]))
        self.assertEqual(response.status_code, 200)

class ViewTestCase(TestCase):
    """
    Test cases for API views.
    """

    def setUp(self):
        self.client = APIClient()

        self.department = Department.objects.create(name="Computer Science", code="CS")
        self.professor = Professor.objects.create(fname="Daniel", lname="Kopta", department=self.department)
        self.course = Course.objects.create(title="Machine Learning", subject="CS", number=405, department=self.department, credits=3)
        self.course.professors.add(self.professor)
        self.user = User.objects.create(email_address="user@example.com", fname="John", lname="Doe")
        self.thread = Thread.objects.create(title="Discussion on ML", user=self.user, course=self.course)
        self.review = Review.objects.create(user=self.user, course=self.course, review="Great class!", rating=4.5)
        self.comment = Comment.objects.create(thread=self.thread, user=self.user, content="Interesting topic!")

    #####################
    # Department Tests  #
    #####################

    def test_get_all_departments(self):
        response = self.client.get(reverse('department-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_get_courses_by_department(self):
        response = self.client.get(reverse('department-courses', args=[self.department.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    ###################
    # Course Tests    #
    ###################

    def test_get_courses_by_professor(self):
        response = self.client.get(reverse('professor-courses', args=[self.professor.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    ###################
    # Review Tests    #
    ###################

    def test_create_review_for_course(self):
        data = {"email_address": self.user.email_address, "review": "Amazing course!", "rating": 5.0}
        response = self.client.post(reverse('api-review-create', args=[self.course.id]), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_delete_review(self):
        response = self.client.delete(reverse('api-delete-review', args=[self.review.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    #####################
    # Professor Tests   #
    #####################

    def test_get_professors_by_department(self):
        response = self.client.get(reverse('department_professors', args=[self.department.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_get_professors_by_course(self):
        response = self.client.get(reverse('course-professors', args=[self.course.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    #####################
    # Thread Tests      #
    #####################

    def test_create_thread(self):
        data = {"title": "New Discussion", "course_id": self.course.id, "email_address": self.user.email_address}
        response = self.client.post(reverse('api-create-thread'), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_delete_thread(self):
        response = self.client.delete(reverse('api-delete-thread', args=[self.thread.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    #####################
    # Comment Tests     #
    #####################

    def test_create_comment(self):
        data = {"email_address": self.user.email_address, "content": "New comment!"}
        response = self.client.post(reverse('api-create-comment', args=[self.thread.id]), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_delete_comment(self):
        response = self.client.delete(reverse('api-delete-comment', args=[self.comment.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    ###################
    # User Tests      #
    ###################

    def test_get_user_profile(self):
        response = self.client.get(reverse('user-details', args=[self.user.email_address]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_enroll_course(self):
        data = {"email_address": self.user.email_address}
        response = self.client.post(reverse('api-course-enroll', args=[self.course.id]), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_get_user_courses(self):
        response = self.client.get(reverse('api-my_courses', args=[self.user.email_address]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_user_professors(self):
        response = self.client.get(reverse('api-my_professors', args=[self.user.email_address]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_user_reviews(self):
        response = self.client.get(
            reverse('api-my_reviews', args=[self.user.email_address])
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_user_classmates(self):
        response = self.client.get(reverse('api-my_classmates', args=[self.user.email_address]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_course_plan(self):
        data = {"email_address": self.user.email_address, "course_plan": {"fall": ["CS101"]}}
        response = self.client.put(reverse('update-course-plan'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_user(self):
        data = {"email": "newuser@example.com", "fname": "Jane", "lname": "Doe"}
        response = self.client.post(reverse('create_user'), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_add_professor(self):
        data = {"email_address": self.user.email_address}
        response = self.client.post(reverse('api-professor-add', args=[self.professor.id]), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_remove_professor(self):
        self.user.professors.add(self.professor)
        data = {"email_address": self.user.email_address}
        response = self.client.delete(reverse('api-professor-remove', args=[self.professor.id]), data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unenroll_course(self):
        self.user.courses.add(self.course)
        data = {"email_address": self.user.email_address}
        response = self.client.delete(reverse('api-course-un-enroll', args=[self.course.id]), data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    ###################
    # Filtering Tests #
    ###################

    def test_filter_courses(self):
        response = self.client.get(reverse('api-filter_courses'), {"department": "CS"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    ###################
    # Thread Extras   #
    ###################

    def test_get_course_threads(self):
        response = self.client.get(reverse('course-threads', args=[self.course.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_professor_threads(self):
        thread = Thread.objects.create(title="Prof Talk", user=self.user, professor=self.professor)
        response = self.client.get(reverse('professor-threads', args=[self.professor.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_thread(self):
        data = {"title": "Updated Title"}
        response = self.client.put(reverse('api-update-thread', args=[self.thread.id]), data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    ###################
    # Comment Extras  #
    ###################

    def test_get_thread_comments(self):
        response = self.client.get(reverse('thread-comments', args=[self.thread.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_comment(self):
        data = {"content": "Updated content."}
        response = self.client.put(reverse('api-update-comment', args=[self.comment.id]), data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
           
    def test_edit_user_details_view(self):
        data = {
            "email_address": self.user.email_address,
            "university": "University of Utah",
            "major": "Computer Science",
            "year": 4
        }
        response = self.client.post(reverse('edit-user-details'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_my_account_api_view(self):
        response = self.client.get(reverse('user-details', args=[self.user.email_address]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_my_courses_api_view(self):
        response = self.client.get(reverse('api-my_courses', args=[self.user.email_address]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_my_professors_api_view(self):
        response = self.client.get(reverse('api-my_professors', args=[self.user.email_address]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_my_reviews_api_view(self):
        response = self.client.get(reverse('api-my_reviews', args=[self.user.email_address]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)