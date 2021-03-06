const fs = require('fs')
const path = require('path')
const express = require('express')

//
const cors =  require('cors')
//
const merge_categories_proc = require('./tabs_dimension_reducer')


process.on('SIGINT',(sig) => {
    dump_topcis_and_domains()
    process.exit(0)
})

//
const port = 3111

const app = express()
app.use('/static', express.static(path.join(__dirname, 'public')))

app.use(cors())
app.use(express.json())


let g_util_words = [
    "of", "to", "you", "your", "and", "for", "in", "itself", "a", "or",
    "the", "that", "in", "on", "-", "_", "|", "with", "has", "had", "have"
]


let punctual = /[^\w]+/g
let digits = /\d+/g

function rough_tokenize(string) {
    //
    string = string.replace(/\s\s+/g,' ')
    string = string.replace('\'s','')
    string = string.replace('ing ',' ')
    string = string.replace('ion ','')
    string = string.replace('\"','')
    let starter = string.split(' ')
    //
    //
    starter = starter.filter((txt) => {
        //
        if ( txt.length < 3 ) return false
        //
        txt = txt.toLowerCase()
        if ( punctual.test(txt) ) {
            return(false)
        }
        if ( g_util_words.indexOf(txt) >= 0 ) {
            return(false)
        }
        if ( digits.test(txt) ) {
            return(false)
        }
        //
        return(true)
    })

    starter = starter.map(str => {
        return str.toLowerCase()
    })

    console.log(starter)

    return(starter)
}


// GATHER TOPICS AND DOMAINS... Keep track of all the links associated with tabs under topics and domains
// The pop window for the browser extension always sends this kind of record for each tab: { "url" : <url>, "title" : <title> }
// In formation on this level is used to begin clustering.. But, this server may fetch the contents and cluster more aggressively.


// GLOBAL LISTS    FOR THIS APPLICATION 



// g_active_user_map
// 
/// A MAP OF EMAILS TO OBJECTS THAT ORGANIZE TABS... USER KEEPER 

let g_active_user_map = {}



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
// ---- ---- ---- ---- ---- ---- ---- ---- ----



function unpack_domain(aurl) {
    try {
        let working_url =  new URL(aurl)
        return(working_url.hostname)    
    } catch (e) {
        return(false)
    }
}


function link_package_from(topic_list,topic,email) {
    //
    let link_package = {
        "owner" : email,
        "email" : email,
        "title" : topic,
        "subject" : topic,
        "txt_full" : "Add a description (abstract) telling about these links",
        "links" : topic_list
    }
    //
    let res = {
        "blog_type" : "link_package",
        "result" : JSON.stringify(link_package),
        "file_name"   : 'topic-' + topic
    }
    //
    return(res)
}



class WordKeeper {
    //
    constructor(word) {
        this._word = word
        this._count = 0
        this._url_list = {}
        this.keep = false
    }

    //
    add_word(url,title) {
        if ( this._url_list[url] === undefined ) {
            this._count++
            this._url_list[url] = title    
        }
    }

    clear() {
        this._url_list = {}
    }
}


const UNDO_STACK_LIMIT = 7

// UserKeeper_tabs
////  provides management of lists by user email....
//
//
class UserKeeper_tabs {

    // // // // // // // // 
    constructor(email) {
        this.email = email
        this.init_empties()
    }

    //
    init_empties() {
        this._word_list = {}
        this._topics = []
        this._topic_dims = []
        this._domains = []
        this._windows = []
        this._all_domains = {}
        this._all_topics = {}
    }

    //
    clear() {   // wipe out everything... but save state for some limited number of clears.
        let prev_stack = Object.assign({},this)
        delete prev_stack._undo_stack
        this._undo_stack.unshift(prev_stack)
        if ( this._undo_stack.length > UNDO_STACK_LIMIT ) {
            this._undo_stack.pop()
        }
        this.init_empties()
    }

    //
    undo() {
        if ( this._undo_stack.length > 0 ) {
            let old_stack = this._undo_stack.shift()
            this._word_list = old_stack._word_list
            this._topics = old_stack._topics
            this._topic_dims = old_stack._topic_dims
            this._domains = old_stack._domains
            this._windows = old_stack._windows
            this._all_domains = old_stack._all_domains
            this._all_topics = old_stack._all_topics
    
        }
    }


    set_prefered_dimensions(cluster_points) {
        this._topic_dims = cluster_points
    }

    set_topic_dims(t_dims) {
        this._topic_dims = t_dims
    }

    // // // // // // // // // // // // // // // // // // // // // // // // // // // // //
    get_topics() {
        return(this._topics)
    }

    // 
    get_domains() {
        return(this._domains)
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ----
    get_topic_list(topic) {
        let tlist =  this._all_topics[topic]
        if ( tlist === undefined ) return []
        return tlist
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ----
    get_domain_list(domain) {
        let dlist =  this._all_domains[domain]
        if ( dlist === undefined ) return []
        return dlist
    }


    // ---- ---- ---- ---- ---- ---- ---- ---- ----
    get_windows() {
        return(this._windows)
    }


    // ---- ---- ---- ---- ---- ---- ---- ---- ----
    // ---- ---- ---- ---- ---- ---- ---- ---- ----
    // ---- ---- ---- ---- ---- ---- ---- ---- ----

    // this is a very basic prune existing for speed 
    // for cutting classes that are basically redundant.
    prune_words(urls_to_words) {
        //
        let salvage = []
        let removals = []
        //
        for ( let url in urls_to_words ) {
            //
            let w_list = urls_to_words[url]
            //
            if ( w_list.length === 0 ) {
                salvage.push(url)
            } else if ( w_list.length === 1 ) {
                let word = w_list[0]
                let w_keeper = this._word_list[word]
                w_keeper.keep = true
            } else {
                //
                w_list.sort((w1,w2) => {
                    //
                    let w_keeper_1 = this._word_list[w1]
                    let w_keeper_2 = this._word_list[w2]
                    let count_diff = (w_keeper_2._count - w_keeper_1._count)
                    let len_diff = (w_keeper_2._word.length - w_keeper_1._word.length)
                    //
                    return( 10*count_diff + 0.25*len_diff )
                })
                //
                let keeper = w_list.shift()
                if ( w_list.length ) {
                    let keepers = []
                    while ( w_list.length  ) {
                        let word = w_list.pop()
                        let w_keeper = this._word_list[word]
                        if ( w_keeper.keep ) {
                            keepers.push(word)
                        } else {
                            if ( this._topic_dims.indexOf(word) >= 0 ) {
                                w_keeper.keep = true
                                keepers.push(word)
                            } else {
                                if ( w_keeper._count === 1 ) {
                                    removals.push(w_keeper)
                                } else {
                                    w_list.push(word)
                                    break
                                }    
                            }
                        }
                    }
                    w_list = w_list.concat(keepers)
                }
                w_list.unshift(keeper)
                urls_to_words[url] = w_list
            }
        }
        //
        for ( let rem of removals ) {
            let word = rem._word
            rem.clear()
            delete this._word_list[word]
        }
    }


    // // // // // // 
    //
    inject_topics(tabs) {
        //
        let urls_to_words = {} 
        //
        let do_topics = false
        if ( this._topic_dims.length ) {
            do_topics = true
            for ( let topic of this._topic_dims ) {
                let word_keeper = this._word_list[topic]
                if ( word_keeper == undefined ) {
                    word_keeper = new WordKeeper(topic)
                    this._word_list[topic] = word_keeper
                }
            }
        }
        //
        tabs.forEach(tab => {
            let {url, title} = tab
            //
            //this._word_list
            //
            let words = rough_tokenize(title)
            for ( let word of words ) {
                let word_keeper = this._word_list[word]
                if ( word_keeper == undefined ) {
                    word_keeper = new WordKeeper(word)
                    this._word_list[word] = word_keeper
                }
                word_keeper.add_word(url,title)  // // // //
                if ( urls_to_words[url] === undefined ) {
                    urls_to_words[url] = []
                }
                urls_to_words[url].push(word)
                if ( do_topics ) {
                    for ( let topic of this._topic_dims ) {
                        if ( topic !== word ) {
                            if ( word.indexOf(topic) ) {
                                let topic_keeper = this._word_list[topic]
                                topic_keeper.add_word(url,title)
                            }
                        }
                    }
                }
            }
        })
        //
        this.prune_words(urls_to_words)
        //
        this._topics = []
        for ( let word in this._word_list ) {
            let word_keeper = this._word_list[word]
            this._all_topics[word] = Object.keys(word_keeper._url_list)
            //
            //
            this._topics.push({
                "link" : `/${word}`,      // leading slash is added 
                "descr" : word,
                "count" : word_keeper._count
            })
        }
        //
        this._topics.sort((t1,t2) => {
            let w_t1 = t1.descr
            let w_t2 = t2.descr
            if ( do_topics ) {
                let t1_weight = 0
                let t2_weight = 0
                if ( this._topic_dims.indexOf(w_t1) ) {
                    t1_weight = 600000
                }
                if ( this._topic_dims.indexOf(w_t2) ) {
                    t2_weight = 600000
                }
                if ( (t1_weight !== 0) && (t2_weight !== 0) ) {
                    return(t1_weight - t2_weight)
                }
            }
            let wk1 = this._word_list[w_t1]
            let wk2 = this._word_list[w_t2]
            if ( wk1 && wk2 ) {
                return(wk1.count - wk2.count)
            }
            if ( !(wk1) && (wk2) ) return(wk2.count)
            if ( (wk1) && !(wk2) ) return(wk1.count)
            return(0)
        })
        //
        if ( merge_categories_proc ) {
            setImmediate(() => {
                merge_categories_proc.spawn_reduction(tabs,this._word_list,this._topic_dims,(reduction) => {
                    if ( reduction && reduction._word_list &&  reduction._all_topics && reduction._topics ) {
                        this._word_list = reduction._word_list
                        this._all_topics = reduction._all_topics
                        this._topics = reduction._topics
                    }
                })    
            })
        }
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ----
    // eat up a list of tabs 

    injest(tabs) {
        // start by categorizing by URL and use title as a description
        try {
            tabs.forEach(tab => {
                let {url, title} = tab          // each tab has a url and a title.
                let aurl = url
                if ( !aurl ) return
                if ( aurl === "about:blank" ) return  // handle special cases for exclusion
                //
                let url_domain = unpack_domain(aurl)
                if ( this._all_domains[url_domain] === undefined ) {
                    this._all_domains[url_domain] = []
                    this._domains.push({
                        "link" : `/${url_domain}`,      // leading slash is added 
                        "descr" : title,
                    })
                }
                let tlist = this._all_domains[url_domain]
                if ( tlist.indexOf(aurl) < 0 ) {
                    tlist.push(aurl)
                }
                //
            })
            //
            this.inject_topics(tabs)
        } catch(e) {
            console.log(e)
        }
    }



    // Injest Windows --- use a naming trick to identify windows from other url carrying tab groups:  (window-<the first useful url>)
    injest_window(tabs) {
        // start by categorizing by URL and use title as a description
        try {

            let lead_url, lead_title                // in a list of tabs, find the first URL that can express a link to real content...
            for ( let i = 0; i < tabs.length; i++ ) {
                let lead_tab = tabs[i]
                let {url, title} = lead_tab
                lead_url = url
                if ( !!(lead_url) && (lead_url !== "about:blank") ) {
                    lead_title = title
                    break
                }
            }

            if ( lead_url === undefined )  return   // All the urls in tabs were basically junk as far as interesting information is concerned


            // An anchoring URL has been found and the title associated with it has been determined.
            // Create a lead domain -- the lead domain is a key in the domain map, which maps domains to lists of links for tabs
            //
            let lead_domain = "window-" + unpack_domain(lead_url)
            //
            if ( this._all_domains[lead_domain] !== undefined ) {  // Given that it is already there, try to make an incremented version (the tab set might change)
                let model_domain = unpack_domain(lead_url)
                for ( let i = 0; i < 10; i++ ) {
                    lead_domain = `window_${i+1}_` + model_domain           // So, this means that there is a feature about replicating tab sets.. or keeping changes
                                                                            // Also, the same url might be the first useful tab in moe than one window with other rand wanderings in other tabs.
                    if ( this._all_domains[lead_domain] === undefined ) {
                        break;
                    }
                }    
            }


            // The data structures made below are returned without alteration to the web extension popup code.

            lead_title = lead_domain + " ::-> " + lead_title    // APPLICATION SPECIFIC text for the user to see when querying this window...
            //
            this._all_domains[lead_domain] = []     // always make a new list
            this._windows.push({                    // ADD THE DOMAIN TO THE LIST OF WINDOWS...
                "link" : `/${lead_domain}`,         // each link will call this server to get the set of tabs stored under it. Leading slash added to fetch url in app
                "descr" : lead_title,
            })

            let tlist = this._all_domains[lead_domain]      // get the array we just made

            tabs.forEach(tab => {           // push real links without duplication on to the list of linkss associated with the topic.
                let {url, title} = tab
                let aurl = url
                if ( !aurl ) return
                if ( aurl === "about:blank" ) return  // handle special cases for exclusion
                //
                if ( tlist.indexOf(aurl) < 0 ) {        // don't duplicate
                    tlist.push(aurl)                    // list of url's nothing more...
                }
            })

            //
            //
            this.injest(tabs)

        } catch(e) {
            console.log(e)
        }
    }


}




function dump_topcis_and_domains() {
    let all_data = JSON.stringify(g_active_user_map,false,2)
    fs.writeFileSync("salvage_run.json",all_data)
}



// 
app.get('/', (req, res) => {
  res.send('Hello You have encountered the copious.world tab server.... open to the public...')
})


// PUT ALL TABS .... --- INJEST
app.post('/put_tabs',(req, res) => {
    //
    let body = req.body;
    //
    try {
        if ( (body.tabs === undefined) || (body.email === undefined) ) {
            return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'false' })));
        } else {
            //
            let user_keeper = g_active_user_map[body.email]
            if ( user_keeper === undefined ) {
                user_keeper = new UserKeeper_tabs(body.email)
                g_active_user_map[body.email] = user_keeper
            }
            // there is one now,, but check 
            if ( user_keeper ) {
                //
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


// PUT WINDOW ONLY.... --- INJEST

app.post('/put_window',(req, res) => {
    //
    let body = req.body;
    //
    if ( (body.tabs === undefined) || (body.email === undefined) ) {
        return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'false' })));
    } else {
        let user_keeper = g_active_user_map[body.email]
        if ( user_keeper === undefined ) {
            user_keeper = new UserKeeper_tabs(body.email)
            g_active_user_map[body.email] = user_keeper
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





// TOPICS ... All the topics that were found for this user before the last reboot.
//
//
app.post('/get_topics',(req, res) => {
    //
    let body = req.body;

    let email = body.email
    let cluster_points = (body.c_points !== undefined) ? body.c_points : false
    

    let user_keeper = g_active_user_map[email]
    if ( user_keeper ) {
        if ( cluster_points ) {
            //
            user_keeper.set_prefered_dimensions(cluster_points)
            //
        }
        let topic_list = user_keeper.get_topics()
        return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true', 'data' : topic_list })));
    }
    return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true', 'data' : g_topic_list })));
    //
  })


  app.post('/get_domains',(req, res) => {
    //
    let body = req.body;

    let email = body.email

    let user_keeper = g_active_user_map[email]
    if ( user_keeper ) {
        let domain_list = user_keeper.get_domains()
        return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true', 'data' : domain_list })));
    }
    return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true', 'data' : g_topic_list })));
    //
  })



  app.post('/clear',(req, res) => {
    //
    let body = req.body;
    let email = body.email

    let user_keeper = g_active_user_map[email]
    if ( user_keeper ) {
        user_keeper.clear()
        return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true' })));
    }
    return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true' })));
    //
  })


  app.post('/undo',(req, res) => {
    //
    let body = req.body;
    let email = body.email

    let user_keeper = g_active_user_map[email]
    if ( user_keeper ) {
        user_keeper.undo()
        return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true' })));
    }
    return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true' })));
    //
  })


// GET THE TABS FOR A PARTICULAR TOPIC
//
app.post('/get_topic_tabs/:which_topic', (req, res) => {
    //
    let body = req.body;
    let topic = req.params.which_topic
    //
    let email = body.email

    let user_keeper = g_active_user_map[email]
    if ( user_keeper ) {
        let topic_list = user_keeper.get_topic_list(topic)
        if ( topic_list !== undefined ) {
            let link_package = link_package_from(topic_list,topic,email)
            return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true', 'data' : link_package })));
        }
    } else {
        
        let tab_list = g_all_domains[topic]
        //
        if ( tab_list !== undefined  ) {
            return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'true', 'data' : tab_list })));
        }
    }
    //
    return(res.status(200).send(JSON.stringify({ 'type' : 'tabs', 'OK' : 'false' })));
  })


// get_link_package
// GET PACKAGE CONSTRUCT FOR PLACEMENT IN DASHBOARDS HOSTING LINK PACKAGES
//
app.post('/get_link_package/:which_topic', (req, res) => {
    //
    let body = req.body;
    let topic = req.params.which_topic
    //
    let email = body.email
    let topic_source = body.sel_topic_domain
    //
    let user_keeper = g_active_user_map[email]
    if ( user_keeper ) {
        //
        let topic_list = (topic_source === "topics") ? user_keeper.get_topic_list(topic) :  user_keeper.get_domain_list(topic)
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


//
// GET ALL INDIVIDUAL WINDOWS SAVE BY THE USER
//
app.post('/get_windows',(req, res) => {
    //
    let body = req.body;

    let email = body.email

    let user_keeper = g_active_user_map[email]
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
