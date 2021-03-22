

class WordKeeper {

    //
    constructor(word) {
        this._word = word
        this._count = 0
        this._url_list = {}
    }

    //
    add_word(url,title) {
        this._count++
        this._url_list[url] = title
    }
}




class TabsTopicReducer {
    //
    constructor() {
        //
    }
    //

    // this version is basically a no-op
    //
    spawn_reduction(tabs,word_list,word_dims,cb) {    /// word_dims represents a prioritized basis...

        let all_topics = {}
        let topics = []

        for ( let word in word_list ) {
            let word_keeper = word_list[word]
            all_topics[word] = Object.keys(word_keeper._url_list)
            topics.push({
                "link" : `/${word}`,      // leading slash is added 
                "descr" : word,
                "count" : word_keeper._count
            })
        }
        //
        this._topics.sort((t1,t2) => {          /// sort... 
            let wk1 = this._word_list[t1.descr]
            let wk2 = this._word_list[t2.descr]
            if ( wk1 && wk2 ) {
                return(wk1.count - wk2.count)
            }
            if ( !(wk1) && (wk2) ) return(wk2.count)
            if ( (wk1) && !(wk2) ) return(wk1.count)
            return(0)
        })
        //
        let response_data = {
            "_word_list" : word_list.TabsTopicReducer,
            "_all_topics" : all_topics,
            "_topics" : topics
        }


        if ( cb  && (typeof cb === 'function')) {
            cb(response_data)
        }

    }
}




let module_reducer = new TabsTopicReducer()


module.exports = module_reducer