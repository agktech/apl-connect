# APL Connect — Industrial Logbook, Phase 1 (Test)

Plain HTML/CSS/JS. No build step. Cloudflare Pages can serve this folder directly.

## What Phase 1 contains

- **Login, DEMO ONLY by default.** No backend is needed to test.
  - Admin demo: `admin@apl.test` / `admin123`
  - Operator demo: `operator@apl.test` / `operator123`
  - These are test logins only. No real password, token or company data is in this code.
- **Dashboard tiles**, mobile-friendly large touch targets, and a floating yellow `+` button (Admin only).
- **Generic engine, boiler content as first data:**
  - Section (preloaded): Boiler House
  - Equipment (preloaded): Loss Boiler, Bay Boiler, Zozen HP Boiler
  - Admin can add a new Section and new Equipment inside a section with `+`. Operator cannot — Admin-only screens are hidden from Operators.
  - Generic data model (ready for future modules): Sections, Equipment, Templates/Reading Fields (via the form definitions in code), Reading Values (daily + hourly), Users. Every reading record already carries `archived: false` and `archiveDate: null` for later archiving.
- **Daily Overview — fill once daily.** Exactly the v3 Daily Boiler Summary fields (Site Main Gas, Loss/Bay/Zozen HP Gas, Boilers Total Gas, Loss/Zozen Diesel, Total Diesel, Boiler House Factory Water, Softners Factory Water, Loss/Bay/Zozen HP Soft Water, Total Soft, Steam Generation, Gas m³/ton, Water m³/ton, Blowdown, plus Filled By and Remarks).
  - One entry per date. Saving a second entry for the same date warns and asks to replace it.
  - Auto-calculations, exactly like the v3 Excel formulas:
    - Consumption = today's meter reading − yesterday's reading (first day: type consumption manually, because there is no yesterday yet)
    - Boilers Total Gas = Loss + Bay + Zozen gas consumption
    - Total Diesel, Total Soft = sums of their boilers
    - Gas m³/ton = Total Gas / Steam Generation; Water m³/ton = Total Soft / Steam Generation
  - Blank reading = not entered. 0 = meter/boiler at zero or off.
- **Hourly boiler screens — one tab/screen per boiler, NOT one combined sheet.**
  - Loss Boiler, Bay Boiler, Zozen HP Boiler. New equipment added by Admin also appears as a tab.
  - Fill one row per hour, from shift start to end. The next operator continues on the next row of the same boiler sheet.
  - Fields per v3: date, time, shift (Morning/Evening/Night), operator, steam pressure/temp/flow, drum level, **own feed water tank level + temp (per boiler, not shared)**, feed water pressure/flow, fuel gas meter + auto consumption, fuel gas pressure, stack temp, O₂, CO, soft water meter + auto consumption, blowdown Yes/No, TDS, pH, alarm Yes/No, remarks.
  - Diesel meter + auto consumption **only on Loss and Zozen sheets**. Bay has none in the v3 daily summary, so no diesel fields are shown on the Bay screen.
  - Hourly auto-consumption = this row's reading − the previous saved row's reading for that same boiler.
- **Reports:** filter by date range and by boiler/section, view readings, Export CSV, and Print (browser print = Save as PDF).

## How to connect a free Appwrite Cloud project later (owner only, no password sharing)

1. The owner creates a free Appwrite Cloud project (Appwrite account stays with the owner).
2. In the Appwrite console, create a database and collections for: Daily Overview, Hourly Readings, Sections, Equipment, Users. Give the Users records a `role` field (`Admin` or `Operator`).
3. Open this app → Settings, and paste only: Endpoint, Project ID, Database ID and the Collection IDs. Save.
4. Log out and log in again. Login will then try Appwrite email/password auth first, and readings will be saved to Appwrite as well as locally. If the role lookup fails, the user is treated as Operator.
5. Never paste an Appwrite account password, API key or service token into this app or into chat. If Appwrite settings are blank, the app stays in DEMO mode and still works fully.

## Intentionally left for later (not in Phase 1)

- Creating new reading templates from an Excel upload, and editing parameters in the app (the v3 field lists are baked into the forms for now; adding a new section/equipment needs no code, adding a new parameter still does — that is the next step after testing).
- Maintenance, Inventory, Production, KPI and Utility Monitoring modules (the generic tables are ready, the screens are not built yet).
- Supabase / Cloudflare R2 archiving and Power BI. Archive is prepared only: every record has `archived` + `archiveDate`. The 365-day / 75%-to-50% archive rule from the APL Connect PDF is not implemented yet.
- Offline entry and sync (if plant WiFi is weak, this needs a separate decision).

## v3 assumptions still to confirm

- Shift hours: the app offers Morning / Evening / Night and hourly logging all day. Confirm the real shift start/end times.
- Bay Boiler diesel: assumed none, matching the v3 daily summary. Tell us if Bay also uses diesel and diesel fields will be added to Bay.
- Hourly detail parameters (steam pressure/temp, O₂, CO, TDS, pH, etc.) are standard boiler parameters from v3. The lower "Boiler Log Book" part of the original plant photo was blank, so confirm those parameters against the real plant log book before floor use.
- This Phase 1 version is for developing/testing only. Do not put it on the Archroma floor until the parameters, shifts and Appwrite project have been confirmed.

## Source of truth

`Boiler Log Sheet - APL Connect v3 - Daily Overview + Hourly Per Boiler.xlsx` — Sheet 1 Daily Boiler Summary, Sheets 2–4 hourly per boiler (Loss, Bay, Zozen HP).
