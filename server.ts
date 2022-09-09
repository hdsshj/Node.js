import { Request, Response } from 'express';
import { AnyError, Db, FindOptions, MongoClient } from 'mongodb';

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

const Mongo = require('mongodb').MongoClient;
require('dotenv').config();

app.set('view engine', 'ejs');

let db: Db;
Mongo.connect(process.env.DB_CONNECT_URL, (err: any, client: MongoClient) => {
  // console.log(client);
  if (err) return console.error(err);

  db = client.db('todoapp');

  app.listen(8080, function () {
    console.log('node server start');
  });
});

app.get('/pet', (req: Request, res: Response) => {
  res.send('펫용품 쇼핑할 수 있는 페이지입니다.');
});

app.get('/', (req: Request, res: Response) => {
  res.render('index.ejs');
});

app.get('/write', (req: Request, res: Response) => {
  res.render('write.ejs');
});

app.get('/list', (req: Request, res: Response) => {
  db.collection('post')
    .find()
    .toArray((err, result: any) => {
      res.render('list.ejs', { posts: result });
    });
});

app.post('/add', (req: Request, res: Response) => {
  res.send('전송 완료');

  db.collection('counter').findOne({ name: '게시물갯수' }, (err, result) => {
    if (result) {
      const total = result.totalPost;

      db.collection('post').insertOne({
        _id: total + 1,
        title: req.body.title,
        date: req.body.date,
        createdAt: new Date(),
      });

      db.collection('counter').updateOne(
        { name: '게시물갯수' },
        { $inc: { totalPost: 1 } },
        (err) => {
          if (err) return console.error(err);
        }
      );
    }
  });
});

app.delete('/delete', (req: Request, res: Response) => {
  console.log(req.body.id);
  const { id } = req.body;
  const postId = parseInt(id);
  db.collection('post').deleteOne({ _id: postId }, (err, result) => {
    if (err) return res.status(400).send({ message: '삭제 실패' });
    res.status(200).send({ message: '삭제 완료' });
  });
});
