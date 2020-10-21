var express = require('express');
var router = express.Router();
const controUser = require('../../controllers/backstage/controUser')

// 密码登陆接口
router.post('/passLogin',controUser.passLogin)
// 手机登陆接口
router.post('/phoneLogin',controUser.phoneLogin)
// 发送手机验证码接口
router.get('/sendPhoneCode', controUser.sendPhoneCode)
// 获取班级成员接口
router.get('/getClassTeam', controUser.getClassTeam)
// 获取学生详情信息接口
router.get('/getStudentInfo', controUser.getStudentInfo)
// 获取学期接口
router.get('/semester', controUser.getSemester)
// 修改学生详情信息接口
router.post('/StudentInfoEdit', controUser.StudentInfoEdit)
//  获取班级学生成绩（根据学期查找）接口
router.get('/getScore', controUser.getScore)
// 获取某个学生的成绩（根据学号查找）接口
router.get('/getScoreStudent', controUser.getScoreStudent)
// 修改某个学生的成绩接口
router.post('/scoreStudentEdit', controUser.scoreStudentEdit)
// 添加课程接口
router.get('/addCourse', controUser.addCourse)
// 删除课程接口
router.get('/moveCourse', controUser.moveCourse)
// 获取课表
router.get('/course', controUser.apiGetCourse)
// 获取科目 任课老师 上课地点
router.get('/sta', controUser.apiGetSTA)
// 添加课表
router.post('/addcourse', controUser.apiAddCourse)
// 添加课表
router.post('/editcourse', controUser.apiEditCourse)
// 删除课程
router.get('/deletecourse', controUser.apiDeleteCourse)

module.exports = router;
