var fs = require("fs");
var request = require("request");

const getWxAccessToken = async () => {
    return new Promise(async function(resolve, reject) {
        try{
            //读取本地accessToken信息
            var accessData=fs.readFileSync('wxaccesstoken/accesstoken.txt','utf-8');
            //判断是否过期
            let accessDataObj = JSON.parse(accessData);
            //上次获取accessToken与本次时间差
            let diffOfTime = new Date().getTime() - accessDataObj.last_get_time;
            if(diffOfTime / 1000 > 7000){
                //重新获取
                let result = await requestWxAccessToken();
                let accessToken = {
                    "access_token" :JSON.parse(result).access_token,
                    "last_get_time" : new Date().getTime(),
                    "expires_in" : JSON.parse(result).expires_in
                };
                //保存到文件
                var fd = fs.openSync('wxaccesstoken/accesstoken.txt','rs+');
                fs.writeSync(fd,JSON.stringify(accessToken));
                fs.closeSync(fd);
                //返回accessToken
                resolve(JSON.parse(result).access_token);
            }else {
                resolve(accessDataObj.access_token);
            }
        }catch (e) {
            reject(e);
        }
    });
};

//请求accessToken向微信服务器
function  requestWxAccessToken(){
    return new Promise(async function(resolve, reject) {
        let appid = `wx77e2cfa8e7c2cd62`;
        let secret = `5e6a0b7b01fcd379ccbfdf08ecb6a0d7`;
        //获取access_token
        let accessTokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;

        request({
            url: accessTokenUrl,//请求路径
            //url: "http://www.baidu.com",//请求路径
            method: "GET",//请求方式，默认为get
            headers: {//设置请求头
                "content-type": "application/json",
            }
            //post参数字符串
        }, function(error, response, body) {
            if(error){
                loggerError.error("来自requestWxAccessToken:"+error);
                reject("来自requestWxAccessToken:"+error);
            }
            console.log("请求accessToken成功！");
            //console.log(response);
            resolve(body);
        });
    });
}

module.exports = {
    getWxAccessToken
}
