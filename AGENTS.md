# Repository Guidelines

## Project Structure & Module Organization

Audiora is a React Native application. Application code lives in `src/`: reusable UI is under `components/`, screens under `pages/`, shared business logic under `core/`, platform services under `service/`, and helpers under `utils/`. Images, SVG icons, and fonts are stored in `src/assets/` and `assets/fonts/`. Native projects are in `android/` and `ios/`; avoid editing generated build output. Maintenance scripts live in `scripts/`, while `generator/generate-assets.mjs` rebuilds the icon component map.

Tests are colocated with their subjects as `*.test.ts` or `*.test.tsx`; some utility tests also live in `src/utils/__tests__/`.

## Build, Test, and Development Commands

- `npm install` installs locked dependencies and applies required package patches.
- `npm start` launches Metro.
- `npm run android` builds and runs the Android debug app.
- `npm run ios` runs the iOS app on a configured macOS environment.
- `npm test` runs the Jest suite; use `npm test -- --runInBand path/to/file.test.ts` for a focused run.
- `npm run lint` runs ESLint over `src/` and fixes supported issues.
- `npm run build-android` generates build metadata and produces the release APK.
- `npm run generate-assets` regenerates `src/components/base/icon.tsx` after SVG icon changes.

## Coding Style & Naming Conventions

Use TypeScript for new application code and the `@/` alias for imports from `src/`. ESLint is authoritative for `src`: four-space indentation, semicolons, double quotes, spaced object braces, trailing commas in multiline structures, and 1TBS braces. Use `camelCase` for variables and hooks (`usePrimaryColor`), `PascalCase` for components and types, and descriptive lowercase filenames consistent with the surrounding directory. Run `npm run lint` before submitting changes.

## Testing Guidelines

Jest uses the React Native preset and loads `jest.setup.js`. Add regression tests beside changed behavior, especially for parsing, storage, panels, and playback state. Mock native modules rather than requiring a device. No coverage threshold is enforced, but new logic should cover success, failure, and boundary cases.

## Commit & Pull Request Guidelines

Commits follow Conventional Commits, for example `fix(主题): correct custom background color` or `docs: update installation notes`. Commitlint permits `ci`, `chore`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, and `style`; choose the closest applicable type.

Pull requests should explain the user-visible effect, link relevant issues, list verification commands, and include screenshots or recordings for UI changes. Call out Android/iOS-specific behavior and any migration or configuration impact.
