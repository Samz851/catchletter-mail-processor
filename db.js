
var MongoClient = require('mongodb').MongoClient

var state = {
    db: null,
}

exports.connect = function (url, done) {
    if (!state.db){
        var opts = {db: {authSource: 'admin'}, useNewUrlParser: true, useUnifiedTopology: true }
        MongoClient.connect(url, opts, function (err, db) {
            if (!err){
                // console.log(db);
                state.db = db;
                state.collections = {
                    websites: db.collection('websites', (err, collection)=>{console.log(err)}),
                    mailImages: db.collection('mailImages', (err, collection)=>{console.log(err)}),
                    customer: db.collection('customer', (err, collection)=>{console.log(err)}),
                    alerts: db.collection('alerts', (err, collection)=>{console.log(err)})
                };
                done();
            }else{
                console.log(err);
            }
        })
    }


}

exports.get = function () {
    return state.db
}
exports.collections = function(){
    if(state.collections !== undefined){
        return state.collections;
    }else{
        setTimeout(function(){
            return state.collections;

        }, 200)
    }
}


exports.close = function (done) {
done = done || function() {};
    if (state.db) {
        state.db.close(function (err, result) {
            state.db = null
            state.mode = null
            done(err)
        })
    }
}
