# TaskFlow frontend and user guide

TaskFlow is a focused task-management workspace for one company. Managers create and assign work,
while workers see their own assignments, start them, and mark them complete. Everyone gets a clear
view of deadlines, progress, overdue work, and authorized attachments.

This directory contains the Angular application. Backend development and deployment are documented
in [`../backend/README.md`](../backend/README.md).

## User guide

### Roles

TaskFlow has two roles:

- **Manager:** creates tasks, selects the responsible worker, follows progress, and accesses task
  attachments.
- **Worker:** sees only assigned tasks, updates their progress, and accesses task attachments.

Permissions are enforced by the backend. Hiding a manager-only control in the interface is not the
only authorization check.

### Sign in

1. Open the TaskFlow URL supplied by your administrator.
2. Enter your company email and password.
3. Select **Sign in**.

Demo installations can provide these seeded accounts:

| Role    | Email                   |
| ------- | ----------------------- |
| Manager | `manager@company.local` |
| Worker  | `worker1@company.local` |
| Worker  | `worker2@company.local` |

Their password is the deployment's configured `SEED_PASSWORD`; obtain it from the administrator. If
authentication fails, check the email and password and ask the administrator whether the demo users
were enabled.

Use **Sign out** in the top-right account area when finished.

### Navigate the workspace

After signing in, TaskFlow opens the task dashboard:

- the summary cards show total, in-progress, overdue, and completed task counts;
- the **Status** selector filters the list by Assigned, In progress, Overdue, or Completed;
- selecting a task title or **View** opens its details;
- the account area displays the signed-in user and role.

Use the **Dark/Light** switch in the header or login screen to change the color theme. The selected
theme is remembered by the browser.

### Manager workflow

#### Create and assign a task

1. Select **Create task** in the navigation or **+ Create task** on the dashboard.
2. Enter a concise title. A description is optional but should explain the expected outcome.
3. Select the worker responsible for the task.
4. Optionally choose a deadline. The displayed date and time use your local timezone.
5. Optionally choose an initial attachment of up to the configured upload limit, which is 10 MB by
   default.
6. Select **Create and assign task**.

If the task is created but the optional upload fails, TaskFlow keeps the task and provides a link to
open it. The attachment can be uploaded again from the task details page.

#### Follow work

The manager dashboard lists tasks created by the signed-in manager. Each task shows its assignee,
deadline, effective status, and attachment count. Open a task to see its description, assignment,
timestamps, and attachments.

Managers monitor progress but do not change the worker's progress status.

### Worker workflow

The worker dashboard contains only tasks assigned to the signed-in worker.

1. Review the title, creator, deadline, and current status.
2. Select **Start** from the dashboard or **Start task** from the details page to move an Assigned task
   to In progress.
3. Select **Complete** or **Mark completed** when the work is finished.

A worker can also complete an Assigned task directly. Completion is final and cannot be reverted in
this MVP.

### Status meanings

| Status          | Meaning                                                |
| --------------- | ------------------------------------------------------ |
| **Assigned**    | The task is ready but work has not been started        |
| **In progress** | The assigned worker has started the task               |
| **Completed**   | The assigned worker has finished the task              |
| **Overdue**     | The deadline passed while the task remained unfinished |

Overdue is calculated from the deadline; it does not replace the task's underlying progress. Completing
an overdue task changes its effective status to Completed.

### Attachments

Managers who created a task and the assigned worker can use its attachments:

- open the task details page;
- select **Choose a file**, then **Upload** to add an artifact;
- select **Download** beside an existing attachment to retrieve it.

Attachment names and files are handled through the protected backend. Do not upload credentials,
private keys, or unrelated sensitive information.

### Common problems

- **Nothing happens after sign-in:** refresh once, then verify the production `/api` proxy and backend
  are available. If the problem persists, report the browser error and approximate time to the
  administrator.
- **Invalid email or password:** re-enter the credentials or request a password reset/change from the
  administrator.
- **Request could not be completed:** the backend may be starting, unavailable, or rejecting the
  request. Wait briefly and retry once.
- **Not allowed to perform this operation:** confirm that you are the task's creating manager or
  assigned worker and that your role permits the action.
- **Session expired:** sign in again. Access sessions have a limited lifetime.
- **Attachment failed after task creation:** open the newly created task and retry the upload there.

## Frontend development

### Requirements

- Node.js 24;
- npm 11;
- the TaskFlow backend running on `http://localhost:8080`.

Install dependencies and start Angular:

```powershell
Set-Location frontend
npm ci
npm start
```

Open `http://localhost:4200`. `proxy.conf.json` forwards relative `/api` requests to the local backend,
keeping cookie and CSRF behavior same-origin during development.

The frontend never stores the access JWT in local storage or JavaScript-readable state. Angular reads
the separate CSRF cookie and sends the corresponding header for protected mutations.

### Main routes

| Route        | Purpose                      | Access                       |
| ------------ | ---------------------------- | ---------------------------- |
| `/login`     | Sign-in screen               | Public                       |
| `/tasks`     | Role-specific task dashboard | Authenticated                |
| `/tasks/new` | Create and assign a task     | Manager                      |
| `/tasks/:id` | Task details and attachments | Authorized manager or worker |

Unknown routes return to the application entry route.

### Tests and production build

Run the unit/component tests once:

```powershell
npm test -- --watch=false
```

Create an optimized production build:

```powershell
npm run build
```

The Vercel build output is `dist/frontend/browser`.

## Deploy on Vercel

Import the repository with:

- Root Directory: `frontend`
- Framework Preset: Angular
- Node.js: `24.x`
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: `dist/frontend/browser`

Before the final deployment, update `vercel.json` and replace the reserved backend placeholder with the
exact Render service origin:

```json
"destination": "https://<render-service>.onrender.com/api/:path*"
```

The rewrite keeps browser requests on relative `/api` URLs and proxies them to Render. The following SPA
rewrite makes refreshed Angular routes return `index.html` instead of a Vercel 404.

Set the backend's `FRONTEND_ORIGIN` to the exact stable Vercel production origin without a trailing
slash. Database credentials, JWT secrets, and Supabase secret keys belong only in Render and must never
be configured in Vercel or frontend source files.
