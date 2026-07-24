# TaskFlow frontend and user guide

TaskFlow is a focused task-management workspace for one company. Administrators manage accounts,
managers create and assign work, and workers see their own assignments, start them, and mark them
complete. Everyone gets a role-appropriate view of the system.

This directory contains the Angular application. Backend development and deployment are documented
in [`../backend/README.md`](../backend/README.md).

## User guide

### Roles

TaskFlow has three roles:

- **Administrator:** creates and maintains user accounts, resets passwords, activates or deactivates
  accounts, and reviews account audit activity. Administrators do not see task data.
- **Manager:** creates tasks, selects the responsible worker, follows progress, and accesses task
  attachments.
- **Worker:** sees only assigned tasks, updates their progress, and accesses task attachments.

Permissions are enforced by the backend. Hiding a manager-only control in the interface is not the
only authorization check.

### Sign in

1. Open the TaskFlow URL supplied by your administrator.
2. Enter your company email and password.
3. Select **Sign in**.

New users receive an invitation email. Open its 24-hour link, choose a password of 15 to 200
characters, and sign in. The bootstrap administrator is the only account that may be required to
replace an initial password before using the rest of the application.

If MFA is enabled, sign-in asks for a six-digit authenticator code. A previously saved recovery code
can be used when the authenticator is unavailable. Each recovery code works once.

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

Use **Forgot your password?** to request a 30-minute recovery link. The response is deliberately the
same whether or not an account exists. Any signed-in user can choose **Change password**; changing it
signs out all older sessions.

Use **Security** to enable or disable authenticator MFA, generate new recovery codes, inspect active
12-hour sessions, revoke a device, or revoke every other session. Save recovery codes outside the
browser when they are displayed; TaskFlow cannot show them again.

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

### Administrator workflow

#### Find and review users

1. Select **Users** in the navigation.
2. Search by name, email, job title, or department.
3. Optionally filter by role or Pending, Active, or Inactive state and move through the results.
4. Select a user to edit their profile or review their audit timeline.

The optional profile fields are job title, department, and phone number. Phone numbers must use E.164
format, such as `+14155552671`.

#### Create an account

1. Select **Create user**.
2. Enter the user's name and company email, optional profile fields, and role.
3. Save the account.
4. TaskFlow queues an invitation email. If delivery must be retried, open the user and select
   **Resend invitation**; issuing a new link invalidates the previous one.

#### Maintain an account

From the user details page an administrator can update profile information, change a role when the
account has no task or attachment history, send another user's password-recovery email, reset MFA and
sessions, and deactivate or reactivate an account. Email changes require confirmation at the new
address. Deactivation is blocked while a manager or worker has unfinished role-related tasks.

For continuity and safety, administrators cannot deactivate, demote, or reset their own account, and
the last active administrator cannot be changed or deactivated. Accounts are deactivated rather than
deleted so audit and task history remain intact.

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
- **Invitation expired:** ask an administrator to resend the invitation.
- **MFA code rejected:** wait for the next code and retry, or use one unused recovery code.
- **Account changed since it was loaded:** refresh the user details before retrying the administrator
  action; another administrator changed it first.
- **Role or deactivation blocked:** resolve the task-history or unfinished-work condition shown by the
  API, or use another active administrator for self-protected actions.
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

| Route                 | Purpose                      | Access                       |
| --------------------- | ---------------------------- | ---------------------------- |
| `/login`              | Sign-in and MFA challenge    | Public                       |
| `/forgot-password`    | Request account recovery     | Public                       |
| `/accept-invitation`  | Accept an emailed invitation | Public token                 |
| `/reset-password`     | Complete password recovery   | Public token                 |
| `/confirm-email`      | Confirm a new email address  | Public token                 |
| `/change-password` | Replace the current password | Authenticated                |
| `/settings/security`  | MFA and session controls     | Authenticated                |
| `/admin/users`     | Search and filter users      | Administrator                |
| `/admin/users/new` | Create a user                | Administrator                |
| `/admin/users/:id` | Edit and audit a user        | Administrator                |
| `/tasks`           | Role-specific task dashboard | Manager or worker            |
| `/tasks/new`       | Create and assign a task     | Manager                      |
| `/tasks/:id`       | Task details and attachments | Authorized manager or worker |

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
