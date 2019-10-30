// const SimpleImap = require('./imap-listener');
// var MailListener = require("mail-listener-fixed");
var MailListener = require("mail-listener2");
var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/email-handler.log', {flags : 'w'});
var log_stdout = process.stdout;
var mailHandler = require('./mail-handler');
var handler = new mailHandler;

console.log = function(d) { //
  log_file.write(util.format(d) + '\n\n\n\n\n\n');
  log_stdout.write(util.format(d) + '\n');
};

host = {domain: 'mail.catchletter.com', user: 'notifications@cldev.pw', pass: 'KxsFb54Jqh34YE4TxL'};
// var options = {
//     user: host.user,
//     password: host.pass,
//     host: host.domain,
//     port: 993, // imap port
//     tls: true,// use secure connection
//     tlsOptions: { rejectUnauthorized: false },
//     mailbox: 'INBOX'
// };
var options = {
  username: host.user,
  password: host.pass,
  host: host.domain,
  port: 993, // imap port
  tls: true,// use secure connection
  tlsOptions: { rejectUnauthorized: false },
  fetchUnreadOnStart: true,
  markSeen: true,
  mailbox: "INBOX", // mailbox to monitor
  searchFilter: ["UNSEEN",['SINCE', 'October 7, 2019']]
}

var mailListener = new MailListener(options);

mailListener.start(); // start listening
 
// stop listening
//mailListener.stop();
 
mailListener.on("server:connected", function(){
  console.log("imapConnected");
});
 
mailListener.on("server:disconnected", function(){
  console.log("imapDisconnected");
});
 
mailListener.on("error", function(err){
  mailListener.start();
});
 
mailListener.on("mail", function(mail, seqno, attributes){
  // console.log('arguements');
  // console.log(arguments);
  if(!attributes){
    attributes = {flags: "",uid: seqno}
  }
  // do something with mail object including attachments
  //SAM the mail obj is the parsed html
  // console.log("emailParsed: " + JSON.stringify(mail));
  // console.log("emailParsed: " + JSON.stringify(seqno));
  // console.log("emailParsed: " + JSON.stringify(attributes));


  handler.set_mailImageDoc(mail, attributes).then(function(mailObj){
    // console.log(data);
    if(mailObj.success){
      handler.process_email_images(mailObj.mailImageDoc).then(function(result){
        // console.log(result);
        if(result.success){
          handler.create_thumbnails(result.dir, result.at).then(function(thumbResult){
            // console.log(thumbResult);
            //Now Save the MailImageDoc to DB
            if(thumbResult.success){
              handler.save_mailImage(mailObj, attributes).then(function(result){
                console.log(result);
              }, function(err){
                console.log(err);
                mailListener.start();
              });
            }else{ mailListener.start();}
          });
        }else{ mailListener.start();}
      });
    }else{ mailListener.start();}

  });
  // mail processing code goes here
});




// var simpleImap = new SimpleImap(options);

// simpleImap.on('error', function(err) {
//   if (err) throw err;
// });

// simpleImap.on('end', function(mails) {
//   mails.forEach(mail => {
//     // console.log('coming up');
//     // console.log(mail.header['content-type']);
//     handler.parse_email(mail).then((result) => {
//       console.log(result);
//       // console.log(result.message.parsed);
//       // if(result.success && result.message.parsed.to && result.message.parsed.html){
//       //   handler.set_mailImageDoc(result.message)
//       //   .then(function(mailObj){
//       //     // console.log(mailObj);
//       //     //SAM After Parsing, pull website info from db

//       //     handler.process_email_images(mailObj.mailImageDoc)
//       //     .then((result)=>{
//       //       // console.log(result);
//       //       if(result.success){
//       //         handler.create_thumbnails(result.dir, result.at).then(function(thumbResult){
//       //           // console.log(thumbResult);
//       //           //Now Save the MailImageDoc to DB
//       //           if(thumbResult.success){
//       //             handler.save_mailImage(mailObj).then(function(result){
//       //               console.log(result);
//       //             }, function(err){
//       //               console.log(err);
//       //             });
//       //           }
//       //         }, function(err){
//       //           console.log(err);
//       //         });
//       //       }
//       //     }, (err)=>{
//       //       console.log(err);
//       //     })
//       //   }, function(err){
//       //     console.log(err);
//       //   });
//       //   simpleImap.getImap().addFlags(mail.attrs.uid, 'Deleted')

//       // }else{
//       //   // console.log(result.success);
//       //   // console.log(result)
//       // }
//     }, (err) => {
//       console.log('error processing');
//       console.log(err);
//   });
    
//   });
//   // simpleImap.getImap().closeBox((err)=>{
//   //   if (err) console.log(err);
//   // });
//   // console.log(mail);
// });
// simpleImap.start();