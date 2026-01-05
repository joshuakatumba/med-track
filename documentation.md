# Muzeeyi Patient Tracker - System Documentation

## 1. System Overview
**Muzeeyi Patient Tracker** is a modern, responsive web application designed for healthcare facilities to manage patient intake, waiting queues, and historical records efficiently. The system provides a seamless digital workflow from patient registration to consultation tracking.

### Key Features
-   **Dashboard & Analytics**: Real-time overview of daily visits, waiting queues, and department loads.
-   **Patient Registration**: Fast and intuitive entry form for new patients using custom-styled inputs.
-   **Live Queue Management**: Real-time waiting list with "Check Out" functionality for moving patients to 'Completed' status.
-   **Record Management**: Full CRUD (Create, Read, Update, Delete) capabilities for patient records.
-   **Historical Logs**: A searchable, tabular view of all past patient visits.
-   **Responsive Design**: Fully responsive interface optimized for desktop and tablet usage, featuring a "Blue/Glass" aesthetic.

---

## 2. Technical Architecture
The application is built on a robust, modern tech stack ensuring performance, scalability, and ease of maintenance.

### Technology Stack
-   **Frontend Framework**: React 18 (TypeScript) with Vite for build tooling.
-   **Styling**: Tailwind CSS for utility-first styling with custom glassmorphism effects.
-   **Database**: Supabase (PostgreSQL) for reliable relational data storage.
-   **Authentication**: Firebase Authentication (Anonymous & Custom Token support) ensures secure access.
-   **Icons**: Lucide React for consistent, crisp iconography.
-   **Deployment**: Client-side app suitable for deployment on Vercel, Netlify, or similar static hosts.

### Project Structure
-   `src/App.tsx`: The core container logic, managing global state (user, visits), routing (views), and data synchronization.
-   `src/lib/supabase.ts`: Centralized configuration for the Supabase client connection.
-   `src/components/CustomSelect.tsx`: Reusable, polished dropdown component replacing native browser selects.
-   `vite.config.ts`: Configuration for Vite, handling environment variable injection and plugins.

### Data Flow
1.  **State Management**: `App.tsx` maintains local React state (`visits`, `stats`) for immediate UI responsiveness.
2.  **Persistence**: User actions (Register, Update, Delete) trigger asynchronous calls to Supabase.
3.  **Synchronization**: The application employs "Optimistic Updates" to reflect changes instantly in the UI while awaiting server confirmation.
4.  **Derived State**: Analytics (e.g., "Seen Today", "Dept Load") are calculated on-the-fly using `useMemo` for performance.

---

## 3. Installation & Setup Guide

### Prerequisites
-   Node.js (v16 or higher)
-   npm (Node Package Manager)
-   Valid Supabase Project URL & Anon Key
-   Firebase Project Configuration

### Step-by-Step Installation
1.  **Clone the Repository**
    ```bash
    git clone <repository_url>
    cd muzeeyi-app
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory. You must replace the placeholders with your actual keys:
    ```env
    VITE_SUPABASE_URL=https://your-project-ref.supabase.co
    VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
    ```
    *Note: Failure to configure this will trigger the "Configuration Required" warning banner in the app.*

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:5173`.

5.  **Build for Production**
    ```bash
    npm run build
    ```
    This generates a `dist/` folder ready for deployment.

---

## 4. User Manual

### Dashboard View
The **Dashboard** is the command center showing live facility status.
-   **Status Cards**: View "Seen Today", "Pending" queue size, and "Total Traffic" at a glance.
-   **New Patient Entry**: Fill in Name, Age, Gender, and Service. Click **"Register"** to add to the queue.
-   **Live Waiting List**: Shows patients currently 'Waiting'. Click **"Check Out"** to mark a patient as 'Completed'.
-   **Department Load**: A sidebar chart visualizing the distribution of patients across services (e.g., Dental, Triage).

### Editing Records
1.  Locate the patient in the "Historical Logs" or "Queue".
2.  Click the **Pencil Icon** (Edit).
3.  The main form will auto-fill with the patient's data.
4.  Modifies details as needed.
5.  Click **"Update Patient"** to save changes, or **"Cancel"** to discard.

### Historical Logs / All Logs
Access via the top navigation bar.
-   Displays a comprehensive table of all visits.
-   Columns: Date/Time, Name, Age, Gender, Dept, Status, Actions.
-   **Actions**: Use the Pencil icon to Edit or the Trash bin icon to Delete a record permanently.

---

## 5. Troubleshooting Common Issues

### "Configuration Required" Banner
-   **Cause**: The application detects placeholder values in `supabaseConfig.url`.
-   **Fix**: Update your `.env` file with valid Supabase credentials and restart the dev server.

### "Database Error" Red Banner
-   **Cause**: A specific database operation (Insert/Fetch) failed.
-   **Check**:
    -   Ensure your Supabase project is active.
    -   Check Row Level Security (RLS) policies on the `patient_visits` table.
    -   Verify internet connectivity.

### Usage Limits
-   **Firebase/Supabase**: Free tier limits may apply depending on your project settings. Monitor your provider's dashboard for usage alerts.
