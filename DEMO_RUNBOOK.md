# SANKET: demo runbook (Android phone over USB)

## What was fixed today

| Problem seen | Cause | Fix |
|---|---|---|
| "Couldn't reach the ML service at http://192.168.1.3:8000" | `sanket-app/.env.local` pointed at an old Wi-Fi IP. Metro also reads that file only when it starts, so the running Metro kept serving the old value. | `.env.local` now uses `http://localhost:8000`, and Metro was restarted with `--clear`. The bundle no longer contains the old IP. |
| Visual Result screen would not scroll | The screen was a plain `View`, and Metro was started with `CI=1`, which stops it watching files, so the phone kept getting a stale bundle. | Changed the screen to a `ScrollView`, and restarted Metro without `CI=1`. |
| Done did not go Home | Old code used `dismissTo`, which did not clear the report stack. | Done now clears the report flow and goes to Home (or Profile if opened from My reports). |
| Reports were not stored | Nothing was saved with the incident. | Each analysis is saved in Convex (class, confidence, urgency, on-device or server, language, guidance) and listed under Profile, My reports, with a tag. |

Not yet confirmed on the phone: scrolling, Done to Home, and the My reports list. The Convex side was tested. Check these before the demo.

## Terminals: you need 3 (plus one optional)

| # | Purpose | Keep open? |
|---|---|---|
| 1 | ML service (guidance and triage) | Yes |
| 2 | Phone link (adb tunnels): run once, then it can be closed | No |
| 3 | App server (Metro), which serves the app code to the phone | Yes |

Start them in this order.

### Terminal 1: ML service
```powershell
cd D:\pbl\Sanket_ML\Sanket_ML
python -m uvicorn service.app:app --host 0.0.0.0 --port 8000
```
Wait for "Application startup complete".

### Terminal 2: connect the phone
Plug in the USB cable (USB debugging on) and run:
```powershell
adb devices
adb reverse tcp:8082 tcp:8082
adb reverse tcp:8000 tcp:8000
```
`adb devices` must show your phone as `device`. Repeat the two `reverse` lines after every unplug/replug.

### Terminal 3: app server
```powershell
cd D:\pbl\sanket-app
npx expo start --dev-client --port 8082 --clear
```
Do not set `CI=1`. It stops Metro from noticing code changes.

### Open the app
Open the SANKET app on the phone. If it does not connect on its own, run this in any terminal:
```powershell
adb shell am start -a android.intent.action.VIEW -d "exp+sanket-app://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8082"
```

### Demo flow
1. Sign in.
2. Report Emergency, then Burn or Wound, then take or pick a photo. Detection runs on the phone, so it also works offline.
3. Get First-Aid Instructions, then play a step aloud, then tap Done.
4. Profile, My reports shows the saved report with its tag.
5. To show Hindi or Marathi, change the language in Profile.

Guidance and saving reports need Terminal 1 and an internet connection (Convex). Detection alone does not.

## Why port 8082?
Port 8081 is Expo's default. It was already used by another project (`D:\Fanex\fanex`) when we set this up, and two servers cannot share a port. 8082 was free, so we used it.

If 8081 is definitely free when you demo, you can use it. Change all three places together: `--port 8081`, `adb reverse tcp:8081 tcp:8081`, and `localhost%3A8081` in the launch link. Keeping 8082 avoids that mismatch.

## Why `adb reverse tcp:...`?
The phone is a separate device, so `localhost` on the phone means the phone itself, not your laptop. `adb reverse tcp:8082 tcp:8082` tells the phone: "when the app connects to `localhost:8082`, send it through the USB cable to port 8082 on the laptop."

- `8082` is for Metro (the app code).
- `8000` is for the ML service.

Benefits:
- It works without Wi-Fi, so it doesn't depend on the venue network.
- The laptop's IP address can change and nothing breaks, which is what caused the "can't reach ML service" error.
- The Windows Firewall does not block it.

Cost: the cable must stay plugged in. The tunnels are lost when you unplug, restart adb, or reboot, so run the two `reverse` lines again.

## If something breaks

| Symptom | Check |
|---|---|
| "Couldn't reach the ML service" | Terminal 1 is running. Open `http://localhost:8000/health` on the laptop and it should say `status: ok`. Run `adb reverse --list`, which should show 8000 and 8082. |
| App can't load or shows an old screen | Restart Terminal 3 with `--clear`, then force-close and reopen the app. |
| `adb devices` is empty | Replug the cable, accept the "Allow USB debugging" prompt on the phone, and run `adb kill-server` then `adb devices`. |
| Port already in use | `Get-NetTCPConnection -State Listen -LocalPort 8000,8082` shows which process holds it. |

## Stop everything
Press Ctrl+C in Terminals 1 and 3, or:
```powershell
Get-NetTCPConnection -State Listen -LocalPort 8000,8082 | ForEach-Object { taskkill /PID $_.OwningProcess /T /F }; adb kill-server
```
