# InoFlow Project Structure

This document provides a comprehensive overview of the InoFlow project structure, file organization, and where to find specific functionality.

## Root Directory Structure

```
inoflow/
├── docs/                      # Documentation files
│   ├── ARCHITECTURE.md        # System architecture documentation
│   ├── STRUCTURE.md           # This file
│   └── TDD.md                 # Test-driven development guidelines
│
├── public/                    # Static assets (served at root)
│   ├── logo.png              # Application logo
│   └── ...                   # Other static files
│
├── src/                      # Source code directory
│   ├── app/                  # Next.js App Router pages
│   ├── components/           # React components
│   ├── contexts/             # React contexts
│   ├── lib/                  # Utility libraries
│   └── types/                # TypeScript type definitions
│
├── .cursor/                  # IDE-specific configuration
│   └── rules/                # Cursor AI rules
│
├── node_modules/             # Dependencies (generated)
├── .next/                    # Next.js build output (generated)
├── bun.lock                  # Bun lock file
├── eslint.config.mjs         # ESLint configuration
├── next.config.ts            # Next.js configuration
├── package.json              # Project dependencies
├── postcss.config.mjs        # PostCSS configuration
├── tsconfig.json             # TypeScript configuration
└── README.md                 # Project overview
```

---

## Source Code Structure (`src/`)

### App Directory (`src/app/`)

The App Router follows a file-system based routing where each folder becomes a route.

```
src/app/
├── layout.tsx                  # Root layout with providers
├── page.tsx                    # Home page (redirects to dashboard/signin)
├── globals.css                 # Global styles (Tailwind)
│
├── api/                        # API routes
│   ├── ai/
│   │   └── dispatch/
│   │       └── route.ts        # POST - Trigger n8n AI workflow
│   │
│   ├── auth/
│   │   ├── [...nextauth]/
│   │   │   └── route.ts        # NextAuth handler
│   │   └── change-password/
│   │       └── route.ts        # POST - Change user password
│   │
│   ├── clients/
│   │   └── route.ts            # GET/POST - List/create clients
│   │
│   ├── notifications/
│   │   ├── route.ts            # GET/POST - List/create notifications
│   │   └── [id]/
│   │       └── route.ts        # PATCH - Mark notification as read
│   │   └── mark-all-read/
│   │       └── route.ts        # PATCH - Mark all notifications as read
│   │
│   ├── systems/
│   │   └── route.ts            # GET/POST - List/create systems
│   │
│   ├── tasks/
│   │   ├── route.ts            # GET/POST - List/create tasks
│   │   ├── [id]/
│   │   │   ├── route.ts        # GET/PATCH/DELETE - Task details
│   │   │   ├── status/
│   │   │   │   └── route.ts    # PATCH - Update task status
│   │   │   ├── attachments/
│   │   │   │   └── route.ts    # GET/POST - Task attachments
│   │   │   ├── notes/
│   │   │   │   └── route.ts    # GET/POST - Task notes
│   │   │   ├── status-logs/
│   │   │   │   └── route.ts    # GET - Task status history
│   │   │   └── subtasks/
│   │   │       ├── route.ts    # GET/POST - Task subtasks
│   │   │       └── [subtaskId]/
│   │   │           └── route.ts # PATCH/DELETE - Subtask operations
│   │   └── attachments/
│   │       └── upload/
│   │           └── route.ts    # POST - Upload file attachment
│   │
│   └── users/
│       ├── route.ts            # GET/POST - List/create users
│       └── [id]/
│           └── route.ts        # PATCH/DELETE - User operations
│
├── auth/
│   └── signin/
│       └── page.tsx            # Login page (client component)
│
├── dashboard/
│   └── page.tsx                # Main dashboard (client component)
│
├── tasks/
│   ├── page.tsx                # Tasks list page
│   └── [id]/
│       └── page.tsx            # Task detail page
│
├── admin/
│   └── page.tsx                # Admin panel (requires ADMIN role)
│
└── assigner/
    └── page.tsx                # Assigner dashboard
```

### Components Directory (`src/components/`)

```
src/components/
├── Header.tsx                  # Navigation header with user menu
├── KanbanBoard.tsx             # Kanban board with drag-drop (5 columns)
├── NotificationBell.tsx        # Notification bell with dropdown
├── SessionProvider.tsx         # NextAuth session provider wrapper
├── TaskForm.tsx                # Task creation/edit form
├── TaskList.tsx                # Table view of tasks
└── Toast.tsx                   # Toast notification component
```

### Contexts Directory (`src/contexts/`)

```
src/contexts/
└── NotificationContext.tsx     # Global notification state management
```

### Lib Directory (`src/lib/`)

```
src/lib/
├── auth.ts                     # NextAuth configuration
├── supabase.ts                 # Supabase client configuration
├── mailer.ts                   # Email configuration (nodemailer)
└── utils.ts                    # Utility functions (cn, etc.)
```

### Types Directory (`src/types/`)

```
src/types/
├── index.ts                    # Core type definitions (User, Task, etc.)
├── task.ts                     # Task-specific types with extended status
└── next-auth.d.ts              # NextAuth type augmentations
```

### Middleware (`src/`)

```
src/
└── middleware.ts               # NextAuth middleware for route protection
```

---

## File-by-File Reference

### Configuration Files

| File | Purpose |
|------|---------|
| [package.json](../package.json) | Dependencies and npm scripts |
| [tsconfig.json](../tsconfig.json) | TypeScript configuration with path aliases |
| [next.config.ts](../next.config.ts) | Next.js optimization and caching |
| [eslint.config.mjs](../eslint.config.mjs) | ESLint rules |
| [postcss.config.mjs](../postcss.config.mjs) | Tailwind CSS processing |
| [bun.lock](../bun.lock) | Dependency lock file (Bun) |

### Core Application Files

| File | Purpose | Type |
|------|---------|------|
| [src/app/layout.tsx](../src/app/layout.tsx) | Root layout with providers | Server Component |
| [src/app/page.tsx](../src/app/page.tsx) | Home redirect logic | Server Component |
| [src/middleware.ts](../src/middleware.ts) | Route protection | Middleware |
| [src/lib/auth.ts](../src/lib/auth.ts) | Auth configuration | Module |
| [src/lib/supabase.ts](../src/lib/supabase.ts) | Database client | Module |

### Page Components

| File | Route | Purpose | Auth Required |
|------|-------|---------|---------------|
| [src/app/auth/signin/page.tsx](../src/app/auth/signin/page.tsx) | `/auth/signin` | Login form | No |
| [src/app/dashboard/page.tsx](../src/app/dashboard/page.tsx) | `/dashboard` | Main dashboard | Yes |
| [src/app/tasks/page.tsx](../src/app/tasks/page.tsx) | `/tasks` | Task list | Yes |
| [src/app/tasks/[id]/page.tsx](../src/app/tasks/[id]/page.tsx) | `/tasks/[id]` | Task details | Yes |
| [src/app/admin/page.tsx](../src/app/admin/page.tsx) | `/admin` | Admin panel | ADMIN only |
| [src/app/assigner/page.tsx](../src/app/assigner/page.tsx) | `/assigner` | Assigner dashboard | ASSIGNER+ |

### API Route Handlers

| Route | Methods | Description | Auth Required |
|-------|---------|-------------|---------------|
| `/api/auth/[...nextauth]` | ALL | NextAuth handler | Public |
| `/api/auth/change-password` | POST | Change password | Yes |
| `/api/users` | GET, POST | List/create users | GET: All, POST: ADMIN |
| `/api/users/[id]` | PATCH, DELETE | Update/delete user | ADMIN/Owner |
| `/api/clients` | GET, POST | List/create clients | Yes |
| `/api/systems` | GET, POST | List/create systems | Yes |
| `/api/tasks` | GET, POST | List/create tasks | Yes |
| `/api/tasks/[id]` | GET, PATCH, DELETE | Task operations | Yes (with RBAC) |
| `/api/tasks/[id]/status` | PATCH | Update status | Yes (with RBAC) |
| `/api/tasks/[id]/subtasks` | GET, POST | Subtask operations | Yes |
| `/api/tasks/[id]/notes` | GET, POST | Note operations | Yes |
| `/api/tasks/[id]/attachments` | GET, POST | Attachments | Yes |
| `/api/notifications` | GET, POST | Notifications | Yes |
| `/api/notifications/[id]` | PATCH | Mark read | Yes |
| `/api/ai/dispatch` | POST | AI workflow trigger | Yes |

### UI Components

| Component | Props | Description |
|-----------|-------|-------------|
| [Header.tsx](../src/components/Header.tsx) | - | Navigation bar with user menu |
| [KanbanBoard.tsx](../src/components/KanbanBoard.tsx) | tasks, onStatusChange, onTaskClick, onTaskDelete | Drag-drop kanban with 5 columns |
| [TaskList.tsx](../src/components/TaskList.tsx) | tasks, onTaskClick, onStatusChange | Table view of tasks |
| [TaskForm.tsx](../src/components/TaskForm.tsx) | onSubmit, initialData | Create/edit task form |
| [NotificationBell.tsx](../src/components/NotificationBell.tsx) | - | Notification dropdown |
| [Toast.tsx](../src/components/Toast.tsx) | message, type | Toast notification |
| [SessionProvider.tsx](../src/components/SessionProvider.tsx) | session | NextAuth provider |

### Type Definitions

| File | Exports |
|------|---------|
| [src/types/index.ts](../src/types/index.ts) | User, Task, Client, System, Comment, Notification |
| [src/types/task.ts](../src/types/task.ts) | Task (extended), Subtask, Note |
| [src/types/next-auth.d.ts](../src/types/next-auth.d.ts) | NextAuth type augmentations |

---

## Naming Conventions

### File Names
- **Components**: PascalCase (`KanbanBoard.tsx`)
- **Utilities**: camelCase (`utils.ts`)
- **Types**: camelCase (`next-auth.d.ts`)
- **Routes**: lowercase (`page.tsx`, `route.ts`)

### Code Conventions
- **Components**: PascalCase (`function KanbanBoard()`)
- **Functions**: camelCase (`const fetchTasks = ()`)
- **Constants**: UPPER_SNAKE_CASE (`const MAX_TASKS = 100`)
- **Types/Interfaces**: PascalCase (`interface User {}`)
- **Enums**: PascalCase (`enum Role`)

---

## Import Patterns

### Path Aliases
```typescript
import { Task } from '@/types/task';
import { supabase } from '@/lib/supabase';
import { authOptions } from '@/lib/auth';
```

### Relative Imports
```typescript
import NotificationContext from '@/contexts/NotificationContext';
import KanbanBoard from '@/components/KanbanBoard';
```

---

## Data Flow Patterns

### Server-to-Client (SSR)
```
API Route (server) → JSON Response → fetch() → Component State
```

### Client-to-Server (Actions)
```
User Action → fetch() → API Route → Database → Response → State Update
```

### Real-time Updates
```
Database Change → Supabase Realtime → Component Subscription → State Refresh
```

---

## Folder Organization Patterns

### Co-location
- Route handlers are co-located with their routes (`app/api/*/route.ts`)
- Pages are in folders matching their URLs

### Separation of Concerns
- **Components**: Reusable UI only
- **API Routes**: Business logic + data access
- **Types**: Shared interfaces
- **Lib**: Configuration and utilities

---

## Static Assets

### Public Directory
```
public/
└── logo.png                 # Referenced as /logo.png
```

### Image Usage
```typescript
<Image src="/logo.png" alt="Logo" width={660} height={180} />
```

---

## Build Artifacts (Generated)

```
.next/                        # Next.js build output
├── cache/                    # Build cache
├── server/                   # Server bundle
└── static/                   # Static assets
```

---

## Where to Find...

### Authentication Logic
- Configuration: [src/lib/auth.ts](../src/lib/auth.ts)
- Sign-in page: [src/app/auth/signin/page.tsx](../src/app/auth/signin/page.tsx)
- Middleware: [src/middleware.ts](../src/middleware.ts)

### Task Management
- API: [src/app/api/tasks/](../src/app/api/tasks/route.ts)
- UI: [src/components/KanbanBoard.tsx](../src/components/KanbanBoard.tsx)
- Types: [src/types/task.ts](../src/types/task.ts)

### Database Operations
- Client config: [src/lib/supabase.ts](../src/lib/supabase.ts)
- Queries: Scattered in API routes

### Role-Based Access Control
- Middleware: [src/middleware.ts](../src/middleware.ts)
- API checks: Each route handler

### Real-time Features
- Dashboard: [src/app/dashboard/page.tsx](../src/app/dashboard/page.tsx) (lines 80-123)
- Config: [src/lib/supabase.ts](../src/lib/supabase.ts) (realtime options)

### Styling
- Global: [src/app/globals.css](../src/app/globals.css)
- Components: Tailwind classes inline

---

## Adding New Features

### New Page
1. Create folder in `src/app/`
2. Add `page.tsx`
3. Add to middleware if protected

### New API Route
1. Create folder in `src/app/api/`
2. Add `route.ts` with exported handlers (GET, POST, etc.)
3. Add auth check to each handler

### New Component
1. Create in `src/components/`
2. Export as default
3. Import where needed

### New Type
1. Add to `src/types/index.ts` or create new file
2. Import with `@/types/*` alias

---

*Last Updated: 2025-01-08*
