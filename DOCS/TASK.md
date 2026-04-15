# InoFlow Activity Tracking System - Implementation Tasks

**Based on:** [CP_PRD.md](./CP_PRD.md) - Activity Tracking System  
**Created:** 2026-01-08  
**Status:** In Progress  
**Current Phase:** Phase 1 (MVP - Core CRUD)

---

## Phase 1: MVP - Core CRUD ✅ (Week 1)

**Goal:** Users can log, view, and delete activities

### 1.1 Database Setup
- [x] Create `activities` table with proper schema
- [x] Add check constraints (time: 1-1440 min, date: last 15 days)
- [x] Create indexes for performance (user_id, task_id, client_id, date)
- [x] Create composite indexes for common queries
- [x] Enable Row-Level Security (RLS) on activities table
- [x] Create RLS policies:
  - [x] Workers view own activities
  - [x] Users create activities for own tasks
  - [x] Users update own recent activities (15-day window)
  - [x] Users delete own recent activities (15-day window)
- [x] Create `update_updated_at_column()` trigger function
- [x] Attach trigger to `activities` table
- [x] Create `activity_summary` database view (joins tasks, users, clients, systems)

### 1.2 TypeScript Types
- [x] Create `src/types/activity.ts`
- [x] Define `Activity` interface
- [x] Define `ActivityWithRelations` interface
- [x] Define `ActivityFormData` type
- [x] Define `ActivityFilters` type
- [x] Export types from `src/types/index.ts`

### 1.3 API Routes
- [x] Create `src/app/api/activities/route.ts`
  - [x] Implement `GET` handler (list with filters)
    - [x] Add authentication check
    - [x] Implement role-based filtering (WORKER sees own only)
    - [x] Add date range filter
    - [x] Add client filter
    - [x] Add pagination (default 50, max 200)
    - [x] Sort by date DESC
  - [x] Implement `POST` handler (create activity)
    - [x] Add authentication check
    - [x] Validate input (date, time, note)
    - [x] Validate task ownership
    - [x] Auto-fill client_id from task
    - [x] Convert time input to minutes
    - [x] Return created activity
- [x] Create `src/app/api/activities/[id]/route.ts`
  - [x] Implement `GET` handler (get single activity)
  - [x] Implement `PATCH` handler (update activity)
    - [x] Check 15-day edit window (unless ADMIN)
    - [x] Validate ownership
    - [x] Validate input
  - [x] Implement `DELETE` handler (delete activity)
    - [x] Check 15-day delete window (unless ADMIN)
    - [x] Validate ownership

### 1.4 UI Components
- [x] Create `src/components/ActivityTable.tsx`
  - [x] Display activities in table format
  - [x] Columns: Date, Task, Client, System, Time, Note
  - [x] Handle empty state
  - [x] Add loading state (skeleton)
  - [x] Responsive design (mobile, tablet, desktop)
- [x] Create `src/components/QuickAddActivityModal.tsx`
  - [x] Modal with form inputs
  - [x] Date picker (disabled: future dates, >15 days ago)
  - [x] Task search/select with autocomplete
  - [x] Auto-fill company from selected task
  - [x] Time input with flexible format parsing
  - [x] Note textarea
  - [x] Save button (Ctrl+Enter shortcut)
  - [x] Cancel button (Esc shortcut)
  - [x] "Keep modal open after saving" checkbox

### 1.5 Activities Page
- [x] Create `src/app/activities/page.tsx`
  - [x] Page header with title and description
  - [x] Basic filters (date range, client dropdown)
  - [x] Render ActivityTable component
  - [x] "Log Activity" button (opens modal)
  - [x] Pagination controls
  - [x] Protected route (authentication required)

### 1.6 Testing & Validation
- [x] Test RBAC enforcement (WORKER vs ASSIGNER vs ADMIN)
- [x] Test 15-day constraint for create/edit/delete
- [x] Test activity creation workflow
- [x] Test activity viewing for different roles
- [x] Verify database constraints work
- [x] Test RLS policies

---

## Phase 2: Filtering & UX Enhancements 🔄 (Week 2)

**Goal:** Polished, fast, intuitive interface

### 2.1 Advanced Filtering
- [ ] Add System filter dropdown
  - [ ] Make dependent on selected client
  - [ ] Show all systems when no client selected
- [ ] Add Task status filter (multi-select)
  - [ ] Options: NOT_STARTED, NEW_STARTED, IN_PROGRESS, IN_TESTING, COMPLETED
- [ ] Add User filter (ASSIGNER/ADMIN only)
  - [ ] Dropdown with all users
  - [ ] "All Workers" option
- [ ] Implement filter persistence (URL query params)
- [ ] Add "Clear Filters" button

### 2.2 Summary Cards
- [ ] Create `SummaryCards.tsx` component
- [ ] Card 1: Total Hours
  - [ ] Calculate sum of time_spent_minutes
  - [ ] Display as decimal hours (e.g., "156.5h")
  - [ ] Update in real-time when filters change
- [ ] Card 2: Activity Count
  - [ ] Display count of filtered activities
  - [ ] Format: "87 activities"
- [ ] Card 3: Company Count
  - [ ] Display unique client count
  - [ ] Format: "5 companies"
- [ ] Responsive grid layout (1 col mobile, 3 col desktop)

### 2.3 Floating Action Button (FAB)
- [ ] Create `FloatingActionButton.tsx` component
- [ ] Position: bottom-right, fixed
- [ ] Icon: "+" symbol
- [ ] Opens QuickAddActivityModal on click
- [ ] Hover animation (scale 1.1)
- [ ] Mobile-friendly size

### 2.4 Keyboard Shortcuts
- [ ] Implement global keyboard listener
- [ ] `Ctrl+L`: Open quick-add modal
- [ ] `Ctrl+Enter`: Save activity (in modal)
- [ ] `Esc`: Close modal
- [ ] `Tab`: Navigate form fields
- [ ] Display shortcut hints in UI (tooltips)

### 2.5 Inline Editing
- [ ] Make table rows clickable to edit
- [ ] Inline edit mode for:
  - [ ] Time spent
  - [ ] Activity note
- [ ] Read-only fields: Date, Task, Company, User
- [ ] Auto-save on blur or Ctrl+Enter
- [ ] Show "Cannot edit" tooltip for >15 day old activities
- [ ] ADMIN can edit any activity

### 2.6 Toast Notifications
- [ ] Create/update `Toast.tsx` component
- [ ] Success toast: "Activity saved successfully"
- [ ] Success toast: "Activity deleted successfully"
- [ ] Error toast: "Failed to save activity. Please try again."
- [ ] Slide-in animation from bottom (300ms)
- [ ] Auto-dismiss after 3 seconds
- [ ] Close button

### 2.7 Loading & Empty States
- [ ] Skeleton loading for table rows
- [ ] Skeleton loading for summary cards
- [ ] Empty state when no activities:
  - [ ] Illustration or icon
  - [ ] Message: "No activities found"
  - [ ] "Log your first activity" button
- [ ] Empty state for filters with no results

### 2.8 Error Handling
- [ ] API error handling with retry logic
- [ ] Display user-friendly error messages
- [ ] Network error detection
- [ ] Retry button for failed requests
- [ ] Fallback UI for critical errors

### 2.9 Task Status Warning
- [ ] Create warning badge component
- [ ] Show "⚠️ Task not yet started" for NOT_STARTED/NEW_STARTED tasks
- [ ] Display in QuickAddActivityModal
- [ ] Yellow/orange color
- [ ] Allow saving despite warning

### 2.10 Performance Optimization
- [ ] Implement debouncing for filter changes (300ms)
- [ ] Optimize re-renders with React.memo
- [ ] Lazy load modal components
- [ ] Virtual scrolling for large datasets (optional)
- [ ] Test with 500+ activities
- [ ] Ensure page loads in <1 second

---

## Phase 3: Export & Reporting 📊 (Week 3)

**Goal:** Generate Excel reports for billing

### 3.1 Dependencies
- [ ] Install `xlsx` library (`bun add xlsx`)
- [ ] Install `@types/xlsx` (`bun add -D @types/xlsx`)

### 3.2 Export API
- [ ] Create `src/app/api/activities/export/route.ts`
  - [ ] Implement `POST` handler
  - [ ] Accept filters in request body (client, system, date range, user)
  - [ ] Query activities based on filters
  - [ ] Apply role-based access control
  - [ ] Return Excel file as buffer
- [ ] Create `src/app/api/activities/summary/route.ts` (optional)
  - [ ] Return aggregated data (total hours, counts)
  - [ ] Used for export preview

### 3.3 Export Modal Component
- [ ] Create `ExportModal.tsx` component
- [ ] Date range picker (pre-filled with current filter)
- [ ] Display applied filters summary
- [ ] Export preview:
  - [ ] Total activities count
  - [ ] Total hours
  - [ ] Number of workers
  - [ ] Date range
- [ ] File name input (auto-generated, editable)
- [ ] Checkbox: "Group by worker (with subtotals)"
- [ ] "Download Excel" button
- [ ] Loading state during generation

### 3.4 Excel Generation Logic
- [ ] Create `src/lib/exportToExcel.ts` utility
- [ ] Function: `generateActivityExcel(activities, options)`
- [ ] Columns:
  - [ ] Date (DD/MM/YYYY format)
  - [ ] Client
  - [ ] System
  - [ ] Activity Duration (formatted as "2h 30m")
  - [ ] Activity Description
- [ ] Implement grouping by worker:
  - [ ] Group rows by user name
  - [ ] Add subtotal row per worker
  - [ ] Add grand total at bottom
- [ ] Professional formatting:
  - [ ] Header row bold
  - [ ] Alternating row colors
  - [ ] Auto-size columns
  - [ ] Freeze header row
- [ ] File naming: `Activities_{client}_{system}_{date-range}.xlsx`

### 3.5 Export Integration
- [ ] Add "Export to Excel" button to activities page
- [ ] Opens ExportModal on click
- [ ] Pass current filters to modal
- [ ] Trigger download on export
- [ ] Show progress spinner during generation
- [ ] Success toast: "Export downloaded successfully"
- [ ] Error handling with retry option

### 3.6 Export Testing
- [ ] Test export with 10 activities
- [ ] Test export with 1000 activities (performance)
- [ ] Test export with filters applied
- [ ] Test export with grouping by worker
- [ ] Test export for ASSIGNER (all workers)
- [ ] Test export for WORKER (own only)
- [ ] Verify Excel file format and content
- [ ] Test file download in different browsers

---

## Phase 4: Integration & Polish 🔗 (Week 4)

**Goal:** Seamless integration with existing InoFlow

### 4.1 Navigation Integration
- [ ] Update `src/components/Header.tsx`
  - [ ] Add "Aktiviteler" link to navigation
  - [ ] Position: Between "İşler" and "Müşteriler"
  - [ ] Highlight when on `/activities` route
  - [ ] Icon: Clock or timer icon
- [ ] Update middleware (`src/middleware.ts`)
  - [ ] Add `/activities` to protected routes
  - [ ] Verify authentication requirement

### 4.2 Task Detail Page Integration
- [ ] Update `src/app/tasks/[id]/page.tsx`
  - [ ] Add "Total time logged" section
    - [ ] Query activities for this task
    - [ ] Sum total hours
    - [ ] Display formatted (e.g., "12h 30m logged")
  - [ ] Add "Log Activity" button
    - [ ] Opens QuickAddActivityModal
    - [ ] Pre-select current task
    - [ ] Pre-fill company from task
  - [ ] Add "Recent Activities" section
    - [ ] Display last 5 activities for this task
    - [ ] Show: Date, User, Time, Note
    - [ ] Link to full activities page
- [ ] Add activity count badge to task cards (optional)

### 4.3 Dashboard Widget (Optional)
- [ ] Create `ActivitySummaryWidget.tsx` component
- [ ] Display on `/dashboard`
- [ ] Show "This week's activities" summary:
  - [ ] Total hours this week
  - [ ] Number of activities this week
  - [ ] Quick link to activities page
- [ ] Responsive design

### 4.4 Real-time Updates
- [ ] Subscribe to Supabase realtime for `activities` table
- [ ] Update summary cards on activity changes
- [ ] Update table when new activity created
- [ ] Debounce refresh (2000ms minimum interval)
- [ ] Only refresh if activity affects current user/view

### 4.5 Accessibility (WCAG 2.1 Level AA)
- [ ] Ensure all inputs have labels
- [ ] Add ARIA attributes to interactive elements
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility
- [ ] Verify color contrast ratio ≥ 4.5:1
- [ ] Add focus indicators
- [ ] Test with accessibility tools (axe, Lighthouse)

### 4.6 Responsive Design Testing
- [ ] Test on mobile (320px - 767px)
  - [ ] Table should scroll horizontally or stack
  - [ ] Modal should be full-screen
  - [ ] FAB should be easily tappable
- [ ] Test on tablet (768px - 1023px)
- [ ] Test on desktop (1024px+)
- [ ] Test different orientations (portrait, landscape)

### 4.7 Browser Compatibility Testing
- [ ] Test on Chrome 90+
- [ ] Test on Firefox 88+
- [ ] Test on Safari 14+
- [ ] Test on Edge 90+
- [ ] Fix any browser-specific issues

### 4.8 Final Polish
- [ ] Review all UI text for clarity
- [ ] Ensure consistent styling with existing InoFlow
- [ ] Add loading states for all async operations
- [ ] Verify all error messages are user-friendly
- [ ] Test all user flows end-to-end
- [ ] Performance audit (Lighthouse score ≥ 90)
- [ ] Fix any accessibility issues
- [ ] Code cleanup and refactoring

---

## Phase 5: Post-Launch Enhancements 🚀 (Future)

**Goal:** Advanced features for power users

### 5.1 Bulk Operations
- [ ] Add multi-select checkboxes to table
- [ ] "Select All" checkbox in header
- [ ] Bulk delete action
- [ ] Bulk export action
- [ ] Confirmation modal for bulk actions

### 5.2 Activity Templates/Presets
- [ ] Create common activity templates
- [ ] Quick add from template
- [ ] User-customizable templates
- [ ] Template management UI

### 5.3 Analytics Dashboard
- [ ] Create `/activities/analytics` page
- [ ] Time trends chart (line chart)
  - [ ] Hours logged per day/week/month
- [ ] Top tasks by hours (bar chart)
- [ ] User productivity metrics (comparison)
- [ ] Company comparison (pie chart)
- [ ] Filters: Date range, client, system
- [ ] Export charts as images

### 5.4 Activity Reminders
- [ ] Email reminder for users who didn't log today
- [ ] Dashboard notification widget
- [ ] Browser push notifications (PWA)
- [ ] Configurable reminder schedule

### 5.5 Mobile PWA Optimization
- [ ] Create `manifest.json`
- [ ] Add service worker for offline support
- [ ] Optimize touch targets for mobile
- [ ] Add install prompt
- [ ] Offline mode with sync when online

### 5.6 Activity Approval Workflow (Optional)
- [ ] Add `status` field to activities (PENDING, APPROVED, REJECTED)
- [ ] Approval UI for ASSIGNER/ADMIN
- [ ] Email notification on approval/rejection
- [ ] Comments on activities
- [ ] History of status changes

### 5.7 Invoice Integration (Optional)
- [ ] Link activities to invoices
- [ ] Mark activities as billed
- [ ] Generate invoice from selected activities
- [ ] Invoice template with activity breakdown
- [ ] Track unbilled activities

---

## Additional Tasks

### Documentation
- [ ] Update `ARCHITECTURE.md` with activities feature
- [ ] Update `STRUCTURE.md` with new files/folders
- [ ] Create user guide for activity tracking
- [ ] Create admin guide for exporting reports
- [ ] Add JSDoc comments to all components and utilities

### Testing (TDD Implementation)
- [ ] Set up Vitest and testing library
- [ ] Write unit tests for utilities:
  - [ ] Time parsing function
  - [ ] Date validation function
  - [ ] Excel generation function
- [ ] Write component tests:
  - [ ] ActivityTable component
  - [ ] QuickAddActivityModal component
  - [ ] ExportModal component
  - [ ] SummaryCards component
- [ ] Write integration tests:
  - [ ] Activity CRUD workflow
  - [ ] Filtering and pagination
  - [ ] Export workflow
- [ ] Write E2E tests (Playwright):
  - [ ] Complete activity logging flow
  - [ ] Activity editing and deletion
  - [ ] Export generation
  - [ ] Role-based access control
- [ ] Achieve ≥80% code coverage

### Performance Monitoring
- [ ] Set up performance monitoring (Vercel Analytics)
- [ ] Track key metrics:
  - [ ] Page load time (TTI)
  - [ ] API response times
  - [ ] Export generation time
  - [ ] Activity logging speed
- [ ] Set up error tracking (Sentry)
- [ ] Create performance dashboard

### Security Audit
- [ ] Review RLS policies for gaps
- [ ] Audit input validation (client and server)
- [ ] Test for XSS vulnerabilities
- [ ] Test for SQL injection (via Supabase)
- [ ] Review authentication checks in all API routes
- [ ] Implement rate limiting on POST endpoints
- [ ] Add CSRF protection
- [ ] Content Security Policy headers

### User Training & Rollout
- [ ] Create onboarding tutorial (first-time user)
- [ ] Record demo video
- [ ] Schedule training session for team
- [ ] Prepare FAQ document
- [ ] Create feedback form
- [ ] Plan phased rollout (beta users first)
- [ ] Collect user feedback
- [ ] Iterate based on feedback

---

## Success Metrics Tracking

### Adoption Metrics
- [ ] Track Daily Active Users (DAU) - Target: 90%
- [ ] Track Weekly Activity Frequency - Target: 5 days/week
- [ ] Measure Time to First Activity - Target: <1 hour
- [ ] Monitor User Retention - Target: 95% week-over-week

### Performance Metrics
- [ ] Monitor Page Load Time - Target: <1s (p95)
- [ ] Monitor API Response Time - Target: <500ms (p95)
- [ ] Monitor Export Generation Time - Target: <3s
- [ ] Measure Activity Logging Speed - Target: <10s

### Business Metrics
- [ ] Verify Billing Accuracy - Target: 100%
- [ ] Calculate Time Saved - Target: 70% reduction
- [ ] Track Client Report Frequency - Target: 2x increase
- [ ] Monitor Data Completeness - Target: 95%

### Quality Metrics
- [ ] Track Error Rate - Target: <0.1%
- [ ] Monitor Data Accuracy - Target: 99%
- [ ] Conduct User Satisfaction Survey - Target: ≥4.5/5

---

## Notes

- **Priority Levels:**
  - P0 (Must Have): Critical for MVP
  - P1 (Should Have): Important for good UX
  - P2 (Nice to Have): Future enhancements
  
- **Status Legend:**
  - `[ ]` - Not started
  - `[/]` - In progress
  - `[x]` - Completed
  - `[-]` - Blocked

- **Testing Strategy:** Follow TDD principles from [TDD.md](./TDD.md) - write tests before implementing features

- **Architecture Reference:** Refer to [ARCHITECTURE.md](./ARCHITECTURE.md) for system design patterns

- **Project Structure:** Refer to [STRUCTURE.md](./STRUCTURE.md) for file organization

---

**Last Updated:** 2026-01-08  
**Next Review:** After completing Phase 1 MVP
