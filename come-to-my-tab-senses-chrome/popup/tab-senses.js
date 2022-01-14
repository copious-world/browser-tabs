let DEFAULT_URL = 'localhost:3111'
let CHOSEN_URL = DEFAULT_URL
//
let SERVER_PUT_TABS = `http://${CHOSEN_URL}/put_tabs`
let SERVER_PUT_WINDOW = `http://${CHOSEN_URL}/put_window`
let SERVER_DOMAIN_POST =  `http://${CHOSEN_URL}/get_domains`
let SERVER_TOPICS_POST =  `http://${CHOSEN_URL}/get_topics`
let SERVER_TOPIC_TABS_POST = `http://${CHOSEN_URL}/get_topic_tabs`
let SERVER_TOPIC_LINKS_POST = `http://${CHOSEN_URL}/get_link_package`
let SERVER_WINDOW_POST =  `http://${CHOSEN_URL}/get_windows`
let SERVER_WINDOW_CLEAR =  `http://${CHOSEN_URL}/clear`
let SERVER_WINDOW_UNDO =  `http://${CHOSEN_URL}/undo`
//
let SERVER_SELECT_SERVER =  `http://${CHOSEN_URL}/select-host`


const DEFAULT_CLICK_CONTEXT = "domains"
const DEBUGGING = true


// -- g_application_mail    --- set by web page (not by extension)
let g_application_mail = false      // set by a dashboard specific to a user session

// NOTE: if g_application_mail has a value, then buttons made for communicating with topic list elements and the dashboard are shown
//

// g_keep_data_around
// Shorten the trip to the server
let g_keep_data_around = {
  "windows" : "nada",
  "topics" : "nada",
  "domains" : "nada",
  "gathered" : {
    "tab_list" : "nada",
    "window_tab_list" : "nada"
  }
}





// Generic method for querying the server ... temporary tab storage....
async function postData(url = '', data = {}, creds = 'omit', do_stringify = true, ctype) {
  let content_type = 'application/json'
  if ( ctype !== undefined ) {
      content_type = ctype
  }
  let options = {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: creds, // include, *same-origin, omit
      headers: {
          'Content-Type': content_type
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *client
      body: (do_stringify ? JSON.stringify(data)  : data)	// body data type must match "Content-Type" header
  }

  if ( ctype === 'multipart/form-data') {
      delete options.headers['Content-Type']  // content type will be set automatically with a boundary
  }
  // Default options are marked with *
  const response = await fetch(url, options);
  if ( response.ok == false ) {
      console.log(response.status + ': ' + response.statusText)
      return {}
  } else {
    try {
      return await response.json(); // parses JSON response into native JavaScript objects
    } catch (e) {
      alert("parse json")
      alert(e)
      alert(response)
      console.log(e)
      console.log(response)
      return({})
    }
  }
}



/**
 *  --  Just log the error to the console.
 */
function reportError(error) {
  console.error(`Could not come to my tab senses: ${error}`);
}


function debug(msg) {
  let help_field = document.getElementById("help_display")
  if ( help_field ) {
    help_field.innerHTML += '<br>' + msg
  }
}



/// INTERACT WITH TABS AND TAB DB

//  logTabs 
//    -- --  display the tab information in a chosen list... 
function logTabs(tab_tables,tabs) {
  tab_tables.innerHTML = ""
  for (let tab of tabs) {
      let element = document.createElement('li')
      let h5 = document.createElement('h5')
      let dd = document.createElement('dd')
      //
      element.appendChild(h5)
      element.appendChild(dd)
      h5.innerHTML = tab.url
      dd.innerHTML = tab.title
      tab_tables.appendChild(element)
  }
}


// ---- ---- ---- ---- ---- ---- ----
//
function insert_tabs(tab_data,tabs_stored,list_loc) {
  //
  g_keep_data_around.gathered[list_loc] = tab_data
  //
  let message_spot = document.getElementById(list_loc)
  if ( message_spot !== undefined ) {
    //
    logTabs(message_spot,tab_data)
    //
  }

}


// GATHER TABS TOGETHER... either all tabs in all windows
//                      or just tabs from the current window.


function tab_gather(tabs,tabs_stored,list_loc) {
  //
  try {
    // // 
    let list = []
    for (let tab of tabs) {
      // tab.url requires the `tabs` permission
      list.push({"url" : tab.url, "title" : tab.title} );
    }
    // // 
    try {
      insert_tabs(list,tabs_stored,list_loc)
    } catch (ee) {
      console.log(ee)
    }
    //
  } catch (e) {
    console.log(e)
  }
}


function gather_tabs() {
  return new Promise ((resolve,reject) => {
    chrome.tabs.query({})
    .then((tabs) => { tab_gather(tabs,'all_tabs','tab_list'); resolve(true); })
    .catch(
      (err) => { reportError(err); reject(err) }
      );  
  })
}


function gather_window_tabs() {
  return new Promise ((resolve,reject) => {
    chrome.tabs.query({ 'currentWindow': true })
    .then((tabs) => { tab_gather(tabs,'window_tabs','window_tab_list'); resolve(true); })
    .catch(
      (err) => { reportError(err); reject(err) }
      );  
  })
}

// // // // // // // // // // // // // // // // // // //
// // // // // // // // // // // // // // // // // // //


// logTopic
// show the list of tabs or domains as buttons with responses made for opening them again
// or for puting them into a dashboard for use.
function logTopic(topic_tables,topics,without_filter,click_context) {

  g_keep_data_around[click_context] = topics    // keep local memory of satisfied requests

  topic_tables.innerHTML = ""
  for ( let topic of topics ) {   // these are links determined by the server; the links are to groups of tabs
    let tabs_finder = topic.link
    //
    if ( click_context === undefined ) {
      click_context = DEFAULT_CLICK_CONTEXT
    }
    //
    let element = document.createElement('li')
    let btn = document.createElement('button')
    //
    //
    btn.addEventListener('click',((tf) => {  // the button that is always shown (with or without dashboard)
        return((ev) => {
          fetch_topic(tf,without_filter,click_context)              // FETCH TOPIC fetch_topic, From a link to the server
        })
      })(tabs_finder))
    //
    let store_it = false
    if ( (g_application_mail !== false) && g_application_mail && g_application_mail.length ) {
      //
      store_it = document.createElement('button')
      store_it.addEventListener('click',((tf) => {
        return(async (ev) => {
          let link_package = await fetch_topic_link_package(tf,click_context)              // FETCH TOPIC fetch_topic, From a link to the server
          if ( link_package ) {
            inject_topic_into_dashboard(tf,link_package)
          } else {
            console.log("no link package for ")
          }
        })
      })(tabs_finder))
    }
    //
    if ( store_it !== false && store_it ) {
      element.appendChild(store_it)
      store_it.innerHTML = "&#8595;"
    }

    if ( topic.count !== undefined ) {
      let counter = document.createElement('span')
      counter.className = "counter_box"
      counter.innerHTML = topic.count
      element.appendChild(counter)
    }

    element.appendChild(btn)
    btn.innerHTML = topic.descr
    topic_tables.appendChild(element)
  }
}


// retrieve the tabs that were stored given the email.
// There  are two possible post channels at the time of this writing... 
// One is for all tabs, the other is for a list of windows that were stored.
async function retrieve_tab_topics(post_channel,result_location,without_filter,context) {
  try {
    let email_in = document.getElementById('uemail')
    if ( email_in ) {
      let email = email_in.value
      email = (g_application_mail && g_application_mail.length )? g_application_mail : email
      if ( email.length  ) {
        let postable = {
            "email" : email
        }
        let response = await postData(post_channel,postable)
        if ( response.OK === "true" ) {
          let data = response.data
          let topic_spot = document.getElementById(result_location)
          if ( topic_spot ) {
            logTopic(topic_spot,data,without_filter,context)   // create buttons with links to groups of tabs
            return true
          }
        }
      } else {
          alert("your account email is required")
      }
    }
  } catch(e) {
      alert(e.message)
  }
  return false
}



// ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
//
function spawn_if_new_tabs(tabs,data) {
  let links = JSON.parse(data.package)
  //debug(`spawn_if_new_tabs  : ${ data.links } ${typeof data.links }`)
  for ( let url of links._links ) {
    //alert(url)
    if ( tabs.find((atab) => { return(atab.url === url) }) === undefined ) {
      chrome.tabs.create({
        "url": url
      });
    }
  }
}


function spawn_tabs(search_result,without_filter) {
  let data = (typeof search_result.result === "string") ? JSON.parse(search_result.result) : search_result
  if ( without_filter ) {
debug(`spawn_tabs NO filtered: ${ data._links } ${typeof data._links}`)
    for ( let url of data.package._links ) {   // create tabs and don't check to see if it is there
      chrome.tabs.create({
        "url": url
      });
    }
  } else {
    chrome.tabs.query({})     // query current tabs and only open ones not currenly open.
      .then((tabs) => { spawn_if_new_tabs(tabs,data) })
      .catch(reportError);
  }
}



// STORE ... 
//

async function tab_field_saver(tab_field,post_action,opt_cluster_points) {
  //
  //let data_deposit = document.getElementById(tab_field)
  // let tab_info = data_deposit.value
  //
  let tabs_to_send = g_keep_data_around.gathered[tab_field] 
  //
  if ( (tabs_to_send !== undefined) && tabs_to_send.length ) {
      try {
          let email_in = document.getElementById('uemail')
          if ( email_in ) {
              let email = email_in.value
              if ( email.length ) {
                  let postable = {
                      "email" : email,
                      "tabs" : tabs_to_send
                  }
                  if ( opt_cluster_points !== undefined ) {
                    postable.c_points = opt_cluster_points
                  }
                  let response = await postData(post_action,postable)
                  if ( response.OK === "true" ) {
                    let message_spot = document.getElementById("tab_list")
                    if ( message_spot ) {
                      let tab_data = [{
                        url : "tabs have been stored",
                        title : "log into your dashboard to organize your tabs at ...."
                      }]
                      logTabs(message_spot,tab_data)
                    }
                  }
                  return
              } else {
                  alert("your account email is required")
              }
          }
      } catch(e) {
          alert(e)
      }
  }

  alert("could not send data")
}


function get_cluster_point_list() {
  let points = []
  for ( let i = 0; i < 5; i++ ) {
    let c_val_holder = document.getElementById(`uc_${i+1}`)
    if ( c_val_holder ) {
      let term_point = c_val_holder.value
      term_point = term_point.trim()
      if ( term_point.length ) {
        points.push(term_point)
      }
    }
  }
  return (points.length ? points : undefined)
}

async function save_tabs(cluster_points) {
  if ( cluster_points && cluster_points.length ) {
    await tab_field_saver('tab_list',SERVER_PUT_TABS,cluster_points)
  } else {
    await tab_field_saver('tab_list',SERVER_PUT_TABS)
  }
}

/*

let cluster_points = get_cluster_point_list()

*/


async function save_window() {
  chrome.tabs.query({ 'currentWindow': true })
      .then((tabs) => {
        tab_gather(tabs,'window_tabs','window_tab_list')
        tab_field_saver('window_tab_list',SERVER_PUT_WINDOW)
      })
      .catch(reportError);
}





// FETCH
//  Fetch stored data.... 




// ---- ---- ---- ---- ---- ---- ----
//
async function fetch_topic(topic,without_filter,context) {
  try {
    let email_in = document.getElementById('uemail')
    if ( email_in ) {
        let email = email_in.value
        if ( email.length ) {
            let postable = {
                "email" : email,
                "context" : context                
            }
            try {
              let response = await postData(SERVER_TOPIC_TABS_POST + topic,postable)
              if ( response.OK === "true" ) {
                  let data = response.data
                  spawn_tabs(data,without_filter)       // given a group of tabs has been returned, open the tabs in the current window.
              } else {
                alert("no tab response")
              }
            } catch (e) {
              alert(e)
            }
            return
        } else {
            alert("your account email is required")
        }
    }
  } catch(e) {
      alert(e)
  }
}


// ---- ---- ---- ---- ---- ---- ----
//
async function do_op(op) {
  try {
    let email_in = document.getElementById('uemail')
    if ( email_in ) {
        let email = email_in.value
        if ( email.length ) {
            let postable = {
                "email" : email,
                "op" : op
            }
            try {
              let response = await postData(SERVER_TOPIC_TABS_POST + topic,postable)
              if ( response.OK === "true" ) {
                return
              }
            } catch (e) {
              alert(e)
            }
            return
        } else {
            alert("your account email is required")
        }
    }
  } catch(e) {
      alert(e)
  }
}


// ---- ---- ---- ---- ---- ---- ----
//
async function fetch_topic_link_package(topic,click_context) {
  try {
    let email_in = document.getElementById('uemail')
    if ( email_in ) {
        let email = email_in.value
        if ( email.length ) {
            let postable = {
                "email" : email,
                "sel_topic_domain" : click_context
            }
            try {
              let response = await postData(SERVER_TOPIC_LINKS_POST + topic,postable)
              if ( response.OK === "true" ) {
                  let data = response.data    // list of link packages
                  return(data)
              }
            } catch (e) {
              alert(e)
            }
            return
        } else {
            alert("your account email is required")
        }
    }
  } catch(e) {
      alert(e)
  }
  return(false)
}


// DISPLAY STYLING...
//
//    show the (navigation) tab with the tab specific list results
function openResults(currentTarget, tabName) {
  // Declare all variables
  let tabcontent, tablinks;
  // Get all elements with class="tabcontent" and hide them
  tabcontent = document.getElementsByClassName("tabcontent");
  tablinks = document.getElementsByClassName("tablinks");

  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Get all elements with class="tablinks" and remove the class "active"
  for ( let i = 0; i < tablinks.length; i++ ) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(tabName).style.display = "block";
  currentTarget.className += " active";
}


// USER INTERACTION...
//
function listenForClicks() {
  document.addEventListener("click", async (e) => {
    try {
      if (e.target.classList.contains("gather")) {
        await gather_tabs()
        let target =  document.getElementById("pick-gathered_tabs")
        openResults(target, "gathered_tabs")
        save_everything()
      } else if ( e.target.classList.contains("getter") ) {
        let no_filter = false
        await retrieve_tab_topics(SERVER_TOPICS_POST,"topic_list",no_filter,"topics")    // retrieve all tabs last stored into the server...
        let target =  document.getElementById("pick-requested_topics")
        openResults(target, "requested_topics")
        save_everything()
      } else if ( e.target.classList.contains("dgetter") ) {
        await retrieve_tab_topics(SERVER_DOMAIN_POST,"domain_list",false,"domains")    // retrieve all tabs last stored into the server...
        let target =  document.getElementById("pick-requested_domains")
        openResults(target, "requested_domains")
        save_everything()
      } else if ( e.target.classList.contains("saver") ) {
        save_tabs()   // sends tabs to the server
        let target =  document.getElementById("pick-gathered_tabs")
        openResults(target, "gathered_tabs")
      } else if ( e.target.classList.contains("cluster") ) {
        let cluster_points = get_cluster_point_list()
        await save_tabs(cluster_points)   // sends tabs to the server
        //
        // update the cluster display without prompting the user to do so...
        await retrieve_tab_topics(SERVER_TOPICS_POST,"topic_list",false,"topics")    // retrieve all tabs last stored into the server...
        let target =  document.getElementById("pick-requested_topics")
        openResults(target, "requested_topics")
        save_everything()
      } else if ( e.target.classList.contains("wgather") ) {
        await gather_window_tabs()
        let target =  document.getElementById("pick-window_gathered")
        openResults(target, "window_gathered")
        save_everything()
      } else if ( e.target.classList.contains("wsaver") ) {
        save_window()
        let target =  document.getElementById("pick-window_gathered")
        openResults(target, "window_gathered") 
        save_everything()
      } else if ( e.target.classList.contains("wgetter") ) {  // this has a filter
        await retrieve_tab_topics(SERVER_WINDOW_POST,"window_list",true,"windows")   // retrieve links to window tab sets ... tabs last stored into server...
        let target =  document.getElementById("pick-requested_windows")
        openResults(target, "requested_windows")
        save_everything()
      } else if ( e.target.classList.contains("help_getter") || ( e.target.id === "pick-requested_help" )  ) {
        show_help()
        let target =  document.getElementById("pick-requested_help")
        openResults(target, "requested_help")
      } else if ( e.target.classList.contains("tablinks") ) {  // show what's there
        let id = e.target.id
        let tartget_name = (id.split('-'))[1]
        //
        openResults(e.currentTarget, tartget_name)
      } else if ( (e.target.id === "requested_help") ) {   // turn off help and look at something else
        let target =  document.getElementById("pick-gathered_tabs")
        openResults(target, "gathered_tabs")
      } else if ( e.target.classList.contains("clear") ) {
        do_op("clear")
      } else if ( e.target.classList.contains("undo") ) {
        do_op("undo")
      }
      //
    } catch (err) {
        
    }

  });
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
  document.querySelector("#popup-content").classList.add("hidden");
  document.querySelector("#error-content").classList.remove("hidden");
}


// ---- ---- ---- ---- ---- ---- ----
//
async function show_help() {
  if ( DEBUGGING ) return
  //
  let help_url = chrome.runtime.getURL("docs/help.html");
  let options = {
    method: 'GET', // *GET, POST, PUT, DELETE, etc.
  }
  const response = await fetch(help_url, options);
  let text = await response.text()
  let help_field = document.getElementById("help_display")
  if ( help_field ) {
    help_field.innerHTML = text
  }
}


// ---- ---- ---- ---- ---- ---- ----
//
function hide_help() {
  if ( DEBUGGING ) return
  //
  let help_field = document.getElementById("help_display")
  if ( help_field ) {
    //help_field.innerHTML = ""
  }
}

// ---- ---- ---- ---- ---- ---- ----
//
async function initialize_dashboard() {
  //
  initialize_db()

  g_application_mail = false
  //
  try {
    let queryOptions = { active: true, currentWindow: true };
    let tabs = await chrome.tabs.query(queryOptions);
    let response = await chrome.tabs.sendMessage( tabs[0].id, { "command" : "initial" })
    if ( response ) {
      g_application_mail = false  // reset 
      //
      let mail = response.user_email
      if ( mail && mail.length ) {
        g_application_mail = mail
        let user_mail = document.getElementById('uemail')
        user_mail.value = mail
        load_previous(g_application_mail)
      }
      //
    }
    //initializer(tabs)
  } catch (e) {
    reportError(e)
  }
  //
}


// ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
//
function inject_topic_into_dashboard(package_name,link_package) {
  let send_topics = (tabs) => {
    console.log(link_package)
    chrome.tabs.sendMessage(
      tabs[0].id,
      { "command" : "topics", "topics_or_domains" : link_package, "package_name" : package_name  }
    ).catch(reportError);
  }
  if ( g_application_mail && g_application_mail.length ) {
    chrome.tabs.query({active: true, currentWindow: true}).then(send_topics)
    .catch(reportError);  
  }
}


function save_everything() {

  console.log("save_everything::  ")

  let data_to_save = JSON.stringify(g_keep_data_around)
  let email = g_application_mail
  if ( email ) {
    let storage_record = {
      "command" : "update",
      "email" : email,
      "user_tabs" : {
        "email" : email,
        "data" : data_to_save
      }
    }
    console.log("save_everything::  " + data_to_save)
    //
    chrome.runtime.sendMessage(storage_record)
  }
}
  
function delete_everything() {
  let email = g_application_mail
  if ( email ) {
    chrome.runtime.sendMessage({
        "command": 'delete',
        "email": email
    })
  }
}



function load_previous(email) {
  if ( email !== false  ) {
    chrome.runtime.sendMessage({
      "command": 'get',
      "email": email
    }).then( response => {
      //
      if ( response === false ) {
        // initialized similarly on loading this script.
        g_keep_data_around = {
          "windows" : "nada",
          "topics" : "nada",
          "domains" : "nada",
          "gathered" : {
            "tab_list" : "nada",
            "window_tab_list" : "nada"
          }
        }
        // 
        console.log("trying to save")
        save_everything()
        return;
      }
      let data = response.data
      g_keep_data_around = JSON.parse(data)
      console.log(g_keep_data_around)
      //
      if ( g_keep_data_around.topics !== "nada" ) {
        let topic_spot = document.getElementById("topic_list")
        if ( topic_spot ) {
          logTopic(topic_spot,g_keep_data_around.topics,false,"topics")   // create buttons with links to groups of tabs
        }  
      }
      //
      if ( g_keep_data_around.domains !== "nada" ) {
        topic_spot = document.getElementById("domain_list")
        if ( topic_spot ) {
          logTopic(topic_spot,g_keep_data_around.domains,false,"domains")   // create buttons with links to groups of tabs
        }
      }
      //
      if ( g_keep_data_around.domains !== "nada" ) {
        topic_spot = document.getElementById("window_list")
        if ( topic_spot ) {
          logTopic(topic_spot,g_keep_data_around.windows,false,"windows")   // create buttons with links to groups of tabs
        }
      }
      //
      if ( g_keep_data_around.gathered.tab_list !== "nada" ) {
        insert_tabs(g_keep_data_around.gathered.tab_list,"","tab_list")
      }
      //
      if ( g_keep_data_around.gathered.window_tab_list !== "nada" ) {
        insert_tabs(g_keep_data_around.gathered.window_tab_list,"","window_tab_list")
      }
      //
    }).catch(reportError);
  }
}



// INITIALIZE OBJECT IN THE BACKGROUND SCRIPT  --- when the interface is ready
function initialize_db() {
  chrome.runtime.sendMessage({
    "command": 'db-initial'
  })
}

async function save_store_domain(domain) {
  let will_store = chrome.storage.sync.set({"server_domain_host" : domain})
  try {
      let did_store = await will_store
      console.log(did_store)
  } catch (e) {
      console.log(e.message)
  }

}


function setup_domain_change_access() {
  let changer = document.getElementById("tab-service-changer")
  if ( changer ) {
    changer.addEventListener('click',(ev) => {
      let init_control_1 = document.getElementById("show_on_init_1")
      let init_control_2 = document.getElementById("show_on_init_2")
      init_control_1.style.display = "none"
      init_control_2.style.display = "none"
      let domain_chooser = document.getElementById("dont_show_if_setup")
      domain_chooser.style.display = "block"
      setup_select_host_options()
    })
  }
}

function initialize_domain_api(domain) {
  //
  let init_control_1 = document.getElementById("show_on_init_1")
  let init_control_2 = document.getElementById("show_on_init_2")
  init_control_1.style.display = "block"
  init_control_2.style.display = "block"
  let domain_chooser = document.getElementById("dont_show_if_setup")
  domain_chooser.style.display = "none"
  //
  let CHOSEN_URL = domain
  //
  SERVER_PUT_TABS = `http://${CHOSEN_URL}/put_tabs`
  SERVER_PUT_WINDOW = `http://${CHOSEN_URL}/put_window`
  SERVER_DOMAIN_POST =  `http://${CHOSEN_URL}/get_domains`
  SERVER_TOPICS_POST =  `http://${CHOSEN_URL}/get_topics`
  SERVER_TOPIC_TABS_POST = `http://${CHOSEN_URL}/get_topic_tabs`
  SERVER_TOPIC_LINKS_POST = `http://${CHOSEN_URL}/get_link_package`
  SERVER_WINDOW_POST =  `http://${CHOSEN_URL}/get_windows`
  SERVER_WINDOW_CLEAR =  `http://${CHOSEN_URL}/clear`
  SERVER_WINDOW_UNDO =  `http://${CHOSEN_URL}/undo`

  setup_domain_change_access()
}

async function initialize_domain_ready() {
  //
  let init_control_1 = document.getElementById("show_on_init_1")
  let init_control_2 = document.getElementById("show_on_init_2")
  init_control_1.style.display = "none"
  init_control_2.style.display = "none"
  //
  let gettingItem = chrome.storage.sync.get("server_domain_host");
  try {
    let domain_def_record = await gettingItem
    if ( domain_def_record ) {
      if ( Object.keys(domain_def_record).length === 0 ) {
        let domain_chooser = document.getElementById("dont_show_if_setup")
        domain_chooser.style.display = "block"
        setup_select_host_options()
      } else {
        let domain_chooser = document.getElementById("dont_show_if_setup")
        domain_chooser.style.display = "none"
        //let email = email_record.email
        let domain = domain_def_record.server_domain_host
        initialize_domain_api(domain)
      }
    }
    //
  } catch (e) {
    alert(e.message)
  }
  //
}



function initialize_user_interface() {
  initialize_domain_ready()
  chrome.runtime.sendMessage({
    "command": 'interface-initialize'
  })
}


async function do_interface_from_storage() {
  let gettingItem = chrome.storage.sync.get("email");
  try {
      let email_record = await gettingItem
      if ( email_record ) {
          if ( Object.keys(email_record).length === 0 ) {
            alert("EMPTY INTERFACE")
          } else {
            let email = email_record.email
            let email_in = document.getElementById('uemail')
            if ( email_in ) {
              email_in.value = email
              //
              if ( email.length ) {
                let dash_link = document.getElementById("dashlink")
                if ( dash_link ) {
                  dash_link.href = `http://${CHOSEN_URL}/dashboard/${email}`
                } else {
                  alert("no dash")
                }
              }
              //
            }
          }
      }
  } catch (e) {
    alert(e.message)
  }
}



/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
*/
listenForClicks()
initialize_dashboard()
initialize_user_interface()
do_interface_from_storage()
//

function setup_key_event() {
  document.addEventListener("change",(ev) => {
    update_dash_link(ev)
  })
}

function update_dash_link(ev) {
  let email_src = ev.target
  if ( email_src && (email_src.id === "uemail") ) {
    let email = email_src.value
    //alert(email_src.id + " " + email)
    if ( email && email.length ) {
      let dash_link = document.getElementById("dashlink")
      if ( dash_link ) {
        dash_link.href = `http://${CHOSEN_URL}/dashboard/${email}`
      }
      // ALSO CHANGE THE STORAGE AS TO WHO THE USER IS
      chrome.runtime.sendMessage({
        "command": 'email-update',
        "email" : email
      })
    
    }
  }
}


function setup_select_host_options() {
  let option_button = document.getElementById('select-host')
  if ( option_button ) {
    option_button.addEventListener('click',async (ev) => {
      let option_box = document.getElementById('select-host-options')
      let domain = option_box.value
      let postable = {
        "domain" : domain
      }
      try {
        let post_channel = SERVER_SELECT_SERVER
        let response = await postData(post_channel,postable)
        if ( response.OK === "true" ) {
          //
          let data = response.data
          //
          //show_on_init_2
          let init_control_1 = document.getElementById("show_on_init_1")
          let init_control_2 = document.getElementById("show_on_init_2")
          init_control_1.style.display = "block"
          init_control_2.style.display = "block"
          let domain_chooser = document.getElementById("dont_show_if_setup")
          domain_chooser.style.display = "none"
          //
          initialize_domain_api(domain)
          save_store_domain(CHOSEN_URL)
          //
        }
      } catch (e) {
        alert(e.message)
      }
    })
  }
  //
}


setup_key_event() 



