from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from uni_central.models import User, Department, Course, Professor, Review, Thread, Comment

class ViewTestCase(TestCase):
    """
    Test cases for API views.
    """

    def setUp(self):
        self.client = APIClient()

        # Create objects for tests
        self.department = Department.objects.create(name="Computer Science", code="CS")
        self.professor = Professor.objects.create(fname="John", lname="Doe", department=self.department)
        self.course = Course.objects.create(
            title="Machine Learning", subject="CS", number=405, 
            department=self.department, credits=3
        )
        self.course.professors.add(self.professor)
        self.user = User.objects.create(email_address="user@example.com", fname="Alice", lname="Smith")
        self.thread = Thread.objects.create(title="Discussion on ML", user=self.user, course=self.course)
        self.review = Review.objects.create(user=self.user, course=self.course, review="Great class!", rating=4.5)
        self.comment = Comment.objects.create(thread=self.thread, user=self.user, content="Interesting topic!")

    #####################
    # Department Tests  #
    #####################

    def test_get_all_departments(self):
        """Test retrieving all departments via API."""
        response = self.client.get(reverse('department-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_get_courses_by_department(self):
        """Test retrieving courses for a department."""
        response = self.client.get(reverse('department-courses', args=[self.department.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    ###################
    # Course Tests    #
    ###################

    def test_get_courses_by_professor(self):
        """Test retrieving courses by professor ID."""
        response = self.client.get(reverse('professor-courses', args=[self.professor.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    ###################
    # Review Tests    #
    ###################

    def test_create_review_for_course(self):
        """Test creating a review for a course."""
        data = {
            "email_address": self.user.email_address,
            "review": "Amazing course!",
            "rating": 5.0
        }
        response = self.client.post(reverse('api-review-create', args=[self.course.id]), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_delete_review(self):
        """Test deleting a review."""
        response = self.client.delete(reverse('api-delete-review', args=[self.review.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    #####################
    # Professor Tests   #
    #####################

    def test_get_professors_by_department(self):
        """Test fetching professors for a department."""
        response = self.client.get(reverse('department_professors', args=[self.department.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_get_professors_by_course(self):
        """Test fetching professors for a course."""
        response = self.client.get(reverse('course-professors', args=[self.course.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    #####################
    # Thread Tests      #
    #####################

    def test_create_thread(self):
        """Test creating a new thread."""
        data = {
            "title": "New Discussion",
            "course_id": self.course.id,
            "email_address": self.user.email_address
        }
        response = self.client.post(reverse('api-create-thread'), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_delete_thread(self):
        """Test deleting a thread."""
        response = self.client.delete(reverse('api-delete-thread', args=[self.thread.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    #####################
    # Comment Tests     #
    #####################

    def test_create_comment(self):
        """Test creating a new comment."""
        data = {
            "email_address": self.user.email_address,
            "content": "New comment!"
        }
        response = self.client.post(reverse('api-create-comment', args=[self.thread.id]), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_delete_comment(self):
        """Test deleting a comment."""
        response = self.client.delete(reverse('api-delete-comment', args=[self.comment.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    ###################
    # User Tests      #
    ###################

    def test_get_user_profile(self):
        """Test fetching user details."""
        response = self.client.get(reverse('user-details', args=[self.user.email_address]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_enroll_course(self):
        """Test enrolling a user in a course."""
        data = {"email_address": self.user.email_address}
        response = self.client.post(reverse('api-course-enroll', args=[self.course.id]), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)