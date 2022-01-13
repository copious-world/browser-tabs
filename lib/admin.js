const fs = require('fs')
const fsPromise = require('fs/promises')
const { parse } = require('path')
const UserKeeper_tabs = require('./user-keeper')

class Admin {

    // ---- ----
    constructor() {
        this._active_user_map = {
        }
    }

    set active_user_map(umap) {
        this._active_user_map = umap
    }

    get active_user_map() {
        return this._active_user_map
    }

    init_transform_user_map(user_map) {
        for ( let u_email in user_map ) {
            let ukeep = new UserKeeper_tabs(u_email)
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
        user_keeper = new UserKeeper_tabs(body.email)
        this._active_user_map[id] = user_keeper
        return user_keeper
    }


    // -- -- -- -- -- -- -- -- -- -- -- -- 
    // id_to_user_keeper
    id_to_user_keeper(body) {
        let email = body.email
        if ( email ) {
            let user_keeper = this._active_user_map[email]
            return user_keeper
        }
        return false
    }

    dump_topcis_and_domains() {
        let all_data = JSON.stringify(this._active_user_map,false,2)
        fs.writeFileSync("salvage_run.json",all_data)        
    }


    async load_user_map() {
        let jdata = await fsPromise.readFile("salvage_run.json")
        jdata = jdata.toString()
        let user_map = JSON.parse(jdata);
        this.init_transform_user_map(user_map)
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
    command(cmd,params) {   // ---- ---- ---- ----
        switch (cmd) {
            case "users" : {
                let ulist = Object.keys(this._active_user_map)
                return ulist.join(",")
            }
            case "user-info" : {
                let user = this._active_user_map[params.user]

                let info = `email: ${user.email}    blocked ?> ${user.blocked}<br>`
                let n = Object.keys(user._word_list).length
                info += `_word_list #: ${n}<br>`
                n = Object.keys(user._topics).length
                info += `_topics #: ${n}<br>`
                n = Object.keys(user._domains).length
                info += `_domains #: ${n}<br>`
                n = Object.keys(user._windows).length
                info += `_windows #: ${n}<br>`
                n = Object.keys(user._all_domains).length
                info += `_all_domains #: ${n}<br>`
                n = Object.keys(user._all_topics).length
                info += `_all_topics #: ${n}<br>`
                info += `_topic_dims : ${user._topic_dims.join(',')}`

                return info
            }
            case "user-topics" : {
                let user = this._active_user_map[params.user]
                let info = user._all_topics
                return info
            }
            case "user-domains" : {
                let user = this._active_user_map[params.user]
                let info = user._all_domains
                return info
            }
            case "user-words" : {
                let user = this._active_user_map[params.user]
                let info = user._word_list
                return info
            }
            case "backup" : {
                console.log("backing up")
                this.dump_topcis_and_domains()
                break
            }
            case "reload" : {
                console.log("reloading")
                this.load_user_map()
                break
            }
            case "shutdown" : {
                this.dump_topcis_and_domains()
                console.log("shutting down")
                let time_lapse = 2000
                if ( params.lapse ) {
                    time_lapse = parseInt(params.lapse)
                }
                setImmediate(() => { process.exit(0) },time_lapse)
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
            default : {
                break;
            }
        }

        return "{}"
    }

}


module.exports = new Admin()