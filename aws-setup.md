# AWS Environment Setup Guide

## Running the Application on AWS

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Local/AWS Mode
```bash
# Method 1: Use the local runner script
node run-local.js

# Method 2: Set environment variables manually
export NODE_ENV=development
unset REPL_ID
unset REPLIT_DOMAINS
npx tsx server/index.ts

# Method 3: One-liner
NODE_ENV=development npx tsx server/index.ts
```

### 3. Build for Production
```bash
# For AWS/local environment
npm run build:local
```

### 4. Environment Variables
Create a `.env` file with:
```env
NODE_ENV=development
MONGODB_URI=mongodb+srv://Himanshu:Himanshu123@himanshu.pe7xrly.mongodb.net/LMS
JWT_SECRET=your-secret-key
PORT=5000
```

### 5. Port Configuration
- Backend runs on port 5000
- Frontend dev server runs on port 3000 (when using vite)
- Make sure these ports are open in your AWS security groups

### 6. MongoDB Connection
The app is configured to use your existing MongoDB Atlas database. No changes needed.

### 7. Troubleshooting

#### "Address already in use" error:
```bash
# Kill existing Node processes
pkill -f "node.*server/index.ts"
pkill -f tsx
# Or find and kill the specific port
sudo netstat -tlnp | grep :5000
sudo kill -9 <PID>
```

#### Vite config errors with `import.meta.dirname`:
```bash
# Use the local runner which bypasses Replit configs
node run-local.js
```

#### Permission errors:
```bash
# Make the script executable
chmod +x run-local.js
```

#### Missing dependencies:
```bash
# Install if not already installed
npm install tsx cross-env
```