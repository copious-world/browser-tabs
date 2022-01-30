
module.exports.topic_maker = (topic_word,count,descr) => {
    return({
        "link" : `/${topic_word}`,      // leading slash is added 
        "descr" : ( !descr ) ? topic_word : descr,
        "count" : ( !count || isNaN(count)) ? 1 : count
    })
}

