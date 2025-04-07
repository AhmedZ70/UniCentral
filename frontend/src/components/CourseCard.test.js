import React from 'react';
import { render, screen } from '@testing-library/react';
import CourseCard from './CourseCard';

describe('CourseCard Component', () => {
  const mockCourse = {
    id: 1,
    title: 'Introduction to Programming',
    subject: 'CS',
    number: 101,
    avg_rating: 4.2,
    avg_difficulty: 3.5,
    credits: 3,
    semester: 'Fall 2025'
  };

  test('renders course title and code correctly', () => {
    render(<CourseCard course={mockCourse} />);
    expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
    expect(screen.getByText('CS 101')).toBeInTheDocument();
  });

  test('renders course ratings with correct formatting', () => {
    render(<CourseCard course={mockCourse} />);
    expect(screen.getByTestId('course-rating')).toHaveTextContent('4.2');
    expect(screen.getByTestId('course-difficulty')).toHaveTextContent('3.5');
  });

  test('displays course credits', () => {
    render(<CourseCard course={mockCourse} />);
    expect(screen.getByText('Credits: 3')).toBeInTheDocument();
  });

  test('shows semester when available', () => {
    render(<CourseCard course={mockCourse} />);
    expect(screen.getByText('Offered: Fall 2025')).toBeInTheDocument();
  });

  test('does not show semester when not available', () => {
    const courseMissingSemester = { ...mockCourse, semester: null };
    render(<CourseCard course={courseMissingSemester} />);
    expect(screen.queryByText(/Offered:/)).not.toBeInTheDocument();
  });
});