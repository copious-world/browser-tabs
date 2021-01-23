const fs = require('fs')
const path = require('path')
const express = require('express')
//
const cors =  require('cors')
var bodyParser = require('body-parser')

//
const port = 3111

const app = express()
app.use('/static', express.static(path.join(__dirname, 'public')))

app.use(cors())
app.use(bodyParser.json())


let g_topic_list = [
    {
        "link" : "/music",
        "descr" : "Music Production",
    },
    {
        "link" : "/marketing",
        "descr" : "Music Promotion",
    },
    {
        "link" : "/servers",
        "descr" : "Small Servers",
    }
]

let g_all_topics = {
    "music" : [
        'http://www.popsongnow.com/',
        'http://www.copious.world/blog/',
        'https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/create',
        'https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension',
        'http://expressjs.com/en/resources/middleware/body-parser.html'

      ],
      "marketing" : [
        'http://www.popsongnow.com/',
        'http://www.copious.world/blog/',
        'https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/create',
        'https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension',
        'http://expressjs.com/en/resources/middleware/body-parser.html'
      ],
      "servers" : [
          'http://www.popsongnow.com/',
          'http://www.copious.world/blog/',
          'https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/create',
          'https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension',
          'http://expressjs.com/en/resources/middleware/body-parser.html'
      ]
}

// 
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/get_topic_tabs/:which_topic', (req, res) => {

    let topic = req.params.which_topic
    let tab_list = g_all_topics[topic]

    return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true', 'data' : tab_list })));
  })

app.post('/put_tabs',(req, res) => {
    //
    let body = req.body;

    console.log(body)

    return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true' })));
  })


app.post('/get_topics',(req, res) => {
    //
    let body = req.body;

    console.log(body)

    return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true', 'data' : g_topic_list })));
  })


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
