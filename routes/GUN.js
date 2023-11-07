/**
 * Created by zhang on 2017/5/14.
 */
var express = require('express');
var router = express.Router();
var db = require('./../dao/UserDao.js');
var co = require('co');
var formidable = require('formidable');
var fs = require('fs');
const nodemailer = require("nodemailer");
var crypto = require('crypto');
var path = require('path');
var url = require('url');

function getUserCollection() {
    return mongodb.collection("user");
}
function getUserCollectionGUN() {
    return mongodb.collection("guns");
}
function getUserCollectionsearch() {
    return mongodb.collection("search_record");
}
function getUserCollectionguncollect() {
    return mongodb.collection("gun_collect");
}
function getnewsCollection() {
    return mongodb.collection("news");
}
function getnewslikeCollection() {
    return mongodb.collection("news_like");
}
function getQuestionCollection() {
    return mongodb.collection("questions");
}
function getQuestionCollectCollection() {
    return mongodb.collection("question_collect");
}

//录入问题
router.get('/ask_Question', function(req, res, next) {
    let user_id = req.session.user_id;
    let ques_title = req.query.title.trim();
    let ques_text = req.query.text.trim();
    let time = new Date().toLocaleString();
    let greentime = new Date(time).getTime();
    co(function *() {
        let x=yield getQuestionCollection().insert({
            user_id:user_id,
            ques_title:ques_title,
            ques_text:ques_text,
            time:time,
            greentime:greentime,
        });
        let y=yield getQuestionCollection().find({greentime:greentime}).limit(1).next();
        yield getQuestionCollectCollection().insert({
            ques_id:y._id,
            ques_collectot:[],
            collect_sum:0
        });
        res.send({state:1});
    }).catch(function (e) {
        res.send({state:0});
    });
});

// 注册
router.post('/register', function (req, res) {
    var hash = crypto.createHash('md5');
    var userName = req.body.userName.trim();
    var password1 = req.body.password.trim();
    var email = req.body.email.trim();
    hash.update(password1);
    var password = hash.digest('hex');
    co(function *() {
        var user = yield getUserCollection().find({userName: userName}).limit(1).next();
        if (user == null) {
            yield  getUserCollection().insert({
                userName: userName,
                password: password,
                email: email,
                text: "暂无描述",
                photo: "",
                collectiongun: [],
                collectquestion: []
            });
            var curUser = yield getUserCollection().find({userName: userName}, {_id: 1}).limit(1).next();
            req.session.user_id = curUser._id;
            res.send({state: 2});
        } else {
            res.send({state: 1});
        }
    }).catch(function (e) {
        res.send({state: 0});
    });
});


// $.ajax({
//         type: "post",
//         url: "http://127.0.0.1:3000/GUN/login",
//         data: {
//         },
//         async: true,
//         success: function (data) {
//             console.log(data);
//         }
//     });
    

// 登录
router.post('/login', function (req, res) {
    var hash = crypto.createHash('md5');
    var userName = req.body.userName.trim();
    var password1 = req.body.password.trim();
    hash.update(password1);
    var password = hash.digest('hex');
    co(function *() {
        var user = yield getUserCollection().find({userName: userName}).limit(1).next();
        if (user == null) {
            res.send({state: 1});
        } else {
            if (user.password == password) {
                req.session.user_id = user._id;
                res.send({state: 3});
            } else {
                res.send({state: 2});
            }
        }
    }).catch(function (e) {
        res.send({state: 0});
    });
});

// 忘记密码
router.post('/findPassword', function (req, res) {
    var userName = req.body.userName.trim();
    var email = req.body.email.trim();
    co(function *() {
        var user = yield getUserCollection().find({userName: userName}).limit(1).next();
        if (user == null) {
            res.send({state: 1});
        } else {
            if (user.email == email) {

                var newPassword = randomAlphanumeric(8);
                var hash = crypto.createHash('md5');
                hash.update(newPassword);
                var hashNewPassword = hash.digest('hex');

                yield getUserCollection().update({userName: userName}, {$set: {password: hashNewPassword}});
                var smtpTransport = nodemailer.createTransport({
                    service: "QQ",
                    auth: {
                        user: "786014381@qq.com",
                        pass: "jlxmshdllnoybefe"
                    }
                });
                smtpTransport.sendMail({
                    from: 'Gunstash<786014381@qq.com>',
                    to: user.email,
                    subject: 'Gunstash找回密码',
                    html: '您的新随机密码为: ' + newPassword + " <br>建议登录成功后修改您的密码，并妥善保管您的新密码。<br><br>这是一封自动发送的邮件：如果您并未要求但接收到这封信件，您不需要进行任何操作。  <span  style='color:#0000ff'>Gunstash技术支持</span>"
                }, function (err, res) {
                    console.log(err, res);
                });
                res.send({state: 3});
            } else {
                res.send({state: 2});
            }
        }
    }).catch(function (e) {
        res.send({state: 0});
    });
});

// 修改密码
router.post('/changePassword', function (req, res) {
    var user_id = req.session.user_id;
    console.log(user_id);
    var oldpassword1 = req.body.oldpassword.trim();
    var newpassword1 = req.body.newpassword.trim();
    var oldpassword = crypto.createHash('md5').update(oldpassword1).digest('hex');
    var newpassword = crypto.createHash('md5').update(newpassword1).digest('hex');
    co(function *() {
        var user = yield getUserCollection().find({_id: ObjectID(user_id)}).limit(1).next();
        if (user == null) {
            res.send({state: 1});
        } else {
            if (user.password == oldpassword) {
                yield getUserCollection().update({_id: ObjectID(user_id)}, {$set: {password: newpassword}});
                res.send({state: 3});
            } else {
                res.send({state: 2});
            }
        }
    }).catch(function (e) {
        res.send({state: 0});
    });
});

// 修改用户名
router.get('/changeUsername', function (req, res) {
    var user_id = req.session.user_id;
    var username = req.query.username.trim();
    co(function *() {
        yield getUserCollection().update({_id: ObjectID(user_id)}, {$set: {userName: username}});
        res.send({state: 1});
    }).catch(function (e) {
        res.send({state: 0});
    });
});

// 修改备注
router.get('/changeText', function (req, res) {
    var user_id = req.session.user_id;
    var text = req.query.text.trim();
    co(function *() {
        yield getUserCollection().update({_id: ObjectID(user_id)}, {$set: {text: text}});
        res.send({state: 1});
    }).catch(function (e) {
        res.send({state: 0});
    });
});

router.get('/changeEmail', function (req, res) {
    var user_id = req.session.user_id;
    var email = req.query.email.trim();
    co(function *() {
        yield getUserCollection().update({_id: ObjectID(user_id)}, {$set: {email: email}});
        res.send({state: 1});
    }).catch(function (e) {
        res.send({state: 0});
    });
});

// 更改用户头像
router.post('/changeUserPic', function (req, res) {
    var user_id = req.session.user_id;
    console.log(user_id);
    var form = new formidable.IncomingForm();
    //图片缓存位置：
    form.uploadDir = path.join(__dirname, "..", "temp");
    //最终存放位置：
    var uploadfoldername = 'userPic';
    var uploadfolderpath = path.join(__dirname, "..", "public", "images", uploadfoldername);
    form.parse(req, function (err, fields, files) {
        if (err) {
            return console.log('formidable, form.parse err');
        }

        // console.log('formidable, form.parse ok');

        // 显示参数，例如 token
        console.log('显示上传时的参数 begin');

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
            var extname = filename.lastIndexOf('.') >= 0
                ? filename.slice(filename.lastIndexOf('.') - filename.length)
                : '';
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
                    var picurl = filenewpath.split("public\\")[1];
                    co(function *() {
                        yield getUserCollection().update({_id: ObjectID(user_id)}, {$set: {photo: picurl}});
                        res.send({state: 1});
                    }).catch(function (e) {
                        res.send({state: 0});
                    });
                }
            }); // fs.rename
        } // for in
    });
});

// 搜索
router.get('/search', function (req, res, next) {
    var gunname = req.query.name.trim();
    var user_id = req.session.user_id || "null";
    var curTime = new Date().toLocaleString();
    co(function *() {
        let GunData = yield getUserCollectionGUN().find({
            "名称": {
                $regex: ("^.*" + gunname + ".*$"),
                $options: "$i"
            }
        }).toArray();
        let gun_name = yield getUserCollectionGUN().find({
            "名称": {
                $regex: ("^.*" + gunname + ".*$"),
                $options: "$i"
            }
        }, {"名称": -1}).toArray();
        yield getUserCollectionsearch().insert({
            word: gunname,
            time: curTime,
            guns: gun_name,
            user: user_id
        });
        res.send({state: 1, data: GunData});
    }).catch(function (e) {
        res.send({state: 0});
    });
});

//枪械分类搜索
router.get('/search_classify', function (req, res, next) {
    var classify = req.query.classify;
    co(function *() {
        let GunData = yield getUserCollectionGUN().find({
            "分类": classify
        }).toArray();
        res.send({state: 1, data: GunData});
    }).catch(function (e) {
        res.send({state: 0});
    });
});

//资讯搜索
router.get('/zizunsearch', function (req, res, next) {
    var zizunsearch = req.query.zizunsearch;
    co(function *() {
        let zizunData = yield getnewsCollection().find({
            news_title: {
                $regex: ("^.*" + zizunsearch + ".*$"),
                $options: "$i"
            }
        }).toArray();
        res.send({state: 1, data: zizunData});
    }).catch(function (e) {
        res.send({state: 0});
    });
});

// 获取枪械数据
router.get('/gundata', function (req, res, next) {
    var gunname = req.query.gunname;//数组
    co(function *() {
        let res_Data = [];
        for (let i = 0; i < gunname.length; i++) {
            let GunData = yield getUserCollectionGUN().find({
                "名称": gunname[i]
            }).toArray();
            res_Data.push(GunData)
        }
        res.send({state: 1, data: res_Data});
    }).catch(function (e) {
        res.send({state: 0});
    });
});

// 获取news数据
router.get('/get_zizun', function (req, res, next) {
    var zixun_id = req.query.zixun_id;
    co(function *() {
        let zixunData = yield getnewsCollection().find({_id: ObjectID(zixun_id)}).limit(1).next();
        let zixunRedu = yield getnewslikeCollection().find({news_id: ObjectID(zixun_id)}).limit(1).next();
        res.send({state: 1, data: zixunData,redu:zixunRedu});
    }).catch(function (e) {
        res.send({state: 0});
    });
});

// 获取用户是否点赞news
router.get('/is_zxdianzan', function (req, res, next) {
    var user_id = req.session.user_id || "null";
    console.log(user_id)
    var zixun_id = req.query.zixun_id;
    co(function *() {
        let zixunData = yield getnewslikeCollection().find({news_id: ObjectID(zixun_id)}).limit(1).next();
        let curnum = zixunData.news_liker.indexOf(user_id);
        res.send({state: 1, data: curnum});
    }).catch(function (e) {
        res.send({state: 0});
    });
});

//枪械热度前五名获取
router.get('/hot_gun', function (req, res, next) {
    co(function *() {
        let gunname = yield getUserCollectionguncollect().find().sort({"collect_num": -1}).limit(3).toArray();
        let res_Data = [];
        for (let i = 0; i < gunname.length; i++) {
            let GunData = yield getUserCollectionGUN().find({
                "名称": gunname[i].gun_name
            }).toArray();
            res_Data.push(GunData)
        }
        res.send({state: 1, data: res_Data});
    }).catch(function (e) {
        res.send({state: 0});
    });
});

// 收藏枪械
router.get('/collect_gun', function (req, res, next) {
    var user_id = req.session.user_id;
    var iscollection = req.query.iscollection;
    var gun_name = req.query.gun_name;
    co(function *() {
        if (iscollection == 0) {
            yield getUserCollectionguncollect().update({gun_name: gun_name}, {
                $push: {collector: user_id},
                $inc: {collect_num: 1}
            });
            yield getUserCollection().update({_id: ObjectID(user_id)}, {$push: {collectiongun: gun_name}});
            res.send({state: 1});
        } else if (iscollection == 1) {
            yield getUserCollectionguncollect().update({gun_name: gun_name}, {
                $pull: {collector: user_id},
                $inc: {collect_num: -1}
            });
            yield getUserCollection().update({_id: ObjectID(user_id)}, {$pull: {collectiongun: gun_name}});
            res.send({state: 1});
        }
    }).catch(function (e) {
        res.send({state: 0});
    });
});

// 点赞资讯
router.get('/like_news', function (req, res, next) {
    var user_id = req.session.user_id;
    var iscollection = req.query.iscollection;
    var zixun_id = req.query.zixun_id;
    co(function *() {
        if (iscollection == 0) {
            yield getnewslikeCollection().update({news_id: ObjectID(zixun_id)}, {
                $push: {news_liker: user_id},
                $inc: {like_num: 1}
            });
            res.send({state: 1});
        } else if (iscollection == 1) {
            yield getnewslikeCollection().update({news_id: ObjectID(zixun_id)}, {
                $pull: {news_liker: user_id},
                $inc: {like_num: -1}
            });
            res.send({state: 1});
        }
    }).catch(function (e) {
        res.send({state: 0});
    });
});

//获取用户关注枪械列表
router.get('/collectgunlist', function (req, res, next) {
    var user_id = req.session.user_id;
    co(function *() {
        let gunlist = yield getUserCollection().find({_id: ObjectID(user_id)}, {"collectiongun": -1}).next();
        res.send({state: 1, data: gunlist});
    }).catch(function (e) {
        res.send({state: 0});
    });

    // co(function *() {
    //     let gunlist = yield getUserCollectionGUN().find().toArray();
    //     for (let i = 0;i<gunlist.length;i++){
    //
    //             yield getUserCollectionguncollect().insert({
    //                 gun_name:gunlist[i]["名称"],
    //                 gun_id:gunlist[i]._id,
    //                 collector:[],
    //                 collect_num:0
    //             })
    //
    //     }
    //     res.send({state: 1});
    // }).catch(function (e) {
    //     res.send({state: 0});
    // });
});

//获取用户是否登录
router.get('/is_login', function (req, res, next) {
    var user_id = req.session.user_id || "";
    co(function *() {
        if (user_id != "") {
            let user_data = yield getUserCollection().find({_id: ObjectID(user_id)}).next();
            res.send({state: 1,data:user_data});
        } else {
            res.send({state: 2});
        }
    }).catch(function (e) {
        res.send({state: 0});
    });
});

// 退出登录
router.get('/no_login', function (req, res, next) {
    req.session.destroy(function(err) {
        // cannot access session here
    });
    res.send({state: 1});
});

//news列表(最新、推荐、最热)
router.get('/new_newslist', function(req, res, next) {
    co(function *() {
        let curNewsList=yield getnewsCollection().find({},{_id:1,news_title:1,news_imgurl:1,news_time:1,news_author:1}).toArray();
        let tuijianList=yield getnewsCollection().find({},{_id:1,news_title:1,news_imgurl:1,news_time:1,news_author:1}).toArray();
        let zuireList0=yield getnewslikeCollection().find({}).sort({like_num:-1}).toArray();
        let zuireList=[];
        for(let j=0;j<zuireList0.length;j++){
            let hyou = yield getnewsCollection().find({_id:ObjectID(zuireList0[j].news_id)},{_id:1,news_title:1,news_imgurl:1,news_time:1,news_author:1}).limit(1).next();
            zuireList.push(hyou)
        }
        let curNews=0;
        for(let i=0;i<curNewsList.length;i++){
            curNews=parseInt(curNewsList[i].news_time.replace(/-/g, ""));
            curNewsList[i].num=curNews;
        }
        curNewsList.sort(function(a,b){
            return b.num-a.num
        });
        // console.log(curNewsList);
        // console.log("--------------------");
        // console.log(tuijianList);
        // console.log("--------------------");
        // console.log(zuireList);
        res.send({state:1,curNewsList:curNewsList,tuijianList:tuijianList,zuireList:zuireList});
    }).catch(function (e) {
        res.send({state:0});
    });
});


module.exports = router;

//生成随机密码
function randomAlphanumeric(charsLength, chars) {
    var length = charsLength;
    if (!chars)
        var chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

    var randomChars = "";

    for (x = 0; x < length; x++) {
        var i = Math.floor(Math.random() * chars.length);
        randomChars += chars.charAt(i);
    }

    return randomChars
}