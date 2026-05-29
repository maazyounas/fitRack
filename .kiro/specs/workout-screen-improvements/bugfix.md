# Bugfix Requirements Document

## Introduction

The workout feature in fitRack has a collection of bugs and gaps that together prevent users from reliably executing, completing, and scheduling workouts. The most critical issues are: (1) `useWorkout.ts` is an empty file that will crash any consumer, (2) `WorkoutExecutionScreen` is not reachable via any navigation route, (3) completing a workout silently does nothing when the session was not pre-scheduled for today, and (4) the workout list is unscrollable when many plans exist. On the backend, the AI-review endpoint mutates the database on a GET request, and exercise fields lack server-side validation. Two UX gaps round out the scope: scheduling is locked to today's date, and the `TemplateSelector` component is built but never rendered.

---

## Glossary

| Term | Definition |
|------|------------|
| Schedule entry | A subdocument in `WorkoutPlan.schedule` with `scheduledDate`, `completed`, `status`, and optional `completedAt` |
| Ad-hoc entry | A schedule entry created at completion time (not pre-scheduled) with `status: 'completed'` and `completed: true` |
| Streak | Count of consecutive calendar days on which at least one schedule entry has `completed: true` |
| System template | One of the three hardcoded templates (`beginner-full-body`, `intermediate-upper-lower`, `advanced-performance`) returned by `GET /workouts/templates` |
| Template key | The `key` field on a system template (e.g., `"beginner-full-body"`) used to identify it when calling `POST /workouts/templates/use` |

---

## Bug Analysis

### Current Behavior (Defect)

**Bug 1 — Empty `useWorkout` hook**

1.1 WHEN any component imports `useWorkout` from `frontend/hooks/useWorkout.ts` THEN the system returns `undefined` for the named export because the file contains no code, causing a runtime crash at the call site.

**Bug 2 — `WorkoutExecutionScreen` is unreachable**

1.2 WHEN a user navigates through the workouts tab THEN the system never presents `WorkoutExecutionScreen` because no route, link, or navigation call references it, making the entire workout-execution flow inaccessible.

**Bug 3 — Silent completion skip on unscheduled workouts**

1.3 WHEN a user completes all exercises in `WorkoutExecutionScreen` for a workout that has no schedule entry whose `scheduledDate` matches today's calendar date and whose `completed` is `false` THEN the system silently skips the `markCompleted` call, so no session is recorded, the streak is not updated, and the completion modal still appears giving false confirmation.

**Bug 4 — Unscrollable workout list**

1.4 WHEN a user has more workout plans than fit within the visible height of the workouts screen THEN the system renders a `FlatList` with `scrollEnabled={false}` inside a non-scrolling `View`, making plans below the fold permanently inaccessible by touch.

**Bug 5 — GET endpoint with database side effects**

1.5 WHEN a client sends `GET /workouts/:id/ai-review` THEN the system mutates the database by writing `aiReview` fields and setting schedule entry `status` to `'missed'`, violating HTTP semantics that require GET requests to be safe and idempotent.

**Bug 6 — No server-side validation on exercise fields**

1.6 WHEN a client submits `POST /workouts` or `PATCH /workouts/:id` with exercise values such as `sets: -5`, `reps: 0`, `restSeconds: -10`, or `intensity: "extreme"` THEN the system accepts and persists the data without returning a validation error, because no schema validation middleware is applied to workout routes.

**Bug 7 — Schedule locked to today's date**

1.7 WHEN a user taps "Schedule" on a workout plan card THEN the system always schedules it for today's ISO date string with no option to choose a future date, preventing users from planning workouts in advance.

**Bug 8 — `TemplateSelector` component is never rendered**

1.8 WHEN a user opens the workouts screen THEN the system never displays the `TemplateSelector` component despite it being fully implemented, so users cannot discover or apply workout templates from the UI.

---

### Expected Behavior (Correct)

**Bug 1 — Empty `useWorkout` hook**

2.1 WHEN any component calls `useWorkout()` imported from `frontend/hooks/useWorkout.ts` THEN the system SHALL return the full `useWorkoutStore()` state and actions (including `plans`, `templates`, `isLoading`, `initialize`, `createPlan`, `updatePlan`, `deletePlan`, `schedulePlan`, `markCompleted`, `applyTemplate`, and `refreshAiReview`) so consumers receive valid values without crashing.

**Bug 2 — `WorkoutExecutionScreen` is unreachable**

2.2 WHEN a user taps a "Start Workout" button on a workout plan card in the workouts tab THEN the system SHALL navigate to a screen that renders `WorkoutExecutionScreen` with the correct `workoutId` prop, so the execution flow is reachable from the workouts tab.

2.3 WHEN the user navigates to the workout execution screen THEN the system SHALL display the workout name, the first exercise, and the exercise counter (e.g., "1 / 3") before any user interaction.

**Bug 3 — Silent completion skip on unscheduled workouts**

2.4 WHEN a user completes all exercises in `WorkoutExecutionScreen` and the workout has at least one schedule entry whose `scheduledDate` matches today's calendar date and whose `completed` is `false` THEN the system SHALL call `POST /workouts/:id/complete` with that entry's `_id` as `scheduleEntryId`, mark it completed, and update the streak.

2.5 WHEN a user completes all exercises in `WorkoutExecutionScreen` and the workout has no schedule entry matching today's calendar date with `completed: false` THEN the system SHALL call `POST /workouts/:id/complete` without a `scheduleEntryId`, and the backend SHALL create an ad-hoc schedule entry with `scheduledDate` set to today, `completed: true`, `status: 'completed'`, and `completedAt` set to the current timestamp, so the session is always persisted and the streak is updated.

2.6 WHEN `POST /workouts/:id/complete` is called without a `scheduleEntryId` THEN the system SHALL accept the request, create the ad-hoc entry, save the plan, and return the updated plan with HTTP 200.

**Bug 4 — Unscrollable workout list**

2.7 WHEN the workouts screen renders a list of plans THEN the system SHALL use a scrollable container so that all plans are reachable by vertical scroll regardless of how many plans exist.

2.8 WHEN the workouts screen renders a list of plans THEN the system SHALL preserve a bottom padding of at least 80 dp so the last card is not obscured by the floating action button.

**Bug 5 — GET endpoint with database side effects**

2.9 WHEN a client sends `GET /workouts/:id/ai-review` THEN the system SHALL return the currently stored `aiReview` subdocument and the list of missed schedule entries without writing to the database, so the response is safe and idempotent.

2.10 WHEN a client sends `POST /workouts/:id/ai-review` THEN the system SHALL recompute the AI review, persist the updated `aiReview` subdocument, mark past-due incomplete schedule entries as `status: 'missed'`, save the plan, and return the same `{ aiReview, missedWorkouts }` response shape as before.

2.11 WHEN a client sends `POST /workouts/:id/ai-review` for a plan that does not exist or is not owned by the authenticated user THEN the system SHALL return HTTP 404.

2.12 WHEN the frontend calls `refreshAiReview(id)` in `workoutStore` THEN the system SHALL use `POST /workouts/:id/ai-review` and update the plan's `aiReview` in local state only on a successful response.

**Bug 6 — No server-side validation on exercise fields**

2.13 WHEN a client submits `POST /workouts` or `PATCH /workouts/:id` with at least one exercise where `sets < 1`, `reps < 1`, `restSeconds < 0`, or `intensity` is not one of `low | moderate | high` THEN the system SHALL reject the request with HTTP 400 and a response body containing a `message` field that identifies which field failed validation.

2.14 WHEN a client submits `POST /workouts` or `PATCH /workouts/:id` with a top-level payload where `name` is absent or empty, `difficulty` is not one of `beginner | intermediate | advanced`, or `estimatedDurationMinutes` is not a positive integer THEN the system SHALL reject the request with HTTP 400 and a response body containing a `message` field that identifies which field failed validation.

2.15 WHEN a client submits `POST /workouts` or `PATCH /workouts/:id` with all fields valid THEN the system SHALL accept the request and proceed as before.

**Bug 7 — Schedule locked to today's date**

2.16 WHEN a user taps "Schedule" on a workout plan card THEN the system SHALL present a date picker that allows the user to select any date from today onward.

2.17 WHEN the user confirms a date in the date picker THEN the system SHALL call `schedulePlan(planId, selectedDate)` with the chosen ISO date string and display a confirmation message that includes the selected date.

2.18 WHEN the user dismisses the date picker without selecting a date THEN the system SHALL not schedule the workout and SHALL not display a confirmation message.

**Bug 8 — `TemplateSelector` component is never rendered**

2.19 WHEN the workouts screen loads and `templates` in the store is non-empty THEN the system SHALL render the `TemplateSelector` component above the plan list, passing the `templates` array and an `onUseTemplate` handler.

2.20 WHEN the user taps "Use Template" on a template card THEN the system SHALL call `applyTemplate(template.key)` using the template's `key` field (for system templates) or `id` field (for user templates), create a new plan from that template, and navigate to the workout-builder modal with the new plan's ID so the user can customize it.

2.21 WHEN `applyTemplate` throws an error THEN the system SHALL display an alert with the error message and SHALL NOT navigate to the workout-builder modal.

2.22 WHEN the workouts screen loads and `templates` in the store is empty THEN the system SHALL NOT render the `TemplateSelector` component.

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user creates a new workout plan with valid data THEN the system SHALL CONTINUE TO persist the plan and return it with HTTP 201.

3.2 WHEN a user edits an existing workout plan THEN the system SHALL CONTINUE TO update only the supplied fields and return the updated plan.

3.3 WHEN a user deletes a workout plan THEN the system SHALL CONTINUE TO remove it and return HTTP 200 with a confirmation message.

3.4 WHEN a workout has a schedule entry matching today's date and the user completes it via `WorkoutExecutionScreen` THEN the system SHALL CONTINUE TO mark that entry as completed, update `completedAt`, and recalculate the streak.

3.5 WHEN exercise fields are valid (`sets` ≥ 1, `reps` ≥ 1, `restSeconds` ≥ 0, `intensity` in `{low, moderate, high}`) THEN the system SHALL CONTINUE TO accept and persist the exercise without error.

3.6 WHEN a user schedules a workout for a specific date THEN the system SHALL CONTINUE TO add a `scheduled` entry to the plan's schedule array and sync notifications.

3.7 WHEN a user applies a system template THEN the system SHALL CONTINUE TO create a new workout plan from that template and select it as the active plan.

3.8 WHEN the workout list contains fewer plans than the screen height THEN the system SHALL CONTINUE TO render the list without unnecessary scroll chrome.

3.9 WHEN `WorkoutExecutionScreen` is active and the user taps "End Workout" THEN the system SHALL CONTINUE TO navigate back without recording a completion.

3.10 WHEN a user calls `GET /workouts/:id/ai-review` after the read-only GET is restored THEN the system SHALL CONTINUE TO return the same `{ aiReview, missedWorkouts }` response shape so existing read-only callers are unaffected.

3.11 WHEN a user reorders exercises in the workout builder THEN the system SHALL CONTINUE TO update the local exercise list order without calling the backend reorder endpoint until the user saves.

---

## Bug Condition Pseudocode

### Bug 1 — Empty Hook

```pascal
FUNCTION isBugCondition_1(X)
  INPUT: X = import of useWorkout.ts
  OUTPUT: boolean
  RETURN fileIsEmpty(X.sourceFile)
END FUNCTION

// Fix Checking
FOR ALL X WHERE isBugCondition_1(X) DO
  result ← useWorkout'()
  ASSERT result IS NOT undefined
  ASSERT result.plans IS array
  ASSERT result.initialize IS function
  ASSERT result.createPlan IS function
END FOR

// Preservation Checking
FOR ALL X WHERE NOT isBugCondition_1(X) DO
  ASSERT useWorkout(X) = useWorkout'(X)
END FOR
```

### Bug 3 — Silent Completion Skip

```pascal
FUNCTION isBugCondition_3(workout, today)
  INPUT: workout of type WorkoutPlan, today of type Date
  OUTPUT: boolean
  RETURN NOT EXISTS entry IN workout.schedule WHERE
    sameCalendarDay(entry.scheduledDate, today)
    AND entry.completed = false
END FUNCTION

// Fix Checking — unscheduled path
FOR ALL (workout, today) WHERE isBugCondition_3(workout, today) DO
  result ← POST /workouts/{workout.id}/complete (no scheduleEntryId)
  ASSERT result.status = 200
  ASSERT EXISTS entry IN result.body.workout.schedule WHERE
    sameCalendarDay(entry.scheduledDate, today)
    AND entry.completed = true
    AND entry.status = 'completed'
    AND entry.completedAt IS NOT null
END FOR

// Preservation Checking — scheduled path unchanged
FOR ALL (workout, today) WHERE NOT isBugCondition_3(workout, today) DO
  entry ← workout.schedule.find(e => sameCalendarDay(e.scheduledDate, today) AND NOT e.completed)
  result ← POST /workouts/{workout.id}/complete ({ scheduleEntryId: entry._id })
  ASSERT result.status = 200
  ASSERT result.body.workout.schedule.find(e => e._id = entry._id).completed = true
END FOR
```

### Bug 5 — GET with Side Effects

```pascal
FUNCTION isBugCondition_5(request)
  INPUT: request of type HttpRequest
  OUTPUT: boolean
  RETURN request.method = "GET"
    AND request.path MATCHES "/workouts/:id/ai-review"
END FUNCTION

// Fix Checking — GET must not mutate
FOR ALL request WHERE isBugCondition_5(request) DO
  stateBefore ← dbSnapshot(request.params.id)
  result ← GET /workouts/{id}/ai-review
  stateAfter ← dbSnapshot(request.params.id)
  ASSERT stateBefore.aiReview = stateAfter.aiReview
  ASSERT stateBefore.schedule = stateAfter.schedule
  ASSERT result.status = 200
END FOR

// Fix Checking — POST triggers mutation
FOR ALL request WHERE request.method = "POST" AND path MATCHES "/workouts/:id/ai-review" DO
  result ← POST /workouts/{id}/ai-review
  ASSERT result.status = 200
  ASSERT result.body HAS KEYS { aiReview, missedWorkouts }
  ASSERT dbSnapshot(id).aiReview = result.body.aiReview
END FOR
```

### Bug 6 — Missing Validation

```pascal
FUNCTION isBugCondition_6(exercise)
  INPUT: exercise of type ExercisePayload
  OUTPUT: boolean
  RETURN exercise.sets < 1
    OR exercise.reps < 1
    OR exercise.restSeconds < 0
    OR exercise.intensity NOT IN {"low", "moderate", "high"}
END FUNCTION

// Fix Checking
FOR ALL exercise WHERE isBugCondition_6(exercise) DO
  result ← POST /workouts ({ exercises: [exercise], name: "Test", difficulty: "beginner", estimatedDurationMinutes: 30 })
  ASSERT result.status = 400
  ASSERT result.body.message IS string AND length > 0
END FOR

// Preservation Checking
FOR ALL exercise WHERE NOT isBugCondition_6(exercise) DO
  result ← POST /workouts ({ exercises: [exercise], name: "Test", difficulty: "beginner", estimatedDurationMinutes: 30 })
  ASSERT result.status = 201
END FOR
```
