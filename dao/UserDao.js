/**
 * Created by Administrator on 2017/3/11.
 */
const co = require("co");
const nodemailer = require("nodemailer");
const crypto = require('crypto');


function getUserCollection() {
    return mongodb.collection("user");
}
function getUserCollectionConcern() {
    return mongodb.collection("concern");
}
function getUserCollectionDongtai() {
    return mongodb.collection("dongtai");
}
function getUserCollectionShoes() {
    return mongodb.collection("shoes");
}
//function getnNews_likeCollection(){
//    return mongodb.collection("news_like");
//}


function userRegister(userName, password, email, res) {
    co(function *() {
        var user = yield getUserCollection().find({userName: userName}).limit(1).next();
        if (user == null) {
            yield  getUserCollection().insert({
                userName: userName,
                password: password,
                email: email,
                text: "暂无描述",
                photo: "",
            });
            var curUser = yield getUserCollection().find({userName: userName}, {_id: 1}).limit(1).next();
            res.send({state: 2, user_id: curUser._id});
        } else {
            res.send({state: 1});
        }
    }).catch(function (e) {
        res.send({state: 0});
    });
}

function userLogin(userName, password, res) {
    co(function *() {
        var user = yield getUserCollection().find({userName: userName}).limit(1).next();
        if (user == null) {
            res.send({state: 1});
        } else {
            if (user.password == password) {
                res.send({state: 3, user_id: user._id});
            } else {
                res.send({state: 2});
            }
        }
    }).catch(function (e) {
        res.send({state: 0});
    });
}

function findPassword(userName, email, res) {
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
                    from: 'shoestash<786014381@qq.com>',
                    to: user.email,
                    subject: 'shoestash找回密码',
                    html: '您的新随机密码为: ' + newPassword + " <br>建议登录成功后修改您的密码，并妥善保管您的新密码。<br><br>这是一封自动发送的邮件：如果您并未要求但接收到这封信件，您不需要进行任何操作。  <span  style='color:#0000ff'>shoestash技术支持</span>"
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
}


function changePassword(user_id, oldpassword, newpassword, res) {
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
}

function changeUsername(user_id, username, res) {
    co(function *() {
        yield getUserCollection().update({_id: ObjectID(user_id)}, {$set: {userName: username}});
        res.send({state: 1});
    }).catch(function (e) {
        res.send({state: 0});
    });
}

function changeSex(user_id, sex, res) {
    co(function *() {
        yield getUserCollection().update({_id: ObjectID(user_id)}, {$set: {sex: sex}});
        res.send({state: 1});
    }).catch(function (e) {
        res.send({state: 0});
    });
}

function changeText(user_id, text, res) {
    co(function *() {
        yield getUserCollection().update({_id: ObjectID(user_id)}, {$set: {text: text}});
        res.send({state: 1});
    }).catch(function (e) {
        res.send({state: 0});
    });
}

function changeEmail(user_id, email, res) {
    co(function *() {
        yield getUserCollection().update({_id: ObjectID(user_id)}, {$set: {email: email}});
        res.send({state: 1});
    }).catch(function (e) {
        res.send({state: 0});
    });
}

function changeUserPic(user_id, picurl, res) {
    co(function *() {
        yield getUserCollection().update({_id: ObjectID(user_id)}, {$set: {photo: picurl}});
        res.send({state: 1});
    }).catch(function (e) {
        res.send({state: 0});
    });
}

//用户主页信息
function getMyPageData(user_id, res) {
    co(function *() {
        let userInfo = yield getUserCollection().find({_id: ObjectID(user_id)}).limit(1).next();
        let fansSum = yield getUserCollectionConcern().find({user_id: user_id}).count();
        let concernSum = yield getUserCollectionConcern().find({whoFollowhim: user_id}).count();
        let dongtaiInfor = yield  getUserCollectionDongtai().find({user_id: user_id}).limit(3).sort({timeStamp: -1}).toArray();
        let shoesInfo = [];
        for (let i = 0; i < userInfo.collectionshoe.length; i++) {
            let curShoe = yield getUserCollectionShoes().find({_id: ObjectID(userInfo.collectionshoe[i])}).limit(1).next();
            shoesInfo.push(curShoe);
        }
        res.send({
            state: 1,
            userInfo: userInfo,
            fansSum: fansSum,
            concernSum: concernSum,
            dongtaiInfor: dongtaiInfor,
            shoesInfo: shoesInfo
        });
    }).catch(function (e) {
        res.send({state: 0});
    });
}

//用户信息
function getuserInfor(user_id, res) {
    co(function *() {
        let userInfo = yield getUserCollection().find({_id: ObjectID(user_id)}).limit(1).next();
        res.send({state: 1, userInfo: userInfo});
    }).catch(function (e) {
        res.send({state: 0});
    });
}


function getcare(user_id, res) {
    co(function *() {
        let carelist = yield getUserCollectionConcern().find({whoFollowhim: user_id}).toArray();
        let careInfo = [];
        for (let i = 0; i < carelist.length; i++) {
            let curUserInfo = yield getUserCollection().find({_id:ObjectID(carelist[i].user_id)}).limit(1).next();
            careInfo.push(curUserInfo)
        }
        res.send({state: 1, careInfo: careInfo});
    }).catch(function (e) {
        res.send({state: 0});
    });
}


function getfans(user_id, res) {
    co(function *() {
        let fanslist = yield getUserCollectionConcern().find({user_id: user_id}).toArray();
        let fansInfo = [];
        for (let i = 0; i < fanslist.length; i++) {
            let curUserInfo = yield getUserCollection().find({_id:ObjectID(fanslist[i].whoFollowhim)}).limit(1).next();
            fansInfo.push(curUserInfo)
        }
        res.send({state: 1, fansInfo: fansInfo});
    }).catch(function (e) {
        res.send({state: 0});
    });
}

function iscare(user_id,other_id, res) {
    co(function *() {
        let carenum = yield getUserCollectionConcern().find({user_id: other_id,whoFollowhim: user_id}).count();
        if (carenum==1){
            res.send({state: 1, iscare: 1});
        }else{
            res.send({state: 1, iscare: 0});
        }
    }).catch(function (e) {
        res.send({state: 0});
    });
}

function caresonmeone(user_id,other_id, res) {
    co(function *() {
         yield getUserCollectionConcern().insert({user_id: other_id,whoFollowhim: user_id});
            res.send({state: 1});
    }).catch(function (e) {
        res.send({state: 0});
    });
}

function uncaresonmeone(user_id,other_id, res) {
    co(function *() {
        yield getUserCollectionConcern().remove({user_id: other_id,whoFollowhim: user_id});
            res.send({state: 1});
    }).catch(function (e) {
        res.send({state: 0});
    });
}

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


module.exports = {
    userRegister: userRegister,
    userLogin: userLogin,
    findPassword: findPassword,
    changePassword: changePassword,
    changeUsername: changeUsername,
    changeSex: changeSex,
    changeText: changeText,
    changeEmail: changeEmail,
    changeUserPic: changeUserPic,
    getMyPageData: getMyPageData,
    getuserInfor: getuserInfor,
    getcare: getcare,
    getfans: getfans,
    iscare:iscare,
    caresonmeone:caresonmeone,
    uncaresonmeone:uncaresonmeone
};