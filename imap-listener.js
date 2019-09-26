var Imap = require('imap'),
	util = require('util'),
	events = require('events');

var SimpleImap = function(options) {

	this.options = options;
	this.imap = null;
	
	this.start = function() {
		if (this.imap === null) {
			this.imap = new Imap(this.options);

			var selfImap = this.imap,
				self = this;

			selfImap.on('ready', function() {
				self.emit('ready');

				selfImap.openBox(self.options.mailbox, false, function() {
					self.emit('open');
				});
			});
			let emitArray = [];

			selfImap.on('mail', function(num) {
				console.log('recieved mail');
				selfImap.search(['UNSEEN', ['SINCE', 'May 20, 2000']], function(err, result) {
					if (result.length) {
						// console.log('results length');
						function chunk(array, size) {
							const chunked_arr = [];
							let index = 0;
							while (index < array.length) {
							  chunked_arr.push(array.slice(index, size + index));
							  index += size;
							}
							return chunked_arr;
						  }

						// console.log(result)
						var emailChunks = chunk(result, 5);
						//   for(chunk of emailChunks){
							//   console.log(chunk);
							let emitObj = {}

							var f = selfImap.fetch(result, {
								markSeen: false,
								struct: true,
								bodies: ''
							});
	
							f.on('message', function(msg, seqNo) {
								msg.once('attributes', (attr) => {
									// console.log('FOUND ATTRIBUTE')
									emitObj.attrs = attr;
	
								})
								msg.on('body', function(stream, info) {
									var buffer = '';
	
									stream.on('data', function(result) {
										buffer += result.toString('utf8');
										emitObj.buffer = buffer;
										emitObj.header = Imap.parseHeader(buffer);
										// console.log(buffer);
										// self.emit('process', emitObj);
	
									});
	
									stream.once('end', function() {
									});
								});
								msg.once('end', function(){
									emitArray.push(JSON.parse(JSON.stringify(emitObj)));
									// console.log('pushed length' + emitArray.length);
									// console.log(emitArray.length)
									if(emitArray.length == 3){
										// console.log(emitArray[0].attrs.uid);
										// console.log(emitArray[1].attrs.uid);
										// console.log(emitArray[2].attrs.uid);
									}
								})
							});
							f.on('end', function(){
	
								emitArray.forEach(function(item){
									// console.log('emit array');
									// console.log(item.attrs.uid);
								})
								self.emit('end', emitArray);
	
							});
							f.on('error', function(err){
								console.log(err);
							})
						//   }
					}else{
                        console.log('No Emails Founds')
                    }
				});
			});

			selfImap.on('end', function() {

			});

			selfImap.on('error', function(err) {
				console.log(err)
				self.emit('error', err);
			});
			
			selfImap.on('close', function(hadError) {
				self.emit('close', hadError);
			});
		}
		
		this.imap.connect();
	}
	
	this.stop = function() {
		this.imap.destroy();
	}
	
	this.restart = function() {
		this.stop();

		if (arguments.length >= 1)
			this.options = arguments[0];

		this.start();
	}

	this.getImap = function() {
		return this.imap;
	}
};

util.inherits(SimpleImap, events.EventEmitter);

module.exports = SimpleImap