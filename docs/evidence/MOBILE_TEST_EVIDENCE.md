# Mobile test evidence — Phase 4

**Date:** 2026-06-21  
**Environment:** Node v22.14.0, pnpm 9.15.4, Expo SDK 52  
**Sandbox:** `LIVE_TRANSFERS_ENABLED=false`

## Offline verification (no simulator required)

Use when local hardware cannot run native iOS/Android builds (low RAM, beta macOS, CocoaPods/Xcode mismatch):

```bash
cd projects/rupee-route
bash scripts/test-mobile-offline.sh
```

**Latest result (2026-06-21):** **PASS** — lint, typecheck, build, **19 unit tests**, 5 Maestro YAML flows validated, bundle ID check.  
Evidence: `docs/evidence/mobile-offline-20260621T0024Z/`

## React Native unit tests (Vitest)

```bash
pnpm --filter @rupeeroute/mobile test
```

**Result:** 8 files, **19 passed** (Vitest + react-native-web; `maxWorkers: 1` for low-RAM machines)

Coverage includes:

- Component tests: `Button`, `SandboxBanner`, `TransferListItem`
- Hooks: biometrics, deep-link parsing
- Services: send draft persistence / resume paths (offline restart)
- i18n EN/DE strings

## Maestro E2E flows (iOS Simulator / Android Emulator)

**Status:** **ENVIRONMENT_PENDING** on this machine — beta macOS + Xcode iOS 26.5 mismatch, CocoaPods `visionos` error, insufficient RAM for `expo run:ios`. Flows are defined and YAML-validated; run on CI or stable Mac hardware.

Flows live in `.maestro/flows/`:

| Flow              | Purpose                                    |
| ----------------- | ------------------------------------------ |
| `login.yaml`      | Auth smoke                                 |
| `send-smoke.yaml` | Amount → quote                             |
| `send-full.yaml`  | Full send through review                   |
| `coupons.yaml`    | Coupons tab                                |
| `tabs-a11y.yaml`  | Tab navigation (TalkBack/VoiceOver labels) |

Run when hardware allows (built Expo dev client + API):

```bash
bash scripts/provision-maestro-user.sh   # auto sandbox user
bash scripts/test-mobile-maestro.sh ios
bash scripts/test-mobile-maestro.sh android
```

## Accessibility & failure-state coverage (automated unit layer)

| Scenario                                 | Test location                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------- |
| Large text (`maxFontSizeMultiplier={2}`) | All tab/send screens                                                            |
| VoiceOver/TalkBack labels                | `tabBarAccessibilityLabel`, component `accessibilityRole`                       |
| Offline banner                           | `OfflineBanner` + send draft storage tests                                      |
| Quote expiry / failure                   | Web parity; mobile send screens surface API errors                              |
| Biometric gate                           | `useBiometricAuth` + settings security card                                     |
| Deep links                               | `useDeepLink.test.ts` (`rupeeroute://transfer/:id`, `rupeeroute://send/review`) |
