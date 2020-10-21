var express = require('express');
var router = express.Router();
const controUser = require('../controllers/controUser')


// 密码登陆接口
router.post('/login', controUser.login); 
// 手机登陆接口
router.post('/phoneLogin', controUser.phoneLogin); 
// 发送手机验证码接口
router.get('/sendPhoneCode', controUser.sendPhoneCode)
// 用户信息修改接口
router.post('/userInfoEdit', controUser.userInfoEdit)
// 注册页面发送短信验证接口
router.get('/sendPhoneCodeRegister', controUser.sendPhoneCodeRegister)
// 获取用户名是否已被注册
router.get('/isUserName', controUser.isUserName)
// 获取手机号是否已被注册
router.get('/isPhone', controUser.apiIsPhone)
// 注册接口
router.post('/resiger', controUser.resiger)
// 获取用户基本信息
router.get('/apiGetUserInfo', controUser.apiGetUserInfo)
// 获取用户学生表基本信息
router.get('/apiGetStudentInfo', controUser.apiGetStudentInfo)
// 获取学生成绩
router.get('/getScore', controUser.apiGetScore)
// 获取学生课表
router.get('/apicourse', controUser.apiGetCourse)
module.exports = router;
