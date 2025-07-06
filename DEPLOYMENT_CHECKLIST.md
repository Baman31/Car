# Deployment Checklist

## Pre-Deployment Steps

### 1. Backend (Render)
- [ ] Create Render account and connect GitHub repository
- [ ] Set up web service with Node.js runtime
- [ ] Configure environment variables:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=10000`
  - [ ] `MONGODB_URI=mongodb+srv://Himanshu:Himanshu123@himanshu.pe7xrly.mongodb.net/LMS`
  - [ ] `JWT_SECRET=<secure-random-string>`
  - [ ] `SESSION_SECRET=<secure-random-string>`
  - [ ] `CORS_ORIGIN=https://online-learning-platform-puce-sigma.vercel.app`
- [ ] Set build command: `npm install && npm run build:backend`
- [ ] Set start command: `npm start`
- [ ] Deploy and note the backend URL

### 2. Frontend Configuration
- [ ] Run: `node scripts/prepare-deployment.js https://onlinelearningplatform-ppes.onrender.com`
- [ ] Verify vercel.json has correct backend URL
- [ ] Verify queryClient.ts has correct API endpoint

### 3. Frontend (Vercel)
- [ ] Create Vercel account and import GitHub repository
- [ ] Configure project settings:
  - [ ] Framework: Vite
  - [ ] Build command: `npm run build:frontend`
  - [ ] Output directory: `dist/public`
  - [ ] Install command: `npm install`
- [ ] Set environment variable: `VITE_API_URL=https://onlinelearningplatform-ppes.onrender.com`
- [ ] Deploy to: `online-learning-platform-puce-sigma.vercel.app`

## Post-Deployment Testing

### Backend Testing
- [ ] Health check: `https://onlinelearningplatform-ppes.onrender.com/health` (if implemented)
- [ ] API endpoints: `https://onlinelearningplatform-ppes.onrender.com/api/mongo/courses`
- [ ] CORS headers present for frontend domain

### Frontend Testing
- [ ] Site loads: `https://online-learning-platform-puce-sigma.vercel.app`
- [ ] Authentication works (login/register)
- [ ] Course listing displays
- [ ] Student dashboard functions
- [ ] Admin panel accessible
- [ ] Test results display correctly

### Integration Testing
- [ ] User registration creates account in MongoDB
- [ ] Course enrollment works
- [ ] Test taking and grading functions
- [ ] Admin approval workflow works
- [ ] File uploads/downloads work (if applicable)

## Troubleshooting

### Common Issues
- **CORS errors**: Verify backend CORS_ORIGIN matches frontend domain
- **API connection failed**: Check VITE_API_URL environment variable
- **Database connection**: Verify MongoDB URI and network access
- **Authentication issues**: Check JWT_SECRET consistency
- **Build failures**: Verify all dependencies are in package.json

### Debug Commands
```bash
# Test backend locally
npm run build:backend && npm start

# Test frontend build
npm run build:frontend

# Check environment variables
echo $VITE_API_URL
```

## Production Considerations

### Security
- [ ] Use strong JWT_SECRET and SESSION_SECRET
- [ ] Enable HTTPS only in production
- [ ] Restrict CORS to specific domains
- [ ] Sanitize user inputs

### Performance
- [ ] Enable gzip compression
- [ ] Optimize database queries
- [ ] Use CDN for static assets
- [ ] Monitor backend performance

### Monitoring
- [ ] Set up error logging
- [ ] Monitor API response times
- [ ] Track user authentication errors
- [ ] Monitor database connections