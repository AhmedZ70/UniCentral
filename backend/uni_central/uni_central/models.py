from django.db import models
from django.db.models import Avg


##############
# USER MODEL #
##############
class User(models.Model):
    """
    A model to store user information.

    Attributes:
        id (AutoField): The primary key of the user. Automatically generated.
        email_address (EmailField): The unique email address of the user.
        fname (CharField): The first name of the user.
        lname (CharField): The last name of the user.
    """
    
    id = models.AutoField(primary_key=True)
    email_address = models.EmailField(max_length=255, unique=True)
    fname = models.CharField(max_length=100)
    lname = models.CharField(max_length=100)
    courses = models.ManyToManyField('Course', related_name='students')
    professors = models.ManyToManyField('Professor', related_name='students')
    university = models.CharField(max_length=255, null=True)
    major = models.CharField(max_length=255, null=True)
    year = models.IntegerField(null=True)
    course_plan = models.JSONField(default=dict)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.fname} {self.lname} ({self.email_address})"



################
# COURSE MODEL #
################
class Course(models.Model):
    """
    A model to store course information.

    Attributes:
        id (AutoField): The primary key of the course. Automatically generated.
        title (CharField): The title of the course (e.g., "Intro to Programming").
        subject (CharField): The subject of the course (e.g., 'CS').
        number (IntegerField): The course number (e.g., '101').
        department (ForeignKey): The department offering the course. References the `departments` table.
        avg_difficulty (FloatField): The average difficulty rating for the course. Default is 0.
        avg_rating (FloatField): The average rating for the course. Default is 0.
        credits (PositiveIntegerField): The number of credits the course is worth. Must be greater than 0.
        semester (CharField): The semester when the course is offered (e.g., 'Fall 2024'). Optional.
    """

    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    subject = models.CharField(max_length=100)
    number = models.IntegerField()
    department = models.ForeignKey('Department', on_delete=models.CASCADE, related_name='courses')
    avg_difficulty = models.FloatField(default=0)
    avg_rating = models.FloatField(default=0)
    credits = models.PositiveIntegerField()
    semester = models.CharField(max_length=100, blank=True, null=True)
    professors = models.ManyToManyField('Professor', related_name='courses')

    class Meta:
        db_table = 'courses'

    def __str__(self):
        return f"{self.title} ({self.subject} {self.number})"

    def update_averages(self):
        """Recalculate and update the average rating and difficulty."""
        from .models import Review
        # Calculate averages from related reviews
        averages = Review.objects.filter(course=self).aggregate(
            avg_rating=Avg('rating'),
            avg_difficulty=Avg('difficulty')
        )
        self.avg_rating = averages['avg_rating'] or 0  # Default to 0 if no reviews
        self.avg_difficulty = averages['avg_difficulty'] or 0  # Default to 0 if no reviews
        self.save()




###################
# PROFESSOR MODEL #
###################
class Professor(models.Model):
    """
    A model to store professor information.

    Attributes:
        id (AutoField): The primary key of the professor. Automatically generated.
        fname (CharField): The first name of the professor.
        lname (CharField): The last name of the professor.
        avg_rating (FloatField): The average rating for the professor. Default is 0.
        avg_difficulty (FloatField): The average difficulty rating for the professor. Default is 0.
        department (ForeignKey): The department the professor belongs to. References the `departments` table.
    """

    id = models.AutoField(primary_key=True)
    fname = models.CharField(max_length=100)
    lname = models.CharField(max_length=100)
    avg_rating = models.FloatField(default=0)
    avg_difficulty = models.FloatField(default=0)
    department = models.ForeignKey('Department', on_delete=models.CASCADE, related_name='professors')

    class Meta:
        db_table = 'professors'

    def __str__(self):
        return f"Professor {self.fname} {self.lname}"
    
    def update_averages(self):
        """Recalculate and update the average rating and difficulty for the professor."""
        from .models import Review
        # Calculate averages from related reviews
        averages = Review.objects.filter(professor=self).aggregate(
            avg_rating=Avg('rating'),
            avg_difficulty=Avg('difficulty')
        )

        # Update the professor's fields with calculated averages
        self.avg_rating = averages['avg_rating'] or 0  # Default to 0 if no reviews
        self.avg_difficulty = averages['avg_difficulty'] or 0  # Default to 0 if no reviews
        self.save()
####################
# DEPARTMENT MODEL #
####################
class Department(models.Model):
    """
    A model to store department information.

    Attributes:
        id (AutoField): The primary key of the department. Automatically generated.
        name (CharField): The name of the department (e.g., 'Computer Science').
        code (CharField): The unique code for the department (e.g., 'CS').
    """

    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'departments'

    def __str__(self):
        return f"{self.name} ({self.code})"


################
# REVIEW MODEL #
################
class Review(models.Model):
    """
    A model to store reviews for courses and professors written by users.

    Attributes:
        user (ForeignKey): The user who created the review.
        course (ForeignKey): The course this review is about. Optional.
        professor (ForeignKey): The professor this review is about. Optional.
        review (TextField): The content of the review provided by the user.
        rating (FloatField): The overall rating given by the user (out of 5).
        difficulty (IntegerField): The difficulty level (out of 6).
        estimated_hours (FloatField): Estimated weekly hours spent on the course.
        grade (CharField): The grade received in the course (e.g., 'A', 'B', etc.).
        would_take_again (BooleanField): Indicates if the user would take the course again.
        for_credit (BooleanField): Indicates if the course was taken for credit.
        mandatory_attendance (BooleanField): Indicates if attendance was mandatory.
        required_course (BooleanField): Indicates if the course is required for the user's program.
        is_gened (BooleanField): Indicates if the course is a general education requirement.
        in_person (BooleanField): Indicates if the course was conducted in person.
        online (BooleanField): Indicates if the course was conducted online.
        hybrid (BooleanField): Indicates if the course was a hybrid format.
        no_exams (BooleanField): Indicates if the course had no exams.
        presentations (BooleanField): Indicates if the course involved presentations.
    """
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey('User', on_delete=models.CASCADE)
    course = models.ForeignKey('Course', on_delete=models.CASCADE, related_name='reviews', blank=True, null=True)
    professor = models.ForeignKey('Professor', on_delete=models.CASCADE, blank=True, null=True)
    review = models.TextField(blank=True, null=True)
    rating = models.FloatField(null=True, blank=True)
    difficulty = models.IntegerField(null=True, blank=True)
    estimated_hours = models.FloatField(null=True, blank=True)
    grade = models.CharField(max_length=2, null=True, blank=True)
    
    # Boolean fields
    would_take_again = models.BooleanField(default=False)
    for_credit = models.BooleanField(default=False)
    mandatory_attendance = models.BooleanField(default=False)
    required_course = models.BooleanField(default=False)
    is_gened = models.BooleanField(default=False)
    in_person = models.BooleanField(default=False)
    online = models.BooleanField(default=False)
    hybrid = models.BooleanField(default=False)
    no_exams = models.BooleanField(default=False)
    presentations = models.BooleanField(default=False)

    class Meta:
        db_table = 'reviews'

    def __str__(self):
        course_name = self.course.title if self.course else "No Course"
        return f"Review by {self.user.fname} for {course_name}"
    
####################
# REVIEWVOTE MODEL #
####################
class ReviewVote(models.Model):
    """
    A model for tracking likes and dislikes on reviews.

    Attributes:
        user (ForeignKey): The user who voted.
        review (ForeignKey): The review being voted on.
        vote_type (CharField): Type of vote ('like' or 'dislike').
        created_at (DateTimeField): When the vote was created.
    """
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='review_votes')
    review = models.ForeignKey('Review', on_delete=models.CASCADE, related_name='votes')
    vote_type = models.CharField(max_length=10, choices=[
        ('like', 'Like'),
        ('dislike', 'Dislike')
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'review_votes'
        unique_together = ('user', 'review')
        verbose_name = 'Review Vote'
        verbose_name_plural = 'Review Votes'
        
    def __str__(self):
        return f"{self.user.email_address} {self.vote_type}d review #{self.review.id}"

class Thread(models.Model):
    """
    A model representing a discussion thread.

    Attributes:
        id (AutoField): The primary key of the thread. Automatically generated.
        title (CharField): The title of the discussion thread.
        category (CharField): The category of the thread (e.g., Exams, Homework, etc.).
        user (ForeignKey): The user who started the thread.
        course (ForeignKey): The course related to this thread.
        professor (ForeignKey): The professor related to this thread.
        created_at (DateTimeField): The timestamp when the thread was created.
        updated_at (DateTimeField): The timestamp when the thread was last updated.
    """

    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    category = models.CharField(
        max_length=50, 
        choices=[
            ('general', 'General'),
            ('exams', 'Exams'),
            ('homework', 'Homework'),
            ('projects', 'Projects')
        ],
        default='general'
    )
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='threads')
    course = models.ForeignKey('Course', on_delete=models.CASCADE, 
                               related_name='threads', blank=True, null=True)
    professor = models.ForeignKey('Professor', on_delete=models.CASCADE,
                                  related_name='threads', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'threads'

    def __str__(self):
        return self.title


####################
# COMMENT MODEL #
####################
class Comment(models.Model):
    """
    A model representing a comment in a discussion thread.

    Attributes:
        id (AutoField): The primary key of the comment. Automatically generated.
        thread (ForeignKey): The thread this comment belongs to.
        user (ForeignKey): The user who posted the comment.
        content (TextField): The text content of the comment.
        created_at (DateTimeField): The timestamp when the comment was created.
        updated_at (DateTimeField): The timestamp when the comment was last updated.
    """

    id = models.AutoField(primary_key=True)
    thread = models.ForeignKey('Thread', on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'comments'

    def __str__(self):
        return f"Comment by {self.user.fname} on {self.thread.title}"

class CommentUpvote(models.Model):
    """
    A model for tracking upvotes on comments.
    """
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='comment_upvotes')
    comment = models.ForeignKey('Comment', on_delete=models.CASCADE, related_name='upvotes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'comment_upvotes'
        unique_together = ('user', 'comment')
        
    def __str__(self):
        return f"{self.user.email_address} upvoted comment #{self.comment.id}"

class CoursePlan(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'course_plans'
        verbose_name = 'Course Plan'
        verbose_name_plural = 'Course Plans'

    def __str__(self):
        return f"Course Plan for {self.user.email}"
    
