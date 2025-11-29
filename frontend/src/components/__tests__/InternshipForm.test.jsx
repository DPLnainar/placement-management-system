import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InternshipForm from '../InternshipForm';

describe('InternshipForm Component', () => {
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    test('should render empty state with add button', () => {
      render(<InternshipForm internships={[]} onUpdate={mockOnUpdate} />);

      expect(screen.getByText(/Internship Experience/i)).toBeInTheDocument();
      expect(screen.getByText(/Add Internship/i)).toBeInTheDocument();
      expect(screen.getByText(/No internships added yet/i)).toBeInTheDocument();
    });

    test('should display existing internships', () => {
      const mockInternships = [
        {
          id: 1,
          company: 'Tech Corp',
          role: 'Software Intern',
          duration: '3 months',
          description: 'Worked on backend systems'
        }
      ];

      render(<InternshipForm internships={mockInternships} onUpdate={mockOnUpdate} />);

      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
      expect(screen.getByText('Software Intern')).toBeInTheDocument();
      expect(screen.getByText('3 months')).toBeInTheDocument();
      expect(screen.getByText('Worked on backend systems')).toBeInTheDocument();
    });
  });

  describe('Add Internship Functionality', () => {
    test('should show add form when Add Internship button is clicked', () => {
      render(<InternshipForm internships={[]} onUpdate={mockOnUpdate} />);

      const addButton = screen.getByRole('button', { name: /Add Internship/i });
      fireEvent.click(addButton);

      expect(screen.getByLabelText(/Company Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Role\/Position/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Duration/i)).toBeInTheDocument();
    });

    test('should add new internship with valid data', async () => {
      render(<InternshipForm internships={[]} onUpdate={mockOnUpdate} />);

      // Click add button
      fireEvent.click(screen.getByRole('button', { name: /Add Internship/i }));

      // Fill in form
      fireEvent.change(screen.getByLabelText(/Company Name/i), {
        target: { value: 'Google' }
      });
      fireEvent.change(screen.getByLabelText(/Role\/Position/i), {
        target: { value: 'SWE Intern' }
      });
      fireEvent.change(screen.getByLabelText(/Duration/i), {
        target: { value: '6 months' }
      });
      fireEvent.change(screen.getByLabelText(/Description/i), {
        target: { value: 'Worked on Google Cloud' }
      });

      // Submit
      const saveButton = screen.getByRole('button', { name: /Save Internship/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              company: 'Google',
              role: 'SWE Intern',
              duration: '6 months',
              description: 'Worked on Google Cloud'
            })
          ])
        );
      });
    });

    test('should not add internship without required fields', () => {
      render(<InternshipForm internships={[]} onUpdate={mockOnUpdate} />);

      fireEvent.click(screen.getByRole('button', { name: /Add Internship/i }));

      // Try to save without filling required fields
      const saveButton = screen.getByRole('button', { name: /Save Internship/i });
      fireEvent.click(saveButton);

      // Should not call onUpdate
      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    test('should cancel add operation', () => {
      render(<InternshipForm internships={[]} onUpdate={mockOnUpdate} />);

      fireEvent.click(screen.getByRole('button', { name: /Add Internship/i }));

      // Form should be visible
      expect(screen.getByLabelText(/Company Name/i)).toBeInTheDocument();

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      // Form should be hidden
      expect(screen.queryByLabelText(/Company Name/i)).not.toBeInTheDocument();
      expect(mockOnUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Delete Internship Functionality', () => {
    test('should delete existing internship', async () => {
      const mockInternships = [
        {
          id: 1,
          company: 'Tech Corp',
          role: 'Software Intern',
          duration: '3 months'
        },
        {
          id: 2,
          company: 'Data Inc',
          role: 'Data Analyst Intern',
          duration: '4 months'
        }
      ];

      render(<InternshipForm internships={mockInternships} onUpdate={mockOnUpdate} />);

      // Find and click first delete button
      const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              id: 2,
              company: 'Data Inc'
            })
          ])
        );
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.not.arrayContaining([
            expect.objectContaining({
              id: 1
            })
          ])
        );
      });
    });
  });

  describe('Multiple Internships', () => {
    test('should handle multiple internships correctly', () => {
      const mockInternships = [
        { id: 1, company: 'Company A', role: 'Role A', duration: '2 months' },
        { id: 2, company: 'Company B', role: 'Role B', duration: '3 months' },
        { id: 3, company: 'Company C', role: 'Role C', duration: '4 months' }
      ];

      render(<InternshipForm internships={mockInternships} onUpdate={mockOnUpdate} />);

      expect(screen.getByText('Company A')).toBeInTheDocument();
      expect(screen.getByText('Company B')).toBeInTheDocument();
      expect(screen.getByText('Company C')).toBeInTheDocument();
      
      // Should have 3 delete buttons
      const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
      expect(deleteButtons).toHaveLength(3);
    });

    test('should add internship to existing list', async () => {
      const mockInternships = [
        { id: 1, company: 'Existing Corp', role: 'Intern', duration: '2 months' }
      ];

      render(<InternshipForm internships={mockInternships} onUpdate={mockOnUpdate} />);

      // Add new internship
      fireEvent.click(screen.getByRole('button', { name: /Add Internship/i }));
      
      fireEvent.change(screen.getByLabelText(/Company Name/i), {
        target: { value: 'New Corp' }
      });
      fireEvent.change(screen.getByLabelText(/Role\/Position/i), {
        target: { value: 'New Role' }
      });
      fireEvent.change(screen.getByLabelText(/Duration/i), {
        target: { value: '5 months' }
      });

      fireEvent.click(screen.getByRole('button', { name: /Save Internship/i }));

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ company: 'Existing Corp' }),
            expect.objectContaining({ company: 'New Corp' })
          ])
        );
      });
    });
  });

  describe('Student Accessibility', () => {
    test('should allow students to edit internships regardless of profile status', () => {
      // This form should always be editable for students
      render(<InternshipForm internships={[]} onUpdate={mockOnUpdate} />);

      const addButton = screen.getByRole('button', { name: /Add Internship/i });
      expect(addButton).not.toBeDisabled();
      
      fireEvent.click(addButton);

      const companyInput = screen.getByLabelText(/Company Name/i);
      expect(companyInput).not.toBeDisabled();
    });
  });
});
