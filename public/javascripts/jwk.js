const jwt = require('jsonwebtoken')
const fs = require('fs')
const { resolve } = require('path')

// 密钥
const secret = 'zhangnan0122'

// 封装发送token
exports.sendToken = function (student_id) {
  // Token 数据
  const payload = {
    users: true,
    student_id
  }

  return new Promise((resolve, reject) => {
    const token = jwt.sign(payload, secret, { expiresIn: '1day' })
    resolve(token)
  })
}

// 封装验证token
exports.verifyToken = function (token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (error, decoded) => {
      if (error) {
        // console.log(error.message)
        reject(error)
        return
      }
      // console.log(decoded)
      resolve(decoded)
    })
  })
}


// // 密钥
// const secret = 'zhangnan0122'

// // 签发 Token
// const token = jwt.sign(payload, secret, { expiresIn: '1day' })

// // 输出签发的 Token
// console.log(token)

// jwt.verify(token, secret, (error, decoded) => {
//   if (error) {
//     console.log(error.message)
//     return
//   }
//   console.log(decoded)
// })


// 公钥秘钥  签发验证

// const privateKey = fs.readFileSync('../../config/private.key')

// // 签发 Token
// const tokenRS256 = jwt.sign(payload, privateKey, { algorithm: 'RS256' })

// // 输出签发的 Token
// console.log('RS256 算法：', tokenRS256)


// // 获取验证 JWT 时需要用的公钥
// const publicKey = fs.readFileSync('../../config/public.key')

// // 验证 Token
// jwt.verify(tokenRS256, publicKey, (error, decoded) => {
//   if (error) {
//     console.log(error.message)
//     return
//   }
//   console.log(decoded)
// })