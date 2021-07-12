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
                let reportresult = await response.json();
                console.log(url);
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
 * 加载今天上报日志上传到小程序云端 提供给小程序端监控上传结果
 * v1.2.0
 */
async function upMonitorData(){
    //云环境ID
    let env = 'tgw-4gsif7kwf1ee3093';
    //云函数名称
    let methodName = 'monitordata';
    try{
       const accessToken = await getWxAccessToken();

       let postUrl = `https://api.weixin.qq.com/tcb/databaseadd?access_token=${accessToken}`;
       let dataArray = [
                {
                    '确认情况': '',
                    '省份': '广东',
                    '编码': '44090',
                    '血站名称': '茂名市中心血站',
                    '一般检测': 168,
                    '筛查总数': 165,
                    '采集总人次': 108,
                    '全血人次': 106,
                    '血小板人次': 2,
                    '采集总量': 197,
                    '全血总量': 194,
                    '血小板总量': 3,
                    '检测总数': 6,
                    '供血总量': 238,
                    '供红细胞量': 58,
                    '供血小板量': 10,
                    '调剂总量': 0,
                    '报废总量': 3,
                    '库存总量': 0,
                    '红细胞存量': 0,
                    '血小板存量': 0
                }
            ];
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
 *
 */
function getParam(url){
    if(!url){
        return null;
    }
    //得到参数
    if(url.indexOf("?") < 0){
        return null;
    }
    let paramStr = url.substr(url.indexOf("?"));
    console.log(paramStr);
}