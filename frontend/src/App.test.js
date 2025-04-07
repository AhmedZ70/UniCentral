import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  test('renders the main heading', () => {
    render(<App />);
    const headingElement = screen.getByText(/UniCentral/i);
    expect(headingElement).toBeInTheDocument();
  });

  test('renders the platform description', () => {
    render(<App />);
    const descriptionElement = screen.getByText(/A comprehensive course planning platform/i);
    expect(descriptionElement).toBeInTheDocument();
  });
});