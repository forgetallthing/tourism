/**
 * Created by Administrator on 2017/3/15.
 */

var express = require('express');
var router = express.Router();
var db = require('./../dao/UserDao.js');
var co = require('co');
var formidable = require('formidable');
var fs = require('fs');
var crypto = require('crypto');
var path = require('path');
var url = require('url');

// 获取用户主页信息
router.get('/mypageData', function (req, res) {
    let user_id = req.query.user_id.trim();
    db.getMyPageData(user_id, res);
});

// 获取用户信息
router.get('/getuserInfor', function (req, res) {
    let user_id = req.query.user_id.trim();
    db.getuserInfor(user_id, res);
});

//获取用户关注列表
router.get('/getcare', function (req, res) {
    let user_id = req.query.user_id.trim();
    db.getcare(user_id, res);
});

//获取用户粉丝列表
router.get('/getfans', function (req, res) {
    let user_id = req.query.user_id.trim();
    db.getfans(user_id, res);
});

//获取用户是否关注某人
router.get('/iscare', function (req, res) {
    let user_id = req.query.user_id.trim();
    let other_id = req.query.other_id.trim();
    db.iscare(user_id, other_id, res);
});

//用户关注某人
router.get('/caresonmeone', function (req, res) {
    let user_id = req.query.user_id.trim();
    let other_id = req.query.other_id.trim();
    db.caresonmeone(user_id, other_id, res);
});

//用户取消关注某人
router.get('/uncaresonmeone', function (req, res) {
    let user_id = req.query.user_id.trim();
    let other_id = req.query.other_id.trim();
    db.uncaresonmeone(user_id, other_id, res);
});

// 登录
router.post('/login', function (req, res) {
    var hash = crypto.createHash('md5');
    var userName = req.body.userName.trim();
    var password1 = req.body.password.trim();
    hash.update(password1);
    var password = hash.digest('hex');
    db.userLogin(userName, password, res);
});

// 注册
router.post('/register', function (req, res) {
    var hash = crypto.createHash('md5');
    var userName = req.body.userName.trim();
    var password1 = req.body.password.trim();
    var email = req.body.email.trim();
    hash.update(password1);
    var password = hash.digest('hex');
    db.userRegister(userName, password, email, res);
});

// 忘记密码
router.post('/findPassword', function (req, res) {
    var userName = req.body.userName.trim();
    var email = req.body.email.trim();
    db.findPassword(userName, email, res);
});

// 修改密码
router.post('/changePassword', function (req, res) {
    var user_id = req.body.user_id.trim();
    var oldpassword1 = req.body.oldpassword.trim();
    var newpassword1 = req.body.newpassword.trim();
    var oldpassword = crypto.createHash('md5').update(oldpassword1).digest('hex');
    var newpassword = crypto.createHash('md5').update(newpassword1).digest('hex');
    db.changePassword(user_id, oldpassword, newpassword, res);
});

router.get('/changeUsername', function (req, res) {
    var user_id = req.query.user_id.trim();
    var username = req.query.username.trim();

    db.changeUsername(user_id, username, res);
});

router.get('/changeSex', function (req, res) {
    var user_id = req.query.user_id.trim();
    var sex = req.query.sex;
    db.changeSex(user_id, sex, res);
});

router.get('/changeText', function (req, res) {
    var user_id = req.query.user_id.trim();
    var text = req.query.text.trim();
    db.changeText(user_id, text, res);
});

router.get('/changeEmail', function (req, res) {
    var user_id = req.query.user_id.trim();
    var email = req.query.email.trim();
    db.changeEmail(user_id, email, res);
});

router.post('/changeUserPic', function (req, res) {
    var form = new formidable.IncomingForm();
    //图片缓存位置：
    form.uploadDir = path.join(__dirname, '..', 'temp');
    //最终存放位置：
    var uploadfoldername = 'userPic';
    var uploadfolderpath = path.join(__dirname, '..', 'public', 'images', uploadfoldername);
    form.parse(req, function (err, fields, files) {
        if (err) {
            return console.log('formidable, form.parse err');
        }

        // console.log('formidable, form.parse ok');

        // 显示参数，例如 token
        console.log('显示上传时的参数 begin');
        console.log(fields);
        var user_id = fields.userID;
        console.log('显示上传时的参数 end');

        var item;

        // 计算 files 长度
        var length = 0;
        for (item in files) {
            length++;
        }
        if (length === 0) {
            console.log('files no data');
            return;
        }

        for (item in files) {
            var file = files[item];
            // formidable 会将上传的文件存储为一个临时文件，现在获取这个文件的目录
            var tempfilepath = file.path;
            console.log(tempfilepath);
            // 获取文件类型
            var type = file.type;

            // 获取文件名，并根据文件名获取扩展名
            var filename = file.name;
            var extname = filename.lastIndexOf('.') >= 0 ? filename.slice(filename.lastIndexOf('.') - filename.length) : '';
            // 文件名没有扩展名时候，则从文件类型中取扩展名
            if (extname === '' && type.indexOf('/') >= 0) {
                extname = '.' + type.split('/')[1];
            }
            // 将文件名重新赋值为一个随机数（避免文件重名）
            filename = Math.random().toString().slice(2) + extname;

            // 构建将要存储的文件的路径
            var filenewpath = path.join(uploadfolderpath, filename);
            console.log(filenewpath);

            // 将临时文件保存为正式的文件
            fs.rename(tempfilepath, filenewpath, function (err) {
                // 存储结果
                if (err) {
                    // 发生错误
                    console.log('fs.rename err');
                    result = 'error|save error';
                } else {
                    // 保存成功
                    console.log('fs.rename done');
                    var fuckurl = filenewpath.split('public\\')[1];
                    db.changeUserPic(user_id, fuckurl, res);
                }
            }); // fs.rename
        } // for in
    });
});

//var notitle="顽童踏泥听小雷,渡鸟簌簌竞斜飞";

//router.post('/myPage', function (req,resp) {
//    co(function *() {
//        var thiswanyi = req.session.curUser._id;
//        var userCares=yield dao.findUserCare(thiswanyi);
//        var userCared=yield dao.findUserCared(thiswanyi);
//        var userPanchCard=yield dao.findUserPanchCard(thiswanyi);
//        var findUserSLetters=yield dao.findUserSLetter(thiswanyi);
//        var b={
//            userName:req.session.curUser.userName,
//            desc:req.session.curUser.desc,
//            head_pic:req.session.curUser.head_pic,
//            sex:req.session.curUser.sex,
//            userCares:userCares,
//            userCared:userCared,
//            userPanchCard:userPanchCard,
//            findUserSLetters:findUserSLetters
//        };
//        resp.send(b);
//    }).catch(function (e) {
//        resp.send({state:0});
//    })
//});

//router.post('/settingName', function (req,resp) {
//    co(function *() {
//        var userName = req.body.duserName.trim();
//        var userID=req.session.curUser._id;
//        if(userName!=""){
//            var user=yield dao.findUserByName(userName);
//            if(user==null){
//                yield dao.setUserName(userID,userName);
//                var user=yield dao.findUserById(userID);
//                req.session.curUser=user;
//                resp.send({state:1});
//            }else {
//                resp.send({state:3});
//            }
//        }else{
//            resp.send({state:2});
//        }
//    }).catch(function (e) {
//        resp.send({state:0});
//    })
//
//});
//router.post('/updateSex', function (req,resp) {
//    co(function *() {
//        var userSex = req.body.Sex;
//        var userID=req.session.curUser._id;
//        yield dao.setUserSex(userID,userSex);
//        var user=yield dao.findUserById(userID);
//        req.session.curUser=user;
//        resp.send({state:1});
//    }).catch(function (e) {
//        resp.send({state:2});
//    })
//
//});
//router.post('/updateDesc', function (req,resp) {
//    co(function *() {
//        var userDesc = req.body.ddesc.trim();
//        var userID=req.session.curUser._id;
//        yield dao.setUserDesc(userID,userDesc);
//        var user=yield dao.findUserById(userID);
//        req.session.curUser=user;
//        resp.send({state:1});
//    }).catch(function (e) {
//        resp.send({state:2});
//    })
//
//});

module.exports = router;
