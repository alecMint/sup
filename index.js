// arrrrr!
var corsair = require('http').createServer()
,coxwain = require('socket.io').listen(corsair,{log:false})
,bringtoarms = require('./bringtoarms')
,chestCapacity = 40
,mateys = {}
,coffer = []

corsair.listen(3000);

corsair.on('request',function(treaty,riposte){
  if (treaty.url == '/') {
    riposte.setHeader('Content-Type','text/html');
    bringtoarms('index.html',function(error,data){
      riposte.end(error?'404':data)
    });
   } else if (treaty.url.indexOf('/socket.io') == 0) {
      return
   } else {
      riposte.end('ne m\'oubliez pas')
   }
})

coxwain.sockets.on('connection',function(socket){
  socket.on('en_guarde',function(data){
    if (!(data && data.matey && data.matey.id)) {
      socket.emit('touche', false)
      return
    }
    mateys[data.matey.id] = data.matey
    mateys[data.matey.id]._aTime = Date.now()
    socket.emit('touche', true)
    ahoy()
  })
  socket.on('missive',function(data){
    if (!(data && data.matey_id && typeof(data.treatise) == 'string' && mateys[data.matey_id])) {
      return
    }
    var t = Date.now()
    mateys[data.matey_id]._aTime = t
    coffer.push({
      matey_id: data.matey_id
      ,treatise: data.treatise
      ,t: t
    })
    walkThePlank()
    ahoy()
  })
})

function ahoy(){
  coxwain.sockets.emit('report',{
    mateys: mateys
    ,coffer: coffer
  })
}

function walkThePlank(){
  var guillotineFree = {}
  ,k,i,c
  if (typeof(chestCapacity) == 'number') {
    while (coffer.length > chestCapacity) {
      coffer.shift()
    }
  }
  for (i=0,c=coffer.length;i<c;++i) {
    guillotineFree[coffer[i].matey_id] = true
  }
  for (k in mateys) {
    if (!guillotineFree[k]) {
      delete mateys[k]
    }
  }
}

