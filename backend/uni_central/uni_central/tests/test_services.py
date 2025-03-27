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

###############################
# User-Related Services Tests #
###############################

class UserServiceTestCase(TestCase):
    """Test cases for UserServiceMethods."""
    
    def setUp(self):
        self.user = User.objects.create(email_address="1@test.com", fname="John", lname="Doe")
        self.department = Department.objects.create(name="Mathematics", code="MATH")
        self.professor = Professor.objects.create(fname="Daniel", lname="Kopta", 
                                                  department=self.department)
        self.course = Course.objects.create(
            title="Discrete Math",
            subject="MATH",
            number=2100,
            department=self.department,
            credits=3,
        )
        self.review = Review.objects.create(
            user = self.user,
            course = self.course,
            professor = self.professor,
            review = "Good class.",
            rating = 4.5,
            difficulty = 3,
            estimated_hours = 8
        )
        self.user.professors.add(self.professor)
        self.user.courses.add(self.course)
        
        self.classmate = User.objects.create(email_address="2@test.com", fname="Jane", lname="Smith")
        self.classmate.courses.add(self.course)
        
    def test_get_user(self):
        """Test getting a user from an email address."""
        user = UserService.get_user("1@test.com")
        self.assertEqual(user.email_address, "1@test.com")
        self.assertEqual(user.fname, "John")
        self.assertEqual(user.lname, "Doe")
        
    def test_get_courses_one(self):
        """Test getting courses that a user is in when its just 1 course."""
        user = UserService.get_user("1@test.com")
        courses = UserService.get_courses(user)
        self.assertEqual(courses.count(), 1)
        course = courses[0]
        department = DepartmentService.get_department(1)
        self.assertEqual(course.title, "Discrete Math")
        self.assertEqual(course.subject, "MATH")
        self.assertEqual(course.number, 2100)
        self.assertEqual(course.title, "Discrete Math")
        self.assertEqual(course.department, department)
        self.assertEqual(course.credits, 3)
        
    def test_get_professors_one(self):
        """Test getting professors that a user is in when its just 1 professor."""
        user = UserService.get_user("1@test.com")
        professors = UserService.get_professors(user)
        department = DepartmentService.get_department(1)
        self.assertEqual(professors.count(), 1)
        professor = professors[0]
        self.assertEqual(professor.fname, "Daniel")
        self.assertEqual(professor.lname, "Kopta")
        self.assertEqual(professor.department, department)
        
    def test_get_reviews_one(self):
        """Test getting reviews that a user is in when its just 1 review."""
        user = UserService.get_user("1@test.com")
        reviews = UserService.get_reviews(user)
        review = reviews[0]
        reviewCheck = Review.objects.filter(user=user)[0]
        self.assertEqual(review, reviewCheck)
        
    def test_get_classmates(self):
        """Test getting classmates for a user (users sharing the same course)."""
        classmates = UserService.get_classmates(self.user)
        self.assertEqual(classmates.count(), 1)
        self.assertEqual(classmates[0], self.classmate)

    def test_add_course(self):
        """Test adding a course to a user."""
        UserService.add_course(self.user, self.course)
        self.assertIn(self.course, self.user.courses.all())

    def test_remove_course(self):
        """Test removing a course from a user."""
        result = UserService.remove_course(self.user, self.course)
        self.assertTrue(result)
        self.assertNotIn(self.course, self.user.courses.all())
        
    def test_add_professor(self):
        """Test adding a professor to a user."""
        UserService.add_professor(self.user, self.professor)
        self.assertIn(self.professor, self.user.professors.all())

    def test_remove_professor(self):
        """Test removing a professor from a user."""
        result = UserService.remove_professor(self.user, self.professor)
        self.assertTrue(result)
        self.assertNotIn(self.professor, self.user.professors.all())
        
    def test_change_account_info(self):
        """Test updating a user's account info (university, year, major)."""
        UserService.change_account_info(self.user, "UCLA", 2026, "Computer Science")
        self.user.refresh_from_db()
        self.assertEqual(self.user.university, "UCLA")
        self.assertEqual(self.user.year, 2026)
        self.assertEqual(self.user.major, "Computer Science")

    def test_update_course_plan(self):
        """Test updating a user's course plan."""
        plan = {"Fall 2024": ["MATH 2100"], "Spring 2025": ["CS 2500"]}
        UserService.update_course_plan(self.user, plan)
        self.user.refresh_from_db()
        self.assertEqual(self.user.course_plan, plan)
        
    def test_create_user(self):
        """Test creating a new user."""
        user = UserService.create_user("new@test.com", "John", "Deer")
        self.assertIsNotNone(user)
        self.assertEqual(user.email_address, "new@test.com")
        self.assertEqual(user.fname, "John")
        self.assertEqual(user.lname, "Deer")

    def test_delete_user(self):
        """Test deleting a user by ID."""
        user_id = self.user.id
        result = UserService.delete_user(user_id)
        self.assertTrue(result)
        self.assertFalse(User.objects.filter(id=user_id).exists())


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