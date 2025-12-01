# Code Pattern Reference: "X.filter is not a function" Bug Fix

## Pattern Recognition

This bug occurs when:

1. State is initialized as `[]`
2. An API returns undefined/null on error
3. A useMemo/useCallback tries to call `.filter()` without validation

```typescript
// ❌ DANGEROUS PATTERN (BEFORE)
const [data, setData] = useState<any[]>([]);

// Fetch without validation
const result = await fetchData();
setData(result); // Could be undefined, null, or wrong type!

// Use without checking
const filtered = useMemo(() =>
  data.filter(...), // 💥 CRASH if data is undefined
  [data]
);
```

## The Fix: 3-Layer Defense

### Layer 1: Initialize with Safe Defaults

```typescript
// ✅ Initialize as empty array with proper type
const [data, setData] = useState<any[]>([]);
const [isLoading, setIsLoading] = useState(true);
```

### Layer 2: Validate at Every Assignment

```typescript
// ✅ From API call
const result = await fetchData();
setData(Array.isArray(result) ? result : []); // Always an array

// ✅ From store
const { storeData } = useStore();
useEffect(() => {
  if (Array.isArray(storeData) && storeData.length > 0) {
    setData(storeData);
  }
}, [storeData]);

// ✅ From error handling
catch (error) {
  setData([]); // Fallback to empty array
}
```

### Layer 3: Type-Check Before Calling Methods

```typescript
// ✅ Defensive useMemo
const filtered = useMemo(() => {
  // Check type first
  if (!Array.isArray(data)) return [];

  // Then safely filter
  return data.filter(item =>
    item &&
    item.property &&
    item.property.toLowerCase().includes(query.toLowerCase())
  );
}, [data, query]);

// ✅ Defensive render
return (
  <FlatList
    data={Array.isArray(data) ? data : []}
    renderItem={({ item }) => <Item {...item} />}
    ListEmptyComponent={<Text>No data</Text>}
  />
);
```

## Applies To These Scenarios

| Scenario       | Pattern        | Safe Version                             |
| -------------- | -------------- | ---------------------------------------- |
| Filter array   | `arr.filter()` | `Array.isArray(arr) ? arr.filter() : []` |
| Map over array | `arr.map()`    | `Array.isArray(arr) && arr.map()`        |
| Get length     | `arr.length`   | `Array.isArray(arr) ? arr.length : 0`    |
| Find item      | `arr.find()`   | `Array.isArray(arr) ? arr.find() : null` |
| Slice array    | `arr.slice()`  | `Array.isArray(arr) ? arr.slice() : []`  |

## Patterns Found in Codebase (All Fixed)

### children.tsx ✅ FIXED

**Issue:** `children.filter is not a function`
**Fix:** Added store sync + response validation + useMemo type check

### dashboard.tsx ✅ FIXED (Previous session)

**Issue:** `extraHours.map is not a function`
**Fix:** Added response.data extraction + component defensive validation

### reports.tsx ✅ ALREADY SAFE

**Pattern:** Uses `childrenList` from store + validates in render

### Other Screens ✅ NO ISSUES

**calendar.tsx:** Direct data assignment (no filtering)
**chatList.tsx:** Mock data (no API calls)

## Code Review Checklist

When reviewing code that processes arrays:

- [ ] Check initial state: `useState<T[]>([])`?
- [ ] Check API assignment: `setData(Array.isArray(result) ? result : [])`?
- [ ] Check error handling: `catch` has `setData([])`?
- [ ] Check useMemo: First line checks `if (!Array.isArray(data)) return ...`?
- [ ] Check render: No direct `.filter()` or `.map()` on potentially undefined state?
- [ ] Check store sync: If using Zustand/Redux, has effect to sync to local state?

## Prevention for Future

1. **Use TypeScript strictly:** State type should be `T[]`, not `any`
2. **Always validate API responses:** `Array.isArray(response)` before use
3. **Defensive programming:** Assume data can be null/undefined at any time
4. **Unit test:** Test error cases, not just happy path
5. **Error boundary:** Wrap all screens with ErrorBoundary

---

**Document:** Code Pattern Reference
**Last Updated:** Dec 1, 2025
**Related Fixes:** BUG_FIX_CHILDREN_CRASH.md, BUG_FIX_DASHBOARD_COMPREHENSIVE.md
