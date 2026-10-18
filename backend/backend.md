# Backend Guide

## Tech stack

- **Runtime and language:** Node.js, TypeScript (ES modules)
- **HTTP API:** Express 5 with JSON request parsing and CORS dependency
- **Database:** PostgreSQL, accessed through Prisma ORM 8 (preview release in this project)
- **Database contract and migrations:** Prisma contract DSL in `src/prisma/contract.prisma`; generated contract artifacts in `src/prisma/`; migration packages in `migrations/`
- **Validation and authentication:** Zod, bcrypt password hashing, JSON Web Tokens, and an `x-api-key` check

## Local setup and commands

Install dependencies and create a local `.env` from `.env.example`:

```sh
npm install
cp .env.example .env
```

Set these values in `.env` before starting the server or using Prisma:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
API_KEY="your-local-api-key"
JWT_SECRET="your-local-jwt-secret"
NODE_ENV="dev"
```

Run the API in development:

```sh
npm run dev
```

This runs the TypeScript build and then starts `dist/app.js` on `http://localhost:3000` when `NODE_ENV=dev`. `npm run build` compiles to `dist/`. The repository also supports `npx tsc --noEmit` for a type check. No test suite is configured.

### Database workflow

The Prisma CLI loads `DATABASE_URL` through `prisma.config.ts`. For a new/empty database, emit the current contract and bootstrap its schema:

```sh
npm run contract:emit
npx prisma db init --dry-run
npx prisma db init
```

For normal contract changes, edit `src/prisma/contract.prisma`, then emit the contract, create a migration package, inspect it, and apply pending packages:

```sh
npm run contract:emit
npx prisma migration plan --name describe-the-change
npx prisma migration status
npx prisma db migrate --show
npx prisma db migrate
```

Useful inspection commands:

```sh
npx prisma db schema
npx prisma db verify
npx prisma migration list
npx prisma migration log
```

`db init` is for additive setup of a database to match the emitted contract. `db migrate` applies the checked-in migration path; `db update` directly reconciles a live database to a contract and may require explicit decisions for data loss or access changes. Preview direct updates with `npx prisma db update --dry-run` before applying. Use a safe database URL and review migration plans before applying changes.

The account soft-delete column is represented by the planned migration `migrations/app/20261018T0409_add_account_soft_delete`. Apply pending migrations with `npx prisma db migrate` before running the updated backend against a database that does not already have `Account.deleted`.

## API equivalence classes and responses

Each route below separates valid input classes from invalid ones. JSON bodies show their schema; response schemas use exact property names and fixed strings. `ZodIssue[]` means Zod's native issue objects, whose contents vary with the invalid fields. Middleware runs first: every request requires a matching `x-api-key`; JWT-protected routes additionally require a valid bearer token. Thus later route classes assume these headers are valid. For handlers with database `catch` blocks, unanticipated database/runtime errors produce `500 { "error": "Internal server error" }`.

### `GET /health` — Checks whether the HTTP service is healthy

**Valid classes**

- Valid configured `x-api-key`; no body/path/query: `200 { "status": "ok" }`.

**Invalid classes**

- Missing or nonmatching `x-api-key`: `401 { "error": "Invalid API key" }`.
- Unhandled: malformed JSON is rejected by Express JSON parsing before the route; the app error handler returns `500 { "error": "Internal server error" }`.

### `GET /protected` — Checks a valid user's protected access

**Valid classes**

- Valid API key and a JWT verified by `JWT_SECRET` whose payload includes `userId`: `200 { "message": "protected route is healthy", "userId": <decoded userId> }`.

**Invalid classes**

- Missing or nonmatching API key: `401 { "error": "Invalid API key" }`.
- Missing `Authorization`: `401 { "error": "Authorization header missing" }`.
- Authorization value not starting exactly with `Bearer `: `401 { "error": "Invalid authorization header format" }`.
- Value exactly `Bearer ` with no token: `401 { "error": "Token missing" }`.
- Expired, malformed, or unverifiable JWT: `403 { "error": "Invalid token" }`.
- Unhandled: a cryptographically valid JWT without `userId` passes middleware and returns `200 { "message": "protected route is healthy" }` (the `userId` property is omitted by JSON serialization when undefined).

### `POST /api/v1/auth/register` — Creates a user account with credentials

**Valid classes**

- Body `{ "name": string, "email": string, "phNumber": string, "password": string }` where trimmed name is 1–100 chars, normalized email is valid and at most 254 chars, phone is exactly 10 digits, password is 8–72 chars; no extra keys; email and phone unused: `201 { "message": "User registered successfully", "user": { "id": number, "name": string, "email": string, "phNumber": string } }`.

**Invalid classes**

- Missing/invalid API key: `401 { "error": "Invalid API key" }`.
- Missing body, wrong field types, failed constraints, or additional keys: `400 { "error": "Invalid request data", "details": ZodIssue[] }`.
- Email or phone already exists (precheck or unique violation): `409 { "error": "Email or phone number is already registered" }`.
- Unhandled: other database/hash failures: `500 { "error": "Internal server error" }`.

### `POST /api/v1/auth/login` — Authenticates a user and issues JWT

**Valid classes**

- Body `{ "email": string, "password": string }` where trimmed email is valid and at most 254 chars, password is 1–72 chars; no extra keys; credentials match and `JWT_SECRET` is set: `200 { "message": "Login successful", "token": string, "user": { "id": number, "name": string, "email": string, "phNumber": string } }`.

**Invalid classes**

- Missing/invalid API key: `401 { "error": "Invalid API key" }`.
- Missing body, wrong types, failed constraints, or additional keys: `400 { "error": "Invalid request data", "details": ZodIssue[] }`.
- Valid-shaped body but email absent or password mismatch: `401 { "error": "Invalid email or password" }`.
- Matching credentials with missing `JWT_SECRET`: `500 { "error": "Internal server error" }`.
- Unhandled: database, bcrypt, or token-signing exception: `500 { "error": "Internal server error" }`.

### `GET /api/v1/users/me` — Retrieves the authenticated user's profile

**Valid classes**

- Valid API key and JWT with an existing user ID: `200 { "message": "Profile fetched successfully", "user": { "id": number, "name": string, "email": string, "phNumber": string } }`.

**Invalid classes**

- Missing/invalid API key: `401 { "error": "Invalid API key" }`.
- Missing `Authorization`: `401 { "error": "Authorization header missing" }`.
- Authorization not starting with `Bearer `: `401 { "error": "Invalid authorization header format" }`.
- Empty bearer token: `401 { "error": "Token missing" }`.
- Invalid/expired token: `403 { "error": "Invalid token" }`.
- Valid JWT whose `userId` does not identify a user: `404 { "error": "User not found" }`.
- Unhandled: verified JWT lacking `userId` enters the handler and responds `401 { "error": "Authentication required" }`.
- Unhandled: database/runtime failure: `500 { "error": "Internal server error" }`.

### `PATCH /api/v1/users/me` — Updates authenticated user's profile fields

**Valid classes**

- Valid API key and JWT for an existing user; body has one or more of `name` (trimmed 1–100 chars), `email` (trimmed valid email, max 254), `phNumber` (10 digits); no extra keys: `200 { "message": "Profile updated successfully", "user": { "id": number, "name": string, "email": string, "phNumber": string } }`.

**Invalid classes**

- Missing/invalid API key: `401 { "error": "Invalid API key" }`.
- Missing `Authorization`: `401 { "error": "Authorization header missing" }`.
- Authorization not starting with `Bearer `: `401 { "error": "Invalid authorization header format" }`.
- Empty bearer token: `401 { "error": "Token missing" }`.
- Invalid/expired token: `403 { "error": "Invalid token" }`.
- Empty object, missing body, wrong types, failed constraints, or additional keys: `400 { "error": "Invalid request data", "details": ZodIssue[] }`.
- Valid JWT for nonexistent user: `404 { "error": "User not found" }`.
- Email or phone conflicts with another user: `409 { "error": "Email or phone number is already registered" }`.
- Unhandled: verified JWT lacking `userId` returns `401 { "error": "Authentication required" }`; other database/runtime failures return `500 { "error": "Internal server error" }`.

### `POST /api/v1/accounts` — Opens a zero-balance account for user

**Valid classes**

- Valid API key and JWT identifying an existing user; no body needed: `201 { "message": "Account created successfully", "account": { "id": number, "accountNumber": numeric, "balance": numeric } }`.

**Invalid classes**

- Missing/invalid API key: `401 { "error": "Invalid API key" }`.
- Missing `Authorization`: `401 { "error": "Authorization header missing" }`.
- Authorization not starting with `Bearer `: `401 { "error": "Invalid authorization header format" }`.
- Empty bearer token: `401 { "error": "Token missing" }`.
- Invalid/expired token: `403 { "error": "Invalid token" }`.
- Valid JWT for nonexistent user: `404 { "error": "User not found" }`.
- Unhandled: verified JWT lacking `userId` returns `401 { "error": "Authentication required" }`. Account number generation's empty-string branch returns `500 { "error": "Unable to create account" }`; database/runtime failures return `500 { "error": "Internal server error" }`.

### `POST /api/v1/accounts/:accountId/deposit` — Deposits funds into an active account

**Valid classes**

- Path `accountId` is a positive safe integer; JSON body is exactly `{ "amount": number | string }`, where its string form has 1–17 integer digits and up to 2 fractional digits; valid API key and JWT; account belongs to caller, is active, and amount is greater than zero: `200 { "message": "Deposit completed successfully", "accountId": number, "amount": decimal string, "balance": decimal string, "transaction": { "id": number, "payerAccountId": null, "payeeAccountId": number, "amount": numeric, "type": "DEPOSIT", "status": "completed", "createdAt": timestamp } }`.

**Invalid classes**

- Missing/invalid API key: `401 { "error": "Invalid API key" }`.
- Missing `Authorization`: `401 { "error": "Authorization header missing" }`.
- Authorization not starting with `Bearer `: `401 { "error": "Invalid authorization header format" }`.
- Empty bearer token: `401 { "error": "Token missing" }`.
- Invalid/expired token: `403 { "error": "Invalid token" }`.
- `accountId` nonnumeric, noninteger, unsafe, zero, or negative: `400 { "error": "Invalid account ID" }`.
- Missing body/amount, amount of another type, amount string not matching the supported decimal format, or extra keys: `400 { "error": "Invalid deposit details" }`.
- Syntactically valid amount equals zero: `400 { "error": "Deposit amount must be greater than zero" }`.
- Account absent, not owned by caller, or soft-deleted: `404 { "error": "Account not found" }`.
- Unhandled: verified JWT lacking `userId` returns `401 { "error": "Authentication required" }`. Other database/runtime failures return `500 { "error": "Internal server error" }`; if a failed transaction can be recorded for the owned account, the body also includes `transaction` with the failed `DEPOSIT` row, otherwise only the error is returned. Deposit failures are logged only for this server-error class.

### `POST /api/v1/accounts/:accountId/withdraw` — Withdraws funds from an active account

**Valid classes**

- Path `accountId` is a positive safe integer; JSON body is exactly `{ "amount": number | string, "password": string }`, where amount's string form has 1–17 integer digits and up to 2 fractional digits and password length is 1–72; valid API key and JWT; password matches caller; account belongs to caller, is active, amount is greater than zero, and balance covers it: `200 { "message": "Withdrawal completed successfully", "accountId": number, "amount": decimal string, "balance": decimal string, "transaction": { "id": number, "payerAccountId": number, "payeeAccountId": null, "amount": numeric, "type": "WITHDRAWAL", "status": "completed", "createdAt": timestamp } }`.

**Invalid classes**

- Missing/invalid API key: `401 { "error": "Invalid API key" }`.
- Missing `Authorization`: `401 { "error": "Authorization header missing" }`.
- Authorization not starting with `Bearer `: `401 { "error": "Invalid authorization header format" }`.
- Empty bearer token: `401 { "error": "Token missing" }`.
- Invalid/expired token: `403 { "error": "Invalid token" }`.
- `accountId` nonnumeric, noninteger, unsafe, zero, or negative: `400 { "error": "Invalid account ID" }`.
- Missing body/amount/password, wrong amount/password type, amount string outside supported decimal format, empty or overlong password, or extra keys: `400 { "error": "Invalid withdrawal details" }`.
- Syntactically valid amount equals zero: `400 { "error": "Withdrawal amount must be greater than zero" }`.
- JWT user ID does not identify a user: `404 { "error": "User not found" }`.
- Password does not match: `401 { "error": "Invalid password" }`; no transaction is recorded.
- Account absent, not owned by caller, or soft-deleted: `404 { "error": "Account not found" }`.
- Balance is less than requested amount: `422 { "error": "Insufficient balance", "transaction": { "id": number, "payerAccountId": number, "payeeAccountId": null, "amount": numeric, "type": "WITHDRAWAL", "status": "failed", "createdAt": timestamp } }` when the failed row can be inserted; if logging itself fails, `422 { "error": "Insufficient balance" }`.
- Unhandled: verified JWT lacking `userId` returns `401 { "error": "Authentication required" }`. Other database/runtime failures return `500 { "error": "Internal server error" }`; if a failed transaction can be recorded for the owned account, the body also includes `transaction` with the failed `WITHDRAWAL` row, otherwise only the error is returned.

Successful deposits/withdrawals update the balance and insert a completed `Transaction` row atomically. Insufficient-balance withdrawals insert a failed row and leave the balance unchanged. Server errors in either handler trigger a best-effort failed-row insert after rollback. Invalid amounts, wrong-password withdrawals, and requests for nonexistent, unowned, or deleted accounts do not create failed rows.

### `GET /api/v1/accounts` — Lists active accounts belonging to current user

**Valid classes**

- Valid API key and JWT; with or without active owned accounts: `200 { "message": "Accounts fetched successfully", "accounts": Array<{ "id": number, "accountNumber": numeric, "balance": numeric }> }`; `deleted: true` rows are excluded and the array may be empty.

**Invalid classes**

- Missing/invalid API key: `401 { "error": "Invalid API key" }`.
- Missing `Authorization`: `401 { "error": "Authorization header missing" }`.
- Authorization not starting with `Bearer `: `401 { "error": "Invalid authorization header format" }`.
- Empty bearer token: `401 { "error": "Token missing" }`.
- Invalid/expired token: `403 { "error": "Invalid token" }`.
- Unhandled: verified JWT lacking `userId` returns `401 { "error": "Authentication required" }`; database/runtime failures return `500 { "error": "Internal server error" }`.

### `GET /api/v1/accounts/:accountId` — Retrieves one active owned account

**Valid classes**

- Path `accountId` converts to a positive safe integer, belongs to JWT user, and has `deleted: false`: `200 { "message": "Account fetched successfully", "account": { "id": number, "accountNumber": numeric, "balance": numeric } }`.

**Invalid classes**

- Missing/invalid API key: `401 { "error": "Invalid API key" }`.
- Missing `Authorization`: `401 { "error": "Authorization header missing" }`.
- Authorization not starting with `Bearer `: `401 { "error": "Invalid authorization header format" }`.
- Empty bearer token: `401 { "error": "Token missing" }`.
- Invalid/expired token: `403 { "error": "Invalid token" }`.
- `accountId` is nonnumeric, noninteger, unsafe, zero, or negative: `400 { "error": "Invalid account ID" }`.
- ID does not exist, is not owned by caller, or has `deleted: true`: `404 { "error": "Account not found" }`.
- Unhandled: verified JWT lacking `userId` returns `401 { "error": "Authentication required" }`; database/runtime failures return `500 { "error": "Internal server error" }`.

### `DELETE /api/v1/accounts/:accountId` — Soft-deletes an owned account

**Valid classes**

- Path `accountId` converts to a positive safe integer; JSON body is exactly `{ "password": string }` with length 1–72; valid API key and JWT; password matches authenticated user's stored hash; account is owned by that user, is not already deleted, and has zero balance: `200 { "message": "Account deleted successfully", "accountId": number }`. The row remains in PostgreSQL with `deleted: true`; transaction history is retained.

**Invalid classes**

- Missing/invalid API key: `401 { "error": "Invalid API key" }`.
- Missing `Authorization`: `401 { "error": "Authorization header missing" }`.
- Authorization not starting with `Bearer `: `401 { "error": "Invalid authorization header format" }`.
- Empty bearer token: `401 { "error": "Token missing" }`.
- Invalid/expired token: `403 { "error": "Invalid token" }`.
- `accountId` nonnumeric, noninteger, unsafe, zero, or negative: `400 { "error": "Invalid account ID" }`.
- Body absent, password absent/empty/over 72 chars, wrong password type, or additional keys: `400 { "error": "Invalid request data", "details": ZodIssue[] }`.
- JWT user ID does not identify a user: `404 { "error": "User not found" }`.
- Password does not match: `401 { "error": "Invalid password" }`.
- Account does not exist or belongs to another user: `404 { "error": "Account not found" }`.
- Account has nonzero balance: `409 { "error": "Account balance must be zero before deletion" }`.
- Account is already soft-deleted: `404 { "error": "Account not found" }`.
- Unhandled: verified JWT lacking `userId` returns `401 { "error": "Authentication required" }`; database/runtime failure returns `500 { "error": "Internal server error" }`.

### `POST /api/v1/transfers` — Transfers funds between two accounts

**Valid classes**

- Valid API key and JWT; body has `payerAccountId` as number/string converting to positive safe integer, `payeeAccountNumber` as exactly 11 digits, and `amount` as number/string matching 1–17 digits with optional 1–2 decimal digits; payer is owned, payee exists and differs, and balance covers positive amount: `201 { "message": "Transfer completed successfully", "transaction": { "id": number, "payeeAccountId": number, "payerAccountId": number, "amount": numeric, "status": "completed", "createdAt": timestamp } }` (transaction object follows ORM model fields).

**Invalid classes**

- Missing/invalid API key: `401 { "error": "Invalid API key" }`.
- Missing `Authorization`: `401 { "error": "Authorization header missing" }`.
- Authorization not starting with `Bearer `: `401 { "error": "Invalid authorization header format" }`.
- Empty bearer token: `401 { "error": "Token missing" }`.
- Invalid/expired token: `403 { "error": "Invalid token" }`.
- Body missing required fields, wrong types, invalid payer ID, invalid account number/amount format: `400 { "error": "Invalid transfer details" }`.
- Amount is syntactically valid but zero (for example `"0"` or `"0.00"`): `400 { "error": "Transfer amount must be greater than zero" }`.
- Payer absent or not owned: `404 { "error": "Payer account not found" }`.
- Recipient number does not identify an account: `404 { "error": "Recipient account not found" }`.
- Payer and payee identify the same account: `400 { "error": "Cannot transfer to the same account" }`.
- Payer balance is below amount: `422 { "error": "Insufficient balance" }`.
- Unhandled: verified JWT lacking `userId` returns `401 { "error": "Authentication required" }`; other transaction/database/runtime failures return `500 { "error": "Internal server error" }`.

### `GET /api/v1/transactions` — Lists transactions involving user's accounts

**Valid classes**

- Valid API key and JWT, with zero or more active owned accounts/transactions: `200 { "message": "Transactions fetched successfully", "transactions": Array<{ "id": number, "amount": numeric, "status": "pending" | "completed" | "failed", "type": "TRANSFER" | "DEPOSIT" | "WITHDRAWAL", "createdAt": timestamp, "from": numeric | null, "to": numeric | null, "direction": "debit" | "credit" }> }`; deleted accounts are excluded and the array is empty if user has no active accounts.

**Invalid classes**

- Missing/invalid API key: `401 { "error": "Invalid API key" }`.
- Missing `Authorization`: `401 { "error": "Authorization header missing" }`.
- Authorization not starting with `Bearer `: `401 { "error": "Invalid authorization header format" }`.
- Empty bearer token: `401 { "error": "Token missing" }`.
- Invalid/expired token: `403 { "error": "Invalid token" }`.
- Unhandled: verified JWT lacking `userId` returns `401 { "error": "Authentication required" }`; database/runtime failures return `500 { "error": "Internal server error" }`.

### `GET /api/v1/transactions/account/:accountId` — Lists transactions for one active account

**Valid classes**

- Path `accountId` converts to a positive safe integer belonging to caller and the account has `deleted: false`: `200 { "message": "Transactions fetched successfully", "transactions": Array<{ "id": number, "amount": numeric, "status": "pending" | "completed" | "failed", "type": "TRANSFER" | "DEPOSIT" | "WITHDRAWAL", "createdAt": timestamp, "from": numeric | null, "to": numeric | null, "direction": "debit" | "credit" }> }`; array may be empty.

**Invalid classes**

- Missing/invalid API key: `401 { "error": "Invalid API key" }`.
- Missing `Authorization`: `401 { "error": "Authorization header missing" }`.
- Authorization not starting with `Bearer `: `401 { "error": "Invalid authorization header format" }`.
- Empty bearer token: `401 { "error": "Token missing" }`.
- Invalid/expired token: `403 { "error": "Invalid token" }`.
- `accountId` nonnumeric, noninteger, unsafe, zero, or negative: `400 { "error": "Invalid account ID" }`.
- No matching owned account, or account has `deleted: true`: `404 { "error": "Account not found" }`.
- Unhandled: verified JWT lacking `userId` returns `401 { "error": "Authentication required" }`; database/runtime failures return `500 { "error": "Internal server error" }`.

### `GET /api/v1/transactions/:transactionId` — Retrieves one transaction involving current user

**Valid classes**

- Path `transactionId` converts to a positive safe integer and transaction involves caller's active account: `200 { "message": "Transaction fetched successfully", "transaction": { "id": number, "amount": numeric, "status": "pending" | "completed" | "failed", "type": "TRANSFER" | "DEPOSIT" | "WITHDRAWAL", "createdAt": timestamp, "from": numeric | null, "to": numeric | null, "direction": "debit" | "credit" } }`.

**Invalid classes**

- Missing/invalid API key: `401 { "error": "Invalid API key" }`.
- Missing `Authorization`: `401 { "error": "Authorization header missing" }`.
- Authorization not starting with `Bearer `: `401 { "error": "Invalid authorization header format" }`.
- Empty bearer token: `401 { "error": "Token missing" }`.
- Invalid/expired token: `403 { "error": "Invalid token" }`.
- `transactionId` nonnumeric, noninteger, unsafe, zero, or negative: `400 { "error": "Invalid transaction ID" }`.
- Transaction absent or neither account belongs to caller: `404 { "error": "Transaction not found" }`.
- Unhandled: verified JWT lacking `userId` returns `401 { "error": "Authentication required" }`; database/runtime failures return `500 { "error": "Internal server error" }`.

For all paths, unmatched method/path after a valid API key returns `404 { "error": "Route not found" }`. Malformed JSON is rejected before route handlers and reaches the app error handler, producing `500 { "error": "Internal server error" }`.

In transaction API responses, `type` matches the stored contract value (`TRANSFER`, `DEPOSIT`, or `WITHDRAWAL`), and `direction` is `debit` or `credit` from the caller's perspective. `from` and `to` preserve actual payer-to-payee direction: deposits have `from: null`, and withdrawals have `to: null`. Both successful and failed operations can appear with their respective status.

## PostgreSQL schema

The current contract defines three tables in the `public` schema. Table names are case-sensitive as written (quoted identifiers in SQL); transaction status and type values are stored as text with check constraints. `SERIAL` primary keys are auto-generated. `Account.deleted` is a soft-delete flag; account listings/lookups and account-scoped transaction lookup hide flagged rows. No cascading delete behavior is specified for the foreign keys.

```sql
CREATE TABLE "User" (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  ph_number   TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,
  CONSTRAINT user_phone_number_format CHECK (ph_number ~ '^[0-9]{10}$')
);

CREATE TABLE "Account" (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES "User"(id),
  account_number NUMERIC(11) NOT NULL UNIQUE,
  balance        NUMERIC(19, 2) NOT NULL DEFAULT 0.00,
  deleted        BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT positive_account_number CHECK (account_number > 0),
  CONSTRAINT account_balance_nonnegative CHECK (balance >= 0)
);

CREATE TABLE "Transaction" (
  id               SERIAL PRIMARY KEY,
  payee_account_id INTEGER REFERENCES "Account"(id),
  payer_account_id INTEGER REFERENCES "Account"(id),
  amount           NUMERIC(19, 2) NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('TRANSFER', 'DEPOSIT', 'WITHDRAWAL')),
  status           TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT transaction_amount_positive CHECK (amount > 0),
  CONSTRAINT transaction_distinct_accounts CHECK (type <> 'TRANSFER' OR payer_account_id <> payee_account_id),
  CONSTRAINT transaction_accounts_by_type CHECK (
    (type = 'TRANSFER' AND payer_account_id IS NOT NULL AND payee_account_id IS NOT NULL)
    OR (type = 'DEPOSIT' AND payer_account_id IS NULL AND payee_account_id IS NOT NULL)
    OR (type = 'WITHDRAWAL' AND payer_account_id IS NOT NULL AND payee_account_id IS NULL)
  )
);

CREATE INDEX ON "Account" (user_id);
CREATE INDEX ON "Transaction" (payer_account_id, created_at);
CREATE INDEX ON "Transaction" (payee_account_id, created_at);
```

In the Prisma contract, `phNumber`, `userId`, `accountNumber`, `payeeAccountId`, `payerAccountId`, and `createdAt` map to the SQL names `ph_number`, `user_id`, `account_number`, `payee_account_id`, `payer_account_id`, and `created_at`, respectively. The account number type was changed to `NUMERIC(11)` in migration history; this guide reflects the current contract.
