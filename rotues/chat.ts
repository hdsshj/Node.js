import { Router } from 'express';
import { addCounter, authrization } from '../server';
import { db } from '../server';

const router: Router = require('express').Router();

router.use(authrization);

router.get('/list', async (req, res) => {
  const chatRoomsList = await db
    .collection('chatroom')
    .find({ member: req.user?._id })
    .toArray();

  // console.log();

  res.render('chat.ejs', { chatRoomsList: chatRoomsList });
});

router.post('/create', (req, res) => {
  db.collection('counter').findOne({ name: 'chatroom' }, (err, result) => {
    if (!result || !req.user) return;

    const total = result.total;
    const writer = parseInt(req.body.writer);

    console.log('writer ===> ', writer);

    if (writer === req.user._id)
      return res.status(400).send({ message: '본인한테 채팅 못행' });

    db.collection('chatroom').findOne(
      { member: [writer, req.user._id] },
      (err, result) => {
        if (result)
          return res.status(400).send({ message: '이미 있는 채팅방임' });

        if (req.user) {
          db.collection('chatroom').insertOne(
            {
              _id: total + 1,
              title: `room${total + 1}`,
              member: [writer, req.user._id],
              createdAt: new Date(),
            },
            () => {
              addCounter('chatroom');
            }
          );
        }
      }
    );
  });
});

router.post('/message', (req, res) => {
  db.collection('counter').findOne({ name: 'message' }, (err, result: any) => {
    const total = result.total;

    const data = {
      _id: total + 1,
      roomId: parseInt(req.body.roomId),
      message: req.body.message,
      userId: req.user?._id,
      date: new Date(),
    };

    db.collection('message').insertOne(data, (err, result) => {
      addCounter('message');
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
