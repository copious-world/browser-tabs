
module.exports.topic_maker = (topic_word,count) => {
    return({
        "link" : `/${topic_word}`,      // leading slash is added 
        "descr" : topic_word,
        "count" : count
    })
}

