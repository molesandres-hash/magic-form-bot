# Testing Guide

## Overview

This project uses **Vitest** as the testing framework. Vitest is fast, Vite-native, and provides excellent developer experience.

## Test Structure

```
src/
├── tests/
│   ├── setup.ts              # Global test setup
│   └── README.md             # This file
├── utils/
│   ├── errorHandling.ts      # Source code
│   ├── errorHandling.test.ts # Tests
│   ├── validators.ts
│   └── validators.test.ts
└── services/
    ├── geminiService.ts
    └── geminiService.test.ts  # (to be added)
```

## Running Tests

### Basic Commands

```bash
# Run tests in watch mode (recommended for development)
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Watch specific test file
npm test errorHandling.test.ts
```

### Full Validation

```bash
# Run linting, tests, and build (recommended before push)
npm run validate
```

## Writing Tests

### Test File Naming

- Test files should be named `*.test.ts` or `*.spec.ts`
- Place test files next to the source file they test
- Example: `errorHandling.ts` → `errorHandling.test.ts`

### Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { functionToTest } from './myModule';

describe('myModule', () => {
  beforeEach(() => {
    // Setup before each test
    vi.clearAllMocks();
  });

  describe('functionToTest', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = functionToTest(input);

      // Assert
      expect(result).toBe('expected');
    });

    it('should handle edge cases', () => {
      expect(functionToTest('')).toBe('');
      expect(functionToTest(null)).toBe(null);
    });
  });
});
```

### Mocking

#### Mock Modules

```typescript
// Mock entire module
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Use mocked module
import { toast } from 'sonner';
expect(toast.error).toHaveBeenCalled();
```

#### Mock Functions

```typescript
// Create mock function
const mockFn = vi.fn();
mockFn.mockReturnValue('mocked value');

// Spy on existing function
const consoleSpy = vi.spyOn(console, 'error');
expect(consoleSpy).toHaveBeenCalled();
```

### Testing Async Functions

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});

it('should handle errors', async () => {
  await expect(failingAsyncFunction()).rejects.toThrow('Error message');
});
```

### Testing React Components

```typescript
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

it('should render component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});

it('should handle user interactions', async () => {
  const user = userEvent.setup();
  render(<MyButton />);

  await user.click(screen.getByRole('button'));
  expect(screen.getByText('Clicked')).toBeInTheDocument();
});
```

## Coverage

### Coverage Thresholds

Current coverage requirements (see `vitest.config.ts`):
- Lines: 60%
- Functions: 60%
- Branches: 50%
- Statements: 60%

### View Coverage Report

```bash
npm run test:coverage
# Opens: coverage/index.html
```

### Coverage Best Practices

1. **Focus on critical paths**: Prioritize testing business logic and error handling
2. **Don't chase 100%**: Some code (types, constants) doesn't need tests
3. **Test behavior, not implementation**: Focus on what code does, not how
4. **Use coverage as a guide**: Low coverage indicates untested code, not bad code

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Push to `main`, `master`, or `develop` branches
- Pull requests to these branches

See `.github/workflows/ci.yml` for configuration.

### Pre-Push Hook

Tests run automatically before `git push`:
- Configured in `.husky/pre-push`
- Prevents pushing broken code
- Can be skipped with `git push --no-verify` (not recommended)

## Common Issues

### Tests Failing Locally But Passing in CI

- Check Node.js version matches CI (see `.github/workflows/ci.yml`)
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for environment-specific code

### Mock Not Working

- Ensure mock is called before importing the module
- Use `vi.clearAllMocks()` in `beforeEach`
- Check mock path matches exactly

### Timeout Errors

```typescript
// Increase timeout for slow tests
it('slow test', async () => {
  // test code
}, 10000); // 10 second timeout
```

### Module Import Errors

- Ensure path aliases in `vitest.config.ts` match `tsconfig.json`
- Check for circular dependencies

## Best Practices

### 1. Arrange-Act-Assert (AAA) Pattern

```typescript
it('should calculate total', () => {
  // Arrange: Set up test data
  const items = [1, 2, 3];

  // Act: Execute the code
  const total = calculateTotal(items);

  // Assert: Verify results
  expect(total).toBe(6);
});
```

### 2. Test One Thing Per Test

```typescript
// ❌ Bad: Tests multiple things
it('should validate and save user', () => {
  expect(validateUser(user)).toBe(true);
  expect(saveUser(user)).toBe(true);
});

// ✅ Good: Separate concerns
it('should validate user data', () => {
  expect(validateUser(user)).toBe(true);
});

it('should save user to database', () => {
  expect(saveUser(user)).toBe(true);
});
```

### 3. Use Descriptive Test Names

```typescript
// ❌ Bad: Vague
it('works', () => { ... });

// ✅ Good: Specific
it('should return empty array when no participants exist', () => { ... });
```

### 4. Test Edge Cases

```typescript
describe('validateEmail', () => {
  it('should accept valid emails', () => { ... });
  it('should reject empty string', () => { ... });
  it('should reject null and undefined', () => { ... });
  it('should reject invalid format', () => { ... });
});
```

### 5. Keep Tests Fast

- Mock external dependencies (APIs, databases)
- Use lightweight test data
- Avoid unnecessary setup

### 6. Make Tests Independent

```typescript
// ❌ Bad: Tests depend on each other
let userId;
it('should create user', () => {
  userId = createUser();
});
it('should find user', () => {
  expect(findUser(userId)).toBeTruthy();
});

// ✅ Good: Each test is independent
it('should create user', () => {
  const userId = createUser();
  expect(userId).toBeTruthy();
});
it('should find user', () => {
  const userId = createUser();
  expect(findUser(userId)).toBeTruthy();
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## Contributing

When adding new features:

1. Write tests first (TDD) or alongside code
2. Ensure all tests pass: `npm run test:run`
3. Check coverage: `npm run test:coverage`
4. Run full validation: `npm run validate`
5. Commit tests with code changes
