
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
    console.log();
    return paramObj;
}

let url = `http://10.0.8.2/MK_ReportModule/ReportManage/GetReportData?reportId=50018f53-3576-4689-90bd-24665f81ad83&queryJson=%7B%22SearchDate%22%3A%222021-07-11%22%2C%22SearchType%22%3A%22%22%2C%22type%22%3A%220%22%7D&_=1626060889247`;

getParam(url);