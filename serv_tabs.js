const fs = require('fs')
const path = require('path')
const express = require('express')
const url = require('url')
//
const cors =  require('cors')
var bodyParser = require('body-parser')

//
const port = 3111

const app = express()
app.use('/static', express.static(path.join(__dirname, 'public')))

app.use(cors())
app.use(bodyParser.json())



function unpack_domain(aurl) {
    try {
        let working_url =  url.parse(aurl)
        return(working_url.hostname)    
    } catch (e) {
        return(false)
    }
}


class UserKeeper_tabs {
    constructor(email) {
        this.email = email
        this._topics = []
        this._windows = []
        this._all_topics = {}
        //
    }

    get_topics() {
        return(this._topics)
    }

    get_topic_list(topic) {
        let tlist =  this._all_topics[topic]
        return tlist
    }

    injest(tabs) {
        // start by categorizing by URL and use title as a description
        try {
            tabs.forEach(tab => {
                let {url, title} = tab
                let aurl = url
                if ( !aurl ) return
                if ( aurl === "about:blank" ) return  // handle special cases for exclusion
                //
                let url_domain = unpack_domain(aurl)
                if ( this._all_topics[url_domain] === undefined ) {
                    this._all_topics[url_domain] = []
                    this._topics.push({
                        "link" : `/${url_domain}`,
                        "descr" : title,
                    })
                }
                let tlist = this._all_topics[url_domain]
                if ( tlist.indexOf(aurl) < 0 ) {
                    tlist.push(aurl)
                }
            })

        } catch(e) {
            console.log(e)
        }
    }

    injest_window(tabs) {
        // start by categorizing by URL and use title as a description
        try {

            let lead_url, lead_title
            for ( let i = 0; i < tabs.length; i++ ) {
                let lead_tab = tabs[i]
                let {url, title} = lead_tab
                lead_url = url
                if ( !!(lead_url) && (lead_url !== "about:blank") ) {
                    lead_title = title
                    break
                }
            }

            if ( lead_url === undefined )  return

            let lead_domain = "window-" + unpack_domain(lead_url)
            //
            if ( this._all_topics[lead_domain] !== undefined ) {
                let model_domain = unpack_domain(lead_url)
                for ( let i = 0; i < 10; i++ ) {
                    lead_domain = `window_${i+1}_` + model_domain
                    if ( this._all_topics[lead_domain] === undefined ) {
                        break;
                    }
                }    
            }

            lead_title = lead_domain + " ::-> " + lead_title
            
            this._all_topics[lead_domain] = []
            this._windows.push({
                "link" : `/${lead_domain}`,
                "descr" : lead_title,
            })

            let tlist = this._all_topics[lead_domain]

            tabs.forEach(tab => {
                let {url, title} = tab
                let aurl = url
                if ( !aurl ) return
                if ( aurl === "about:blank" ) return  // handle special cases for exclusion
                //
                if ( tlist.indexOf(aurl) < 0 ) {
                    tlist.push(aurl)
                }
            })

        } catch(e) {
            console.log(e)
        }
    }

    get_windows() {
        return(this._windows)
    }

}



let g_active_user_list = {}


let g_topic_list = [
    {
        "link" : "/tabs.copious.world",
        "descr" : "Resources for helping you come to your tabs senses",
    }
]

let g_all_topics = {
    "tabs.copious.world" : [
        'http://www.popsongnow.com/',
        'http://www.copious.world/',
        'http://www.copious.world/blog/'
      ]
}

// 
app.get('/', (req, res) => {
  res.send('Hello World!')
})



app.post('/put_tabs',(req, res) => {
    //
    let body = req.body;
    //
    if ( (body.tabs === undefined) || (body.email === undefined) ) {
        return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'false' })));
    } else {
        let user_keeper = g_active_user_list[body.email]
        if ( user_keeper === undefined ) {
            user_keeper = new UserKeeper_tabs(body.email)
            g_active_user_list[body.email] = user_keeper
        }
        // there is one now,, but check 
        if ( user_keeper ) {
            user_keeper.injest(body.tabs)
        } else {
            return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'false' })));
        }
    }
    //
    return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true' })));
  })



//
app.post('/get_topics',(req, res) => {
    //
    let body = req.body;

    let email = body.email

    let user_keeper = g_active_user_list[email]
    if ( user_keeper ) {
        let topic_list = user_keeper.get_topics()
        return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true', 'data' : topic_list })));
    }
    return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true', 'data' : g_topic_list })));
    //
  })


//
app.post('/get_topic_tabs/:which_topic', (req, res) => {
    //
    let body = req.body;
    let topic = req.params.which_topic
    //
    let email = body.email

    let user_keeper = g_active_user_list[email]
    if ( user_keeper ) {
        let topic_list = user_keeper.get_topic_list(topic)
        if ( topic_list !== undefined ) {
            return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true', 'data' : topic_list })));
        }
    } else {
        
        let tab_list = g_all_topics[topic]
        //
        if ( tab_list !== undefined  ) {
            return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true', 'data' : tab_list })));
        }
    }
    //
    return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'false' })));
  })


// 

app.post('/put_window',(req, res) => {
    //
    let body = req.body;
    //
    if ( (body.tabs === undefined) || (body.email === undefined) ) {
        return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'false' })));
    } else {
        let user_keeper = g_active_user_list[body.email]
        if ( user_keeper === undefined ) {
            user_keeper = new UserKeeper_tabs(body.email)
            g_active_user_list[body.email] = user_keeper
        }
        // there is one now,, but check 
        if ( user_keeper ) {
            user_keeper.injest_window(body.tabs)
        } else {
            return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'false' })));
        }
    }
    //
    return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true' })));
  })


//
app.post('/get_windows',(req, res) => {
    //
    let body = req.body;

    let email = body.email

    let user_keeper = g_active_user_list[email]
    if ( user_keeper ) {
        let topic_list = user_keeper.get_windows()
        return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true', 'data' : topic_list })));
    }
    return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true', 'data' : g_topic_list })));
    //
  })



app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
