# Social Platform

A real-time social platform with user authentication, posts, likes, comments, and live chat powered by Socket.io.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Socket.io Client
- **Backend:** Node.js, Express, Socket.io, JWT, bcryptjs
- **Real-time:** Socket.io for live chat and post updates

## Features

- User registration & login (JWT)
- Create, like, and comment on posts
- Real-time live chat
- Responsive dark-themed UI

## Structure

```
social-platform/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Express + Socket.io server
│   │   └── routes/
│   │       ├── auth.ts       # Register/Login
│   │       └── posts.ts      # Posts CRUD
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx            # Auth context & layout
    │   ├── api/client.ts      # Axios instance with auth interceptor
    │   └── pages/
    │       ├── Login.tsx      # Login/Register form
    │       └── Feed.tsx       # Social feed + chat
    ├── index.html
    ├── vite.config.ts
    ├── tsconfig.json
    └── package.json
```

## How to Run

### From root (requires `concurrently`)
```bash
npm install
npm run install:all
npm run dev
```

### Or separately

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3002` in your browser.
