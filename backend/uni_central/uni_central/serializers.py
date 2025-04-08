from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Department, User, Course, Professor, Review, Thread, Comment

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
        
class ThreadSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    course = CourseSerializer(required=False, allow_null=True)
    professor = ProfessorSerializer(required=False, allow_null=True)

    class Meta:
        model = Thread
        fields = '__all__'

    def validate(self, data):
        """
        Ensure that exactly one of course or professor is provided.
        """
        course = data.get('course')
        professor = data.get('professor')

        if bool(course) == bool(professor):  # True == True or False == False → Invalid
            raise serializers.ValidationError("A thread must be linked to either a course or a professor, not both.")

        return data

class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    thread = ThreadSerializer(read_only=True)
    upvotes_count = serializers.IntegerField(source='upvotes.count', read_only=True)
    user_has_upvoted = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = '__all__'
    
    def get_user_has_upvoted(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user_email'):
            try:
                user = User.objects.get(email_address=request.user_email)
                return obj.upvotes.filter(user=user).exists()
            except Exception:
                return False
        return False