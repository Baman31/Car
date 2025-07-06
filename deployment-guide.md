# Deployment Guide: Vercel + Render

## Overview
- **Frontend**: Vercel (online-learning-platform-puce-sigma.vercel.app)
- **Backend**: Render (Node.js service)
- **Database**: MongoDB Atlas (existing)

## Quick Start Commands

```bash
# 1. Install dependencies
npm install

# 2. Configure for deployment
node scripts/prepare-deployment.js https://onlinelearningplatform-ppes.onrender.com

# 3. Build for production
npm run build:prod
```

## Step 1: Prepare Environment Files

Create these environment variable files:

### Frontend (.env.production)
```env
VITE_API_URL=https://onlinelearningplatform-ppes.onrender.com
```

### Backend Environment Variables (for Render)
```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://Himanshu:Himanshu123@himanshu.pe7xrly.mongodb.net/LMS
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-session-secret-key-here
CORS_ORIGIN=https://online-learning-platform-puce-sigma.vercel.app
```

## Step 2: Deploy Backend to Render

1. **Create Render Account**: Go to https://render.com and sign up
2. **Connect GitHub**: Link your GitHub repository
3. **Create Web Service**:
   - Service Type: Web Service
   - Repository: Your GitHub repo
   - Branch: main
   - Runtime: Node
   - Build Command: `npm install && npm run build:backend`
   - Start Command: `npm start`
   - Instance Type: Free (or paid for better performance)
   - Auto-Deploy: Yes

4. **Set Environment Variables** in Render dashboard:
   - `NODE_ENV=production`
   - `PORT=10000`
   - `MONGODB_URI=mongodb+srv://Himanshu:Himanshu123@himanshu.pe7xrly.mongodb.net/LMS`
   - `JWT_SECRET=your-super-secret-jwt-key-here`
   - `SESSION_SECRET=your-session-secret-key-here`
   - `CORS_ORIGIN=https://online-learning-platform-puce-sigma.vercel.app`

5. **Deploy**: Render will automatically build and deploy your backend

## Step 3: Update Frontend Configuration

**Use the automated script:**
```bash
node scripts/prepare-deployment.js https://your-actual-render-url.onrender.com
```

This script will:
1. Update `vercel.json` with your backend URL
2. Update `queryClient.ts` with the correct API endpoint
3. Create production environment file

## Step 4: Deploy Frontend to Vercel

1. **Create Vercel Account**: Go to https://vercel.com and sign up
2. **Connect GitHub**: Import your repository
3. **Configure Project**:
   - Framework Preset: Vite
   - Build Command: `npm run build:frontend`
   - Output Directory: `dist/public`
   - Install Command: `npm install`

4. **Set Environment Variables** in Vercel dashboard:
   - `VITE_API_URL=https://onlinelearningplatform-ppes.onrender.com`

5. **Custom Domain**: Set up your domain `online-learning-platform-puce-sigma.vercel.app`

## Step 5: Update CORS Configuration

Update your backend's CORS configuration to allow requests from Vercel:

```javascript
// In server/index.ts
app.use(cors({
  origin: [
    'https://online-learning-platform-puce-sigma.vercel.app',
    'http://localhost:3000', // for local development
  ],
  credentials: true
}));
```

## Step 6: Test Deployment

1. **Backend Health Check**: Visit `https://onlinelearningplatform-ppes.onrender.com/health`
2. **Frontend**: Visit `https://online-learning-platform-puce-sigma.vercel.app`
3. **Test Authentication**: Try logging in/registering
4. **Test Features**: Verify courses, tests, and admin features work

## Build Commands Added

- `npm run build:frontend` - Builds only the frontend for Vercel
- `npm run build:backend` - Builds only the backend for Render
- `npm run build:prod` - Builds both for production
- `node scripts/prepare-deployment.js <backend-url>` - Configures URLs for deployment

## Important Notes

1. **Database**: Your MongoDB Atlas database will work with both platforms
2. **Environment Variables**: Keep JWT_SECRET and SESSION_SECRET secure
3. **CORS**: Make sure backend allows requests from your Vercel domain
4. **Free Tier Limitations**: 
   - Render free tier sleeps after 15 minutes of inactivity
   - Consider upgrading for production use
5. **SSL**: Both Vercel and Render provide SSL certificates automatically

## Troubleshooting

### Backend Issues
- Check Render logs for errors
- Verify environment variables are set correctly
- Ensure MongoDB connection string is correct

### Frontend Issues
- Check browser console for API errors
- Verify API URL is correctly set
- Test API endpoints directly

### CORS Issues
- Update backend CORS origin to match Vercel domain
- Check that credentials are properly configured