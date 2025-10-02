# Babel Plugin Shopware Vite Meta Glob

## Overview

A Babel plugin that transforms `import.meta.glob()` calls to support dynamic
module imports in Shopware and Vite-like environments. This plugin provides two
main transformation strategies:

> **⚠️ Warning: Not Recommended for Production Use**
>
> This Babel plugin is intended for development and experimental purposes only.
> It may introduce performance overhead, potential security risks, and
> unexpected behavior in production environments. Use with caution and
> thoroughly test before considering any production deployment.

## Disclaimer

This plugin was heavily inspired from the
[OpenSourceRaidGuild/babel-vite](https://github.com/OpenSourceRaidGuild/babel-vite)
repo. Unfortunately for us it was not handling the import meta statements right
for our use case. Since this was time critical we decided to create our own
version. If there version works for you stick to theirs!

## Supported Features

- ✅ Transforms `import.meta.glob('./dir/*.js')` into an object of dynamic
  imports
- ✅ Transforms `import.meta.glob(['./dir1/*.js', './dir2/*.js'])` array
  patterns
- ✅ Supports `{ eager: true }` option for direct module imports
- ✅ Supports `{ import: 'default' }` **only in combination with eager: true**
- ✅ Handles file path normalization
- ✅ Works with both Windows and Unix-style file paths

## Unsupported Features

- **Doesn't transform** `import.meta.glob('./dir1/*.js', { eager: false })`
  eager false will not be transformed
- **Doesn't transform** `import.meta.glob('./dir1/*.js', { query: 'foo' })`
  query option will be ignored

## Installation

```bash
npm install babel-plugin-shopware-vite-meta-glob
```

## Usage

### Babel Configuration

Add the plugin to your Babel configuration:

```json
{
  "plugins": ["shopware-vite-meta-glob"]
}
```

### Examples

#### Dynamic Imports

```javascript
// Input
const modules = import.meta.glob('./dir/*.js')

// Transformed output
const modules = {
  './dir/file1.js': () => import('./dir/file1.js'),
  './dir/file2.js': () => import('./dir/file2.js'),
}
```

#### Eager Imports

```javascript
// Input
const modules = import.meta.glob('./dir/*.js', {eager: true})

// Transformed output
const modules = {
  './dir/file1.js': require('./dir/file1.js'),
  './dir/file2.js': require('./dir/file2.js'),
}
```

### Array Pattern Support

The plugin now supports array patterns for specifying multiple file patterns:

```javascript
// Input with array patterns (lazy loading)
const modules = import.meta.glob(['./components/*.vue', './utils/*.js'])

// Transformed output
const modules = {
  './components/Button.vue': () => import('./components/Button.vue'),
  './components/Modal.vue': () => import('./components/Modal.vue'),
  './utils/helper.js': () => import('./utils/helper.js'),
  './utils/api.js': () => import('./utils/api.js'),
}

// Input with array patterns and eager loading
const modules = import.meta.glob(['./src/file1.js', './src/file2.js'], {
  eager: true,
})

// Transformed output (IIFE pattern)
const modules = (function () {
  const __glob__0_0 = require('./src/file1.js')
  const __glob__0_1 = require('./src/file2.js')
  const __glob__context__ = {
    './src/file1.js': __glob__0_0,
    './src/file2.js': __glob__0_1,
  }
  return __glob__context__
})()
```

## Options

- Supports globbing patterns
- Normalizes file paths
- Sorts glob results for consistent output

## Dependencies

- `@babel/core`
- `glob`
- `debug`

## Debugging

Set the `DEBUG` environment variable to `babel-plugin-shopware-vite-meta-glob`
for detailed logging.

## Contributing

Contributions welcome! Please submit issues and pull requests on the repository.

## License

MIT License
