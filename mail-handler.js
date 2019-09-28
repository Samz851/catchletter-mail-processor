// const SimpleImap = require('./imap-listener');
const fbParser = require('mailparser-mit').MailParser;
const Parser = require('mailparser').simpleParser;
const path = require('path');
const ObjectId = require('mongodb').ObjectID;
const webshot = require('webshot');
const compress = require('compress-images');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require("fs");
const db = require('./db');

class MailHandler {
    
    constructor(){
        // this.host = method == 'main' ? {domain: 'mail.catchletter.com', user: 'notifications@cldev.pw', pass: 'KxsFb54Jqh34YE4TxL'} : {domain: 'custom1.catchletter.com', user: 'notifications@custom1.cldev.pw', pass: 'pC5j8vS6MDpT5gwH'}
        db.connect('mongodb://catchlroot:R%40w%40n851@34.68.172.86:27017/catchlDBDEV', function (err) {
            //SAM
            if (err) throw err;
            console.log('DB connection success');
        });
        this.transporter = nodemailer.createTransport({
            host: 'mail.catchletter.com',
            port: 587,
            auth: {
                user: 'no-reply@catchletter.com',
                pass: '12345678'
            },
            tls: {
                rejectUnauthorized: false
            }
        });
        

    }
    readHTMLFile(path) {
        return new Promise(function(resolve, reject){
            fs.readFile(path, {
                encoding: 'utf-8'
            }, function (err, html) {
                if (err) {
                    reject(err);
                } else {
                    resolve(html);
                }
            });
        })

    };
    send_alert(mailObj){
        let filePath = path.join(__dirname, 'emailTemplates', 'alerts.html');
        return new Promise((resolve, reject) => {
            db.collections().customer.findOne({_id: mailObj.website.user_id}).then((success, err) => {
                if(err) throw err;

                this.readHTMLFile(filePath).then((html) => {
                    // console.log('success item');
                    // console.log(success);
                    var template = handlebars.compile(html);
                    let emailDomain = mailObj.website.emailDomain;
                    var buff = new Buffer(emailDomain);
                    var base64dataForEmail = buff.toString('base64');
                    let unique_id = mailObj.website.unique_id.toString();
                    var buff1 = new Buffer(unique_id);
                    var base64dataForunique_id = buff1.toString('base64');
                    let uid = mailObj.mailImageDoc.uid.toString();
                    var buff2 = new Buffer(uid);
                    var base64dataForUid = buff2.toString('base64');
                    let emailId1 = mailObj.website._id.toString();
                    var buff3 = new Buffer(emailId1);
                    var emailId = buff3.toString('base64');
                    var replacements = {
                        WEBSITENAME: mailObj.website.website_name,
                        USER: success.first_name,
                        websiteLink: "https://app.catchletter.com",
                        Link: "https://app.catchletter.com/emailDetail/" + base64dataForEmail + "?emailDomain=" + base64dataForEmail + "&emailId=" + emailId + '&uniqueId=' + base64dataForunique_id + '&uid=' + base64dataForUid
                    };
                    var htmlToSend = template(replacements);
                    var mailOptions = {
                        from: 'no-reply@catchletter.com',
                        to: [success.email,'samz.otb@gmail.com'],
                        subject: 'CatchLetter Alert: ' + mailObj.website.website_name + ' has sent their first newsletter',
                        html: htmlToSend
                    }
                    //TRYING
                    mailOptions.to = "samz.otb@gmail.com";
                    this.transporter.sendMail(mailOptions, function (error, info) {
                        if(error){
                            console.log('error sending');
                            // console.log(error);
                            reject(error);
                        }
                        resolve({success: true, message: 'Alert sent successfully'});
                    });
    
    
                }, function(err){})
            })
        })

    }
    save_mailImage(mailObj){
        // console.log(mailObj);
        
        return new Promise((resolve, reject) => {
            db.collections().mailImages.save(mailObj.mailImageDoc, (err) => {
                if(err) throw err;
                // console.log(this.website);
                // console.log('check alert')
                if(!mailObj.website.IsFirstAlertSent || mailObj.website.IsFirstAlertSent == 0){
                    // console.log('sending alert');
                    this.send_alert(mailObj).then((result) => {
                        // console.log('result is: ');
                        // console.log(result);
                        if(result.success){
                            mailObj.collection.update({
                                _id: ObjectId(mailObj.website._id)
                            }, {
                                    $set: {
                                        IsFirstAlertSent: 1
                                    }
                                }, {
                                    upsert: true
                                }, function (updateError, updateSuccess) {
                                    if(updateSuccess){
                                        console.log('Updated collection Alert');
                                        resolve({success: true, message: "image saved"});
                                    } 
                                    if(updateError){
                                        console.log('failed to update collection')
                                        reject({success: false, message: "failed to save images", error:updateError});
                                    } 
    
                                })
                        }else{
                            reject({success: false, message: 'failed to send alert'})
                        }
                    });
                }else{
                    resolve({success: true, message: "image saved"});
                }
            })
        }) 

    }
    create_thumbnails(user, nameOfFile ){
        // saving compressed screenshots to thumbnails ----------------------
        var input_path = './screenshots/'+user+'/'+ nameOfFile;
        var output_path = './thumbnails/'+user+'/';
        return new Promise((resolve, reject) => {
            // resolve({success: true, message: "screenshot created"});
            compress(input_path, output_path, {compress_force: false, statistic: true, autoupdate: true}, false,
                {jpg: {engine: 'mozjpeg', command: ['-quality', '60']}},
                {png: {engine: 'pngquant', command: ['--quality=20-50']}},
                {svg: {engine: 'svgo', command: '--multipass'}},
                {gif: {engine: 'gifsicle', command: ['--colors', '64', '--use-col=web']}}, (error, completed, statistic) => {
                    if(error) {
                        reject({success: false, error: error});
                    }else{
                        resolve({success: true, message: "screenshot created"});
                    }
            })
        })

    }
    process_email_images(mailObj){

        let nameOfFile = "screenshots_" + mailObj.parsedHtml.to[0].address + "_" + mailObj.uid + ".png";
        let user = mailObj.parsedHtml.to[0].address.split('@');
        user = user[0];

        //SAM check directories if not exist, create
        var dir = './screenshots/'+user;
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        
        var dirThumb = './thumbnails/'+user;
        if (!fs.existsSync(dirThumb)){
            fs.mkdirSync(dirThumb);
        }
        return new Promise((resolve, reject) => {
        //Check file if not exist, create
            if(!fs.existsSync('./screenshots/' +user+'/'+nameOfFile)) {
                // console.log('file doesnt exist');
                // console.log(this.mailObj.parsed)
                webshot(mailObj.parsedHtml.html, './screenshots/'+user+'/'+ nameOfFile, {shotSize:{width: 'all', height: 'all'}, siteType: 'html'}, (err) => {
                    if(!err){
                        resolve({success: true, message:"screenshot created", at: nameOfFile, dir: user});
                        // this.create_thumbnails(user, nameOfFile).then((result) => {
                        //     if(result.success){
                        //         resolve(result);
                        //     }else{
                        //         reject(error);
                        //     }
                        // });
                    } else {
                        reject({success: false, message: "failed to process email images with no error"})
                    }
                })

            } else {
                reject({success: false, message: "failed to process email images because file exists", error: 'screenshot exists'})
            }
        })


    }
    parse_email(mailObj){
        // console.log('veryfing email');

        // console.log('attrs');
        // console.log(mailObj.attrs.uid);

        return new Promise((resolve, reject) => {
            // this.mailObj = Object.assign({}, mailObj);

            let website={};
                // SAM Parse email

            let fallbackParser = new fbParser({defaultCharset: "utf-8"});
            fallbackParser.on("end", function(mail){
                // console.log(Object.keys(mail));
                mailObj.parsed = mail;
                if(mailObj.parsed){resolve({success: true, message: mailObj})}else{reject({success: false, msg: "failed to parse email"})}
            }, function(err){
                reject({success: true, message: err});
            });
            fallbackParser.write(mailObj.buffer);
            fallbackParser.end();
                   
        })

    }
    set_mailImageDoc(mailObj){
        return new Promise((resolve, reject) => {
            db.collections().websites.findOne({
                emailDomain: mailObj.parsed.to[0].address
            }).then(function(data){
                // console.log(data);
                if(data){
                    let website = data;
    
                    let flag = mailObj.attrs.flags.indexOf("Flagged") != -1 ? 1 : 0;

                    let mailImageDoc = {
                        website_id: ObjectId(website._id),
                        emailDomain: website.emailDomain,
                        unique_id: website.unique_id,
                        user_id: ObjectId(website.user_id),
                        uid: mailObj.attrs.uid,
                        tags: website.tags,
                        header: mailObj.header,
                        isRead: false,
                        flag: flag,
                        cDate: new Date(mailObj.header.date),
                        buffer: mailObj.buffer,
                        parsedHtml: mailObj.parsed
                    }
                    resolve({success: true, mailImageDoc: mailImageDoc, website: website})
                }
            }, function(err){
                reject({success: false, message: err});
            })
        })
    }
    connect(){
    }



}
module.exports = MailHandler;