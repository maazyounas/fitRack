# Implementation Plan

## Overview

This plan addresses 8 bugs in the fitRack workout feature spanning the full stack:

1. **Bug 1** — `useWorkout.ts` is an empty file that crashes any consumer
2. **Bug 2** — `WorkoutExecutionScreen` is unreachable (no route, no "Start Workout" button)
3. **Bug 3** — Completing an unscheduled workout silently skips `markCompleted` (no session recorded, no streak update)
4. **Bug 4** — The workout list `FlatList` has `scrollEnabled={false}`, making plans below the fold inaccessible
5. **Bug 5** — `GET /workouts/:id/ai-review` mutates the database, violating HTTP safety/idempotency
6. **Bug 6** — No Zod validation middleware on workout routes; invalid exercise fields are accepted and persisted
7. **Bug 7** — Scheduling is hardcoded to today's date with no date picker
8. **Bug 8** — `TemplateSelector` is fully implemented but never imported or rendered in `workouts.tsx`

The workflow follows the exploratory bugfix methodology: write tests on unfixed code first (tasks 1–2), then implement fixes (tasks 3–10), then validate (tasks 11–13), then checkpoint (task 14).

## Tasks

<!-- ============================================================
     PHASE 1 — EXPLORATION (write tests BEFORE any fix)
     ============================================================ -->

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Silent Completion Skip (Bug 3), GET Side Effects (Bug 5), Missing Validation (Bug 6)
  - **CRITICAL**: These tests MUST FAIL on unfixed code — failure confirms the bugs exist
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **GOAL**: Surface counterexamples that demonstrate each bug exists
  - **Scoped PBT Approach**: Scope each property to the concrete failing cases for reproducibility
  - Add the following test cases to `backend/src/__tests__/workouts.test.ts`:
    - **Bug 3 exploration**: Create a workout with no schedule entries. Call `POST /workouts/:id/complete` with no body. Assert response is HTTP 404 (unfixed code throws "Scheduled workout not found."). Document counterexample: `POST /complete` with no `scheduleEntryId` → 404 instead of 200 with ad-hoc entry.
    - **Bug 5 exploration**: Create a workout with a past-due incomplete schedule entry. Snapshot `plan.aiReview` and `plan.schedule` from DB before the GET. Send `GET /workouts/:id/ai-review`. Re-fetch plan from DB. Assert `plan.aiReview` or `plan.schedule` changed (confirms mutation). Document counterexample: GET mutates `aiReview` and sets `status: 'missed'`.
    - **Bug 6 exploration**: Send `POST /workouts` with `exercises: [{ sets: 0, ... }]`. Assert response is HTTP 201 (unfixed code accepts it). Repeat for `reps: -1`, `intensity: "extreme"`, `name: ""`. Document counterexamples: all return 201 instead of 400.
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: All three exploration tests FAIL (Bug 3 → 404, Bug 5 → DB mutated, Bug 6 → 201 accepted)
  - Document all counterexamples found to understand root causes
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.3, 1.5, 1.6_


- [x] 2. Write preservation property tests (BEFORE implementing any fix)
  - **Property 2: Preservation** - Scheduled Completion, POST AI Review Mutation, Valid Exercise Acceptance
  - **IMPORTANT**: Follow observation-first methodology — observe UNFIXED code behavior for non-buggy inputs
  - Add the following preservation test cases to `backend/src/__tests__/workouts.test.ts`:
    - **Bug 3 preservation**: Create a workout with a schedule entry for today (not completed). Call `POST /workouts/:id/complete` with `scheduleEntryId`. Observe: HTTP 200, entry marked `completed: true`. Write property: for all workouts with a today's incomplete entry, `POST /complete` with that entry's `_id` returns 200 and marks it completed. Verify PASSES on unfixed code.
    - **Bug 5 preservation**: Send `POST /workouts/:id/ai-review` (does not exist yet on unfixed code — note this as expected 404 and mark as baseline to verify after fix). For the read-only GET shape: observe `{ aiReview, missedWorkouts }` response keys are present. Write property: GET always returns those two keys with HTTP 200.
    - **Bug 6 preservation**: Send `POST /workouts` with all valid fields (`sets: 3`, `reps: 10`, `restSeconds: 60`, `intensity: "moderate"`, `name: "Test"`, `difficulty: "beginner"`, `estimatedDurationMinutes: 30`). Observe: HTTP 201. Write property: for all payloads where no field violates the bug condition, `POST /workouts` returns 201. Verify PASSES on unfixed code.
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Bug 3 and Bug 6 preservation tests PASS; Bug 5 POST preservation is noted as pending (POST route doesn't exist yet)
  - Mark task complete when tests are written, run, and passing baseline is documented
  - _Requirements: 2.4, 2.9, 2.15, 3.1, 3.4, 3.5, 3.10_


<!-- ============================================================
     PHASE 2 — IMPLEMENTATION (fixes in dependency order)
     ============================================================ -->

- [x] 3. Fix Bug 1 — Implement `useWorkout` hook

  - [x] 3.1 Implement the hook body
    - File: `frontend/hooks/useWorkout.ts`
    - Add `import { useWorkoutStore } from '@/store/workoutStore';`
    - Export `useWorkout` function that returns `useWorkoutStore()`
    - Mirror the exact pattern used in `frontend/hooks/useAuth.ts`
    - Resulting file is a two-liner: import + export function
    - _Bug_Condition: `isBugCondition_1(X)` — `X.useWorkout` is `undefined` or not a function_
    - _Expected_Behavior: `useWorkout()` returns the full `useWorkoutStore()` state including `plans`, `templates`, `isLoading`, `initialize`, `createPlan`, `updatePlan`, `deletePlan`, `schedulePlan`, `markCompleted`, `applyTemplate`, `refreshAiReview`_
    - _Preservation: All existing consumers of `useWorkoutStore` directly are unaffected; no store logic changes_
    - _Requirements: 2.1_


- [x] 4. Fix Bug 4 — Fix unscrollable workout list

  - [x] 4.1 Remove `scrollEnabled={false}` from the FlatList
    - File: `frontend/app/(tabs)/workouts.tsx`
    - Remove the `scrollEnabled={false}` prop from the `FlatList` component (line ~130)
    - The `FlatList` becomes the scroll container — no `ScrollView` wrapper needed
    - Preserve `contentContainerStyle={styles.list}` which already has `paddingBottom: 100`
    - Verify `styles.list.paddingBottom` is at least 80 dp (currently 100 — no change needed)
    - _Bug_Condition: `isBugCondition_4(screen)` — `FlatList.scrollEnabled = false` AND container is not a `ScrollView`_
    - _Expected_Behavior: All plans are reachable by vertical scroll; last card is not obscured by the FAB_
    - _Preservation: When fewer plans exist than screen height, no unnecessary scroll chrome appears; `contentContainerStyle` padding is unchanged_
    - _Requirements: 2.7, 2.8, 3.8_


- [x] 5. Fix Bug 6 — Add Zod validation schemas and apply to workout routes

  - [x] 5.1 Create `workoutSchemas.ts`
    - File: `backend/src/schemas/workoutSchemas.ts` *(new file)*
    - Define `exerciseSchema` with:
      - `name`: `z.string().min(1, 'Exercise name is required')`
      - `muscleGroup`: `z.string().min(1, 'Muscle group is required')`
      - `equipment`: `z.string().optional().default('Bodyweight')`
      - `sets`: `z.number().int().min(1, 'sets must be at least 1')`
      - `reps`: `z.number().int().min(1, 'reps must be at least 1')`
      - `restSeconds`: `z.number().int().min(0, 'restSeconds must be 0 or greater')`
      - `notes`: `z.string().optional().default('')`
      - `intensity`: `z.enum(['low', 'moderate', 'high'], { errorMap: () => ({ message: 'intensity must be low, moderate, or high' }) })`
      - `order`: `z.number().int().min(1)`
      - `_id`: `z.string().optional()` (allow client-provided IDs to pass through)
    - Define `createWorkoutSchema` with:
      - `name`: `z.string().min(1, 'Workout name is required')`
      - `description`: `z.string().optional().default('')`
      - `difficulty`: `z.enum(['beginner', 'intermediate', 'advanced'])`
      - `estimatedDurationMinutes`: `z.number().int().min(1, 'estimatedDurationMinutes must be a positive integer')`
      - `exercises`: `z.array(exerciseSchema).min(1, 'At least one exercise is required')`
      - `isTemplate`: `z.boolean().optional()`
      - `sourceTemplateKey`: `z.string().optional()`
    - Define `updateWorkoutSchema` as `createWorkoutSchema.partial()` (all fields optional; if `exercises` is present it must still satisfy `exerciseSchema`)
    - _Requirements: 2.13, 2.14, 2.15_

  - [x] 5.2 Apply validation middleware to workout routes
    - File: `backend/src/routes/workoutRoutes.ts`
    - Import `validate` from `'../middleware/validate'`
    - Import `createWorkoutSchema` and `updateWorkoutSchema` from `'../schemas/workoutSchemas'`
    - Change `workoutRoutes.post('/', createWorkoutPlan)` → `workoutRoutes.post('/', validate(createWorkoutSchema), createWorkoutPlan)`
    - Change `workoutRoutes.patch('/:id', updateWorkoutPlan)` → `workoutRoutes.patch('/:id', validate(updateWorkoutSchema), updateWorkoutPlan)`
    - All other routes remain unchanged
    - _Bug_Condition: `isBugCondition_6(payload)` — any exercise with `sets < 1`, `reps < 1`, `restSeconds < 0`, `intensity` not in `{low, moderate, high}`, or top-level `name` empty / `difficulty` invalid / `estimatedDurationMinutes ≤ 0`_
    - _Expected_Behavior: HTTP 400 with `{ message: 'Validation failed.', errors: [...] }` for any invalid payload_
    - _Preservation: Valid payloads continue to return HTTP 201 (create) or HTTP 200 (update) unchanged_
    - _Requirements: 2.13, 2.14, 2.15, 3.1, 3.2, 3.5_


- [x] 6. Fix Bug 5 — Split AI review GET (read-only) / POST (refresh) endpoints

  - [x] 6.1 Refactor `workoutController.ts` — make GET read-only, add POST refresh handler
    - File: `backend/src/controllers/workoutController.ts`
    - Rename the existing `getWorkoutAiReview` function to `refreshWorkoutAiReview`
      - Keep all mutation logic: `analyzeWorkoutPlan`, `plan.aiReview = aiReview`, schedule `status: 'missed'` marking, `plan.save()`
      - Return `{ aiReview, missedWorkouts }` as before
    - Add a new `getWorkoutAiReview` function (read-only):
      - Fetch the plan with `WorkoutPlanModel.findOne({ _id: req.params.id, ownerId: req.userId })`
      - Return HTTP 404 if not found
      - Return `{ aiReview: plan.aiReview, missedWorkouts: getMissedWorkouts(plan.schedule).map(...) }`
      - Do NOT call `analyzeWorkoutPlan`, do NOT call `plan.save()`
    - Export both `getWorkoutAiReview` and `refreshWorkoutAiReview`
    - _Bug_Condition: `isBugCondition_5(request)` — `request.method = "GET"` AND path matches `/workouts/:id/ai-review`_
    - _Expected_Behavior (GET): DB state of `aiReview` and `schedule` is identical before and after; response returns `{ aiReview, missedWorkouts }` with HTTP 200_
    - _Expected_Behavior (POST): Recomputes AI review, persists it, marks past-due entries `status: 'missed'`, returns `{ aiReview, missedWorkouts }` with HTTP 200_
    - _Preservation: Response shape `{ aiReview, missedWorkouts }` is unchanged for GET callers; POST 404 for non-existent/unowned plans_
    - _Requirements: 2.9, 2.10, 2.11, 3.10_

  - [x] 6.2 Register the new POST route in `workoutRoutes.ts`
    - File: `backend/src/routes/workoutRoutes.ts`
    - Import `refreshWorkoutAiReview` from `'../controllers/workoutController'`
    - Keep existing: `workoutRoutes.get('/:id/ai-review', getWorkoutAiReview)` (now points to read-only handler)
    - Add: `workoutRoutes.post('/:id/ai-review', refreshWorkoutAiReview)`
    - _Requirements: 2.10, 2.11_

  - [x] 6.3 Add `refreshWorkoutAiReview` API function in frontend
    - File: `frontend/services/api/workout.ts`
    - Keep `fetchWorkoutAiReview` using GET (unchanged — read-only callers unaffected)
    - Add new function `refreshWorkoutAiReview(accessToken: string, id: string)` that calls `POST /workouts/${id}/ai-review` with no body
    - Return type: `{ aiReview: WorkoutAiReview; missedWorkouts: WorkoutScheduleEntry[] }`
    - _Requirements: 2.12_

  - [x] 6.4 Update `workoutStore.ts` — `refreshAiReview` action uses POST
    - File: `frontend/store/workoutStore.ts`
    - Import `refreshWorkoutAiReview` from `'@/services/api/workout'`
    - In the `refreshAiReview` action, replace `fetchWorkoutAiReview(accessToken, id)` with `refreshWorkoutAiReview(accessToken, id)`
    - Update local state with `response.aiReview` on success (logic unchanged)
    - _Requirements: 2.12_


- [x] 7. Fix Bug 3 — Make `scheduleEntryId` optional in the completion flow

  - [x] 7.1 Update `markWorkoutCompleted` controller to support ad-hoc entries
    - File: `backend/src/controllers/workoutController.ts`
    - Make `scheduleEntryId` optional in the destructured body: `const { scheduleEntryId } = req.body as { scheduleEntryId?: string }`
    - When `scheduleEntryId` is provided: find the matching entry by `entry.id === scheduleEntryId`; if not found, throw `HttpError(404, 'Scheduled workout not found.')`; mark it `completed: true`, `status: 'completed'`, `completedAt: new Date()`
    - When `scheduleEntryId` is absent: push a new ad-hoc entry: `{ scheduledDate: new Date(), status: 'completed', completed: true, completedAt: new Date() }`
    - Call `plan.save()` and return `{ workout: normalizePlan(plan) }` with HTTP 200 in both paths
    - Remove the unconditional 404 throw that fires when no entry is found
    - _Bug_Condition: `isBugCondition_3(workout, today)` — no schedule entry with `sameCalendarDay(scheduledDate, today)` AND `completed = false`_
    - _Expected_Behavior: HTTP 200; response body contains a schedule entry where `sameCalendarDay(entry.scheduledDate, today)` is true, `entry.completed = true`, `entry.status = 'completed'`, `entry.completedAt` is not null_
    - _Preservation: When `scheduleEntryId` is provided and valid, existing entry is marked completed exactly as before; no extra entries are added_
    - _Requirements: 2.5, 2.6, 3.4_

  - [x] 7.2 Update `completeWorkout` API function to accept optional `scheduleEntryId`
    - File: `frontend/services/api/workout.ts`
    - Change signature: `completeWorkout(accessToken: string, id: string, scheduleEntryId?: string)`
    - Include `scheduleEntryId` in the request body only when it is defined: `body: scheduleEntryId ? { scheduleEntryId } : {}`
    - _Requirements: 2.5, 2.6_

  - [x] 7.3 Update `markCompleted` action in `workoutStore.ts` to accept optional `scheduleEntryId`
    - File: `frontend/store/workoutStore.ts`
    - Change type signature: `markCompleted: (id: string, scheduleEntryId?: string) => Promise<WorkoutPlan>`
    - Pass `scheduleEntryId` to `completeWorkout` only when it is defined (already handled by step 7.2)
    - Streak recalculation and local state update logic remain unchanged
    - _Requirements: 2.4, 2.5_

  - [x] 7.4 Fix `handleWorkoutComplete` in `WorkoutExecutionScreen` to always call `markCompleted`
    - File: `frontend/components/workouts/WorkoutExecutionScreen.tsx`
    - Remove the `if (scheduleEntry?.['_id'])` guard that silently skips the call
    - Always call `await markCompleted(workout.id, scheduleEntry?.['_id'])` — pass the `_id` when found, omit it when not
    - The completion modal (`setShowCompletion(true)`) continues to show after a successful call
    - _Bug_Condition: `isBugCondition_3(workout, today)` — no today's incomplete schedule entry exists_
    - _Expected_Behavior: `markCompleted` is always called; streak is always updated; session is always persisted_
    - _Preservation: When a today's entry exists, it is passed as `scheduleEntryId` and marked completed as before (Requirement 3.4); "End Workout" path (handleAbort) is unchanged (Requirement 3.9)_
    - _Requirements: 2.4, 2.5, 3.4, 3.9_


- [x] 8. Fix Bug 2 — Create workout execution route and "Start Workout" button

  - [x] 8.1 Create the Expo Router modal route file
    - File: `frontend/app/(modals)/workout-execution.tsx` *(new file)*
    - Import `useLocalSearchParams` and `useRouter` from `'expo-router'`
    - Import `WorkoutExecutionScreen` from `'@/components/workouts/WorkoutExecutionScreen'`
    - Read `workoutId` from `useLocalSearchParams<{ workoutId?: string }>()`
    - If `workoutId` is absent, render a fallback `<Text>No workout selected</Text>` inside a centered `<View>`
    - Otherwise render `<WorkoutExecutionScreen workoutId={workoutId} />`
    - Export as default function `WorkoutExecutionModal`
    - Mirror the structure of `frontend/app/(modals)/workout-builder.tsx`
    - _Bug_Condition: `isBugCondition_2(navigation)` — no route in the navigation graph renders `WorkoutExecutionScreen`_
    - _Expected_Behavior: `router.push({ pathname: '/(modals)/workout-execution', params: { workoutId: plan.id } })` resolves and renders `WorkoutExecutionScreen` with the correct `workoutId` prop_
    - _Requirements: 2.2, 2.3_

  - [x] 8.2 Add "Start Workout" button to each plan card in `workouts.tsx`
    - File: `frontend/app/(tabs)/workouts.tsx`
    - In the `FlatList` `renderItem`, add a "Start Workout" `Pressable` button to the card's action row (alongside the existing "Schedule" button)
    - On press: `router.push({ pathname: '/(modals)/workout-execution', params: { workoutId: plan.id } } as never)`
    - Style the button consistently with the existing card action buttons (use `Button` component with `tone="primary"` or a `Pressable` with teal styling)
    - Place the "Start Workout" button before the "Schedule" button in the row
    - _Requirements: 2.2, 2.3_


- [x] 9. Fix Bug 7 — Add date picker for scheduling

  - [x] 9.1 Add date picker state and modal to `workouts.tsx`
    - File: `frontend/app/(tabs)/workouts.tsx`
    - Add state variables:
      - `showDatePicker: boolean` (default `false`)
      - `datePickerPlanId: string | null` (default `null`)
      - `pickedDate: Date` (default `new Date()`)
    - Replace the existing `handleSchedule` function with a new handler that sets `showDatePicker = true` and `datePickerPlanId = planId` instead of immediately calling `schedulePlan`
    - Install / import `DateTimePicker` from `'@react-native-community/datetimepicker'` (already a common RN dependency; check `package.json` first — add if missing)
    - Render a date picker modal below the existing create-workout modal:
      - Show when `showDatePicker` is true
      - Pass `minimumDate={new Date()}` so past dates are not selectable
      - Pass `value={pickedDate}` and `onChange={(_, date) => date && setPickedDate(date)}`
      - On iOS: wrap in a `Modal` with "Confirm" and "Cancel" buttons
      - On Android: the picker dismisses automatically; handle `onChange` directly
      - On confirm: call `await schedulePlan(datePickerPlanId!, pickedDate.toISOString().split('T')[0])`, show `Alert.alert('Scheduled', \`Workout scheduled for ${pickedDate.toLocaleDateString()}.\`)`, close picker
      - On cancel/dismiss: set `showDatePicker = false`, do NOT call `schedulePlan`
    - Update the "Schedule" button `onPress` in the `FlatList` `renderItem` to call the new handler
    - _Bug_Condition: `isBugCondition_7(interaction)` — user taps "Schedule" and `scheduledDate` is always today with no date picker present_
    - _Expected_Behavior: Date picker is presented; user can select any date from today onward; confirmation alert includes the selected date; dismissing without selecting does not schedule_
    - _Preservation: Confirming a date still calls `schedulePlan(planId, isoDate)` and syncs notifications (Requirement 3.6)_
    - _Requirements: 2.16, 2.17, 2.18, 3.6_


- [x] 10. Fix Bug 8 — Render `TemplateSelector` in the workouts screen

  - [x] 10.1 Import and render `TemplateSelector` in `workouts.tsx`
    - File: `frontend/app/(tabs)/workouts.tsx`
    - Import `TemplateSelector` from `'@/components/workouts/TemplateSelector'`
    - Destructure `templates` and `applyTemplate` from `useWorkoutStore()` (add to existing destructure)
    - Implement `handleUseTemplate(template: WorkoutTemplate)`:
      - Call `const newPlan = await applyTemplate(template.key ?? template.id)`
      - On success: navigate to `router.push({ pathname: '/(modals)/workout-builder', params: { planId: newPlan.id } } as never)`
      - On error: `Alert.alert('Error', error instanceof Error ? error.message : 'Failed to apply template.')` — do NOT navigate
    - Above the plan list (and above the empty state), conditionally render:
      ```tsx
      {templates.length > 0 && (
        <TemplateSelector
          templates={templates}
          onUseTemplate={handleUseTemplate}
        />
      )}
      ```
    - Wrap the `TemplateSelector` + plan list in a `ScrollView` if needed, OR place `TemplateSelector` as a `ListHeaderComponent` on the `FlatList` so scrolling works naturally with the list
    - When `templates` is empty, `TemplateSelector` is not rendered (Requirement 2.22)
    - _Bug_Condition: `isBugCondition_8(screen)` — `TemplateSelector` is absent from the rendered tree when `templates` is non-empty_
    - _Expected_Behavior: `TemplateSelector` renders above the plan list when `templates.length > 0`; tapping "Use Template" calls `applyTemplate` and navigates to workout-builder on success_
    - _Preservation: Applying a system template continues to create a new plan and select it as active (Requirement 3.7); error path shows alert and does not navigate (Requirement 2.21)_
    - _Requirements: 2.19, 2.20, 2.21, 2.22, 3.7_


<!-- ============================================================
     PHASE 3 — VALIDATION (re-run tests on fixed code)
     ============================================================ -->

- [x] 11. Fix for all 8 bugs — verify exploration test now passes

  - [x] 11.1 Verify Bug 3 exploration test now passes
    - **Property 1: Expected Behavior** - Ad-hoc Completion Entry Created
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 calls `POST /workouts/:id/complete` with no body on a workout with no schedule entries
    - **EXPECTED OUTCOME**: Test PASSES — HTTP 200, response contains a schedule entry with `sameCalendarDay(scheduledDate, today) = true`, `completed = true`, `status = 'completed'`, `completedAt` not null
    - _Requirements: 2.5, 2.6_

  - [x] 11.2 Verify Bug 5 exploration test now passes
    - **Property 1: Expected Behavior** - GET AI Review Is Read-Only
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test snapshots DB state before and after `GET /workouts/:id/ai-review`
    - **EXPECTED OUTCOME**: Test PASSES — `stateBefore.aiReview` equals `stateAfter.aiReview`; `stateBefore.schedule` equals `stateAfter.schedule`; HTTP 200 with `{ aiReview, missedWorkouts }`
    - _Requirements: 2.9, 3.10_

  - [x] 11.3 Verify Bug 6 exploration test now passes
    - **Property 1: Expected Behavior** - Invalid Exercise Payload Rejected
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test sends `POST /workouts` with `sets: 0`, `reps: -1`, `intensity: "extreme"`, `name: ""`
    - **EXPECTED OUTCOME**: Test PASSES — all invalid payloads return HTTP 400 with a non-empty `message` string
    - _Requirements: 2.13, 2.14_

- [x] 12. Verify preservation tests still pass

  - [x] 12.1 Verify Bug 3 preservation test still passes
    - **Property 2: Preservation** - Scheduled Completion Path Unchanged
    - **IMPORTANT**: Re-run the SAME test from task 2 — do NOT write a new test
    - **EXPECTED OUTCOME**: Test PASSES — `POST /complete` with a valid `scheduleEntryId` still returns HTTP 200 and marks the existing entry `completed: true`; no extra entries are added
    - _Requirements: 2.4, 3.4_

  - [x] 12.2 Verify Bug 5 preservation test still passes
    - **Property 2: Preservation** - POST AI Review Still Mutates
    - **IMPORTANT**: Re-run the SAME test from task 2 — do NOT write a new test
    - **EXPECTED OUTCOME**: Test PASSES — `POST /workouts/:id/ai-review` returns HTTP 200 with `{ aiReview, missedWorkouts }`; DB `aiReview` matches response body
    - _Requirements: 2.10, 2.11_

  - [x] 12.3 Verify Bug 6 preservation test still passes
    - **Property 2: Preservation** - Valid Exercise Payload Accepted
    - **IMPORTANT**: Re-run the SAME test from task 2 — do NOT write a new test
    - **EXPECTED OUTCOME**: Test PASSES — `POST /workouts` with all valid fields returns HTTP 201
    - _Requirements: 2.15, 3.1, 3.5_


<!-- ============================================================
     PHASE 4 — BACKEND TEST SUITE (Bugs 3, 5, 6)
     ============================================================ -->

- [x] 13. Add/update backend tests for Bugs 3, 5, and 6

  - [x] 13.1 Add Bug 3 backend tests to `workouts.test.ts`
    - File: `backend/src/__tests__/workouts.test.ts`
    - Add `describe('POST /api/workouts/:id/complete', ...)` block with:
      - **Ad-hoc path**: Create a workout with no schedule entries. Call `POST /workouts/:id/complete` with no body. Assert HTTP 200. Assert `res.body.workout.schedule` has exactly one entry where `completed = true`, `status = 'completed'`, `completedAt` is not null, and `scheduledDate` is today's date.
      - **Scheduled path (preservation)**: Create a workout with a schedule entry for today. Call `POST /workouts/:id/complete` with `{ scheduleEntryId: entry._id }`. Assert HTTP 200. Assert the existing entry is marked `completed: true`. Assert no extra entries were added.
      - **Invalid ID path**: Call `POST /workouts/:id/complete` with a non-existent `scheduleEntryId`. Assert HTTP 404.
    - _Requirements: 2.5, 2.6, 3.4_

  - [x] 13.2 Add Bug 5 backend tests to `workouts.test.ts`
    - File: `backend/src/__tests__/workouts.test.ts`
    - Add `describe('GET /api/workouts/:id/ai-review (read-only)', ...)` block with:
      - **Read-only GET**: Create a workout. Record `plan.aiReview` and `plan.schedule` from DB. Send `GET /workouts/:id/ai-review`. Re-fetch plan from DB. Assert `plan.aiReview` and `plan.schedule` are unchanged. Assert HTTP 200 with `{ aiReview, missedWorkouts }` keys.
      - **GET on non-existent plan**: Assert HTTP 404.
    - Add `describe('POST /api/workouts/:id/ai-review (refresh)', ...)` block with:
      - **POST triggers mutation**: Create a workout with a past-due incomplete schedule entry. Send `POST /workouts/:id/ai-review`. Assert HTTP 200 with `{ aiReview, missedWorkouts }`. Re-fetch plan from DB. Assert `plan.aiReview` matches response body. Assert past-due entry has `status: 'missed'`.
      - **POST on non-existent plan**: Assert HTTP 404.
    - _Requirements: 2.9, 2.10, 2.11, 3.10_

  - [x] 13.3 Add Bug 6 backend tests to `workouts.test.ts`
    - File: `backend/src/__tests__/workouts.test.ts`
    - Add `describe('POST /api/workouts — validation', ...)` block with:
      - **Invalid `sets`**: Send `{ name: 'T', difficulty: 'beginner', estimatedDurationMinutes: 30, exercises: [{ ...validExercise, sets: 0 }] }`. Assert HTTP 400, `res.body.message` is a non-empty string.
      - **Invalid `reps`**: Same with `reps: -1`. Assert HTTP 400.
      - **Invalid `restSeconds`**: Same with `restSeconds: -10`. Assert HTTP 400.
      - **Invalid `intensity`**: Same with `intensity: 'extreme'`. Assert HTTP 400.
      - **Empty `name`**: Send `{ name: '', ... }`. Assert HTTP 400.
      - **Invalid `difficulty`**: Send `{ difficulty: 'expert', ... }`. Assert HTTP 400.
      - **Invalid `estimatedDurationMinutes`**: Send `{ estimatedDurationMinutes: 0, ... }`. Assert HTTP 400.
      - **Valid payload (preservation)**: Send a fully valid payload. Assert HTTP 201.
    - Add `describe('PATCH /api/workouts/:id — validation', ...)` block with:
      - **Invalid exercise in PATCH**: Create a plan, then PATCH with `exercises: [{ ...validExercise, sets: 0 }]`. Assert HTTP 400.
      - **Valid PATCH (preservation)**: PATCH with valid fields. Assert HTTP 200.
    - _Requirements: 2.13, 2.14, 2.15, 3.1, 3.2, 3.5_


<!-- ============================================================
     PHASE 5 — CHECKPOINT
     ============================================================ -->

- [x] 14. Checkpoint — Ensure all tests pass
  - Run the full backend test suite: `cd backend && npx jest --runInBand`
  - Confirm all tests in `workouts.test.ts` pass (exploration, preservation, and new unit tests)
  - Confirm no regressions in `auth.test.ts`, `community.test.ts`, `progress.test.ts`
  - Manually verify frontend changes:
    - `useWorkout()` returns store state without crashing
    - Tapping "Start Workout" on a plan card navigates to `WorkoutExecutionScreen`
    - Completing a workout with no today's schedule entry records a session and updates the streak
    - The workout list scrolls when more plans exist than fit on screen
    - Tapping "Schedule" presents a date picker; confirming schedules for the chosen date; dismissing does nothing
    - `TemplateSelector` renders above the plan list when templates are available; tapping "Use Template" creates a plan and opens the workout builder
  - Ask the user if any questions arise before marking complete
  - _Requirements: All (1.1–1.8, 2.1–2.22, 3.1–3.11)_

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": [1, 2] },
    { "wave": 2, "tasks": [3, 4, 5, 6] },
    { "wave": 3, "tasks": [7] },
    { "wave": 4, "tasks": [8, 9, 10] },
    { "wave": 5, "tasks": [11, 12] },
    { "wave": 6, "tasks": [13] },
    { "wave": 7, "tasks": [14] }
  ]
}
```

**Key dependencies:**
- Tasks 3, 4, 5, 6 have no inter-dependencies and can be implemented in any order
- Task 7 (Bug 3) must be complete before Task 8 (Bug 2) since the execution screen relies on the fixed `markCompleted` signature
- Tasks 9 and 10 both modify `workouts.tsx` — implement sequentially to avoid conflicts
- Tasks 11 and 12 re-run tests from Tasks 1 and 2 — all implementation tasks (3–10) must be complete first
- Task 13 adds the full backend test suite — depends on Tasks 5, 6, 7 being implemented
- Task 14 is the final checkpoint — depends on all prior tasks

## Notes

- **`@react-native-community/datetimepicker`**: Check `frontend/package.json` before installing. Expo managed workflow may already include it via `expo-modules`. If not present, run `npx expo install @react-native-community/datetimepicker`.
- **`workoutSchemas.ts` pattern**: Follow the exact Zod pattern from `backend/src/schemas/authSchemas.ts` and the `validate` middleware in `backend/src/middleware/validate.ts`. The `validate` middleware expects a Zod schema and returns a 400 with `{ message, errors }` on failure.
- **`scheduleEntry._id` vs `scheduleEntry.id`**: Mongoose subdocuments expose both `.id` (string virtual) and `._id` (ObjectId). The backend controller uses `entry.id` for lookup; the frontend type uses `_id?: string`. Both refer to the same value — the frontend passes `_id` and the backend compares with `.id`.
- **`TemplateSelector` as `ListHeaderComponent`**: Using `ListHeaderComponent` on the `FlatList` is preferred over a separate `ScrollView` wrapper because it keeps the template cards and plan list in a single scroll container, avoiding nested scroll conflicts.
- **Exploration tests (Tasks 1–2)**: These tests are intentionally written to fail on unfixed code. Do not skip them — they serve as the formal proof that the bugs exist before any fix is applied.
- **Backend test runner**: Use `npx jest --runInBand` (not `--watch`) to run tests in CI-compatible single-pass mode. The test helpers use an in-memory MongoDB instance via `mongodb-memory-server`.
