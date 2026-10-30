# Multi-Platform UI Architecture Guide

> **Purpose:** This document is the source of truth for the coding agent
> implementing three user interfaces from one repository: Android, Web,
> and native Windows desktop.
>
> **Adaptation status in this repository (2026-10-29):**
>
> - The top-level UI workspace is `ui/` — the "rename `app` to `ui`"
>   instruction below is **satisfied**. Expo Router routes live in
>   `ui/apps/mobile/src/app/` (the `src` directory convention); that route
>   directory is never renamed.
> - **Stack decision (product owner):** all three targets are built with
>   **Expo (Android) + Expo / React Native Web + React Native Windows**, per
>   this document's platform strategy. The legacy Next.js client stays at
>   `ui/apps/web` until the Expo web export reaches parity (Milestone 4);
>   the Capacitor and Tauri shells were retired with this decision.
> - **Windows version pairing:** Expo SDK 58 uses React Native 0.88, while
>   the current `react-native-windows` is 0.85 (pairs with RN 0.85). Expo's
>   monorepo guide states duplicate React Native versions in one workspace
>   are unsupported — therefore `ui/apps/windows` is intentionally **outside
>   the pnpm workspace** and will carry its own install. See its README.
> - **Progress:** Milestones 0-3 complete and Milestone 4's export gate
>   proven: workspace baseline, six shared `@exia/*` packages (with unit
>   tests via vitest at the workspace root), an Expo Android app whose
>   sign-in screen is the first ported screen, and successful production
>   exports for both targets (`expo export --platform web` and
>   `--platform android`). Gates: `pnpm -r run typecheck`, `pnpm test`,
>   ESLint, and `expo-doctor` (20/20) all green. Milestone 5 (Windows) is
>   blocked on the Visual Studio 2022 C++ toolchain — see
>   `apps/windows/README.md`. Milestone 6 (CI) pending.
>
> **Original repository instruction (historical):** Rename the existing
> top-level UI folder named `app` to `ui` if it is the project/application
> folder the team intends to rename. Do not blindly rename an Expo Router
> route directory named `app` without updating routing/configuration. Expo
> Router conventionally uses an `app/` or `src/app/` route directory.

------------------------------------------------------------------------

## 1. Goals and non-goals

### Goals

-   Deliver three interfaces:
    1.  **Android**: React Native app using Expo.
    2.  **Web**: browser app using React Native Web and Expo's web
        tooling.
    3.  **Windows desktop**: native Windows app using React Native
        Windows.
-   Share API access, domain/business logic, validation, types, design
    tokens, and selected UI primitives.
-   Allow each platform to have a layout that suits its environment.
-   Keep platform-specific dependencies and native project files
    isolated.
-   Give future coding agents a predictable place to find features,
    configuration, tests, and build instructions.

### Non-goals

-   Do not promise that every screen or third-party native package will
    work unchanged on all platforms.
-   Do not turn the Windows app into a web page inside a WebView unless
    the product owner explicitly changes the requirement.
-   Do not duplicate business rules across all three apps.
-   Do not force mobile navigation patterns onto desktop or web when a
    platform-specific layout is clearly better.

## 2. Platform strategy

  -------------------------------------------------------------------------------
  Target            Framework         Development       Production output
  ----------------- ----------------- ----------------- -------------------------
  Android           Expo + React      Expo CLI, Android APK for direct
                    Native            emulator/device   installation; AAB for
                                                        Google Play

  Web               Expo + React      Expo CLI in web   Static web export,
                    Native Web        mode              normally `dist/`,
                                                        deployed to web hosting

  Windows           React Native      React Native      Native Windows build;
                    Windows           CLI + Visual      package format depends on
                                      Studio toolchain  publishing/distribution
                                                        setup
  -------------------------------------------------------------------------------

### Important compatibility boundary

Expo's Android and web workflows fit together well. React Native Windows
is a separate native implementation with its own version compatibility
and Windows build prerequisites. Treat Windows as a first-class target,
but do not assume it can be added to any Expo project without
integration work.

Before adding or upgrading dependencies, check: - React Native version
compatibility with the chosen React Native Windows release. - Whether a
library supports Android, web, and Windows. - Whether a package needs
native linking, config plugins, or platform-specific code. - Whether the
Windows target uses the New Architecture required by the selected
release.

Official documentation: - Expo web:
https://docs.expo.dev/workflow/web/ - Expo Router:
https://docs.expo.dev/router/introduction/ - React Native Windows setup:
https://microsoft.github.io/react-native-windows/docs/getting-started/ -
React Native Windows compatibility:
https://microsoft.github.io/react-native-windows/docs/win10-compat/

## 3. Repository layout

Use a monorepo. The following is a target architecture, not a claim that
all projects have already been generated.

``` text
repository-root/
├── README.md
├── package.json                 # workspace scripts and shared tooling
├── pnpm-workspace.yaml          # if using pnpm workspaces
├── tsconfig.base.json
├── .gitignore
├── .editorconfig
│
└── ui/
    ├── README.md                # UI-specific guide if root README is for whole product
    ├── apps/
    │   ├── mobile/              # Expo Android app; optionally iOS later
    │   │   ├── app/              # Expo Router routes, if Expo Router is selected
    │   │   ├── assets/
    │   │   ├── app.json
    │   │   ├── package.json
    │   │   └── tsconfig.json
    │   │
    │   ├── web/                 # web entry/app; can share Expo app where appropriate
    │   │   ├── src/
    │   │   ├── package.json
    │   │   └── ...
    │   │
    │   └── windows/             # React Native Windows app/native solution
    │       ├── src/
    │       ├── windows/          # generated native Windows project/solution
    │       ├── package.json
    │       └── ...
    │
    └── packages/
        ├── shared-ui/           # portable React Native primitives
        ├── shared-logic/        # business logic and state
        ├── api-client/          # HTTP client, auth/session, API schemas
        ├── shared-types/        # shared TypeScript contracts
        ├── design-tokens/       # colors, spacing, typography, radii
        └── test-utils/          # reusable test helpers where practical
```

### Layout decisions

1.  **`ui/` is the top-level UI workspace folder.** If the current
    repository has a top-level `app/` folder that represents the UI
    project, move/rename that folder to `ui/` and update import paths,
    scripts, workspace globs, CI paths, and documentation.
2.  **Do not rename an Expo Router route directory casually.** If `app/`
    is inside an Expo app and contains route files, keep it as
    `ui/apps/mobile/app/` (or use `src/app/` if configured). The name
    `app` has meaning to Expo Router.
3.  **Windows native files belong with the Windows app.** Keep the
    generated `windows/` solution inside the Windows React Native
    project; do not put the solution in a shared package.
4.  If the existing repository already has a stable layout, inspect it
    first and adapt incrementally rather than moving files blindly.
5.  Do not create empty duplicate apps just to match this diagram. Build
    one target at a time and keep the workspace installable after each
    milestone.

## 4. Workspace and package manager

Use one package manager for the whole UI workspace. **pnpm workspaces**
are a reasonable default for a monorepo, but use the existing package
manager if the repository already has a working lockfile and workspace
setup.

Example `pnpm-workspace.yaml`:

``` yaml
packages:
  - "ui/apps/*"
  - "ui/packages/*"
```

Example root `package.json` concept:

``` json
{
  "name": "product-ui-workspace",
  "private": true,
  "packageManager": "pnpm@<approved-version>",
  "scripts": {
    "typecheck": "pnpm -r typecheck",
    "lint": "pnpm -r lint",
    "test": "pnpm -r test"
  }
}
```

Replace `<approved-version>` with a real version selected by the
repository owner. Do not leave a placeholder in a committed package
file.

### Workspace safety rules

-   Pin and document the package manager version.
-   Commit the lockfile.
-   Do not mix npm, Yarn, and pnpm lockfiles.
-   Keep React and React Native dependency versions compatible. Avoid
    installing separate incompatible React copies in shared packages.
-   Configure Metro to resolve workspace packages and transpile shared
    source as required by the selected Expo/React Native setup.
-   Configure TypeScript path aliases only when the bundler resolves the
    same aliases.
-   Avoid symlink workarounds until a reproducible workspace issue has
    been demonstrated.

## 5. Shared-code boundaries

### Put in shared packages

-   API request functions and response types.
-   Authentication/session logic that does not depend on a
    platform-specific secure-storage implementation.
-   Domain rules, calculations, validation schemas, formatters, and
    feature flags.
-   Shared design tokens.
-   Portable components built with React Native primitives such as
    `View`, `Text`, `Pressable`, `TextInput`, and `ScrollView`.
-   State management that is not coupled to browser or native APIs.

### Keep platform-specific

-   Native permission prompts, notifications, file pickers, clipboard,
    system tray, and OS integrations.
-   Browser-only features such as URL/history APIs, DOM access, browser
    storage, and web-specific download behavior.
-   Windows-specific window lifecycle, menus, keyboard shortcuts, and
    native capabilities.
-   Layouts whose information architecture differs substantially between
    touch screens and desktop.
-   Secure storage implementations. Use a platform adapter instead of
    importing one platform's storage module throughout the shared code.

### Platform-specific file resolution

React Native bundlers can resolve platform extensions when configured
correctly. Use this selectively:

``` text
Component.tsx          # shared default
Component.android.tsx  # Android-specific implementation
Component.web.tsx      # web-specific implementation
Component.windows.tsx  # Windows-specific implementation
```

Only create a platform-specific file when the behavior or UI genuinely
differs. Avoid maintaining three copies of every component.

## 6. UI and responsive design rules

-   Build shared **primitives**, not one universal page layout.
-   Mobile: prioritize touch targets, vertical flow, bottom navigation
    where suitable, safe areas, and smaller screens.
-   Web: support browser resizing, keyboard accessibility, browser
    routing, and responsive breakpoints.
-   Windows: support resizable windows, wider layouts, mouse hover/focus
    states, keyboard navigation, and desktop-friendly navigation.
-   Keep typography, color, spacing, border radius, and semantic status
    colors in design tokens.
-   Avoid fixed widths and heights for entire pages. Prefer flexible
    layout, max-width constraints, and responsive breakpoints.
-   Do not assume CSS works in native React Native. Shared components
    should use React Native styling APIs; web-only CSS belongs in the
    web layer.
-   Do not use HTML elements such as `div` or `button` inside shared
    native components. Use React Native primitives. Web-only components
    may use DOM elements in the web app.
-   Accessibility is mandatory: labels, focus behavior, readable
    contrast, accessible names, and keyboard operation where applicable.

## 7. Navigation and routing

Choose navigation per platform based on user experience and
compatibility.

-   **Android:** Expo Router is a good default for file-based routes and
    deep links.
-   **Web:** Expo Router can provide web routes and URL integration when
    the app is built on the Expo universal routing model.
-   **Windows:** verify the selected navigation library supports React
    Native Windows before adopting it. If shared navigation is
    incompatible or produces poor desktop UX, implement a Windows
    navigation adapter while reusing screens and domain logic.

Do not add two routing systems to the same app without a documented
reason.

If using Expo Router: - Keep route files in the configured `app/` or
`src/app/` directory. - Put reusable screens/components outside the
route directory, for example in `src/features/` or
`packages/shared-ui/`. - Use typed route conventions where supported by
the selected Expo SDK. - Test direct URL entry, refresh behavior, back
navigation, and deep links.

## 8. API, authentication, and configuration

All three UIs should use the same backend contract wherever possible.

Suggested API client responsibilities: - Base URL selection by
environment. - Request/response typing. - Authentication headers and
refresh/session handling. - Timeouts and cancellation where supported. -
Standard error normalization. - Request IDs and safe diagnostic
logging. - Retry only idempotent or explicitly retry-safe requests.

Configuration: - Development, staging, and production must have separate
API base URLs. - Never hardcode secrets into a client bundle. Anything
shipped to Android, web, or Windows can be extracted by a user. - Public
environment variables are configuration, not secret storage. - Do not
expose backend service credentials, signing keys, or private API keys in
frontend code. - Use secure platform-specific token storage through
adapters; do not assume browser local storage is equivalent to native
secure storage. - Avoid logging access tokens, passwords, personal data,
or full sensitive request bodies.

## 9. Platform-specific setup

### 9.1 Android with Expo

Prerequisites: - Node.js version supported by the chosen Expo SDK. - The
selected package manager. - Expo CLI through `npx expo`; do not install
a global Expo CLI. - Expo Go for quick compatible experiments, or a
development build when native modules/configuration require it. -
Android Studio and Android SDK for local native builds/emulators, if
local builds are needed.

Typical commands from the Expo app directory:

``` bash
npx expo start
npx expo start --android
```

For a development build or production APK/AAB, follow the EAS Build
documentation or the local Android build workflow selected for the
project. Do not promise that Expo Go supports every native dependency.

Documentation: https://docs.expo.dev/

### 9.2 Web with Expo and React Native Web

Install web dependencies using the Expo-compatible versions:

``` bash
npx expo install react-dom react-native-web @expo/metro-runtime
```

Start the web app:

``` bash
npx expo start --web
```

Create a production web export:

``` bash
npx expo export --platform web
```

The output is normally in `dist/`. Verify the actual output directory
and deployment configuration rather than assuming. Configure the hosting
provider for SPA routing if the selected routing setup requires it.

Web-specific checks: - Browser refresh on nested routes. - Deep-link/URL
behavior. - Responsive layouts at phone, tablet, and desktop widths. -
Keyboard and screen-reader accessibility. - No accidental imports of
native-only modules. - No direct DOM access in shared components. -
Production environment variables and API CORS configuration.

Documentation: https://docs.expo.dev/workflow/web/

### 9.3 Native Windows with React Native Windows

Windows is not just a web build. It requires native Windows development
tools and a React Native/React Native Windows version pair that is
compatible.

Prerequisites commonly include: - A supported Windows development
machine and Windows version. - Visual Studio with the required C++
desktop development workload. - A Windows SDK compatible with the chosen
React Native Windows release. - Node.js and the project's package
manager. - The matching React Native and `react-native-windows`
versions.

Do not run Windows initialization commands until the agent has inspected
the current React Native version and verified the matching Windows
guide. The official guide currently documents a versioned setup process;
use the instructions for the chosen version rather than mixing examples
from different releases.

Typical commands after the Windows project is correctly configured:

``` bash
npx react-native run-windows
```

For production distribution, use Visual Studio's Release configuration
and the package/publishing workflow supported by the project's native
solution. Confirm whether the target is MSIX/AppX or another supported
distribution format.

Windows-specific checks: - Build and launch a Debug build. - Test a
Release build, not only the debugger build. - Resize the window and
verify layout behavior. - Test mouse, keyboard, focus, and
accessibility. - Verify all native dependencies support the selected
React Native Windows version. - Verify packaging, signing, and
clean-machine installation.

Documentation: -
https://microsoft.github.io/react-native-windows/docs/getting-started/ -
https://microsoft.github.io/react-native-windows/docs/win10-compat/

## 10. Build scripts and CI

Do not create root scripts that claim to build a platform before its app
and toolchain actually exist.

As apps are added, expose clear scripts, for example:

``` json
{
  "scripts": {
    "android:start": "pnpm --dir ui/apps/mobile start",
    "web:start": "pnpm --dir ui/apps/mobile exec expo start --web",
    "web:build": "pnpm --dir ui/apps/mobile exec expo export --platform web",
    "windows:start": "pnpm --dir ui/apps/windows exec react-native run-windows"
  }
}
```

These are illustrative. Adjust them to the actual package manager, app
names, package scripts, and working directories. Do not copy them
blindly if the repository structure differs.

CI should progressively add: 1. Install from the committed lockfile. 2.
Formatting/lint checks. 3. TypeScript checks. 4. Unit tests for shared
logic. 5. Web production export. 6. Android build on a suitable runner.
7. Windows native build on a Windows runner with the required Visual
Studio toolchain.

A Linux CI runner generally cannot replace the Windows native build
environment. Keep platform build jobs separate when their
operating-system requirements differ.

## 11. Testing strategy

### Shared packages

-   Unit-test domain logic, validation, formatters, API error mapping,
    and state transitions.
-   Test loading, empty, success, and failure states.
-   Mock network calls rather than requiring a live production backend.

### Android

-   Test on a small screen and a larger device.
-   Test keyboard behavior, permissions, app background/resume, and
    offline/error states where relevant.

### Web

-   Test Chromium-based browser behavior and at least one additional
    browser when the product's support policy requires it.
-   Test responsive breakpoints, browser refresh, keyboard-only
    navigation, and URL handling.

### Windows

-   Test on Windows with a real native build.
-   Test mouse/keyboard interaction, resize behavior, focus order,
    window lifecycle, and installer/package.
-   Do not count a web browser rendering as proof that the
    Windows-native UI works.

## 12. Coding-agent operating procedure

Before editing: 1. Inspect the repository tree, root `package.json`,
lockfiles, TypeScript configuration, Metro config, Expo app config, and
current route structure. 2. Identify whether the existing `app/`
directory is the project folder or an Expo Router route directory. 3.
Check existing versions and installed libraries. 4. Read the relevant
official documentation for those exact versions. 5. Write a short plan
and list any destructive moves before performing them.

During implementation: 1. Preserve the existing working application. 2.
Rename the top-level UI folder to `ui/` only after confirming the move
and updating references. 3. Never rename the Expo Router route directory
just to satisfy the top-level naming requirement. 4. Implement shared
types/API/domain logic before duplicating platform UI. 5. Keep
platform-specific code behind platform files or adapter interfaces. 6.
Add one target at a time and run that target's checks before continuing.
7. Do not silently downgrade React Native or force incompatible peer
dependencies. 8. Do not invent package names, commands, configuration
keys, or support claims. Verify them against official docs. 9. Keep
`README.md` accurate as the architecture changes. 10. If a dependency
has no Windows support, report the exact blocker and propose a
compatible alternative instead of masking it.

After each milestone, report: - Files created/changed. - Commands run. -
Build/test results. - Known limitations. - The next concrete step.

## 13. Recommended implementation milestones

### Milestone 0 --- Repository audit

-   Inventory files and current versions.
-   Confirm what the current `app/` directory means.
-   Confirm package manager and backend API contract.
-   Do not move or delete files until this audit is complete.

### Milestone 1 --- Workspace baseline

-   Create/confirm the `ui/` workspace.
-   Establish shared TypeScript settings and package manager.
-   Ensure the current app still installs and runs.

### Milestone 2 --- Shared foundation

-   Add design tokens, shared types, API client, error handling, and
    portable UI primitives.
-   Add unit tests.
-   Keep secrets out of frontend configuration.

### Milestone 3 --- Android

-   Establish Expo app and navigation.
-   Implement the mobile layout.
-   Test on emulator/device.
-   Document development and production build commands.

### Milestone 4 --- Web

-   Enable React Native Web with compatible Expo dependencies.
-   Add browser-specific layout and route behavior as needed.
-   Verify production export and deployment.

### Milestone 5 --- Windows

-   Verify the chosen React Native/React Native Windows compatibility
    pair.
-   Install/validate Windows build prerequisites.
-   Create or integrate the native Windows project.
-   Add Windows-specific layout/navigation adapters where needed.
-   Build Debug and Release and verify package installation.

### Milestone 6 --- Quality gates

-   Add CI jobs for shared code, web, Android, and Windows.
-   Add a platform compatibility matrix for dependencies.
-   Test clean installs and document release procedures.

## 14. Definition of done

The multi-platform UI foundation is complete only when:

-   [ ] The intended top-level UI folder is named `ui/`, and all
    scripts/configuration/imports referencing the old location are
    updated.
-   [ ] Expo Router routes still work if Expo Router is used.
-   [ ] Android development starts successfully and a device/emulator
    can run the app.
-   [ ] Web development starts and a production web export succeeds.
-   [ ] A native Windows app builds and launches on a supported Windows
    environment.
-   [ ] Shared API/domain logic is not copied into each platform app.
-   [ ] Platform-specific dependencies and known gaps are documented.
-   [ ] Type checks, tests, and lint checks pass.
-   [ ] README instructions match the actual repository and have no
    unverified commands or placeholder versions.

------------------------------------------------------------------------

## 15. Final guidance

Prefer **one monorepo and shared logic**, not one identical screen
implementation for every platform. Expo is the primary toolchain for
Android and can also deliver the web UI. React Native Windows is a
separate native target that must be integrated and validated against a
compatible React Native version.

The coding agent's first task is to audit the existing project and
determine whether `app/` is a top-level project folder or an Expo Router
route folder. Only then should it perform the rename to `ui/`.
