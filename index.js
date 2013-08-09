// arrrrr!
var corsair = require('http').createServer()
,coxwain = require('socket.io').listen(corsair,{log:false})
,bringtoarms = require('./bringtoarms')
,chestCapacity = 40
,mateyLifeExpectancy = 1000*60*10
,decks = {}

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
    if (!(data && data.matey && data.matey.id && typeof(data.deck) == 'string')) {
      socket.emit('touche', false)
      return
    }
    var t = Date.now()
    ,deck = getDeck(data.deck)
    if (!deck.mateys[data.matey.id]) {
      deck.mateys[data.matey.id] = data.matey
    }
    deck.mateys[data.matey.id]._aTime = t
    if (!deck.mateys[data.matey.id]._active) {
      deck.coffer.push({
        type: 'system'
        ,matey_id: data.matey.id
        ,treatise: '%user% has joined'
        ,t: t
      })
    }
    socket.emit('touche', true)
    walkThePlank(deck)
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
    deck.mateys[data.matey_id]._aTime = t
    deck.coffer.push({
      matey_id: data.matey_id
      ,treatise: data.treatise
      ,t: t
    })
    walkThePlank(deck)
    ahoy(deck)
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
    deck.mateys[k]._active = (deck.mateys[k]._aTime + mateyLifeExpectancy) >= Date.now();
  }
}

