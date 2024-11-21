from django.db import models

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

    class Meta:
        db_table = 'courses'

    def __str__(self):
        return f"{self.title} ({self.subject} {self.number})"


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
        id (AutoField): The primary key of the review. Automatically generated.
        user (ForeignKey): The user who created the review. References the `users` table.
        course_subject (CharField): The subject of the course (e.g., 'CS'). Optional.
        course_num (IntegerField): The course number (e.g., '101'). Optional.
        course (ForeignKey): The course this review is about. References the `courses` table. Optional.
        professor_fname (CharField): The first name of the professor. Optional.
        professor (ForeignKey): The professor this review is about. References the `professors` table. Optional.
        review (TextField): The content of the review provided by the user. Optional.
    """

    id = models.AutoField(primary_key=True)
    user = models.ForeignKey('User', on_delete=models.CASCADE)
    course_subject = models.CharField(max_length=100, blank=True, null=True)
    course_num = models.IntegerField(blank=True, null=True)
    course = models.ForeignKey('Course', on_delete=models.CASCADE, blank=True, null=True)
    professor_fname = models.CharField(max_length=100, blank=True, null=True)
    professor = models.ForeignKey('Professor', on_delete=models.CASCADE, blank=True, null=True)
    review = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'reviews'

    def __str__(self):
        return f"Review by {self.user} for Course: {self.course} and Professor: {self.professor}"


##########################
# COURSE_PROFESSOR MODEL #
##########################
class CourseProfessor(models.Model):
    """
    A model representing the many-to-many relationship between courses and professors.

    Attributes:
        course (ForeignKey): The course in the relationship. References the `courses` table.
        professor (ForeignKey): The professor in the relationship. References the `professors` table.
    """

    course = models.ForeignKey('Course', on_delete=models.CASCADE)
    professor = models.ForeignKey('Professor', on_delete=models.CASCADE)

    class Meta:
        db_table = 'courses_professors'
        # Ensure no duplicate relationships
        unique_together = ('course', 'professor')

    def __str__(self):
        return f"{self.course.title} - {self.professor.fname} {self.professor.lname}"
