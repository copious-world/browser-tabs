// client side code to be loaded into a dashboard page
// build on top of copious-transitions dashboard modules.

(function() {
    /**
     * Check and set a global guard variable.
     * If this content script is injected into the same page again,
     * it will do nothing next time.
     */
    window.hasRun = false;
  
    if (window.hasRun) {
      return;
    }
    window.hasRun = false;

    var g_current_dashboard_host = "*"
    var g_dashboard_info = {
        "file_name" : "unknown",
        "result" : "{}"
    }

    function messagePageScript(msg) {
        window.postMessage({
          "direction": "from-content-script",
          "category" : "links",
          "message": msg
        }, g_current_dashboard_host);
      }
  
    /**
     * Given a list of tabs, turn them into a link 
     * package for storage in the link package blog
     */
    function add_link_packge_from_extension(package_name,topics_or_domains) {
        //
        let result = {}
        result.decoded = true
        result.abstract = "Please enter a description"
        result.links = topics_or_domains
        result.package_name = package_name
        result.file_name = package_name
        //
        messagePageScript(result)
        //
    }

    function get_dashboard_owner() {

        let shar = document.getElementById("shareable")
        if ( shar ) {
          let v = shar.value
          try {
              let info = JSON.parse(v)
              g_current_dashboard_host = '*' //info.page_host
              g_dashboard_info = info
          } catch(e) {}
          return(g_dashboard_info.email)  
        }
        return('al@oicious.com')
    }


    /**
     * Listen for messages from the background script.
     * Call "add_link_packge_from_extension()" 
    */
    chrome.runtime.onMessage.addListener((message) => {
      if ( message === undefined ) return
      if ( message.command === undefined ) return

        //
      console.log("tab-catcher " + message.command)
      if ( message.command === "topics" ) {
          //
          add_link_packge_from_extension(message.package_name,message.topics_or_domains);
          //
      } else if ( message.command === "initial" ) {
          //
          let user_email = get_dashboard_owner()
          return Promise.resolve({ "user_email": user_email });
          //
      }
    });

  })();
  