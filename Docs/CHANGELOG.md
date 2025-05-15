# Changelog

All notable changes to the Atrocitee platform will be documented in this file.

## [Unreleased]

### Added
- Added debug logging to middleware to improve troubleshooting authentication issues

## [1.2.0] - 2023-10-03

### Added
- Middleware-based authentication system for protected routes
- Enhanced admin role validation with metadata checks and DB validation
- Added `is_admin` RPC function to Supabase for secure role verification

### Changed
- Moved auth logic from individual pages to centralized middleware
- Updated auth documentation with middleware-based approach
- Made protected routes and API endpoints explicitly server-rendered

### Fixed
- Fixed issue with prerendered admin pages not having access to auth session
- Added explicit `export const prerender = false` to all protected pages and endpoints
- Added comprehensive debug logging to auth middleware

## [1.1.0] - 2023-09-15

### Added
- Initial Supabase authentication implementation
- Login, register, and password reset flows
- Basic admin and user account pages
- Row-level security policies for Supabase tables

### Changed
- Updated to Astro 5.x with hybrid rendering support
- Improved error handling on authentication routes

### Removed
- Removed legacy authentication approach 