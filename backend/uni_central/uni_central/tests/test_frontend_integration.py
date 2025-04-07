from django.test import TestCase
from django.urls import reverse
from uni_central.models import User, Department, Course, Professor, Review


class FrontendIntegrationTestCase(TestCase):
    """
    Tests to ensure frontend and backend integration is working correctly.
    These tests check that the API endpoints return the correct data structure
    that the frontend expects.
    """

    def setUp(self):
        # Create test data
        self.department = Department.objects.create(name="Computer Science", code="CS")
        self.professor = Professor.objects.create(
            fname="John", 
            lname="Doe", 
            department=self.department,
            avg_rating=4.5,
            avg_difficulty=3.2
        )
        self.course = Course.objects.create(
            title="Machine Learning", 
            subject="CS", 
            number=405, 
            department=self.department, 
            credits=3,
            avg_rating=4.2,
            avg_difficulty=4.1
        )
        self.course.professors.add(self.professor)
        self.user = User.objects.create(
            email_address="user@example.com", 
            fname="Alice", 
            lname="Smith"
        )
        self.review = Review.objects.create(
            user=self.user, 
            course=self.course, 
            review="Great class!", 
            rating=4.5,
            difficulty=4
        )

    def test_course_api_format(self):
        """Test that the course API returns data in the format expected by the frontend."""
        response = self.client.get(reverse('course-detail', args=[self.course.id]))
        self.assertEqual(response.status_code, 200)
        
        # Check that the response contains expected fields
        data = response.json()
        expected_fields = [
            'id', 'title', 'subject', 'number', 'department', 
            'avg_difficulty', 'avg_rating', 'credits', 'semester'
        ]
        for field in expected_fields:
            self.assertIn(field, data)
        
        # Check specific field values
        self.assertEqual(data['title'], 'Machine Learning')
        self.assertEqual(data['subject'], 'CS')
        self.assertEqual(data['number'], 405)
        self.assertEqual(data['avg_rating'], 4.2)
        self.assertEqual(data['avg_difficulty'], 4.1)

    def test_professor_api_format(self):
        """Test that the professor API returns data in the format expected by the frontend."""
        response = self.client.get(reverse('professor-detail', args=[self.professor.id]))
        self.assertEqual(response.status_code, 200)
        
        # Check that the response contains expected fields
        data = response.json()
        expected_fields = [
            'id', 'fname', 'lname', 'avg_rating', 'avg_difficulty', 'department'
        ]
        for field in expected_fields:
            self.assertIn(field, data)
        
        # Check specific field values
        self.assertEqual(data['fname'], 'John')
        self.assertEqual(data['lname'], 'Doe')
        self.assertEqual(data['avg_rating'], 4.5)
        self.assertEqual(data['avg_difficulty'], 3.2)

    def test_review_api_format(self):
        """Test that the review API returns data in the format expected by the frontend."""
        response = self.client.get(reverse('review-detail', args=[self.review.id]))
        self.assertEqual(response.status_code, 200)
        
        # Check that the response contains expected fields
        data = response.json()
        expected_fields = [
            'id', 'user', 'course', 'professor', 'review', 'rating', 
            'difficulty', 'estimated_hours', 'would_take_again'
        ]
        for field in expected_fields:
            self.assertIn(field, data)
        
        # Check specific field values
        self.assertEqual(data['review'], 'Great class!')
        self.assertEqual(data['rating'], 4.5)
        self.assertEqual(data['difficulty'], 4)