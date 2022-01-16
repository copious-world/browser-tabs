
// ---- ---- ---- ---- ---- ----
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



class MLLightInterface {

    constructor(selected) {
        //
        if ( (selected === "default") || (selected === undefined) ) {
            this._processor = this
        } else {
            this._processor = require(selected)   // load this module now
        }
        //
        //
        this._word_list = {}
        this._topics = []
        this._topic_dims = []
        this._domains = []
        this._windows = []
        this._all_domains = {}
        this._all_topics = {}
        //
    }

    set_shared_shared_structures(change_consumer,table) {
        this.change_consumer = change_consumer
        this._word_list = table._word_list
        this._topics = table._topics
        this._topic_dims = table._topic_dims
        this._domains = table._domains
        this._windows = table._windows
        this._all_domains = table._all_domains
        this._all_topics = table._all_topics
        this.reify_word_list()
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


    #_inject_topics(tabs) {
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
                        //
                        this._word_list = reduction._word_list
                        this._all_topics = reduction._all_topics
                        this._topics = reduction._topics
                        //
                        this.change_consumer.load_table(this)
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