import { Router } from 'express';
import { authrization } from '../server';

const router: Router = require('express').Router();

// router.use(authrization);
router.use('/shirts', authrization);

router.get('/shirts', (req, res) => {
  res.send('셔츠 파는 페이지');
});

router.get('/pants', (req, res) => {
  res.send('바지 파는 페이지');
});

module.exports = router;
