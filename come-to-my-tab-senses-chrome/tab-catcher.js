// client side code to be loaded into a dashboard page
// build on top of copious-transitions dashboard modules.

// ONlY FOR COPIOUS PAGES (must be using pages from the server)


(function() {

    const copious = chrome
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
    function add_link_meta_from_extension(name_of_meta,topics_or_domains) {
        //
        let result = {}
        result.decoded = true
        result.abstract = "Please enter a description"
        result.links = topics_or_domains
        result.name_of_meta = name_of_meta
        result.file_name = name_of_meta
        //
        messagePageScript(result)
        //
    }

    function get_dashboard_owner() {
        let share = document.getElementById("shareable")
        if ( share ) {
          let v = share.value
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
     * Call "add_link_meta_from_extension()" 
    */
    copious.runtime.onMessage.addListener((message) => {
      if ( message === undefined ) return
      if ( message.command === undefined ) return
      if ( message.command === "topics" ) {
          //
          add_link_meta_from_extension(message.package_name,message.topics_or_domains);
          //
      } else if ( message.command === "initial" ) {
          //
          let user_email = get_dashboard_owner()
          return Promise.resolve({ "user_email": user_email });
          //
      }
    });

  })();
  