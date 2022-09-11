"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("../server");
const router = require('express').Router();
// router.use(authrization);
router.use('/shirts', server_1.authrization);
router.get('/shirts', (req, res) => {
    res.send('셔츠 파는 페이지');
});
router.get('/pants', (req, res) => {
    res.send('바지 파는 페이지');
});
module.exports = router;
