"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authrization = exports.addCounter = exports.db = void 0;
const express_1 = __importDefault(require("express"));
// import shopRouter from './rotues/shop';
// import boardRouter from './rotues/board';
// const express = require('express');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const Mongo = require('mongodb').MongoClient;
const app = (0, express_1.default)();
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http);
app.use(bodyParser.urlencoded({ extended: true }));
require('dotenv').config();
app.set('view engine', 'ejs');
app.use('/public', express_1.default.static('public'));
app.use(methodOverride('_method'));
app.use(session({ secret: 'admin', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((user, done) => {
    console.log(user);
    done(null, user.memberId);
});
passport.deserializeUser((id, done) => {
    exports.db.collection('member').findOne({ memberId: id }, (err, result) => {
        done(null, result);
    });
});
Mongo.connect(process.env.DB_CONNECT_URL, (err, client) => {
    // console.log(client);
    if (err)
        return console.error(err);
    exports.db = client.db('todoapp');
    http.listen(8080, function () {
        console.log('node server start');
    });
});
app.get('/socket', (req, res) => {
    res.render('socket.ejs');
});
io.on('connection', (socket) => {
    console.log('접속 됨');
    socket.on('message', (data) => {
        console.log(data);
        io.emit('broadcast', data);
    });
});
app.get('/pet', (req, res) => {
    res.send('펫용품 쇼핑할 수 있는 페이지입니다.');
});
app.get('/', (req, res) => {
    res.render('index.ejs');
});
app.get('/write', (req, res) => {
    res.render('write.ejs');
});
app.get('/list', (req, res) => {
    exports.db.collection('post')
        .find()
        .toArray((err, result) => {
        res.render('list.ejs', { posts: result });
    });
});
const addCounter = (target) => {
    exports.db.collection('counter').updateOne({ name: target }, { $inc: { total: 1 } }, (err, result) => {
        if (err)
            return console.error(err);
    });
};
exports.addCounter = addCounter;
app.post('/add', (req, res) => {
    if (!req.user)
        return res.redirect('/login');
    res.send('전송 완료');
    exports.db.collection('counter').findOne({ name: 'post' }, (err, result) => {
        var _a;
        if (result) {
            const total = result.total;
            console.log(req.user);
            exports.db.collection('post').insertOne({
                _id: total + 1,
                title: req.body.title,
                date: req.body.date,
                writer: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
                createdAt: new Date(),
            });
            (0, exports.addCounter)('post');
        }
    });
});
app.delete('/delete', (req, res) => {
    var _a, _b;
    const { id } = req.body;
    const postId = parseInt(id);
    console.log((_a = req.user) === null || _a === void 0 ? void 0 : _a.memberId);
    exports.db.collection('post').deleteOne({ _id: postId, writer: (_b = req.user) === null || _b === void 0 ? void 0 : _b.memberId }, (err) => {
        if (err)
            return res.status(400).send({ message: '삭제 실패' });
        res.status(200).send({ message: '삭제 완료' });
    });
});
app.get('/detail/:id', (req, res) => {
    console.log('요청 옴');
    exports.db.collection('post').findOne({ _id: parseInt(req.params.id) }, (err, result) => {
        res.render('detail.ejs', { post: result });
    });
});
app.get('/edit/:id', (req, res) => {
    exports.db.collection('post').findOne({ _id: parseInt(req.params.id) }, (err, result) => {
        res.render('edit.ejs', { post: result });
    });
});
app.put('/edit/:id', (req, res) => {
    exports.db.collection('post').updateOne({ _id: parseInt(req.params.id) }, { $set: { title: req.body.title, date: req.body.date } }, (err) => {
        res.redirect('/list');
    });
});
app.get('/login', (req, res) => {
    res.render('login.ejs');
});
app.post('/login', passport.authenticate('local', { failureRedirect: '/fail' }), (req, res) => {
    // db.collection('member').findOne({})
    res.redirect('/');
});
passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
}, (reqId, reqPw, done) => {
    exports.db.collection('member').findOne({ memberId: reqId }, (err, result) => {
        if (err)
            return done(err);
        if (!result)
            return done(null, false, { message: '존재하지않는 아이디요' });
        if (reqPw == result.password) {
            return done(null, result);
        }
        else {
            return done(null, false, { message: '비번틀렸어요' });
        }
    });
}));
const authrization = (req, res, next) => {
    console.log(req.user);
    if (req.user) {
        next();
    }
    else {
        res.redirect('/login');
    }
};
exports.authrization = authrization;
app.get('/mypage', exports.authrization, (req, res) => {
    res.render('mypage.ejs', { user: req.user });
});
app.get('/search', (req, res) => {
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
    exports.db.collection('post')
        .aggregate(searchRules)
        .toArray((err, result) => {
        if (err)
            return console.error(err);
        res.render('searchList.ejs', {
            posts: result,
            searchValue: req.query.value,
        });
        console.log(result);
    });
});
app.get('/resister', (req, res) => {
    res.render('resister.ejs');
});
app.post('/resister', (req, res) => {
    exports.db.collection('member').findOne({ memberId: req.body.id }, (err, result) => {
        if (result)
            return res.send('이미 가입된 아이디임');
        exports.db.collection('counter').findOne({ name: 'member' }, (err, result) => {
            const total = result.total;
            console.log(req.body);
            exports.db.collection('member').insertOne({
                _id: total + 1,
                memberId: req.body.id,
                password: req.body.pw,
            }, (err, result) => {
                if (result) {
                    (0, exports.addCounter)('member');
                }
            });
        });
    });
});
app.use('/shop', require('./rotues/shop'));
app.use('/board/sub', require('./rotues/board'));
app.get('/upload', (req, res) => {
    res.render('upload.ejs');
});
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/image');
    },
    filename: (req, file, cb) => {
        console.log(file.originalname);
        cb(null, file.originalname);
    },
    filefilter: (req, file, cb) => { },
});
const upload = multer({ storage: storage });
app.post('/upload', upload.single('profile'), (req, res) => {
    console.log(req.body);
    res.send('업로드 완료');
});
app.get('/image/:fileName', (req, res) => {
    console.log(`/public/image/${req.params.fileName}`);
    res.sendFile(__dirname + `/public/image/${req.params.fileName}`);
    // res.sendFile(__dirname + `public/image/555.jpeg`);
});
app.use('/chat', require('./rotues/chat'));
