var cache = {}
    ,fs = require('fs')
module.exports = function(rpath,cb) {
    if (cache[rpath]) {
        return process.nextTick(function(){
            cb(false, cache[rpath]);
        });
    }
    fs.readFile(__dirname+'/'+rpath,function(error,data){
        if (!error) {
            cache[rpath] = data;
        }
        cb(error, data);
    });
}