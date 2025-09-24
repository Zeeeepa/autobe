# Date Type Handling Guide for Realize Agent

## YOUR PRIMARY MISSION: Fix TypeScript Compilation Errors

You must do everything possible to resolve compilation errors related to Date types. The guidelines below are tips to help you achieve this goal.

## Core Rule: Never Use Date Type in Declarations

Date objects should only be used transiently for immediate conversion to string types.

## The Golden Rule: Use String Types with Tags

### FORBIDDEN Pattern
```typescript
// NEVER declare variables with Date type
const now: Date = new Date();                              // FORBIDDEN
const processDate = (date: Date) => { ... };               // FORBIDDEN
function getDate(): Date { ... }                           // FORBIDDEN
interface IUser { created_at: Date; }                      // FORBIDDEN
type TimeStamp = Date;                                     // FORBIDDEN
```

### REQUIRED: Always Use String with Tags
```typescript
// ALWAYS use string with tags.Format<'date-time'>
const now: string & tags.Format<'date-time'> = toISOStringSafe(new Date());
const processDate = (date: string & tags.Format<'date-time'>) => { ... };
function getDate(): string & tags.Format<'date-time'> { ... }
interface IUser { created_at: string & tags.Format<'date-time'>; }
type TimeStamp = string & tags.Format<'date-time'>;
```

## Date Conversion Functions

### Available Options
```typescript
// Option 1: Project utility function (if available)
function toISOStringSafe(
  value: Date | (string & tags.Format<"date-time">)
): string & tags.Format<"date-time">

// Option 2: Standard JavaScript
date.toISOString()  // Returns string, may need type casting
```

### Handling Null and Undefined

**CRITICAL: Date conversion functions do NOT accept null/undefined**
- Always check for null/undefined BEFORE calling conversion functions
- Different patterns for different nullable scenarios

#### Basic Patterns
```typescript
// Pattern 1: Nullable input, nullable output
value ? toISOStringSafe(value) : null

// Pattern 2: Nullable input, non-nullable output (provide default)
value ? toISOStringSafe(value) : toISOStringSafe(new Date())

// Pattern 3: Optional property (undefined possible)
body.date !== undefined ? toISOStringSafe(body.date) : undefined

// Pattern 4: Three-state handling (undefined vs null vs value)
body.date === undefined 
  ? undefined                    // Don't change
  : body.date === null 
    ? null                       // Set to NULL
    : toISOStringSafe(body.date) // Set value
```

#### Advanced Nullable Patterns (from COMMON_CORRECT_CASTING)

**Case 1: When Target Accepts Nullable String**
```typescript
// Source: Date | null | undefined
// Target: string | null | undefined

const date: Date | null | undefined = getDate();

// CORRECT: Preserve null/undefined
const requestBody = {
  createdAt: date?.toISOString() ?? null,  // Converts Date to string, preserves null
  updatedAt: date?.toISOString() ?? undefined  // Converts Date to string, preserves undefined
};
```

**Case 2: When Target Requires Non-Nullable String**
```typescript
// Source: Date | null | undefined  
// Target: string (non-nullable)

const date: Date | null | undefined = getDate();

// CORRECT: Provide default value
const requestBody = {
  createdAt: (date ?? new Date()).toISOString(),  // Always returns string
  updatedAt: date?.toISOString() ?? new Date().toISOString()  // Alternative syntax
};
```

**Case 3: Complex Union Types**
```typescript
// Source: Date | string | undefined
// Target: string | undefined

const value: Date | string | undefined = getValue();

// CORRECT: Handle all type possibilities
const requestBody = {
  timestamp: value instanceof Date ? value.toISOString() : value
};
```

### Common Usage Patterns

#### 1. Creating New Timestamps
```typescript
// For new timestamps
const created_at = toISOStringSafe(new Date());
const updated_at = toISOStringSafe(new Date());

// Converting existing date strings  
const formatted_date = toISOStringSafe(dateString);
```

#### 2. Converting Prisma DateTime Fields (@db.Timestamptz)
```typescript
// Prisma schema uses @db.Timestamptz for all DateTime fields
// When returning to API, convert to ISO strings
return {
  created_at: toISOStringSafe(created.created_at),
  updated_at: toISOStringSafe(created.updated_at),
  deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
};
```

#### 3. Processing API Input for Prisma
```typescript
// Converting date strings from API input for Prisma
// Prisma with @db.Timestamptz accepts ISO strings
await MyGlobal.prisma.posts.create({
  data: {
    title: body.title,
    content: body.content,
    created_at: toISOStringSafe(new Date()),
    updated_at: toISOStringSafe(new Date()),
    published_at: body.published_at ? toISOStringSafe(body.published_at) : null,
  },
});
```

## Date Field Patterns in Different Contexts

### 1. Prisma Operations

#### CREATE Operations
```typescript
await MyGlobal.prisma.articles.create({
  data: {
    id: v4() as string & tags.Format<'uuid'>,
    title: body.title,
    content: body.content,
    // Required date fields
    created_at: toISOStringSafe(new Date()),
    updated_at: toISOStringSafe(new Date()),
    // Optional/nullable date fields
    published_at: body.published_at ? toISOStringSafe(body.published_at) : null,
    deleted_at: null,  // If soft delete field exists
  },
});
```

#### UPDATE Operations
```typescript
await MyGlobal.prisma.articles.update({
  where: { id: parameters.id },
  data: {
    title: body.title,
    content: body.content,
    // Always update the updated_at field
    updated_at: toISOStringSafe(new Date()),
    // Conditional date updates
    ...(body.published_at !== undefined && {
      published_at: body.published_at ? toISOStringSafe(body.published_at) : null
    }),
  },
});
```

#### WHERE Clauses with Date Ranges
```typescript
await MyGlobal.prisma.events.findMany({
  where: {
    // Date range queries
    created_at: {
      gte: body.start_date ? toISOStringSafe(body.start_date) : undefined,
      lte: body.end_date ? toISOStringSafe(body.end_date) : undefined,
    },
    // Specific date comparisons
    expires_at: {
      gt: toISOStringSafe(new Date()),  // Events not yet expired
    },
  },
});
```

### 2. Return Object Transformations

#### From Prisma to API Response
```typescript
// Prisma returns Date objects, API expects ISO strings
const users = await MyGlobal.prisma.users.findMany();

return users.map(user => ({
  id: user.id,
  name: user.name,
  email: user.email,
  // Convert all Date fields to ISO strings
  created_at: toISOStringSafe(user.created_at),
  updated_at: toISOStringSafe(user.updated_at),
  last_login_at: user.last_login_at ? toISOStringSafe(user.last_login_at) : null,
  email_verified_at: user.email_verified_at ? toISOStringSafe(user.email_verified_at) : null,
}));
```

### 3. Complex Date Operations

#### Soft Delete Implementation
```typescript
// If schema has deleted_at field (always check first!)
await MyGlobal.prisma.posts.update({
  where: { id: parameters.id },
  data: {
    deleted_at: toISOStringSafe(new Date()),  // Mark as deleted
    updated_at: toISOStringSafe(new Date()),
  },
});

// Querying non-deleted items
await MyGlobal.prisma.posts.findMany({
  where: {
    deleted_at: null,  // Only get non-deleted posts
  },
});
```

#### Date Calculations
```typescript
// Calculate expiry date (30 days from now)
const now = new Date();
const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

await MyGlobal.prisma.subscriptions.create({
  data: {
    user_id: user.id,
    started_at: toISOStringSafe(now),
    expires_at: toISOStringSafe(expiryDate),
  },
});
```

## Type Narrowing for Nullable Date Fields

### Exhaustive Type Narrowing Pattern

When dealing with nullable/undefined Date fields, TypeScript requires explicit checking:

```typescript
// For Date | null | undefined - must check BOTH
const date: Date | null | undefined = getDate();

// WRONG: Only checking for null
if (date !== null) {
  // ERROR: date is still Date | undefined
  return date.toISOString();
}

// CORRECT: Check both null AND undefined
if (date !== null && date !== undefined) {
  return date.toISOString(); // OK: date is Date
}

// Alternative using truthiness (be careful with falsy values)
if (date) {
  return date.toISOString(); // OK for Date objects
}
```

### Converting Null to Undefined for Prisma Updates

```typescript
// Prisma update expects undefined to skip, null to set NULL
const updateData = {
  // Convert API's null to undefined when you want to skip updating
  deleted_at: body.deleted_at === null 
    ? undefined  // Skip updating this field
    : body.deleted_at ? toISOStringSafe(body.deleted_at) : null,
    
  // For explicit NULL setting
  cleared_at: body.clear_date ? null : undefined,
};
```

## Common Date Type Errors and Solutions

### Error: "Type 'Date' is not assignable to type 'string & tags.Format<'date-time'>'"

**Cause**: Trying to assign a Date object directly without conversion

```typescript
// WRONG
return {
  created_at: new Date(),  // ERROR!
};

// CORRECT
return {
  created_at: toISOStringSafe(new Date()),
};
```

### Error: "Argument of type 'null' is not assignable to parameter"

**Cause**: Trying to pass null or undefined to toISOStringSafe

```typescript
// WRONG
const date = toISOStringSafe(nullableDate);  // Type error if nullable!

// CORRECT
const date = nullableDate ? toISOStringSafe(nullableDate) : null;
```

### Error: "Type 'string | null' is not assignable to type 'string & tags.Format<'date-time'>'"

**Cause**: Nullable date field being assigned to required date field

```typescript
// WRONG (if API expects non-nullable)
return {
  created_at: user.created_at ? toISOStringSafe(user.created_at) : null,  // ERROR!
};

// CORRECT (provide default for required fields)
return {
  created_at: user.created_at 
    ? toISOStringSafe(user.created_at) 
    : toISOStringSafe(new Date()),  // Default to current time
};
```

## Date Type Checklist

Before implementing any date-related functionality, verify:

1. **NO Date type declarations** - Search for `: Date` in your code
2. **All Date objects converted** - Use toISOStringSafe() or .toISOString()
3. **Null checks before conversion** - Functions cannot handle null
4. **Proper type annotations** - Use `string & tags.Format<'date-time'>`
5. **Schema verification** - Check if date fields actually exist in Prisma schema
6. **API contract alignment** - Verify if fields are nullable or required in DTOs

## Quick Reference

### DO
- `toISOStringSafe(new Date())` or `new Date().toISOString()`
- `toISOStringSafe(dateString)` for existing strings
- `value ? toISOStringSafe(value) : null` for nullable values
- `string & tags.Format<'date-time'>` for type declarations
- Check null/undefined BEFORE calling conversion functions
- Check Prisma schema for date field existence

### DON'T
- `const date: Date = new Date()` - storing Date in variables
- `toISOStringSafe(nullableValue)` - function doesn't accept null
- `toISOStringSafe()` - function requires a parameter
- Assume date fields exist (like deleted_at)
- Use Date type in function signatures

## Exception: new Date() Usage

The ONLY acceptable use of `new Date()` is as an immediate argument to conversion functions:

```typescript
// ONLY ALLOWED PATTERN
const timestamp = toISOStringSafe(new Date());
const timestamp2 = new Date().toISOString();

// NEVER STORE Date IN VARIABLE
const now = new Date();  // FORBIDDEN!
const timestamp = toISOStringSafe(now);  // VIOLATION!
```

## Summary

Date type handling in Realize Agent follows these patterns:
1. **Never** declare Date types in TypeScript variable/function/interface declarations
2. **Always** use `string & tags.Format<'date-time'>` for type annotations
3. **Convert** Date objects using `toISOStringSafe()` or `.toISOString()`
4. **Check** null/undefined before calling conversion functions
5. **Verify** Prisma schema before using date fields (especially nullable fields)
6. **Match** API interface requirements for nullable vs non-nullable fields

Following these rules ensures type safety, prevents runtime errors, and maintains consistency across the entire codebase.