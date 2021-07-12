const puppeteer = require('puppeteer');
const request = require("request");
const {getWxAccessToken} = require("./wxaccesstoken/getWxAccessToken");

//定义用户名密码对象数组
let users = [{
    username: "44090",
    password: "cs707196"
}];

async function getMonitorData(){
    try {
        const browser = await puppeteer.launch({headless: false, defaultViewport: {width: 1280, height: 8000}});
        const page = await browser.newPage();
        await page.goto('http://10.0.8.2/');
        //查找用户名输入框位置
        let usernameInputElement = await page.$("#mk_username");
        let usernameInputElementPosition = await usernameInputElement.boundingBox();
        //点击用户名输入框
        await page.mouse.click(usernameInputElementPosition.x + 10, usernameInputElementPosition.y + 5);
        //输入密码
        await page.keyboard.sendCharacter(users[0].username);
        //查找密码输入框位置
        let passwordElement = await page.$("#mk_password");
        let passwordElementPosition = await passwordElement.boundingBox();
        //点击用户名输入框
        await page.mouse.click(passwordElementPosition.x + 10, passwordElementPosition.y + 5);
        //输入密码
        await page.keyboard.sendCharacter(users[0].password);
        //查找登录按钮位置
        let loginButton = await page.$("#mk_login_btn");
        let loginButtonPosition = await loginButton.boundingBox();
        //点击登录
        let loginResult = await page.mouse.click(loginButtonPosition.x + 10, loginButtonPosition.y + 5, {delay: 1000});
        //等待10秒，等待登录后渲染结束
        sleep(10);
        /**
         * 查找各项报销统计
         */
        page.on('response',async response => {
            let request = response.request();
            let resourceType = request.resourceType();
            //得到请求地址
            let url = request.url();
            if(url.indexOf("MK_ReportModule/ReportManage/GetReportData") > -1){
                //得到请求日期
                let paramListObj = getParam(url);
                if(paramListObj == null){
                    console.log("抓取到的参数为null");
                    return;
                }
                let reportresult = await response.json();
                let resultItem = reportresult["listData"][0];
                resultItem["SearchDate"] = JSON.parse(paramListObj["queryJson"])["SearchDate"];
                //调用函数上川岛微信小程序云开发
                upMonitorData(resultItem);
            }
        });
    }catch (e){
        console.error("执行异常:"+e.toString())
    }
};

getMonitorData();

/**
 * 停留几秒
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
               console.error(error);
               return;
           }
           console.info(body);
       });
   }catch (e) {
        console.error(e);
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