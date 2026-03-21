from datetime import timedelta

def generate_daily_roadmap(courses, start_date, daily_limit, blackout_dates):
    """
    Distributes course hours across available days, skipping blackout dates.
    """
    if not daily_limit or daily_limit <= 0:
        raise ValueError("daily_commitment must be greater than 0.")
    roadmap = []
    current_date = start_date
    task_queue = []

    # 1. Process all courses into a clean queue
    for course in courses:
        # Get duration and clean it (e.g., "5 Hours" -> 5.0)
        duration_str = str(course.get('duration', '2'))
        try:
            hours = float(''.join(c for c in duration_str if c.isdigit() or c == '.'))
        except ValueError:
            hours = 2.0 # Default fallback
        
        # FIX 1: Use 'task' instead of 'course_title'
        # FIX 2: INDENT this line so it stays INSIDE the loop!
        task_queue.append({
            "title": course.get('task', 'Learning Module'), 
            "hours": hours,
            "description": course.get('description', '')
        })

    # 2. Distribute tasks across the calendar
    for task in task_queue:
        remaining_task_hours = task['hours']
        
        while remaining_task_hours > 0:
            # Skip blackout dates
            if current_date in blackout_dates:
                current_date += timedelta(days=1)
                continue
            
            # Assign hours based on the daily limit
            hours_assigned = min(remaining_task_hours, daily_limit)
            
            roadmap.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "task": task['title'],
                "hours_to_do": hours_assigned,
                "description": task['description'],
                "status": "Scheduled"
            })
            
            remaining_task_hours -= hours_assigned
            
            # Move to the next day for the next chunk of work
            current_date += timedelta(days=1)

    return roadmap