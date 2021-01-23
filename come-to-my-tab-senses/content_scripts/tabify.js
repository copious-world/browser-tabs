(function() {
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;


  window.g_all_tabs = [];
  /**
   * Listen for messages from the background script.
   * Call "beastify()" or "reset()".
   */
  browser.runtime.onMessage.addListener((message) => {
    if ( message.command === "cache-tabs" ) {
      //
      let tab_data = JSON.parse(message.tabstr)

      let data_deposit = document.getElementById('all_tabs')
      data_deposit.value = message.tabstr

      let message_spot = document.getElementById("tab_list")
      if ( message_spot !== undefined ) {
        //
        logTabs(message_spot,tab_data)
        //
      }


    } else if ( message.command === "send_it" ) {
      console.log(message);
    }
  });



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
 

})();
