
const jwt = require('jsonwebtoken');
// 中间件验证用户是否已登录
// module.exports = function requireLogin(req, res, next) {
//   if (req.session.user) {
//     next(); // 继续处理下一个路由
//   } else {
//     res.status(401).json({ message: '身份验证失败' });
//   }
// }

// 中间件函数，用于验证JWT令牌
// function requireLogin(req, res, next) {
//   const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

//   if (token) {
//     jwt.verify(token, 'browser-bookmarks_secret_key', (err, decoded) => {
//       if (err) {
//         res.status(401).json({ message: '令牌无效' });
//       } else {
//         // 令牌有效，可以继续请求
//         next();
//       }
//     });
//   } else {
//     res.status(401).json({ message: '未提供令牌' });
//   }
// }

// module.exports = requireLogin;


// 中间件函数，用于验证JWT令牌
// const tokenBlacklist = [];

function requireLogin(req, res, next) {
  console.log(global.tokenBlacklist);
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (token) {
    // 检查JWT令牌是否在黑名单中
    if (global.tokenBlacklist.includes(token)) {
      res.status(401).json({ message: '令牌无效' });
    } else {
      // 验证JWT令牌的有效性
      jwt.verify(token, 'browser-bookmarks_secret_key', (err, decoded) => {
        if (err) {
          res.status(401).json({ message: '令牌无效' });
        } else {
          // 令牌有效，可以继续请求
          next();
        }
      });
    }
  } else {
    res.status(401).json({ message: '未提供令牌' });
  }
}

module.exports = requireLogin;