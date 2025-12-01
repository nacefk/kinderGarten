# API Fixes Quick Reference

## What Was Fixed ✅

All critical backend API field mapping issues are now resolved:

| Endpoint                              | Problem                           | Solution                                     |
| ------------------------------------- | --------------------------------- | -------------------------------------------- |
| POST `/api/reports/daily/`            | Sent `meal`, `nap`, `behavior`    | Now maps to `eating`, `sleeping`, `mood`     |
| GET `/api/events/`                    | Sent `class_name` filter          | Now maps to `classroom_id`                   |
| POST `/api/events/`                   | Sent `class_name` field           | Now converts to `classroom_id`               |
| GET `/api/plans/`                     | Sent `class_name` filter          | Now maps to `classroom_id`                   |
| POST `/api/plans/`                    | Sent `time/title/day` flat fields | Now sends `week_start/week_end/activities[]` |
| POST `/api/attendance/extra/request/` | Sent `start/end` ISO times        | Now converts to `date` + `hours`             |

## Files Modified

```
kinderGarten/
  api/
    ✅ report.ts         → Fixed createDailyReport()
    ✅ planning.ts       → Fixed getEvents, createEvent, getPlans, createPlan, updateEvent, updatePlan
    ✅ attendance.ts     → Fixed requestExtraHour()
```

## Backward Compatibility ✅

**All changes are backward compatible.** Old code still works:

```typescript
// Old format still works
createDailyReport({ meal: "good", nap: "2h", behavior: "active" });
getEvents({ class_name: 1 });
createEvent({ title: "Art", date: "2024-01-15", class_name: 1 });
createPlan({ title: "Activity", time: "10:00", day: "Monday", class_name: 1 });
requestExtraHour({ child: 1, start: "2024-01-15T09:00:00", end: "2024-01-15T11:30:00" });
```

**But new format is recommended:**

```typescript
// New format (better field names)
createDailyReport({ eating: "good", sleeping: "2h", mood: "active" })
getEvents({ classroom_id: 1 })
createEvent({ title: "Art", date: "2024-01-15", classroom_id: 1 })
createPlan({ classroom_id: 1, week_start: "2024-01-15", week_end: "2024-01-19", activities: [...] })
requestExtraHour({ child: 1, date: "2024-01-15", hours: 2.5 })
```

## Key Improvements

### 1. Daily Reports (`createDailyReport`)

- ✅ Maps `meal` → `eating`
- ✅ Maps `nap` → `sleeping`
- ✅ Maps `behavior` → `mood`
- ✅ Adds `activities` field
- ✅ Auto-adds `date` if missing

### 2. Events (`getEvents`, `createEvent`, `updateEvent`)

- ✅ Maps `class_name` → `classroom_id`
- ✅ Validates `classroom_id` is provided
- ✅ Auto-adds `date` if missing
- ✅ Works with both field names

### 3. Weekly Plans (`getPlans`, `createPlan`, `updatePlan`)

- ✅ Maps `class_name` → `classroom_id`
- ✅ Converts `time/title/day` → `activities[]`
- ✅ Auto-calculates week dates (Monday-Friday)
- ✅ Backward compatible with old format

### 4. Extra Hours (`requestExtraHour`)

- ✅ Converts ISO datetimes → `date` + `hours`
- ✅ Calculates duration in hours
- ✅ Accepts both old (start/end) and new (date/hours) formats
- ✅ Validates times and formats

## Error Handling

All functions now:

- ✅ Validate required fields
- ✅ Throw clear error messages
- ✅ Handle invalid date formats
- ✅ Validate time ranges

Example:

```typescript
// This now throws: "classroom_id or class_name is required"
createEvent({ title: "Art", date: "2024-01-15" });

// This now throws: "End time must be after start time"
requestExtraHour({
  child: 1,
  start: "2024-01-15T11:00:00",
  end: "2024-01-15T09:00:00", // end before start!
});
```

## Testing Commands

```bash
# Check for errors
npm run type-check

# Run lint
npm run lint

# Build app
npx expo prebuild
```

## Affected Screens

**Will work better after these fixes:**

- ✅ `app/(adminTabs)/reports.tsx` - Daily report creation
- ✅ `app/(adminTabs)/calendar.tsx` - Events & plans
- ✅ `app/(tabs)/activity.tsx` - Activity feed
- ✅ Any screen using extra hours

## Migration Guide

### For Report Creation

```typescript
// BEFORE: Fields didn't match backend
createDailyReport({ meal: "ate", nap: "slept", behavior: "good" });

// AFTER: Fields now match backend exactly
createDailyReport({
  eating: "ate",
  sleeping: "slept",
  mood: "good",
  // Both old and new format work!
});
```

### For Events

```typescript
// BEFORE: class_name didn't map correctly
getEvents({ class_name: 1 });
createEvent({ title: "Art", date: "2024-01-15", class_name: 1 });

// AFTER: classroom_id is correct field
getEvents({ classroom_id: 1 });
createEvent({ title: "Art", date: "2024-01-15", classroom_id: 1 });
// (but old format still works!)
```

### For Weekly Plans

```typescript
// BEFORE: Wrong schema
createPlan({
  title: "Math",
  time: "10:00",
  day: "Monday",
  class_name: 1,
});

// AFTER: Proper backend schema
createPlan({
  classroom_id: 1,
  week_start: "2024-01-15",
  week_end: "2024-01-19",
  activities: [{ title: "Math", day: "Monday", time: "10:00" }],
});
// (old format still works as fallback!)
```

### For Extra Hours

```typescript
// BEFORE: ISO times didn't convert
requestExtraHour({
  child: 1,
  start: "2024-01-15T09:00:00",
  end: "2024-01-15T11:30:00",
});

// AFTER: Converts to date + hours
requestExtraHour({
  child: 1,
  date: "2024-01-15",
  hours: 2.5,
});
// (ISO time format still works - auto-converts!)
```

## No Breaking Changes

✅ All existing code continues to work
✅ No screens need to be updated
✅ Gradual migration path available
✅ New code can use better field names

## Status

- ✅ All field mapping issues fixed
- ✅ Error handling added
- ✅ Type safety improved
- ✅ No breaking changes
- ✅ Backward compatible
- ✅ Ready for testing

**Next:** Test the fixed endpoints in each screen and verify data appears correctly!

---

For detailed information, see: `API_REFACTORING_SUMMARY.md`
