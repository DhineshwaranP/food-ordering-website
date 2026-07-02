# College Canteen Management Web Application

Full-stack food ordering app built with React/Vite, Node.js/Express, and MongoDB.

## Local Development

1. Install dependencies:
   ```cmd
   npm run install:all
   ```

2. Create the backend env file:
   ```cmd
   copy backend\.env.example backend\.env
   ```

3. Edit `backend\.env` with your MongoDB connection string and JWT secret.

4. Run both apps:
   ```cmd
   npm run dev
   ```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:5000`

## Production Build

Build the React app:

```cmd
npm run build
```

Start the Express server:

```cmd
npm start
```

In production, Express serves `frontend/dist` and all API routes from one server.

## Required Environment Variables

Set these on your hosting platform:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://USER:PASSWORD@HOST/canteen_db
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-domain.com
```

If the frontend is deployed separately, set `VITE_API_BASE_URL` in the frontend environment before building:

```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

## Deployment Notes

- Use `npm run install:all` as the install command if your host starts from the repository root.
- Use `npm run build` as the build command.
- Use `npm start` as the start command.
- Uploaded menu images are stored in `backend/uploads`. On platforms with ephemeral disks, use persistent storage or move uploads to cloud storage before relying on them long term.

Health check endpoint:

```txt
/api/health
```
