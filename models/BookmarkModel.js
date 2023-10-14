const mongoose = require('mongoose');
// 定义文档的结构
let UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  }
});

// 创建数据模型
let BookmarkModel = mongoose.model('bookmarks', UserSchema);

//暴露
module.exports = BookmarkModel;