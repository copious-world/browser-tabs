const Link_meta = require('link-meta')



// link_package_from
//
function link_package_from(topic_list,topic,email) {
    //
    let l_package = new Link_meta()
    l_package.set_all("*:any",topic_list,{},{})
    l_package.set_from_map({
        'creator' : email,
        'email' : email,
        'title' : topic,
        'subject' : topic,
        'txt_full' : "Add a description (abstract) telling about these links"
    })
console.dir(l_package)
    //
    let res = {
        "blog_type" : "link_meta",
        "package" : JSON.stringify(l_package),
        "file_name"   : 'topic-' + topic
    }
    //
    return(res)
}


module.exports.link_package_from = link_package_from