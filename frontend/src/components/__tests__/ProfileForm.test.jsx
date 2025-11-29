import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfileForm from '../ProfileForm';
import { useAuth } from '../../contexts/AuthContext';

// Mock the useAuth hook
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock the API
jest.mock('../../services/api', () => ({
  userAPI: {
    update: jest.fn()
  }
}));

describe('ProfileForm Component', () => {
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.alert
    global.alert = jest.fn();
  });

  describe('Student Role - First Time Registration', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: { role: 'student', username: 'student1' }
      });
    });

    test('should allow students to fill profile on first registration', () => {
      const studentData = { isProfileCompleted: false };
      
      render(
        <ProfileForm 
          studentData={studentData} 
          onUpdate={mockOnUpdate} 
          isModeratorView={false}
        />
      );

      // All fields should be enabled
      const nameInput = screen.getByLabelText(/Full Name/i);
      const emailInput = screen.getByLabelText(/Email/i);
      const phoneInput = screen.getByLabelText(/Phone Number/i);

      expect(nameInput).not.toBeDisabled();
      expect(emailInput).not.toBeDisabled();
      expect(phoneInput).not.toBeDisabled();
    });

    test('should show first-time setup message', () => {
      const studentData = { isProfileCompleted: false };
      
      render(
        <ProfileForm 
          studentData={studentData} 
          onUpdate={mockOnUpdate} 
          isModeratorView={false}
        />
      );

      expect(screen.getByText(/First Time Setup/i)).toBeInTheDocument();
      expect(screen.getByText(/these fields will be locked/i)).toBeInTheDocument();
    });

    test('should save profile data and mark as completed', async () => {
      const studentData = { isProfileCompleted: false };
      
      render(
        <ProfileForm 
          studentData={studentData} 
          onUpdate={mockOnUpdate} 
          isModeratorView={false}
        />
      );

      // Fill in required fields
      fireEvent.change(screen.getByLabelText(/Full Name/i), {
        target: { value: 'John Doe' }
      });
      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: 'john@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/Phone Number/i), {
        target: { value: '1234567890' }
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Complete Profile/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            fullName: 'John Doe',
            email: 'john@example.com',
            phone: '1234567890',
            isProfileCompleted: true
          })
        );
      });
    });
  });

  describe('Student Role - After Registration (Profile Locked)', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: { role: 'student', username: 'student1' }
      });
    });

    test('should disable all profile fields for students with completed profile', () => {
      const studentData = {
        isProfileCompleted: true,
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890'
      };
      
      render(
        <ProfileForm 
          studentData={studentData} 
          onUpdate={mockOnUpdate} 
          isModeratorView={false}
        />
      );

      // All fields should be disabled
      const nameInput = screen.getByLabelText(/Full Name/i);
      const emailInput = screen.getByLabelText(/Email/i);
      const phoneInput = screen.getByLabelText(/Phone Number/i);

      expect(nameInput).toBeDisabled();
      expect(emailInput).toBeDisabled();
      expect(phoneInput).toBeDisabled();
      expect(nameInput).toHaveClass('bg-gray-100');
    });

    test('should show locked profile warning message', () => {
      const studentData = {
        isProfileCompleted: true,
        fullName: 'John Doe'
      };
      
      render(
        <ProfileForm 
          studentData={studentData} 
          onUpdate={mockOnUpdate} 
          isModeratorView={false}
        />
      );

      expect(screen.getByText(/Profile information is locked/i)).toBeInTheDocument();
      expect(screen.getByText(/Contact your department moderator/i)).toBeInTheDocument();
    });

    test('should NOT show save button for locked profile', () => {
      const studentData = {
        isProfileCompleted: true,
        fullName: 'John Doe'
      };
      
      render(
        <ProfileForm 
          studentData={studentData} 
          onUpdate={mockOnUpdate} 
          isModeratorView={false}
        />
      );

      const saveButton = screen.queryByRole('button', { name: /Update Profile/i });
      expect(saveButton).not.toBeInTheDocument();
    });

    test('should prevent form submission for locked profile', async () => {
      const studentData = {
        isProfileCompleted: true,
        fullName: 'John Doe',
        email: 'john@example.com'
      };
      
      const { container } = render(
        <ProfileForm 
          studentData={studentData} 
          onUpdate={mockOnUpdate} 
          isModeratorView={false}
        />
      );

      // Try to submit the form directly (even though button is hidden)
      const form = container.querySelector('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          'Profile is locked. Contact your moderator to make changes.'
        );
        expect(mockOnUpdate).not.toHaveBeenCalled();
      });
    });

    test('should prevent field changes for locked profile', () => {
      const studentData = {
        isProfileCompleted: true,
        fullName: 'John Doe',
        email: 'john@example.com'
      };
      
      render(
        <ProfileForm 
          studentData={studentData} 
          onUpdate={mockOnUpdate} 
          isModeratorView={false}
        />
      );

      const nameInput = screen.getByLabelText(/Full Name/i);
      
      // Try to change the value
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

      // Value should remain unchanged because input is disabled
      expect(nameInput.value).toBe('John Doe');
    });
  });

  describe('Moderator Role - Full Access', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: { role: 'moderator', username: 'mod1' }
      });
    });

    test('should allow moderators to edit student profile even if completed', () => {
      const studentData = {
        isProfileCompleted: true,
        fullName: 'John Doe',
        email: 'john@example.com'
      };
      
      render(
        <ProfileForm 
          studentData={studentData} 
          onUpdate={mockOnUpdate} 
          isModeratorView={true}
        />
      );

      // Initially fields should be disabled
      const nameInput = screen.getByLabelText(/Full Name/i);
      expect(nameInput).toBeDisabled();

      // Click edit button
      const editButton = screen.getByRole('button', { name: /Edit Profile/i });
      fireEvent.click(editButton);

      // Now fields should be enabled
      expect(nameInput).not.toBeDisabled();
    });

    test('should show Edit Profile button for moderators', () => {
      const studentData = {
        isProfileCompleted: true,
        fullName: 'John Doe'
      };
      
      render(
        <ProfileForm 
          studentData={studentData} 
          onUpdate={mockOnUpdate} 
          isModeratorView={true}
        />
      );

      expect(screen.getByRole('button', { name: /Edit Profile/i })).toBeInTheDocument();
    });

    test('should allow moderators to save changes to student profile', async () => {
      const studentData = {
        isProfileCompleted: true,
        fullName: 'John Doe',
        email: 'john@example.com'
      };
      
      render(
        <ProfileForm 
          studentData={studentData} 
          onUpdate={mockOnUpdate} 
          isModeratorView={true}
        />
      );

      // Click edit button
      const editButton = screen.getByRole('button', { name: /Edit Profile/i });
      fireEvent.click(editButton);

      // Change name
      const nameInput = screen.getByLabelText(/Full Name/i);
      fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Update Profile/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            fullName: 'Jane Smith',
            isProfileCompleted: true
          })
        );
      });
    });

    test('should toggle between edit and cancel modes', () => {
      const studentData = {
        isProfileCompleted: true,
        fullName: 'John Doe'
      };
      
      render(
        <ProfileForm 
          studentData={studentData} 
          onUpdate={mockOnUpdate} 
          isModeratorView={true}
        />
      );

      // Click edit
      const editButton = screen.getByRole('button', { name: /Edit Profile/i });
      fireEvent.click(editButton);

      // Should show cancel button
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      // Should show edit button again
      expect(screen.getByRole('button', { name: /Edit Profile/i })).toBeInTheDocument();
    });
  });

  describe('Admin Role - Full Access', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: { role: 'admin', username: 'admin1' }
      });
    });

    test('should allow admins to edit student profile', () => {
      const studentData = {
        isProfileCompleted: true,
        fullName: 'John Doe'
      };
      
      render(
        <ProfileForm 
          studentData={studentData} 
          onUpdate={mockOnUpdate} 
          isModeratorView={true}
        />
      );

      const editButton = screen.getByRole('button', { name: /Edit Profile/i });
      fireEvent.click(editButton);

      const nameInput = screen.getByLabelText(/Full Name/i);
      expect(nameInput).not.toBeDisabled();
    });
  });
});
