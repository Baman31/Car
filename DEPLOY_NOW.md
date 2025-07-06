# Deploy Your EduPlatform Right Now

## Part 1: Deploy Backend to Render (Do This First)

### 1. Go to Render.com
- Visit https://render.com
- Sign up with your GitHub account
- Click "New +" → "Web Service"

### 2. Connect Your Repository
- Select your GitHub repository
- Choose the main branch

### 3. Configure Service Settings
```
Name: eduplatform-backend
Runtime: Node
Build Command: npm install
Start Command: npm start
```

### 4. Add Environment Variables (CRITICAL)
Click "Environment" tab and add these:
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://Himanshu:Himanshu123@himanshu.pe7xrly.mongodb.net/LMS
JWT_SECRET=make-this-a-very-long-random-string-123456789
SESSION_SECRET=another-very-long-random-string-987654321
CORS_ORIGIN=https://online-learning-platform-puce-sigma.vercel.app
```

### 5. Deploy
- Click "Deploy"
- Wait 5-10 minutes
- Your backend will be at: https://onlinelearningplatform-ppes.onrender.com

## Part 2: Deploy Frontend to Vercel (Do This Second)

### 1. Go to Vercel.com  
- Visit https://vercel.com
- Sign up with your GitHub account
- Click "New Project"

### 2. Import Repository
- Select your GitHub repository
- Click "Import"

### 3. Configure Project Settings
```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist/public
Install Command: npm install
```

### 4. Add Environment Variable
In "Environment Variables" section:
```
VITE_API_URL=https://onlinelearningplatform-ppes.onrender.com
```

### 5. Deploy
- Click "Deploy"
- Wait 3-5 minutes
- Your frontend will be at: https://online-learning-platform-puce-sigma.vercel.app

## Part 3: Test Everything

### Test Backend
Visit: https://onlinelearningplatform-ppes.onrender.com/api/mongo/courses
Should show course data

### Test Frontend  
Visit: https://online-learning-platform-puce-sigma.vercel.app
Should load your login page

### Test Together
- Register a new user on frontend
- Login and browse courses
- Test admin features

## If Something Goes Wrong

### Backend Issues
- Check Render logs for errors
- Verify all environment variables are set
- Make sure MongoDB URI is correct

### Frontend Issues  
- Check Vercel function logs
- Verify VITE_API_URL points to your Render backend
- Try building locally first: `npm run build`

### CORS Issues
- Backend must have CORS_ORIGIN set to your Vercel domain
- Both domains must use HTTPS in production

## Important Notes
- Backend takes longer to deploy (5-10 min)
- Frontend deploys faster (3-5 min)  
- Render free tier sleeps after 15 min idle
- First request after sleep takes ~30 seconds