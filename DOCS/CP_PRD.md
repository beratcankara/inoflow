# Product Requirements Document (PRD)
# Activity Tracking System for InoFlow

**Document Version:** 1.0  
**Created:** 2026-01-08  
**Status:** Ready for Implementation  
**Owner:** Product Team  
**Contributors:** Engineering, Design  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Objectives](#3-goals--objectives)
4. [User Personas](#4-user-personas)
5. [User Stories](#5-user-stories)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [User Experience & Interface](#8-user-experience--interface)
9. [Data Model & Schema](#9-data-model--schema)
10. [Security & Permissions](#10-security--permissions)
11. [Success Metrics](#11-success-metrics)
12. [Implementation Phases](#12-implementation-phases)
13. [Risks & Mitigation](#13-risks--mitigation)
14. [Out of Scope](#14-out-of-scope)
15. [Appendix](#15-appendix)

---

## 1. Executive Summary

### 1.1 Overview
The Activity Tracking System is a new feature for InoFlow that enables users to log, track, and report time spent on SAP ABAP tasks. This feature extends the existing task management workflow without disrupting current operations.

### 1.2 Business Value
- **Internal Time Tracking**: Monitor team productivity and resource allocation
- **Client Billing**: Generate accurate, detailed time reports for client invoicing
- **Transparency**: Provide visibility into work effort across projects and companies
- **Compliance**: Maintain auditable records of work activities

### 1.3 Key Features
- ⚡ **Quick Activity Logging** (< 10 seconds per entry)
- 📊 **Flexible Filtering** (Client, System, Date, User)
- 📥 **Excel Export** with customizable date ranges
- 🔒 **Role-Based Access Control** (WORKER, ASSIGNER, ADMIN)
- 📱 **Responsive Design** (Desktop, Tablet, Mobile)

### 1.4 Target Users
- **Workers** (WORKER role): Log and view own activities
- **Assigners** (ASSIGNER role): Monitor team activities, generate reports
- **Administrators** (ADMIN role): Full visibility and control

---

## 2. Problem Statement

### 2.1 Current State
InoFlow currently tracks task status and completion but lacks:
- Detailed time tracking capabilities
- Granular activity logging per task
- Exportable time reports for billing
- Visibility into work effort distribution

### 2.2 Pain Points
1. **For Workers**: No centralized place to log time spent on tasks
2. **For Assigners**: Cannot track team productivity or generate billing reports
3. **For Clients**: No detailed breakdown of work hours for invoicing
4. **For Management**: Limited visibility into resource utilization

### 2.3 Opportunity
By adding activity tracking, InoFlow becomes a complete project management and time tracking solution, reducing the need for external time tracking tools.

---

## 3. Goals & Objectives

### 3.1 Primary Goals
1. **Enable accurate time tracking** for all tasks in development, testing, and completion
2. **Streamline client billing** with exportable, detailed activity reports
3. **Improve productivity visibility** for team leads and management
4. **Maintain workflow continuity** without disrupting existing task management

### 3.2 Success Criteria
- ✅ Users can log an activity in **< 10 seconds**
- ✅ Activities page loads in **< 1 second** (with 500+ activities)
- ✅ Export generates in **< 3 seconds** (for 1000 activities)
- ✅ **100% RBAC compliance** (no unauthorized data access)
- ✅ **Zero breaking changes** to existing task workflows
- ✅ **90%+ user adoption** within 2 weeks of launch

### 3.3 Key Performance Indicators (KPIs)
- Daily active users logging activities
- Average activities per user per day
- Export frequency (reports generated per week)
- Time saved vs. manual tracking (target: 70% reduction)

---

## 4. User Personas

### 4.1 Persona: Deniz (SAP ABAP Developer - WORKER)
**Role:** Worker  
**Age:** 28  
**Experience:** 3 years in SAP ABAP  

**Goals:**
- Log time spent on tasks accurately
- Track own productivity
- Provide detailed work notes for team reference

**Pain Points:**
- Forgets to log time at end of day
- Struggles with manual time tracking in spreadsheets
- Needs quick way to record activities during work

**Needs:**
- Fast activity logging (no more than 3 clicks)
- Ability to log activities for recently completed work
- View own time breakdown by client

---

### 4.2 Persona: Ayşe (Project Manager - ASSIGNER)
**Role:** Assigner  
**Age:** 35  
**Experience:** 8 years managing SAP projects  

**Goals:**
- Monitor team workload and productivity
- Generate accurate billing reports for clients
- Identify resource bottlenecks

**Pain Points:**
- Spends hours compiling time reports manually
- Cannot see real-time team activity
- Difficult to track time per client/system

**Needs:**
- Comprehensive view of all team activities
- Flexible filtering by client, system, date, worker
- One-click export to Excel for client invoicing

---

### 4.3 Persona: Mehmet (System Administrator - ADMIN)
**Role:** Admin  
**Age:** 42  
**Experience:** 12 years in SAP consulting firm management  

**Goals:**
- Maintain data integrity and security
- Ensure compliance with time tracking policies
- Generate company-wide productivity reports

**Pain Points:**
- Limited visibility into historical activity data
- Cannot audit or correct erroneous time entries
- Needs consolidated reports across all clients

**Needs:**
- Full administrative access to all activities
- Advanced filtering and export capabilities
- Data validation and integrity checks

---

## 5. User Stories

### 5.1 Epic: Activity Logging

#### Story 1.1: Quick Add Activity
**As a** WORKER  
**I want to** log an activity for a task in under 10 seconds  
**So that** I can track my time without disrupting my workflow  

**Acceptance Criteria:**
- Given I am on any page in InoFlow
- When I click the "Log Activity" floating button
- Then a modal opens with today's date pre-filled
- And I can search/select a task
- And the company is auto-filled from the selected task
- And I can enter time in flexible formats (2.5h, 2h 30m, 150m)
- And I can enter a note describing the activity
- And I can save with Ctrl+Enter
- And the modal closes with a success toast

**Priority:** P0 (Must Have)

---

#### Story 1.2: Edit Recent Activity
**As a** WORKER  
**I want to** edit activities from the last 15 days  
**So that** I can correct mistakes or add details  

**Acceptance Criteria:**
- Given I am on the Activities page
- When I view an activity from the last 15 days
- Then I can click to edit inline
- And update time spent or note
- And save changes
- But activities older than 15 days are read-only with a tooltip explaining the limit

**Priority:** P0 (Must Have)

---

#### Story 1.3: Warn on Task Status
**As a** WORKER  
**I want to** be warned when logging activity for tasks not in development/testing/completed  
**So that** I am aware of potential issues but can still proceed if needed  

**Acceptance Criteria:**
- Given I select a task with status NOT_STARTED or NEW_STARTED
- When I proceed to log activity
- Then I see a warning badge: "⚠️ Task not yet started"
- But I can still save the activity

**Priority:** P1 (Should Have)

---

### 5.2 Epic: Activity Viewing & Filtering

#### Story 2.1: View Own Activities
**As a** WORKER  
**I want to** view my activities for the last 30 days by default  
**So that** I can review recent work and ensure accurate logging  

**Acceptance Criteria:**
- Given I navigate to /activities
- Then I see activities from the last 30 days by default
- And summary cards show total hours and activity count
- And I can only see my own activities

**Priority:** P0 (Must Have)

---

#### Story 2.2: Filter by Client and System
**As a** ASSIGNER  
**I want to** filter activities by client, system, and date range  
**So that** I can analyze time spent per project  

**Acceptance Criteria:**
- Given I am on the Activities page
- When I select a client filter
- Then only activities for that client are shown
- And I can further filter by system within that client
- And I can select a custom date range
- And summary cards update to reflect filtered data

**Priority:** P0 (Must Have)

---

#### Story 2.3: View Team Activities
**As an** ASSIGNER  
**I want to** view activities for individual workers or all workers  
**So that** I can monitor team productivity  

**Acceptance Criteria:**
- Given I am an ASSIGNER
- When I open the Activities page
- Then I see a user filter dropdown
- And I can select "All Workers" or a specific worker
- And the table updates to show selected user(s) activities
- And summary cards show aggregated data

**Priority:** P0 (Must Have)

---

### 5.3 Epic: Activity Export

#### Story 3.1: Export Activities to Excel
**As an** ASSIGNER  
**I want to** export activities to Excel with selected filters  
**So that** I can generate client invoices and internal reports  

**Acceptance Criteria:**
- Given I have applied filters (client, system, date range, user)
- When I click "Export to Excel"
- Then a download starts with a .xlsx file
- And the file contains columns: Date, Client, System, Activity Duration, Activity Description
- And only filtered activities are included
- And the file name includes the date range (e.g., "Activities_2026-01-01_2026-01-31.xlsx")

**Priority:** P0 (Must Have)

---

#### Story 3.2: Export All Workers for Client
**As an** ASSIGNER  
**I want to** export all workers' activities for a specific client  
**So that** I can provide consolidated billing reports  

**Acceptance Criteria:**
- Given I filter by a specific client
- When I select "All Workers" in the user filter
- And I click "Export to Excel"
- Then the export includes activities from all workers for that client
- And rows are grouped/sorted by worker name
- And subtotals are calculated per worker

**Priority:** P1 (Should Have)

---

### 5.4 Epic: Administration

#### Story 4.1: Delete Own Activities
**As a** WORKER  
**I want to** delete my own activities from the last 15 days  
**So that** I can remove erroneous entries  

**Acceptance Criteria:**
- Given I am viewing my own activity from the last 15 days
- When I click the delete icon
- Then a confirmation modal appears
- And upon confirmation, the activity is permanently deleted
- And a success toast appears

**Priority:** P1 (Should Have)

---

#### Story 4.2: Admin Full Access
**As an** ADMIN  
**I want to** view, edit, and delete any activity without time restrictions  
**So that** I can maintain data integrity  

**Acceptance Criteria:**
- Given I am an ADMIN
- When I access the Activities page
- Then I can view all users' activities
- And I can edit any activity regardless of age
- And I can delete any activity with confirmation

**Priority:** P1 (Should Have)

---

## 6. Functional Requirements

### 6.1 Activity Logging

#### FR-1.1: Task Status Validation
- **Requirement**: System SHALL warn users when logging activities for tasks with status `NOT_STARTED` or `NEW_STARTED`
- **Behavior**: Warning badge displayed, but activity creation is NOT blocked
- **Rationale**: Flexibility for edge cases (e.g., pre-work, planning)

#### FR-1.2: Date Constraints
- **Requirement**: System SHALL allow logging activities for:
  - **Past dates**: Up to 15 days in the past from current date
  - **Current date**: Today
  - **Future dates**: NOT allowed (blocked)
- **Behavior**: Date picker disables future dates and dates beyond 15 days ago
- **Error Message**: "Activities can only be logged for the last 15 days"

#### FR-1.3: Time Input Flexibility
- **Requirement**: System SHALL accept time input in multiple formats:
  - Decimal hours: `2.5`, `0.75`, `8.25`
  - Hours and minutes: `2h 30m`, `1h`, `45m`
  - Colon format: `2:30`, `1:00`
  - Minutes only: `150m`, `90m`
- **Conversion**: All formats converted to integer minutes for storage

#### FR-1.4: Auto-Fill Company
- **Requirement**: System SHALL automatically populate company field when user selects a task
- **Behavior**: Company field becomes read-only after auto-fill
- **Source**: Derived from `tasks.client_id`

#### FR-1.5: Recent Tasks Priority
- **Requirement**: Task search dropdown SHALL prioritize:
  1. Tasks user logged activities for in last 7 days
  2. Tasks assigned to user with status IN_PROGRESS or IN_TESTING
  3. All other assigned tasks (alphabetical)

---

### 6.2 Activity Viewing

#### FR-2.1: Default View
- **Requirement**: Activities page SHALL display activities from the **last 30 days** by default
- **Behavior**: Date filter pre-set to `[today - 30 days, today]`
- **User Control**: Date range immediately changeable via date picker

#### FR-2.2: Role-Based Visibility
- **Requirement**: Activity visibility SHALL be restricted by role:
  - **WORKER**: Only own activities
  - **ASSIGNER**: All workers' activities
  - **ADMIN**: All activities (unrestricted)

#### FR-2.3: Filtering Capabilities
- **Requirement**: System SHALL support filtering by:
  - **Client** (dropdown, single select)
  - **System** (dropdown, single select, dependent on client)
  - **Date Range** (date picker, from/to)
  - **User** (dropdown, ASSIGNER/ADMIN only)
  - **Task Status** (dropdown, multi-select)

#### FR-2.4: Sorting
- **Requirement**: Table SHALL support sorting by:
  - Date (ascending/descending) - **default: descending**
  - Time spent (ascending/descending)
  - Created at (ascending/descending)
- **Behavior**: Click column header to toggle sort order

#### FR-2.5: Pagination
- **Requirement**: Table SHALL paginate results:
  - Default: 50 rows per page
  - Options: 25, 50, 100, 200
  - Server-side pagination for performance

---

### 6.3 Activity Editing

#### FR-3.1: Edit Time Window
- **Requirement**: Activities SHALL be editable only within **15 days** of creation
- **Behavior**: 
  - Activities ≤ 15 days old: Editable (inline or modal)
  - Activities > 15 days old: Read-only with tooltip "Cannot edit activities older than 15 days"
- **Exception**: ADMIN role can edit any activity regardless of age

#### FR-3.2: Inline Editing
- **Requirement**: Clicking an editable activity row SHALL enable inline editing
- **Editable Fields**: 
  - Time spent (minutes)
  - Activity note
- **Read-Only Fields**:
  - Date
  - Task
  - Company
  - User
- **Save Behavior**: Auto-save on blur or Ctrl+Enter

#### FR-3.3: Edit Validation
- **Requirement**: System SHALL validate edits:
  - Time spent: > 0 minutes, < 1440 minutes (24 hours)
  - Note: Not empty, max 2000 characters
- **Error Display**: Inline validation errors with red border + message

---

### 6.4 Activity Deletion

#### FR-4.1: Delete Time Window
- **Requirement**: Activities SHALL be deletable only within **15 days** of creation
- **Exception**: ADMIN role can delete any activity

#### FR-4.2: Delete Confirmation
- **Requirement**: System SHALL require confirmation before deletion
- **Modal Content**:
  - Title: "Delete Activity"
  - Message: "Are you sure you want to delete this activity? This action cannot be undone."
  - Buttons: "Cancel" (default), "Delete" (red, destructive)

#### FR-4.3: Delete Feedback
- **Requirement**: Upon successful deletion:
  - Activity removed from table immediately
  - Toast notification: "Activity deleted successfully"
  - Summary cards updated

---

### 6.5 Activity Export

#### FR-5.1: Export Format
- **Requirement**: System SHALL export activities as Excel (.xlsx) files
- **Columns** (in order):
  1. Date (DD/MM/YYYY format)
  2. Client
  3. System
  4. Activity Duration (formatted as "2h 30m")
  5. Activity Description (note content)

#### FR-5.2: Export Filtering
- **Requirement**: Export SHALL reflect currently applied filters
- **Behavior**: 
  - User applies filters (client, system, date, user)
  - Export includes only filtered activities
  - Export file name includes filter summary (e.g., "Activities_ACME_2026-01.xlsx")

#### FR-5.3: Export Date Range Selection
- **Requirement**: System SHALL allow selecting custom date range before export
- **UI**: Export modal with date range picker
- **Default**: Current filter date range

#### FR-5.4: Export Grouping (ASSIGNER)
- **Requirement**: When exporting activities for multiple workers for a client:
  - Group rows by worker name
  - Add subtotal row per worker
  - Add grand total at bottom
- **Example**:
```
Date       | Client | System | Duration | Description
---------- | ------ | ------ | -------- | -----------
Worker: Deniz Yılmaz
08/01/2026 | ACME   | FI     | 2h 30m   | Fixed bug
07/01/2026 | ACME   | SD     | 1h       | Code review
SUBTOTAL: 3h 30m

Worker: Ayşe Kara
08/01/2026 | ACME   | MM     | 4h       | Development
SUBTOTAL: 4h

TOTAL: 7h 30m
```

#### FR-5.5: Export Performance
- **Requirement**: Export SHALL generate within **3 seconds** for up to 1000 activities
- **Behavior**: Loading spinner during generation
- **Error Handling**: If export fails, show error toast with retry option

---

### 6.6 Summary Cards

#### FR-6.1: Total Hours Card
- **Requirement**: Display sum of all activity durations in current view
- **Format**: `156.5h` (decimal hours, 1 decimal place)
- **Update**: Real-time when filters change

#### FR-6.2: Activity Count Card
- **Requirement**: Display count of activities in current view
- **Format**: `87 activities`

#### FR-6.3: Company Count Card
- **Requirement**: Display unique client count in current view
- **Format**: `5 companies`

---

### 6.7 Integration Points

#### FR-7.1: Task Detail Page Integration
- **Requirement**: Task detail page (`/tasks/[id]`) SHALL display:
  - Total time logged for that task (e.g., "12h 30m logged")
  - "Log Activity" button (opens quick-add modal with task pre-selected)
  - Recent activities list (last 5 activities for this task)

#### FR-7.2: Navigation Integration
- **Requirement**: Main navigation header SHALL include "Aktiviteler" link
- **Position**: Between "İşler" and "Müşteriler"
- **Active State**: Highlighted when on /activities route

---

## 7. Non-Functional Requirements

### 7.1 Performance

#### NFR-1.1: Page Load Time
- **Requirement**: Activities page SHALL load in **< 1 second** (p95)
- **Conditions**: 500 activities, 5 clients, 10 systems
- **Measurement**: Time to interactive (TTI)

#### NFR-1.2: API Response Time
- **Requirement**: Activity API endpoints SHALL respond in **< 500ms** (p95)
- **Endpoints**: GET /api/activities, POST /api/activities

#### NFR-1.3: Export Generation Time
- **Requirement**: Excel export SHALL generate in **< 3 seconds**
- **Conditions**: 1000 activities, full data

#### NFR-1.4: Real-time Updates
- **Requirement**: Summary cards SHALL update within **200ms** of filter change
- **Behavior**: Optimistic UI updates

---

### 7.2 Scalability

#### NFR-2.1: Data Volume
- **Requirement**: System SHALL support:
  - 10,000+ activities per user per year
  - 100+ concurrent users
  - 50+ clients
- **Database**: PostgreSQL with proper indexing

#### NFR-2.2: Pagination
- **Requirement**: Table SHALL handle 10,000+ rows via server-side pagination
- **Client-side rendering**: Max 200 rows at once

---

### 7.3 Usability

#### NFR-3.1: Activity Logging Speed
- **Requirement**: Users SHALL be able to log an activity in **< 10 seconds**
- **Measurement**: From button click to saved confirmation

#### NFR-3.2: Mobile Responsiveness
- **Requirement**: Activities page SHALL be fully functional on:
  - Mobile (320px - 767px)
  - Tablet (768px - 1023px)
  - Desktop (1024px+)

#### NFR-3.3: Keyboard Shortcuts
- **Requirement**: System SHALL support:
  - `Ctrl+L`: Open quick-add modal
  - `Ctrl+Enter`: Save activity
  - `Esc`: Close modal
  - `Tab`: Navigate form fields

---

### 7.4 Accessibility

#### NFR-4.1: WCAG Compliance
- **Requirement**: Activities page SHALL meet WCAG 2.1 Level AA
- **Specifics**:
  - Keyboard navigable
  - Screen reader compatible
  - Color contrast ratio ≥ 4.5:1

---

### 7.5 Browser Support

#### NFR-5.1: Supported Browsers
- **Requirement**: System SHALL support:
  - Chrome 90+ ✅
  - Firefox 88+ ✅
  - Safari 14+ ✅
  - Edge 90+ ✅

---

### 7.6 Data Integrity

#### NFR-6.1: Audit Trail
- **Requirement**: System SHALL log:
  - Activity creation (who, when)
  - Activity updates (who, what changed, when)
  - Activity deletion (who, when)
- **Storage**: Append-only audit log table

#### NFR-6.2: Data Validation
- **Requirement**: System SHALL enforce:
  - Foreign key integrity (task_id, user_id, client_id)
  - Check constraints (time_spent_minutes > 0 AND <= 1440)
  - Date constraints (activity_date <= today AND >= today - 15 days)

---

## 8. User Experience & Interface

### 8.1 Page Layout

#### Activities Page (`/activities`)

```
┌─────────────────────────────────────────────────────────────┐
│  Header (existing component)                                 │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Aktiviteler (Activities)                                    │
│  Track and export time spent on tasks                        │
│                                                               │
│  [Last 30 days ▼] [Client: All ▼] [System: All ▼] [+ Log]  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Summary Cards                                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ Total Hours  │ │  Activities  │ │  Companies   │        │
│  │    156.5h    │ │      87      │ │      5       │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  [Search] [Filter ▼] [Sort ▼] [Export to Excel]            │
│                                                               │
│  ┌──────┬─────────┬────────┬─────────┬───────┬──────────┐  │
│  │ Date │ Task    │ Client │ System  │ Time  │ Note     │  │
│  ├──────┼─────────┼────────┼─────────┼───────┼──────────┤  │
│  │ 08   │ AP-012  │ ACME   │ FI      │ 2h30m │ Fixed... │  │
│  │ Jan  │         │        │         │       │          │  │
│  ├──────┼─────────┼────────┼─────────┼───────┼──────────┤  │
│  │ 07   │ SD-045  │ Beta   │ SD      │ 1h    │ Code...  │  │
│  │ Jan  │         │        │         │       │          │  │
│  └──────┴─────────┴────────┴─────────┴───────┴──────────┘  │
│                                                               │
│  Showing 1-50 of 87  [Previous] [1] [2] [Next]              │
└─────────────────────────────────────────────────────────────┘

[🎯 Floating Action Button: "+" (bottom-right, fixed)]
```

---

### 8.2 Quick Add Activity Modal

```
┌───────────────────────────────────────────────────┐
│  Log Activity                               [×]   │
├───────────────────────────────────────────────────┤
│                                                   │
│  Date *                                           │
│  [08 Jan 2026 ▼]              ← max 15 days ago  │
│                                                   │
│  Task *                                           │
│  [Search tasks...]                                │
│   Recent:                                         │
│   ● AP-012: Fix payment module (ACME)            │
│   ● FI-089: Debug report (Beta) ⚠️ Not Started   │
│                                                   │
│  Company                                          │
│  ACME Corp                    ← auto-filled      │
│                                                   │
│  Time Spent *                                     │
│  [2h 30m]                                         │
│  Formats: 2.5h, 2h 30m, 150m, 2:30               │
│                                                   │
│  Activity Note *                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │ Fixed payment posting issue with vendor...  │ │
│  │                                              │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌──────────┐  ┌────────────────────────────┐   │
│  │  Cancel  │  │  Save (Ctrl+Enter) ✓       │   │
│  └──────────┘  └────────────────────────────┘   │
│                                                   │
│  □ Keep modal open after saving                  │
└───────────────────────────────────────────────────┘
```

---

### 8.3 Export Modal

```
┌───────────────────────────────────────────────────┐
│  Export Activities to Excel                 [×]   │
├───────────────────────────────────────────────────┤
│                                                   │
│  Date Range *                                     │
│  [01 Jan 2026] to [31 Jan 2026]                  │
│                                                   │
│  Filters Applied:                                 │
│  ✓ Client: ACME Corp                             │
│  ✓ System: FI (Financial Accounting)             │
│  ✓ User: All Workers (3 users)                   │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │  Preview                                    │ │
│  │  • Total Activities: 87                     │ │
│  │  • Total Hours: 156.5h                      │ │
│  │  • Workers: 3                               │ │
│  │  • Date Range: 01 Jan - 31 Jan 2026         │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  File Name:                                       │
│  Activities_ACME_FI_2026-01.xlsx                 │
│                                                   │
│  Format:                                          │
│  □ Group by worker (with subtotals)              │
│                                                   │
│  ┌──────────┐  ┌────────────────────────────┐   │
│  │  Cancel  │  │  Download Excel            │   │
│  └──────────┘  └────────────────────────────┘   │
└───────────────────────────────────────────────────┘
```

---

### 8.4 Design Specifications

#### Color Palette
```typescript
const colors = {
  // Existing InoFlow colors (maintain consistency)
  primary: 'blue-600',
  secondary: 'gray-600',
  success: 'green-600',
  warning: 'orange-600',
  error: 'red-600',
  
  // Activity-specific
  activityCard: 'white',
  tableBorder: 'gray-200',
  tableHover: 'blue-50',
  
  // Time badges
  lowTime: 'blue-100',      // < 2 hours
  mediumTime: 'yellow-100', // 2-4 hours
  highTime: 'orange-100',   // 4-8 hours
};
```

#### Typography
- **Page Title**: 3xl font, bold, gray-900
- **Section Headers**: xl font, semibold, gray-800
- **Table Headers**: sm font, medium, gray-600
- **Table Data**: sm font, regular, gray-900
- **Hints**: xs font, regular, gray-500

#### Spacing
- **Card Padding**: 24px (p-6)
- **Modal Padding**: 24px (p-6)
- **Table Row Height**: 56px
- **Button Height**: 40px (medium), 36px (small)

#### Responsive Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1023px
- **Desktop**: ≥ 1024px

---

### 8.5 Interactions & Animations

#### Hover States
- **Table Row**: Background changes to `blue-50`, slight scale (1.01)
- **Buttons**: Darken by 10%, slight scale (1.05)
- **Floating Action Button**: Scale (1.1), shadow increase

#### Click Feedback
- **Button Click**: Scale down (0.95), then bounce back
- **Save Success**: Green checkmark animation + toast slide-in

#### Loading States
- **Page Load**: Skeleton screens for table rows
- **Export**: Progress spinner with percentage
- **Save**: Button shows spinner, text changes to "Saving..."

#### Transitions
- **Modal Open**: Fade in (200ms) + scale up (0.95 → 1)
- **Toast**: Slide in from bottom (300ms)
- **Filter Apply**: Table fade out → update → fade in (150ms)

---

## 9. Data Model & Schema

### 9.1 Database Table: `activities`

```sql
CREATE TABLE activities (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  
  -- Activity Data
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  time_spent_minutes INTEGER NOT NULL 
    CHECK (time_spent_minutes > 0 AND time_spent_minutes <= 1440),
  note TEXT NOT NULL CHECK (length(note) > 0 AND length(note) <= 2000),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT activities_date_constraint CHECK (
    activity_date <= CURRENT_DATE AND 
    activity_date >= CURRENT_DATE - INTERVAL '15 days'
  )
);
```

### 9.2 Indexes

```sql
-- Performance indexes
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_task_id ON activities(task_id);
CREATE INDEX idx_activities_client_id ON activities(client_id);
CREATE INDEX idx_activities_date ON activities(activity_date DESC);

-- Composite indexes for common queries
CREATE INDEX idx_activities_user_date 
  ON activities(user_id, activity_date DESC);

CREATE INDEX idx_activities_client_date 
  ON activities(client_id, activity_date DESC);

CREATE INDEX idx_activities_composite 
  ON activities(user_id, client_id, activity_date DESC);
```

### 9.3 Database View: `activity_summary`

```sql
CREATE OR REPLACE VIEW activity_summary AS
SELECT 
  a.id,
  a.activity_date,
  a.time_spent_minutes,
  a.note,
  a.created_at,
  a.updated_at,
  
  -- Task
  jsonb_build_object(
    'id', t.id,
    'title', t.title,
    'status', t.status
  ) AS task,
  
  -- User
  jsonb_build_object(
    'id', u.id,
    'name', u.name
  ) AS user,
  
  -- Client
  jsonb_build_object(
    'id', c.id,
    'name', c.name
  ) AS client,
  
  -- System (nullable)
  jsonb_build_object(
    'id', s.id,
    'name', s.name
  ) AS system,
  
  -- Computed time fields
  ROUND(a.time_spent_minutes::NUMERIC / 60, 2) AS hours_decimal,
  (a.time_spent_minutes / 60)::INTEGER AS hours_whole,
  (a.time_spent_minutes % 60)::INTEGER AS minutes_remainder
  
FROM activities a
JOIN tasks t ON a.task_id = t.id
JOIN users u ON a.user_id = u.id
JOIN clients c ON a.client_id = c.id
LEFT JOIN systems s ON t.system_id = s.id;
```

### 9.4 Row-Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Policy 1: Workers can view only their own activities
CREATE POLICY "workers_view_own_activities"
ON activities FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()::text
  OR
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()::text 
    AND role IN ('ADMIN', 'ASSIGNER')
  )
);

-- Policy 2: Users can create activities for their own tasks
CREATE POLICY "users_create_activities"
ON activities FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()::text
  AND
  EXISTS (
    SELECT 1 FROM tasks 
    WHERE id = task_id 
    AND assigned_to = auth.uid()::text
  )
);

-- Policy 3: Users can update their own recent activities
CREATE POLICY "users_update_own_activities"
ON activities FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()::text
  AND
  (
    created_at >= NOW() - INTERVAL '15 days'
    OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role = 'ADMIN'
    )
  )
)
WITH CHECK (user_id = auth.uid()::text);

-- Policy 4: Users can delete their own recent activities
CREATE POLICY "users_delete_own_activities"
ON activities FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()::text
  AND
  (
    created_at >= NOW() - INTERVAL '15 days'
    OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role = 'ADMIN'
    )
  )
);
```

### 9.5 Triggers

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_activities_updated_at
BEFORE UPDATE ON activities
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

## 10. Security & Permissions

### 10.1 Role-Based Access Control (RBAC)

| Action | WORKER | ASSIGNER | ADMIN |
|--------|--------|----------|-------|
| **View own activities** | ✅ | ✅ | ✅ |
| **View team activities** | ❌ | ✅ | ✅ |
| **View all activities** | ❌ | ❌ | ✅ |
| **Create activity** | ✅ (own tasks) | ✅ (own tasks) | ✅ (any task) |
| **Edit own activity (< 15 days)** | ✅ | ✅ | ✅ |
| **Edit own activity (> 15 days)** | ❌ | ❌ | ✅ |
| **Edit other's activity** | ❌ | ❌ | ✅ |
| **Delete own activity (< 15 days)** | ✅ | ✅ | ✅ |
| **Delete own activity (> 15 days)** | ❌ | ❌ | ✅ |
| **Delete other's activity** | ❌ | ❌ | ✅ |
| **Export own activities** | ✅ | ✅ | ✅ |
| **Export team activities** | ❌ | ✅ | ✅ |
| **Export all activities** | ❌ | ❌ | ✅ |

### 10.2 API Authentication

#### All activity endpoints require authentication
```typescript
// Every API route must validate session
const session = await getServerSession(authOptions);
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

#### Role-based filtering
```typescript
// GET /api/activities
if (session.user.role === 'WORKER') {
  query = query.eq('user_id', session.user.id);
}
// ASSIGNER and ADMIN see all (with optional user filter)
```

### 10.3 Input Validation

#### Server-side validation (critical)
```typescript
// Validate time
if (time_spent_minutes <= 0 || time_spent_minutes > 1440) {
  return error('Time must be 1-1440 minutes');
}

// Validate date
const activityDate = new Date(activity_date);
const today = new Date();
const fifteenDaysAgo = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000);

if (activityDate > today || activityDate < fifteenDaysAgo) {
  return error('Date must be within last 15 days');
}

// Validate task ownership
const task = await getTask(task_id);
if (session.user.role === 'WORKER' && task.assigned_to !== session.user.id) {
  return error('Forbidden');
}
```

#### Client-side validation (UX)
- Real-time input validation
- Disabled date picker for invalid dates
- Format hints and examples

### 10.4 Data Sanitization

#### XSS Prevention
- All user input (notes) sanitized before storage
- HTML tags stripped or escaped
- Output encoding when rendering

#### SQL Injection Prevention
- Supabase client uses parameterized queries
- No raw SQL with user input

---

## 11. Success Metrics

### 11.1 Adoption Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Daily Active Users (DAU)** | 90% of workers | % users logging ≥1 activity/day |
| **Weekly Activity Frequency** | 5 days/week | Avg activities per user per week |
| **Time to First Activity** | < 1 hour | Time from feature launch to first logged activity |
| **User Retention** | 95% week-over-week | Users who logged activities both weeks |

### 11.2 Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Page Load Time** | < 1 second (p95) | Time to Interactive (TTI) |
| **API Response Time** | < 500ms (p95) | Server response time |
| **Export Generation** | < 3 seconds | File download start time |
| **Activity Logging Speed** | < 10 seconds | Click to save confirmation |

### 11.3 Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Billing Accuracy** | 100% | Activities match billed hours |
| **Time Saved** | 70% reduction | vs. manual time tracking |
| **Client Report Frequency** | 2x increase | Monthly reports generated |
| **Data Completeness** | 95% | Tasks with ≥1 activity logged |

### 11.4 Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Error Rate** | < 0.1% | Failed API calls / total calls |
| **Data Accuracy** | 99% | Activities with valid data |
| **User Satisfaction** | ≥ 4.5/5 | Post-launch survey score |

---

## 12. Implementation Phases

### Phase 1: MVP (Week 1) - Core CRUD ✅

**Goal:** Users can log, view, and delete activities

#### Deliverables:
- [x] Database schema (`activities` table)
- [x] RLS policies
- [x] TypeScript types (`activity.ts`)
- [x] API routes:
  - `GET /api/activities` (list with filters)
  - `POST /api/activities` (create)
  - `GET /api/activities/[id]` (get one)
  - `PATCH /api/activities/[id]` (update)
  - `DELETE /api/activities/[id]` (delete)
- [x] Activities page (`/activities/page.tsx`)
- [x] ActivityTable component
- [x] QuickAddActivityModal component
- [x] Basic filtering (date range, client)

#### Success Criteria:
- Users can create activities
- Users can view own activities
- RBAC enforced (workers see own, assigners see all)
- 15-day constraint working

---

### Phase 2: Filtering & UX (Week 2) - Enhanced Experience 🔄

**Goal:** Polished, fast, intuitive interface

#### Deliverables:
- [ ] Advanced filters:
  - System filter (dependent on client)
  - Task status filter
  - User filter (ASSIGNER/ADMIN)
- [ ] Floating Action Button (FAB)
- [ ] Keyboard shortcuts (Ctrl+L, Ctrl+Enter, Esc)
- [ ] Summary cards (Total hours, Activities, Companies)
- [ ] Inline editing
- [ ] Toast notifications
- [ ] Loading states (skeletons)
- [ ] Empty states
- [ ] Error handling (retry logic)
- [ ] Task status warning badge

#### Success Criteria:
- Activity logging < 10 seconds
- Page loads < 1 second
- All filters working
- Positive user feedback

---

### Phase 3: Export (Week 3) - Reporting Capability 📊

**Goal:** Generate Excel reports for billing

#### Deliverables:
- [ ] Install `xlsx` library
- [ ] API route: `POST /api/activities/export`
- [ ] API route: `GET /api/activities/summary`
- [ ] ExportModal component
- [ ] Excel generation logic:
  - Columns: Date, Client, System, Duration, Description
  - Grouping by worker (with subtotals)
  - Professional formatting
- [ ] Date range selection
- [ ] Filter-based export
- [ ] File naming (includes filters)

#### Success Criteria:
- Export completes < 3 seconds (1000 activities)
- Excel format matches requirements
- Filtering works correctly
- ASSIGNER can export team activities

---

### Phase 4: Integration (Week 4) - Seamless Workflow 🔗

**Goal:** Integrate with existing InoFlow pages

#### Deliverables:
- [ ] Task detail page integration:
  - Total time logged display
  - "Log Activity" button
  - Recent activities list
- [ ] Dashboard widget (optional):
  - "This week's activities" summary
  - Quick link to activities page
- [ ] Navigation link ("Aktiviteler")
- [ ] Middleware route protection
- [ ] Real-time updates (Supabase realtime)

#### Success Criteria:
- Zero breaking changes
- Seamless navigation
- Real-time summary updates

---

### Phase 5: Enhancements (Post-Launch) - Advanced Features 🚀

**Goal:** Power features for advanced users

#### Deliverables (Future):
- [ ] Bulk operations (multi-select, bulk delete)
- [ ] Activity templates/presets
- [ ] Analytics dashboard:
  - Time trends chart
  - Top tasks by hours
  - User productivity metrics
  - Company comparison
- [ ] Mobile PWA optimization
- [ ] Activity approval workflow (optional)
- [ ] Invoice integration (optional)

---

## 13. Risks & Mitigation

### 13.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Performance degradation with large datasets** | High | Medium | Server-side pagination, database indexing, virtualized scrolling |
| **Excel export timeout for large data** | Medium | Low | Streaming export, limit to 10k rows, show progress |
| **Real-time updates causing race conditions** | Medium | Low | Optimistic UI, debouncing, conflict resolution |
| **Browser compatibility issues** | Low | Low | Polyfills, feature detection, browser testing |

### 13.2 User Experience Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Users forget to log activities** | High | High | Email reminders, dashboard widget, browser notifications (future) |
| **Incorrect time logging** | Medium | Medium | Validation, format hints, confirmation on save |
| **Confusion around 15-day constraint** | Medium | Medium | Clear tooltips, disabled UI states, warning messages |
| **Resistance to new workflow** | High | Low | Training, onboarding guide, user feedback sessions |

### 13.3 Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Low adoption rate** | High | Medium | User training, incentivize usage, make it required for billing |
| **Data quality issues** | High | Low | Validation, audit logs, admin review capabilities |
| **Client billing disputes** | High | Low | Detailed notes required, edit history, approval workflow (future) |

### 13.4 Security Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Unauthorized data access** | High | Low | RLS policies, API authentication, role checks |
| **Data loss** | High | Very Low | Database backups, soft deletes (future), audit logs |
| **XSS attacks via activity notes** | Medium | Low | Input sanitization, output encoding, CSP headers |

---

## 14. Out of Scope (v1.0)

The following features are **explicitly excluded** from the initial release:

### 14.1 Future Enhancements
- ❌ **Activity timer**: Live timer to track time while working
- ❌ **Mobile app**: Native iOS/Android app
- ❌ **Approval workflow**: Manager approval for activities
- ❌ **Invoice generation**: Direct invoice creation from activities
- ❌ **Time tracking rules**: Automatic validation of work hours
- ❌ **Activity templates**: Pre-defined activity types
- ❌ **Notifications**: Email/push notifications for activity reminders
- ❌ **Analytics dashboard**: Advanced charts and trends
- ❌ **Integrations**: Third-party accounting software (Xero, QuickBooks)
- ❌ **Bulk import**: CSV/Excel import of activities
- ❌ **Custom fields**: Additional metadata fields for activities
- ❌ **Activity comments**: Discussion threads on activities
- ❌ **Recurring activities**: Auto-create daily/weekly activities
- ❌ **Offline mode**: PWA offline capabilities
- ❌ **Voice input**: Speech-to-text for activity notes
- ❌ **Multi-language**: Translations beyond Turkish

### 14.2 Non-Goals
- ❌ Replacing existing task management workflow
- ❌ Project budgeting or cost estimation
- ❌ Resource capacity planning
- ❌ Team chat or collaboration features
- ❌ File attachments to activities

---

## 15. Appendix

### 15.1 Glossary

| Term | Definition |
|------|------------|
| **Activity** | A time-tracked work entry associated with a task |
| **Time Spent** | Duration of work, stored as integer minutes |
| **Activity Date** | The date work was performed (not created date) |
| **Editable Window** | 15-day period during which activities can be modified |
| **RBAC** | Role-Based Access Control |
| **RLS** | Row-Level Security (Supabase/PostgreSQL) |
| **FAB** | Floating Action Button |

### 15.2 References

- [InoFlow Architecture Documentation](./ARCHITECTURE.md)
- [InoFlow Project Structure](./STRUCTURE.md)
- [InoFlow TDD Guidelines](./TDD.md)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### 15.3 Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-08 | Product Team | Initial PRD based on stakeholder requirements |

### 15.4 Approval Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | [Pending] | | |
| Engineering Lead | [Pending] | | |
| Design Lead | [Pending] | | |

---

**END OF DOCUMENT**
