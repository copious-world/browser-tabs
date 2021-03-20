


class TabsTopicReducer {
    //
    constructor() {
        //
    }
    //

    // this version is basically a no-op
    //
    spawn_reduction(word_list,cb) {

        let all_topics = {}
        let topics = []

        for ( let word in word_list ) {
            let word_keeper = word_list[word]
            all_topics[word] = Object.keys(word_keeper._url_list)
            topics.push({
                "link" : `/${word}`,      // leading slash is added 
                "descr" : word,
            })
        }

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