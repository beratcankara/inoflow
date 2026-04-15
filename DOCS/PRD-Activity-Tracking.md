# PRD: Activity Tracking System

**Version:** 1.0
**Status:** Planning
**Last Updated:** 2025-01-08

---

## Executive Summary

The Activity Tracking System is a new feature for InoFlow that enables users to log detailed time-based activities against tasks. This system extends the existing task workflow without disrupting current processes, providing organizations with better visibility into work distribution, time allocation, and client billing capabilities.

### Key Benefits
- **Transparent Time Tracking**: Users can log activities with manual time entry and detailed notes
- **Client Billing Support**: Export activities by company for invoicing and reporting
- **Team Visibility**: Everyone can view all activities across the organization
- **Flexible Reporting**: Filter, sort, and export activities by multiple criteria

---

## User Stories

### Primary Users
| Role | Goal | Need |
|------|------|------|
| **WORKER** | Log time spent on tasks | Quick activity entry from anywhere |
| **ASSIGNER** | Review team activities | See all activities, export for billing |
| **ADMIN** | Full system oversight | Complete visibility + reporting |

### User Stories
1. **As a WORKER**, I want to quickly log activities from the task detail page so I can track my work without leaving my context
2. **As a WORKER**, I want to add activities from a dedicated Activities page so I can log work after completion
3. **As an ASSIGNER**, I want to filter activities by company and date so I can prepare monthly reports
4. **As an ADMIN**, I want to export all activities to Excel so I can analyze team productivity
5. **As any USER**, I want to see a monthly view of activities so I can review my work at a glance

---

## Functional Requirements

### FR1: Activities Page
**Location:** `/activities`

**Requirements:**
- Display all activities in a filterable, sortable table
- Support filtering by: date range, company/client, task status, user
- Support sorting by: date, time spent, company, task, user
- Monthly view toggle (show activities for selected month only)
- Quick "Add Activity" button opening a modal/popup
- Export buttons: "Export Monthly Summary" and "Export by Company"

**Acceptance Criteria:**
- Table loads within 2 seconds for up to 1000 activities
- Filters can be combined (e.g., company + date range + status)
- Export generates .xlsx file matching filtered table view

### FR2: Activity Entry Modal
**Trigger:** Click "Add Activity" button on Activities page or task detail page

**Required Fields:**
- **Task**: Dropdown to select task (pre-filtered by eligible statuses)
- **Company/Client**: Auto-populated from selected task, editable
- **Activity Type**: Free text with suggestions (Development, Testing, Meeting, Documentation, Support, Review, Deployment)
- **Activity Note**: Textarea for detailed description
- **Date Range**: Start date/time and End date/time pickers
- **Time Spent**: Auto-calculated from date range, manually editable (decimal hours: 1.5, 2.0, etc.)

**Validation Rules:**
- Task must have status: IN_PROGRESS, IN_TESTING, or COMPLETED
- End date/time must be after start date/time
- Time spent must be > 0

**Acceptance Criteria:**
- Modal opens within 300ms
- Activity type suggestions appear as user types
- Time auto-calculates when dates change
- Form submits in < 1 second
- Success toast appears on save

### FR3: Task Detail Page Integration
**Location:** `/tasks/[id]`

**Requirements:**
- Add "Log Activity" button in task detail page (near status change actions)
- Opens same modal as FR2 with task pre-populated
- Show recent activities for this task (inline or tab)

**Acceptance Criteria:**
- Button only visible for tasks with eligible statuses
- Pre-populated task field is read-only in modal
- Recent activities show last 5 entries for this task

### FR4: Activity Data Model
**New Database Table:** `activities`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| task_id | uuid | Foreign key to tasks |
| user_id | uuid | Foreign key to users (who logged it) |
| client_id | uuid | Foreign key to clients (from task) |
| activity_type | text | Free text category |
| note | text | Activity description |
| start_time | timestamp | When activity started |
| end_time | timestamp | When activity ended |
| duration_hours | decimal | Time spent in hours (calculated) |
| created_at | timestamp | When activity was logged |
| updated_at | timestamp | Last modification |

**Indexes:**
- `(created_at DESC)` for listing
- `(task_id)` for task queries
- `(user_id, created_at)` for user activity history
- `(client_id, created_at)` for client reports

**Relationships:**
- `activities.task_id → tasks.id` (many-to-one)
- `activities.user_id → users.id` (many-to-one)
- `activities.client_id → clients.id` (many-to-one)

### FR5: API Endpoints

**Base Path:** `/api/activities`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/activities` | List activities with filters | All users |
| POST | `/api/activities` | Create new activity | All users |
| GET | `/api/activities/[id]` | Get single activity | All users |
| PATCH | `/api/activities/[id]` | Update activity | Creator + Admin |
| DELETE | `/api/activities/[id]` | Delete activity | Creator + Admin |
| GET | `/api/activities/export/monthly` | Export monthly summary (.xlsx) | All users |
| GET | `/api/activities/export/company` | Export by company (.xlsx) | All users |
| POST | `/api/activities/suggestions` | Get activity type suggestions | All users |

**Query Parameters (GET /api/activities):**
- `start_date`: ISO date string
- `end_date`: ISO date string
- `client_id`: UUID filter
- `task_status`: Status filter (IN_PROGRESS, IN_TESTING, COMPLETED)
- `user_id`: UUID filter
- `month`: YYYY-MM format for monthly view

### FR6: Excel Export
**Format:** `.xlsx` using `exceljs` or `xlsx` library

**Export Types:**

1. **Monthly Summary:**
   - All activities for selected month
   - Grouped by company
   - Subtotals per company
   - Grand total at bottom

2. **Company Breakdown:**
   - Single company or all companies (separate sheets)
   - Columns: Date, User, Task, Activity Type, Note, Hours

**Columns in Export:**
| Column | Header | Format |
|--------|--------|--------|
| Date | "Tarih" | DD.MM.YYYY |
| User | "Kullanıcı" | Name |
| Company | "Müşteri" | Client name |
| Task | "İş" | Task title |
| Activity Type | "Aktivite Tipi" | Free text |
| Note | "Not" | Activity note |
| Hours | "Saat" | Decimal (1.5) |
| Start Time | "Başlangıç" | DD.MM.YYYY HH:mm |
| End Time | "Bitiş" | DD.MM.YYYY HH:mm |

**Acceptance Criteria:**
- Export generates in < 5 seconds for 1000 activities
- File named: `Activities_YYYYMM.xlsx` or `Activities_[ClientName]_YYYYMM.xlsx`
- Turkish headers
- Auto-fit column widths

---

## Non-Functional Requirements

### NFR1: Performance
- Activity list loads < 2 seconds (1000 records)
- Modal opens < 300ms
- Export generates < 5 seconds (1000 records)
- Filter/sort response < 500ms

### NFR2: Usability
- Maximum 3 clicks to add an activity
- Keyboard shortcuts (Ctrl+N for new activity)
- Mobile-responsive table (horizontal scroll)
- Consistent with existing UI (Tailwind, component patterns)

### NFR3: Security
- All endpoints require authentication
- Users can only edit/delete their own activities (except ADMIN)
- Audit trail: created_at, updated_at tracked
- SQL injection prevention (Supabase query builder)

### NFR4: Scalability
- Support 10,000+ activities per month
- Database indexes for common queries
- Pagination for large datasets (50 per page)
- Efficient date range queries

---

## UI/UX Design

### Page Layout: Activities Page

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: Aktiviteler                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Filters                                                      │ │
│  │ [Date Range] [Company ▼] [User ▼] [Status ▼] [Reset]       │ │
│  │                                                              │ │
│  │ View: [Table] [Monthly Calendar]                            │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ [+ Yeni Aktivite]  [Export Monthly]  [Export by Company]   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Activity Table                                               │ │
│  │ ┌──────┬─────────┬─────────┬──────┬─────────┬──────┬──────┐│ │
│  │ │Tarih │Kullanıcı│Müşteri │ İş  │Tip     │Not   │Saat  ││ │
│  │ ├──────┼─────────┼─────────┼──────┼─────────┼──────┼──────┤│ │
│  │ │08.01 │Ahmet    │ABC Şti │Task1│Dev     │Fix..│ 2.5  ││ │
│  │ │08.01 │Ayşe     │XYZ Ltd │Task2│Test    │Check│ 1.0  ││ │
│  │ └──────┴─────────┴─────────┴──────┴─────────┴──────┴──────┘│ │
│  │                    [Pagination 1/20]                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Activity Entry Modal

```
┌──────────────────────────────────────────────┐
│  Yeni Aktivite                     [×]        │
├──────────────────────────────────────────────┤
│                                              │
│  Task                  [Search Task...   ▼]  │
│  Company               [Auto-filled       ]  │
│                                              │
│  Activity Type         [Development     ▼]  │
│                        (or type custom...)   │
│                                              │
│  Activity Note                                │
│  ┌────────────────────────────────────────┐  │
│  │ Fixed bug in login module...           │  │
│  │                                        │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Start Time    [08.01.2025]  [09:00]        │
│  End Time      [08.01.2025]  [11:30]        │
│                                              │
│  Time Spent    [2.5] hours                  │
│                                              │
│  ┌──────────┐  ┌──────────┐                │
│  │  Cancel  │  │  Save    │                │
│  └──────────┘  └──────────┘                │
└──────────────────────────────────────────────┘
```

### Visual Design Guidelines

**Color Palette (consistent with existing):**
| Element | Color | Tailwind |
|---------|-------|----------|
| Primary Button | Blue | `bg-blue-600` |
| Export Button | Green | `bg-green-600` |
| Table Header | Gray | `bg-gray-100` |
| Table Row (hover) | Light Blue | `hover:bg-blue-50` |
| Modal Overlay | Transparent | `bg-black/50` |

**Typography:**
- Page Headers: `text-2xl font-bold`
- Table Headers: `text-sm font-semibold`
- Table Cells: `text-sm text-gray-600`
- Form Labels: `text-sm font-medium`

---

## Technical Architecture

### Database Schema Changes

**New Table: `activities`**
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id),
  activity_type TEXT NOT NULL,
  note TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_hours DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX idx_activities_task_id ON activities(task_id);
CREATE INDEX idx_activities_user_id ON activities(user_id, created_at DESC);
CREATE INDEX idx_activities_client_id ON activities(client_id, created_at DESC);
CREATE INDEX idx_activities_date_range ON activities(start_time, end_time);
```

**Updated Types:**
```typescript
// src/types/index.ts
export interface Activity {
  id: string;
  task_id: string;
  user_id: string;
  client_id: string;
  activity_type: string;
  note: string;
  start_time: Date;
  end_time: Date;
  duration_hours: number;
  created_at: Date;
  updated_at: Date;
  task?: Task;
  user?: User;
  client?: Client;
}
```

### API Route Structure

```
src/app/api/activities/
├── route.ts                    # GET (list), POST (create)
├── [id]/
│   └── route.ts                # GET, PATCH, DELETE
├── export/
│   ├── monthly/
│   │   └── route.ts            # GET - Monthly export
│   └── company/
│       └── route.ts            # GET - Company export
└── suggestions/
    └── route.ts                # POST - Activity type suggestions
```

### New Components

```
src/components/
├── ActivityForm.tsx            # Activity entry modal
├── ActivityTable.tsx           # Filterable/sortable table
├── MonthlyView.tsx             # Calendar/month view
└── ExportButton.tsx            # Export dropdown
```

### New Pages

```
src/app/activities/
├── page.tsx                    # Main activities page
└── [id]/
    └── page.tsx                # Activity detail (optional)
```

### Dependencies to Add

```json
{
  "dependencies": {
    "exceljs": "^4.4.0",           // Excel export
    "date-fns": "^3.0.0"            // Date utilities (if not already)
  },
  "devDependencies": {
    "@types/exceljs": "^4.3.0"
  }
}
```

---

## User Flows

### UF1: Log Activity from Activities Page

```
1. User navigates to /activities
2. User clicks "[+ Yeni Aktivite]" button
3. Modal opens with empty form
4. User selects task (filtered by eligible statuses)
5. Client auto-populates (editable)
6. User types/selects activity type
7. User enters activity note
8. User sets start/end date-time (defaults to today)
9. System auto-calculates duration
10. User adjusts duration if needed (optional)
11. User clicks "Save"
12. Activity saved, modal closes, success toast shows
13. Table refreshes showing new activity
```

### UF2: Log Activity from Task Detail

```
1. User viewing task detail page
2. User clicks "Log Activity" button
3. Modal opens with task pre-populated (read-only)
4. User completes remaining fields
5. User clicks "Save"
6. Activity saved, modal closes
7. Recent activities list updates (if visible)
```

### UF3: Export Monthly Report

```
1. User navigates to /activities
2. User sets date filter to current month
3. User clicks "Export Monthly" button
4. System generates Excel file
5. Browser downloads file: Activities_202501.xlsx
6. User opens file in Excel
7. File shows all activities grouped by company
```

### UF4: Filter and Review

```
1. User navigates to /activities
2. User selects company "ABC Şti"
3. User selects date range "01.01.2025 - 31.01.2025"
4. User selects status "COMPLETED"
5. Table filters to show matching activities
6. User reviews data in table
7. User sorts by "Hours" (descending)
8. User exports filtered results
```

---

## Implementation Phases

### Phase 1: MVP (Core Functionality)
**Duration:** 1-2 weeks

**Deliverables:**
- Database schema for `activities` table
- Basic API endpoints (GET list, POST create, GET single, PATCH, DELETE)
- Activity entry modal (accessible from Activities page only)
- Basic ActivityTable component (no filters/sort initially)
- Navigation link in Header

**Acceptance Criteria:**
- Users can add activities via modal
- Activities display in table
- CRUD operations work correctly
- Auth/authorization enforced

### Phase 2: Enhanced UI/UX
**Duration:** 1 week

**Deliverables:**
- Filtering (date, company, user, status)
- Sorting (all columns)
- Pagination
- Activity type suggestions
- Task detail page integration
- Recent activities on task detail

**Acceptance Criteria:**
- All filters work independently and combined
- Sort indicators visible on table headers
- Pagination handles 1000+ records
- Activity modal accessible from task detail

### Phase 3: Export & Reporting
**Duration:** 1 week

**Deliverables:**
- Excel export functionality
- Monthly summary export
- Company breakdown export
- Export matches filtered table view

**Acceptance Criteria:**
- Exports generate correctly formatted .xlsx files
- Turkish headers
- All columns included
- < 5 second generation time

### Phase 4: Polish & Enhancements
**Duration:** 3-5 days

**Deliverables:**
- Monthly calendar view
- Keyboard shortcuts
- Activity analytics dashboard (optional)
- Performance optimizations
- Loading states and error handling
- Unit tests for critical paths

**Acceptance Criteria:**
- Calendar view shows daily activity summaries
- Ctrl+N opens activity modal
- Page load time < 2 seconds
- No console errors
- 80%+ code coverage on new features

---

## Success Metrics

### KPIs
| Metric | Target | Measurement |
|--------|--------|-------------|
| Adoption | 80% of users log activities within 30 days | DB query: distinct users / total users |
| Data Quality | < 5% activities with empty notes | DB query: count where note is null/empty |
| Usage Frequency | Average 5+ activities per user per week | DB query: avg activities per user per week |
| Export Usage | 50% of assigners/admins use export monthly | Export endpoint tracking |
| Performance | P95 page load < 2 seconds | APM/metrics |

---

## Open Questions

1. **Activity Approval Workflow:** Should activities require approval before being final? (Deferred to Phase 4)
2. **Billable vs Non-billable:** Should we track billable status? (Can be added as flag later)
3. **Activity Templates:** Should we save common activity descriptions as templates? (Deferred to Phase 4)
4. **Time Rounding:** Should hours round to nearest 0.25 (15-min increments)? (To be decided)
5. **Bulk Edit:** Should admins be able to bulk edit activities? (Deferred to Phase 4)

---

## Appendix

### A. Task Status Eligibility
Only tasks with these statuses can have activities logged:
- `IN_PROGRESS` - "Geliştirme Aşamasında"
- `IN_TESTING` - "Teste Verilenler"
- `COMPLETED` - "Tamamlananlar"

### B. Activity Type Suggestions (Default List)
```
Development
Testing
Meeting
Documentation
Support
Review
Deployment
Analysis
Bug Fix
Code Review
Research
```

### C. Mockup References
See design mockups in `/docs/designs/activity-tracking/` (to be created)

---

**Document Status:** Ready for Review
**Next Steps:** Stakeholder approval → Technical design → Implementation start
