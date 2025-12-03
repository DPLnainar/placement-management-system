# TypeScript Migration Guide

## Overview

The backend is now transitioning to **TypeScript** for type safety, better IDE support, and improved code quality. This guide explains the migration strategy and how to work with TypeScript.

## Project Structure

```
backend-node/
├── src/                          # TypeScript source code
│   ├── config/                   # Configuration files
│   │   └── database.ts
│   ├── controllers/              # Request handlers (to migrate)
│   ├── middleware/               # Express middleware
│   │   ├── logger.ts
│   │   ├── validation.ts
│   │   ├── audit.ts
│   │   └── rateLimiter.ts
│   ├── models/                   # Mongoose models (to migrate)
│   ├── routes/                   # Route definitions
│   │   ├── authRoutes.ts
│   │   ├── jobRoutes.ts
│   │   └── ... (more routes)
│   ├── services/                 # Business logic (to create)
│   ├── utils/                    # Utility functions (to migrate)
│   ├── types/                    # TypeScript type definitions
│   │   ├── env.d.ts              # Environment variables
│   │   └── index.ts              # Common interfaces
│   └── server.ts                 # Express app entry point
├── dist/                         # Compiled JavaScript (auto-generated)
├── tsconfig.json                 # TypeScript configuration
├── .eslintrc.json                # ESLint rules
├── .prettierrc.json              # Prettier formatting
└── package.json                  # Dependencies and scripts
```

## Scripts

### Development

```bash
# Start with ts-node (auto-reload on changes)
npm run dev

# Watch TypeScript files and recompile
npm run dev:watch
```

### Building

```bash
# Compile TypeScript to JavaScript
npm run build

# Check types without emitting
npm run type-check
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Fix ESLint issues automatically
npm run lint:fix
```

### Database

```bash
# Seed admin users
npm run seed

# Create admin interactively
npm run create-admin

# Seed superadmin
npm run seed-superadmin
```

## Migration Strategy

### Phase 1: ✅ Foundation (Complete)
- [x] TypeScript setup (tsconfig.json)
- [x] ESLint and Prettier configuration
- [x] Type definitions (env.d.ts, index.ts)
- [x] Core server file (server.ts)
- [x] Middleware files
- [x] Route stubs

### Phase 2: Models (In Progress)
- [ ] Convert Mongoose models to TypeScript with interfaces
  - [ ] User.js → User.ts with IUser interface
  - [ ] Job.js → Job.ts with IJob interface
  - [ ] StudentData.js → StudentData.ts with IStudentData interface
  - [ ] Application.js → Application.ts with IApplication interface
  - [ ] ... (all other models)

### Phase 3: Controllers
- [ ] Convert request handlers with proper typing
- [ ] Implement error handling with typed responses
- [ ] Add JSDoc comments for API documentation

### Phase 4: Routes & Services
- [ ] Migrate route definitions
- [ ] Create service layer for business logic
- [ ] Add authentication middleware in TypeScript

### Phase 5: Frontend
- [ ] Setup TypeScript in React
- [ ] Convert API services
- [ ] Add type definitions for API responses

## Type Definitions

### Environment Variables

```typescript
// Defined in src/types/env.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      MONGODB_URI: string;
      JWT_SECRET: string;
      // ... more variables
    }
  }
}
```

### Common Interfaces

```typescript
// Defined in src/types/index.ts

interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'superadmin' | 'admin' | 'moderator' | 'student';
  collegeId?: string;
  // ... more fields
}

interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}
```

## Path Aliases

TypeScript is configured with path aliases for cleaner imports:

```typescript
// Instead of:
import { connectDB } from '../../../../config/database';

// Use:
import { connectDB } from '@config/database';

// Aliases available:
// @/* → src/*
// @models/* → src/models/*
// @controllers/* → src/controllers/*
// @routes/* → src/routes/*
// @middleware/* → src/middleware/*
// @services/* → src/services/*
// @utils/* → src/utils/*
// @config/* → src/config/*
```

## Best Practices

### 1. **Type Everything**
```typescript
// ✅ Good
function calculateGPA(grades: number[]): number {
  return grades.reduce((a, b) => a + b) / grades.length;
}

// ❌ Avoid
function calculateGPA(grades) {
  return grades.reduce((a, b) => a + b) / grades.length;
}
```

### 2. **Use Interfaces for Objects**
```typescript
// ✅ Good
interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

// ❌ Avoid
function createUser(data: any) {
  // ...
}
```

### 3. **Handle Errors Properly**
```typescript
// ✅ Good
catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
}

// ❌ Avoid
catch (error) {
  console.error(error.message);  // error might not be Error
}
```

### 4. **Use Strict Mode**
All TypeScript files use `strict: true` mode:
- No implicit `any`
- No implicit `null` or `undefined`
- Strict function types
- Strict property initialization

### 5. **Avoid `any`**
```typescript
// ✅ Good
const parseUser = (data: IUser): IUser => data;

// ❌ Avoid
const parseUser = (data: any): any => data;
```

## Running the Application

### Development

```bash
# Terminal 1: Backend
cd backend-node
npm install  # (only first time)
npm run dev

# Terminal 2: Frontend
cd frontend
npm start
```

### Production

```bash
# Build TypeScript
npm run build

# Start compiled server
npm start
```

## Common Errors & Solutions

### Error: `Cannot find module '@config/database'`
**Solution**: Make sure `tsconfig.json` is present and paths are configured correctly.

### Error: `Type 'any' is not assignable`
**Solution**: Remove `any` types and use proper interfaces. Check strict mode in tsconfig.json.

### Error: `Cannot find name 'process'`
**Solution**: Ensure `@types/node` is installed: `npm install --save-dev @types/node`

## Next Steps

1. **Convert Models** - Start with `User.ts` and create proper interfaces
2. **Create Services** - Move business logic to service layer
3. **Type Controllers** - Add request/response typing to all handlers
4. **Add Authentication** - Implement JWT middleware in TypeScript
5. **Integrate with Frontend** - Share types between backend and frontend

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express TypeScript Guide](https://expressjs.com/en/resources/middleware/body-parser.html)
- [Mongoose & TypeScript](https://mongoosejs.com/docs/typescript.html)
- [ESLint for TypeScript](https://typescript-eslint.io/)

## Troubleshooting

```bash
# Clear compiled files and rebuild
rm -rf dist
npm run build

# Check for type errors
npm run type-check

# Format code
npm run lint:fix

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Questions?

Refer to the main README.md for architecture overview and API documentation.
