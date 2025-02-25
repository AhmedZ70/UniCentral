from django.core.management.base import BaseCommand
from uni_central.models import Course

class Command(BaseCommand):
    help = "Removes duplicate course numbers from the Course.subject field if present."

    def handle(self, *args, **options):
        courses = Course.objects.all()
        total_modified = 0

        for course in courses:
            if course.subject:
                tokens = course.subject.split()
                # If there are at least two tokens and the last token matches the course number,
                # remove it.
                if len(tokens) >= 2 and tokens[-1] == str(course.number):
                    new_subject = " ".join(tokens[:-1])
                    self.stdout.write(f"Updating Course ID {course.id}: '{course.subject}' -> '{new_subject}'")
                    course.subject = new_subject
                    course.save()
                    total_modified += 1

        self.stdout.write(self.style.SUCCESS(f"Cleaning complete. Modified {total_modified} courses."))
