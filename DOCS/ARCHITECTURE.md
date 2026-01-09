# InoFlow Architecture Documentation

## Overview

InoFlow is a SAP ABAP job management and tracking system designed for consultancy firms. The application enables task assignment, progress tracking, client management, and workforce coordination through a role-based access control system.

## Technology Stack

### Frontend
- **Framework**: Next.js 15.5.2 (App Router)
- **UI Library**: React 19.1.0
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **Fonts**: Geist & Geist Mono (Vercel)

### Backend
- **API Layer**: Next.js API Routes (serverless functions)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js v4
- **Password Hashing**: bcryptjs (12 rounds)
- **Email**: nodemailer

### DevOps
- **Package Manager**: Bun
- **Build Tool**: Turbopack (Next.js 15)
- **Linting**: ESLint with Next.js rules
- **Code Formatting**: Tailwind PostCSS

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Dashboard  │  │   Tasks      │  │    Admin     │          │
│  │   (SSR+CSR)  │  │   (CSR)      │  │   (SSR)      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                 │                 │                    │
│         └─────────────────┴─────────────────┘                    │
│                           │                                      │
│                  ┌────────▼────────┐                             │
│                  │  React Context  │                             │
│                  │  - Session      │                             │
│                  │  - Notification │                             │
│                  └────────┬────────┘                             │
└───────────────────────────┼─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                    API LAYER (Next.js)                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Middleware                             │    │
│  │  - Route protection (/dashboard, /tasks, /admin)        │    │
│  │  - Role-based access control                           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           │                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Auth Layer                             │    │
│  │  - NextAuth.js (JWT strategy)                           │    │
│  │  - Credentials provider                                 │    │
│  │  - Session management                                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           │                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              API Route Handlers                          │    │
│  │  /api/tasks     /api/users    /api/clients              │    │
│  │  /api/systems   /api/notifications                      │    │
│  └─────────────────────────────────────────────────────────┘    │
└───────────────────────────┼─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                    DATA LAYER                                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Supabase Client                         │    │
│  │  - Query builder                                        │    │
│  │  - Realtime subscriptions                               │    │
│  │  - Authentication                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           │                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              PostgreSQL Database                         │    │
│  │  Tables: users, tasks, clients, systems,                │    │
│  │          subtasks, notes, notifications,                 │    │
│  │          task_attachments, status_logs                  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                 EXTERNAL INTEGRATIONS                           │
├─────────────────────────────────────────────────────────────────┤
│  - n8n Webhook (AI task dispatch)                               │
│  - Email Service (nodemailer)                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

```
┌─────────┐                 ┌────────────┐              ┌──────────┐
│  User   │                 │ NextAuth   │              │ Supabase │
└────┬────┘                 └─────┬──────┘              └────┬─────┘
     │                             │                          │
     │ 1. POST /auth/signin         │                          │
     ├─────────────────────────────>│                          │
     │    {email, password}         │                          │
     │                             │                          │
     │                             │ 2. Query user            │
     │                             ├─────────────────────────>│
     │                             │                          │
     │                             │ 3. Return user + hash    │
     │                             │<─────────────────────────┤
     │                             │                          │
     │                             │ 4. bcrypt.compare()      │
     │                             │                          │
     │ 5. Set JWT cookie            │                          │
     │<─────────────────────────────┤                          │
     │                             │                          │
     │ 6. Redirect to /dashboard    │                          │
     ├─────────────────────────────>│                          │
     │                             │                          │
```

### JWT Strategy Configuration
- **Session Storage**: JWT tokens (httpOnly cookies)
- **Token Payload**: `{ sub, iat, exp, role, email, name }`
- **Secret**: `NEXTAUTH_SECRET` environment variable

---

## Data Models

### Core Entities

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    users     │     │    clients   │     │   systems    │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id           │     │ id           │     │ id           │
│ name         │<────│ name         │<────│ name         │
│ email        │     │ description  │     │ client_id    │
│ role         │     │ created_at   │     │ description  │
│ password_hash│     │ updated_at   │     │ created_at   │
│ created_at   │     └──────────────┘     │ updated_at   │
│ updated_at   │                           └──────────────┘
└──────────────┘                                  │
        │                                         │
        │              ┌──────────────────────────┘
        │              │
        ▼              ▼
┌──────────────────────────────┐
│            tasks             │
├──────────────────────────────┤
│ id                           │
│ title                        │
│ description                  │
│ status (*)                   │
│ deadline                     │
│ duration                     │
│ priority (*)                 │
│ client_id                    │
│ system_id                    │
│ assigned_to ──────────────┐  │
│ created_by ───────────────┐│  │
└────────────────────────────┼┼──┘
         │                   ││
         │    ┌──────────────┼┼──────────────┐
         ▼    ▼              ▼▼              ▼
    ┌──────────┐      ┌──────────┐   ┌──────────────┐
    │ subtasks │      │  notes   │   │    notifications│
    ├──────────┤      ├──────────┤   ├──────────────┤
    │ task_id  │      │ task_id  │   │ task_id       │
    │ title    │      │ content  │   │ sender_id     │
    │ completed│      │ created_by│  │ receiver_id   │
    │ completed_at│   │ created_at│  │ type (*)      │
    └──────────┘      └──────────┘   │ status (*)    │
                                     │ created_at   │
                                     └──────────────┘
```

(*) Status values: `NOT_STARTED`, `NEW_STARTED`, `IN_PROGRESS`, `IN_TESTING`, `COMPLETED`
(*) Priority values: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
(*) Notification types: `TASK_ASSIGNED`, `TASK_STATUS_CHANGED`, `TASK_COMPLETED`, `TASK_COMMENT`
(*) Notification status: `UNREAD`, `READ`

---

## Role-Based Access Control (RBAC)

### Roles

| Role | Permissions |
|------|-------------|
| **ADMIN** | - Full system access<br>- Create/delete users<br>- Manage all tasks<br>- Access admin panel |
| **ASSIGNER** | - Create tasks for any worker<br>- View all tasks on dashboard<br>- Manage own created tasks<br>- View worker assignments |
| **WORKER** | - View only assigned tasks<br>- Create tasks for self<br>- Update task status<br>- Add subtasks/notes |

### Access Control Matrix

```
┌──────────────────────────────────────────────────────────────┐
│                       RESOURCE ACCESS                         │
├────────────────┬──────────┬──────────┬──────────┬────────────┤
│    RESOURCE    │  ADMIN   │ ASSIGNER │ WORKER   │   PUBLIC   │
├────────────────┼──────────┼──────────┼──────────┼────────────┤
│ /dashboard     │    ✓     │    ✓     │    ✓     │     ✗      │
│ /tasks         │    ✓     │    ✓     │    ✓     │     ✗      │
│ /tasks/[id]    │    ALL   │  OWN/    │  OWN/    │     -      │
│                │          │  WORKER  | ASSIGNED │            │
│ /admin         │    ✓     │    ✗     │    ✗     │     ✗      │
│ /api/users     │   CRUD   │    R     │    R     │     ✗      │
│ /api/tasks     │   CRUD   │   CRU*   │   CRU**  │     ✗      │
└────────────────┴──────────┴──────────┴──────────┴────────────┘

* Can update/delete own created tasks or tasks assigned to workers
** Can only update/delete own tasks
```

---

## Real-time Data Synchronization

### Supabase Realtime Integration

```typescript
// Channel subscription pattern
const channel = supabase
  .channel('tasks-realtime-dashboard')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'tasks'
  }, (payload) => {
    // Debounced refresh logic
    const relevant = checkUserAccess(payload, session);
    if (relevant) scheduleRefresh();
  })
  .subscribe();
```

### Debounce Strategy
- **Minimum interval**: 2000ms between refreshes
- **Pending refresh**: Single scheduled refresh to prevent duplicate calls
- **Relevance filter**: Only refresh if update affects current user

---

## API Design Patterns

### RESTful Conventions

```
GET    /api/tasks           → List tasks (with filters)
POST   /api/tasks           → Create task
GET    /api/tasks/[id]      → Get task details
PATCH  /api/tasks/[id]      → Update task fields
DELETE /api/tasks/[id]      → Delete task
PATCH  /api/tasks/[id]/status → Update status
POST   /api/tasks/[id]/subtasks → Create subtask
POST   /api/tasks/[id]/notes    → Create note
GET    /api/notifications        → List notifications
PATCH  /api/notifications/[id]   → Mark as read
POST   /api/ai/dispatch          → Trigger AI workflow
```

### Response Format

**Success Response:**
```json
{
  "id": "uuid",
  "title": "Task title",
  "status": "IN_PROGRESS",
  ...
}
```

**Error Response:**
```json
{
  "error": "Error message"
}
```

### Cache Headers
- **Authenticated data**: `Cache-Control: private, no-store, no-cache, must-revalidate`
- **Static assets**: `Cache-Control: public, max-age=31536000, immutable`

---

## Component Architecture

### Server Components (SSR)
- Layout wrapper ([app/layout.tsx](../src/app/layout.tsx))
- Home redirect ([app/page.tsx](../src/app/page.tsx))
- Initial data fetching

### Client Components (CSR)
- Dashboard ([app/dashboard/page.tsx](../src/app/dashboard/page.tsx))
- KanbanBoard ([components/KanbanBoard.tsx](../src/components/KanbanBoard.tsx))
- TaskList ([components/TaskList.tsx](../src/components/TaskList.tsx))
- TaskForm ([components/TaskForm.tsx](../src/components/TaskForm.tsx))
- Authentication UI

### Dynamic Imports
```typescript
const KanbanBoard = dynamic(() => import('@/components/KanbanBoard'), {
  ssr: false,
  loading: () => <Skeleton />
});
```

---

## State Management

### Client State
- **Session**: NextAuth `useSession()` hook
- **Notifications**: React Context ([contexts/NotificationContext.tsx](../src/contexts/NotificationContext.tsx))
- **Local component state**: React `useState`

### Server State
- **Database**: Supabase queries in API routes
- **Cache**: HTTP headers (no client-side cache)

### No Global State Library
- Current implementation uses React Context and local state
- Consider React Query or SWR for complex caching scenarios

---

## Security Measures

### Implemented
- ✅ Password hashing (bcrypt, 12 rounds)
- ✅ JWT-based sessions (httpOnly cookies)
- ✅ Role-based access control
- ✅ Protected API routes
- ✅ SQL injection prevention (Supabase query builder)
- ✅ XSS prevention (React escaping)

### To Be Implemented
- ⚠️ Rate limiting on auth endpoints
- ⚠️ Input validation (zod/yup)
- ⚠️ CSRF protection (consider for state-changing operations)
- ⚠️ Content Security Policy headers
- ⚠️ Audit logging for sensitive operations

---

## Performance Optimizations

### Next.js Config (next.config.ts)
```typescript
{
  compress: true,                    // Gzip compression
  poweredByHeader: false,            // Security: hide X-Powered-By
  optimizePackageImports: [...],     // Tree-shaking
  optimizeCss: true,                 // CSS optimization
  images: {
    formats: ['image/avif', 'image/webp']  // Modern formats
  }
}
```

### Caching Strategy
- **Static assets**: 1 year cache
- **HTML pages**: No cache (must-revalidate)
- **API responses**: No cache for authenticated data

### Code Splitting
- Dynamic imports for heavy components
- Route-based splitting (App Router)
- Turbopack for faster builds

---

## Deployment Considerations

### Environment Variables Required
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# n8n Integration
N8N_WEBHOOK_URL=
N8N_WEBHOOK_SECRET=
N8N_API_KEY=

# Email (optional)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# Realtime toggle
NEXT_PUBLIC_SUPABASE_REALTIME_ENABLED=true
```

### Hosting Recommendations
- **Vercel**: Native Next.js support, edge functions
- **Railway/Render**: Good for Docker deployments
- **Self-hosted**: Node.js server with PM2

---

## Monitoring & Observability

### Current State
- Console logging in API routes
- Error responses to client

### Recommended Additions
- Structured logging (Winston, Pino)
- Error tracking (Sentry)
- Performance monitoring (Vercel Analytics)
- Uptime monitoring

---

## Future Architecture Considerations

### Scalability
1. **API Rate Limiting**: Prevent abuse
2. **Database Indexing**: Optimize query performance
3. **Caching Layer**: Redis for session/storage
4. **CDN**: Static asset delivery

### Extensibility
1. **Plugin System**: Custom workflow integrations
2. **Webhook System**: Event-driven notifications
3. **API Versioning**: Maintain backward compatibility
4. **Microservices**: Extract AI dispatch to separate service

---

## Database Schema Reference

### Key Tables

**users**
```sql
id: uuid (PK)
name: text
email: text (unique)
role: enum (ADMIN, ASSIGNER, WORKER)
password_hash: text
created_at: timestamp
updated_at: timestamp
```

**tasks**
```sql
id: uuid (PK)
title: text
description: text
status: enum (NOT_STARTED, NEW_STARTED, IN_PROGRESS, IN_TESTING, COMPLETED)
priority: enum (LOW, MEDIUM, HIGH, CRITICAL)
deadline: timestamp
duration: integer (seconds)
client_id: uuid (FK)
system_id: uuid (FK)
assigned_to: uuid (FK -> users.id)
created_by: uuid (FK -> users.id)
started_at: timestamp
completed_at: timestamp
created_at: timestamp
updated_at: timestamp
```

**subtasks**
```sql
id: uuid (PK)
task_id: uuid (FK)
title: text
completed: boolean
completed_at: timestamp
created_at: timestamp
```

**notifications**
```sql
id: uuid (PK)
task_id: uuid (FK)
sender_id: uuid (FK)
receiver_id: uuid (FK)
type: enum (TASK_ASSIGNED, TASK_STATUS_CHANGED, TASK_COMPLETED, TASK_COMMENT)
title: text
message: text
status: enum (UNREAD, READ)
created_at: timestamp
```

---

*Last Updated: 2025-01-08*
