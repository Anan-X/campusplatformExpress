// 控制器方法

const Core = require('@alicloud/pop-core') // 导入短信验证
const fs = require('fs')

const jwk = require('../../public/javascripts/jwk') // 导入封装token
const dbConfig = require('../../utils/dbconfig')   // 导入封装mysql
const aliConfig = require('../../utils/aliconfig') // 导入短信验证配置
const config = require('../../pulse/confing')
const dbconfig = require('../../utils/dbconfig')

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
// 判断手机号和验证吗是否匹配
let phoneCodeif = (phone,code) =>{
  for(let item of validatePhoneCode){
    // console.log(item.phone)
    // console.log(item.code)
    if(item.phone==phone && item.code==code) return true
  }
  return false
}
// 模拟验证码发送接口
const sendPhoneCode = (req, res) => {
  let phone = req.query.phone;
  let code = rand(1000, 9999);
  validatePhoneCode.push({
    'phone': phone,
    'code': code
  })
  console.log(validatePhoneCode);
  res.send({
    'code': 200,
    'msg': '发送成功'
  })
  console.log(code);
}
// 查询详情信息方法（根据学号查找）
const getInfo = async student_id => {
  let sql = `select * from studentInfo where student_id =?`
  let sqlArr = [student_id]
  return await dbConfig.SySqlConnect(sql, sqlArr)
}

// 发送手机验证码接口
// const sendPhoneCode = (req, res) => {
//   let phone = req.query.phone
//   sendCode(phone, res)
// }
// 密码登陆接口
const passLogin = (req, res) => {
  console.log(req.body)
  let studentID = req.body.studentID
  let password = req.body.password
  let sql = `select * from users where user_id =? and password =?`
  let sqlArr = [studentID, password]
  let callBack = async(err, data) => {
    if(err){
      console.log('连接出错')
      }else{
        console.log(data.length)
        if(data.length){
          // 要把数据转换成JSON格式发到页面
          let reslutStr = JSON.stringify(data); 
          let reslutObj = JSON.parse(reslutStr);
          // 查询自己的信息
          let myinfo = await getInfo(studentID)
          // console.log(myinfo)
          // 签发token
          jwk.sendToken(studentID).then(token => {
            res.send({
              code: 200,
              msg: '登录成功',
              token,
              info : reslutObj[0],
              myInfo: myinfo[0]
            })
          }).catch(err => {
            res.send({
              code: 400,
              msg: err.message
            })
          })
        } else {
          res.send({
            code: 400,
            msg: "密码错误"
          })
        }
        
      }
   }
   dbConfig.sqlConnect(sql, sqlArr, callBack)
}
// 手机号登陆接口
const phoneLogin = (req, res) => {
  let {phone,code} = req.body
  if(phoneCodeif(phone,code)){
    let sql = `select * from users where phone=?`
    let sqlArr =[phone]
    let callBack = (err, data) => {
      if(err){
        console.log('连接出错')
        }else{
          // 要把数据转换成JSON格式发到页面
          let reslutStr = JSON.stringify(data); 
          let reslutObj = JSON.parse(reslutStr);
          let student_id = reslutObj[0].user_id
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
        }
     }
     dbConfig.sqlConnect(sql, sqlArr, callBack)
  }else{
    res.send('手机号和验证码不匹配')
  }
}
// 获取班级成员信息接口
const getClassTeam = async (req, res) => {
  // token 
  let token = req.headers.accesstoken
  // token验证
  jwk.verifyToken(token).then(async(decaded) =>{
    let teacher_id = decaded.student_id
    console.log(teacher_id)
    let sql = `
      SELECT student_id, sex, students.name, classroomname from students 
      left outer join classroom on students.classroom_id = classroom.classroom_id
      WHERE students.classroom_id = (SELECT classroom_id from teacher WHERE teacher_id = ?)`
    let sqlArr = [teacher_id]
    const result = await dbConfig.SySqlConnect(sql, sqlArr)
    if(result){
      res.send({
        code: 200,
        msg:'查询成功',
        info: result
      })
    }else{
      res.send({
        code: 400,
        msg: '查询失败，请稍后再试'
      })
    }
  }).catch(error => console.log(error.message))
  
}
// 获取学生详情信息接口
const getStudentInfo = async (req, res) => {
  console.log(req.query.student_id)
  let student_id = req.query.student_id
  // console.log(studentInfo)
  getInfo(student_id).then(data => {
    res.send({
      code:200,
      studentInfo: data
    })
  })
}
// 修改学生详情信息接口
const StudentInfoEdit = (req, res) => {
  console.log(req.body)
  let {student_id, name, sex, card_id, school, college, classroom, adress, phone, star_year} = req.body
  let sql =  `update studentInfo set name=?, sex=?, card_id=?, school=?, college=?, classroom=?, adress=?, phone=?, star_year=? where student_id=?`
  let sqlArr = [name, sex, card_id, school, college, classroom, adress, phone, star_year, student_id]
  dbConfig.SySqlConnect(sql,sqlArr)
  .then(result =>{
    console.log(result)
    if(result.affectedRows ===1){
      res.send({
        code: 200,
        msg: '修改信息成功'
      })
    } else {
      res.send({
        code: 400,
        msg: '修改信息失败'
      })
    }
  })
}
// 获取学期
const getSemester = (req, res) => {
  let sql =  `select semester_id as value, semestername as label from semester`
  dbconfig.SySqlConnect(sql)
  .then(data => {
    res.send({
      code: 200,
      data
    })
  })
}
//  获取班级学生成绩（根据学期查找）接口
const getScore = (req, res) => {
  let {semester_id, user_id} = req.query
  let sql = `
    select classroomname '班级', students.student_id '学号',students.name '姓名', group_concat(subjectname) '课程',group_concat(score) '分数', semestername '学期' from classroom 
    right outer join students on classroom.classroom_id=students.classroom_id 
    right outer join subject on classroom.classroom_id=students.classroom_id
    right outer join score on subject.subject_id=score.subject_id and students.student_id=score.student_id
    right outer join semester on semester.semester_id = score.semester_id
    where classroom.classroom_id=(SELECT classroom_id from teacher WHERE teacher_id = ?) and score.semester_id = ?
    GROUP BY classroom.classroomname, students.name, semester.semestername, students.student_id
    `
  let sqlArr = [user_id,semester_id]
  dbConfig.SySqlConnect(sql,sqlArr).then(result => {
    res.send({
      code: 200,
      score: result
    })
  })
}
// 获取某个学生的成绩（根据学号查找）接口
const getScoreStudent = (req, res) => {
  let {semester_id, student_id} = req.query
  let sql = `
    select classroomname '班级',students.name '姓名', subjectname ,semestername '学期', score, score.subject_id from classroom 
    left outer join students on classroom.classroom_id=students.classroom_id 
    left outer join subject on classroom.classroom_id=students.classroom_id
    left outer join score on subject.subject_id=score.subject_id and students.student_id=score.student_id
    left outer join semester on semester.semester_id=score.semester_id
    where students.student_id= ? and score.semester_id = ?
  `
  let sqlArr = [student_id,semester_id]
  dbConfig.SySqlConnect(sql, sqlArr).then(result => {
    res.send({
      code: 200,
      score: result
    })
  })
}
// 修改某个学生的成绩接口
const scoreStudentEdit = (req, res) =>{
  let  student_id = req.body.student_id
  console.log('lala', req.body)
  // 初始化变量
  let flag = true
  req.body.data.forEach((item)=> {
    let sql = `update score set score = ? where student_id = ? and subject_id = (select subject_id from subject where subjectname = ?)`
    let sqlArr = [item.score, student_id, item.subjectname]
    dbConfig.SySqlConnect(sql, sqlArr)
    .then(result=>{
      if(result.affectedRows!=1){
        flag = false
      }
    })
  })
  // 判断修改是否全部完成
  if(flag){
    res.send({
      code: 200,
      msg: '修改成功'
    })
  }else{
    res.send({
      code: 400,
      msg: '修改失败'
    })
  }
}
// 添加课程接口
const addCourse = (req, res) => {
  let {course, semester} = req.query
  console.log(course)
  console.log(semester)
  let sql = "alter table `score-"+ semester +"` add "+course+" varchar(30)"
  console.log(sql)
  dbConfig.SySqlConnect(sql)
  .then(result => {
    if(result){
      res.send({
        code: 200,
        msg: '添加成功'
      })
    }else{
      res.send({
        code: 400,
        msg: '添加失败'
      })
    }
  })
}
// 删除课程接口
const moveCourse = (req, res) => {
  let {course, semester} =req.query
  // console.log(course,semester)
  let sql = "alter table" + "`" + semester + "` " + "drop column " + "`" + course + "` "
  dbConfig.SySqlConnect(sql)
  .then(result => {
    if (result) {
      
      res.send({
        code: 200,
        msg: '课程《' + course + '》删除成功'
      })
    }else {
      res.send({
        code: 400,
        msg: '课程《' + course + '》删除失败'
      })
    }
  })
}

// 获取班级课表  
const apiGetCourse = (req, res) => {
  let {teacher_id, weekth, day} = req.query
  let sql = `
  SELECT  course_id, subjectname, subject.subject_id,teacher.teacher_id,classaddress.classaddress_id, weekth, day, time,course.time_id, course.classroom_id,classroomname, addressname, teacher.name FROM  course 
  LEFT JOIN subject on course.subject_id = subject.subject_id
  left join teacher on course.teacher_id = teacher.teacher_id
  left join courseTime on course.time_id = courseTime.time_id
  left join classaddress on classaddress.classaddress_id = course.classaddress_id
  left join classroom on classroom.classroom_id = course.classroom_id
  where course.classroom_id = (SELECT classroom_id FROM teacher WHERE teacher_id = ?) AND course.weekth = ? AND course.day = ?
  ORDER BY course.time_id
  `
  let sqlArr = [teacher_id,weekth, day]
  dbConfig.SySqlConnect(sql, sqlArr)
  .then(data => {
    res.send({
      code: 200,
      data
    })
  })
}
// 获取科目 任课老师 上课地点
const apiGetSTA =async (req, res) => {
  // 获取科目
  let sqls = `select subject_id, subjectname from subject`
  // 获取任课老师
  let sqlt = `select teacher_id, name from teacher`
  // 获取上课地点
  let sqla = `select classaddress_id, addressname from classaddress`
   dbconfig.SySqlConnect(sqls).then(datas=>{
     dbconfig.SySqlConnect(sqlt).then(datat=> {
      dbconfig.SySqlConnect(sqla).then(dataa=> {
        res.send({
          code: 200,
          subjects:datas,
          teachers: datat,
          address:dataa
        })
      })
    })
  })

}
// 添加课表
const apiAddCourse = (req, res) => {
  let {day, weekth, time_id, subject_id, teacher_id, classaddress_id}  = req.body.data
  console.log(day, weekth, time_id, subject_id, teacher_id, classaddress_id)
  console.log(req.body.data)
  let teacher_id_me = req.body.teacher_id
  let sql = `insert into course(subject_id,weekth,day,time_id, classroom_id, teacher_id,classaddress_id) values(?,?,?,?,(select classroom_id from teacher where teacher_id =?),?,?)`
  let sqlArr = [subject_id,weekth,day,time_id,teacher_id_me,teacher_id,classaddress_id]
  dbConfig.SySqlConnect(sql, sqlArr)
  .then(data => {
    console.log(data)
    if(data.affectedRows ===1){
      res.send({
        code:200,
        msg: '添加成功'
      })
    }else {
      res.send({
        code:400,
        msg: '添加失败'
      })
    }
  })
}
// 修改课表
const apiEditCourse =(req, res) => {
  let {course_id,subject_id,teacher_id,classaddress_id,time_id} = req.body
  console.log(req.body)
  console.log(course_id,subject_id,teacher_id,classaddress_id,time_id)
  let sql ="UPDATE `course` SET `subject_id` = ?, `time_id` = ?, `teacher_id` = ?, `classaddress_id` = ? WHERE `course_id` = ?"
  let sqlArr = [subject_id,time_id,teacher_id,classaddress_id,course_id]
  dbConfig.SySqlConnect(sql, sqlArr)
  .then(data => {
    if(data.affectedRows===1){
      res.send({
        code: 200,
        msg: '修改成功'
      })
    }else{
      res.send({
        code: 400,
        msg: '修改失败'
      })
    }
  })
}
// 删除课程
const apiDeleteCourse =(req, res) => {
  let course_id = req.query.course_id
  let sql =`DELETE FROM course where course_id=?`
  let sqlArr = [course_id]
  dbConfig.SySqlConnect(sql,sqlArr)
  .then(data => {
    if(data.affectedRows===1){
      res.send({
        code: 200,
        msg: '删除成功'
      })
    }else{
      res.send({
        code: 400,
        msg: '删除失败'
      })
    }
  })
}

module.exports = {
  passLogin,
  phoneLogin,
  sendPhoneCode,
  getClassTeam,
  getStudentInfo,
  StudentInfoEdit,
  getSemester,
  getScore,
  getScoreStudent,
  scoreStudentEdit,
  addCourse,
  moveCourse,
  apiGetCourse,
  apiGetSTA,
  apiAddCourse,
  apiEditCourse,
  apiDeleteCourse
}
