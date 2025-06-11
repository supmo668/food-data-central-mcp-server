# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Run Commands
- `npm install` - Install dependencies
- `npm run build` - Build TypeScript to JavaScript
- `npm run dev` - Run server with hot reloading
- `npm start` - Run server in production mode
- `npm run lint` - Run ESLint to check code quality
- `npm run watch` - Watch TypeScript files and rebuild on changes
- `npm run clean` - Clean build artifacts

## Code Style Guidelines
- Use TypeScript with strict mode enabled
- Follow ES modules syntax (import/export)
- File naming: kebab-case for files, PascalCase for classes/interfaces
- Variables/functions: camelCase
- Error handling: Use try/catch blocks with specific error messages
- Always use explicit typing, avoid "any" type when possible
- Environment variables must be validated at startup
- HTTP responses should be properly typed using interfaces
- Use Zod for schema validation when processing external inputs
- Use console.error for logging errors, not console.log