
// ---- ---- ---- ---- ---- ----

const TopicDataManager = require('./topic_data_manager')
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



class MLLightInterface extends TopicDataManager {

    constructor(selected) {
        super()

        console.log("test" + selected)
        //
        if ( (selected === "default") || (selected === undefined) ) {
            this._processor = this
        } else {
            this._processor = require(selected)   // load this module now
        }
        //
        //
        this.change_consumer = false
        //
    }

    set_shared_shared_structures(change_consumer,table) {
        //
        this._processor.change_consumer = change_consumer       // backref
        //
        this._processor._word_list = table._word_list
        this._processor._topics = table._topics
        this._processor._topic_dims = table._topic_dims
        this._processor._domains = table._domains
        this._processor._windows = table._windows
        this._processor._all_domains = table._all_domains
        this._processor._all_topics = table._all_topics
    }

    set_prefered_dimensions(cluster_points) {
        this._processor._topic_dims = cluster_points
    }

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
                let w_keeper = this.word_list_get(word)
                w_keeper.keep = true
            } else {
                //
                w_list.sort((w1,w2) => {
                    //
                    let w_keeper_1 = this.word_list_get(w1)
                    let w_keeper_2 = this.word_list_get(w2)
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
                        let w_keeper = this.word_list_get(word)
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
            this.word_list_remove(word)
        }
        //
    }


    #_inject_topics(tabs) {   // tabs are <link,title> pairs
        //
        let urls_to_words = {} 
        //
        let do_topics = false
        if ( this._topic_dims.length ) {
            do_topics = true
            for ( let topic of this._topic_dims ) {   // add the cluster points (topics) to the world list
                this.word_list_add_word(topic)
            }
        }
        //
        tabs.forEach(tab => {
            let {url, title} = tab
            //
            //this._word_list
            //
            let words = rough_tokenize(title)     // get useful words from the title
            // from the words in the title for each word
            for ( let word of words ) {
                // keep words in their map and map to word keepers (manager objects of word keeper class)
                let word_keeper = this.word_list_add_word(word)
                word_keeper.add_word(url,title)  // // // //  Each word has a URL map <URL,Title>
                // now map at a bigger level (across tabs)
                if ( urls_to_words[url] === undefined ) {
                    urls_to_words[url] = []
                }
                urls_to_words[url].push(word)
                if ( do_topics ) {   // This for clustering
                    for ( let topic of this._topic_dims ) {  // get the word keepers form the cluster (they may not be in titles per se)
                        if ( topic !== word ) {
                            if ( word.indexOf(topic) ) {
                                let topic_keeper = this.word_list_get(topic)
                                topic_keeper.add_word(url,title)
                            }
                        }
                    }
                }
            }
        })
        //
        this.prune_words(urls_to_words)  // very crudely in default impl, remove words with just one use (or count)
        //
        this.init_topics()          // THIS OVERWRITES ... It should not
        //
        // this._word_list is a map <words,word_keeper>
        for ( let word in this._word_list ) {       // all the words we have found in the tabs we just got (plus what we already had stored)
            let word_obj = this.word_to_all_topics(word)   // word as topic to all topics (i.e. will update url list at topic)
            this.topics_add(word,word_obj._count)           // word as topic to topic list 
        }
        //
        // Sort the the topic list by priority
        // (the list is kept for sorting --- list per user)
        this._topics.sort((t1,t2) => {   // crude clustering sort... word in topic list to top of list
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
        if ( merge_categories_proc ) {   // reducint the word list (and the topics as a result) {word list controls topics}
            setImmediate(() => {
                merge_categories_proc.spawn_reduction(tabs,this._word_list,this._topic_dims,(reduction) => {
                    if ( reduction && reduction._word_list &&  reduction._all_topics && reduction._topics ) {
                        //
                        this._word_list = reduction._word_list
                        this._all_topics = reduction._all_topics
                        this._topics = reduction._topics
                        // propogate changes to the plugin if one is being used.  (shared ref)
                        if ( this.change_consumer ) this.change_consumer.load_table(this)
                    }
                })    
            })
        }
        //
    }

  // // // // // // 
    //
    inject_topics(tabs) {
        if ( (this._processor !== this) && this._processor ) {
            this._processor.inject_topics(tabs)
            return
        } else {
            this.#_inject_topics(tabs)
        }
    }



}




module.exports = MLLightInterface