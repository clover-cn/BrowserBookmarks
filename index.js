const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = 3000;



// 连接到 MongoDB
mongoose.connect(`mongodb://jiyiy.com:27017/bookmark`, {
    useNewUrlParser: true,  // 使用新的 URL 解析器，不建议使用旧的
    useUnifiedTopology: true,  // 使用新的服务器发现和监视引擎
    user: 'bookmark',
    pass: 'Aa1217412411',
});

const db = mongoose.connection;

// 定义数据模型
const bookmarkSchema = new mongoose.Schema({
  name: String,
  url: String,
  icon: String
});

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

app.use(express.json());

// 创建书签
app.post('/api/bookmarks', async (req, res) => {
  const { name, url, icon } = req.body;
  const newBookmark = new Bookmark({ name, url, icon });
  try {
    await newBookmark.save();
    res.status(201).json({ message: '书签已创建', bookmark: newBookmark });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取所有书签
app.get('/api/bookmarks', async (req, res) => {
  try {
    const bookmarks = await Bookmark.find();
    res.json(bookmarks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
  console.log('接收的请求体',req.body);
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

// 404
app.get('*', (req, res) => {
    res.status(404).send(`
    <h1>404</h1>
    <h3>
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