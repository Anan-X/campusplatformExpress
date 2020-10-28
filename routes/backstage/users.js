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
router.get('/addscore', controUser.addScore)
// 删除课程接口
router.get('/movescore', controUser.moveScore)
// 获取课表
router.get('/course', controUser.apiGetCourse)
// 获取科目 任课老师 上课地点
router.get('/sta', controUser.apiGetSTA)
// 添加课表
router.post('/addcourse', controUser.apiAddCourse)
// 查询班级上的有哪些课程
router.get('/usedsubject', controUser.apiUsedSubject)
// 修改课表
router.post('/editcourse', controUser.apiEditCourse)
// 删除课程
router.get('/deletecourse', controUser.apiDeleteCourse)
// 获取老师信息
router.get('/teacher', controUser.apiGetTeacher)
// 获取老师信息
router.post('/teacheredit', controUser.apiEditTeacher)
// 添加老师
router.post('/teacheradd', controUser.apiAddTeacher)
// 删除老师
router.post('/teacher_delete', controUser.apiDeleteTeacher)
// 查询老师信息  根据老师工号查找
router.get('/teacheridfind', controUser.apiTeacherIdFind)
// 查询老师信息  根据老师姓名查找
router.get('/teachernamefind', controUser.apiTeacherNameFind)

// 查询学生信息  全部
router.get('/student', controUser.apiGetStudent)
// 修改学生信息  
router.post('/studentedit', controUser.apiEditStudent)
// 添加学生  
router.post('/studentadd', controUser.apiAddStudent)
// 删除学生  
router.get('/studentdelete', controUser.apiDeleteStudent)
// 查询学生信息  根据学生id查找
router.get('/studentidfind', controUser.apiStudentIdFind)
// 查询学生信息  根据学生姓名查找
router.get('/studentnamefind', controUser.apiStudentNameFind)
// 查询学生信息  根据学生班级查找
router.get('/studentclassfind', controUser.apiStudentClassFind)

// 查询用户信息  全部
router.get('/user', controUser.apiGetUser)
// 查询用户信息  根据用户id查找
router.get('/user_id_find', controUser.apiGetUserIdFind)
// 查询用户信息  根据用户name查找
router.get('/user_name_find', controUser.apiGetUserNameFind)
// 用户信息修改
router.post('/useredit', controUser.apiEditUser)
// 用户状态修改
router.post('/user_admin', controUser.apiAdminUser)
// 删除用户
router.post('/user_delete', controUser.apiDeleteUser)

module.exports = router;
