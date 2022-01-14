


class WordKeeper {
    //
    constructor(word) {
        this._word = word
        this._count = 0
        this._url_list = {}
        this.keep = false
    }

    //
    add_word(url,title) {
        if ( this._url_list[url] === undefined ) {
            this._count++
            this._url_list[url] = title    
        }
    }

    init_keep(data) {
        this._count = data._count
        this._url_list = data._url_list
        this.keep = data.keep
    }

    clear() {
        this._url_list = {}
    }
}


module.exports = WordKeeper