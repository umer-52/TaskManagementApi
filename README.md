# Task Management API

A REST API built with NestJS for user management and token-based authentication. The current implementation supports user registration, login, access and refresh tokens, logout, authenticated profile lookup, password-reset emails, and PostgreSQL health checks.

## Tech stack

- Node.js and TypeScript
- NestJS 11
- PostgreSQL with `pg`
- JWT access and refresh tokens
- bcrypt password hashing
- Nodemailer for transactional email
- Jest for automated tests

## Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL
- SMTP credentials for password-reset emails

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a PostgreSQL database:

   ```sql
   CREATE DATABASE task_management;
   ```

   The application expects `users`, `tokens`, and `password_reset_tokens` tables. Database migrations are not currently included, so the required schema must exist before using database-backed endpoints.

3. Create your local environment file:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Replace every placeholder in `.env` with your local database, JWT, and SMTP values. Use different long random strings for each JWT secret.

5. Start the development server:

   ```bash
   npm run start:dev
   ```

The API listens on `http://localhost:3000` by default. Set `PORT` to use another port.

## Environment variables

| Variable                 | Description                                                         | Example                          |
| ------------------------ | ------------------------------------------------------------------- | -------------------------------- |
| `PORT`                   | HTTP server port                                                    | `3000`                           |
| `DB_HOST`                | PostgreSQL host                                                     | `localhost`                      |
| `DB_PORT`                | PostgreSQL port                                                     | `5432`                           |
| `DB_USERNAME`            | PostgreSQL user                                                     | `postgres`                       |
| `DB_PASSWORD`            | PostgreSQL password                                                 | `replace_with_database_password` |
| `DB_NAME`                | PostgreSQL database                                                 | `task_management`                |
| `JWT_SECRET`             | Access-token signing secret                                         | long random value                |
| `JWT_EXPIRES_IN`         | Access-token lifetime                                               | `1h`                             |
| `JWT_REFRESH_SECRET`     | Refresh-token signing secret                                        | different long random value      |
| `JWT_REFRESH_EXPIRES_IN` | Refresh-token lifetime                                              | `7d`                             |
| `JWT_RESET_SECRET`       | Password-reset signing secret reserved by the current configuration | different long random value      |
| `JWT_RESET_EXPIRES_IN`   | Password-reset token lifetime reserved by the current configuration | `15m`                            |
| `SMTP_HOST`              | SMTP server host                                                    | `smtp.example.com`               |
| `SMTP_PORT`              | SMTP server port                                                    | `587`                            |
| `SMTP_SECURE`            | Use a secure SMTP connection                                        | `false`                          |
| `SMTP_USER`              | SMTP username and sender address                                    | `no-reply@example.com`           |
| `SMTP_PASS`              | SMTP password                                                       | `replace_with_smtp_password`     |
| `MAIL_FROM_NAME`         | Display name for outgoing email                                     | `Task Management API`            |
| `FRONTEND_URL`           | Frontend base URL used in reset links                               | `http://localhost:3001`          |

## API endpoints

| Method   | Endpoint                | Description                       | Authentication |
| -------- | ----------------------- | --------------------------------- | -------------- |
| `GET`    | `/`                     | Return the basic service response | No             |
| `GET`    | `/db-health`            | Check PostgreSQL connectivity     | No             |
| `GET`    | `/users`                | List active users                 | No             |
| `GET`    | `/users/:id`            | Get an active user by ID          | No             |
| `POST`   | `/users`                | Register a user                   | No             |
| `DELETE` | `/users/:id`            | Soft-delete a user                | No             |
| `POST`   | `/auth/login`           | Authenticate a user               | No             |
| `POST`   | `/auth/refresh`         | Rotate access and refresh tokens  | No             |
| `POST`   | `/auth/logout`          | Revoke a refresh token            | No             |
| `GET`    | `/auth/me`              | Return the authenticated user     | Bearer token   |
| `POST`   | `/auth/forgot-password` | Send a password-reset email       | No             |
| `POST`   | `/auth/reset-password`  | Reset a password using a token    | No             |

### Request examples

Register a user:

```json
{
  "full_name": "Example User",
  "email": "user@example.com",
  "password": "replace_with_a_secure_password"
}
```

Log in:

```json
{
  "email": "user@example.com",
  "password": "replace_with_a_secure_password"
}
```

Refresh or revoke a token:

```json
{
  "RefreshToken": "your_refresh_token"
}
```

Use an access token for protected endpoints:

```http
Authorization: Bearer your_access_token
```

## Available commands

| Command               | Purpose                                     |
| --------------------- | ------------------------------------------- |
| `npm run start`       | Start the application                       |
| `npm run start:dev`   | Start in watch mode                         |
| `npm run start:debug` | Start in debug/watch mode                   |
| `npm run build`       | Compile the application                     |
| `npm run start:prod`  | Run the compiled application                |
| `npm test`            | Run unit tests                              |
| `npm run test:watch`  | Run unit tests in watch mode                |
| `npm run test:cov`    | Generate test coverage                      |
| `npm run test:e2e`    | Run end-to-end tests                        |
| `npm run lint`        | Lint and automatically fix TypeScript files |
| `npm run format`      | Format source and test files                |

## Project structure

```text
src/
|-- auth/       Authentication, token, guards, middleware, and password resets
|-- common/     Shared repository behavior
|-- database/   PostgreSQL connection service
|-- email/      SMTP email delivery
|-- users/      User controller, service, repository, and DTOs
`-- main.ts     Application bootstrap
test/           End-to-end test configuration and tests
```

## Security notes

- Never commit `.env`; it is intentionally ignored by Git.
- Keep production secrets out of `.env.example`.
- Generate unique, high-entropy values for JWT secrets.
- Restrict database and SMTP credentials to the minimum required permissions.
- Review endpoint authorization before exposing the service publicly; only `/auth/me` currently uses an explicit guard.
