const fsPromise = require('fs/promises')
const path = require('path')
const express = require('express')
const cors =  require('cors')
//
const {link_meta_from} = require('./lib/link-meta-app')
const admin = require('./lib/admin')
//

const app = express()
app.use('/static', express.static(path.join(__dirname, 'public')))

app.use(cors())
app.use(express.json())
// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----


// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
//  PROGRAM EXIT
process.on('SIGINT',(sig) => {
    admin.dump_topcis_and_domains()
    process.exit(0)
})

//
// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

// GATHER TOPICS AND DOMAINS... Keep track of all the links associated with tabs under topics and domains
// The pop window for the browser extension always sends this kind of record for each tab: { "url" : <url>, "title" : <title> }
// In formation on this level is used to begin clustering.. But, this server may fetch the contents and cluster more aggressively.

// GLOBAL LISTS    FOR THIS APPLICATION 

// g_active_user_map
//
/// A MAP OF EMAILS (USER IDENTITIES) TO OBJECTS THAT ORGANIZE TABS... USER KEEPER 

let g_active_user_map = {}
// give admin control over the active user map
admin.active_user_map = g_active_user_map

// g_topic_list
//
///// A list of publicly shared topics.... otherwise, users get a list of their own topics

let g_topic_list = [
    {
        "link" : "/tabs.copious.world",
        "descr" : "Resources for helping you come to your tabs senses",
    }
]


// g_all_domains
//
///// tab lists (link lists) organized by topics in the global topic list....
let g_all_domains = {
    "tabs.copious.world" : [
        'http://www.popsongnow.com/',
        'http://www.copious.world/',
        'http://www.copious.world/blog/'
      ]
}


// ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ----

// INITIALIZATION METHODS
async function load_topics_and_domains() {
    try {
        await admin.load_user_map()
    } catch (e) {
        console.dir(e)
        console.log(`failed to load salvage_run.json`)
    }
}


// ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ----

/// API PATH URL HANDLERS

// 
app.get('/', (req, res) => {
  res.send('Hello You have encountered the copious.world tab server.... open to the public...')
})



// PATHS
// ---- ---- ---- ---- ---- ---- ---- ---- ----
// USER DASHBOARD
// ---- ---- ---- ---- ---- ---- ---- ---- ----

//
// '/dashboard/:id_token' ---  WEB PAGE INTERFACE OUTSIDE OF WEB EXTENSION...
// 
app.get('/dashboard/:id_token', async (req, res) => {
    let id_token = req.params['id_token']
    //
    if ( admin.has_user(id_token) ) {
        try {
            let hdata = await fsPromise.readFile("./dashboard/user_tab_manager.html")
            hdata = hdata.toString()
            let prev_hdata = ""
            do {
                prev_hdata = hdata
                hdata = hdata.replace("$$USER_IDENTIFIER",id_token)
            } while ( prev_hdata != hdata )
            res.send(hdata)
        } catch (e) {
            console.log(`failed to load salvage_run.json`)
        }
    } else {
        res.send('Hello You have encountered the copious.world tab server.... open to the public...')
    }
})




// PATHS
// ---- ---- ---- ---- ---- ---- ---- ---- ----
// ADMIN DASHBOARD
// ---- ---- ---- ---- ---- ---- ---- ---- ----

//
// '/admin/:id_token' ---  WEB PAGE INTERFACE OUTSIDE OF WEB EXTENSION...
//
var g_admin_id = false
app.get('/admin/:id_token', async (req, res) => {
    let id_token = req.params['id_token']
    //
    if ( !g_admin_id ) {
        res.send('Hello You have encountered the copious.world tab server.... open to the public...')
    }
    //
    if ( g_admin_id === id_token ) {
        try {
            let hdata = await fsPromise.readFile("./dashboard/admin_manager.html")
            hdata = hdata.toString()
            hdata = hdata.replace("$$USER_IDENTIFIER",id_token)
            hdata = hdata.replace("$$USER_IDENTIFIER",id_token)
            res.send(hdata)
        } catch (e) {
            console.log(`failed to load salvage_run.json`)
        }
    } else {
        res.send('Hello You have encountered the copious.world tab server.... open to the public...')
    }
})



app.post('/admin/:id_token', async (req, res) => {
    let id_token = req.params['id_token']
    //
    if ( !g_admin_id ) {
        res.send('Hello You have encountered the copious.world tab server.... open to the public...')
    }
    //
    if ( g_admin_id === id_token ) {
        let body = req.body
        let result = "false"
        if ( body.cmd ) {
            data = admin.command(body.cmd,body)
            if ( data ) {
                return(res.status(200).send(JSON.stringify({ 'type' : 'admin', 'OK' : "true", "data" : data })));
            }
        }
        return(res.status(200).send(JSON.stringify({ 'type' : 'admin', 'OK' : result })));
    } else {
        res.send('Hello You have encountered the copious.world tab server.... open to the public...')
    }
})


app.post('/user/:id_token', async (req, res) => {
    let id_token = req.params['id_token']
    let uid = req.body.user
    //
    if ( uid === id_token ) {
        let body = req.body
        let result = "false"
        if ( body.cmd ) {
            data = admin.command(body.cmd,body)
            if ( data ) {
                return(res.status(200).send(JSON.stringify({ 'type' : 'admin', 'OK' : "true", "data" : data })));
            }
        }
        return(res.status(200).send(JSON.stringify({ 'type' : 'admin', 'OK' : result })));
    } else {
        res.send('Hello You have encountered the copious.world tab server.... open to the public...')
    }
})


app.post('/select-host', async (req, res) => {
    //
    let body = req.body;
    //
    try {
        if ( (body.domain === undefined) ) {
            return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'false' })));
        } else {
            let data = {
                "domain" : "localhost:3111"
            }
            return(res.status(200).send(JSON.stringify({ 'type' : 'admin', 'OK' : "true", "data" : data })));
        }
    } catch (e) {

    }
})

// PATHS
// ---- ---- ---- ---- ---- ---- ---- ---- ----
// UPLOAD NEW DATA FOR A USER
// ---- ---- ---- ---- ---- ---- ---- ---- ----

// 
// '/put_tabs' --- PUT ALL TABS .... --- INJEST
// 
app.post('/put_tabs',(req, res) => {
    //
    let body = req.body;
    //
    try {
        if ( (body.tabs === undefined) || (body.email === undefined) ) {
            return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'false' })));
        } else {
            //
            let user_keeper = admin.id_to_user_keeper(body)
            if ( user_keeper === false  ) {
                user_keeper = admin.add_user(body.email)
            }
                        // there is one now, but check 
            if ( user_keeper ) {
                if ( body.c_points !== undefined ) {
                    user_keeper.set_topic_dims(body.c_points)
                    console.dir(body.c_points)
                }
                user_keeper.injest(body.tabs)
            } else {
                return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'false' })));
            }
        }    
    } catch (e) {
        console.error(e)
    }
    //
    return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true' })));
})


//
// /put_window -  PUT WINDOW ONLY.... --- INJEST
//
app.post('/put_window',(req, res) => {
    //
    let body = req.body;
    //
    if ( (body.tabs === undefined) || (body.email === undefined) ) {
        return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'false' })));
    } else {
        let user_keeper = admin.id_to_user_keeper(body)
        if ( user_keeper === false ) {
            user_keeper = admin.add_user(body.email)
        }
                    // there is one now, but check 
        if ( user_keeper ) {
            user_keeper.injest_window(body.tabs)
        } else {
            return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'false' })));
        }
    }
    //
    return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true' })));
})




// PATHS
// ---- ---- ---- ---- ---- ---- ---- ---- ----
// RETRIEVE STORED DATA FOR A USER
// ---- ---- ---- ---- ---- ---- ---- ---- ----



//
// /get_topic_tabs/:which_topic - GET THE TABS FOR A PARTICULAR TOPIC
//
app.post('/get_topic_tabs/:which_topic', (req, res) => {
    //
    let body = req.body;
    let topic = req.params.which_topic
    //
    let user_keeper = admin.id_to_user_keeper(body)
    if ( user_keeper ) {
        let context = body.context
        //
        let topic_list = false
        switch ( context ) {
            case "topics" : {
                topic_list = user_keeper.get_topic_list(topic)
                break
            }
            case "domains" : {
                topic_list = user_keeper.get_domain_list(topic)
                break
            }
            case "windows" : {
                topic_list = user_keeper.get_window_list(topic)
                break
            }
            default : {
                topic_list = user_keeper.get_topic_list(topic)
            }
        }
        //
        if ( topic_list !== undefined ) {
            let link_meta = link_meta_from(topic_list,topic,body.email)   // construct a link package 
            return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true', 'data' : link_meta })));
        }
    } else {
        let tab_list = g_all_domains[topic]     // generic topics
        if ( tab_list !== undefined  ) {
            return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true', 'data' : tab_list })));
        }
    }
    //  fail
    return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'false' })));
})


//
// /get_topics - TOPICS ... All the topics that were found for this user before the last reboot.
//
app.post('/get_topics',(req, res) => {
    //
    let body = req.body;

    let cluster_points = (body.c_points !== undefined) ? body.c_points : false
    let user_keeper = admin.id_to_user_keeper(body)
    if ( user_keeper ) {
        // reshape the cluster geometry --
        if ( cluster_points ) { user_keeper.set_prefered_dimensions(cluster_points) }  // set_prefered_dimensions
        //
        let topic_list = user_keeper.get_topics()   // TOPICS -- compute
        return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true', 'data' : topic_list })));
    }
    return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true', 'data' : g_topic_list })));
    //
})


//
// /get_domains - DOMAINS ... All the topics that were found for this user before the last reboot.
//
app.post('/get_domains',(req, res) => {
    //
    let body = req.body;

    let user_keeper = admin.id_to_user_keeper(body)
    if ( user_keeper ) {        // send user's DOMAINS
        let domain_list = user_keeper.get_domains()
        return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true', 'data' : domain_list })));
    }
    return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true', 'data' : g_topic_list })));
    //
})



//
// '/get_windows - WINDOWS - GET ALL INDIVIDUAL WINDOWS SAVE BY THE USER
//
app.post('/get_windows',(req, res) => {
    let body = req.body;
    let user_keeper = admin.id_to_user_keeper(body)
    if ( user_keeper ) {        // send user's WINDOWS
        let window_list = user_keeper.get_windows()
        return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true', 'data' : window_list })));
    }
    // send generic collection
    return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true', 'data' : g_topic_list })));
})





//
// /get_link_meta/:which_topic - GET PACKAGE CONSTRUCT FOR PLACEMENT IN DASHBOARDS HOSTING LINK PACKAGES
//
//  // called in extension -- path:>> server -> extension -> dashboard (on user click)
//
app.post('/get_link_meta/:which_topic', (req, res) => {
    //
    let body = req.body;
    let topic = req.params.which_topic
    let context = body.sel_topic_domain
    //
    let user_keeper = admin.id_to_user_keeper(body)
    if ( user_keeper ) {
        //
        let topic_list = false 
        switch ( context ) {
            case "topics" : {
                topic_list = user_keeper.get_topic_list(topic)
                break
            }
            case "domains" : {
                topic_list = user_keeper.get_domain_list(topic)
                break
            }
            case "windows" : {
                topic_list = user_keeper.get_window_list(topic)
                break
            }
            default : {
                topic_list = user_keeper.get_topic_list(topic)
            }
        }
        if ( topic_list !== undefined ) {
            return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true', 'data' : topic_list })));
        }
        //
    } else {
        //
        let tab_list = g_all_domains[topic]
        //
        if ( tab_list !== undefined  ) {
            return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true', 'data' : tab_list })));
        }
    }
    //
    return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'false' })));
})


// EDIT OPERATIONS

app.post('/clear',(req, res) => {
    //
    let body = req.body;
    let user_keeper = admin.id_to_user_keeper(body)
    if ( user_keeper ) {
        user_keeper.clear()
        return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true' })));
    }
    return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true' })));
    //
})


app.post('/undo',(req, res) => {
    let body = req.body;
    let user_keeper = admin.id_to_user_keeper(body)
    if ( user_keeper ) {
        user_keeper.undo()
        return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true' })));
    }
    return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true' })));
    //
})



// LOAD INITIALIZATION METHODS
//
load_topics_and_domains()

//
let port = 3111
if ( process.argv.length > 2 ) {
    port = parseInt(process.argv[2])
}

if ( process.argv.length > 3 ) {
    g_admin_id = process.argv[3]
}

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
