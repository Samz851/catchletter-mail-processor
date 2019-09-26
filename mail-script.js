const SimpleImap = require('./imap-listener');
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
var options = {
    user: host.user,
    password: host.pass,
    host: host.domain,
    port: 993, // imap port
    tls: true,// use secure connection
    tlsOptions: { rejectUnauthorized: false },
    mailbox: 'INBOX'
};
var simpleImap = new SimpleImap(options);

simpleImap.on('error', function(err) {
  if (err) throw err;
});

simpleImap.on('end', function(mails) {
  mails.forEach(mail => {
    // console.log('coming up');
    // console.log(mail.header['content-type']);
    handler.parse_email(mail).then((result) => {
      // console.log(result.message.parsed);
      if(result.success && result.message.parsed.to){
        handler.set_mailImageDoc(result.message)
        .then(function(mailObj){
          // console.log(mailObj);
          //SAM After Parsing, pull website info from db

          handler.process_email_images(mailObj.mailImageDoc)
          .then((result)=>{
            // console.log(result);
            if(result.success){
              handler.create_thumbnails(result.dir, result.at).then(function(thumbResult){
                // console.log(thumbResult);
                //Now Save the MailImageDoc to DB
                if(thumbResult.success){
                  handler.save_mailImage(mailObj).then(function(result){
                    console.log(result);
                  }, function(err){
                    console.log(err);
                  });
                }
              }, function(err){
                console.log(err);
              });
            }
          }, (err)=>{
            console.log(err);
          })
        }, function(err){
          console.log(err);
        });
        simpleImap.addFlags(mail.attrs.uid, 'Deleted')

      }else{
        // console.log(result.success);
        // console.log(result)
      }
    }, (err) => {
      console.log('error processing');
      console.log(err);
  });
    
  });
  simpleImap.closeBox();
  // console.log(mail);
});
simpleImap.start();