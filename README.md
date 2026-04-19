# Hospital Management System

A React + Vite hospital operations dashboard backed by Supabase. The app supports secure sign-in, entity management (CRUD), search, billing logic, and appointment validation against doctor working days.

## Features

- Supabase authentication (email/password sign-in + session persistence)
- Confirm logout modal before signing out
- Dashboard overview with module navigation
- Search across records
- Create, view, update, and delete records
- Doctor availability selection with weekday checkboxes
- Appointment creation guard:
	- Shows selected doctor's working days in the add-appointment form
	- Blocks insert when selected appointment date is outside doctor availability
- Billing safeguards:
	- Prevents paid amount greater than total amount
	- Auto-derives bill status (`Pending`, `Partially Paid`, `Paid`)

## Tech Stack

- React 19
- Vite 8
- Supabase JS Client v2
- ESLint 9

## Modules Covered

The application works with these tables:

- `department`
- `doctor`
- `patient`
- `appointment`
- `medical_record`
- `lab_test`
- `prescription`
- `bill`

## Project Structure

```text
Hospital-Managment/
	public/
	src/
		assets/
		components/
			AddEntityModal.jsx
			ConfirmLogoutModal.jsx
			DataTable.jsx
			OverviewPanel.jsx
			RecordDetailModal.jsx
			Sidebar.jsx
			SidebarAddActions.jsx
			SignInPage.jsx
			StatsGrid.jsx
			Topbar.jsx
		config/
			addEntityConfig.js
			navigation.js
		lib/
			supabase.js
		services/
			hospitalData.js
		utils/
			formatters.js
		App.css
		App.jsx
		index.css
		main.jsx
	eslint.config.js
	index.html
	package.json
	README.md
	vite.config.js
```

## Prerequisites

- Node.js 18+
- npm 9+
- A Supabase project

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

If these are missing, the app shows a configuration error at runtime.

## Getting Started

```bash
npm install
npm run dev
```

The app runs on Vite default port (usually `http://localhost:5173`).

## Available Scripts

```bash
npm run dev      # start local dev server
npm run build    # production build
npm run preview  # preview production build locally
npm run lint     # run eslint
```

## Supabase Setup Checklist

1. Create all required tables listed above.
2. Ensure table column names match the frontend form config (from `src/config/addEntityConfig.js`).
3. Enable email/password auth in Supabase Authentication settings.
4. Create at least one user account for sign-in.
5. Configure Row Level Security (RLS) policies for authenticated users.

Minimum policy intent needed by this UI:

- `SELECT` on all listed tables
- `INSERT` for create flows
- `UPDATE` and `DELETE` for detail modal edit/delete flows

## Doctor Availability and Appointment Validation

### Doctor Setup

- While adding a doctor, `available_days` is selected using weekday checkboxes.
- Value format stored in DB is a comma-separated short-day string, e.g.:

```text
Mon, Tue, Thu
```

### Appointment Guard

- In Add Appointment modal, selecting a doctor shows their working days.
- On submit, selected `appointment_date` is converted to weekday.
- If weekday is not in doctor working days, insertion is blocked and an error is shown.

## Data Handling Notes

- Numeric fields are normalized before insert/update.
- `time` fields are normalized to include seconds (`HH:mm:ss`).
- Empty form inputs are omitted from payloads.
- For bills:
	- `paid_amount` defaults to `0` when omitted and `total_amount` is present.
	- `balance` is not sent from client (expected to be computed server-side).

## Authentication Flow

- App checks current session at startup.
- If no session exists, Sign In page is shown.
- After login, app fetches live table data.
- Logout requires confirmation in a modal.

## Troubleshooting

### Missing Supabase config error

If you see an error about missing env vars:

- Verify `.env` values for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Restart the Vite dev server after changing `.env`.

### Login fails

- Confirm user exists in Supabase Auth.
- Check email/password authentication provider is enabled.

### "Failed to load/create/update/delete" errors

- Usually caused by RLS policy restrictions or missing table columns.
- Check Supabase logs and table schema.

### Appointment rejected even when date seems correct

- Ensure doctor `available_days` is stored using supported short names:
	- `Mon, Tue, Wed, Thu, Fri, Sat, Sun`

## Build for Production

```bash
npm run build
npm run preview
```

Generated output is in `dist/`.

## Recommended Next Improvements

- Add forgot-password/reset-password flow
- Add role-based access control (`admin`, `staff`, etc.)
- Add server-side constraints/triggers for doctor availability checks
- Add test coverage for form validation and data services
