/**
 * content scripts
 *
 * @author : snow@firebloom.cc
 * @license : GPLv3
 */

(function($) {
    // show page action
    // ------------------
    chrome.extension.sendRequest({
        "action" : 'showPgAct'
    });
    
    var BLACK_LIST_URI = '/contacts/blacklist',
        PROFILE_URI = '/mine/',
        CK;
    
    window.n = {};
    
    n.C_LI = 'n-li';
    n.S_LI = '.' + n.C_LI;
    
    n.C_CUR = 'n-cur';
    n.S_CUR = '.' + n.C_CUR;
    
    n.C_PREVIEW = 'n-preview';
    n.S_PREVIEW = '.' + n.C_PREVIEW;
    
    n.C_ON = 'n-on';
    n.S_ON = '.' + n.C_ON;
    
    n.C_EMPTY = 'n-empty';
    n.S_EMPTY = '.' + n.C_EMPTY;
    
    n.C_CTN = 'n-ctn';
    n.S_CTN = '.' + n.C_CTN;
    
    n.C_ING = 'n-ing';
    n.S_ING = '.' + n.C_ING;
    
    n.E_INIT_START = 'evt-init_start';
    n.E_INIT_DONE = 'evt-init_done';
    n.E_INIT_FAILED = 'evt-init_failed';
    n.E_INIT_END = 'evt-init_end';
    
    n.E_INIT_TOPIC_DONE = 'evt-init_topic_done';
    
    n.E_TOGGLE = 'evt-toggle';
    n.E_EXPAND = 'evt-expand';
    n.E_COLLAPSE = 'evt-collapse';
    n.E_SCROLL = 'evt-tweak_scroll';
    n.E_NEXT = 'evt-next';
    n.E_PREV = 'evt-prev';
    n.E_MUTE = 'evt-mute';
    n.E_BLOCK = 'evt-block';
    n.E_RELOAD = 'evt-reload';
    
    n.blacklist = [];
    n.blacklist_names = [];
    n.blacklist_uris = [];
    n.blacklist_legacy = [];
    
    n.j_doc = $(document);
    
    n.topic = {}
    n.topic.muted = [];
    
    n.LOCATION;
    
    n.is_initialized = false;
    
    function toggle(j_t) {
        if(j_t.hasClass(n.C_ON)) {
            j_t.trigger(n.E_COLLAPSE);
        } else {
            j_t.trigger(n.E_EXPAND);
        }
    };
    
    function next(j_t) {
        var j_next = j_t.nextAll(n.S_LI+':first');

        if(j_next.length) {
            j_t.removeClass(n.C_CUR);
            j_next.addClass(n.C_CUR);
            j_next.trigger(n.E_SCROLL);
        }
    };

    function prev(j_t) {
        var j_prev = j_t.prevAll(n.S_LI+':first');

        if(j_prev.length) {
            j_t.removeClass(n.C_CUR);
            j_prev.addClass(n.C_CUR);
            j_prev.trigger(n.E_SCROLL);
        }
    };

    function scroll(j_t) {
        n.j_doc.scrollTop(j_t.offset().top);
    };
    
    n.bind_handlers = function(j_container){
        j_container.delegate(n.S_LI, n.E_TOGGLE, function(e){
            toggle($(this));
        }).
        delegate(n.S_LI, n.E_NEXT, function(e){
            next($(this));
        }).
        delegate(n.S_LI, n.E_PREV, function(e){
            prev($(this));
        }).
        delegate(n.S_LI, n.E_SCROLL, function(e){
            scroll($(this));
        })
    };
    
    n.ban_user = function(uid){
        post_withck('/j/contact/addtoblacklist', {'people': uid});
    }
    
    function post_withck(uri, data, callback, type) {
        if ($.isFunction(data)) {
            type = callback;
            callback = data;
            data = {}
        }
        return $.ajax({
            type: "POST",
            url: uri,
            data: $.extend(data, {
                ck: CK
            }),
            success: callback,
            dataType: type || "text"
        })
    }
    
    function get_user_location(){
        return $.ajax(PROFILE_URI, {'dataType': 'html'}).
            pipe(function(dom){
                return $.ajax($(dom).find('#profile .user-info a').attr('href'),
                {
                    'dataType': 'html',
                    'success': function(dom){
                        n.LOCATION = $(dom).
                            find('#db-nav-location .local-label a.label').
                            text();
                    }
                });
            });
    }
    
    function load_blacklist(){
        return $.ajax(BLACK_LIST_URI, {
            'dataType': 'html',
            'success': function(dom){
                var j_doc = $(dom).find('#lzform');
                
                j_doc.find('#content .obss:first .obu').each(function(idx, e){
                    var j_t = $(e).find('dd a'),
                        name = j_t.text(),
                        uri = j_t.attr('href');
                    
                    if(-1 === $.inArray(name, n.blacklist_names)){
                        n.blacklist_names.push(name);
                    }
                    
                    /*(if(-1 === $.inArray(uri, n.blacklist_uris)){
                        n.blacklist_uris.push(uri);
                    }*/
                });
                
                var j_ck = j_doc.find('[name=ck]');
                if(j_ck.length){
                    CK = j_ck.val();
                }
            }
        });
    }
    
    // bind event handlers of topic ls
    function bind_kb_shortcuts() {
        // keyboard shortcuts
        n.j_doc.keydown(function(e) {
            var j_t = $(n.S_CUR);
            
            switch(e.which) {
            // u for refresh
            case 85:
                n.j_doc.trigger(n.E_RELOAD);
                break;

            // o for toggle li
            case 79:
                j_t.trigger(n.E_TOGGLE);
                break;

            // j for next li
            case 74:
                j_t.trigger(n.E_NEXT);
                break;

            // k for prev li
            case 75:
                j_t.trigger(n.E_PREV);
                break;

            // m for mute li
            case 77:
                j_t.trigger(n.E_MUTE);
                break;

            // b for block li author
            case 66:
                j_t.trigger(n.E_BLOCK);
                break;
            }
        });
    }
    
    function init(){
        chrome.extension.sendRequest({
            "action" : 'getData'
        }, function(response) {
            if(response.done) {
                n.topic.muted = response.mutedTopics;
                n.blacklist_legacy = response.blockedUsers;
                
                bind_kb_shortcuts();
                
                $.when(load_blacklist(), get_user_location()).
                    done(function(){
                        n.is_initialized = true;
                        n.j_doc.trigger(n.E_INIT_DONE);
                        console && console.log('nightfall basic initialized');
                    });
            } else {
                var errmsg = 'failed to load data from background page';
                console && console.log('ERR: '+errmsg);
                n.j_doc.trigger(n.E_INIT_FAILED, [errmsg]);
            }
        });
    };
    
    init();
})(jQuery);


