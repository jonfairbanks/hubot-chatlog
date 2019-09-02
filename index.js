var token = process.env.HUBOT_SLACK_TOKEN;
var logsFolder = process.env.HUBOT_CHATLOG_LOCATION || "/app/logs/";

var fs = require('fs');
var moment = require('moment-timezone');
var WebClient = require('@slack/web-api').WebClient;
var streamOpts = null;
var web = new WebClient(token);

module.exports = function(robot) {
    robot.hear(/(.*)/i, function(msg){
        var ts = moment.tz("America/Los_Angeles").format('h:mm:ssa z');
        var messageText = msg.message.rawMessage.text;
        var userName = "Unknown";
        try{
            userName = (msg.message.rawMessage.user.real_name) ? msg.message.rawMessage.user.real_name : "unknown";
        }catch(err){
            console.log('Error Saving Message to Chat Log: ' + err);
        }

        var channelID = msg.message.rawMessage.channel;
        
        web.channels.info({ channel: channelID })
        .then(msg => {
            if(msg.channel.name.length > 1)
                var channelName = msg.channel.name
                if(channelName) {
                    var data = ('[' + channelID + '](' + userName + ' in #' + channelName + ' @ ' + ts + ') \n' + messageText + '\n\n');
                    var savePath = logsFolder + channelName + '.log';
                    fs.appendFile(savePath, data, function (err, msg) {
                        if (err) {
                            console.log('Error Saving Message to Chat Log: \n');
                            throw err;
                        }
                    });
                }
        })
        .catch(e => { channelName = userName + "-unknown" })
    });

    robot.respond(/chatlog/i, function(msg){
        if(msg.message.user.slack.is_admin != true) {
            msg.send('You don\'t have permission to do that. :closed_lock_with_key:');
        }else {
            var channelID = msg.message.rawMessage.channel;
            var userName = "Unknown";
            try{
                userName = (msg.message.rawMessage.user.real_name) ? msg.message.rawMessage.user.real_name : "unknown";
            }catch(err){
                console.log('Error Saving Message to Chat Log: ' + err);
            }
            web.channels.info({ channel: channelID })
            .then(msg => {
                if(msg.channel.name.length > 1) {
                    var channelName = msg.channel.name
                    var filePath = logsFolder + channelName + '.log';
                    streamOpts = {
                        file: fs.createReadStream(filePath),
                        channels: channelID,
                        title: 'Chat Log for #' + channelName
                    };
        
                    web.files.upload(streamOpts, function(err, res) {
                        if (err) {
                            console.log(err)
                            msg.send('```' + err + '```');
                        } else {
                            //console.log(res); // Uncomment to see API response
                        }
                    });
                }
            })
            .catch(e => { channelName = userName + "-unknown" })
        }
    });
}
