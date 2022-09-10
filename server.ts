import { NextFunction, Request, Response } from 'express';
import { AnyError, Db, FindOptions, MongoClient, OptionalId } from 'mongodb';
import { PassportStatic } from 'passport';

const express = require('express');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const passport: PassportStatic = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const Mongo = require('mongodb').MongoClient;
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

require('dotenv').config();

app.set('view engine', 'ejs');
app.use('/public', express.static('public'));
app.use(methodOverride('_method'));
app.use(session({ secret: 'admin', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

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

  db.collection('counter').findOne({ name: 'post' }, (err, result) => {
    if (result) {
      const total = result.total;

      db.collection('post').insertOne({
        _id: total + 1,
        title: req.body.title,
        date: req.body.date,
        createdAt: new Date(),
      });

      db.collection('counter').updateOne(
        { name: 'post' },
        { $inc: { total: 1 } },
        (err) => {
          if (err) return console.error(err);
        }
      );
    }
  });
});

app.delete('/delete', (req: Request, res: Response) => {
  const { id } = req.body;
  const postId = parseInt(id);
  db.collection('post').deleteOne({ _id: postId }, (err, result) => {
    if (err) return res.status(400).send({ message: '삭제 실패' });
    res.status(200).send({ message: '삭제 완료' });
  });
});

app.get('/detail/:id', (req: Request, res: Response) => {
  console.log('요청 옴');
  db.collection('post').findOne(
    { _id: parseInt(req.params.id) },
    (err, result) => {
      res.render('detail.ejs', { post: result });
    }
  );
});

app.get('/edit/:id', (req: Request, res: Response) => {
  db.collection('post').findOne(
    { _id: parseInt(req.params.id) },
    (err, result) => {
      res.render('edit.ejs', { post: result });
    }
  );
});

app.put('/edit/:id', (req: Request, res: Response) => {
  db.collection('post').updateOne(
    { _id: parseInt(req.params.id) },
    { $set: { title: req.body.title, date: req.body.date } },
    (err, result) => {
      res.redirect('/list');
    }
  );
});

app.get('/login', (req: Request, res: Response) => {
  res.render('login.ejs');
});

app.post(
  '/login',
  passport.authenticate('local', { failureRedirect: '/fail' }),
  (req: Request, res: Response) => {
    // db.collection('member').findOne({})
    res.redirect('/');
  }
);

passport.use(
  new LocalStrategy(
    {
      usernameField: 'id',
      passwordField: 'pw',
      session: true,
      passReqToCallback: false,
    },
    (reqId: string, reqPw: string, done: any) => {
      db.collection('member').findOne({ memberId: reqId }, (err, result) => {
        if (err) return done(err);

        if (!result)
          return done(null, false, { message: '존재하지않는 아이디요' });
        if (reqPw == result.password) {
          return done(null, result);
        } else {
          return done(null, false, { message: '비번틀렸어요' });
        }
      });
    }
  )
);

passport.serializeUser((user: any, done) => {
  console.log(user);
  done(null, user.memberId);
});

passport.deserializeUser((id, done) => {
  db.collection('member').findOne({ memberId: id }, (err, result) => {
    done(null, result);
  });
});

const authrization = (req: Request, res: Response, next: NextFunction) => {
  console.log(req.user);
  if (req.user) {
    next();
  } else {
    res.redirect('/login');
  }
};

app.get('/mypage', authrization, (req: Request, res: Response) => {
  res.render('mypage.ejs', { user: req.user });
});

app.get('/search', (req: Request, res: Response) => {
  console.log(req.query);
  const searchRules = [
    {
      $search: {
        index: 'titleSearch',
        text: {
          query: req.query.value,
          path: 'title',
        },
      },
    },
    // 정렬
    { $sort: { _id: 1 } },
    // 갯수
    { $limit: 10 },
    // 출력 범위, score는 연관성 점수
    { $project: { title: 1, _id: 0, score: { $meta: 'searchScore' } } },
  ];

  db.collection('post')
    .aggregate(searchRules)
    .toArray((err, result) => {
      if (err) return console.error(err);

      res.render('searchList.ejs', {
        searchPosts: result,
        searchValue: req.query.value,
      });

      console.log(result);
    });
});
