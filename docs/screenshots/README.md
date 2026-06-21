# RupeeRoute — Screenshot Evidence

Captured during final verification audit (**2026-06-20**).

## How to regenerate

```bash
pnpm build
# Terminal 1
cd apps/admin && npx next start -p 3003
# Terminal 2
cd apps/web && npx next start -p 3000
# Terminal 3
npx playwright@1.61.0 install chromium
npx playwright@1.61.0 screenshot --viewport-size=1280,720 http://localhost:3003/login docs/screenshots/admin-login-desktop.png
# ... repeat for other viewports and URLs
```

## Files

| File                          | Viewport | Page                                       |
| ----------------------------- | -------- | ------------------------------------------ |
| `admin-login-desktop.png`     | 1280×720 | Admin login                                |
| `admin-login-tablet.png`      | 768×1024 | Admin login                                |
| `admin-login-mobile.png`      | 390×844  | Admin login                                |
| `admin-transfers-desktop.png` | 1280×720 | Admin transfers (unauthenticated redirect) |
| `web-home-desktop.png`        | 1280×720 | Consumer home                              |
| `web-home-tablet.png`         | 768×1024 | Consumer home                              |
| `web-home-mobile.png`         | 390×844  | Consumer home                              |
