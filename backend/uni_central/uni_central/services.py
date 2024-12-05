from firebase_admin import auth
from .models import User
from django.db import IntegrityError

class FirebaseService:
    @staticmethod
    def create_or_update_user(firebase_user):
        """
        Sync Firebase user data with SQL database
        """
        user, created = User.objects.get_or_create(
            firebase_uid=firebase_user.uid,
            defaults={
                'email': firebase_user.email,
                'name': firebase_user.display_name or ''
            }
        )
        if not created:
            user.email = firebase_user.email
            user.name = firebase_user.display_name or ''
            user.save()
        return user

    @staticmethod
    def delete_user(firebase_uid):
        """
        Delete user from SQL database when deleted from Firebase
        """
        User.objects.filter(firebase_uid=firebase_uid).delete()

class UserService:
    @staticmethod
    def create_user(email_address, fname, lname):
        """
        Creates a new user in the SQLite database.
        Args:
            email_address (str): User's email address.
            fname (str): User's first name.
            lname (str): User's last name.
        Returns:
            User: The created user object.
        """
        try:
            # Attempt to create a new user
            user = User.objects.create(
                email_address=email_address,
                fname=fname,
                lname=lname
            )
            return user
        except Exception as e:
            print(f"Error creating user: {e}")
            return None

    @staticmethod
    def delete_user(user_id):
        """
        Deletes a user from the SQLite database by user_id.
        Args:
            user_id (int): The ID of the user to delete.
        Returns:
            bool: True if user was deleted, False if user not found.
        """
        try:
            user = User.objects.get(id=user_id)
            user.delete()
            return True
        except User.DoesNotExist:
            # If user is not found, return False
            return False
