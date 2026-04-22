# FITRACK Setup Guide

This repository has two apps:

- `frontend`: Expo Router app for mobile and web
- `backend`: Express + MongoDB API

## Prerequisites

Install these before running the project:

- `Node.js` 20 or newer
- `npm` 10 or newer
- `MongoDB` 7 or newer

Helpful optional tools:

- `Expo Go` on your phone if you want to test mobile quickly
- `Android Studio` for an Android emulator
- `Xcode` on macOS for an iOS simulator

## Project Structure

```text
FITRACK/
  backend/
  frontend/
```

## 1. Install Dependencies

Install backend packages:

```bash
cd backend
npm install
```

Install frontend packages:

```bash
cd ../frontend
npm install
```

## 2. Set Up Backend Environment Variables

Create a file at `backend/.env`.

You can copy the example:

```bash
cp backend/.env.example backend/.env
```

If you are on Windows PowerShell:

```powershell
Copy-Item backend\.env.example backend\.env
```

Required values in `backend/.env`:

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/fitrack
JWT_ACCESS_SECRET=replace-with-access-secret
JWT_REFRESH_SECRET=replace-with-refresh-secret
FIELD_ENCRYPTION_KEY=replace-with-32-char-secret-key!!!!
CLIENT_URL=http://localhost:8081
```

Notes:

- `MONGODB_URI` must point to a running MongoDB instance.
- `CLIENT_URL` should match the frontend web URL.
- `FIELD_ENCRYPTION_KEY` should be a strong secret.
- Replace both JWT secrets with your own secure values.

## 3. Start MongoDB

Make sure MongoDB is running locally on port `27017`, or update `MONGODB_URI` to your own database.

Example local connection:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/fitrack
```

## 4. Run the Backend

From the `backend` folder:

```bash
npm run dev
```

Expected API base URL:

```text
http://localhost:4000/api
```

## 5. Run the Frontend

From the `frontend` folder:

```bash
npm run web
```

Or for mobile development:

```bash
npm run android
```

```bash
npm run ios
```

Frontend web usually runs at:

```text
http://localhost:8081
```

## 6. Frontend API URL

The frontend reads the backend URL from:

- `frontend/constants/config.ts`
- `EXPO_PUBLIC_API_BASE_URL` if provided

Default value:

```text
http://10.0.2.2:4000/api
```

For web development, set:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

You can place that in a frontend env file if needed, or export it before starting Expo.

## Recommended Run Order

1. Start MongoDB
2. Start the backend
3. Start the frontend

## Useful Commands

Backend:

```bash
cd backend
npm run dev
npm run build
```

Frontend:

```bash
cd frontend
npm run start
npm run web
npm run lint
```

## Troubleshooting

### Backend does not start

Check these first:

- `backend/.env` exists
- MongoDB is running
- all required environment variables are present

### Frontend cannot reach backend

Check these:

- backend is running on port `4000`
- frontend is using the correct API base URL
- `CLIENT_URL` in backend matches the frontend URL

### Web app opens but API requests fail

Most likely the frontend is still pointing to:

```text
http://10.0.2.2:4000/api
```

That value is mainly for Android emulator usage. For web, use:

```text
http://localhost:4000/api
```

## Quick Start Summary

```bash
cd backend
npm install
Copy-Item .env.example .env
npm run dev
```

In a second terminal:

```bash
cd frontend
npm install
$env:EXPO_PUBLIC_API_BASE_URL="http://localhost:4000/api"
npm run web
```
