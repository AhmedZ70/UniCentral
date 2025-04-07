import React from 'react';

const CourseCard = ({ course }) => {
  return (
    <div className="course-card" data-testid="course-card">
      <h3>{course.title}</h3>
      <p className="course-code">{course.subject} {course.number}</p>
      <div className="course-ratings">
        <div>
          <span>Rating: </span>
          <span data-testid="course-rating">{course.avg_rating.toFixed(1)}</span>/5.0
        </div>
        <div>
          <span>Difficulty: </span>
          <span data-testid="course-difficulty">{course.avg_difficulty.toFixed(1)}</span>/6.0
        </div>
      </div>
      <p>Credits: {course.credits}</p>
      {course.semester && <p>Offered: {course.semester}</p>}
    </div>
  );
};

export default CourseCard;