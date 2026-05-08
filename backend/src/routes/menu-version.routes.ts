import express from 'express';
import { findMenuVersion } from '../controllers/menu-version.controller';

const router = express.Router();

router.get('/', findMenuVersion);

export default router;
