# Initial Project Setup Implementation Plan

**Goal:** Publish the existing NestJS task management API through a feature branch and pull request with safe environment documentation and a project-specific README.

**Architecture:** Keep application code unchanged. Add a sanitized environment-variable template and replace the generated NestJS README with documentation derived from the current controllers, DTOs, configuration access, and package scripts. Because the remote repository is empty, publish the already-reviewed design commit as the minimal `main` baseline, then publish the full project changes from `initial-project-setup` for review.

**Tech Stack:** NestJS 11, TypeScript, PostgreSQL (`pg`), JWT, bcrypt, Nodemailer, Jest, npm, Git, GitHub

---

### Task 1: Add a safe environment template

**Files:**

- Create: `.env.example`

- [ ] **Step 1: Create the environment template**

Create `.env.example` with development-safe placeholders only:

```dotenv
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=replace_with_database_password
DB_NAME=task_management

JWT_SECRET=replace_with_a_long_random_secret
JWT_REFRESH_SECRET=replace_with_a_different_long_random_secret
JWT_REFRESH_EXPIRES_IN=7d
JWT_RESET_SECRET=replace_with_another_long_random_secret
JWT_RESET_EXPIRES_IN=15m

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=no-reply@example.com
SMTP_PASS=replace_with_smtp_password
MAIL_FROM_NAME=Task Management API

FRONTEND_URL=http://localhost:3001
```

- [ ] **Step 2: Verify environment-variable coverage**

Run:

```powershell
rg -o "(?:process\.env\.|get<string>\(')[A-Z][A-Z0-9_]*" src
Get-Content .env.example
```

Expected: every variable used by the source appears in `.env.example`; the template contains no value copied from `.env`.

### Task 2: Write project documentation

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Replace the generated README**

Document the API title and purpose, implemented user and authentication capabilities, technology stack, Node.js/PostgreSQL prerequisites, npm installation, database creation, `.env.example` copy step, development and production commands, tests, endpoint table, project layout, and security guidance.

The endpoint table must include:

| Method | Endpoint                | Purpose                       | Authentication |
| ------ | ----------------------- | ----------------------------- | -------------- |
| GET    | `/`                     | Basic service response        | No             |
| GET    | `/db-health`            | Database connectivity check   | No             |
| GET    | `/users`                | List users                    | No             |
| GET    | `/users/:id`            | Fetch one user                | No             |
| POST   | `/users`                | Register a user               | No             |
| DELETE | `/users/:id`            | Delete a user                 | No             |
| POST   | `/auth/login`           | Sign in                       | No             |
| POST   | `/auth/refresh`         | Refresh tokens                | No             |
| POST   | `/auth/logout`          | Revoke a refresh token        | No             |
| GET    | `/auth/me`              | Return the authenticated user | Bearer token   |
| POST   | `/auth/forgot-password` | Send a reset email            | No             |
| POST   | `/auth/reset-password`  | Reset a password              | No             |

- [ ] **Step 2: Check documentation integrity**

Run:

```powershell

git diff --check
```

Expected: no prohibited attribution or placeholders; no whitespace errors.

### Task 3: Validate the project

**Files:**

- No file changes expected

- [ ] **Step 1: Run unit tests**

Run:

```powershell
npm test -- --runInBand
```

Expected: Jest exits successfully with zero failed tests.

- [ ] **Step 2: Run the production build**

Run:

```powershell
npm run build
```

Expected: the NestJS TypeScript build exits successfully.

- [ ] **Step 3: Confirm secret and artifact exclusions**

Run:

```powershell
git check-ignore -v .env node_modules dist
git status --short --ignored
```

Expected: `.env`, `node_modules`, and `dist` are ignored; `.env` is absent from tracked and staged paths.

### Task 4: Publish the branch and open the pull request

**Files:**

- Stage all intended project source and configuration files except ignored artifacts and secrets

- [ ] **Step 1: Configure and inspect the remote**

Run:

```powershell
git remote add origin https://github.com/umer-52/TaskManagementApi.git
git remote -v
git ls-remote --heads origin
```

Expected: `origin` points to the requested repository and reports no existing branches.

- [ ] **Step 2: Establish the minimal base branch**

Run:

```powershell
git push origin HEAD:main
```

Expected: GitHub creates `main` at the reviewed design commit, providing a valid PR base.

- [ ] **Step 3: Stage and audit the project**

Run:

```powershell
git add .gitignore .prettierrc .env.example README.md eslint.config.mjs nest-cli.json package-lock.json package.json src test tsconfig.build.json tsconfig.json yarn.lock docs/initial-project-setup-plan.md
git diff --cached --check
git diff --cached --name-status
git ls-files --cached | rg "(^|/)\.env$|(^|/)(node_modules|dist)/"
```

Expected: intended project files are staged; the last command produces no output.

- [ ] **Step 4: Commit and push the feature branch**

Run:

```powershell
git commit -m "chore: add initial task management API"
git push -u origin initial-project-setup
```

Expected: the commit succeeds and the remote feature branch tracks `origin/initial-project-setup`.

- [ ] **Step 5: Open the pull request**

Install GitHub CLI if needed, authenticate without printing credentials, then run:

```powershell
gh pr create --draft --base main --head initial-project-setup --title "Initial Task Management API setup" --body-file $prBodyFile
```

The PR body must summarize the environment template, project documentation, included NestJS API, and successful test/build checks. Expected: GitHub returns the new draft PR URL.

- [ ] **Step 6: Verify remote state**

Run:

```powershell
git status -sb
git log --oneline --decorate -3
git ls-remote --heads origin main initial-project-setup
```

Expected: the worktree is clean, both branches exist remotely, and the feature branch tracks its upstream.
