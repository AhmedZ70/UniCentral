# unicentral



# **UniCentral**


## **Project Summary**

UniCentral is a comprehensive course planning platform that helps students make informed academic decisions by offering features such as course reviews, professor ratings, semester offerings, and workload estimations. It solves the problem of fragmented academic planning by centralizing crucial information and allowing students to find courses that fit their schedules and workload capacity. Additionally, UniCentral fosters peer-to-peer engagement by enabling students to share feedback on courses and professors. As a capstone project, it addresses a real student need while incorporating key software engineering challenges, such as frontend development, backend integration, database management, and user authentication.

---

## **Abstract**

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


## **Summary of Technologies**

- **Task Manager:** GitLab
- **Versioning System:** GitLab
- **Hosting Service/Cloud Provider**: Amazon Web Services (AWS)
- **Project Languages**: JavaScript (Frontend), Python (Backend)
- **Platforms Supported**: Web
- **Databases Used**: SQLite3

---

## **Development and Testing**

### **Backend Testing**

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

### **Frontend Testing**

The frontend uses Jest and React Testing Library for component testing:

```bash
# Run all frontend tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### **Code Quality**

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

### **CI/CD Pipeline**

Our CI/CD pipeline automatically runs:

1. **Linting** - Code style and quality checks
2. **Testing** - Comprehensive test suites for both backend and frontend
3. **Security Scanning** - Checks for security vulnerabilities
4. **Building** - Builds optimized assets for deployment
5. **Deployment** - Automated deployments to staging and production (manual approval required)

The pipeline configuration is defined in `.gitlab-ci.yml`.

---
# Triggering pipeline
# Triggering pipeline
# Triggering pipeline
