const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const {DBHOST, DBPORT, DBNAME,Username,Password} = require('./config/config.js');
const Bookmark = require('./models/BookmarkModel.js');
const User = require('./models/UserModel.js');
//导入检测登录的中间件
const requireLogin = require('./middlewares/checkLoginMiddleware.js');
// 创建一个黑名单列表，用于存储已注销的JWT令牌
// const tokenBlacklist = [];
global.tokenBlacklist = [];
const jwt = require('jsonwebtoken');
const app = express();
const port = 3000;

// 连接到 MongoDB
mongoose.connect(`mongodb://${DBHOST}:${DBPORT}/${DBNAME}`, {
    useNewUrlParser: true,  // 使用新的 URL 解析器，不建议使用旧的
    useUnifiedTopology: true,  // 使用新的服务器发现和监视引擎
    user: Username,
    pass: Password,
});

const db = mongoose.connection;

app.use(express.json());
app.use(bodyParser.json());

// 配置会话中间件 这里不再使用session而是使用 JWT令牌
// app.use(session({
//   secret: 'your_secret_key', // 用于签名会话ID的密钥
//   resave: false,
//   saveUninitialized: true,
// }));

// 注册用户
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = new User({ username, password });
    await user.save();
    // req.session.user = user; // 存储用户信息在会话中 这里不再使用session而是使用 JWT令牌
    res.status(201).json({ message: '用户注册成功' });
  } catch (error) {
    res.status(500).json({ message: '用户注册失败' });
  }
});

// 用户登录
// app.post('/api/login', async (req, res) => {
//   const { username, password } = req.body;
//   try {
//     const user = await User.findOne({ username, password });
//     if (user) {
//       req.session.user = user; // 存储用户信息在会话中
//       res.status(200).json({ message: '登录成功' });
//       console.log(req.session.user);
//     } else {
//       res.status(401).json({ message: '登录失败' });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: '登录失败' });
//   }
// });
// 在登录成功后生成JWT令牌
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });
    if (user) {
      // 使用JWT令牌
      const token = jwt.sign({ userId: user._id }, 'browser-bookmarks_secret_key', { expiresIn: '1h' });
      res.status(200).json({ message: '登录成功', token });
    } else {
      res.status(401).json({ message: '登录失败' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '登录失败' });
  }
});

// 用户退出登录
// app.get('/api/logout', (req, res) => {
//   req.session.destroy((err) => {
//     if (err) {
//       res.status(500).json({ message: '退出登录失败' });
//     } else {
//       res.status(200).json({ message: '成功退出登录' });
//     }
//   });
// });
// 用户退出登录
app.post('/api/logout', (req, res) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (token) {
    // 将JWT令牌添加到黑名单
    global.tokenBlacklist.push(token);
    res.status(200).json({ message: '成功退出登录' });
  } else {
    res.status(401).json({ message: '未提供令牌' });
  }
});

// 创建书签
app.post('/api/bookmarks', async (req, res) => {
  const Bookmarks = req.body;
  const { name, url, icon } = req.body;
  const newBookmark = new Bookmark({ name, url, icon });
  const isNameDuplicate = await Bookmark.findOne({ name });
  const isUrlDuplicate = await Bookmark.findOne({ url });
  if (!Bookmarks || !Bookmarks.name || !Bookmarks.url || !Bookmarks.icon) {
    res.status(400).json({ success: false, message: '无效或缺少参数' });
    return;
  }
  // 存入数据库前检查名称和URL是否重复
  if (isNameDuplicate || isUrlDuplicate) {
      res.status(409).json({ success: false, message: '具有相同名称或URL地址的书签已存在' });
  } else {
    try {
      await newBookmark.save();
      res.status(201).json({ message: '书签已创建', bookmark: newBookmark });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
});

// 获取所有书签
app.get('/api/bookmarks',requireLogin, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find();
    res.json(bookmarks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
  // console.log('接收的请求体',req.body);
});

// 获取单个书签
app.get('/api/bookmarks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const bookmark = await Bookmark.findById(id);
    if (bookmark) {
      res.json(bookmark);
    } else {
      res.status(404).json({ message: '未找到书签' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新书签
app.put('/api/bookmarks/:id', async (req, res) => {
  const { id } = req.params;
  const { name, url, icon } = req.body;
  const Bookmarks = req.body;
  if (!Bookmarks || !Bookmarks.name || !Bookmarks.url || !Bookmarks.icon) {
    res.status(400).json({ success: false, message: '无效或缺少参数' });
    return;
  }
  try {
    const updatedBookmark = await Bookmark.findByIdAndUpdate(id, { name, url, icon }, { new: true });
    if (updatedBookmark) {
      res.json({ message: '书签已更新', bookmark: updatedBookmark });
    } else {
      res.status(404).json({ message: '未找到书签' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除书签
app.delete('/api/bookmarks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deletedBookmark = await Bookmark.findByIdAndRemove(id);
    if (deletedBookmark) {
      res.json({ message: '书签已删除', bookmark: deletedBookmark });
    } else {
      res.status(404).json({ message: '未找到书签' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 配置 multer 中间件来处理文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'public/img'); // 选择图标存储的目录
  },
  filename: (req, file, cb) => {
      const extname = path.extname(file.originalname);
      cb(null, 'icon-' + Date.now() + extname); // 生成唯一文件名
  }
});

// 添加文件过滤器
const fileFilter = (req, file, cb) => {
  // 检查文件类型是否为图片
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
  } else {
      cb(new Error('错误:无效的文件类型。只允许使用JPEG、PNG和GIF图像'), false);
  }
};

const upload = multer({
  storage,
  limits: {
      fileSize: 1 * 1024 * 1024, // 限制文件大小为1MB
  },
  fileFilter,
});

// 添加上传图标的路由
app.post('/api/upload-icon', upload.single('icon'), (req, res) => {
  if (req.file) {
      // 获取图标文件的路径
      const iconPath = path.join('public', 'img', path.basename(req.file.path)).replace(/\\/g, '/');
      // 返回上传成功信息
      res.status(201).json({ success: true, message: '图标上传成功', iconPath });
  } else {
      // 返回上传失败信息
      res.status(400).json({ success: false, message: '图标上传失败' });
  }
});

// 受保护的路由，检查JWT令牌是否在黑名单中
app.get('/api/protected-route', (req, res) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (token) {
    // 检查JWT令牌是否在黑名单中
    if (tokenBlacklist.includes(token)) {
      res.status(401).json({ message: '令牌无效' });
    } else {
      // 令牌有效，继续请求
      res.status(200).json({ message: '身份验证成功' });
    }
  } else {
    res.status(401).json({ message: '未提供令牌' });
  }
});

// 404
app.get('*', (req, res) => {
    res.status(404).send(`
    <h1>404</h1>
    <h3>
    用户注册: 发送 POST 请求到 /api/register<br/>
    用户登录: 发送 POST 请求到 /api/register<br/>
    后续请求头添加:Authorization: Bearer <token><br/>
    用户退出登录: 发送 GET 请求到 /api/logout<br/>
    获取所有书签：发送 GET 请求到 /api/bookmarks。<br/>
    获取特定书签：发送 GET 请求到 /api/bookmarks/:id，其中 :id 是书签的索引。<br/>
    添加新书签：发送 POST 请求到 /api/bookmarks，并在请求体中包含新书签的数据。<br/>
    更新书签：发送 PUT 请求到 /api/bookmarks/:id，并在请求体中包含更新后的书签数据。<br/>
    删除书签：发送 DELETE 请求到 /api/bookmarks/:id，其中 :id 是要删除的书签的索引。<br/>
    上次图片：发送 POST 请求到 /api/upload-icon，并在请求体中包含图片文件。<br/>
    图片实例：
    <textarea style="width: 300px; height: 150px; " >
    <form action="/api/upload-icon" method="POST" enctype="multipart/form-data">
        <input type="file" name="icon">
        <input type="submit" value="Upload">
    <input>
    </textarea>
    </h3>
    `);
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器正在运行，端口 ${port}`);
});