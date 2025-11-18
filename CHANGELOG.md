# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.4] - 2025-11-18

### Changed
- Upgraded TypeScript from ^4.9.5 to 5.9.3
- Migrated test framework from Jest to Vitest for better ES modules support
- Updated TypeScript configuration target from ES6 to ES2022 to align with Node.js 20+ requirements

### Added
- Added `vitest.config.ts` configuration file
- Added `test:watch` script for running tests in watch mode
- Added Vitest as a dev dependency

### Security
- Updated `glob` dependency to 12.0.0 (security fix)
- Updated `@babel/runtime` to 7.28.4
- Updated other dependencies to their latest secure versions

### Removed
- Removed Jest-specific experimental VM modules flag requirement
- Removed coverage configuration (can be re-added as needed)

## [0.0.3] - Previous Release

### Initial release with Jest test framework
- Babel plugin for transforming Vite meta glob imports
- Support for glob patterns and eager loading
- TypeScript 4.9.5 support

