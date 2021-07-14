//日志
var log4js = require("log4js");
var log4js_config = require("./logconfig");
log4js.configure(log4js_config);
var loggerFile = log4js.getLogger("file");
var loggerError = log4js.getLogger("error");
var logs = {
    loggerFile :loggerFile,
    loggerError :loggerError
}

module.exports = logs;
