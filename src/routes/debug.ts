import { Router } from 'express';

const router = Router();

router.get('/env-check', (req, res) => {
  res.json({
    hasMongoUri: !!process.env.MONGODB_URI,
    hasJwtSecret: !!process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV,
    mongoUriLength: process.env.MONGODB_URI?.length || 0,
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('MONGO') || 
      key.includes('JWT') || 
      key.includes('NODE_ENV')
    )
  });
});

export { router as debugRoutes };