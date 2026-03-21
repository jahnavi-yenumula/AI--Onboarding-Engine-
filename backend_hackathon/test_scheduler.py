from scheduler import generate_daily_roadmap
from datetime import date

# 1. Mock Data: Let's use your SQL-201 course (5 Hours)
mock_courses = [
    {
        "course_id": "SQL-201",
        "course_title": "Intermediate SQL: Joins, Subqueries, and Indexing",
        "duration": "5 Hours"
    }
]

# 2. Scheduling Constraints
start_day = date(2026, 3, 23)  # A Monday
limit = 2.0  # Trainee can only do 2 hours per day
# Let's say Tuesday (March 24) is a blackout date for a doctor's appointment
blackouts = [date(2026, 3, 24)]

print(f"--- TESTING SMART SCHEDULER ---")
print(f"Goal: Complete a 5-hour course starting {start_day}")
print(f"Constraint: {limit} hrs/day max | Blackout Date: {blackouts[0]}\n")

# 3. Run the logic
roadmap = generate_daily_roadmap(mock_courses, start_day, limit, blackouts)

# 4. Print results
for day in roadmap:
    print(f"📅 {day['date']} | Task: {day['task']} | {day['hours_to_do']} hrs")

print(f"\n✅ Total days required: {len(roadmap)} (Should be 3 days of work over 4 calendar days)")