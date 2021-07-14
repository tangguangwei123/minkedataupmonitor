const puppeteer = require('puppeteer');
const request = require("request");
const fs = require("fs");
var moment = require("moment");
const {getWxAccessToken} = require("./wxaccesstoken/getWxAccessToken");
var logs = require("./logs/loggerFile");
var loggerFile = logs.loggerFile;

//定义用户名密码对象数组
let users = [{
    username: "44090",
    password: "cs707196",
    org: "茂名市中心血站",
    active: true,
},{
    username: "14030",
    password: "xn662456",
    org: "阳泉市中心血站",
    active: true,
},{
    username: "35020",
    password: "kx718627",
    org: "厦门市中心血站",
    active: true,
},{
    username: "23010",
    password: "ic351136",
    org: "黑龙江省血液中心",
    active: true,
},{
    username: "23050",
    password: "eq905284",
    org: "双鸭山市中心血站",
    active: true,
},{
    username: "23051",
    password: "ik986243",
    org: "宝清县中心血库",
    active: true,
},{
    username: "23052",
    password: "dx732729",
    org: "饶河县中心血库",
    active: true,
},{
    username: "23070",
    password: "yc572969",
    org: "伊春市中心血站",
    active: true,
},{
    username: "23081",
    password: "fo168332",
    org: "同江市中心血库",
    active: true,
},{
    username: "23082",
    password: "sp590999",
    org: "富锦市中心血库",
    active: true,
},{
    username: "23083",
    password: "nx482065",
    org: "抚远县中心血库",
    active: true,
},{
    username: "23090",
    password: "rf396220",
    org: "七台河市中心血站",
    active: true,
},{
    username: "23120",
    password: "fi216799",
    org: "绥化市中心血站",
    active: true,
}];

main()
/**
 * 入口函数
 */
async function main(){
    loggerFile.info("开始执行任务！");
    //遍历所有需要监测的用户列表
    for (let i in users){
        if(users[i].active){
            await getMonitorData(users[i]);
            //等待10s
            sleep(20000);
        }
    }
    loggerFile.info("任务结束！");
}

async function getMonitorData(user){
    try {
        loggerFile.info(`开始查询:${user.org}上报数据！`);
        const browser = await puppeteer.launch({headless: true,  args: ['--disable-features=site-per-process'], defaultViewport: {width: 1280, height: 8000}});
        const page = await browser.newPage();
        await page.goto('http://10.0.8.2/');
        /**
         * 监听response
         * 查找各项报销统计
         */
        await page.on('response',async response => {
            let request = response.request();
            let resourceType = request.resourceType();
            //得到请求地址
            let url = request.url();
            if(url.indexOf("MK_ReportModule/ReportManage/GetReportData") > -1){
                //得到请求日期
                let paramListObj = getParam(url);
                if(paramListObj == null){
                    return;
                }
                let reportresult = await response.json();
                let resultItem = reportresult["listData"][0];
                resultItem["SearchDate"] = JSON.parse(paramListObj["queryJson"])["SearchDate"];
                //调用函数上川岛微信小程序云开发
                await upMonitorData(resultItem);
                loggerFile.info(`${user.org}上传云数据库完毕!`);
                if(JSON.parse(paramListObj["queryJson"])["SearchDate"] === moment().format("YYYY-MM-DD")){
                    loggerFile.info(`${user.org} 查询完毕,关闭浏览器!`);
                    await browser.close();
                }
            }
        });
        //查找用户名输入框位置
        let usernameInputElement = await page.$("#mk_username");
        let usernameInputElementPosition = await usernameInputElement.boundingBox();
        //点击用户名输入框
        await page.mouse.click(usernameInputElementPosition.x + 10, usernameInputElementPosition.y + 5);
        //输入密码
        await page.keyboard.sendCharacter(user.username);
        //查找密码输入框位置
        let passwordElement = await page.$("#mk_password");
        let passwordElementPosition = await passwordElement.boundingBox();
        //点击用户名输入框
        await page.mouse.click(passwordElementPosition.x + 10, passwordElementPosition.y + 5);
        //输入密码
        await page.keyboard.sendCharacter(user.password);
        //查找登录按钮位置
        let loginButton = await page.$("#mk_login_btn");
        let loginButtonPosition = await loginButton.boundingBox();
        //点击登录
        let loginResult = await page.mouse.click(loginButtonPosition.x + 10, loginButtonPosition.y + 5, {delay: 1000});
        //页面登录成功后，需要保证redirect 跳转到请求的页面
        loggerFile.info(`${user.org} 开始查询今天数据!`);
        await page.waitForNavigation();
        await page.waitFor(10000);
        const frame = page.frames().find(frame => frame.url().indexOf("/Home/AdminDesktop") > -1);
        //点击用户名输入框
        await frame.click("#btn_Search_Time");
        //输入今天日期字符串
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.keyboard.sendCharacter(moment().format("YYYY-MM-DD"));
        //点击【查找】按钮
        await frame.click("#mk_search");
        return;
    }catch (e){
        loggerFile.error(`${user.org}执行异常:`+e.toString());
    }
};

/**
 * 停留几秒
 * 单位：毫秒
 * @param numberMillis
 */
function sleep(numberMillis) {
    var now = new Date();
    var exitTime = now.getTime() + numberMillis;
    while (true) {
        now = new Date();
        if (now.getTime() > exitTime)
            return;
    }
}
/**
 * 提供给小程序端监控上传结果
 * v1.2.0
 */
async function upMonitorData(dataArray){
    //云环境ID
    let env = 'tgw-4gsif7kwf1ee3093';
    //云函数名称
    let methodName = 'monitordata';
    try{
       const accessToken = await getWxAccessToken();

       let postUrl = `https://api.weixin.qq.com/tcb/databaseadd?access_token=${accessToken}`;
       let postData = {
           "env": env,
           "query": `db.collection(\"dataupmonitor\").add({data : ${JSON.stringify(dataArray)}})`
       }
       //console.log(postData);
       request({
           url: postUrl,//请求路径
           //url: "http://www.baidu.com",//请求路径
           method: "POST",//请求方式，默认为get
           headers: {//设置请求头
               "content-type": "application/json",
           },
           body: JSON.stringify(postData)
           //post参数字符串
       }, function(error, response, body) {
           if(error){
               loggerFile.error(error);
               return;
           }
           loggerFile.info(body);
       });
   }catch (e) {
        loggerFile.error(e);
   }
}

//upMonitorData();
/**
 *参数解析得到参数对象
 */
function getParam(url){
    url = unescape(url);
    if(!url){
        return null;
    }
    //得到参数
    if(url.indexOf("?") < 0){
        return null;
    }
    let paramStr = url.substr(url.indexOf("?") + 1);
    //得到参数键值对列表
    let paramAaary = paramStr.split("&");
    if(paramAaary.length === 0){
        return null;
    }
    let paramObj = {};
    for (let i in paramAaary){
        let paramItem = paramAaary[i].split("=");
        paramObj[paramItem[0]] = paramItem[1];
    }
    return paramObj;
}
