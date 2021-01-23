
const SERVER_PUT_TABS = "http://localhost:3111/put_tabs"
const SERVER_TOPICS_POST =  "http://localhost:3111/get_topics"
const SERVER_TOPIC_TABS_POST = "http://localhost:3111/get_topic_tabs"




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



function logTopic(topic_tables,topics) {
  topic_tables.innerHTML = ""
  for (let topic of topics) {
      let element = document.createElement('li')
      let btn = document.createElement('button')
      let tabs_finder = topic.link
      btn.addEventListener('click',((tf) => {
        return((ev) => {
          fetch_topic(tf)
        })
      })(tabs_finder))
      
      //
      element.appendChild(btn)
      btn.innerHTML = topic.descr
      topic_tables.appendChild(element)
  }
}
 

function spawn_if_new_tabs(tabs,data) {
  for ( let url of data ) {
    if ( tabs.find((atab) => { return(atab.url === url) }) === undefined ) {
      browser.tabs.create({
        "url": url
      });
    }
  }
}


function spawn_tabs(data) {
  browser.tabs.query({})
    .then((tabs) => { spawn_if_new_tabs(tabs,data) })
    .catch(reportError);

}




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
      return await response.json(); // parses JSON response into native JavaScript objects
  }
}


async function save_tabs() {
    let data_deposit = document.getElementById('all_tabs')
    let tab_info = data_deposit.value

    if ( tab_info !== undefined && tab_info.length ) {
        try {
            let tabs_to_send = JSON.parse(tab_info)
            let email_in = document.getElementById('uemail')
            if ( email_in ) {
                let email = email_in.value
                if ( email.length ) {
                    let postable = {
                        "email" : email,
                        "tabs" : tabs_to_send
                    }
                    let response = await postData(SERVER_PUT_TABS,postable)
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

function insert_tabs(tab_data) {

  let data_deposit = document.getElementById('all_tabs')
  data_deposit.value = JSON.stringify(tab_data)

  let message_spot = document.getElementById("tab_list")
  if ( message_spot !== undefined ) {
    //
    logTabs(message_spot,tab_data)
    //
  }

}


function gather_tabs() {
  browser.tabs.query({})
  .then(gather)
  .catch(reportError);
}

async function gather(tabs) {
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
      insert_tabs(list)
    } catch (ee) {
      alert(ee)
    }
    //
  } catch (e) {
    alert(e)
  }
}


async function retrieve_tab_topics() {
  try {
    let email_in = document.getElementById('uemail')
    if ( email_in ) {
        let email = email_in.value
        if ( email.length ) {
            
        let postable = {
            "email" : email
        }
        let response = await postData(SERVER_TOPICS_POST,postable)
        if ( response.OK === "true" ) {
            let data = response.data
            let topic_spot = document.getElementById("topic_list")
            if ( topic_spot ) {
              logTopic(topic_spot,data)
            }
        }

        } else {
            alert("your account email is required")
        }
    }
  } catch(e) {
      alert(e.message)
  }
}

async function fetch_topic(topic) {
  try {
    let email_in = document.getElementById('uemail')
    if ( email_in ) {
        let email = email_in.value
        if ( email.length ) {
            let postable = {
                "email" : email
            }

            try {
              let response = await postData(SERVER_TOPIC_TABS_POST + topic,postable)
              if ( response.OK === "true" ) {
                  let data = response.data
                  spawn_tabs(data)
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


/**
 * Just log the error to the console.
 */
function reportError(error) {
  console.error(`Could not beastify: ${error}`);
}



function listenForClicks() {
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("gather")) {
      gather_tabs()
    } else if (e.target.classList.contains("getter")) {
      retrieve_tab_topics()
    } else if (e.target.classList.contains("saver")) {
      save_tabs()
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

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
*/
listenForClicks()
