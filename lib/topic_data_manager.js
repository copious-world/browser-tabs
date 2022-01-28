const {topic_maker} = require('./topic-utils')
const WordKeeper = require('./word-keeper-app')


class TopicDataManager {

    constructor() {
        this._topics = []
        this._topic_dims = []
        this._domains = []
        this._windows = []
        //
        this._word_list = {}
        this._all_domains = {}
        this._all_topics = {}
    }

    serializable() {
        let s_able = {
            "_word_list" : this._word_list,
            "_topics" : this._topics,
            "_topic_dims" : this._topic_dims,
            "_domains" : this._domains,
            "_windows" : this._windows,
            "_all_domains" : this._all_domains,
            "_all_topics" : this._all_topics    
        }
        return s_able
    }


    // WORD LIST set, get, del 
    word_list_add_word(word) {
        let word_keeper = this._word_list[word]     // does not duplicate (checks for existence)
        if ( word_keeper == undefined ) {
            word_keeper = new WordKeeper(word)
            this._word_list[word] = word_keeper
        }
        return word_keeper
    }

    word_list_get(word) {
        return this._word_list[word]
    }
    
    word_list_remove(word) {
        delete this._word_list[word]
    }


    // revisions and removals
    words_revision(words_all) {
        for ( let w in words_all ) {
            this.word_list_add_word(w)
        }
    }

    words_remove_list(deleted) {
        for ( let w of deleted ) {
            this.word_list_remove(w)
        }
    }



    // ----

    // ALL DOMAINS set, get, del 
    all_domains_add(domain) {
        let domain_list = this._all_domains[domain]
        if ( domain_list === undefined ) {
            domain_list = {}
            this._all_domains[word] = {}
        }
        return domain_keeper
    }

    all_domains_get(domain) {
        return this._all_domains[domain]
    }
    
    all_domains_remove(domain) {
        delete this._all_domains[domain]
    }

    all_domains_add_url(domain,url,title) {
        let url_map = this._all_domains[domain]
        if ( url_map ) {
            if ( url_map[url] === undefined ) {
                url_map[url] = title
                let domain_obj = this.domains_add(domain)
                if ( domain_obj ) {
                    return domain_obj.count
                }
            }
        }
        return -1
    }

    all_domains_remove_url(domain,url) {
        let url_map = this._all_domains[domain]
        if ( url_map ) {
            if ( url_map[url] ) {
                delete url_map[url]
                let domain_obj = this.domains_subtract(domain)
                if ( domain_obj ) {
                    return [domain_obj.count,domain_obj.descr]
                }
            }
        }
        return [-1,false]
    }

    all_domains_remove_url_and_if_empty(domain,url) {
        let count = this.all_domains_remove_url(domain,url)
        if ( count === 0 ) {
            this.all_domains_remove(domain)
            this.domains_remove(domain)
        }
    }

    move_url_domain(domain1,domain2,url) {
        let title = this.all_domains_remove_url_and_if_empty(domain1,url)
        this.all_domains_add_url(domain2,url,title)
    }

    move_url_list_domain(domain1,domain2,urls) {
        for ( let url of urls ) {
            let title = this.all_domains_remove_url_and_if_empty(domain1,url)
            this.all_domains_add_url(domain2,url,title)
        }
    }


    // ALL TOPICS set, get, del 
    all_topics_add(topic) {
        let topic_urls = this._all_topics[topic]
        if ( topic_urls === undefined ) {
            topic_urls = []
            this._all_topics[topic] = topic_urls
        }
        return topic_urls
    }

    all_topics_get(topic) {
        return this._all_topics[topic]
    }
    
    all_topics_remove(topic) {
        delete this._all_topics[topic]
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ----
    //
    all_topics_add_url(topic,url) {
        let url_list = this._all_topics[topic]
        if ( url_list ) {
            if ( url_list.indexOf(url) < 0 ) {
                url_list.push(url)
                let topic_obj = this.topics_add(topic)
                if ( topic_obj ) {
                    return topic_obj.count
                }
            }
        }
        return -1
    }

    all_topics_remove_url(topic,url) {
        let url_list = this._all_topics[topic]
        if ( url_list ) {
            let u_index = url_list.indexOf(url)
            if ( u_index >= 0 ) {
                url_list.splice(u_index,1)
                let topic_obj = this.topics_subtract(topic)
                if ( topic_obj ) {
                    return topic_obj.count
                }
            }
        }
        return -1
    }

    all_topics_remove_url_and_if_empty(topic,url) {
        let count = this.all_topics_remove_url(topic,url)
        if ( count === 0 ) {
            this.all_topics_remove(topic)
            this.topics_remove(topic)
        }
    }



    // TOPICS set, get, del 
    // topics - topic list (as opposed to the map)
    topics_add(topic,init_weight) {
        if ( init_weight === undefined ) init_weight = 1
        let has_topic = this._topics.find((a_topic) => {
            let truthy = (topic === a_topic.descr)
            return truthy
        })
        if ( !has_topic ) {
            let topic_obj = topic_maker(topic,init_weight)
            this._topics.push(topic_obj)
            return topic_obj    
        } else {
            if ( init_weight === undefined ) {
                has_topic.count++
            } else {
                has_topic.count = init_weight
            }
        }
        return has_topic
    }

    topics_subtract(topic) {
        let has_topic = this._topics.find((a_topic) => {
            let truthy = (topic === a_topic.descr )
            return truthy
        })
        if ( has_topic ) {
            has_topic.count--
        }
        return has_topic
    }


    topics_get(topic) {
        let has_topic = this._topics.find((a_topic) => {
            let truthy = (topic === a_topic.descr )
            return truthy
        })
        return has_topic ? has_topic : false
    }
    
    topics_remove(topic) {
        let t_index = this._topics.findIndex((a_topic) => {
            let truthy = (topic === a_topic.descr )
            return truthy
        })
        if ( t_index > 0 ) {
            this._topics.splice(t_index,1)
            return true
        }
        return false
    }


    topics_remove_list(topics_all) {
        for ( let topic of topics_all ) {
            this.topics_remove(topic)
            delete this._all_topics[topic]
        }
    }


    topics_revision(topics_all) {
        for ( let topic in topics_all ) {
            let new_urls = topics_all[topic]
            this.topics_add(topic,new_urls.length)
            this._all_topics[topic] = new_urls
        }
    }


    // DOMAINS set, get, del 
    domains_add(domain,count,title) {
        let dkey = '/' + domain
        let has_domain = this._domains.find((a_domain) => {
            let truthy = (dkey === a_domain.link )
            return truthy
        })
        if ( !has_domain ) {
            let topic_obj = topic_maker(domain,count)
            topic_obj.descr = title
            this._domains.push(topic_obj)
            return topic_obj
        } else {
            has_domain.count++
        }
        return has_domain
    }

    domains_subtract(domain) {
        let dkey = '/' + domain
        let has_domain = this._domains.find((a_domain) => {
            let truthy = (dkey === a_domain.link )
            return truthy
        })
        if ( has_domain ) {
            has_domain.count--
        }
        return has_domain
    }


    domains_get(domain) {
        let dkey = '/' + domain
        let has_domain = this._domains.find((a_domain) => {
            let truthy = (dkey === a_domain.descr )
            return truthy
        })
        return has_domain ? has_domain : false
    }
    
    domains_remove(domain) {
        let dkey = '/' + domain
        let t_index = this._domains.findIndex((a_domain) => {
            let truthy = (dkey === a_domain.descr )
            return truthy
        })
        if ( t_index > 0 ) {
            this._domains.splice(t_index,1)
            return true
        }
        return false
    }



    demains_remove_list(domains_all) {
        for ( let domain of domains_all ) {
            this.domains_remove(domain)
            delete this._all_domains[domain]
        }
    }


    domains_revision(domains_all) {
        for ( let domain in domains_all ) {
            let new_urls = domains_all[domain]
            let count = Object.keys(new_urls)
            let title = new_urls[domain]  /// lead url title
            this.domains_add(domain,count,title)
            this._all_domains[domain] = new_urls  // a map domains to titles
        }
    }


    // WINDOWS set, get, del 
    windows_add(window) {
        let wkey = '/' + window
        let has_window = this._windows.find((a_window) => {
            let truthy = (wkey === a_window.link )
            return truthy
        })
        if ( !has_window ) {
            let topic_obj = topic_maker(window,1)
            this._windows.push(topic_obj)
            topic_obj.tabs = []
            return topic_obj    
        } else {
            has_window.count++
        }
        return has_window
    }


    windows_subtract(window) {
        let wkey = '/' + window
        let has_window = this._windows.find((a_window) => {
            let truthy = (wkey === a_window.link )
            return truthy
        })
        if ( has_window ) {
            has_window.count--
        }
        return has_window
    }


    windows_get(window) {
        let wkey = '/' + window
        let has_window = this._windows.find((a_window) => {
            let truthy = (wkey === a_window.link)
            return truthy
        })
        return has_window ? has_window : false
    }
    
    windows_remove(window) {        // a whole window
        let wkey = '/' + window
        let t_index = this._windows.findIndex((a_domain) => {
            let truthy = (wkey === a_domain.link )
            return truthy
        })
        if ( t_index > 0 ) {
            this._windows.splice(t_index,1)
            return true
        }
        return false
    }



    windows_remove_list(windows_all) {
        for ( let window of windows_all ) {
            this.windows_remove(window)
        }
    }


    windows_revision(windows_all) {
        for ( let window in windows_all ) {
            let window_descr = this._windows[window]
            if ( window_descr === undefined ) {
                let tabs_all = window_descr.tabs
                let url_updates = windows_all[window]
                let additions = []
                for ( let url of url_updates ) {
                    let has_url = tabs_all.find((w_tab) => {
                        let truthy = (url === w_tab.url)
                        return truthy
                    })
                    if ( has_url === undefined ) {
                        additions.push(url)
                    }
                }
                for ( let url of additions ) {
                    let addition = {
                        "url": url,
                        "title": "Added by client"
                    }
                    tabs_all.push(addition)
                }
            }
        }
    }



    // 

    init_topics() {
        if ( this._topics === undefined ) this._topics = []
        else if ( !Array.isArray(this._topics) ) this._topics = []
        // otherwise: don't change it
    }

    word_to_all_topics(word) {
        let word_keeper = this._word_list[word]
        if ( word_keeper ) {        // if the topic already exists, then update the urls with the latest on the word (word for topic)
            this._all_topics[word] = Object.keys(word_keeper._url_list)
        }
        return word_keeper
    }

    add_to_topics(word,w_count) {   // should check that the topic is not duplicated
        let topic_obj = topic_maker(word,w_count)
        this._topics.push(topic_obj)
    }


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
        let p = Object.keys(dlist)
        return p
    }

    get_window_list(domain) {
        let key = '/' + domain
        let tester = false  // search the array 
        for ( let check of this._windows ) {
            if ( check.link === key ) {
                tester = check
                break;
            }
        }
        if ( tester ) {     // return the urls in an array
            let wlist = tester.tabs
            if ( wlist ) {
                wlist = wlist.map((entry) => {
                    return entry.url
                })
                return wlist
            }
        }
        return []
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ----
    get_windows() {
        return(this._windows)
    }



}



module.exports = TopicDataManager