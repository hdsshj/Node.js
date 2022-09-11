"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("../server");
const server_2 = require("../server");
const router = require('express').Router();
router.use(server_1.authrization);
router.get('/list', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const chatRoomsList = yield server_2.db
        .collection('chatroom')
        .find({ member: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id })
        .toArray();
    // console.log();
    res.render('chat.ejs', { chatRoomsList: chatRoomsList });
}));
router.post('/create', (req, res) => {
    server_2.db.collection('counter').findOne({ name: 'chatroom' }, (err, result) => {
        if (!result || !req.user)
            return;
        const total = result.total;
        const writer = parseInt(req.body.writer);
        console.log('writer ===> ', writer);
        if (writer === req.user._id)
            return res.status(400).send({ message: '본인한테 채팅 못행' });
        server_2.db.collection('chatroom').findOne({ member: [writer, req.user._id] }, (err, result) => {
            if (result)
                return res.status(400).send({ message: '이미 있는 채팅방임' });
            if (req.user) {
                server_2.db.collection('chatroom').insertOne({
                    _id: total + 1,
                    title: `room${total + 1}`,
                    member: [writer, req.user._id],
                    createdAt: new Date(),
                }, () => {
                    (0, server_1.addCounter)('chatroom');
                });
            }
        });
    });
});
router.post('/message', (req, res) => {
    server_2.db.collection('counter').findOne({ name: 'message' }, (err, result) => {
        var _a;
        const total = result.total;
        const data = {
            _id: total + 1,
            roomId: parseInt(req.body.roomId),
            message: req.body.message,
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            date: new Date(),
        };
        server_2.db.collection('message').insertOne(data, (err, result) => {
            (0, server_1.addCounter)('message');
            res.status(200).send({ message: '메시지 전송 완료' });
        });
    });
});
router.get('/message', (req, res) => {
    res.writeHead(200, {
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
    });
    res.write('event : test\n');
    res.write('data : 안녕\n\n');
});
module.exports = router;
