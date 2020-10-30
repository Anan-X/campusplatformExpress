// 控制器方法

const Core = require('@alicloud/pop-core') // 导入短信验证
const fs = require('fs')

const jwk = require('../public/javascripts/jwk') // 导入封装token
const dbConfig = require('../utils/dbconfig')   // 导入封装mysql
const aliConfig = require('../utils/aliconfig') // 导入短信验证配置
const config = require('../pulse/confing')

// 配置
let client = new Core(aliConfig.alicloud)
let requestOption = {
  method: 'POST'
};
let validatePhoneCode = []
// 随机验证码生成
function rand(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// 发送验证码方法
function sendCode (phone, res) {
  let code = rand(1000, 9000);
  let params = {
    "RegionId": "cn-hangzhou",
    "PhoneNumbers": phone,
    "SignName": "莲美App",
    "TemplateCode": "SMS_192195277",
    "TemplateParam": JSON.stringify({
      'code': code
    })
  }
  client.request('SendSms', params, requestOption).then((result) => {
    if (result.Code == 'OK') {
      res.send({
        'code': 200,
        'msg': '发送成功'
      });
      validatePhoneCode.push({
        'phone': phone,
        'code': code
      });
      console.log(code);
    } else {
      res.send({
        'code': 400,
        'msg': '发送失败'
      });
    }
  }, (ex) => {
    console.log(ex);
  })
}

// 判断手机号是否已注册
let findPhone = async (phone) =>{
  let sql = `select * from users where phone=?`;
  let sqlArr = [phone];
  let res = await dbCofing.SySqlConnect(sql, sqlArr)
  return res.length
}
// 判断手机号和验证吗是否匹配
let phoneCodeif = (phone,code) =>{9
  for(let item of validatePhoneCode){
    // console.log(item.phone)
    // console.log(item.code)
    if(item.phone==phone && item.code==code) return true
  }
  return false
}
// 判断是否有该学号的同学  
const isStudent = async function (studentID) {
  let sql = `select * from students where student_id=?`
  let sqlArr = [studentID]
  let res = await dbConfig.SySqlConnect(sql, sqlArr)
  if(res.length){
    return true
  }
  return false
}
// 判读该学号是否已经注册
const isStudentID = async function (studentID) {
  let sql = `select * from users where user_id=?`
  let sqlArr = [studentID]
  let res = await dbConfig.SySqlConnect(sql, sqlArr)
  if(!res.length){
    return true
  }
  return false
}

// 注册页面手机发送验证码接口
let sendPhoneCodeRegister = async (req, res) =>{
  let phone = req.query.phone;
  if(await findPhone(phone)){    // 先判断手机是否已经注册
    res.send({
      'msg':"该手机号已经被注册过了"
    })
  }else{
    sendCode()
  }
}
// 发送手机验证码接口
const sendPhoneCode = (req, res) => {
  let phone = req.query.phone
  sendCode(phone, res)
}
// 密码登陆接口
const login = (req, res) => {
  // console.log(req.body)
  let student_id = req.body.student_id
  let password = req.body.password
  let sql = `select * from users where user_id =? and password =? and role = 'student'`
  let sqlArr = [student_id, password]
  let callBack = (err, data) => {
    if(err){
      throw '连接出错'
      }else{
        if(!data.length){
          res.send({
            code: 400,
            msg: '账号密码错误'
          })
        } else {
           // 要把数据转换成JSON格式发到页面
          let reslutStr = JSON.stringify(data); 
          let reslutObj = JSON.parse(reslutStr);
          let student_id = reslutObj[0].user_id;

          if(reslutObj[0].admin == 'true'){
            // 签发token
            jwk.sendToken(student_id).then(token => {
              res.send({
                code: 200,
                msg: '登录成功',
                token,
                info : reslutObj[0]
              })
            }).catch(err => {
              res.send({
                code: 400,
                msg: err.message
              })
            })
          }else{
            res.send({
              code: 400,
              msg: "你的账户被管理员停用，详情请联系管理员"
            })
          }
          
        }
       
      }
   }
   dbConfig.sqlConnect(sql, sqlArr, callBack)
}
// 手机号登陆接口
const phoneLogin = (req, res) => {
  let {phone,code} = req.body
  console.log(phoneCodeif(phone, code))
  if(phoneCodeif(phone,code)){
    let sql = `select * from users where phone=? and role = 'student'`
    let sqlArr =[phone]
    let callBack = (err, data) => {
      if(err){
        console.log('连接出错')
        }else{
          // 要把数据转换成JSON格式发到页面
          let reslutStr = JSON.stringify(data); 
          let reslutObj = JSON.parse(reslutStr);
          let student_id = reslutObj[0].user_id
          //  判断账号是否被禁用
          if(reslutObj[0].admin == 'true'){
            // 签发token
            jwk.sendToken(student_id).then(token => {
              res.send({
                code: 200,
                msg: '登录成功',
                token,
                info : reslutObj[0]
              })
            }).catch(err => {
              res.send({
                code: 400,
                msg: err.message
              })
            })
          }else{
            res.send({
              code: 400,
              msg: "你的账户被管理员停用，详情请联系管理员"
            })
          }
        }
     }
     dbConfig.sqlConnect(sql, sqlArr, callBack)
  }else{
    res.send('手机号和验证码不匹配')
  }
}
// 用户信息修改接口
const userInfoEdit = (req, res) => {
  console.log(req.body)
  const {username, email, student_id,sex, brithday, text } = req.body
  let avatar = ''
  if(req.body.avatar[0].url === undefined ){
    let imgData = req.body.avatar[0].content.replace(/^data:image\/\w+;base64,/, "") //分解base64代码
    let imgName = student_id+'avatar'
    var dataBuffer = Buffer.from(imgData, 'base64'); 
    let imgPath = './public/images/avatar/' + imgName + '.png'
      fs.writeFile(imgPath, dataBuffer, function (err) {
      //用fs.write写入base64数据生成图片 此处需要手动创建img文件夹，否则会报错
      //预想把路径同时写入数据库，但表未设计好，待更新验证
          if (err) {
              // res.send(err)
              console.log("头像存储"+ err)
          } else {
            // 记录头像地址
            console.log("头像存储success")
          }
      })
      // console.log(avatar)
      avatar ='http://' + config.httpConfig.pipe + ':' + config.httpConfig.port +'/images/avatar/' + imgName + '.png'
  }else {
    avatar = req.body.avatar[0].url
  }
  // users表修改
  let sql =  `update users set name=?, email=?, avatar=?, sex=?, brithday=?, text=? where user_id=?`
  let sqlArr = [username, email, avatar, sex, brithday, text, student_id]
  dbConfig.SySqlConnect(sql, sqlArr)
  .then(data => {
    if(data.affectedRows === 1){
      res.send({
        code: 200,
        msg: '修改成功'
      })
    } else {
      res.send({
        code: 400,
        msg: '修改失败'
      })
    }
  })
  .catch(err => console.log(err))
}
// 判断用户名是否已被注册接口
const isUserName = (req, res) => {
  let name = req.query.name
  let sql = `select * from users where name=?`
  let sqlArr = [name]
  dbConfig.SySqlConnect(sql, sqlArr).then(data => {
    if (!data.length) {
      res.send({
        code: 200,
        msg: '用户名可用'
      })
    } else {
      res.send({
        code: 400,
        msg: '用户名已被注册'
      })
    }
  })
}
// 判断手机号是否被注册
const apiIsPhone = (req, res) => {
  let phone = req.query.phone
  let sql = `select * from users where phone=?`
  let sqlArr = [phone]
  dbConfig.SySqlConnect(sql, sqlArr).then(data => {
    if (!data.length) {
      res.send({
        code: 200,
        msg: '手机号可用'
      })
    } else {
      res.send({
        code: 400,
        msg: '手机号已被注册'
      })
    }
  })
}
// 注册接口
const resiger = async (req, res) => {
  let {username, password, studentID, phone, code} = req.body
    // 判断数据库中是否有此学号
  if (await isStudent(studentID)){
     //判断该学号是否被注册
    if (await isStudentID(studentID)) {
      if(phoneCodeif(phone, code)){
        let sql =  `insert into users (name, password, user_id, phone, role, admin) values (?,?,?,?,'student','true')`
        let sqlArr = [username, password, studentID, phone]
        dbConfig.SySqlConnect(sql, sqlArr).then(result => {
          if (result.affectedRows === 1) {
            res.send({
              code: 200,
              msg: '注册成功'
            })
          }
        })
      } else {
        res.send({
          code: 400,
          msg: '验证码错误'
        })
      }
    } else {
      res.send({
        code: 400,
        msg: '此学号已被注册'
      })
    }
  } else {
    res.send({
      code: 400,
      msg: '没有此学号'
    })
  }
}
// 获取用户user信息接口    （用户页面刷新，保持数据同步）
const apiGetUserInfo = (req, res) => {
  let token = req.headers.accesstoken
  // token验证
  jwk.verifyToken(token).then(decaded =>{
    console.log(decaded.student_id)
    let student_id = decaded.student_id
    console.log(student_id)
    let sql = `select user_id, phone, role, email, avatar, brithday, sex, address, text, name from users where user_id=?`
    let sqlArr = [student_id]
    let callBack = (err, data) => {
      if(err){
        console.log('连接出错', err)
        }else{
          // 要把数据转换成JSON格式发到页面
          let reslutStr = JSON.stringify(data); 
          let reslutObj = JSON.parse(reslutStr);
          // 签发token
          jwk.sendToken(student_id).then(token => {
            res.send({
              code: 200,
              msg: '刷新成功',
              token,
              info : reslutObj[0]
            })
          }).catch(err => {
            res.send({
              code: 400,
              msg: err.message
            })
          })
        }
    }
    dbConfig.sqlConnect(sql, sqlArr, callBack)
  }).catch(error => console.log(error.message))
}
// 获取用户学生表信息接口 （根据学号查询）
const apiGetStudentInfo = (req, res) => {
  let token = req.headers.accesstoken
  // console.log(token)
  jwk.verifyToken(token).then(decaded =>{
    let student_id = decaded.student_id
    let sql = `
      select schoolname, students.student_id, name, classroomname, gradename, sex, address, phone from students 
      LEFT JOIN classroom on students.classroom_id = classroom.classroom_id
      LEFT JOIN schools on schools.school_id = classroom.school_id 
      LEFT JOIN grade on students.grade_id = grade.grade_id
      where student_id=?;
    `
    let sqlArr = [student_id]
    dbConfig.SySqlConnect(sql, sqlArr)
    .then(result => {
      res.send({
        code:200,
        studentInfo: result[0]
      })
    })
  }).catch(error => console.log(error.message))
}
// 获取学期
const apiGetSemester = (req, res) => {
  let sql =  `select semester_id as value, semestername as text from semester`
  dbConfig.SySqlConnect(sql)
  .then(data => {
    console.log(data)
    res.send({
      code: 200,
      data
    })
  }).catch(err => console.log(err))
}
// 获取学生成绩
const apiGetScore = (req, res) => {
  let {student_id, semester_id} = req.query
  let sql = `
    select classroomname '班级',students.name '姓名',teacher.name '任课老师', students.student_id '学号', subjectname '课程',semestername '学期', score '分数' from classroom 
    left outer join students on classroom.classroom_id=students.classroom_id 
    left outer join subject on classroom.classroom_id=students.classroom_id
    left outer join teacher on teacher.teacher_id = subject.teacher_id
    left outer join score on subject.subject_id=score.subject_id and students.student_id=score.student_id
    left outer join semester on score.semester_id = semester.semester_id
    where score.student_id = ? and score.semester_id = ? 
  `
  let sqlArr = [student_id, semester_id]
  dbConfig.SySqlConnect(sql, sqlArr)
  .then(result => {
    res.send({
      code: 200,
      score: result
    })
  })
}
// 获取学生课表
const apiGetCourse = (req, res) => {
  let {student_id, weekth, day} = req.query
  let sql = `
  SELECT subjectname, weekth, day, time,course.time_id, course.classroom_id, addressname, teacher.name FROM  course 
  LEFT JOIN subject on course.subject_id = subject.subject_id
  left join teacher on course.teacher_id = teacher.teacher_id
  left join courseTime on course.time_id = courseTime.time_id
  left join classaddress on classaddress.classaddress_id = course.classaddress_id
  where course.classroom_id = (SELECT classroom_id FROM students WHERE student_id = ?) AND course.weekth = ? and course.day=?
  ORDER BY course.time_id
  `
  let sqlArr = [student_id,weekth,day]
  dbConfig.SySqlConnect(sql, sqlArr)
  .then(data => {
    res.send({
      code: 200,
      data
    })
  })
}


module.exports = {
  login,
  userInfoEdit,
  phoneLogin,
  sendPhoneCodeRegister,
  sendPhoneCode,
  isUserName,
  resiger,
  apiIsPhone,
  apiGetUserInfo,
  apiGetStudentInfo,
  apiGetSemester,
  apiGetScore,
  apiGetCourse
}