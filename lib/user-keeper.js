
//
// // https://en.wikipedia.org/wiki/Locality-sensitive_hashing

//  Hot reload modules for ML/NLU/AI


const TopicDataManager = require('./topic_data_manager')
const WordKeeper = require('./word-keeper-app')
const MLLightInterface = require('./ml-interface-light')

// utiltiy
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
class UserKeeper_tabs extends TopicDataManager {

    // // // // // // // // 
    constructor(email,ml_selector) {
        super()
        this.email = email
        this.blocked = false
        this.ml_selector = (ml_selector === undefined) ? "default" : ml_selector
        this.ml_interface = new MLLightInterface(this.ml_selector)
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
        let share_these_structures = {
            "_word_list" : this._word_list,
            "_topics" : this._topics,
            "_topic_dims" : this._topic_dims,
            "_domains" : this._domains,
            "_windows" : this._windows,
            "_all_domains" : this._all_domains,
            "_all_topics" : this._all_topics
        }
        this.ml_interface.set_shared_shared_structures(this,share_these_structures)
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
        this.reify_word_list()
        this.ml_interface.set_shared_shared_structures(this,table)
    }

    

    reify_word_list() {
        for ( let word in this._word_list ) {
            let keeper_data = this._word_list[word]
            let word_keeper = new WordKeeper(word)
            word_keeper.init_keep(keeper_data)
            this._word_list[word] = word_keeper
        }
    }

    change_ml_interface(new_ml_i) {
        let stash_ml_interface = this.ml_interface
        try {
            this.ml_interface = new MLLightInterface(new_ml_i)
            this.load_table(this)
            return true
        } catch (e) {
            this.ml_interface = stash_ml_interface
        }
        return false
    }



    serializable() {
        let future_load = super.serializable()

        future_load.email = this.email
        future_load.blocked = this.blocked
        future_load.ml_selector = this.ml_selector

        return future_load
    }


    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

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
            this.ml_interface.set_shared_shared_structures(this,old_stack)
        }
    }

    set_prefered_dimensions(cluster_points) {
        this._topic_dims = cluster_points
        this.ml_interface.set_prefered_dimensions(cluster_points)
    }

    set_topic_dims(t_dims) {
        this._topic_dims = t_dims
        this.ml_interface.set_prefered_dimensions(t_dims)
    }

    // // // // // // // // // // // // // // // // // // // // // // // // // // // // //

    // ---- ---- ---- ---- ---- ---- ---- ---- ----
    // ---- ---- ---- ---- ---- ---- ---- ---- ----

    // injest
    // ---- ---- ---- ---- ---- ---- ---- ---- ----
    // eat up a list of tabs (store as many relationships about the tabs as possible)

    injest(tabs) {
        // start by categorizing by URL and use title as a description
        try {
            tabs.forEach(tab => {
                let {url, title} = tab          // each tab has a url and a title.
                let aurl = url
                if ( !aurl ) return
                if ( aurl === "about:blank" ) return  // handle special cases for exclusion
                //
                let url_domain = unpack_domain(aurl)        // organize url links by hostname...
                // 
                if ( this._all_domains[url_domain] === undefined ) {  // Have not seen this URL domain before.
                    this._all_domains[url_domain] = []
                    this._domains.push({            /// keep them in a list as well  (this may be optional)
                        "link" : `/${url_domain}`,      // leading slash is added 
                        "descr" : title,
                    })
                }
                let tlist = this._all_domains[url_domain]   // do not duplicate (all entries unique)
                if ( tlist.indexOf(aurl) < 0 ) {
                    tlist.push(aurl)
                }
                //
            })

            // USE ml_interface
            //                  // interface to the ML/NLU alternative
            this.ml_interface.inject_topics(tabs)
        } catch(e) {
            console.log(e)
        }
    }



    // Injest Windows --- use a naming trick to identify windows from other url carrying tab groups:  (window-<the first useful url>)
    //
    //  Keep a record of the window tab set in association with some method of identifying the window.
    //  Injest tabs, which will be done otherwise.
    //
    injest_window(tabs) {
        // start by categorizing by URL and use title as a description
        try {

            // anchoring URL - use the lead URL of the window to identify the whole window as a bucket of tabs

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
            // This action make the window tab list accessible from the domain list. 
            // (this is a seconday point of access for interested users)
            let lead_domain = "window-" + unpack_domain(lead_url)
            //
            //
            // SECONDARY POINT OF ACCESS (WINDOW TABS)
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

            // PRIMARY POINT OF ACCESS (WINDOW TABS)

            // The data structures made below are returned without alteration to the web extension popup code.

            // the tabs might be replicated, but them they might not. The domain has been sequenced.
            // Users may check on the one in the sequence they wish to see.
            // (this is more data than if it is overwritten. this is the choice here)
            //
            lead_title = lead_domain + " ::-> " + lead_title    // APPLICATION SPECIFIC text for the user to see when querying this window...
            //
            this._all_domains[lead_domain] = []     // always make a new list
            this._windows.push({                    // ADD THE DOMAIN TO THE LIST OF WINDOWS...
                "link" : `/${lead_domain}`,         // each link will call this server to get the set of tabs stored under it. Leading slash added to fetch url in app
                "descr" : lead_title,
                "tabs" : tabs
            })
            // //
            let tlist = this._all_domains[lead_domain]      // get the array we just made by reference

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
            // subject tab set to ML/NLU processing (the same as any tab list)  {Note: this is often a smaller set than subitted to injest from gettin all tabs open}
            this.injest(tabs)   // INJEST (top level in other use cases)

        } catch(e) {
            console.log(e)
        }
    }


}


module.exports = UserKeeper_tabs
