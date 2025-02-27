from django.test import TestCase
from uni_central.models import User, Review, Course, Professor, Department, Thread, Comment
from uni_central.services import (
    DepartmentService, CourseService, ReviewService, 
    ProfessorService, UserService, ThreadService, CommentService
)

#####################################
# Department-Related Services Tests #
#####################################

class DepartmentServiceTestCase(TestCase):
    """Test cases for DepartmentService methods."""

    def setUp(self):
        self.department = Department.objects.create(name="Computer Science", code="CS")

    def test_get_all_departments(self):
        """Test retrieving all departments."""
        departments = DepartmentService.get_all_departments()
        self.assertEqual(departments.count(), 1)

    def test_get_department(self):
        """Test retrieving a department by ID."""
        department = DepartmentService.get_department(self.department.id)
        self.assertEqual(department.name, "Computer Science")
        self.assertEqual(department.code, "CS")

#################################
# Course-Related Services Tests #
#################################

class CourseServiceTestCase(TestCase):
    """Test cases for CourseService methods."""

    def setUp(self):
        self.department = Department.objects.create(name="Computer Science", code="CS")
        self.professor = Professor.objects.create(fname="Mu", lname="Zhang", department=self.department)
        self.course = Course.objects.create(
            title="Computer Systems",
            subject="CS",
            number=4400,
            department=self.department,
            credits=3
        )
        self.course.professors.add(self.professor)

    def test_get_courses_by_department(self):
        """Test retrieving courses in a specific department."""
        courses = CourseService.get_courses_by_department(self.department.id)
        self.assertEqual(courses.count(), 1)
        self.assertEqual(courses.first().department, self.department)

    def test_get_courses_by_professor(self):
        """Test retrieving courses by professor ID."""
        courses = CourseService.get_courses_by_professor(self.professor.id)
        self.assertEqual(courses.count(), 1)
        self.assertEqual(courses.first().professors.first(), self.professor)


    def test_get_course(self):
        """Test retrieving a course by ID."""
        course = CourseService.get_course(self.course.id)
        self.assertEqual(course.title, "Computer Systems")
        self.assertEqual(course.subject, "CS")
        self.assertEqual(course.number, 4400)
        self.assertEqual(course.department, self.department)
        self.assertEqual(course.credits, 3)

#################################
# Review-Related Services Tests #
#################################

class ReviewServiceTestCase(TestCase):
    """Test cases for ReviewService methods."""

    def setUp(self):
        """Set up test data for reviews."""
        self.department = Department.objects.create(name="Data Science", code="DS")
        self.professor = Professor.objects.create(fname="Andrew", lname="Ng", department=self.department)
        self.course = Course.objects.create(
            title="Machine Learning",
            subject="CS",
            number=405,
            department=self.department,
            credits=3
        )
        self.user = User.objects.create(email_address="user@example.com", fname="John", lname="Doe")

        self.review_course = Review.objects.create(
            user=self.user, course=self.course, review="Great class!", rating=4.5, difficulty=3
        )
        self.review_professor = Review.objects.create(
            user=self.user, professor=self.professor, review="Amazing professor!", rating=5.0, difficulty=2
        )

    def test_get_review_by_id(self):
        """Test retrieving a review by ID."""
        review = ReviewService.get_review_by_id(self.review_course.id)
        self.assertEqual(review.review, "Great class!")
        self.assertEqual(review.rating, 4.5)

    def test_get_reviews_by_course(self):
        """Test retrieving all reviews for a course."""
        reviews = ReviewService.get_reviews_by_course(self.course.id)
        self.assertEqual(reviews.count(), 1)
        self.assertEqual(reviews.first().course, self.course)

    def test_get_reviews_by_professor(self):
        """Test retrieving all reviews for a professor."""
        reviews = ReviewService.get_reviews_by_professor(self.professor.id)
        self.assertEqual(reviews.count(), 1)
        self.assertEqual(reviews.first().professor, self.professor)

    def test_create_review_for_course(self):
        """Test creating a review for a course."""
        review_data = {
            "review": "Challenging but worth it!",
            "rating": 4.8,
            "difficulty": 4,
            "estimated_hours": 10,
            "would_take_again": "true",
        }
        new_review = ReviewService.create_review_for_course(self.course.id, self.user, review_data)
        self.assertEqual(new_review.review, "Challenging but worth it!")
        self.assertEqual(new_review.rating, 4.8)
        self.assertEqual(new_review.difficulty, 4)

    def test_create_review_for_professor(self):
        """Test creating a review for a professor."""
        review_data = {
            "review": "Fantastic teacher!",
            "rating": 5.0,
            "difficulty": 2,
            "estimated_hours": 5,
            "would_take_again": "true",
        }
        new_review = ReviewService.create_review_for_professor(self.professor.id, self.user, review_data)
        self.assertEqual(new_review.review, "Fantastic teacher!")
        self.assertEqual(new_review.rating, 5.0)
        self.assertEqual(new_review.difficulty, 2)

    def test_update_review(self):
        """Test updating an existing review."""
        updated_data = {"review": "Awesome class!", "rating": 5.0, "difficulty": 4}
        updated_review = ReviewService.update_review(self.review_course.id, updated_data)
        self.assertEqual(updated_review.review, "Awesome class!")
        self.assertEqual(updated_review.rating, 5.0)
        self.assertEqual(updated_review.difficulty, 4)

    def test_update_review_partial(self):
        """Test updating only specific fields of a review."""
        updated_data = {"difficulty": 5}
        updated_review = ReviewService.update_review(self.review_professor.id, updated_data)
        self.assertEqual(updated_review.difficulty, 5)
        self.assertEqual(updated_review.review, "Amazing professor!")  # Unchanged

    def test_delete_review(self):
        """Test deleting a review and verifying course/professor averages update."""
        response = ReviewService.delete_review(self.review_course)
        self.assertTrue(response["success"])
        self.assertEqual(Review.objects.filter(id=self.review_course.id).count(), 0)

    def test_delete_review_nonexistent(self):
        """Test attempting to delete a review that does not exist."""
        response = ReviewService.delete_review(None)
        self.assertFalse(response["success"])
        self.assertEqual(response["error"], "Review not found")


####################################
# Professor-Related Services Tests #
####################################

class ProfessorServiceTestCase(TestCase):
    """Test cases for ProfessorService methods."""

    def setUp(self):
        self.department = Department.objects.create(name="Mathematics", code="MATH")
        self.professor = Professor.objects.create(fname="Daniel", lname="Kopta", department=self.department)
        self.course = Course.objects.create(
            title="Discrete Math",
            subject="MATH",
            number=2100,
            department=self.department,
            credits=3
        )
        self.course.professors.add(self.professor)

    def test_get_professor(self):
        """Test retrieving a professor by ID."""
        professor = ProfessorService.get_professor(self.professor.id)
        self.assertEqual(professor.fname, "Daniel")
        self.assertEqual(professor.lname, "Kopta")
        self.assertEqual(professor.department, self.department)

    def test_get_professors_by_course(self):
        """Test retrieving professors for a course."""
        professors = ProfessorService.get_professors_by_course(self.course.id)
        self.assertEqual(professors.count(), 1)
        self.assertEqual(professors.first().fname, "Daniel")
        self.assertEqual(professors.first().lname, "Kopta")
        self.assertEqual(professors.first().department, self.department)


    def test_get_professors_by_department(self):
        """Test retrieving professors for a department."""
        professors = ProfessorService.get_professors_by_department(self.department.id)
        self.assertEqual(professors.count(), 1)
        self.assertEqual(professors.first().fname, "Daniel")
        self.assertEqual(professors.first().lname, "Kopta")
        self.assertEqual(professors.first().department, self.department)

#################################
# Thread-Related Services Tests #
#################################

class ThreadServiceTestCase(TestCase):
    """Test cases for ThreadService methods."""

    def setUp(self):
        self.department = Department.objects.create(name="Artificial Intelligence", code="AI")
        self.course = Course.objects.create(
            title="Deep Learning",
            subject="AI",
            number=501,
            department=self.department,
            credits=3
        )
        self.user = User.objects.create(email_address="user@example.com", fname="John", lname="Doe")
        self.thread = Thread.objects.create(title="Neural Networks", user=self.user, course=self.course)

    def test_get_threads_by_course(self):
        """Test fetching threads by course."""
        threads = ThreadService.get_threads_by_course(self.course.id)
        self.assertEqual(threads.count(), 1)

    def test_create_thread(self):
        """Test creating a new thread."""
        thread_data = {"title": "Convolutional Networks", "course_id": self.course.id}
        response = ThreadService.create_thread(self.user, thread_data)
        self.assertTrue(response["success"])
        self.assertEqual(response["thread"].title, "Convolutional Networks")