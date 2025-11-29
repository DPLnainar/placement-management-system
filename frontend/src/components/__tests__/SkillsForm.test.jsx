import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SkillsForm from '../SkillsForm';

describe('SkillsForm Component', () => {
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    test('should render with add skill section', () => {
      render(<SkillsForm skills={[]} onUpdate={mockOnUpdate} />);

      expect(screen.getByText(/Skills & Competencies/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Enter skill name/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Skill/i })).toBeInTheDocument();
    });

    test('should display existing skills grouped by category', () => {
      const mockSkills = [
        { id: 1, name: 'JavaScript', category: 'technical' },
        { id: 2, name: 'Communication', category: 'soft' },
        { id: 3, name: 'Python', category: 'technical' }
      ];

      render(<SkillsForm skills={mockSkills} onUpdate={mockOnUpdate} />);

      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('Communication')).toBeInTheDocument();
      expect(screen.getByText('Python')).toBeInTheDocument();
    });

    test('should show empty state when no skills', () => {
      render(<SkillsForm skills={[]} onUpdate={mockOnUpdate} />);

      expect(screen.getByText(/No skills added yet/i)).toBeInTheDocument();
    });
  });

  describe('Add Skill Functionality', () => {
    test('should add skill with button click', async () => {
      render(<SkillsForm skills={[]} onUpdate={mockOnUpdate} />);

      const input = screen.getByPlaceholderText(/Enter skill name/i);
      fireEvent.change(input, { target: { value: 'React' } });

      const addButton = screen.getByRole('button', { name: /Add Skill/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              name: 'React',
              category: 'technical'
            })
          ])
        );
      });
    });

    test('should add skill with Enter key', async () => {
      render(<SkillsForm skills={[]} onUpdate={mockOnUpdate} />);

      const input = screen.getByPlaceholderText(/Enter skill name/i);
      fireEvent.change(input, { target: { value: 'Node.js' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              name: 'Node.js',
              category: 'technical'
            })
          ])
        );
      });
    });

    test('should not add empty skill', () => {
      render(<SkillsForm skills={[]} onUpdate={mockOnUpdate} />);

      const addButton = screen.getByRole('button', { name: /Add Skill/i });
      fireEvent.click(addButton);

      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    test('should clear input after adding skill', async () => {
      render(<SkillsForm skills={[]} onUpdate={mockOnUpdate} />);

      const input = screen.getByPlaceholderText(/Enter skill name/i);
      fireEvent.change(input, { target: { value: 'TypeScript' } });

      const addButton = screen.getByRole('button', { name: /Add Skill/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    test('should trim whitespace from skill name', async () => {
      render(<SkillsForm skills={[]} onUpdate={mockOnUpdate} />);

      const input = screen.getByPlaceholderText(/Enter skill name/i);
      fireEvent.change(input, { target: { value: '  MongoDB  ' } });

      const addButton = screen.getByRole('button', { name: /Add Skill/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              name: 'MongoDB'
            })
          ])
        );
      });
    });
  });

  describe('Category Selection', () => {
    test('should allow selecting different categories', async () => {
      render(<SkillsForm skills={[]} onUpdate={mockOnUpdate} />);

      const categorySelect = screen.getByRole('combobox');
      
      // Change to 'soft' category
      fireEvent.change(categorySelect, { target: { value: 'soft' } });

      const input = screen.getByPlaceholderText(/Enter skill name/i);
      fireEvent.change(input, { target: { value: 'Leadership' } });

      const addButton = screen.getByRole('button', { name: /Add Skill/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              name: 'Leadership',
              category: 'soft'
            })
          ])
        );
      });
    });

    test('should display all category options', () => {
      render(<SkillsForm skills={[]} onUpdate={mockOnUpdate} />);

      const categorySelect = screen.getByRole('combobox');
      
      expect(screen.getByText(/Technical Skills/i)).toBeInTheDocument();
      expect(screen.getByText(/Soft Skills/i)).toBeInTheDocument();
      expect(screen.getByText(/Languages/i)).toBeInTheDocument();
      expect(screen.getByText(/Tools/i)).toBeInTheDocument();
      expect(screen.getByText(/Other/i)).toBeInTheDocument();
    });
  });

  describe('Delete Skill Functionality', () => {
    test('should delete skill when X button is clicked', async () => {
      const mockSkills = [
        { id: 1, name: 'JavaScript', category: 'technical' },
        { id: 2, name: 'Python', category: 'technical' }
      ];

      render(<SkillsForm skills={mockSkills} onUpdate={mockOnUpdate} />);

      // Find all X buttons (delete buttons in badges)
      const deleteButtons = screen.getAllByRole('button', { name: /×/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ id: 2, name: 'Python' })
          ])
        );
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.not.arrayContaining([
            expect.objectContaining({ id: 1, name: 'JavaScript' })
          ])
        );
      });
    });

    test('should handle deleting all skills', async () => {
      const mockSkills = [
        { id: 1, name: 'Java', category: 'technical' }
      ];

      render(<SkillsForm skills={mockSkills} onUpdate={mockOnUpdate} />);

      const deleteButton = screen.getByRole('button', { name: /×/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith([]);
      });
    });
  });

  describe('Skills Display by Category', () => {
    test('should group and display skills by category', () => {
      const mockSkills = [
        { id: 1, name: 'JavaScript', category: 'technical' },
        { id: 2, name: 'Python', category: 'technical' },
        { id: 3, name: 'Leadership', category: 'soft' },
        { id: 4, name: 'English', category: 'languages' },
        { id: 5, name: 'Git', category: 'tools' }
      ];

      render(<SkillsForm skills={mockSkills} onUpdate={mockOnUpdate} />);

      // Check if category headers are displayed
      expect(screen.getByText('Technical Skills:')).toBeInTheDocument();
      expect(screen.getByText('Soft Skills:')).toBeInTheDocument();
      expect(screen.getByText('Languages:')).toBeInTheDocument();
      expect(screen.getByText('Tools:')).toBeInTheDocument();

      // Check if all skills are displayed
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('Leadership')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('Git')).toBeInTheDocument();
    });

    test('should only show categories that have skills', () => {
      const mockSkills = [
        { id: 1, name: 'Java', category: 'technical' }
      ];

      render(<SkillsForm skills={mockSkills} onUpdate={mockOnUpdate} />);

      expect(screen.getByText('Technical Skills:')).toBeInTheDocument();
      expect(screen.queryByText('Soft Skills:')).not.toBeInTheDocument();
      expect(screen.queryByText('Languages:')).not.toBeInTheDocument();
    });
  });

  describe('Multiple Skills Operations', () => {
    test('should add multiple skills in sequence', async () => {
      const { rerender } = render(<SkillsForm skills={[]} onUpdate={mockOnUpdate} />);

      const input = screen.getByPlaceholderText(/Enter skill name/i);
      const addButton = screen.getByRole('button', { name: /Add Skill/i });

      // Add first skill
      fireEvent.change(input, { target: { value: 'React' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith([
          expect.objectContaining({ name: 'React' })
        ]);
      });

      // Simulate re-render with updated skills
      const updatedSkills = [{ id: 1, name: 'React', category: 'technical' }];
      rerender(<SkillsForm skills={updatedSkills} onUpdate={mockOnUpdate} />);

      // Add second skill
      fireEvent.change(input, { target: { value: 'Node.js' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith([
          { id: 1, name: 'React', category: 'technical' },
          expect.objectContaining({ name: 'Node.js' })
        ]);
      });
    });
  });

  describe('Student Accessibility', () => {
    test('should allow students to manage skills regardless of profile status', () => {
      render(<SkillsForm skills={[]} onUpdate={mockOnUpdate} />);

      const input = screen.getByPlaceholderText(/Enter skill name/i);
      const addButton = screen.getByRole('button', { name: /Add Skill/i });

      expect(input).not.toBeDisabled();
      expect(addButton).not.toBeDisabled();
    });

    test('should allow deleting skills at any time', () => {
      const mockSkills = [
        { id: 1, name: 'JavaScript', category: 'technical' }
      ];

      render(<SkillsForm skills={mockSkills} onUpdate={mockOnUpdate} />);

      const deleteButton = screen.getByRole('button', { name: /×/i });
      expect(deleteButton).not.toBeDisabled();
    });
  });
});
