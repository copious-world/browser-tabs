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
        result.txt_full = "Please enter a description"
        result.links = topics_or_domains,
        result.package_name = package_name
        //
        let package = {}
        package.file_name = package_name
        package.result = JSON.stringify(result)
        //
        messagePageScript(package)
        //
    }

    function get_dashboard_owner() {

        let shar = document.getElementById("shareable")
        let v = shar.value

        try {
            let info = JSON.parse(v)
            g_current_dashboard_host = '*' //info.page_host
            g_dashboard_info = info
        } catch(e) {}

        return(g_dashboard_info.email)
    }


    /**
     * Listen for messages from the background script.
     * Call "add_link_packge_from_extension()" 
    */
    browser.runtime.onMessage.addListener((message) => {
        //
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
  