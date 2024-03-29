
// SERVICE WORKER SCRIPT FOR THE TAB MANAGEMENT EXTENSION
//


var g_tabs_db = null;


const copious = chrome


async function do_interface_from_storage() {
    let gettingItem = copious.storage.sync.get("email");
    try {
        let email_record = await gettingItem
        if ( email_record ) {
            if ( Object.keys(email_record).length === 0 ) {
                console.log("EMPTY INTERFACE")
                console.log(JSON.stringify(email_record))
            } else {
                console.log(JSON.stringify(email_record))
            }
        }
    } catch (e) {
        console.log(e.message)
    }
}

async function do_email_storage(email) {
    let will_store = copious.storage.sync.set({"email" : email})
    try {
        let did_store = await will_store
        console.log(did_store)
    } catch (e) {
        console.log(e.message)
    }
}

function create_database() {

    const request = self.indexedDB.open('tab-senses-db', 4);
    
    request.onerror = (event) => {
        console.log("Problem opening DB.");
    }
    
    request.onupgradeneeded = (event) => {
        //
        g_tabs_db = event.target.result;
        let objectStore = g_tabs_db.createObjectStore('user_tab_info', {
            keyPath: 'email'
        });
        objectStore.transaction.oncomplete = (event) => {
            console.log("ObjectStore Created.");
        }
        //
    }
    
    request.onsuccess = (event) => {
        //
        g_tabs_db = event.target.result;
        //
        g_tabs_db.onerror = (event) => {
            console.log("FAILED TO OPEN DB.")
        }
        //
    }
}

/*
function insert_record(user_tabs) {
    //
    if ( g_tabs_db ) {
        //
        const insert_transaction = g_tabs_db.transaction('user_tab_info', "readwrite");
        const objectStore = insert_transaction.objectStore('user_tab_info');
        //
        return new Promise((resolve, reject) => {
            //
            insert_transaction.oncomplete = () => {
                console.log("ALL INSERT TRANSACTIONS COMPLETE.");
                resolve(true);
            }
            insert_transaction.onerror = () => {
                console.log("PROBLEM INSERTING RECORDS.")
                resolve(false);
            }
            //
            let request = objectStore.add(user_tabs);
            //
            request.onsuccess = () => {
                console.log("Added: ", user_tabs.email);
            }
            //
        });
    }
    //
}
*/


function get_record(email) {
    //
    if ( g_tabs_db ) {
        const get_transaction = g_tabs_db.transaction('user_tab_info', "readonly");
        const objectStore = get_transaction.objectStore('user_tab_info');
        //
        return new Promise((resolve, reject) => {
            //
            get_transaction.oncomplete = () => {
                console.log("ALL GET TRANSACTIONS COMPLETE.");
            }
            get_transaction.onerror = () => {
                console.log("PROBLEM GETTING RECORDS.")
                resolve(false)
            }
            //
            let request = objectStore.get(email);
            request.onsuccess = (event) => {
                let res = event.target.result
                if ( res === undefined ) resolve(false)
                resolve(res);
            }
            //
        });
        //
    }
    //
}
  

function update_record(user_tabs) {
    //
    if ( g_tabs_db ) {
        //
        const put_transaction = g_tabs_db.transaction('user_tab_info', "readwrite");
        const objectStore = put_transaction.objectStore('user_tab_info');
        //
        return new Promise((resolve, reject) => {
            //
            put_transaction.oncomplete = () => {
                console.log("ALL PUT TRANSACTIONS COMPLETE.");
                resolve(true);
            }      
            put_transaction.onerror = () => {
                console.log("PROBLEM UPDATING RECORDS.")
                resolve(false);
            }      
            objectStore.put(user_tabs);
            //
        });
        //
    }
    //
}

function delete_record(email) {
    //
    if ( g_tabs_db ) {
        //
        const delete_transaction = g_tabs_db.transaction('user_tab_info',"readwrite");
        const objectStore = delete_transaction.objectStore('user_tab_info');
        return new Promise((resolve, reject) => {
            //
            delete_transaction.oncomplete = () => {
                console.log("ALL DELETE TRANSACTIONS COMPLETE.");
                resolve(true);
            }
            delete_transaction.onerror = () => {
                console.log("PROBLEM DELETE RECORDS.")
                resolve(false);
            }
            objectStore.delete(email);
            //
        });
        //
    }
    //
}



/**
 * Listen for messages from the background script.
 * Call "add_link_packge_from_extension()" 
*/
copious.runtime.onMessage.addListener((message) => {

    if ( message === undefined ) return
    if ( message.command === undefined ) return
    console.log("background " + message.command)
    //
    switch ( message.command ) {
        case "interface-initialize" : {
            do_interface_from_storage()
            break;
        }
        case "email-update" : {
            do_email_storage(message.email)
            break;
        }
        case "db-initial" : {
            create_database()
            break;
        }
        /*                  // not going to check if the data is there already... just write over what's there with the latest tabs.
        case "insert" : {
            let user_tabs = message.user_tabs
            insert_record(user_tabs)  
            break
        }
        */
        case "update" : {
            let user_tabs = message.user_tabs
            return update_record(user_tabs)    // includes email and a stringify of all the data 
            break
        }
        case "get" : {
            let email = message.email
            return get_record(email)            // returns the promist which will be awaited by the caller
        }
        case "delete" : {
            let email = message.email
            return delete_record(email)
            break
        }
        default : {
            break
        }
    }
    //
    return false
})


