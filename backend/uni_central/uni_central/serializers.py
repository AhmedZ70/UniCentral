from rest_framework import serializers
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

class CommentSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    timestamp = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = ['id', 'content', 'author', 'timestamp', 'upvotes']
    
    def get_author(self, obj):
        if obj.user:
            return f"{obj.user.fname} {obj.user.lname}"
        return "Anonymous Student"
    
    def get_timestamp(self, obj):
        return obj.created_at

class ThreadSerializer(serializers.ModelSerializer):
    comments = CommentSerializer(many=True, read_only=True)
    author = serializers.SerializerMethodField()
    timestamp = serializers.SerializerMethodField()
    reply_count = serializers.SerializerMethodField()
    topic_tag = serializers.SerializerMethodField()
    
    class Meta:
        model = Thread
        fields = ['id', 'title', 'content', 'author', 'timestamp', 
                  'reply_count', 'topic_tag', 'comments']
    
    def get_author(self, obj):
        if obj.user:
            return f"{obj.user.fname} {obj.user.lname}"
        return "Anonymous Student"
    
    def get_timestamp(self, obj):
        return obj.created_at
    
    def get_reply_count(self, obj):
        return obj.comments.count()
    
    def get_topic_tag(self, obj):
        return obj.get_category_display()
