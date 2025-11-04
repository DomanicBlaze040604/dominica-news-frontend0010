import express, { Request, Response } from 'express';
import { BreakingNews } from '../models/BreakingNews';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

// Create or update breaking news (admin only)
router.post('/', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { text, isActive } = req.body;

    if (!text || text.trim().length < 5)
      return res.status(400).json({ success: false, message: 'Breaking news text too short.' });

    // Only one active breaking news at a time
    if (isActive) await BreakingNews.updateMany({}, { isActive: false });

    const news = await BreakingNews.create({ text, isActive });
    res.status(201).json({ success: true, news });
  } catch (error: any) {
    console.error('❌ Error creating breaking news:', error);
    res.status(500).json({ success: false, message: 'Failed to save breaking news.' });
  }
});

// Fetch active breaking news
router.get('/active', async (_req, res) => {
  try {
    const active = await BreakingNews.findOne({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, active });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load active breaking news.' });
  }
});

// Fetch all breaking news (for admin history)
router.get('/', async (_req, res) => {
  try {
    const all = await BreakingNews.find().sort({ createdAt: -1 });
    res.json({ success: true, all });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load breaking news history.' });
  }
});

// Delete breaking news (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const deleted = await BreakingNews.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Breaking news deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete breaking news.' });
  }
});

export { router as breakingNewsRoutes };
