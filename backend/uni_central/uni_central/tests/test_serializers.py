from django.test import TestCase
from uni_central.models import (
    Department, User, Course, Professor, Review, Thread, Comment
)
from uni_central.serializers import (
    DepartmentSerializer, UserSerializer, CourseSerializer, ProfessorSerializer,
    ReviewSerializer, ThreadSerializer, CommentSerializer
)

class FullSerializerTestCase(TestCase):
    def setUp(self):
        self.department = Department.objects.create(name="Computer Science", code="CS")

        self.user = User.objects.create(
            email_address="test@example.com",
            fname="Test",
            lname="User",
            university="Test University",
            major="CS",
            year=2025,
            course_plan={"fall": ["CS1410", "MATH2210"]}
        )

        self.classmate = User.objects.create(
            email_address="classmate@example.com",
            fname="Class",
            lname="Mate"
        )

        self.course = Course.objects.create(
            title="Algorithms",
            subject="CS",
            number=4150,
            department=self.department,
            avg_difficulty=2.3,
            avg_rating=4.7,
            credits=3,
            semester="Fall 2024"
        )

        self.professor = Professor.objects.create(
            fname="Daniel",
            lname="Kopta",
            avg_rating=4.5,
            avg_difficulty=2.0,
            department=self.department
        )

        self.course.professors.add(self.professor)
        self.user.courses.add(self.course)
        self.classmate.courses.add(self.course)
        self.user.professors.add(self.professor)

        self.review = Review.objects.create(
            user=self.user,
            course=self.course,
            professor=self.professor,
            review="Excellent course!",
            rating=5.0,
            difficulty=3,
            estimated_hours=7,
            grade="A",
            would_take_again=True,
            for_credit=True,
            mandatory_attendance=False,
            required_course=True,
            is_gened=False,
            in_person=True,
            online=False,
            hybrid=False,
            no_exams=False,
            presentations=True
        )

        self.thread = Thread.objects.create(
            title="Discussion Thread",
            user=self.user,
            course=self.course
        )

        self.comment = Comment.objects.create(
            thread=self.thread,
            user=self.user,
            content="Great course!"
        )

    def test_department_serializer_all_fields(self):
        serializer = DepartmentSerializer(instance=self.department)
        self.assertEqual(set(serializer.data.keys()), {"id", "name", "code"})

    def test_user_serializer_all_fields(self):
        context = {"current_user": self.user}
        serializer = UserSerializer(instance=self.classmate, context=context)
        self.assertEqual(set(serializer.data.keys()), {"id", "email_address", "fname", "lname", "common_classes"})
        self.assertIn("Algorithms", serializer.data["common_classes"])

    def test_course_serializer_all_fields(self):
        serializer = CourseSerializer(instance=self.course)
        expected_fields = {
            "id", "title", "subject", "number", "department", "avg_difficulty", "avg_rating",
            "credits", "semester", "professors"
        }
        self.assertTrue(expected_fields.issubset(serializer.data.keys()))
        self.assertEqual(serializer.data["department"]["code"], "CS")

    def test_professor_serializer_all_fields(self):
        serializer = ProfessorSerializer(instance=self.professor)
        expected_fields = {"id", "fname", "lname", "avg_rating", "avg_difficulty", "department"}
        self.assertTrue(expected_fields.issubset(serializer.data.keys()))
        self.assertEqual(serializer.data["department"]["name"], "Computer Science")

    def test_review_serializer_all_fields(self):
        serializer = ReviewSerializer(instance=self.review)
        expected_fields = {
            "id", "user", "course", "professor", "review", "rating", "difficulty", "estimated_hours",
            "grade", "would_take_again", "for_credit", "mandatory_attendance", "required_course",
            "is_gened", "in_person", "online", "hybrid", "no_exams", "presentations"
        }
        self.assertTrue(expected_fields.issubset(serializer.data.keys()))
        self.assertEqual(serializer.data["user"]["email_address"], "test@example.com")
        self.assertEqual(serializer.data["review"], "Excellent course!")

    def test_thread_serializer_all_fields(self):
        serializer = ThreadSerializer(instance=self.thread)
        expected_fields = {"id", "title", "user", "course", "professor", "created_at", "updated_at"}
        self.assertTrue(expected_fields.issubset(serializer.data.keys()))
        self.assertEqual(serializer.data["course"]["title"], "Algorithms")

    def test_thread_serializer_valid_output(self):
        serializer = ThreadSerializer(instance=self.thread)
        expected_fields = {"id", "title", "user", "course", "professor", "created_at", "updated_at"}
        
        self.assertTrue(expected_fields.issubset(serializer.data.keys()))
        self.assertEqual(serializer.data["title"], "Discussion Thread")
        self.assertEqual(serializer.data["course"]["title"], "Algorithms")
        self.assertIsNone(serializer.data["professor"])

    def test_comment_serializer_all_fields(self):
        serializer = CommentSerializer(instance=self.comment)
        expected_fields = {"id", "thread", "user", "content", "created_at", "updated_at"}
        self.assertTrue(expected_fields.issubset(serializer.data.keys()))
        self.assertEqual(serializer.data["content"], "Great course!")
