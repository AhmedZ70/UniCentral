# UniCentral

## Project Summary

UniCentral is a comprehensive course planning platform that helps students make informed academic decisions by offering features such as course reviews, professor ratings, semester offerings, and workload estimations. It solves the problem of fragmented academic planning by centralizing crucial information and allowing students to find courses that fit their schedules and workload capacity. Additionally, UniCentral fosters peer-to-peer engagement by enabling students to share feedback on courses and professors. As a capstone project, it addresses a real student need while incorporating key software engineering challenges, such as frontend development, backend integration, database management, and user authentication.

---

## Getting Started

### Download and Install

```bash
# Clone the repository
git clone https://capstone.cs.utah.edu/unicentral/unicentral.git
cd unicentral

# Install backend dependencies
cd backend/uni_central
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r ../../requirements.txt

# Set up the database
python manage.py migrate

# Load initial data (optional)
python manage.py course_scraper

# Install frontend dependencies
cd ../../
npm install
```

### Run the Application

```bash
# Start the backend server (from backend/uni_central directory)
python manage.py runserver

# In a separate terminal, build and run the frontend
npm run build  # Creates production build
# OR for development with hot reloading
npm run dev
```

Access the application at http://127.0.0.1:8000/

### How to Use UniCentral

1. **Create an Account**: Sign up using the registration form or Google authentication.
2. **Browse Courses**: Explore the course catalog with advanced filtering options.
3. **Read and Write Reviews**: View ratings and feedback for courses and professors, and contribute your own reviews.
4. **Plan Your Schedule**: Use the course planner to organize your academic journey by semester.
5. **Connect with Classmates**: Engage in discussion boards and find study buddies for your courses.
6. **Manage Your Profile**: Track your courses, reviews, and messages in your personal dashboard.

---

## Abstract

UniCentral is a comprehensive course planning tool designed to empower students to make informed academic decisions. Serving as a one-stop solution, it consolidates course reviews, professor ratings, semester offerings, workload estimations, and peer feedback into a user-friendly platform. This tool enables students to filter and select courses that align with their schedules, time commitments, and academic goals, addressing the challenge of fragmented and unreliable information sources in academic planning.

The project will integrate dynamic frontend and backend technologies to provide a seamless user experience. Key features include a course filter with advanced criteria, professor and course review submission and management, personalized course planners, and social features like peer messaging and discussion boards. UniCentral also incorporates analytics for performance tracking, fostering a deeper understanding of academic progress.

The development process includes:

- Frontend: React-based dynamic components, drag-and-drop functionality, and Chart.js for analytics visualization.
- Backend: Robust APIs for data retrieval and user management, Firebase authentication, and social feature endpoints.
- Integration: Dynamic data syncing between the UI and backend, advanced filtering capabilities, and real-time updates.
- Testing: Comprehensive test suites for core and advanced features, focusing on usability, security, and scalability.

UniCentral not only addresses a real and recurring student need but also serves as a capstone project incorporating frontend development, backend integration, database management, and user authentication. The platform aims to enhance academic planning while fostering collaboration and community among students.

---

[![pipeline status](https://capstone.cs.utah.edu/unicentral/unicentral/badges/main/pipeline.svg)](https://capstone.cs.utah.edu/unicentral/unicentral/-/commits/main)

## System Requirements

- **Operating Systems**: macOS, Windows, Linux
- **Python**: 3.8 or higher
- **Node.js**: 14.x or higher
- **npm**: 6.x or higher

## Setup and Installation

### Prerequisites

1. Install [Python](https://www.python.org/downloads/) (3.8+)
2. Install [Node.js and npm](https://nodejs.org/en/download/)
3. Install [Git](https://git-scm.com/downloads)

### Backend Setup

```bash
# Clone the repository
git clone https://your-gitlab-instance/unicentral/unicentral.git
cd unicentral

# Create and activate a virtual environment
cd backend/uni_central
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r ../../requirements.txt

# Create database migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create a superuser (optional)
python manage.py createsuperuser

# Load initial data (if available)
python manage.py loaddata initial_data.json

# Scrape course data (optional)
python manage.py course_scraper
```

### Frontend Setup

```bash
# From the project root
cd frontend

# Install dependencies
npm install

# Build the frontend assets
npm run build
```

## Running the Application

### Development Mode

```bash
# Run the backend (from backend/uni_central)
python manage.py runserver

# Run the frontend (from frontend directory)
npm run dev
```

The application will be available at:
- Backend: http://127.0.0.1:8000/
- Frontend development server: http://localhost:3000/

### Production Mode

```bash
# Build optimized frontend assets
cd frontend
npm run build

# Run the Django server with production settings
cd ../backend/uni_central
python manage.py runserver --settings=uni_central.settings.production
```

## Summary of Technologies

- **Task Manager:** GitLab
- **Versioning System:** GitLab
- **Hosting Service/Cloud Provider**: Amazon Web Services (AWS)
- **Project Languages**: JavaScript (Frontend), Python (Backend)
- **Platforms Supported**: Web
- **Databases Used**: SQLite3 (Development), PostgreSQL (Production)
- **Frontend Framework**: React
- **Backend Framework**: Django
- **Authentication**: Firebase Authentication
- **Additional Libraries**:
  - **Frontend**: React Router, Chart.js, Axios
  - **Backend**: Django REST Framework, django-cors-headers, pytest

---

## Development and Testing

### Backend Testing

The backend uses Django's testing framework with pytest for more advanced test cases:

```bash
# Run all backend tests
cd backend/uni_central
python manage.py test

# Run tests with pytest and coverage
pytest --cov=uni_central

# Run specific test module
python manage.py test uni_central.tests.test_views
```

### Frontend Testing

The frontend uses Jest and React Testing Library for component testing:

```bash
# Run all frontend tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Code Quality

We use several tools to maintain code quality:

- **Backend**:
  - Flake8 for PEP8 style checking
  - Black for code formatting
  - Pylint for code quality
  - Bandit for security scanning

- **Frontend**:
  - ESLint for code quality
  - Prettier for code formatting

```bash
# Backend linting
flake8 backend/
black backend/
pylint backend/

# Frontend linting
npm run lint
npm run format
```

### CI/CD Pipeline

Our CI/CD pipeline automatically runs:

1. **Linting** - Code style and quality checks
2. **Testing** - Comprehensive test suites for both backend and frontend
3. **Security Scanning** - Checks for security vulnerabilities
4. **Building** - Builds optimized assets for deployment
5. **Deployment** - Automated deployments to staging and production (manual approval required)

The pipeline configuration is defined in `.gitlab-ci.yml`.

## API Documentation

API documentation is available at `/api/docs/` when running the application locally. It provides details on all available endpoints, request methods, parameters, and response formats.

## Troubleshooting

### Common Issues

1. **Database migration errors**:
   - Ensure you've run `python manage.py makemigrations` before `python manage.py migrate`
   - If conflicts occur, try `python manage.py migrate --fake-initial`

2. **Frontend build errors**:
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall: `rm -rf node_modules && npm install`

3. **Connection refused errors**:
   - Verify the backend server is running
   - Check CORS settings in Django settings.py
   - Ensure API_URL in frontend configuration points to the correct backend URL

### Getting Help

If you encounter any issues not addressed here:
1. Check the project wiki for in-depth documentation
2. File an issue in the GitLab issue tracker
3. Contact the development team

---