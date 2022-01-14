
//
// // https://en.wikipedia.org/wiki/Locality-sensitive_hashing



const WordKeeper = require('./word-keeper-app')
const merge_categories_proc = require('./tabs_dimension_reducer')



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




function unpack_domain(aurl) {
    try {
        let working_url =  new URL(aurl)
        return(working_url.hostname)    
    } catch (e) {
        return(false)
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
        this.blocked = false
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
    load_table(table) {
        this._word_list = table._word_list
        this._topics = table._topics
        this._topic_dims = table._topic_dims
        this._domains = table._domains
        this._windows = table._windows
        this._all_domains = table._all_domains
        this._all_topics = table._all_topics
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
        if ( domain[0] === '/' ) {
            domain = domain.substr(1)
        } 
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


module.exports = UserKeeper_tabs
