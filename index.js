// arrrrr!
var corsair = require('http').createServer()
,coxwain = require('socket.io').listen(corsair,{log:false})
,captainsLog = require('fs')
,bringtoarms = require('./bringtoarms')
,chestCapacity = 100
,mateyResurrectionWindow = 1000*20
,decks = {}
,processStart = Date.now()

corsair.listen(3000);

corsair.on('request',function(treaty,riposte){
  var res,qs,tmp
  if (treaty.url.indexOf('/api') == 0) {
    qs = require('url').parse(treaty.url,true).query
    res = JSON.stringify(api( treaty.url.substr('/api'.length), qs ))
    if (qs.callback) {
      riposte.setHeader('Content-Type','text/javascript')
      res = qs.callback+'('+res+')'
    } else {
      riposte.setHeader('Content-Type','text/json')
    }
    riposte.end(res)
  } else if (treaty.url.indexOf('/log/') == 0) {
    captainsLog.readFile('.'+treaty.url,function(error,data){
      riposte.end(error ? ':(' : data)
    })
  } else if (treaty.url == '/flush') {
    decks = {}
    riposte.end('flushed')
  } else if (treaty.url == '/time') {
    tmp = Date.now()
    res = {
      now: tmp
      ,timeAlive: tmp-processStart
    }
    riposte.end(JSON.stringify(res))
  } else if (treaty.url.indexOf('/socket.io') == 0) {
    return
  } else {
    riposte.end('ne m\'oubliez pas')
  }
})

coxwain.sockets.on('connection',function(socket){
  socket.on('en_guarde',function(data){
    if (!(data && data.matey && data.matey.id && typeof(data.deck) == 'string')) {
      socket.emit('touche', false)
      return
    }
    var deck = getDeck(data.deck)
    ,matey = deck.mateys[data.matey.id]
    socket.deck_id = data.deck
    socket.matey_id = data.matey.id
    if (!matey) {
      matey = deck.mateys[data.matey.id] = data.matey
    }
    matey._timeOfBirth = Date.now()
    socket.emit('touche', deck)
    if (!deck.mateys[data.matey.id]._active) {
      matey._active = true;
      deck.logMissive(data.matey.id,'%user% has joined','system').ahoy()
    }
  })
  socket.on('missive',function(data){
    if (!(data && data.matey_id && typeof(data.treatise) == 'string' && typeof(data.deck) == 'string')) {
      return
    }
    var deck = getDeck(data.deck)
    if (!deck.mateys[data.matey_id]) {
      return
    }
    deck.logMissive(data.matey_id,data.treatise).walkThePlank().ahoy()
  })
  socket.on('disconnect',function(){
    var deck = getDeck(socket.deck_id)
    ,matey = deck.mateys[socket.matey_id]
    if (matey) {
      matey._timeOfDeath = Date.now()
      setTimeout(function(){
        var deck = getDeck(socket.deck_id)
        ,matey = deck.mateys[socket.matey_id]
        if (!(matey && typeof(matey._timeOfDeath) == 'number' && matey._timeOfBirth < matey._timeOfDeath)) {
          return
        }
        matey._active = false
        deck.logMissive(matey.id,'%user% has left','system').ahoy()
      },mateyResurrectionWindow)
    }
  })
})

function getDeck(deckId){
  if (decks[deckId]) {
    return decks[deckId]
  }
  return decks[deckId] = new Deck(deckId)
}

function Deck(id){
  this.id = id
  this.mateys = {}
  this.coffer = []
  this.coffer_i = 0
}
Deck.prototype.logMissive = function(mateyId,treatise,type){
  var m = {
    id: this.coffer_i++
    ,matey_id: mateyId
    ,treatise: treatise
    ,t: Date.now()
  }
  if (typeof(type) == 'string') {
    m.type = type
  }
  this.coffer.push(m)
  if (this.coffer_i == 9007199254740992) {
    this.coffer_i = 0;
  }
  captainsLog.appendFile('./log/'+this.id.replace(/[\/.]/g,'_'),JSON.stringify(m)+'\n')
  return this
}
Deck.prototype.ahoy = function(){
  coxwain.sockets.emit('report_'+this.id,this)
  return this
}
Deck.prototype.walkThePlank = function(){
  var guillotineFree = {}
  ,k,i,c
  if (typeof(chestCapacity) == 'number') {
    while (this.coffer.length > chestCapacity) {
      this.coffer.shift()
    }
  }
  for (i=0,c=this.coffer.length;i<c;++i) {
    guillotineFree[this.coffer[i].matey_id] = true
  }
  for (k in this.mateys) {
    if (!guillotineFree[k]) {
      delete this.mateys[k]
      continue;
    }
  }
  return this
}

function api(path,opts){
  var error = false
  ,data
  do {
    if (path.indexOf('/get/deck') == 0) {
      if (!opts.deck_id) {
        error = 'missing deck_id'
        break
      }
      data = getDeck(opts.deck_id)
      break
    }
    error = 'unknown route'
  } while (false)
  return error === false ? {success:1, data:data} : {success:0, message:error}
}
