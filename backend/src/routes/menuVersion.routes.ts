import express from 'express';
import { findMenuVersion } from '../controllers/menuVersion.controller';

const router = express.Router();

router.get('/', findMenuVersion);

export default router;
