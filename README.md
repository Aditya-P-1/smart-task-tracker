# Smart Task & Habit Tracker

A full-stack mobile-first productivity app built with React Native Expo, Node.js, Express, and MongoDB. The project is designed around clean architecture, strong separation of concerns, and an offline-first user experience so task and habit updates feel immediate even when network conditions are unreliable.

This repository is a strong portfolio-ready foundation for:
- secure JWT-based authentication
- task and habit management
- optimistic UI updates
- local caching with MMKV
- offline queueing and background sync

## Project Overview

Smart Task & Habit Tracker helps users manage daily tasks and maintain habits with streak tracking. The app is structured as a monorepo with separate `frontend` and `backend` applications.

The frontend focuses on fast, resilient mobile UX with:
- Expo Router navigation
- TanStack Query for server state
- React Hook Form for forms
- MMKV for local persistence
- optimistic updates and offline queue syncing

The backend provides:
- Express REST APIs
- MongoDB persistence with Mongoose
- JWT authentication
- email verification flow
- validation, defensive middleware, and structured API responses

## Features

### Current Features

- User signup and login
- Email verification before login access
- JWT-protected APIs
- Task management
  - create task
  - list tasks
  - update task
  - delete task
  - mark task complete
- Habit management
  - create habit
  - list habits
  - daily check-in
  - streak calculation
  - delete habit
- Offline-first data flow
  - local cache persistence
  - queued offline actions
  - automatic sync on reconnect
  - optimistic updates with rollback
- Global API error normalization
- Empty, loading, and retry states in the app

### Product Quality Highlights

- Clean feature-based frontend structure
- Controller/service-based backend structure
- Consistent API response shape
- Retry-aware queue syncing
- MMKV corruption fallback support
- Query invalidation and background refetching

## Tech Stack

### Frontend

- React Native
- Expo
- Expo Router
- TypeScript
- TanStack Query
- Axios
- React Hook Form
- react-native-mmkv
- NetInfo

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- JWT (`jsonwebtoken`)
- bcrypt
- Nodemailer

## Folder Structure

```text
.
├── backend
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   ├── middlewares
│   │   ├── models
│   │   ├── routes
│   │   ├── services
│   │   ├── utils
│   │   └── validators
│   ├── .env.example
│   └── package.json
├── frontend
│   ├── app
│   │   ├── (tabs)
│   │   ├── auth
│   │   ├── habits
│   │   └── tasks
│   ├── src
│   │   ├── api
│   │   ├── config
│   │   ├── constants
│   │   ├── features
│   │   │   ├── auth
│   │   │   ├── habits
│   │   │   └── tasks
│   │   ├── offline
│   │   ├── providers
│   │   ├── query
│   │   ├── storage
│   │   └── types
│   ├── .env.example
│   └── package.json
└── README.md
```

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Task
```

### 2. Install dependencies

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd ../frontend
npm install
```

### 3. Configure environment variables

Create local env files from the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Update the values as needed.

### 4. Start MongoDB

Use either:
- a local MongoDB instance
- MongoDB Atlas

### 5. Run the backend

```bash
cd backend
npm run dev
```

Expected output:

```text
MongoDB connected
Server running on port 5000
```

### 6. Run the frontend

```bash
cd frontend
npm start
```

Or launch directly:

```bash
npm run android
npm run ios
npm run web
```

## Environment Variables

### Backend

Defined in [backend/.env.example](./backend/.env.example):

```env
PORT=5000
CLIENT_URL=http://localhost:8081,http://localhost:19006
APP_URL=smarttaskhabittracker://
SERVER_URL=http://localhost:5000
MONGODB_URI=mongodb://127.0.0.1:27017/smart-task-habit-tracker
JWT_SECRET=replace-with-a-secure-secret
JWT_EXPIRES_IN=7d
EMAIL_VERIFICATION_TOKEN_EXPIRES_MINUTES=60
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=example-user
SMTP_PASS=example-password
SMTP_FROM=no-reply@example.com
```

### Frontend

Defined in [frontend/.env.example](./frontend/.env.example):

```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1
```

Note:
- use `localhost` for web/local development
- use your machine LAN IP for a physical device
- Android emulator local API access is handled by the app configuration layer

## Offline-First Architecture

The frontend is designed so user actions feel instant even without internet access.

### Core Pieces

- `frontend/src/offline/network/network-service.ts`
  - listens for connectivity changes
- `frontend/src/offline/queue/action-queue.ts`
  - creates, deduplicates, and merges queued actions
- `frontend/src/offline/queue/queue-storage.ts`
  - persists the queue in MMKV
- `frontend/src/offline/queue/query-overlays.ts`
  - overlays queued changes on top of fetched query data
- `frontend/src/offline/sync/offline-sync-service.ts`
  - processes the queue and retries failed syncs
- `frontend/src/offline/providers/offline-provider.tsx`
  - wires the offline layer into the app lifecycle

### Offline Action Examples

- `CREATE_TASK`
- `UPDATE_TASK`
- `DELETE_TASK`
- `CREATE_HABIT`
- `DELETE_HABIT`
- `CHECKIN_HABIT`

### Offline Flow

1. User performs an action in the app.
2. UI updates immediately with optimistic data.
3. Action is stored in the offline queue.
4. If online, sync runs immediately.
5. If offline, action stays queued locally.
6. When connectivity returns, the queue syncs automatically.

## Sync Strategy

The sync layer is intentionally conservative and production-oriented.

### What It Handles

- online/offline detection
- persisted queue state
- retry scheduling with backoff
- duplicate action deduplication
- invalid server ID discard rules
- conflict-safe delete/check-in handling
- query invalidation after successful sync

### Conflict Handling Basics

- duplicate habit check-ins for the same day are merged or treated as already synced
- updates to deleted entities are safely discarded
- queued create actions can absorb later updates before ever hitting the server
- temp client IDs are mapped to real server IDs after successful creation

## Optimistic Updates

Tasks and habits are updated optimistically so the UI responds before the server finishes.

### Behavior

- create actions insert a local temporary entity immediately
- update actions patch the current list item immediately
- delete actions remove the item immediately
- habit check-ins update streak-related UI immediately

### Rollback Strategy

- if an action fails permanently, only that affected entity is rolled back
- if an action should retry, optimistic state remains while the queue waits
- if the backend confirms the action, the optimistic entity is replaced with canonical server data

## API Documentation

Base URL:

```text
http://localhost:5000/api/v1
```

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/signup` | Create a new user account |
| POST | `/auth/login` | Log in with verified email |
| GET | `/auth/verify-email/:token` | Verify email using token |

### Tasks

All task routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/tasks` | Get current user tasks |
| POST | `/tasks` | Create a task |
| PUT | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task |

Task fields:

```json
{
  "title": "Finish README",
  "description": "Write project documentation",
  "dueDate": "2026-05-10T18:30:00.000Z",
  "completed": false
}
```

### Habits

All habit routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/habits` | Get current user habits |
| POST | `/habits` | Create a habit |
| DELETE | `/habits/:id` | Delete a habit |
| POST | `/habits/:id/check-in` | Daily habit check-in |

Habit fields:

```json
{
  "title": "Morning Walk",
  "streak": 0,
  "completedDates": [],
  "userId": "server-managed"
}
```

### API Response Shape

Successful responses use a consistent structure:

```json
{
  "code": "OK",
  "data": {},
  "message": "Request successful",
  "success": true
}
```

Error responses use a consistent structure:

```json
{
  "code": "REQUEST_FAILED",
  "details": null,
  "message": "Something went wrong",
  "success": false
}
```

## Scripts

### Frontend

```bash
npm start
npm run android
npm run ios
npm run web
npm run typecheck
```

### Backend

```bash
npm run dev
npm start
```

## Recruiter Notes

This project demonstrates practical engineering decisions that matter in real products:

- mobile app architecture beyond CRUD scaffolding
- resilient offline-first state management
- clean API layering and validation
- secure auth and email verification flow
- production-minded error handling and retry logic
- scalable feature-oriented folder structure

## Future Improvements

- refresh token flow and session renewal
- password reset flow
- task and habit filtering, sorting, and pagination
- push notifications and reminders
- analytics and activity insights
- automated test coverage
- CI/CD pipeline
- Dockerized local development
- EAS dev/prod builds for stronger MMKV-native testing
- server-side rate limiting and audit logging

## Notes

- For true persistent offline behavior, prefer a native dev build over Expo Go because MMKV native availability can affect storage persistence.
- Keep real secrets only in local `.env` files. Do not commit runtime secrets to Git.
