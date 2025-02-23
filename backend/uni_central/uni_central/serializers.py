from rest_framework import serializers
from .models import Department, User, Course, Professor, Review

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    common_classes = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'email_address', 'fname', 'lname', 'common_classes')

    def get_common_classes(self, obj):
        current_user = self.context.get('current_user')
        if current_user:
            current_courses = set(current_user.courses.values_list('title', flat=True))
            classmate_courses = set(obj.courses.values_list('title', flat=True))
            common = list(current_courses.intersection(classmate_courses))
            return common
        return []
    
class CourseSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer()

    class Meta:
        model = Course
        fields = '__all__'

class ProfessorSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer()

    class Meta:
        model = Professor
        fields = '__all__'

class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    course = CourseSerializer()
    professor = ProfessorSerializer()

    class Meta:
        model = Review
        fields = '__all__'
