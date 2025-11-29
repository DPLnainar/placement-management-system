import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResumeUpload from '../ResumeUpload';

describe('ResumeUpload Component', () => {
  const mockOnUpdate = jest.fn();
  const mockAlert = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = mockAlert;
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  describe('Initial Render - No Resume', () => {
    test('should render upload section when no resume exists', () => {
      render(<ResumeUpload resume={null} onUpdate={mockOnUpdate} />);

      expect(screen.getByText(/Resume Upload/i)).toBeInTheDocument();
      expect(screen.getByText(/Upload Resume/i)).toBeInTheDocument();
      expect(screen.getByText(/Supported formats: PDF, DOC, DOCX/i)).toBeInTheDocument();
    });

    test('should show upload tips', () => {
      render(<ResumeUpload resume={null} onUpdate={mockOnUpdate} />);

      expect(screen.getByText(/Keep your resume updated/i)).toBeInTheDocument();
      expect(screen.getByText(/Ensure your resume is well-formatted/i)).toBeInTheDocument();
      expect(screen.getByText(/Max file size: 5MB/i)).toBeInTheDocument();
    });
  });

  describe('File Upload Validation', () => {
    test('should accept valid PDF file', async () => {
      render(<ResumeUpload resume={null} onUpdate={mockOnUpdate} />);

      const file = new File(['dummy content'], 'resume.pdf', { type: 'application/pdf' });
      const input = screen.getByLabelText(/Upload Resume/i);

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'resume.pdf',
            type: 'application/pdf'
          })
        );
      });
    });

    test('should accept valid DOC file', async () => {
      render(<ResumeUpload resume={null} onUpdate={mockOnUpdate} />);

      const file = new File(['dummy content'], 'resume.doc', { type: 'application/msword' });
      const input = screen.getByLabelText(/Upload Resume/i);

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'resume.doc',
            type: 'application/msword'
          })
        );
      });
    });

    test('should accept valid DOCX file', async () => {
      render(<ResumeUpload resume={null} onUpdate={mockOnUpdate} />);

      const file = new File(['dummy content'], 'resume.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const input = screen.getByLabelText(/Upload Resume/i);

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'resume.docx'
          })
        );
      });
    });

    test('should reject invalid file type', async () => {
      render(<ResumeUpload resume={null} onUpdate={mockOnUpdate} />);

      const file = new File(['dummy content'], 'resume.txt', { type: 'text/plain' });
      const input = screen.getByLabelText(/Upload Resume/i);

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Please upload a valid resume file (PDF, DOC, or DOCX)'
        );
        expect(mockOnUpdate).not.toHaveBeenCalled();
      });
    });

    test('should reject file larger than 5MB', async () => {
      render(<ResumeUpload resume={null} onUpdate={mockOnUpdate} />);

      // Create a file larger than 5MB (5 * 1024 * 1024 + 1 bytes)
      const largeFile = new File(['x'.repeat(5 * 1024 * 1024 + 1)], 'large-resume.pdf', { 
        type: 'application/pdf' 
      });
      const input = screen.getByLabelText(/Upload Resume/i);

      Object.defineProperty(input, 'files', {
        value: [largeFile],
        writable: false
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('File size must be less than 5MB');
        expect(mockOnUpdate).not.toHaveBeenCalled();
      });
    });

    test('should handle when no file is selected', () => {
      render(<ResumeUpload resume={null} onUpdate={mockOnUpdate} />);

      const input = screen.getByLabelText(/Upload Resume/i);
      fireEvent.change(input);

      expect(mockOnUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Existing Resume Display', () => {
    test('should display existing resume information', () => {
      const mockResume = {
        name: 'John_Doe_Resume.pdf',
        size: 1024 * 1024, // 1MB
        type: 'application/pdf',
        uploadDate: '2024-01-15',
        url: 'mock-url'
      };

      render(<ResumeUpload resume={mockResume} onUpdate={mockOnUpdate} />);

      expect(screen.getByText('John_Doe_Resume.pdf')).toBeInTheDocument();
      expect(screen.getByText('1.00 MB')).toBeInTheDocument();
      expect(screen.getByText(/Uploaded on/i)).toBeInTheDocument();
    });

    test('should show View, Replace, and Delete buttons for existing resume', () => {
      const mockResume = {
        name: 'resume.pdf',
        size: 1024,
        type: 'application/pdf',
        uploadDate: '2024-01-15',
        url: 'mock-url'
      };

      render(<ResumeUpload resume={mockResume} onUpdate={mockOnUpdate} />);

      expect(screen.getByRole('button', { name: /View Resume/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Replace/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
    });

    test('should format file size correctly', () => {
      const testCases = [
        { size: 512, expected: '512 B' },
        { size: 1024, expected: '1.00 KB' },
        { size: 1024 * 1024, expected: '1.00 MB' },
        { size: 2.5 * 1024 * 1024, expected: '2.50 MB' }
      ];

      testCases.forEach(({ size, expected }) => {
        const mockResume = {
          name: 'test.pdf',
          size,
          type: 'application/pdf',
          uploadDate: '2024-01-15',
          url: 'mock-url'
        };

        const { unmount } = render(<ResumeUpload resume={mockResume} onUpdate={mockOnUpdate} />);
        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Resume Actions', () => {
    test('should open resume in new tab when View is clicked', () => {
      const mockResume = {
        name: 'resume.pdf',
        size: 1024,
        type: 'application/pdf',
        uploadDate: '2024-01-15',
        url: 'https://example.com/resume.pdf'
      };

      global.open = jest.fn();

      render(<ResumeUpload resume={mockResume} onUpdate={mockOnUpdate} />);

      const viewButton = screen.getByRole('button', { name: /View Resume/i });
      fireEvent.click(viewButton);

      expect(global.open).toHaveBeenCalledWith('https://example.com/resume.pdf', '_blank');
    });

    test('should allow replacing existing resume', async () => {
      const mockResume = {
        name: 'old-resume.pdf',
        size: 1024,
        type: 'application/pdf',
        uploadDate: '2024-01-15',
        url: 'mock-url'
      };

      render(<ResumeUpload resume={mockResume} onUpdate={mockOnUpdate} />);

      const replaceButton = screen.getByRole('button', { name: /Replace/i });
      fireEvent.click(replaceButton);

      // Check that file input is present (Replace button triggers file input)
      const fileInput = screen.getByLabelText(/Replace Resume/i);
      const newFile = new File(['new content'], 'new-resume.pdf', { type: 'application/pdf' });

      Object.defineProperty(fileInput, 'files', {
        value: [newFile],
        writable: false
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'new-resume.pdf'
          })
        );
      });
    });

    test('should delete resume when Delete is clicked', () => {
      const mockResume = {
        name: 'resume.pdf',
        size: 1024,
        type: 'application/pdf',
        uploadDate: '2024-01-15',
        url: 'mock-url'
      };

      render(<ResumeUpload resume={mockResume} onUpdate={mockOnUpdate} />);

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      expect(mockOnUpdate).toHaveBeenCalledWith(null);
    });
  });

  describe('File Size Formatting', () => {
    test('should format bytes correctly', () => {
      const mockResume = {
        name: 'small.pdf',
        size: 512,
        type: 'application/pdf',
        uploadDate: '2024-01-15',
        url: 'mock-url'
      };

      render(<ResumeUpload resume={mockResume} onUpdate={mockOnUpdate} />);
      expect(screen.getByText('512 B')).toBeInTheDocument();
    });

    test('should format kilobytes correctly', () => {
      const mockResume = {
        name: 'medium.pdf',
        size: 1536, // 1.5 KB
        type: 'application/pdf',
        uploadDate: '2024-01-15',
        url: 'mock-url'
      };

      render(<ResumeUpload resume={mockResume} onUpdate={mockOnUpdate} />);
      expect(screen.getByText('1.50 KB')).toBeInTheDocument();
    });

    test('should format megabytes correctly', () => {
      const mockResume = {
        name: 'large.pdf',
        size: 3 * 1024 * 1024, // 3 MB
        type: 'application/pdf',
        uploadDate: '2024-01-15',
        url: 'mock-url'
      };

      render(<ResumeUpload resume={mockResume} onUpdate={mockOnUpdate} />);
      expect(screen.getByText('3.00 MB')).toBeInTheDocument();
    });
  });

  describe('Student Accessibility', () => {
    test('should allow students to upload resume regardless of profile status', () => {
      render(<ResumeUpload resume={null} onUpdate={mockOnUpdate} />);

      const uploadButton = screen.getByRole('button', { name: /Upload Resume/i });
      expect(uploadButton).not.toBeDisabled();
    });

    test('should allow students to manage resume at any time', () => {
      const mockResume = {
        name: 'resume.pdf',
        size: 1024,
        type: 'application/pdf',
        uploadDate: '2024-01-15',
        url: 'mock-url'
      };

      render(<ResumeUpload resume={mockResume} onUpdate={mockOnUpdate} />);

      expect(screen.getByRole('button', { name: /View Resume/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /Replace/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /Delete/i })).not.toBeDisabled();
    });
  });

  describe('Date Formatting', () => {
    test('should display upload date correctly', () => {
      const mockResume = {
        name: 'resume.pdf',
        size: 1024,
        type: 'application/pdf',
        uploadDate: '2024-01-15',
        url: 'mock-url'
      };

      render(<ResumeUpload resume={mockResume} onUpdate={mockOnUpdate} />);
      expect(screen.getByText(/Uploaded on/i)).toBeInTheDocument();
    });
  });
});
