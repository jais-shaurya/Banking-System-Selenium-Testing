# PostgreSQL Database Schema

## 1. User

Stores user information and authentication credentials.

| Column | Constraints / Description |
|---|---|
| `id` | Primary key; unique and not null |
| `name` | Not null |
| `email` | Unique and not null |
| `ph_number` | Unique and not null; must contain exactly 10 digits |
| `password` | Not null; stores the securely hashed password |

## 2. Account

Stores bank account details associated with users. A single user can own multiple accounts.

| Column | Constraints / Description |
|---|---|
| `id` | Primary key; unique and not null |
| `user_id` | Foreign key referencing `User(id)`; not null |
| `account_number` | Unique and not null |
| `balance` | Not null; defaults to `0.00` and must be greater than or equal to zero |

## 3. Transaction

Stores money transfers between bank accounts, including their status and creation timestamp.

| Column | Constraints / Description |
|---|---|
| `id` | Primary key; unique and not null |
| `payee_account_id` | Foreign key referencing `Account(id)`; not null; identifies the recipient account |
| `payer_account_id` | Foreign key referencing `Account(id)`; not null; identifies the sender account |
| `amount` | Not null; must be greater than zero |
| `status` | Not null; restricted to `pending`, `completed`, or `failed` |
| `created_at` | Not null; defaults to `CURRENT_TIMESTAMP` and records when the transaction was created |

### Additional Constraints

- **Distinct accounts:** `payer_account_id` must not equal `payee_account_id`. This prevents transfers to the same account while allowing transfers between different accounts owned by the same user.
- **Positive transaction amount:** `amount` must be greater than zero.

## Relationships

- **User → Account:** One-to-many. A user can own multiple accounts, while each account belongs to one user.
- **Account → Transaction:** One-to-many. An account can participate in multiple transactions as either the payer or the payee.
- **Transaction → Account:** Each transaction references two distinct accounts: one payer and one payee. Both accounts may belong to the same user or to different users.