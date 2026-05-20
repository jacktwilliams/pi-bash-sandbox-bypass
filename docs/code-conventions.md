## TypeScript Code Conventions

Reference this section when writing or modifying TypeScript.

### Imports

Follow the import style already used by the project. Do not introduce a path alias, relative-import style, or package import pattern that conflicts with local conventions.

Use `node:` specifiers for Node.js built-ins.

When renaming symbols that affect both imports and usage, update the usage and import in the same edit. Organize-import hooks may remove imports that are temporarily unused.

```typescript
// Good
import * as fs from "node:fs";
import * as path from "node:path";

// Bad
import * as fs from "fs";
import * as path from "path";
```

### Types

Prefer `type` over `interface`. Avoid `any` outside tests. Keep strict TypeScript settings clean.

```typescript
// Good
type UserConfig = {
  readonly id: string;
  readonly name: string;
};

// Bad
interface UserConfig {
  id: string;
  name: string;
}
```

### Enums

Prefer enums over string literal union types when there is a closed set of named values. Reuse existing enums from project dependencies instead of inventing parallel values.

### Async

Only mark a function `async` when it actually awaits. Return promises directly when no `await` is needed. Use `void` for intentional fire-and-forget calls. Never leave floating promises.

```typescript
// Good
function fetchData() {
  return httpClient.get("/data");
}

void sendAnalytics();

// Bad
async function fetchData() {
  return httpClient.get("/data");
}

sendAnalytics(); // floating promise
```

### Naming

Use the filename suffix conventions already present in the project. Common suffixes include `*.service.ts`, `*.controller.ts`, `*.model.ts`, `*.util.ts`, `*.schema.ts`, `*.tool.ts`, and `*.spec.ts`.

Prefix intentionally unused parameters with `_`.

Use descriptive variable names. Avoid single- or double-character names except for widely understood local values in very small scopes.

```typescript
// Good
array.map((_item, index) => index);

const hiddenState = new Float32Array(size);
const cellState = new Float32Array(size);

for (let sampleIndex = 0; sampleIndex < frameSize; sampleIndex++) {
  samples[sampleIndex] = buffer.readInt16LE(sampleIndex * bytesPerSample);
}

// Bad
array.map((item, index) => index);

const h = new Float32Array(size);
const c = new Float32Array(size);

for (let i = 0; i < frameSize; i++) {
  samples[i] = buffer.readInt16LE(i * bytesPerSample);
}
```

### Type Assertions

Avoid double type assertions such as `value as unknown as Type`. Fix the underlying type mismatch instead.

When parsing untrusted JSON, type the parsed value as `Partial<T>` or `unknown`, then validate fields before use. Do not assert raw parsed data directly to a trusted type.

```typescript
// Good
type Config = {
  readonly allowed: readonly string[];
};

const parsed = JSON.parse(raw) as Partial<Config>;
const allowed = Array.isArray(parsed.allowed)
  ? parsed.allowed.filter((entry): entry is string => typeof entry === "string")
  : [];

// Bad
const parsed = JSON.parse(raw) as unknown as Config;
```

### Booleans

Use `Boolean(value)` instead of `!!value` for type coercion.

```typescript
// Good
const isEnabled = Boolean(process.env.FEATURE_FLAG);

// Bad
const isEnabled = !!process.env.FEATURE_FLAG;
```

### Null vs Undefined

Prefer `null` for explicit absence in function return values. Reserve `undefined` for omitted optional values or values not yet provided.

```typescript
// Good
function findUser(id: string): User | null {
  const user = users.get(id);

  return user ?? null;
}

// Bad
function findUser(id: string): User | undefined {
  return users.get(id);
}
```

### Object Spreading

Use spread operations instead of `Object.assign` for object copying and merging.

```typescript
// Good
const merged = { ...defaults, ...userConfig };
const copy = { ...original };

// Bad
const merged = Object.assign({}, defaults, userConfig);
const copy = Object.assign({}, original);
```

### Destructuring

Prefer destructuring when reading multiple fields from the same object. Destructure close to first use so dependencies remain obvious.

Use defaults in the destructuring pattern when an optional field has a known default.

Do not destructure methods off their owner object if that can detach `this`. Destructure the owner and call through it.

```typescript
// Good
function execute(params: UserSelectInput, context: ExtensionContext) {
  const { question, options, allowCustom = false } = params;
  const { ui } = context;

  return ui.select(question, options, { allowCustom });
}

// Bad
function execute(params: UserSelectInput, context: ExtensionContext) {
  const allowCustom = params.allowCustom === true;
  const { select } = context.ui;

  return select(params.question, params.options, { allowCustom });
}
```

### Nullish Coalescing

Prefer `??` over `||` for default values when `0`, `""`, or `false` are valid inputs.

```typescript
// Good
const port = config.port ?? 3000;
const displayName = user.name ?? "Anonymous";

// Bad
const port = config.port || 3000;
const displayName = user.name || "Anonymous";
```

### Constants

Define constants as uppercase variables in module scope, not inline within functions. Avoid magic numbers; give numeric literals a named constant that explains their meaning.

```typescript
// Good
const MAX_RETRIES = 3;

function fetchData() {
  for (let attemptIndex = 0; attemptIndex < MAX_RETRIES; attemptIndex++) {
    retryFetch();
  }
}

// Bad
function fetchData() {
  for (let i = 0; i < 3; i++) {
    retryFetch();
  }
}
```

### Array Access

Prefer `array.at()` over bracket notation when reading from arrays, especially for first/last element access. This makes possibly missing elements explicit under `noUncheckedIndexedAccess`.

```typescript
// Good
const first = items.at(0);
const last = items.at(-1);

// Bad
const first = items[0];
const last = items[items.length - 1];
```

### Control Flow Braces

Always use braces for `if`, `else`, `for`, `while`, and similar control flow, even for single-line bodies.

```typescript
// Good
if (condition) {
  return value;
}

// Bad
if (condition) return value;
```

### Spacing

Add blank lines between logical groups of statements inside functions and methods. Avoid both cramped code and excessive blank lines.

```typescript
// Good
function resolveValue() {
  const foo = getFoo();
  const bar = getBar(foo);

  if (condition) {
    return fallbackValue;
  }

  return bar;
}

// Bad — no breathing room
function resolveValue() {
  const foo = getFoo();
  const bar = getBar(foo);
  if (condition) {
    return fallbackValue;
  }
  return bar;
}
```

### Early Returns

Prefer early returns and guard clauses to reduce nesting. Exit early for edge cases, invalid input, errors, and no-op branches.

```typescript
// Good
function getDiscount(user: User): number {
  if (!user.isActive) {
    return 0;
  }

  if (!user.hasMembership) {
    return 5;
  }

  return 20;
}

// Bad
function getDiscount(user: User): number {
  if (user.isActive) {
    if (user.hasMembership) {
      return 20;
    }

    return 5;
  }

  return 0;
}
```

### Error Handling

Use `unknown` in catch blocks and narrow with `instanceof` or type guards. Never use `any` for caught errors.

Handle expected I/O errors explicitly. For filesystem work, inspect `NodeJS.ErrnoException.code` when behavior differs by error code.

```typescript
// Good
try {
  await fetchData();
} catch (error: unknown) {
  if (error instanceof HttpError) {
    handleHttpError(error);
    return;
  }

  throw error;
}

// Bad
try {
  await fetchData();
} catch (error: any) {
  console.log(error.message);
}
```

### Readonly

Use `readonly` for object properties and array parameters that should not be reassigned or mutated.

```typescript
// Good
type Config = {
  readonly host: string;
  readonly port: number;
};

function processItems(items: readonly string[]) {
  return items.map((item) => item.trim());
}

// Bad
type Config = {
  host: string;
  port: number;
};

function processItems(items: string[]) {
  items.push("extra");
  return items;
}
```

### Template Literals

Prefer template literals over string concatenation.

```typescript
// Good
const greeting = `Hello, ${name}!`;
const url = `${baseUrl}/api/${version}/users`;

// Bad
const greeting = "Hello, " + name + "!";
const url = baseUrl + "/api/" + version + "/users";
```

### Optional Chaining

Prefer optional chaining (`?.`) over manual null/undefined checks.

```typescript
// Good
const city = user?.address?.city;
const result = callback?.();

// Bad
const city = user && user.address && user.address.city;
const result = callback ? callback() : undefined;
```
