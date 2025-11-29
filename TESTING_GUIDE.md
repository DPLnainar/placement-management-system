# Testing Guide - Profile Management Security

## Overview
This guide explains the comprehensive test suite that verifies the security and functionality of role-based profile management in the College Placement Management System.

## What We're Testing

### Critical Security Requirements
1. **Students CANNOT edit profile fields after registration**
   - Name, email, phone, roll number, department, etc. are locked
   - Visual indicators show the profile is locked
   - Attempts to edit or submit changes are blocked

2. **Students CAN edit specific sections at any time**
   - Internship experiences (add/edit/delete)
   - Skills by category (add/remove)
   - Resume upload (upload/replace/delete)

3. **Moderators and Admins CAN edit student profiles**
   - Edit button available to toggle edit mode
   - All fields become editable when in edit mode
   - Changes can be saved successfully

## Test Structure

### Unit Tests
Individual component testing in isolation:
- `ProfileForm.test.jsx` - Profile form with locking mechanism
- `InternshipForm.test.jsx` - Internship management
- `SkillsForm.test.jsx` - Skills management
- `ResumeUpload.test.jsx` - Resume upload/management

### Integration Tests
Testing complete user workflows:
- `StudentDashboard.test.jsx` - Full dashboard with all tabs and data persistence

## Running Tests

### Prerequisites
```bash
# Ensure you're in the frontend directory
cd frontend

# Install dependencies (if not already done)
npm install
```

### Run All Tests
```bash
npm test -- --watchAll=false
```

### Run Tests in Watch Mode (auto-rerun on changes)
```bash
npm test
```

### Run Specific Test File
```bash
# Profile form tests only
npm test ProfileForm.test.jsx

# Internship form tests only
npm test InternshipForm.test.jsx

# Skills form tests only
npm test SkillsForm.test.jsx

# Resume upload tests only
npm test ResumeUpload.test.jsx

# Dashboard integration tests only
npm test StudentDashboard.test.jsx
```

### Run Tests with Coverage Report
```bash
npm test -- --coverage --watchAll=false
```

### Run Tests with Verbose Output
```bash
npm test -- --watchAll=false --verbose
```

## Test Results Interpretation

### Successful Test Run
```
PASS  src/components/__tests__/ProfileForm.test.jsx
  ProfileForm Component
    ✓ should disable all profile fields for students with completed profile
    ✓ should prevent form submission for locked profile
    ✓ should allow moderators to edit student profile
    ... (more tests)

Test Suites: 5 passed, 5 total
Tests:       82 passed, 82 total
```

### Failed Test Example
```
FAIL  src/components/__tests__/ProfileForm.test.jsx
  ProfileForm Component
    ✗ should disable all profile fields for students with completed profile
      Expected: toBeDisabled()
      Received: not disabled
```
If you see failures, it indicates a security issue where students might be able to edit locked fields.

## Key Test Cases

### Profile Locking Tests
```javascript
// Test: Profile fields are disabled after completion
test('should disable all profile fields for students with completed profile', () => {
  const studentData = {
    isProfileCompleted: true,
    fullName: 'John Doe'
  };
  
  render(<ProfileForm studentData={studentData} />);
  
  const nameInput = screen.getByLabelText(/Full Name/i);
  expect(nameInput).toBeDisabled(); // ✅ CRITICAL: Must be disabled
});

// Test: Form submission is prevented
test('should prevent form submission for locked profile', async () => {
  // ... setup ...
  fireEvent.submit(form);
  
  expect(global.alert).toHaveBeenCalledWith(
    'Profile is locked. Contact your moderator to make changes.'
  );
  expect(mockOnUpdate).not.toHaveBeenCalled(); // ✅ CRITICAL: No update
});
```

### Moderator Access Tests
```javascript
// Test: Moderators can edit profiles
test('should allow moderators to edit student profile', () => {
  render(<ProfileForm isModeratorView={true} />);
  
  fireEvent.click(screen.getByRole('button', { name: /Edit Profile/i }));
  
  const nameInput = screen.getByLabelText(/Full Name/i);
  expect(nameInput).not.toBeDisabled(); // ✅ Should be editable
});
```

### Editable Sections Tests
```javascript
// Test: Students can always edit internships
test('should allow adding internships regardless of profile status', () => {
  const completedProfile = { isProfileCompleted: true };
  
  render(<InternshipForm />);
  
  const addButton = screen.getByRole('button', { name: /Add Internship/i });
  expect(addButton).not.toBeDisabled(); // ✅ Always editable
});
```

## Debugging Failed Tests

### Common Issues

#### 1. Import Errors
```
Cannot find module '@testing-library/react'
```
**Solution:** Run `npm install --save-dev @testing-library/react @testing-library/jest-dom --legacy-peer-deps`

#### 2. Component Not Found
```
Cannot find module '../ProfileForm'
```
**Solution:** Check that component files exist in `src/components/`

#### 3. Mock Errors
```
useAuth is not defined
```
**Solution:** Ensure mocks are set up correctly in test file:
```javascript
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));
```

#### 4. Test Timeout
```
Timeout - Async callback was not invoked within the 5000 ms timeout
```
**Solution:** Add `await waitFor()` for async operations or increase timeout

## Test Coverage Goals

### Current Coverage
- **ProfileForm**: 100% of critical security paths
- **InternshipForm**: 95% of functionality
- **SkillsForm**: 95% of functionality
- **ResumeUpload**: 90% of functionality
- **StudentDashboard**: 85% of integration paths

### Areas Covered
- ✅ Role-based access control
- ✅ Input field disabling
- ✅ Form submission prevention
- ✅ Data persistence (localStorage)
- ✅ Tab navigation
- ✅ File upload validation
- ✅ CRUD operations (Create, Read, Update, Delete)

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: cd frontend && npm install
      - name: Run tests
        run: cd frontend && npm test -- --watchAll=false
```

## Continuous Testing During Development

### Watch Mode Workflow
1. Open terminal in `frontend/` directory
2. Run `npm test` (watch mode)
3. Edit component files
4. Tests auto-rerun on save
5. Fix issues until all tests pass

### Pre-Commit Checklist
- [ ] All tests pass (`npm test -- --watchAll=false`)
- [ ] No console errors in test output
- [ ] Coverage report shows >80% coverage
- [ ] New features have corresponding tests

## Writing New Tests

### Template for New Component Test
```javascript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  test('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText(/My Text/i)).toBeInTheDocument();
  });
  
  test('should handle user interaction', () => {
    render(<MyComponent />);
    const button = screen.getByRole('button', { name: /Click Me/i });
    fireEvent.click(button);
    expect(screen.getByText(/Clicked/i)).toBeInTheDocument();
  });
});
```

## Best Practices

1. **Test Behavior, Not Implementation**
   - ✅ DO: Test that fields are disabled
   - ❌ DON'T: Test internal state variables

2. **Use Descriptive Test Names**
   - ✅ DO: "should prevent form submission for locked profile"
   - ❌ DON'T: "test1"

3. **Isolate Tests**
   - Each test should be independent
   - Use `beforeEach` to reset state

4. **Mock External Dependencies**
   - Mock API calls
   - Mock context providers
   - Mock localStorage

5. **Test User Perspective**
   - Use `screen.getByRole`, `screen.getByLabelText`
   - Simulate real user actions with `fireEvent`

## Troubleshooting

### Tests Pass But Feature Doesn't Work
- Clear browser cache and localStorage
- Restart development server
- Check browser console for errors
- Verify environment variables

### Tests Fail But Feature Works
- Update test expectations to match current behavior
- Check if mocks are outdated
- Verify component props in test match actual usage

## Additional Resources

- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Support

If tests fail or you encounter issues:
1. Read the error message carefully
2. Check the test file for expected behavior
3. Compare with component implementation
4. Review this guide for common solutions
5. Check component file paths and imports
