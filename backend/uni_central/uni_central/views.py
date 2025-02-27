from django.shortcuts import render, get_object_or_404
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from .services import (
    UserService,
    DepartmentService,
    CourseService, 
    ReviewService, 
    ProfessorService,
    CourseFilteringService,
    ThreadService,
    CommentService,
    )
from .serializers import (
    DepartmentSerializer,
    UserSerializer,
    CourseSerializer,
    ProfessorSerializer,
    ReviewSerializer,
    ThreadSerializer,
    CommentSerializer
)

######################
# General Page Views #
######################

def home(request):
    """
    Render the Home page.
    """
    return render(request, 'index.html')

def signup_page(request):
    """
    Render the Signup page.
    """
    return render(request, 'signup.html')

def login_page(request):
    """
    Render the Login page.
    """
    return render(request, 'login.html')

def my_account(request):
    """
    Render the My Account page.
    """    
    context = {
        'userEmail': request.user.email if request.user.is_authenticated else None
    }
    return render(request, 'my_account.html', context)

def my_courses(request):
    """
    Render the My Courses page.
    """
    return render(request, 'my_courses.html')

def my_professors(request):
    """
    Render the My Professors page.
    """
    return render(request, 'my_professors.html')

def my_classmates(request):
    """
    Render the My Classmates page.
    """
    return render(request, 'my_classmates.html')

def my_reviews(request):
    """
    Render the My Reviews page.
    """
    return render(request, 'my_reviews.html')

def course_planner(request):
    """
    Render the Course Planner page.
    """
    return render(request, 'course_planner.html')

def courses(request):
    """
    Render the Courses page.
    """
    return render(request, 'courses.html')

def course_filtering(request):
    """
    Render the Course Filtering page.
    """
    return render(request, 'course_filtering.html')

def discussion_board(request, context_id, context_type):
    """
    Render discussion board for either a course or professor
    
    Args:
        request: HTTP request
        context_id: ID of the course or professor
        context_type: 'course' or 'professor'
    """
    # Validate context_type
    if context_type not in ['course', 'professor']:
        raise ValueError("Invalid context type")

    # Fetch the appropriate object based on context type
    if context_type == 'course':
        context_object = CourseService.get_course(context_id)
        name = context_object.title  # Using 'title' from your Course model
    elif context_type == 'professor':
        context_object = ProfessorService.get_professor(context_id)
        name = f"{context_object.fname} {context_object.lname}"  # Using fname/lname from your Professor model
    
    # Fetch threads for this context
    if context_type == 'course':
        threads = ThreadService.get_threads_by_course(context_id)
    else:
        threads = ThreadService.get_threads_by_professor(context_id)

    context = {
        'context_id': context_id,
        'context_type': context_type,
        'name': name,
        'threads': threads
    }
    return render(request, 'discussion_board.html', context)

def about_page(request):
    """
    Render the About page.
    """
    return render(request, 'about.html')

def course_detail(request, course_id):
    """
    Render the template for a Course Detail page.
    The frontend (JS) will call the API endpoint below to get course + reviews.
    """
    context = {
        'course_id': course_id, 
    }
    return render(request, 'course_detail.html', context)

def professor_detail(request, professor_id):
    """
    Render the template for a professor Detail page.
    The frontend (JS) will call the API endpoint below to get course + reviews.
    """
    context = {
        'professor_id': professor_id, 
    }
    return render(request, 'professor_detail.html', context)


def review_form_page(request, context_type, context_id):
    # context_type should be either "course" or "professor"
    context = {
        'context_type': context_type,
        'context_id': context_id,
        
    }
    return render(request, 'review_form.html', context)

def professors(request):
    """
    Render the Professors page.
    """
    return render(request, 'professors.html')

#####################################
# Department-Related Views and APIs #
#####################################

class DepartmentListView(APIView):
    """
    Lists all departments or creates a new one.
    """
    def get(self, request):
        """
        Handles GET requests to list all departments.
        """
        query = DepartmentService.get_all_departments()
        serialized = DepartmentSerializer(query, many=True)
        return Response(serialized.data)

#################################
# Course-Related Views and APIs #
#################################

# API View for Getting Courses in a Specific Department
class DepartmentCoursesView(APIView):
    """
    Retrieves courses for a specific department by ID.
    """
    def get(self, request, department_id):
        """
        Fetches courses for the given department ID.
        """        
        # ForeignKey relationship from Course to Department
        courses = CourseService.get_courses_by_department(department_id)
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data)
    
class CourseReviewListView(APIView):
    """
    API View to fetch details of a course and its reviews.
    """
    def get(self, request, course_id):
        # Use service layer to retrieve data
        course = CourseService.get_course(course_id)
        reviews = ReviewService.get_reviews_by_course(course_id)

        # Serialize data
        course_serializer = CourseSerializer(course)
        review_serializer = ReviewSerializer(reviews, many=True)

        # Combine data
        data = {
            'course': course_serializer.data,
            'reviews': review_serializer.data
        }
        return Response(data, status=status.HTTP_200_OK)

class ProfessorCoursesAPIView(APIView):
    """
    Fetch all courses for a given professor (GET /api/professors/<professor_id>/courses/).
    """
    def get(self, request, professor_id):
        """
        Handles GET requests to fetch courses for the given professor.
        """
        try:
            # Fetch courses using the service layer
            courses = CourseService.get_courses_by_professor(professor_id)
            serialized = CourseSerializer(courses, many=True)
            return Response(serialized.data, status=status.HTTP_200_OK)
        except Exception as e:
            # Handle cases like invalid professor_id
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
####################################
# Review-Related Views and APIs #
####################################

class CreateReviewAPIView(APIView):
    """
    Handle the creation of a Review for a given course (POST).
    """
    def post(self, request, course_id):
        email_address = request.data.get('email_address')
        user = UserService.get_user(email_address)
        review_data = request.data

        try:
            review = ReviewService.create_review_for_course(course_id, user, review_data)
            return Response(
                {"message": "Review created successfully", "review_id": review.id},
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
            
class CreateProfessorReviewAPIView(APIView):
    """
    API View to handle the creation of a review for a professor.
    """
    def post(self, request, professor_id):
        email_address = request.data.get('email_address')
        user = UserService.get_user(email_address)
        review_data = request.data

        try:
            review = ReviewService.create_review_for_professor(professor_id, user, review_data)
            return Response(
                {"message": "Review created successfully", "review_id": review.id},
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
            
class UpdateReviewAPIView(APIView):
    """
    API View to update an existing review by review_id.
    """

    def put(self, request):
        """
        Handles PUT requests to update a review.
        """
        try:
            review_id = request.get.data('review_id')
            updated_review = ReviewService.update_review(review_id, request.data)
            serializer = ReviewSerializer(updated_review)
            return Response({"message": "Review updated successfully", "review": serializer.data}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(str(e))

class DeleteReviewAPIView(APIView):
    """
    API View to delete an existing review by review_id.
    """
    
    def delete(self, request, review_id):
        """
        Calls the ReviewService to delete a review.
        """
        review_id = request.data.get('review_id')
        review = ReviewService.get_review_by_id(review_id)
        result = ReviewService.delete_review(review)

        return Response(result)

####################################
# Professor-Related Views and APIs #
####################################

class CourseProfessorsAPIView(APIView):
    """
    Fetch all professors for a given course (GET /api/courses/<course_id>/professors/).
    """
    def get(self, request, course_id):
        """
        Handles GET requests to fetch professors for the given course.
        """
        professors = ProfessorService.get_professors_by_course(course_id)
        serialized = ProfessorSerializer(professors, many=True)
        return Response(serialized.data, status=status.HTTP_200_OK)

class DepartmentProfessorsView(APIView):
    """
    Retrieves professors for a specific department by ID.
    """
    def get(self, request, department_id):
        """
        Fetches courses for the given department ID.
        """        
        # ForeignKey relationship from Course to Department
        professors = ProfessorService.get_professors_by_department(department_id)
        serializer = ProfessorSerializer(professors, many=True)
        return Response(serializer.data)
    
class ProfessorReviewListView(APIView):
    """
    API View to fetch professor details, their reviews, and courses taught.
    """
    def get(self, request, professor_id):
        # Fetch professor and reviews using the service layer
        professor = ProfessorService.get_professor(professor_id)
        reviews = ReviewService.get_reviews_by_professor(professor_id)

        # Fetch courses taught by the professor using the service layer
        courses_taught = CourseService.get_courses_by_professor(professor_id)

        # Serialize the data
        professor_serializer = ProfessorSerializer(professor)
        review_serializer = ReviewSerializer(reviews, many=True)
        course_serializer = CourseSerializer(courses_taught, many=True)

        # Return the combined data
        data = {
            'professor': professor_serializer.data,
            'reviews': review_serializer.data,
            'courses_taught': course_serializer.data,
        }
        return Response(data, status=status.HTTP_200_OK)

####################################
# User-Related Views and APIs #
####################################

class AddProfessorView(APIView):
    """
    API View to add a professor to a user when they add.
    """
    def post(self, request, professor_id):
        email_address = request.data.get('email_address')
        user = UserService.get_user(email_address)
        professor = ProfessorService.get_professor(professor_id)
        UserService.add_professor(user, professor)
        
        return Response(
            {
                "message": "Added Professor to Professors successfully",
                "professor_id": professor_id
            },
            status=status.HTTP_201_CREATED
        )
        
class RemoveProfessorView(APIView):
    """
    API View to remove a proffesor from a users account.
    """
    def delete(self, request, professor_id):
        email_address = request.data.get('email_address')
        user = UserService.get_user(email_address)
        professor = ProfessorService.get_professor(professor_id)

        success = UserService.remove_professor(user, professor)

        if success:
            return Response({"message": "Professor removed successfully."}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Professor was not removed from this user."}, status=status.HTTP_400_BAD_REQUEST)

class EnrollView(APIView):
    """
    API View to add a course to a user when they enroll.
    """
    def post(self, request, course_id):
        email_address = request.data.get('email_address')
        user = UserService.get_user(email_address)
        course = CourseService.get_course(course_id)
        UserService.add_course(user, course)
        
        return Response(
            {
                "message": "Enrolled in course successfully",
                "course_id": course_id
            },
            status=status.HTTP_201_CREATED
        )

class UnEnrollView(APIView):
    """
    API View to remove a course to a user when they un-enroll.
    """
    def delete(self, request, course_id):
        email_address = request.data.get('email_address')
        user = UserService.get_user(email_address)
        course = CourseService.get_course(course_id)

        success = UserService.remove_course(user, course)

        if success:
            return Response({"message": "Course removed successfully."}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "User was not enrolled in this course."}, status=status.HTTP_400_BAD_REQUEST)
        
class MyAccountView(APIView):
    def get(self, request, email_address):
        try:
            user = UserService.get_user(email_address)
            
            if not user:
                return Response(
                    {"error": "User not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
                
            data = UserSerializer(user).data
            data['university'] = user.university
            data['major'] = user.major
            data['year'] = user.year
            
            return Response(data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error in MyAccountView: {str(e)}")  
            import traceback
            print(f"Full traceback: {traceback.format_exc()}") 
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class EditAccountView(APIView):
    """
    API View to edit account information of a user.
    """
    def post(self, request):
        try:
            email_address = request.data.get('email_address')
            user = UserService.get_user(email_address=email_address)
            university = request.data.get('university')
            major = request.data.get('major')
            year = request.data.get('year')
            
            updated_user = UserService.change_account_info(
                user=user, 
                university=university,
                year=year, 
                major=major
            )
            
            return Response({
                "message": "Profile updated successfully",
                "data": {
                    "university": updated_user.university,
                    "major": updated_user.major,
                    "year": updated_user.year
                }
            })
            
        except Exception as e:
            print("Error:", str(e))  # For debugging
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class MyCoursesView(APIView):
    """
    API View to fetch courses that a user is in.
    """
    def get(self, request, email_address):
        user = UserService.get_user(email_address)
        courses = UserService.get_courses(user)
        
        serialized = CourseSerializer(courses, many=True)
        return Response(serialized.data, status=status.HTTP_200_OK)
    
class MyProfessorsView(APIView):
    """
    API View to fetch the list of professors added by a user.
    """
    def get(self, request, email_address):  # Accept email_address as a positional argument
        # Fetch the user by email address
        user = UserService.get_user(email_address)
        
        # Fetch the professors added by the user
        professors = UserService.get_professors(user)
        
        # Serialize the professors
        serializer = ProfessorSerializer(professors, many=True)
        
        # Return the serialized data
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class MyReviewsView(APIView):
    """
    API View to fetch reviews of courses that a user has made.
    """
    def get(self, request):
        email_address = request.data.get('email_address')
        user = UserService.get_user(email_address)
        
        reviews = UserService.get_reviews(user)
        serialized = ReviewSerializer(reviews, many=True)
        return Response(serialized.data, status=status.HTTP_200_OK)
    
class MyClassmatesView(APIView):
    """
    API View to fetch classmates in the courses of a user
    """
    def get(self, request):
        email_address = request.data.get('email_address')
        user = UserService.get_user(email_address)
        
        classmates = UserService.get_classmates(user)
        serialized = UserSerializer(classmates, many=True)
        return Response(serialized.data, status=status.HTTP_200_OK)
    
class CoursePlanUpdateAPIView(APIView):
    """
    API View to update the user's course plan only.
    """

    def put(self, request):
        try:
            email_address = request.data.get("email_address")
            user = UserService.get_user(email_address=email_address)

            if not user:
                return Response(
                    {"error": "User not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )

            course_plan = request.data.get("course_plan")
            if course_plan is None:
                return Response(
                    {"error": "course_plan is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            updated_user = UserService.update_course_plan(user, course_plan)

            return Response({
                "message": "Course plan updated successfully",
                "course_plan": updated_user.course_plan
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    
class CreateUserView(APIView):
    """
    Handles user creation requests.
    """

    def post(self, request):
        try:
            email_address = request.data.get('email')
            fname = request.data.get('fname')
            lname = request.data.get('lname')
            
            if not email_address or not fname or not lname:
                print("Missing required fields")
                return Response({
                    "success": False,
                    "message": "Missing required fields.",
                    "received": {
                        "email_address": email_address,
                        "fname": fname,
                        "lname": lname
                    }
                }, status=status.HTTP_400_BAD_REQUEST)

            user = UserService.create_user(email_address, fname, lname)
            
            if user:
                print(f"User created successfully: {user}")
                return Response({
                    "success": True,
                    "message": "User created successfully.",
                    "data": {
                        "email_address": user.email_address,
                        "fname": user.fname,
                        "lname": user.lname
                    }
                }, status=status.HTTP_201_CREATED)
            else:
                print("UserService.create_user returned None")
                return Response({
                    "success": False,
                    "message": "Error creating user in database"
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print(f"Exception in CreateUserView: {str(e)}")
            import traceback
            print(f"Full traceback: {traceback.format_exc()}")
            return Response({
                "success": False,
                "message": f"Server error: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
####################################
# Course-Filtering Views and APIs #
####################################

class CourseFilteringView(APIView):
    """
    API View to dynamically filter courses based on query parameters.
    """
    
    def get(self, request):
        try:
            filters = request.query_params  # <-- Changed from request.data to request.query_params
            filtered_courses = CourseFilteringService.filter_courses(filters)
            serialized = CourseSerializer(filtered_courses, many=True)
            return Response(serialized.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

#########################
# Thread Views and APIs #
#########################

class CourseThreadsAPIView(APIView):
    """
    API View to fetch all threads related to a specific course.
    """

    def get(self, request, course_id):
        threads = ThreadService.get_threads_by_course(course_id)

        if threads is None:
            return Response({"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND)

        serialized = ThreadSerializer(threads, many=True)
        return Response(serialized.data)

class ProfessorThreadsAPIView(APIView):
    """
    API View to fetch all threads related to a specific professor.
    """

    def get(self, request, professor_id):
        threads = ThreadService.get_threads_by_professor(professor_id)

        if threads is None:
            return Response({"error": "Professor not found"}, status=status.HTTP_404_NOT_FOUND)

        serialized = ThreadSerializer(threads, many=True)
        return Response(serialized.data)

class CreateThreadAPIView(APIView):
    """
    API View to create a new thread.
    """
    def post(self, request):
        user = UserService.get_user(request.data.get("email_address"))
        result = ThreadService.create_thread(user, request.data)

        if result["success"]:
            serializer = ThreadSerializer(result["thread"])
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response({"error": result["error"]}, status=status.HTTP_400_BAD_REQUEST)


class UpdateThreadAPIView(APIView):
    """
    API View to update an existing thread.
    """

    def put(self, request, thread_id):
        result = ThreadService.update_thread(thread_id, request.data)

        if result["success"]:
            serializer = ThreadSerializer(result["thread"])
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response({"error": result["error"]}, status=status.HTTP_400_BAD_REQUEST)


class DeleteThreadAPIView(APIView):
    """
    API View to delete an existing thread.
    """

    def delete(self, request, thread_id):
        result = ThreadService.delete_thread(thread_id)

        if result["success"]:
            return Response({"message": result["message"]}, status=status.HTTP_200_OK)
        
        return Response({"error": result["error"]}, status=status.HTTP_400_BAD_REQUEST)


##########################
# Comment Views and APIs #
##########################

class ThreadCommentsAPIView(APIView):
    """
    API View to fetch all comments related to a specific thread.
    """

    def get(self, request, thread_id):
        comments = CommentService.get_comments_by_thread(thread_id)

        if comments is None:
            return Response({"error": "Thread not found"}, status=status.HTTP_404_NOT_FOUND)

        serialized = CommentSerializer(comments, many=True)
        return Response(serialized.data)

class CreateCommentAPIView(APIView):
    """
    API View to create a new comment.
    """

    def post(self, request, thread_id):
        user = UserService.get_user(request.data.get("email_address"))
        result = CommentService.create_comment(thread_id, request.data)

        if result["success"]:
            serializer = CommentSerializer(result["comment"])
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response({"error": result["error"]}, status=status.HTTP_400_BAD_REQUEST)


class UpdateCommentAPIView(APIView):
    """
    API View to update an existing comment.
    """

    def put(self, request, comment_id):
        result = CommentService.update_comment(comment_id, request.data)

        if result["success"]:
            serializer = CommentSerializer(result["comment"])
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response({"error": result["error"]}, status=status.HTTP_400_BAD_REQUEST)


class DeleteCommentAPIView(APIView):
    """
    API View to delete an existing comment.
    """

    def delete(self, request, comment_id):
        result = CommentService.delete_comment(comment_id)

        if result["success"]:
            return Response({"message": result["message"]}, status=status.HTTP_200_OK)
        
        return Response({"error": result["error"]}, status=status.HTTP_400_BAD_REQUEST)