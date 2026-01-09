# Test-Driven Development Guidelines

## Overview

This document outlines the testing strategy, guidelines, and best practices for Test-Driven Development (TDD) in the InoFlow project. Currently, the project has no test coverage, so this guide serves as a roadmap for implementing comprehensive testing.

---

## Current State

- **Unit Tests**: None
- **Integration Tests**: None
- **E2E Tests**: None
- **Test Coverage**: 0%

**Priority**: Establish testing foundation before scaling features.

---

## Testing Philosophy

### The Testing Pyramid

```
                   ╱╲
                  ╱  ╲
                 ╱ E2E ╲           (10%)
                ╱───────╲
               ╱         ╲
              ╱ Integration ╲       (30%)
             ╱───────────────╲
            ╱                 ╲
           ╱    Unit Tests     ╲    (60%)
          ╱─────────────────────╲
```

### Testing Goals

1. **Fast Feedback**: Unit tests should run in milliseconds
2. **Reliability**: Tests should be flake-free and deterministic
3. **Maintainability**: Tests should be easy to understand and modify
4. **Coverage**: Aim for 80%+ coverage on critical business logic

---

## Recommended Testing Stack

### Unit & Integration Tests

```json
{
  "vitest": "^2.0.0",           // Fast unit test runner
  "@testing-library/react": "^16.0.0",  // React component testing
  "@testing-library/jest-dom": "^6.0.0",  // Custom matchers
  "@testing-library/user-event": "^14.0.0",  // User interaction simulation
  "msw": "^2.0.0"               // API mocking
}
```

### End-to-End Tests

```json
{
  "playwright": "^1.40.0"       // E2E testing framework
}
```

### Coverage

```json
{
  "@vitest/coverage-v8": "^1.0.0"
}
```

---

## Project Structure with Tests

```
inoflow/
├── src/
│   ├── app/
│   │   └── api/
│   │       └── tasks/
│   │           └── route.ts
│   ├── components/
│   │   └── KanbanBoard.tsx
│   └── lib/
│       └── auth.ts
│
├── __tests__/
│   ├── unit/
│   │   ├── components/
│   │   │   └── KanbanBoard.test.tsx
│   │   ├── lib/
│   │   │   └── auth.test.ts
│   │   └── utils/
│   │       └── cn.test.ts
│   │
│   ├── integration/
│   │   └── api/
│   │       └── tasks.test.ts
│   │
│   └── e2e/
│       ├── auth.spec.ts
│       ├── tasks.spec.ts
│       └── dashboard.spec.ts
│
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

---

## Setup Instructions

### 1. Install Dependencies

```bash
# Unit & Integration Testing
bun add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/coverage-v8 msw

# E2E Testing
bun add -D @playwright/test
```

### 2. Create Vitest Config

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './__tests__/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/',
        '__tests__/',
        '**/*.config.*',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 3. Create Test Setup

```typescript
// __tests__/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));
```

### 4. Create Playwright Config

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 5. Update package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## Testing Patterns

### Unit Tests

#### Testing Components

```typescript
// __tests__/unit/components/KanbanBoard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KanbanBoard from '@/components/KanbanBoard';

describe('KanbanBoard', () => {
  const mockTasks = [
    {
      id: '1',
      title: 'Test Task',
      status: 'NOT_STARTED',
      assigned_to: 'user1',
      // ... other fields
    },
  ];

  it('renders tasks in correct columns', () => {
    render(
      <KanbanBoard
        tasks={mockTasks}
        onStatusChange={vi.fn()}
        onTaskClick={vi.fn()}
      />
    );

    expect(screen.getByText('Açık İşler')).toBeInTheDocument();
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('calls onStatusChange when task is dropped', async () => {
    const onStatusChange = vi.fn();
    const user = userEvent.setup();

    render(
      <KanbanBoard
        tasks={mockTasks}
        onStatusChange={onStatusChange}
        onTaskClick={vi.fn()}
      />
    );

    // Simulate drag and drop
    const task = screen.getByText('Test Task');
    const targetColumn = screen.getByText('Geliştirme Aşamasında');

    await user.dragAndDrop(task, targetColumn);

    expect(onStatusChange).toHaveBeenCalledWith('1', 'IN_PROGRESS');
  });
});
```

#### Testing API Route Handlers

```typescript
// __tests__/integration/api/tasks.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/tasks/route';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

describe('POST /api/tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a task successfully', async () => {
    const mockTask = {
      id: '123',
      title: 'New Task',
      status: 'NOT_STARTED',
    };

    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockTask, error: null }),
        }),
      }),
    } as any);

    const request = new Request('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: 'New Task',
        description: 'Test',
        client_id: 'client1',
        system_id: 'system1',
        assigned_to: 'user1',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe('New Task');
  });

  it('returns 401 when not authenticated', async () => {
    const { getServerSession } = await import('next-auth');
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/tasks', {
      method: 'POST',
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });
});
```

#### Testing Utility Functions

```typescript
// __tests__/unit/utils/cn.test.ts
import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible');
  });

  it('handles Tailwind conflicts', () => {
    expect(cn('px-4', 'px-2')).toBe('px-2');
  });
});
```

### Integration Tests

```typescript
// __tests__/integration/task-workflow.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestClient } from '@/__tests__/utils/test-client';

describe('Task Workflow Integration', () => {
  let client: ReturnType<typeof createTestClient>;
  let taskId: string;

  beforeEach(async () => {
    client = createTestClient();
    await client.loginAs('ADMIN');
  });

  it('creates, updates, and deletes a task', async () => {
    // Create
    const created = await client.createTask({
      title: 'Integration Test Task',
      description: 'Testing the full workflow',
      client_id: 'client1',
      system_id: 'system1',
      assigned_to: 'worker1',
    });
    expect(created.status).toBe('NOT_STARTED');
    taskId = created.id;

    // Update status
    const updated = await client.updateTaskStatus(taskId, 'IN_PROGRESS');
    expect(updated.status).toBe('IN_PROGRESS');

    // Add subtask
    const subtask = await client.addSubtask(taskId, 'Test subtask');
    expect(subtask.title).toBe('Test subtask');

    // Delete
    await client.deleteTask(taskId);
    const deleted = await client.getTask(taskId);
    expect(deleted).toBeNull();
  });
});
```

### E2E Tests

```typescript
// __tests__/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('allows user to sign in', async ({ page }) => {
    await page.goto('/auth/signin');

    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Hoş geldiniz')).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Geçersiz email veya şifre')).toBeVisible();
  });

  test('redirects unauthenticated users to signin', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL('/auth/signin');
  });
});
```

```typescript
// __tests__/e2e/tasks.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('displays kanban board with tasks', async ({ page }) => {
    await expect(page.locator('text=Açık İşler')).toBeVisible();
    await expect(page.locator('text=Geliştirme Aşamasında')).toBeVisible();
    await expect(page.locator('text=Teste Verilenler')).toBeVisible();
    await expect(page.locator('text=Tamamlananlar')).toBeVisible();
  });

  test('allows creating a new task', async ({ page }) => {
    await page.click('text=Yeni İş Oluştur');

    await page.fill('input[name="title"]', 'E2E Test Task');
    await page.fill('textarea[name="description"]', 'Created from E2E test');
    await page.selectOption('select[name="client_id"]', 'client1');
    await page.selectOption('select[name="system_id"]', 'system1');
    await page.selectOption('select[name="assigned_to"]', 'worker1');

    await page.click('button:has-text("Oluştur")');

    await expect(page.locator('text=E2E Test Task')).toBeVisible();
  });

  test('allows drag and drop to change status', async ({ page }) => {
    const task = page.locator('text=Test Task').first();
    const targetColumn = page.locator('text=Geliştirme Aşamasında').first();

    await task.dragTo(targetColumn);

    // Verify the task moved
    await expect(page.locator('.bg-yellow-100').locator('text=Test Task')).toBeVisible();
  });
});
```

---

## TDD Workflow

### Red-Green-Refactor Cycle

```
┌─────────────────────────────────────────────────────────┐
│  1. RED    ──►  Write a failing test                    │
│                  - Test describes desired behavior       │
│                  - Run and watch it fail                │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  2. GREEN  ──►  Write minimum code to pass              │
│                  - Implement just enough to pass        │
│                  - Don't worry about perfect code       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  3. REFACTOR ─►  Improve the code                       │
│                  - Clean up while keeping tests green   │
│                  - Apply design patterns                │
└─────────────────────────────────────────────────────────┘
                           │
                           └──────────► Repeat
```

### Example TDD Session

**Step 1: Write Failing Test (RED)**

```typescript
// __tests__/unit/lib/auth.test.ts
import { describe, it, expect } from 'vitest';
import { hashPassword } from '@/lib/auth';

describe('hashPassword', () => {
  it('should hash a password with bcrypt', async () => {
    const password = 'mypassword';
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(50);
  });

  it('should generate different hashes for same password', async () => {
    const password = 'mypassword';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2); // Different salts
  });
});
```

**Step 2: Make Test Pass (GREEN)**

```typescript
// src/lib/auth.ts
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}
```

**Step 3: Refactor (if needed)**

```typescript
// Extract constants, add error handling, etc.
const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  return await bcrypt.hash(password, SALT_ROUNDS);
}
```

---

## Testing Checklist

### Before Writing Code
- [ ] Write failing test first
- [ ] Test covers happy path
- [ ] Test covers error cases
- [ ] Test covers edge cases

### When Writing Tests
- [ ] Tests are independent (no shared state)
- [ ] Tests are deterministic (same result every time)
- [ ] Tests are fast (< 100ms per unit test)
- [ ] Tests have descriptive names

### After Writing Tests
- [ ] All tests pass
- [ ] Code coverage is acceptable (> 80% for critical paths)
- [ ] No console warnings
- [ ] Tests commit with code

---

## Coverage Targets

| Area | Target Coverage | Priority |
|------|-----------------|----------|
| Authentication logic | 90%+ | Critical |
| API route handlers | 85%+ | Critical |
| Business logic (utils) | 90%+ | Critical |
| React components | 70%+ | High |
| Integration flows | 60%+ | Medium |
| E2E scenarios | Key paths only | Low |

---

## Common Testing Patterns

### Mocking External Dependencies

```typescript
// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: { user: { id: '1', role: 'ADMIN' } },
    status: 'authenticated',
  })),
}));
```

### Testing Async Behavior

```typescript
it('loads tasks asynchronously', async () => {
  render(<TaskList />);

  // Wait for async state update
  await waitFor(() => {
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
});
```

### Testing User Interactions

```typescript
it('submits form on button click', async () => {
  const user = userEvent.setup();
  render(<TaskForm />);

  await user.type(screen.getByLabelText('Title'), 'New Task');
  await user.click(screen.getByRole('button', { name: 'Submit' }));

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({ title: 'New Task' });
  });
});
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Run unit tests
        run: bun test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

      - name: Install Playwright
        run: bunx playwright install --with-deps

      - name: Run E2E tests
        run: bun test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

---

## Best Practices

### DO's
- ✅ Write tests before implementing features (TDD)
- ✅ Keep tests simple and focused
- ✅ Use descriptive test names
- ✅ Test behavior, not implementation
- ✅ Mock external dependencies
- ✅ Keep tests fast
- ✅ Run tests locally before committing

### DON'Ts
- ❌ Don't test implementation details
- ❌ Don't write fragile tests that break on refactoring
- ❌ Don't skip tests intentionally
- ❌ Don't mock everything (test integration points)
- ❌ Don't write slow tests
- ❌ Don't ignore failing tests

---

## Next Steps

1. **Immediate**: Set up Vitest and write first unit test
2. **Week 1**: Achieve 50% coverage on auth and tasks modules
3. **Week 2**: Add integration tests for API routes
4. **Week 3**: Set up Playwright and write critical E2E tests
5. **Ongoing**: Maintain > 80% coverage on new features

---

*Last Updated: 2025-01-08*
