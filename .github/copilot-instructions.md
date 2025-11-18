# Copilot Instructions: Babel Plugin Shopware Vite Meta Glob

This is a specialized Babel plugin that transforms `import.meta.glob()` calls
into dynamic imports or eager requires, bridging Vite's glob functionality for
Shopware and Babel environments.

## Core Architecture

**Single Entry Point**: `src/index.ts` exports the main plugin function that
returns a Babel visitor pattern

- Plugin transforms AST nodes by visiting `CallExpression` nodes
- Supports two transformation modes: lazy imports (`() => import()`) and eager
  requires (`require()`)
- Uses `glob` package for file system globbing relative to source file directory

## Key Transformation Patterns

### Lazy Loading (Default)

```javascript
// Input: import.meta.glob('./dir/*.js')
// Output: { './dir/file.js': () => import('./dir/file.js') }

// Input: import.meta.glob(['./dir1/*.js', './dir2/*.js'])
// Output: { './dir1/file.js': () => import('./dir1/file.js'), './dir2/file.js': () => import('./dir2/file.js') }
```

### Eager Loading

```javascript
// Input: import.meta.glob('./dir/*.js', { eager: true })
// Output: Generates require() calls wrapped in IIFE pattern

// Input: import.meta.glob(['./file1.js', './file2.js'], { eager: true })
// Output: IIFE pattern with require() calls for each file in array
```

### Import Specific Export

```javascript
// Input: import.meta.glob('./dir/*.js', { eager: true, import: 'default' })
// Output: require('./path').default pattern

// Input: import.meta.glob(['./file1.js', './file2.js'], { eager: true, import: 'default' })
// Output: IIFE pattern with require('./path').default for each file
```

## Critical Constraints & Limitations

- **Supports both string and array patterns** - handles single strings
  `'./dir/*.js'` and arrays `['./dir1/*.js', './dir2/*.js']`
- **Eager-only import option** - `{ import: 'default' }` only works with
  `{ eager: true }`
- **No query support** - `{ query: 'foo' }` option is ignored
- **Development warning** - Plugin includes production usage warning in README

## Testing Strategy

Uses `babel-plugin-tester` with snapshot testing in `src/__tests__/index.ts`:

- **Positive tests**: Valid transformations with different option combinations
  - String patterns: `import.meta.glob('./dir/*.js')`
  - Array patterns: `import.meta.glob(['./file1.js', './file2.js'])`
  - Eager loading: Both string and array patterns with `{ eager: true }`
  - Import options: Both patterns with `{ eager: true, import: 'default' }`
- **Negative tests**: Cases that should NOT be transformed
- **Fixture files**: `src/__tests__/fixtures/file{1,2,3}.ts` for glob pattern
  testing
- Test snapshots show exact expected AST transformations

## Build & Development Workflow

```bash
npm run build        # Uses kcd-scripts to compile TypeScript to lib/
npm test            # Runs tests with snapshots
npm run format      # Code formatting via kcd-scripts
npm run prepublish  # Auto-builds before publishing
```

## Debugging

Set `DEBUG=babel-plugin-shopware-vite-meta-glob` environment variable for
detailed transformation logging. The plugin uses `debug` package to log:

- Source files being processed
- Resolved glob patterns
- Final replacement AST nodes

## File Organization

- `src/index.ts` - Main plugin implementation with Babel visitor pattern
- `lib/` - Compiled JavaScript output (auto-generated, don't edit)
- `src/__tests__/` - Test suite with snapshots and fixtures
- Uses `kcd-scripts` for consistent tooling across build/test/format

## AST Transformation Details

The plugin generates different AST patterns based on options:

- **Dynamic imports**: Arrow functions returning `import()` calls
- **Eager requires**: IIFE pattern with variable declarations and object
  construction
- **Path normalization**: Converts Windows backslashes to forward slashes
- **Sorted output**: Glob results are sorted for deterministic transforms
- **Array pattern processing**: Uses `extractPatterns()` helper to handle both
  single strings and arrays of glob patterns uniformly
