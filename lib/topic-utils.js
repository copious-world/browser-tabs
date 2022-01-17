




module.exports.topic_maker = (word,w_count) => {
    return({
        "link" : `/${word}`,      // leading slash is added 
        "descr" : word,
        "count" : w_count
    })
}
