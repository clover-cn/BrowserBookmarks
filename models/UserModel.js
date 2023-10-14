const mongoose = require('mongoose');
// 定义文档的结构
let UserSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
  },
  pass: {
    type: String,
    required: true
  },
  reg_time: {
    type: Date,
    default: new Date()
  }
});

// 创建数据模型
let UserModel = mongoose.model('users', UserSchema);

//暴露
module.exports = UserModel;