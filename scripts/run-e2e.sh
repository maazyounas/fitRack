#!/usr/bin/env bash
set -euo pipefail
OUTDIR="$(pwd)/reports"
mkdir -p "$OUTDIR"
LOGIN_RESP="$OUTDIR/login.json"
HEALTH="$OUTDIR/health.json"
AI_RECO="$OUTDIR/ai_recommendation.json"
WORKOUT_CREATE="$OUTDIR/workout_create.json"
WORKOUT_LIST="$OUTDIR/workout_list.json"
SCHEDULE_RESP="$OUTDIR/workout_schedule.json"
AI_REVIEW="$OUTDIR/workout_ai_review.json"
PROGRESS_CREATE="$OUTDIR/progress_create.json"
PROGRESS_LIST="$OUTDIR/progress_list.json"
COMM_CREATE="$OUTDIR/community_create.json"
COMM_LIST="$OUTDIR/community_list.json"
NUTR_MEAL="$OUTDIR/nutrition_meal.json"
NUTR_DASH="$OUTDIR/nutrition_dashboard.json"
NUTR_PDF="$OUTDIR/nutrition_report.pdf"
NUTR_RECO="$OUTDIR/nutrition_reco.json"

# Login
curl -sS -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" --data-binary @- > "$LOGIN_RESP" <<'JSON'
{"identifier":"tester+1@example.com","password":"P@ssw0rd123"}
JSON

TOKEN=$(python3 -c "import json,sys;print(json.load(open('$LOGIN_RESP')).get('accessToken',''))")
if [ -z "$TOKEN" ]; then echo "Failed to obtain token"; cat "$LOGIN_RESP"; exit 2; fi

echo "Using token length ${#TOKEN}"

# Health
curl -sS http://localhost:4000/api/health > "$HEALTH"

# AI recommendation
curl -sS -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/ai/recommendations/workout > "$AI_RECO"

# Workouts: create -> list -> schedule -> ai-review
curl -sS -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -X POST http://localhost:4000/api/workouts --data-binary @- > "$WORKOUT_CREATE" <<'JSON'
{"name":"E2E Test Plan","description":"Created by E2E script","exercises":[{"name":"E2E Squat","muscleGroup":"Legs","equipment":"Bodyweight","sets":3,"reps":8,"restSeconds":60,"notes":"Test notes","intensity":"low","order":1}]}
JSON

curl -sS -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/workouts > "$WORKOUT_LIST"

WORKOUT_ID=$(python3 -c "import json;print(json.load(open('$WORKOUT_CREATE')).get('workout',{}).get('id',''))")
if [ -n "$WORKOUT_ID" ]; then
  SCHEDULE_DATE=$(date -u -d "+1 minute" --iso-8601=seconds)
  curl -sS -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" http://localhost:4000/api/workouts/$WORKOUT_ID/schedule --data-binary @- > "$SCHEDULE_RESP" <<JSON
{"scheduledDate":"$SCHEDULE_DATE"}
JSON
  curl -sS -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/workouts/$WORKOUT_ID/ai-review > "$AI_REVIEW"
fi

# Progress
curl -sS -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" http://localhost:4000/api/progress --data-binary @- > "$PROGRESS_CREATE" <<'JSON'
{"weightKg":80,"measurements":{"waistCm":90},"gymPerformance":[{"exerciseName":"E2E Squat","weightKg":80,"reps":5,"sets":3}],"notes":"E2E progress"}
JSON

curl -sS -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/progress > "$PROGRESS_LIST"

# Community
curl -sS -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" http://localhost:4000/api/community/posts --data-binary @- > "$COMM_CREATE" <<'JSON'
{"content":"E2E test post from script"}
JSON

curl -sS -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/community > "$COMM_LIST"

# Nutrition: create meal, dashboard, recommendations, PDF
curl -sS -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" http://localhost:4000/api/nutrition/meals --data-binary @- > "$NUTR_MEAL" <<'JSON'
{"name":"E2E Meal","mealType":"dinner","foods":[{"name":"Chicken Breast","quantity":1,"nutrients":{"calories":250,"protein":30}}]}
JSON

curl -sS -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/nutrition > "$NUTR_DASH"
curl -sS -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/nutrition/recommendations > "$NUTR_RECO"
curl -sS -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/nutrition/report/pdf -o "$NUTR_PDF" || true

# Summarize
echo "E2E run complete. Artifacts saved to: $OUTDIR"
ls -la "$OUTDIR"
