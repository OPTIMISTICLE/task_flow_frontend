# TaskFlow frontend and user guide

TaskFlow is a role-based task-management workspace for one company. Administrators maintain user
accounts, managers create and assign work, and workers update their own assignments. This repository
contains the Angular application and the end-user guide. The API is maintained in the
[TaskFlow backend repository](https://github.com/OPTIMISTICLE/task_flow_backend).

## User guide

### Roles and account states

TaskFlow has three isolated roles:

- **Administrator:** creates and maintains accounts, resends invitations, initiates password
  recovery, resets MFA, controls activation, and reviews user audit activity. Administrators do not
  have access to task data.
- **Manager:** creates tasks, assigns active workers, follows progress, and uses attachments on tasks
  they created.
- **Worker:** sees assigned tasks, updates their progress, and uses those tasks' attachments.

An account can be **Pending**, **Active**, or **Inactive**. Pending users must accept their invitation;
active users can sign in; inactive users cannot authenticate. The backend enforces every permission
even when the interface hides controls that do not apply to the current role.

### Invitation and first sign-in

1. Open the invitation sent by TaskFlow within 24 hours.
2. Choose a password between 15 and 200 characters.
3. Return to the TaskFlow login page and sign in with the invited email address.

An administrator can resend an expired invitation. A new invitation invalidates the previous link.
The bootstrap administrator may be required to replace an initial password before accessing the rest
of the application.

Demo installations may provide these accounts:

| Role | Email |
| --- | --- |
| Manager | `manager@company.local` |
| Worker | `worker1@company.local` |
| Worker | `worker2@company.local` |

Their password is the deployment's configured `SEED_PASSWORD`; obtain it from the administrator.
TaskFlow never displays that deployment secret in the browser.

### Sign in, recovery, and security

1. Open the TaskFlow URL provided by the administrator.
2. Enter the company email address and password.
3. Select **Sign in**.

When MFA is enabled, enter the current six-digit authenticator code. An unused recovery code can be
used if the authenticator is unavailable; each recovery code works once.

Use **Forgot your password?** to request a recovery email. The link expires after 30 minutes, and the
page gives the same response whether or not the account exists. This prevents account discovery.

After signing in:

- **Change password** replaces the current password and invalidates older sessions.
- **Security** enables or disables authenticator MFA, replaces recovery codes, lists active 12-hour
  sessions, revokes one device, or revokes every other device.
- **Sign out** ends the current session.

Save newly generated recovery codes outside the browser when they are shown. TaskFlow cannot reveal
them again.

### Navigate the workspace

Managers and workers open on the task dashboard:

- summary cards show total, in-progress, overdue, and completed counts;
- the **Status** selector filters Assigned, In progress, Overdue, or Completed tasks;
- selecting a task title or **View** opens its details;
- the account area shows the current name and role.

Administrators open the user directory instead of the task dashboard. Use the **Dark/Light** control
on the login screen or in the header to switch themes. The browser remembers the choice.

### Manager workflow

#### Create and assign a task

1. Select **Create task** in the navigation or **+ Create task** on the dashboard.
2. Enter a concise title and, optionally, a description of the expected outcome.
3. Select the active worker responsible for the task.
4. Optionally set a deadline. The interface displays dates in the browser's local timezone.
5. Optionally select an initial attachment. The default upload limit is 10 MB.
6. Select **Create and assign task**.

If task creation succeeds but the optional upload fails, the task remains available. Follow the link
to its details and retry the attachment separately.

#### Follow work

The manager dashboard contains only tasks created by the signed-in manager. Each row shows the
assignee, deadline, effective status, and attachment count. Open a task for its description,
assignment, timestamps, and attachments. Managers follow progress but cannot change the worker's
progress status.

### Worker workflow

The worker dashboard contains only tasks assigned to the signed-in worker.

1. Review the title, creator, deadline, and status.
2. Select **Start** or **Start task** to move an Assigned task to In progress.
3. Select **Complete** or **Mark completed** when the work is finished.

A worker can complete an Assigned task directly. Completion is final and cannot be reverted.

### Status meanings

| Status | Meaning |
| --- | --- |
| **Assigned** | The task is ready but work has not started |
| **In progress** | The assigned worker has started the task |
| **Completed** | The assigned worker has finished the task |
| **Overdue** | The deadline passed while the task remained unfinished |

Overdue is calculated from the deadline and does not replace the underlying progress. Completing an
overdue task changes its effective status to Completed.

### Administrator workflow

#### Find and review users

1. Select **Users**.
2. Search by name, email, job title, or department.
3. Filter by role or Pending, Active, or Inactive state and move through the result pages.
4. Open a user to edit their profile or review their audit timeline.

Optional profile fields include job title, department, and phone number. Phone numbers use E.164
format, such as `+14155552671`.

#### Create an account

1. Select **Create user**.
2. Enter the name, company email, role, and any optional profile fields.
3. Save the account.
4. TaskFlow creates a Pending account and queues its invitation email.

If delivery must be retried, open the account and select **Resend invitation**. This issues a new
single-use link and invalidates the previous one.

#### Maintain an account

An administrator can:

- update profile information;
- change a role before the account has task or attachment history;
- send another user's password-recovery email;
- reset MFA and sessions;
- deactivate or reactivate an account;
- review the account's audit timeline.

Changing an email requires confirmation at the new address. Deactivation is blocked while a manager
or worker has unfinished role-related tasks. Administrators cannot deactivate, demote, or reset
themselves, and the last active administrator is protected. Accounts are deactivated rather than
deleted so audit and task history remain intact.

### Attachments

The task's creating manager and assigned worker can upload and download its attachments:

1. Open the task details page.
2. Select **Choose a file**, then **Upload**.
3. Select **Download** beside an existing attachment to retrieve it.

Files are transferred through the protected API. Do not upload passwords, credentials, private keys,
or unrelated sensitive information.

### Common problems

- **Nothing happens after sign-in:** refresh once and verify the `/api` request completed in browser
  developer tools. Report the response status and approximate time to the administrator, but never
  share a password, cookie, CSRF token, or complete sensitive response.
- **Invalid email or password:** re-enter the credentials or use **Forgot your password?**.
- **Invitation or recovery email did not arrive:** check spam, verify the address with an
  administrator, and request a new invitation or recovery email. A replacement link invalidates the
  old one.
- **Invitation or recovery link expired:** request a new link instead of retrying the old one.
- **MFA code rejected:** verify the device time is automatic, wait for the next code, or use one
  unused recovery code. Ask an administrator for an MFA reset if access is lost.
- **Session expired:** sign in again. Sessions have a limited lifetime and can be revoked after
  security-sensitive account changes.
- **Account changed since it was loaded:** refresh the user details; another administrator updated
  the account first.
- **Role or deactivation blocked:** resolve the task-history or unfinished-work condition shown by
  the API, or use another administrator for a self-protected action.
- **Request could not be completed:** the Render backend may be starting or unavailable. Wait briefly,
  retry once, and report the time and operation if it continues.
- **Not allowed to perform this operation:** confirm that the signed-in user is the task's creating
  manager or assigned worker and that the role permits the action.
- **Attachment failed after task creation:** open the new task and retry the upload. If the backend
  reports that the bucket is missing, the administrator must correct Supabase Storage configuration.

## Frontend development

### Architecture and browser security

The application uses Angular standalone components, lazy routes, functional guards, signals, and
strict TypeScript. API services use relative `/api` URLs. Authentication remains in an `HttpOnly`
cookie, while the frontend reads the separate CSRF cookie and sends its value in the expected header
for protected mutations. The access JWT is never stored in local storage or JavaScript-readable
application state.

Browser developer tools can display an authorized response because HTTPS is decrypted at the browser
endpoint. HTTPS protects data in transit between endpoints; it does not hide data from the signed-in
user who is allowed to receive it.

### Requirements and local startup

- Node.js 24;
- npm 11;
- the backend running on `http://localhost:8080`.

From the frontend repository root:

```powershell
npm ci
npm start
```

Open `http://localhost:4200`. `proxy.conf.json` forwards relative `/api` requests to the local backend,
preserving the same-origin cookie and CSRF model during development.

### Main routes

| Route | Purpose | Access |
| --- | --- | --- |
| `/login` | Sign-in and MFA challenge | Public |
| `/forgot-password` | Request account recovery | Public |
| `/accept-invitation` | Accept an emailed invitation | Public token |
| `/reset-password` | Complete password recovery | Public token |
| `/confirm-email` | Confirm a new email address | Public token |
| `/change-password` | Replace the current password | Authenticated |
| `/settings/security` | MFA and session controls | Authenticated |
| `/admin/users` | Search and filter users | Administrator |
| `/admin/users/new` | Create a user | Administrator |
| `/admin/users/:id` | Edit and audit a user | Administrator |
| `/tasks` | Role-specific task dashboard | Manager or worker |
| `/tasks/new` | Create and assign a task | Manager |
| `/tasks/:id` | Task details and attachments | Authorized manager or worker |

Unknown routes return to the application entry route.

### Tests and production build

Run the unit and component tests once:

```powershell
npm test -- --watch=false
```

Create the optimized production build:

```powershell
npm run build
```

The Vercel build output is `dist/frontend/browser`.

## Deploy on Vercel

Because this is a standalone repository, import it with:

- **Root Directory:** leave empty (repository root);
- **Framework Preset:** Angular;
- **Node.js:** `24.x`;
- **Install Command:** `npm ci`;
- **Build Command:** `npm run build`;
- **Output Directory:** `dist/frontend/browser`.

Verify that the `/api` destination in `vercel.json` points to the exact deployed Render service:

```json
{
  "source": "/api/:path*",
  "destination": "https://<render-service>.onrender.com/api/:path*"
}
```

Keep the SPA fallback rewrite so refreshed Angular routes resolve to `index.html`. Keeping browser API
calls on relative `/api` paths allows Vercel to proxy the request to Render while the browser keeps a
same-origin cookie and CSRF flow.

Set the backend's `FRONTEND_ORIGIN` to the exact stable Vercel production origin without a trailing
slash. Use secure cookies and HTTPS enforcement on the backend. Database credentials, JWT/MFA keys,
Supabase secret keys, Gmail OAuth credentials, and refresh tokens belong only in Render; never add
them to Vercel environment variables intended for frontend code or commit them to this repository.
