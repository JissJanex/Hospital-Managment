# Hospital Management

## Supabase setup

1. Add your project URL and anon key to `.env`.
2. Install dependencies with `npm install`.
3. Start the app with `npm run dev`.

The frontend reads and inserts records for these tables:

- `department`
- `doctor`
- `patient`
- `appointment`
- `medical_record`
- `lab_test`
- `prescription`
- `bill`

Make sure your Supabase project has Row Level Security policies that allow the frontend to `select` and `insert` on those tables for the anon key you are using.
