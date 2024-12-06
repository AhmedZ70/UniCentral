from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg
from .models import Course, Review

# Signal handler for creating or updating a review
@receiver(post_save, sender=Review)
def update_course_avg_ratings_on_create(sender, instance, created, **kwargs):
    """
    Update the avg_rating and avg_difficulty fields of the related course when a review is created or updated.
    """
    # The course that the review belongs to
    course = instance.course
    
    # Recalculate the average rating and difficulty
    reviews = Review.objects.filter(course=course)
    
    if reviews.exists():
        avg_rating = reviews.aggregate(Avg('rating'))['rating__avg']
        avg_difficulty = reviews.aggregate(Avg('difficulty'))['difficulty__avg']

        # Update the course with the new averages
        course.avg_rating = avg_rating
        course.avg_difficulty = avg_difficulty
        course.save()

# Signal handler for deleting a review
@receiver(post_delete, sender=Review)
def update_course_avg_ratings_on_delete(sender, instance, **kwargs):
    """
    Update the avg_rating and avg_difficulty fields of the related course when a review is deleted.
    """
    course = instance.course  # The course that the review belonged to

    # Recalculate the average rating and difficulty for the remaining reviews
    reviews = Review.objects.filter(course=course)
    
    if reviews.exists():
        avg_rating = reviews.aggregate(Avg('rating'))['rating__avg']
        avg_difficulty = reviews.aggregate(Avg('difficulty'))['difficulty__avg']

        # Update the course with the new averages
        course.avg_rating = avg_rating
        course.avg_difficulty = avg_difficulty
        course.save()
    else:
        # If no reviews are left, set averages to None or defaults
        course.avg_rating = 0
        course.avg_difficulty = 0
        course.save()
