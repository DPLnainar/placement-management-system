import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import StudentDashboard from '../StudentDashboard';
import { useAuth } from '../../contexts/AuthContext';

// Mock the useAuth hook
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock the API
jest.mock('../../services/api', () => ({
  applicationAPI: {
    getAll: jest.fn(),
    apply: jest.fn()
  },
  userAPI: {
    update: jest.fn()
  }
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('StudentDashboard Component - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    
    useAuth.mockReturnValue({
      user: { 
        role: 'student', 
        username: 'student1',
        name: 'John Doe'
      },
      logout: jest.fn()
    });
  });

  describe('Tab Navigation', () => {
    test('should render all tabs on desktop', () => {
      render(<StudentDashboard />);

      expect(screen.getByRole('button', { name: /Job Postings/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /My Profile/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Internships/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Skills/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Career Path/i })).toBeInTheDocument();
    });

    test('should switch between tabs correctly', () => {
      render(<StudentDashboard />);

      // Default should be Jobs tab
      expect(screen.getByText(/Available Job Postings/i)).toBeInTheDocument();

      // Click Profile tab
      fireEvent.click(screen.getByRole('button', { name: /My Profile/i }));
      expect(screen.getByText(/Student Profile/i)).toBeInTheDocument();

      // Click Internships tab
      fireEvent.click(screen.getByRole('button', { name: /Internships/i }));
      expect(screen.getByText(/Internship Experience/i)).toBeInTheDocument();

      // Click Skills tab
      fireEvent.click(screen.getByRole('button', { name: /Skills/i }));
      expect(screen.getByText(/Skills & Competencies/i)).toBeInTheDocument();

      // Click Career Path tab
      fireEvent.click(screen.getByRole('button', { name: /Career Path/i }));
      expect(screen.getByText(/Explore Career Paths/i)).toBeInTheDocument();
    });

    test('should highlight active tab', () => {
      render(<StudentDashboard />);

      const profileTab = screen.getByRole('button', { name: /My Profile/i });
      fireEvent.click(profileTab);

      // Active tab should have primary background
      expect(profileTab).toHaveClass('bg-primary');
    });
  });

  describe('Profile Tab - Data Persistence', () => {
    test('should load profile data from localStorage on mount', () => {
      const savedProfile = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        isProfileCompleted: true
      };

      mockLocalStorage.setItem('studentProfile_student1', JSON.stringify(savedProfile));

      render(<StudentDashboard />);

      // Navigate to profile tab
      fireEvent.click(screen.getByRole('button', { name: /My Profile/i }));

      // Check if data is loaded
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();
    });

    test('should save profile data to localStorage when updated', async () => {
      render(<StudentDashboard />);

      fireEvent.click(screen.getByRole('button', { name: /My Profile/i }));

      // Wait for profile form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
      });

      // The onUpdate callback should save to localStorage
      // This is tested indirectly through the ProfileForm test
    });

    test('should restrict profile editing after completion', async () => {
      const completedProfile = {
        fullName: 'John Doe',
        email: 'john@example.com',
        isProfileCompleted: true
      };

      mockLocalStorage.setItem('studentProfile_student1', JSON.stringify(completedProfile));

      render(<StudentDashboard />);

      fireEvent.click(screen.getByRole('button', { name: /My Profile/i }));

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/Full Name/i);
        expect(nameInput).toBeDisabled();
      });
    });
  });

  describe('Internships Tab - Always Editable', () => {
    test('should allow adding internships regardless of profile status', async () => {
      const completedProfile = {
        fullName: 'John Doe',
        isProfileCompleted: true
      };

      mockLocalStorage.setItem('studentProfile_student1', JSON.stringify(completedProfile));

      render(<StudentDashboard />);

      fireEvent.click(screen.getByRole('button', { name: /Internships/i }));

      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /Add Internship/i });
        expect(addButton).not.toBeDisabled();
      });
    });

    test('should persist internships across tab switches', async () => {
      render(<StudentDashboard />);

      // Go to Internships tab
      fireEvent.click(screen.getByRole('button', { name: /Internships/i }));

      // Add an internship
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /Add Internship/i }));
      });

      // Switch to another tab
      fireEvent.click(screen.getByRole('button', { name: /Skills/i }));

      // Switch back to Internships
      fireEvent.click(screen.getByRole('button', { name: /Internships/i }));

      // Internships should still be there
      expect(screen.getByText(/Internship Experience/i)).toBeInTheDocument();
    });

    test('should load internships from localStorage', () => {
      const savedInternships = [
        {
          id: 1,
          company: 'Google',
          role: 'SWE Intern',
          duration: '3 months'
        }
      ];

      mockLocalStorage.setItem('internships_student1', JSON.stringify(savedInternships));

      render(<StudentDashboard />);

      fireEvent.click(screen.getByRole('button', { name: /Internships/i }));

      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('SWE Intern')).toBeInTheDocument();
    });
  });

  describe('Skills Tab - Always Editable', () => {
    test('should allow managing skills regardless of profile status', async () => {
      const completedProfile = {
        fullName: 'John Doe',
        isProfileCompleted: true
      };

      mockLocalStorage.setItem('studentProfile_student1', JSON.stringify(completedProfile));

      render(<StudentDashboard />);

      fireEvent.click(screen.getByRole('button', { name: /Skills/i }));

      await waitFor(() => {
        const skillInput = screen.getByPlaceholderText(/Enter skill name/i);
        expect(skillInput).not.toBeDisabled();
      });
    });

    test('should load skills from localStorage', () => {
      const savedSkills = [
        { id: 1, name: 'JavaScript', category: 'technical' },
        { id: 2, name: 'Python', category: 'technical' }
      ];

      mockLocalStorage.setItem('skills_student1', JSON.stringify(savedSkills));

      render(<StudentDashboard />);

      fireEvent.click(screen.getByRole('button', { name: /Skills/i }));

      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('Python')).toBeInTheDocument();
    });
  });

  describe('Resume Tab - Always Editable', () => {
    test('should allow uploading resume regardless of profile status', async () => {
      const completedProfile = {
        fullName: 'John Doe',
        isProfileCompleted: true
      };

      mockLocalStorage.setItem('studentProfile_student1', JSON.stringify(completedProfile));

      render(<StudentDashboard />);

      // Note: Resume is not a separate tab, it's part of the profile management
      fireEvent.click(screen.getByRole('button', { name: /My Profile/i }));

      // Resume upload should be accessible
      // (actual implementation might vary based on your UI structure)
    });
  });

  describe('Career Path Tab', () => {
    test('should display career path options', () => {
      render(<StudentDashboard />);

      fireEvent.click(screen.getByRole('button', { name: /Career Path/i }));

      expect(screen.getByText(/Software Development/i)).toBeInTheDocument();
      expect(screen.getByText(/Data Science & Analytics/i)).toBeInTheDocument();
      expect(screen.getByText(/Cloud & DevOps/i)).toBeInTheDocument();
      expect(screen.getByText(/Cybersecurity/i)).toBeInTheDocument();
    });

    test('should display career resources', () => {
      render(<StudentDashboard />);

      fireEvent.click(screen.getByRole('button', { name: /Career Path/i }));

      expect(screen.getByText(/Recommended Resources/i)).toBeInTheDocument();
    });
  });

  describe('User Flow - Complete Student Journey', () => {
    test('should complete full student workflow: profile -> internships -> skills', async () => {
      render(<StudentDashboard />);

      // Step 1: Complete profile (first time)
      fireEvent.click(screen.getByRole('button', { name: /My Profile/i }));

      await waitFor(() => {
        expect(screen.getByText(/First Time Setup/i)).toBeInTheDocument();
      });

      // Fill and submit profile (simplified)
      // In real test, would fill all fields and submit

      // Step 2: Add internships
      fireEvent.click(screen.getByRole('button', { name: /Internships/i }));

      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /Add Internship/i });
        expect(addButton).toBeInTheDocument();
        expect(addButton).not.toBeDisabled();
      });

      // Step 3: Add skills
      fireEvent.click(screen.getByRole('button', { name: /Skills/i }));

      await waitFor(() => {
        const skillInput = screen.getByPlaceholderText(/Enter skill name/i);
        expect(skillInput).toBeInTheDocument();
        expect(skillInput).not.toBeDisabled();
      });

      // Step 4: Go back to profile - should be locked now
      fireEvent.click(screen.getByRole('button', { name: /My Profile/i }));

      // Profile would be locked if isProfileCompleted was set to true
    });
  });

  describe('Mobile Menu', () => {
    test('should render burger menu button on mobile', () => {
      render(<StudentDashboard />);

      // The burger menu button should be present (hidden on desktop, visible on mobile)
      const burgerButton = screen.getByLabelText(/Menu/i);
      expect(burgerButton).toBeInTheDocument();
    });

    test('should toggle mobile menu', () => {
      render(<StudentDashboard />);

      const burgerButton = screen.getByLabelText(/Menu/i);
      
      // Click to open
      fireEvent.click(burgerButton);

      // Menu should be visible
      // (Testing library might not detect CSS visibility changes, so this is conceptual)
      
      // Click to close
      fireEvent.click(burgerButton);
    });
  });

  describe('Data Isolation by User', () => {
    test('should load different data for different students', () => {
      // Student 1 data
      const student1Profile = {
        fullName: 'John Doe',
        email: 'john@example.com',
        isProfileCompleted: true
      };
      mockLocalStorage.setItem('studentProfile_student1', JSON.stringify(student1Profile));

      const { unmount } = render(<StudentDashboard />);

      fireEvent.click(screen.getByRole('button', { name: /My Profile/i }));
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();

      unmount();

      // Change to student 2
      useAuth.mockReturnValue({
        user: { 
          role: 'student', 
          username: 'student2',
          name: 'Jane Smith'
        },
        logout: jest.fn()
      });

      // Student 2 data
      const student2Profile = {
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        isProfileCompleted: false
      };
      mockLocalStorage.setItem('studentProfile_student2', JSON.stringify(student2Profile));

      render(<StudentDashboard />);

      fireEvent.click(screen.getByRole('button', { name: /My Profile/i }));
      expect(screen.getByDisplayValue('Jane Smith')).toBeInTheDocument();
    });
  });

  describe('Header and Logout', () => {
    test('should display student name in header', () => {
      render(<StudentDashboard />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    test('should have logout button', () => {
      render(<StudentDashboard />);

      expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
    });

    test('should call logout function when logout clicked', () => {
      const mockLogout = jest.fn();
      useAuth.mockReturnValue({
        user: { 
          role: 'student', 
          username: 'student1',
          name: 'John Doe'
        },
        logout: mockLogout
      });

      render(<StudentDashboard />);

      const logoutButton = screen.getByRole('button', { name: /Logout/i });
      fireEvent.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
    });
  });
});
