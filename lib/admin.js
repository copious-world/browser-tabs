const fs = require('fs')
const fsPromise = require('fs/promises')
const UserKeeper_tabs = require('./user-keeper')
const {spawn} = require('child_process')

class Admin {

    // ---- ----
    constructor() {
        this._active_user_map = {}
        this._ml_list = { "default" : { "name" : "default"} }
        this._preserve_ml = { "default" : { "name" : "default"} }
        this._mirrors = []
    }

    set active_user_map(umap) {
        this._active_user_map = umap
    }

    get active_user_map() {
        return this._active_user_map
    }
    


    list_ml_methods_html() {
        let ml_data = this._ml_list
        let output = ""
        for ( let ml_name in this._ml_list ) {
            //
            output += `<li>${ml_name}</li>`
        }

        return output
    }

    init_transform_user_map(user_map) {
        for ( let u_email in user_map ) {
            let ml_nlu = user_map[u_email].ml_selector
            let ukeep = new UserKeeper_tabs(u_email,ml_nlu)
            this._active_user_map[u_email] = ukeep
            ukeep.load_table(user_map[u_email])
        }
    }

    has_user(id_token) {
        let udata = this._active_user_map[id_token]
        if ( udata && udata.blocked ) return false
        return (udata !== undefined) && !!(udata)
    }

    add_user(id) {
        let user_keeper = new UserKeeper_tabs(id)
        this._active_user_map[id] = user_keeper
        return user_keeper
    }


    // -- -- -- -- -- -- -- -- -- -- -- -- 
    // id_to_user_keeper
    id_to_user_keeper(body) {
        let email = body.email
        if ( email ) {
            let user_keeper = this._active_user_map[email]
            if ( user_keeper !== undefined ) {
                return user_keeper
            }
        }
        return false
    }

    dump_topics_and_domains() {
        let a_u_map = {}
        for ( let uky in this._active_user_map ) {
            let user_keeper = this._active_user_map[uky]
            if ( user_keeper ) {
                a_u_map[uky] = user_keeper.serializable()
            }
        }
        let all_data = JSON.stringify(a_u_map,false,2)
        fs.writeFileSync("salvage_run.json",all_data)        
    }


    async load_user_map() {
        let jdata = await fsPromise.readFile("salvage_run.json")
        jdata = jdata.toString()
        let user_map = JSON.parse(jdata);
        this.init_transform_user_map(user_map)
    }

    async load_ml_list() {
        let jdata = await fsPromise.readFile("ml_list.json")
        jdata = jdata.toString()
        let ml_list = JSON.parse(jdata);
        this._ml_list = ml_list
    }

    async load_mirror_list() {
        let jdata = await fsPromise.readFile("mirror_list.json")
        jdata = jdata.toString()
        let ml_list = JSON.parse(jdata);
        this._mirrors = ml_list
    }


    get_server_list() {
        let options = ""
        for ( let server of this._mirrors ) {
            options += "<option>"
            options += server
            options += "</option>"
        }
        return options
    }


/*
email
_word_list
_topics
_topic_dims
_domains
_windows
_all_domains
_all_topics
*/

    //
    async command(cmd,params) {   // ---- ---- ---- ----
        switch (cmd) {
            case "users" : {
                let ulist = Object.keys(this._active_user_map)
                return ulist.join(",")
            }
            case "user-info" : {
                let user = this._active_user_map[params.user]
                if ( !user ) return ""

                let info = {
                    "email" : user.email,
                    "blocked" : user.blocked,
                    "ml_selector" : user.ml_selector,
                    "_word_list_count" : Object.keys(user._word_list).length,
                    "_topics_count" : user._topics.length,
                    "_domains_count" : user._domains.length,
                    "_windows_count" : Object.keys(user._windows).length,
                    "_all_domains_count" : Object.keys(user._all_domains).length,
                    "_all_topics_count" : Object.keys(user._all_topics).length,
                    "_topic_dims" : user._topic_dims,
                    "_sys_add_ml_possibilities" : this._ml_list
                }

                return info
            }
            case "user-topics" : {          //  FETCH OPS FOR USERS (topics)
                let user = this._active_user_map[params.user]
                if ( !user ) return []
                let info = user._all_topics
                return info
            }
            case "user-domains" : {          //  FETCH OPS FOR USERS (domains)
                let user = this._active_user_map[params.user]
                if ( !user ) return []
                let info = user._all_domains
                return info
            }
            case "user-words" : {          //  FETCH OPS FOR USERS (words)
                let user = this._active_user_map[params.user]
                if ( !user ) return []
                let info = user._word_list
                return info
            }
            case "user-windows" : {          //  FETCH OPS FOR USERS (windows)
                let user = this._active_user_map[params.user]
                if ( !user ) return []
                let info = user._windows
                return info
            }
            case 'user-save-topics' : {  // topics may be fewer or more than previously stored
                let user = this._active_user_map[params.user]
                if ( user ) {  //_all_topics
                    let data = params.data
                    let deleted = params.deleted
                    user.topics_revision(data)
                    user.topics_remove_list(deleted)
                }
                break
            }
            case 'user-save-domains' : {   // 
                let user = this._active_user_map[params.user]
                if ( user ) {
                    let data = params.data
                    let deleted = params.deleted
                    user.domains_revision(data)
                    user.domains_remove_list(deleted)
                }
                break
            }
            case 'user-save-words' : {
                let user = this._active_user_map[params.user]
                if ( user ) {
                    let data = params.data
                    let deleted = params.deleted
                    user.words_revision(data)
                    user.words_remove_list(deleted)
                }
                break
            }
            case 'user-save-windows' : {
                let user = this._active_user_map[params.user]
                if ( user ) {
                    let data = params.data
                    let deleted = params.deleted
                    user.windows_revision(data)
                    user.windows_remove_list(deleted)
                }
                break
            }
            case "backup" : {
                console.log("backing up")
                this.dump_topics_and_domains()
                break
            }
            case "reload" : {
                console.log("reloading")
                this.load_user_map()
                break
            }
            case "shutdown" : {
                this.dump_topics_and_domains()
                console.log("shutting down")
                let time_lapse = 2000
                if ( params.lapse ) {
                    time_lapse = parseInt(params.lapse)
                }
                setImmediate(() => { process.exit(0) },time_lapse)
                break;
            }
            case "block_user" : {
                let id = params.uid
                if ( this._active_user_map[id] ) {
                    let user = this._active_user_map[id]
                    user.blocked = true
                }
                break;
            }
            case "unblock_user" : {
                let id = params.uid
                if ( this._active_user_map[id] ) {
                    let user = this._active_user_map[id]
                    user.blocked = false
                }
                break;
            }
            case "ml_nlu_select" : {
                let id = params.uid
                let user_keeper = this._active_user_map[id]
                return user_keeper.change_ml_interface(params.ml_nlu_select)
            }
            case "install_ml" : {
                let npm_module = params.ml_nlu_select
                let dir = process.cwd()
                let bs = spawn("bash",[`${dir}/scripts/import_ml.sh`, npm_module])
                bs.on('close',async (code) => {
                    this._ml_list[npm_module] = {
                        "name" : npm_module
                    }
                    let ml_list = JSON.stringify(this._ml_list)
                    await fsPromise.writeFile("ml_list.json",ml_list)
                })
                break
            }
            case "list-ml" : {
                let data = this._ml_list
                return data
            }
            case "delete_ml" : {
                let npm_module = params.ml_nlu_select
                if ( npm_module in this._ml_list ) {
                    if ( npm_module in this._preserve_ml ) {
                        return "{}"
                    }
                    delete this._ml_list[npm_module]        // delete from the current records
                    let ml_list = JSON.stringify(this._ml_list)
                    await fsPromise.writeFile("ml_list.json",ml_list)
                    //
                    let dir = process.cwd()
                    spawn("bash",[`${dir}/scripts/remove_ml.sh`, npm_module])
                }
                break
            }
            default : {
                break;
            }
        }

        return "{}"
    }

}


module.exports = new Admin()