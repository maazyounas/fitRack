# Workout Screen Improvements Bugfix Design

## Overview

This document formalizes the fix strategy for eight bugs in the fitRack workout feature.
The bugs span the full stack: an empty React hook, a missing Expo Router route, a silent
completion skip, an unscrollable list, a GET endpoint that mutates the database, missing
server-side validation, a hardcoded schedule date, and a fully-built component that is
never rendered. Each fix is minimal and targeted — no existing behavior is altered beyond
what is required to correct the defect.

The bug condition methodology is used throughout: C(X) identifies the inputs that trigger
each bug, P(result) defines the correct behavior for those inputs, and ¬C(X) defines the
inputs that must be preserved unchanged.

---

## Glossary

- **Bug_Condition (C)**: A predicate over inputs that returns `true` when the defective
  code path is triggered.
- **Property (P)**: The desired output or side-effect for any input where C holds.
- **Preservation**: All behaviors for inputs where C does NOT hold must remain identical
  before and after the fix.
- **Ad-hoc entry**: A `WorkoutPlan.schedule` subdocument created at completion time
  (not pre-scheduled), with `status: 'completed'`, `completed: true`, and `completedAt`
  set to the current timestamp.
- **Schedule entry**: A subdocument in `WorkoutPlan.schedule` with `scheduledDate`,
  `completed`, `status`, and optional `completedAt`.
- **`useWorkout`**: The hook in `frontend/hooks/useWorkout.ts` that should re-export
  `useWorkoutStore()`.
- **`WorkoutExecutionScreen`**: The component in
  `frontend/components/workouts/WorkoutExecutionScreen.tsx` that drives the live
  exercise-by-exercise workout flow.
- **`markCompleted`**: The `workoutStore` action that calls `POST /workouts/:id/complete`
  and recalculates the streak.
- **`getWorkoutAiReview`**: The current (buggy) controller function that both reads and
  writes on a GET request.
- **`refreshWorkoutAiReview`**: The new controller function (POST) that recomputes and
  persists the AI review.
- **`validate` middleware**: The Zod-based request-body validation middleware in
  `backend/src/middleware/validate.ts`.
- **`workoutSchemas`**: The new Zod schema file to be created at
  `backend/src/schemas/workoutSchemas.ts`.
- **`TemplateSelector`**: The component in
  `frontend/components/workouts/TemplateSelector.tsx` that renders template cards.
- **System template key**: The `key` field on a system template
  (e.g., `"beginner-full-body"`).

---

## Bug Details

### Bug 1 — Empty `useWorkout` Hook

The bug manifests when any component imports `useWorkout` from
`frontend/hooks/useWorkout.ts`. The file contains no code, so the named export is
`undefined`, causing a runtime crash at the call site.

**Formal Specification:**
```
FUNCTION isBugCondition_1(X)
  INPUT: X = module loaded from hooks/useWorkout.ts
  OUTPUT: boolean

  RETURN X.useWorkout IS undefined
         OR typeof X.useWorkout !== 'function'
END FUNCTION
```

**Examples:**
- `import { useWorkout } from '@/hooks/useWorkout'` → `useWorkout` is `undefined` → crash
- Any component calling `const { plans } = useWorkout()` → TypeError at runtime
- Any component calling `const { initialize } = useWorkout()` → TypeError at runtime

---

### Bug 2 — `WorkoutExecutionScreen` Is Unreachable

No Expo Router route file references `WorkoutExecutionScreen`. There is no "Start
Workout" button on plan cards in `workouts.tsx`. The entire execution flow is dead code.

**Formal Specification:**
```
FUNCTION isBugCondition_2(navigation)
  INPUT: navigation = the Expo Router navigation graph
  OUTPUT: boolean

  RETURN NOT EXISTS route IN navigation.routes WHERE
    route.renders(WorkoutExecutionScreen)
END FUNCTION
```

**Examples:**
- User taps every button on the workouts tab → `WorkoutExecutionScreen` never appears
- `router.push('/(modals)/workout-execution')` → 404 / unmatched route error
- `workoutId` prop is never passed to `WorkoutExecutionScreen` from any screen

---

### Bug 3 — Silent Completion Skip on Unscheduled Workouts

`handleWorkoutComplete` in `WorkoutExecutionScreen` only calls `markCompleted` when a
schedule entry whose `scheduledDate` matches today's calendar date and whose `completed`
is `false` exists. When no such entry exists, the call is silently skipped, the session
is not recorded, and the streak is not updated — yet the completion modal still appears.

**Formal Specification:**
```
FUNCTION isBugCondition_3(workout, today)
  INPUT: workout of type WorkoutPlan, today of type Date
  OUTPUT: boolean

  RETURN NOT EXISTS entry IN workout.schedule WHERE
    sameCalendarDay(entry.scheduledDate, today)
    AND entry.completed = false
END FUNCTION
```

**Examples:**
- User starts a workout that was never scheduled → completes all exercises → no DB write
- User starts a workout scheduled for yesterday → completes it today → no DB write
- User starts a workout scheduled for tomorrow → completes it today → no DB write
- User starts a workout scheduled for today → completes it → DB write succeeds (preserved)

---

### Bug 4 — Unscrollable Workout List

`FlatList` in `workouts.tsx` has `scrollEnabled={false}` and is inside a plain `View`
that does not scroll. Plans below the fold are permanently inaccessible.

**Formal Specification:**
```
FUNCTION isBugCondition_4(screen)
  INPUT: screen = rendered WorkoutsScreen
  OUTPUT: boolean

  RETURN screen.FlatList.scrollEnabled = false
         AND screen.container IS NOT ScrollView
END FUNCTION
```

**Examples:**
- User has 10 workout plans → only the first 3–4 are visible → cannot scroll to the rest
- User tries to swipe up on the list → no scroll response
- `contentContainerStyle={{ paddingBottom: 100 }}` is set but unreachable

---

### Bug 5 — GET Endpoint with Database Side Effects

`GET /workouts/:id/ai-review` calls `analyzeWorkoutPlan`, writes the result to
`plan.aiReview`, mutates schedule entry statuses to `'missed'`, and calls `plan.save()`.
This violates HTTP safety and idempotency requirements for GET.

**Formal Specification:**
```
FUNCTION isBugCondition_5(request)
  INPUT: request of type HttpRequest
  OUTPUT: boolean

  RETURN request.method = "GET"
         AND request.path MATCHES "/workouts/:id/ai-review"
END FUNCTION
```

**Examples:**
- `GET /workouts/abc123/ai-review` → `plan.aiReview` is overwritten in MongoDB
- `GET /workouts/abc123/ai-review` → past-due schedule entries get `status: 'missed'`
- Two identical GET requests produce different DB states (not idempotent)
- A read-only client (e.g., analytics dashboard) inadvertently mutates data

---

### Bug 6 — No Server-Side Validation on Exercise Fields

`POST /workouts` and `PATCH /workouts/:id` have no Zod validation middleware. Invalid
values such as `sets: -5`, `reps: 0`, `restSeconds: -10`, or `intensity: "extreme"` are
accepted and persisted. The Mongoose schema has `min` constraints but they are not
enforced at the HTTP layer with a proper 400 response.

**Formal Specification:**
```
FUNCTION isBugCondition_6(payload)
  INPUT: payload of type WorkoutCreatePayload
  OUTPUT: boolean

  RETURN payload.name IS empty OR absent
         OR payload.difficulty NOT IN {"beginner", "intermediate", "advanced"}
         OR payload.estimatedDurationMinutes <= 0
         OR NOT isInteger(payload.estimatedDurationMinutes)
         OR EXISTS exercise IN payload.exercises WHERE
              exercise.sets < 1
              OR exercise.reps < 1
              OR exercise.restSeconds < 0
              OR exercise.intensity NOT IN {"low", "moderate", "high"}
END FUNCTION
```

**Examples:**
- `POST /workouts` with `sets: 0` → accepted, persisted → corrupt data
- `POST /workouts` with `intensity: "extreme"` → accepted, persisted → corrupt data
- `PATCH /workouts/:id` with `reps: -3` → accepted, persisted → corrupt data
- `POST /workouts` with `name: ""` → accepted, persisted → unnamed plan

---

### Bug 7 — Schedule Locked to Today's Date

`handleSchedule` in `workouts.tsx` always uses `new Date().toISOString().split('T')[0]`
as the scheduled date. There is no date picker, so users cannot plan workouts in advance.

**Formal Specification:**
```
FUNCTION isBugCondition_7(interaction)
  INPUT: interaction = user tapping "Schedule" on a plan card
  OUTPUT: boolean

  RETURN interaction.scheduledDate = today
         AND NOT EXISTS datePicker IN screen
END FUNCTION
```

**Examples:**
- User taps "Schedule" on Monday → workout is always scheduled for Monday
- User wants to schedule for next Friday → no mechanism to do so
- User taps "Schedule" twice → two entries for today, no future planning possible

---

### Bug 8 — `TemplateSelector` Component Is Never Rendered

`TemplateSelector` is fully implemented in
`frontend/components/workouts/TemplateSelector.tsx` but is never imported or rendered
in `workouts.tsx`. Users cannot discover or apply templates from the UI.

**Formal Specification:**
```
FUNCTION isBugCondition_8(screen)
  INPUT: screen = rendered WorkoutsScreen with non-empty templates array
  OUTPUT: boolean

  RETURN NOT EXISTS element IN screen.renderedTree WHERE
    element.type = TemplateSelector
END FUNCTION
```

**Examples:**
- Store has 3 templates → workouts screen renders → no template cards visible
- User wants to start from a template → no entry point in the UI
- `applyTemplate` action exists in store but is never called from the workouts tab

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Creating a workout plan with valid data continues to return HTTP 201 and persist the plan.
- Editing an existing plan continues to update only the supplied fields.
- Deleting a plan continues to remove it and return HTTP 200.
- Completing a workout that has a matching today's schedule entry continues to mark that
  entry completed, update `completedAt`, and recalculate the streak.
- Valid exercise fields (`sets ≥ 1`, `reps ≥ 1`, `restSeconds ≥ 0`,
  `intensity ∈ {low, moderate, high}`) continue to be accepted without error.
- Scheduling a workout for a specific date continues to add a `scheduled` entry and sync
  notifications.
- Applying a system template continues to create a new plan and select it as active.
- When the workout list contains fewer plans than the screen height, no unnecessary scroll
  chrome is added.
- Tapping "End Workout" in `WorkoutExecutionScreen` continues to navigate back without
  recording a completion.
- `GET /workouts/:id/ai-review` continues to return `{ aiReview, missedWorkouts }` with
  the same response shape so existing read-only callers are unaffected.
- Reordering exercises in the workout builder continues to update local order without
  calling the backend until the user saves.

**Scope:**
All inputs that do NOT satisfy any of the eight bug conditions above must be completely
unaffected by these fixes. This includes all existing API consumers, all existing
navigation flows, and all existing store actions not explicitly modified.

---

## Hypothesized Root Cause

### Bug 1 — Empty Hook
The file `hooks/useWorkout.ts` was created as a placeholder but never implemented.
The pattern used by `hooks/useAuth.ts` (a one-liner re-export of the store) was not
replicated.

### Bug 2 — Unreachable Screen
The `WorkoutExecutionScreen` component was built in isolation without a corresponding
Expo Router file under `app/(modals)/`. No "Start Workout" button was added to the plan
cards in `workouts.tsx`, so there is no navigation entry point.

### Bug 3 — Silent Completion Skip
`handleWorkoutComplete` was written to handle only the scheduled-workout path. The
`if (scheduleEntry?.['_id'])` guard was never given an `else` branch. The backend
`markWorkoutCompleted` controller also requires a `scheduleEntryId` and throws 404 when
it is absent, so even if the frontend called it without an ID the request would fail.
Both layers need to be updated.

### Bug 4 — Unscrollable List
`scrollEnabled={false}` was likely added to prevent scroll conflicts with a parent
`ScrollView`, but the parent container is a plain `View`, not a `ScrollView`. The
`FlatList` is therefore the only scrollable element and it has been explicitly disabled.

### Bug 5 — GET with Side Effects
The `getWorkoutAiReview` controller was written to both compute and persist the AI review
in a single handler. The HTTP method was set to GET for convenience, but the handler
calls `plan.save()`, violating REST semantics. No separate POST endpoint was created for
the refresh operation.

### Bug 6 — Missing Validation
Validation middleware was applied to auth routes (see `authSchemas.ts`) but was never
extended to workout routes. The `createWorkoutPlan` and `updateWorkoutPlan` controllers
perform only a minimal manual check (`!payload.name || !Array.isArray(payload.exercises)`)
and rely on Mongoose schema constraints, which do not return HTTP 400 responses in the
same structured format.

### Bug 7 — Hardcoded Date
`handleSchedule` was implemented as a quick stub using `new Date().toISOString()`. A
date picker integration was deferred and never completed.

### Bug 8 — TemplateSelector Never Rendered
`TemplateSelector` was built as a standalone component but was never imported into
`workouts.tsx`. The `templates` array is fetched and stored correctly, but no render
call was added to the screen.

---

## Correctness Properties

Property 1: Bug Condition — Hook Returns Valid Store Shape

_For any_ component that calls `useWorkout()` after the fix, the function SHALL return
a non-undefined object containing all `useWorkoutStore()` fields: `plans`, `templates`,
`isLoading`, `initialize`, `createPlan`, `updatePlan`, `deletePlan`, `schedulePlan`,
`markCompleted`, `applyTemplate`, and `refreshAiReview`.

**Validates: Requirements 2.1**

---

Property 2: Bug Condition — Workout Execution Screen Is Reachable

_For any_ workout plan card rendered in the workouts tab, tapping "Start Workout" SHALL
navigate to a screen that renders `WorkoutExecutionScreen` with the correct `workoutId`
prop, displaying the workout name, first exercise, and exercise counter before any
further interaction.

**Validates: Requirements 2.2, 2.3**

---

Property 3: Bug Condition — Ad-hoc Completion Entry Is Created

_For any_ `(workout, today)` pair where `isBugCondition_3` holds (no matching today's
incomplete schedule entry), calling `POST /workouts/:id/complete` without a
`scheduleEntryId` SHALL return HTTP 200 and the response body SHALL contain a schedule
entry where `sameCalendarDay(entry.scheduledDate, today)` is true, `entry.completed` is
`true`, `entry.status` is `'completed'`, and `entry.completedAt` is not null.

**Validates: Requirements 2.5, 2.6**

---

Property 4: Preservation — Scheduled Completion Path Unchanged

_For any_ `(workout, today)` pair where `isBugCondition_3` does NOT hold (a matching
today's incomplete entry exists), calling `POST /workouts/:id/complete` with that
entry's `_id` as `scheduleEntryId` SHALL produce the same result as before the fix:
HTTP 200, the entry marked `completed: true`, and the streak recalculated.

**Validates: Requirements 2.4, 3.4**

---

Property 5: Bug Condition — GET AI Review Is Read-Only

_For any_ HTTP GET request to `/workouts/:id/ai-review`, the database state of the
targeted plan (both `aiReview` subdocument and `schedule` array) SHALL be identical
before and after the request. The response SHALL still return
`{ aiReview, missedWorkouts }` with HTTP 200.

**Validates: Requirements 2.9, 3.10**

---

Property 6: Bug Condition — POST AI Review Triggers Mutation

_For any_ HTTP POST request to `/workouts/:id/ai-review` for an existing owned plan,
the handler SHALL recompute the AI review, persist it, mark past-due incomplete entries
as `status: 'missed'`, and return `{ aiReview, missedWorkouts }` with HTTP 200.

**Validates: Requirements 2.10, 2.11, 2.12**

---

Property 7: Bug Condition — Invalid Exercise Payload Rejected

_For any_ `POST /workouts` or `PATCH /workouts/:id` request where `isBugCondition_6`
holds (invalid exercise or top-level field), the server SHALL return HTTP 400 with a
response body containing a non-empty `message` string identifying the failing field.

**Validates: Requirements 2.13, 2.14**

---

Property 8: Preservation — Valid Exercise Payload Accepted

_For any_ `POST /workouts` or `PATCH /workouts/:id` request where `isBugCondition_6`
does NOT hold (all fields valid), the server SHALL accept the request and return HTTP
201 (create) or HTTP 200 (update) exactly as before.

**Validates: Requirements 2.15, 3.1, 3.2, 3.5**

---

## Fix Implementation

### Bug 1 — Implement `useWorkout` Hook

**File:** `frontend/hooks/useWorkout.ts`

**Specific Changes:**
1. Import `useWorkoutStore` from `@/store/workoutStore`.
2. Export a `useWorkout` function that returns `useWorkoutStore()`.
3. Mirror the exact pattern of `hooks/useAuth.ts`.

```typescript
import { useWorkoutStore } from '@/store/workoutStore';

export function useWorkout() {
  return useWorkoutStore();
}
```

---

### Bug 2 — Create Workout Execution Route and Navigation Entry Point

**File 1:** `frontend/app/(modals)/workout-execution.tsx` *(new file)*

**Specific Changes:**
1. Create the Expo Router modal route file.
2. Read `workoutId` from `useLocalSearchParams()`.
3. Render `WorkoutExecutionScreen` with the `workoutId` prop.

**File 2:** `frontend/app/(tabs)/workouts.tsx`

**Specific Changes:**
1. Add a "Start Workout" `Pressable` button to each plan card's action row.
2. On press, call `router.push({ pathname: '/(modals)/workout-execution', params: { workoutId: plan.id } })`.

---

### Bug 3 — Make `scheduleEntryId` Optional in Completion Flow

**File 1:** `backend/src/controllers/workoutController.ts` — `markWorkoutCompleted`

**Specific Changes:**
1. Make `scheduleEntryId` optional in the destructured body.
2. When `scheduleEntryId` is provided, find and mark the matching entry (existing path).
3. When `scheduleEntryId` is absent, push a new ad-hoc entry:
   ```
   { scheduledDate: new Date(), status: 'completed', completed: true, completedAt: new Date() }
   ```
4. Remove the 404 throw when no entry is found — instead fall through to the ad-hoc path.

**File 2:** `frontend/components/workouts/WorkoutExecutionScreen.tsx` — `handleWorkoutComplete`

**Specific Changes:**
1. Always call `markCompleted`, passing `scheduleEntry?.['_id']` if found, omitting it if not.
2. Remove the `if (scheduleEntry?.['_id'])` guard that silently skips the call.

**File 3:** `frontend/store/workoutStore.ts` — `markCompleted` action

**Specific Changes:**
1. Change signature to `markCompleted: (id: string, scheduleEntryId?: string) => Promise<WorkoutPlan>`.
2. Pass `scheduleEntryId` to `completeWorkout` only when it is defined.

**File 4:** `frontend/services/api/workout.ts` — `completeWorkout`

**Specific Changes:**
1. Change `scheduleEntryId` parameter to optional.
2. Include it in the request body only when defined.

---

### Bug 4 — Fix Unscrollable Workout List

**File:** `frontend/app/(tabs)/workouts.tsx`

**Specific Changes:**
1. Remove `scrollEnabled={false}` from the `FlatList`.
2. Preserve `contentContainerStyle={styles.list}` (which has `paddingBottom: 100`).
3. No `ScrollView` wrapper is needed — the `FlatList` itself becomes the scroll container.

---

### Bug 5 — Split AI Review into Read and Refresh Endpoints

**File 1:** `backend/src/controllers/workoutController.ts`

**Specific Changes:**
1. Rename the existing `getWorkoutAiReview` to `refreshWorkoutAiReview`.
   - Keep all mutation logic (compute, save, mark missed).
2. Add a new `getWorkoutAiReview` function that is read-only:
   - Fetch the plan.
   - Return `{ aiReview: plan.aiReview, missedWorkouts: getMissedWorkouts(plan.schedule) }`.
   - Do NOT call `analyzeWorkoutPlan`, do NOT call `plan.save()`.

**File 2:** `backend/src/routes/workoutRoutes.ts`

**Specific Changes:**
1. Keep `workoutRoutes.get('/:id/ai-review', getWorkoutAiReview)` pointing to the new read-only handler.
2. Add `workoutRoutes.post('/:id/ai-review', refreshWorkoutAiReview)`.
3. Import `refreshWorkoutAiReview` from the controller.

**File 3:** `frontend/store/workoutStore.ts` — `refreshAiReview` action

**Specific Changes:**
1. Replace the call to `fetchWorkoutAiReview` with a new `refreshWorkoutAiReview` API function that uses POST.

**File 4:** `frontend/services/api/workout.ts`

**Specific Changes:**
1. Keep `fetchWorkoutAiReview` using GET (read-only, no change needed).
2. Add `refreshWorkoutAiReview(accessToken, id)` that calls POST `/workouts/:id/ai-review`.

---

### Bug 6 — Add Zod Validation to Workout Routes

**File 1:** `backend/src/schemas/workoutSchemas.ts` *(new file)*

**Specific Changes:**
1. Define `exerciseSchema` with:
   - `name`: non-empty string
   - `muscleGroup`: non-empty string
   - `equipment`: string (optional, defaults to `'Bodyweight'`)
   - `sets`: integer ≥ 1
   - `reps`: integer ≥ 1
   - `restSeconds`: integer ≥ 0
   - `notes`: string (optional)
   - `intensity`: enum `['low', 'moderate', 'high']`
   - `order`: integer ≥ 1
2. Define `createWorkoutSchema` with:
   - `name`: non-empty string (min 1)
   - `description`: string (optional)
   - `difficulty`: enum `['beginner', 'intermediate', 'advanced']`
   - `estimatedDurationMinutes`: positive integer (min 1)
   - `exercises`: array of `exerciseSchema`, min length 1
   - `isTemplate`: boolean (optional)
   - `sourceTemplateKey`: string (optional)
3. Define `updateWorkoutSchema` as a partial of `createWorkoutSchema`
   (all top-level fields optional, but if `exercises` is present it must still be valid).

**File 2:** `backend/src/routes/workoutRoutes.ts`

**Specific Changes:**
1. Import `validate` from `../middleware/validate`.
2. Import `createWorkoutSchema` and `updateWorkoutSchema` from `../schemas/workoutSchemas`.
3. Apply `validate(createWorkoutSchema)` to `workoutRoutes.post('/', ...)`.
4. Apply `validate(updateWorkoutSchema)` to `workoutRoutes.patch('/:id', ...)`.

---

### Bug 7 — Add Date Picker for Scheduling

**File:** `frontend/app/(tabs)/workouts.tsx`

**Specific Changes:**
1. Add state: `showDatePicker: boolean`, `datePickerPlanId: string | null`,
   `pickedDate: Date`.
2. Replace the `handleSchedule` direct-call with a function that sets
   `showDatePicker = true` and `datePickerPlanId = planId`.
3. Render a date picker modal (using `@react-native-community/datetimepicker` on iOS/Android
   or a simple inline date selector as fallback):
   - `minimumDate` set to today.
   - On confirm: call `schedulePlan(datePickerPlanId, pickedDate.toISOString().split('T')[0])`,
     show confirmation alert with the formatted date, close picker.
   - On dismiss/cancel: close picker without scheduling.
4. Update the "Schedule" button `onPress` to call the new handler.

---

### Bug 8 — Render `TemplateSelector` in Workouts Screen

**File:** `frontend/app/(tabs)/workouts.tsx`

**Specific Changes:**
1. Import `TemplateSelector` from `@/components/workouts/TemplateSelector`.
2. Destructure `templates` and `applyTemplate` from `useWorkoutStore()`.
3. Above the plan list (or empty state), conditionally render:
   ```tsx
   {templates.length > 0 && (
     <TemplateSelector
       templates={templates}
       onUseTemplate={handleUseTemplate}
     />
   )}
   ```
4. Implement `handleUseTemplate(template: WorkoutTemplate)`:
   - Call `applyTemplate(template.key ?? template.id)`.
   - On success, navigate to `/(modals)/workout-builder` with the new plan's ID.
   - On error, show an alert with the error message and do not navigate.

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach for the property-testable bugs (3, 5, 6):
first, run exploratory tests on the **unfixed** code to surface counterexamples and confirm
the root cause; then run fix-checking and preservation-checking tests on the **fixed** code.
For the structural/UI bugs (1, 2, 4, 7, 8), unit and integration examples are sufficient.

---

### Exploratory Bug Condition Checking

#### Bug 3 — Silent Completion Skip

**Goal:** Confirm that `POST /workouts/:id/complete` without a `scheduleEntryId` returns
404 on unfixed code, and that `handleWorkoutComplete` never calls `markCompleted` when no
today's entry exists.

**Test Plan:** Create a workout with no schedule entries. Call `POST /workouts/:id/complete`
without `scheduleEntryId`. Observe the 404. Also render `WorkoutExecutionScreen` with a
workout that has no today's entry and simulate completing all exercises — assert that
`markCompleted` is never called.

**Expected Counterexamples:**
- `POST /workouts/:id/complete` with no body → HTTP 404 "Scheduled workout not found."
- `handleWorkoutComplete` with no today's entry → `markCompleted` call count = 0

#### Bug 5 — GET with Side Effects

**Goal:** Confirm that `GET /workouts/:id/ai-review` mutates the database on unfixed code.

**Test Plan:** Snapshot `plan.aiReview` and `plan.schedule` before the GET. Send the GET.
Snapshot again. Assert the two snapshots differ.

**Expected Counterexamples:**
- `plan.aiReview` fields change after GET (e.g., `completionRate` is recomputed)
- Past-due schedule entries have `status` changed to `'missed'` after GET

#### Bug 6 — Missing Validation

**Goal:** Confirm that invalid payloads are accepted with HTTP 201 on unfixed code.

**Test Plan:** Send `POST /workouts` with `sets: 0`, `reps: -1`, `intensity: "extreme"`,
and `name: ""`. Assert each returns HTTP 201 (not 400).

**Expected Counterexamples:**
- `{ sets: 0 }` → HTTP 201 (should be 400)
- `{ intensity: "extreme" }` → HTTP 201 (should be 400)
- `{ name: "" }` → HTTP 201 (should be 400)

---

### Fix Checking

#### Bug 3

```
FOR ALL (workout, today) WHERE isBugCondition_3(workout, today) DO
  result := POST /workouts/{workout.id}/complete (no scheduleEntryId)
  ASSERT result.status = 200
  ASSERT EXISTS entry IN result.body.workout.schedule WHERE
    sameCalendarDay(entry.scheduledDate, today)
    AND entry.completed = true
    AND entry.status = 'completed'
    AND entry.completedAt IS NOT null
END FOR
```

#### Bug 5

```
FOR ALL request WHERE isBugCondition_5(request) DO
  stateBefore := dbSnapshot(request.params.id)
  result := GET /workouts/{id}/ai-review
  stateAfter := dbSnapshot(request.params.id)
  ASSERT stateBefore.aiReview = stateAfter.aiReview
  ASSERT stateBefore.schedule = stateAfter.schedule
  ASSERT result.status = 200
  ASSERT result.body HAS KEYS { aiReview, missedWorkouts }
END FOR
```

#### Bug 6

```
FOR ALL payload WHERE isBugCondition_6(payload) DO
  result := POST /workouts (payload)
  ASSERT result.status = 400
  ASSERT result.body.message IS string AND length > 0
END FOR
```

---

### Preservation Checking

#### Bug 3 — Scheduled Path Unchanged

```
FOR ALL (workout, today) WHERE NOT isBugCondition_3(workout, today) DO
  entry := workout.schedule.find(e => sameCalendarDay(e.scheduledDate, today) AND NOT e.completed)
  result := POST /workouts/{workout.id}/complete ({ scheduleEntryId: entry._id })
  ASSERT result.status = 200
  ASSERT result.body.workout.schedule.find(e => e._id = entry._id).completed = true
END FOR
```

#### Bug 5 — POST Refresh Still Mutates

```
FOR ALL request WHERE request.method = "POST" AND path MATCHES "/workouts/:id/ai-review" DO
  result := POST /workouts/{id}/ai-review
  ASSERT result.status = 200
  ASSERT result.body HAS KEYS { aiReview, missedWorkouts }
  ASSERT dbSnapshot(id).aiReview = result.body.aiReview
END FOR
```

#### Bug 6 — Valid Payloads Still Accepted

```
FOR ALL payload WHERE NOT isBugCondition_6(payload) DO
  result := POST /workouts (payload)
  ASSERT result.status = 201
END FOR
```

**Testing Approach for Properties 3, 5, 6:** Property-based testing is recommended because:
- It generates many random inputs automatically (e.g., random `sets` values, random
  exercise arrays, random schedule configurations).
- It catches boundary cases (e.g., `sets: 0` vs `sets: 1`, `restSeconds: -1` vs `0`).
- It provides strong guarantees that the fix does not regress valid inputs.

---

### Unit Tests

- **Bug 1:** Import `useWorkout`, call it inside a test component, assert all store fields
  are present and have correct types.
- **Bug 2:** Assert `app/(modals)/workout-execution.tsx` exists and renders
  `WorkoutExecutionScreen` with the `workoutId` param.
- **Bug 3:** Unit test `markWorkoutCompleted` controller with no `scheduleEntryId` — assert
  ad-hoc entry is created. Unit test with valid `scheduleEntryId` — assert existing entry
  is marked completed.
- **Bug 4:** Render `WorkoutsScreen` with mock plans, assert `FlatList` does not have
  `scrollEnabled={false}`, assert `contentContainerStyle` includes `paddingBottom: 100`.
- **Bug 5:** Unit test `getWorkoutAiReview` — assert `plan.save()` is never called.
  Unit test `refreshWorkoutAiReview` — assert `plan.save()` is called once.
- **Bug 6:** Unit test `validate(createWorkoutSchema)` with each invalid field in isolation.
  Assert HTTP 400 and correct `message` for each.
- **Bug 7:** Render `WorkoutsScreen`, tap "Schedule" on a plan card, assert date picker
  modal is visible. Confirm a date, assert `schedulePlan` is called with the chosen date.
- **Bug 8:** Render `WorkoutsScreen` with non-empty `templates`, assert `TemplateSelector`
  is in the tree. Render with empty `templates`, assert it is absent.

---

### Property-Based Tests

- **Bug 3 (Fix):** Generate random `WorkoutPlan` objects with no today's schedule entry.
  For each, call `POST /complete` without `scheduleEntryId`. Assert ad-hoc entry is always
  created with correct fields.
- **Bug 3 (Preservation):** Generate random `WorkoutPlan` objects that DO have a today's
  incomplete entry. For each, call `POST /complete` with the entry's `_id`. Assert the
  existing entry is marked completed and no extra entries are added.
- **Bug 5 (Fix):** Generate random plan IDs and send GET requests. Assert DB state is
  unchanged for all of them.
- **Bug 5 (Preservation):** Generate random plan IDs and send POST requests. Assert DB
  state is updated and response shape is correct for all of them.
- **Bug 6 (Fix):** Generate random exercise payloads where at least one field violates
  the schema. Assert HTTP 400 for all of them.
- **Bug 6 (Preservation):** Generate random exercise payloads where all fields are valid.
  Assert HTTP 201 for all of them.

---

### Integration Tests

- **Bug 2:** Full navigation flow — open workouts tab, tap "Start Workout" on a plan card,
  assert `WorkoutExecutionScreen` renders with the correct workout name and first exercise.
- **Bug 3:** Full completion flow — start an unscheduled workout, complete all exercises,
  assert completion modal appears AND a new schedule entry exists in the store.
- **Bug 5:** Full AI review flow — call GET (assert no DB change), then call POST (assert
  DB updated), then call GET again (assert returns updated data without re-mutating).
- **Bug 7:** Full scheduling flow — tap "Schedule", interact with date picker, select a
  future date, confirm, assert the plan's schedule array contains an entry for that date.
- **Bug 8:** Full template flow — open workouts tab with templates loaded, tap "Use
  Template" on a template card, assert navigation to workout-builder with the new plan's ID.
