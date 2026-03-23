import { Router } from 'express';
import { updateProfile, changePassword, uploadAvatar } from '../controllers/profileController.js';
import { protect } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';

const router = Router();
router.use(protect);
router.put('/', updateProfile);
router.put('/password', changePassword);
router.post('/avatar', upload.single('avatar'), uploadAvatar);

export default router;
