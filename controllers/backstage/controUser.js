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
// // 模拟验证码发送接口
// const sendPhoneCode = (req, res) => {
//   let phone = req.query.phone;
//   let code = rand(1000, 9999);
//   validatePhoneCode.push({
//     'phone': phone,
//     'code': code
//   })
//   console.log(validatePhoneCode);
//   res.send({
//     'code': 200,
//     'msg': '发送成功'
//   })
//   console.log(code);
// }
// 查询详情信息方法（根据学号查找）
const getInfo = async student_id => {
  let sql = `select * from studentInfo where student_id =?`
  let sqlArr = [student_id]
  return await dbConfig.SySqlConnect(sql, sqlArr)
}

// 发送手机验证码接口
const sendPhoneCode = (req, res) => {
  let phone = req.query.phone
  sendCode(phone, res)
}
// 密码登陆接口
const passLogin = (req, res) => {
  console.log(req.body)
  let studentID = req.body.studentID
  let password = req.body.password
  let sql = `select * from users where user_id =? and password =? and (role = 'teacher' or role = 'admin')`
  let sqlArr = [studentID, password]
  let callBack = async(err, data) => {
    if(err){
      console.log('连接出错')
      }else{
        if(data.length){
          // 要把数据转换成JSON格式发到页面
          let reslutStr = JSON.stringify(data); 
          let reslutObj = JSON.parse(reslutStr);
          // 查询自己的信息
          let myinfo = await getInfo(studentID)
          // console.log(myinfo)

          // 判断账号是否被仅用
          if(reslutObj[0].admin == 'true'){
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
              msg: "你的账户被管理员停用，详情请联系管理员"
            })
          }
          
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
    let sql = `select * from users where phone=? and (role = 'teacher' or role = 'admin')`
    let sqlArr =[phone]
    let callBack =async (err, data) => {
      if(err){
        console.log('连接出错')
        }else{
          if(data.length){
            // 要把数据转换成JSON格式发到页面
            let reslutStr = JSON.stringify(data); 
            let reslutObj = JSON.parse(reslutStr);
            let studentID = reslutObj[0].user_id
            // 查询自己的信息
            let myinfo = await getInfo(studentID)
            // console.log(myinfo)
            // 判断账号是否被仅用
            if(reslutObj[0].admin == 'true'){
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
                msg: "你的账户被管理员停用，详情请联系管理员"
              })
            }
          } else {
            res.send({
              code: 400,
              msg: "手机号错误"
            })
          }
        }
     }
     dbConfig.sqlConnect(sql, sqlArr, callBack)
  }else{
    res.send({
      code:400,
      msg:'手机号和验证码不匹配'
    })
  }
}

// 查询是否教师工号是否可用  注册时
const isTeacher = (req, res) => {
  let teacher_id = req.query.teacher_id
  // 判断此教师工号是否存在
  let sql = `select * from teacher where teacher_id =?`
  dbConfig.SySqlConnect(sql, teacher_id).then(result => {
    if(result.length>0) {
      // 判断此教师工号是否已注册
      let sql2 = `select * from users where user_id  =? and role = 'teacher'`
      dbConfig.SySqlConnect(sql2, teacher_id).then(result2 => {
        if(!result2.length>0) {
          res.send({
            code: 200,
            msg: '教师工号用可注册'
          })
        }else {
          res.send({
            code: 400,
            msg: '此工号已注册'
          })
        }
      })
    }else {
      res.send({
        code: 400,
        msg: '不存在此教师工号'
      })
    }
  })
}
// 判断手机号是否注册过了
const isPhone = (req, res) => {
  let phone = req.query.phone
  let sql = `select * from users where phone =?`
  dbConfig.SySqlConnect(sql, phone).then(result => {
    if(!result.length>0) {
      res.send({
        code: 200,
        msg: '手机号可注册'
      })
    } else {
      res.send({
        code: 400,
        msg: '手机号已注册'
      })
    }
  })
}
// 注册接口
const Register = (req, res) => {
  let {teacher_id, password, phone, code } = req.body
  console.log(req.body)
  console.log(phoneCodeif(phone, code))
  if(phoneCodeif(phone, code)) {
    let sql  =  `insert into users (user_id, password, phone, role, admin) values(?,?,?,'teacher', 'true')`
    let sqlArr = [teacher_id, password, phone]
    dbConfig.SySqlConnect(sql, sqlArr).then(result => {
      if(result.affectedRows === 1) {
        res.send({
          code: 200,
          msg: '注册成功'
        })
      } else{
        res.send({
          code: 400,
          msg: '注册失败，请稍后再试'
        })
      }
    })
  }  else {
    res.send({
      code: 400,
      msg: '验证码错误'
    })
  }

}
// 密码修改
const Password = (req, res) => {
  let {teacher_id, oldPassword, password} =req.body
  let sql = `select * from users where user_id = ? and password =?`
  let sqlArr  = [teacher_id, oldPassword]
  dbconfig.SySqlConnect(sql, sqlArr).then(reslut => {
    if(reslut.length>0) {
      let sql2 = `update users set password = ? where user_id =?`
      let sql2Arr = [password, teacher_id]
      dbconfig.SySqlConnect(sql2, sql2Arr).then(result2 => {
        if(result2.affectedRows ===1) {
          res.send({
            code: 200,
            msg: '密码修改成功'
          })
        }else {
          res.send({
            code: 400,
            msg: '密码修改失败，请稍后再试'
          })
        }
      })
    } else {
      res.send({
        code: 400,
        msg: '原密码错误'
      })
    }
  })
  console.log(req.body)
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
  let sql =  `select semestername as label,semester_id as value from semester`
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
// 查询班级有哪些课
const apiUsedSubject = (req, res)  => {
  let {teacher_id, semester_id} = req.query
  console.log()
  let sql = `
    SELECT distinct subjectname,score.subject_id from subject 
    left join score on score.subject_id = subject.subject_id
    left join students on students.student_id = score.student_id
    WHERE students.classroom_id = (select classroom_id from teacher where teacher_id = ?) and score.semester_id =?
    `
  let sqlArr =  [teacher_id,semester_id]
  dbConfig.SySqlConnect(sql, sqlArr)
  .then(data => {
    res.send({
      code: 200,
      data
    }
    )
  })
}
// 添加课程接口
const addScore = (req, res) => {
  let {subject_id, teacher_id, semester_id} = req.query
  console.log(subject_id, teacher_id, semester_id)
  let sql = `select student_id from students where classroom_id = (select classroom_id from teacher where teacher_id = ?)`
  dbConfig.SySqlConnect(sql, teacher_id)
  .then(data => {
    let flag =  true
    // console.log(data)
    data.forEach(item=> {
      console.log(item.student_id)
      let sql  = `insert into score(student_id, subject_id, semester_id) values(?,?,?)`
      let sqlArr = [item.student_id, subject_id, semester_id]
      dbConfig.SySqlConnect(sql,sqlArr)
      .then(data => {
        if(data.affectedRows!=1){
          flag = false
        }
      })
    })
    if(flag) {
      res.send({
        code: 200,
        msg: "添加成功"
      })
    }else {
      res.send({
        code: 200,
        msg: "添加失败"
      })
    }
  })
}
// 删除课程接口
const moveScore = (req, res) => {
  let {subject_id, semester_id, teacher_id} =req.query
  console.log(subject_id, semester_id, teacher_id)
  // console.log(course,semester)
  let sql = `select student_id from students where classroom_id = (select classroom_id from teacher where teacher_id = ?)`
  dbConfig.SySqlConnect(sql, teacher_id)
  .then(data => {
    let flag =  true
    // console.log(data)
    data.forEach(item=> {
      console.log(item.student_id)
      let sql = "DELETE FROM `bishe`.`score` WHERE subject_id=? and semester_id=? and student_id = ?"
      let sqlArr = [subject_id, semester_id, item.student_id]
      dbConfig.SySqlConnect(sql,sqlArr)
      .then(data => {
        if(data.affectedRows!=1){
          flag = false
        }
      })
    })
    if(flag) {
      res.send({
        code: 200,
        msg: "删除成功"
      })
    }else {
      res.send({
        code: 200,
        msg: "删除失败"
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
// 获取科目 任课老师 上课地点 班级 学院
const apiGetSTA =async (req, res) => {
  // 获取科目
  let sqls = `select subject_id, subjectname from subject`
  // 获取任课老师
  let sqlt = `select teacher_id, name from teacher`
  // 获取上课地点
  let sqla = `select classaddress_id, addressname from classaddress`
  // 获取 班级
  let sqlc = `select classroom_id, classroomname from classroom`
  // 获取 学院
  let sqlschool = `select school_id, schoolname from schools`
   dbconfig.SySqlConnect(sqls).then(datas=>{
     dbconfig.SySqlConnect(sqlt).then(datat=> {
      dbconfig.SySqlConnect(sqla).then(dataa=> {
        dbConfig.SySqlConnect(sqlc).then(datac=> {
          dbconfig.SySqlConnect(sqlschool).then(dataschool => {
            res.send({
              code: 200,
              subjects:datas,
              teachers: datat,
              address:dataa,
              classrooms: datac,
              schools: dataschool
            })
          })
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

//       管理员操作
// 获取老师信息
const apiGetTeacher = (req, res)  => {
  let sql = `
    SELECT teacher_id, name, sex, age, teacher.classroom_id,classroomname, phone, address from teacher
    left join classroom on teacher.classroom_id = classroom.classroom_id
  `
  dbConfig.SySqlConnect(sql)
  .then(data => {
    if(data.length){
      res.send({
        code: 200,
        teachers: data
      })
    } else {
      res.send({
        code: 400,
        msg: "查询失败"
      })
    }
  })
}
// 教师信息修改
const apiEditTeacher = (req, res) => {
  console.log(req.body)
  let {teacher_id, name, sex, age, classroom_id, phone, address} = req.body.teacher
  let sql = "UPDATE `teacher` SET `name` = ?,`sex` = ?,`age` = ?,`classroom_id` = ?,`phone` = ?,`address` = ? WHERE `teacher_id` = ?"
  let sqlArr = [ name, sex, age, classroom_id, phone, address, teacher_id]
  dbConfig.SySqlConnect(sql, sqlArr)
  .then(data => {
    if(data.affectedRows === 1) {
      res.send({
        code:200,
        msg: "修改成功"
      })
    }
  })
}
// 添加老师
const apiAddTeacher =(req, res) => {
  console.log(req.body.teacher)
  let {name, age, sex, classroom_id, address, phone} = req.body.teacher
  sql =  "INSERT INTO `teacher`(`name`, `sex`, `age`, `classroom_id`, `phone`, `address`) VALUES ( ?, ?, ?, ?, ?, ?)"
  sqlArr = [name, sex, age, classroom_id, phone, address]
  dbConfig.SySqlConnect(sql, sqlArr)
  .then(data => {
    if(data.affectedRows ===1) {
      res.send({
        code: 200,
        msg: "添加成功"
      })
    }else {
      res.send({
        code: 400,
        msg: "添加失败"
      })
    }
  })
}
// 删除老师
const apiDeleteTeacher =(req, res) => {
  console.log(req.body)
  let teacher_id = req.body.teacher_id
  let sql =`DELETE FROM teacher where teacher_id=?`
  dbConfig.SySqlConnect(sql,teacher_id)
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
// 查询老师 根据老师工号查找
const apiTeacherIdFind = (req, res) => {
  let teacher_id = req.query.teacher_id
  let sql = `
    SELECT teacher_id, name, sex, age, teacher.classroom_id,classroomname, phone, address from teacher
    left join classroom on teacher.classroom_id = classroom.classroom_id where teacher.teacher_id =?
  `
  dbConfig.SySqlConnect(sql, teacher_id)
  .then(data => {
    if(data.length){
      res.send({
        code: 200,
        teachers: data
      })
    } else {
      res.send({
        code: 400,
        msg: "没有该工号"
      })
    }
  })
}
// 查询老师 根据老师姓名查找
const apiTeacherNameFind = (req, res) => {
  let name = req.query.name
  let sql = `
    SELECT teacher_id, name, sex, age, teacher.classroom_id,classroomname, phone, address from teacher
    left join classroom on teacher.classroom_id = classroom.classroom_id where teacher.name =?
  `
  dbConfig.SySqlConnect(sql, name)
  .then(data => {
    if(data.length){
      res.send({
        code: 200,
        teachers: data
      })
    } else {
      res.send({
        code: 400,
        msg: '没有该老师'
      })
    }
  })
}

// 查询学生信息  全部
const apiGetStudent = (req, res) => {
  let sql = `
  select  schools.school_id, schoolname,student_id, name,classroomname,students.classroom_id, gradename, sex,age, address, phone from students 
  LEFT JOIN classroom on students.classroom_id = classroom.classroom_id
  LEFT JOIN grade on students.grade_id = grade.grade_id
  LEFT JOIN schools on schools.school_id = classroom.school_id
  `
  dbConfig.SySqlConnect(sql)
  .then(data => {
    if(data.length){
      res.send({
        code: 200,
        students: data
      })
    } else {
      res.send({
        code: 400,
        msg: "查询失败"
      })
    }
  })
}
// 学生信息修改
const apiEditStudent = (req, res) => {
  console.log(req.body)
  let {student_id, name, sex, age, classroom_id, phone, address} = req.body.student
  let sql = "UPDATE `students` SET `name` = ?,`sex` = ?,`age` = ?,`classroom_id` = ?,`phone` = ?,`address` = ? WHERE `student_id` = ?"
  let sqlArr = [ name, sex, age, classroom_id, phone, address, student_id]
  dbConfig.SySqlConnect(sql, sqlArr)
  .then(data => {
    if(data.affectedRows === 1) {
      res.send({
        code:200,
        msg: "修改成功"
      })
    }else{
      res.send({
        code:400,
        msg: "修改失败"
      })
    }
  })
}
// 添加学生
const apiAddStudent =(req, res) => {
  console.log(req.body.student)
  let {name, age, sex, classroom_id, address, phone} = req.body.student
  sql =  "INSERT INTO `students`(`name`, `sex`, `age`, `classroom_id`, `phone`, `address`) VALUES ( ?, ?, ?, ?, ?, ?)"
  sqlArr = [name, sex, age, classroom_id, phone, address]
  dbConfig.SySqlConnect(sql, sqlArr)
  .then(data => {
    if(data.affectedRows ===1) {
      res.send({
        code: 200,
        msg: "添加成功"
      })
    }else {
      res.send({
        code: 400,
        msg: "添加失败"
      })
    }
  })
}
// 删除学生
const apiDeleteStudent = (req, res) => {
  let student_id = req.query.student_id
  console.log(req.query)
  let sql =`DELETE FROM students where student_id=?`
  dbConfig.SySqlConnect(sql,student_id)
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
// 查询学生信息  根据学生学号查找
const apiStudentIdFind = (req, res) => {
  let student_id = req.query.student_id
  let sql = `
  select  schools.school_id, schoolname,student_id, name,classroomname,students.classroom_id, gradename, sex,age, address, phone from students 
  LEFT JOIN classroom on students.classroom_id = classroom.classroom_id
  LEFT JOIN grade on students.grade_id = grade.grade_id
  LEFT JOIN schools on schools.school_id = classroom.school_id
  where students.student_id =?
  `
  dbConfig.SySqlConnect(sql, student_id)
  .then(data => {
    if(data.length){
      res.send({
        code: 200,
        students: data
      })
    } else {
      res.send({
        code: 400,
        msg: "没有该学号"
      })
    }
  })
}
// 查询学生信息  根据学生姓名查找
const apiStudentNameFind = (req, res) => {
  let name = req.query.name
  let sql = `
  select  schools.school_id, schoolname,student_id, name,classroomname,students.classroom_id, gradename, sex,age, address, phone from students 
  LEFT JOIN classroom on students.classroom_id = classroom.classroom_id
  LEFT JOIN grade on students.grade_id = grade.grade_id
  LEFT JOIN schools on schools.school_id = classroom.school_id
  where students.name =?
  `
  dbConfig.SySqlConnect(sql, name)
  .then(data => {
    if(data.length){
      res.send({
        code: 200,
        students: data
      })
    } else {
      res.send({
        code: 400,
        msg: "没有该学生"
      })
    }
  })
}
// 查询学生信息  根据学生姓名查找
const apiStudentClassFind = (req, res) => {
  let classroom_id = req.query.classroom_id
  let sql = `
  select  schools.school_id, schoolname,student_id, name,classroomname,students.classroom_id, gradename, sex,age, address, phone from students 
  LEFT JOIN classroom on students.classroom_id = classroom.classroom_id
  LEFT JOIN grade on students.grade_id = grade.grade_id
  LEFT JOIN schools on schools.school_id = classroom.school_id
  where students.classroom_id =?
  `
  dbConfig.SySqlConnect(sql, classroom_id)
  .then(data => {
    if(data.length){
      res.send({
        code: 200,
        students: data
      })
    } else {
      res.send({
        code: 400,
        msg: "查询失败"
      })
    }
  })
}

// 获取全部用户
const apiGetUser = (req, res) => {
  let sql = `SELECT user_id, password, phone,admin, role, email, brithday,address,name from users`
  dbConfig.SySqlConnect(sql)
  .then(data => {
    if(data.length){
      res.send({
        code: 200,
        users: data
      })
    } else {
      res.send({
        code: 400,
        msg: "查询失败"
      })
    }
  })
}
// 获取某个用户  根据 id
const apiGetUserIdFind = (req, res) => {
  let user_id = req.query.user_id
  let sql = `SELECT user_id, password,admin, phone, role, email, brithday,address,name from users where user_id =?`
  dbConfig.SySqlConnect(sql, user_id)
  .then(data => {
    console.log(data)
    if(data.length){
      res.send({
        code: 200,
        user: data
      })
    } else {
      res.send({
        code: 400,
        msg: "没有此用户"
      })
    }
  })
}
// 获取某个用户  根据 name
const apiGetUserNameFind = (req, res) => {
  let name = req.query.name
  let sql = `SELECT user_id, password,admin, phone, role, email, brithday,address,name from users where name =?`
  dbConfig.SySqlConnect(sql, name)
  .then(data => {
    console.log(data)
    if(data.length){
      res.send({
        code: 200,
        user: data
      })
    } else {
      res.send({
        code: 400,
        msg: "没有此用户"
      })
    }
  })
}
// 用户信息修改
const apiEditUser = (req, res) => {
  console.log(req.body)
  let {user_id, password, phone, role, email, brithday,address,name} = req.body.user
  let sql = "UPDATE `users` SET password =?, phone=?, role=?, email=?, brithday=?,address=?,name=? WHERE `user_id` = ?"
  let sqlArr = [  password, phone, role, email, brithday,address,name, user_id]
  dbConfig.SySqlConnect(sql, sqlArr)
  .then(data => {
    if(data.affectedRows === 1) {
      res.send({
        code:200,
        msg: "修改成功"
      })
    }else{
      res.send({
        code:400,
        msg: "修改失败"
      })
    }
  })
}

// 用户状态修改
const apiAdminUser = (req, res) => {
  console.log(req.body)
  let {user_id, admin} = req.body.user
  let sql = "UPDATE `users` SET admin = '?' WHERE `user_id` = ?"
  let sqlArr = [  admin, user_id]
  dbConfig.SySqlConnect(sql, sqlArr)
  .then(data => {
    if(data.affectedRows === 1) {
      res.send({
        code:200,
        msg: "修改成功"
      })
    }else{
      res.send({
        code:400,
        msg: "修改失败"
      })
    }
  })
}
// 删除用户
const apiDeleteUser = (req, res) => {
  let user_id = req.body.user_id
  let sql =`DELETE FROM users where user_id=?`
  dbConfig.SySqlConnect(sql,user_id)
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

// 获取科目信息
const apiGetSubject = (req, res) => {
  let sql = `
    select subject_id, subjectname, subject.teacher_id, name from subject
    left join teacher on teacher.teacher_id = subject.teacher_id `
  dbConfig.SySqlConnect(sql).then(result => {
    if(result.length>0) {
      res.send({
        code: 200,
        msg: '获取科目信息成功',
        subjects: result
      })
    }else {
      res.send({
        code: 400,
        msg: '获取科目信息失败，请稍后再试'
      })
    }
  })
}
// 获取科目信息 科目名称
const apiGetSubjectName = (req, res) => {
  let subjectname = req.query.subjectname
  let sql = `
    select subject_id, subjectname, subject.teacher_id, name from subject
    left join teacher on teacher.teacher_id = subject.teacher_id where subjectname =?`
  dbConfig.SySqlConnect(sql,subjectname).then(result => {
    if(result.length>0) {
      res.send({
        code: 200,
        msg: '获取科目信息成功',
        subjects: result
      })
    }else {
      res.send({
        code: 400,
        msg: '没有此科目'
      })
    }
  })
}
// 获取科目信息 任课老师查找
const apiGetSubjectTeacher = (req, res) => {
  let name = req.query.name
  let sql = `
    select subject_id, subjectname, subject.teacher_id, name from subject
    left join teacher on teacher.teacher_id = subject.teacher_id where name=?`
  dbConfig.SySqlConnect(sql,name).then(result => {
    console.log(result)
    if(result.length>0) {
      res.send({
        code: 200,
        msg: '获取科目信息成功',
        subjects: result
      })
    }else {
      res.send({
        code: 400,
        msg: '没有该老师任课的科目'
      })
    }
  })
}

// 添加科目
const apiAddSubject = (req, res) => {
  let {teacher_id, subjectname} = req.body
  let sql = `insert into subject(subjectname, teacher_id) values(?,?)`
  let sqlArr = [subjectname,teacher_id]
  dbConfig.SySqlConnect(sql, sqlArr).then(result => {
    if(result.affectedRows === 1) {
      res.send({
        code: 200,
        msg: '添加科目成功'
      })
    } else {
      res.send({
        code: 400,
        msg: '添加科目失败，请稍后再试'
      })
    }
  })
}

// 修改科目
const apiEditSubject = (req, res) => {
  let {teacher_id, subjectname , subject_id} = req.body
  let sql = `update  subject set subjectname =?, teacher_id =? where subject_id =?`
  let sqlArr = [subjectname,teacher_id,subject_id]
  dbConfig.SySqlConnect(sql, sqlArr).then(result => {
    if(result.affectedRows === 1) {
      res.send({
        code: 200,
        msg: '修改科目成功'
      })
    } else {
      res.send({
        code: 400,
        msg: '修改科目失败，请稍后再试'
      })
    }
  })
}




module.exports = {
  passLogin,
  phoneLogin,
  sendPhoneCode,
  isTeacher,
  isPhone,
  Register,
  Password,
  getClassTeam,
  getStudentInfo,
  StudentInfoEdit,
  getSemester,
  getScore,
  getScoreStudent,
  scoreStudentEdit,
  apiUsedSubject,
  addScore,
  moveScore,
  apiGetCourse,
  apiGetSTA,
  apiAddCourse,
  apiEditCourse,
  apiDeleteCourse,
  apiGetTeacher,
  apiEditTeacher,
  apiAddTeacher,
  apiDeleteTeacher,
  apiTeacherIdFind,
  apiTeacherNameFind,
  apiGetStudent,
  apiEditStudent,
  apiAddStudent,
  apiStudentIdFind,
  apiStudentNameFind,
  apiStudentClassFind,
  apiDeleteStudent,
  apiGetUser,
  apiGetUserIdFind,
  apiEditUser,
  apiAdminUser,
  apiDeleteUser,
  apiGetUserNameFind, 
  apiGetSubject,
  apiAddSubject,
  apiEditSubject,
  apiGetSubjectName,
  apiGetSubjectTeacher
}
