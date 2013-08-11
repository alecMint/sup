// arrrrr!
var corsair = require('http').createServer()
,coxwain = require('socket.io').listen(corsair,{log:false})
,bringtoarms = require('./bringtoarms')
,chestCapacity = 100
,mateyResurrectionWindow = 1000*10
,decks = {}

corsair.listen(3000);

corsair.on('request',function(treaty,riposte){
  var res,qs
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
  } else if (treaty.url == '/flush') {
    decks = {}
    riposte.end('flushed')
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
    var t = Date.now()
    ,deck = getDeck(data.deck)
    ,matey = deck.mateys[data.matey.id]
    socket.deck_id = data.deck
    socket.matey_id = data.matey.id
    if (!matey) {
      matey = deck.mateys[data.matey.id] = data.matey
    }
    matey._timeOfBirth = t
    if (!deck.mateys[data.matey.id]._active) {
      deck.coffer.push({
        type: 'system'
        ,matey_id: data.matey.id
        ,treatise: '%user% has joined'
        ,t: t
      })
    }
    matey._active = true;
    socket.emit('touche', true)
    ahoy(deck)
  })
  socket.on('missive',function(data){
    if (!(data && data.matey_id && typeof(data.treatise) == 'string' && typeof(data.deck) == 'string')) {
      return
    }
    var t = Date.now()
    ,deck = getDeck(data.deck)
    if (!deck.mateys[data.matey_id]) {
      return
    }
    deck.coffer.push({
      matey_id: data.matey_id
      ,treatise: data.treatise
      ,t: t
    })
    walkThePlank(deck)
    ahoy(deck)
  })
  socket.on('disconnect',function(){
    var deck = getDeck(socket.deck_id)
    ,matey = deck.mateys[socket.matey_id]
    if (matey) {
      matey._timeOfDeath = Date.now()
      setTimeout(function(){
        if (matey._timeOfBirth < matey._timeOfDeath) {
          var deck = getDeck(socket.deck_id)
          matey._active = false
          deck.coffer.push({
            type: 'system'
            ,matey_id: matey.id
            ,treatise: '%user% has left'
            ,t: Date.now()
          })
          ahoy(deck)
        }
      },mateyResurrectionWindow)
    }
  })
})

function getDeck(deckId){
  if (decks[deckId]) {
    return decks[deckId]
  }
  return decks[deckId] = {
    id: deckId
    ,mateys: {}
    ,coffer: []
  }
}

function ahoy(deck){
  coxwain.sockets.emit('report_'+deck.id,deck)
}

function walkThePlank(deck){
  var guillotineFree = {}
  ,k,i,c
  if (typeof(chestCapacity) == 'number') {
    while (deck.coffer.length > chestCapacity) {
      deck.coffer.shift()
    }
  }
  for (i=0,c=deck.coffer.length;i<c;++i) {
    guillotineFree[deck.coffer[i].matey_id] = true
  }
  for (k in deck.mateys) {
    if (!guillotineFree[k]) {
      delete deck.mateys[k]
      continue;
    }
  }
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
