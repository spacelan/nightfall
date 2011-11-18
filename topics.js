/**
 * content scripts
 *
 * @author : snow@firebloom.cc
 * @license : GPLv3
 */

(function($) {
    // constants
    var REPLY_LS_LENGTH = 6, 
        TRUNK_LENGTH = Math.round(REPLY_LS_LENGTH / 2), 
        HEAD_IDX = TRUNK_LENGTH - 1;

    // dom elements
    var j_mainls;
    
    // dom templates
    var tpl = {};
    tpl.oprts = $('<div class="n-oprts">' + 
            '<a class="n-preview" href="javascript:void(0)">preview</a>' + 
            '<a class="n-hide" href="javascript:void(0)">hide</a>' + 
            '<a class="n-mute" href="javascript:void(0)">mute</a>' + 
            '<a class="n-block" href="javascript:void(0)">block</a>' + 
        '</div>');
        
    tpl.preview = $('<tr class="n-preview n-empty"><td colspan="5">' + 
        '<div class="n-ctn n-box">loading...</div></td></tr>'); 
        
    tpl.ls_loading = $('<tr class="n-lsLoading n-empty">' + 
        '<td colspan="5">loading</td></tr>');
        
    tpl.reply_sp = $('<li class="n-sp">'+
        '<a target="_blank">All comments</a></li>');
           
    function extract_id(uri) {
        return uri.slice(34, -1);
    }           
           
    function process_ls(j_container) {
        $.each(n.blacklist_names, function(idx, username) {
            remove_by_username(username, j_container);
        });

        j_container.find('tr.pl').each(function(idx, el) {
            var j_t = $(this);
            
            // remove legacy blocked users' topics and block again with new way
            // will remove in future
            if(-1 < $.inArray(j_t.find('td:nth-child(3)').text(),
                             n.blacklist_legacy)){
                mute_all_by_user(j_t);
            
            // remove muted topic    
            } else if(-1 < $.inArray(extract_id(j_t.find('td:first a').
                                  attr('href')), 
                              n.topic.muted)) {
                remove(j_t);
            } else {
                j_t.addClass(n.C_LI).find('td:nth-child(5)').append(tpl.oprts.clone()).end().
                    after(tpl.preview.clone());
            }
        });

        j_container.find('tr.pl:first').addClass(n.C_CUR);
    }
   
    function remove_by_username(username, j_container){
        j_container.find('td:nth-child(3):contains("' + username + '")').
            each(function(idx, el) {
                remove($(el).closest('tr.pl'));
            });
    }
    
    function remove(j_topic){
        if(j_topic.hasClass(n.C_CUR)) {
            var j_next = j_topic.nextAll('tr.pl:first');
            if(j_next.length) {
                j_next.addClass(n.C_CUR);
            } else {
                var j_prev = j_topic.prevAll('tr.pl:first');
                if(j_prev.length) {
                    j_prev.addClass(n.C_CUR);
                }
            }
        }

        j_topic.next(n.S_PREVIEW).remove();
        j_topic.remove();
    }
    
    function expand(j_t) {
        var j_preview = j_t.next(n.S_PREVIEW);

        j_t.siblings(n.S_ON).trigger(n.E_COLLAPSE);
        j_t.addClass(n.C_ON).trigger(n.E_SCROLL);
        j_preview.show('fast');

        if(j_preview.hasClass(n.C_EMPTY)) {
            preview(j_t.find('td:first a').attr('href'), j_preview);
        }
    }
    
    function preview(topic_uri, j_preview){
        j_preview.find(n.S_CTN).
            load(topic_uri + ' .topic-content, .topic-reply, .paginator', 
                function() {
                    
            var j_topic = $(this), 
                count_replies = j_topic.find('.topic-reply li').length;

            j_topic.find('.topic-opt, .sns-bar').remove();

            if(count_replies > REPLY_LS_LENGTH) {
                var j_paginator = j_topic.find('.paginator'),
                    j_reply = j_topic.find('.topic-reply'), 
                    j_tail = j_reply.find('li:gt(' + HEAD_IDX + ')').detach();

                j_reply.append(tpl.reply_sp.clone().
                    find('a').attr('href', topic_uri).end());

                if(j_paginator.length) {
                    $('<div />').load(j_topic.find('.paginator>a:last').
                            attr('href') + ' .topic-reply', 
                            function() {
                        j_reply.append($(this).find('li').slice(-TRUNK_LENGTH));
                    });
                    
                    j_paginator.remove();
                } else {
                    j_reply.append(j_tail.slice(-TRUNK_LENGTH));
                }
            }

            j_preview.removeClass(n.C_EMPTY);
        });
    }

    function collapse(j_t) {
        j_t.removeClass(n.C_ON).next(n.S_PREVIEW).hide();
    }

    function mute(j_t) {
        var id = extract_id(j_t.find('td:first a').attr('href'));

        remove(j_t);

        if(-1 === $.inArray(id, n.topic.muted)) {
            n.topic.muted.push(id);
            chrome.extension.sendRequest({
                "action" : 'muteTopic',
                "objectId" : id
            });
        }
    }

    function mute_all_by_user(j_t) {
        var username = j_t.find('td:nth-child(3)').text();

        remove_by_username(username, j_t.closest('tbody'));

        if(-1 === $.inArray(username, n.blacklist_names)) {
            n.blacklist_names.push(username);
            
            $('<div />').load(j_t.find('td:first a').
                        attr('href') + ' #content h3 a', 
                    function(){                
                $.get($(this).find('a').attr('href'), function(data){
                    var m = data.match(/people_info\s=\s{.*"id":\s"(\d+)".*},/);
                    if(m && 1 < m.length){
                        n.ban_user(m[1]);
                    }
                }, 'text');
            });
        }
    }

    function reload() {
        // avoid windfury
        if(j_mainls.find('.n-lsLoading.'+n.C_EMPTY).length) {
            return;
        }

        tpl.ls_loading.clone().appendTo(j_mainls.find('tbody').empty());
        $('<div />').load('/group/ .olt', function() {
            var j_t = $(this);
            process_ls(j_t);
            j_t.find('tbody').replaceAll(j_mainls.find('tbody'));
            j_mainls.find(n.S_CUR).trigger(n.E_SCROLL);
        });
    }
    
    function bind_handlers(){
        j_mainls.delegate('tr.pl', n.E_EXPAND, function(e){
            expand($(this));
        }).
        delegate('tr.pl', n.E_COLLAPSE, function(e){
            collapse($(this));
        }).
        delegate('tr.pl', n.E_MUTE, function(e){
            mute($(this));
        }).
        delegate('tr.pl', n.E_BLOCK, function(e){
            mute_all_by_user($(this));
        }).
        delegate('.n-oprts .n-preview', 'click', function(e) {
            var j_t = $(this).closest('tr');

            if(!j_t.hasClass(n.C_CUR)) {
                j_mainls.find(n.S_CUR).removeClass(n.C_CUR);
                j_t.addClass(n.C_CUR);
            }

            j_t.trigger(n.E_EXPAND);
        }).
        delegate('.n-oprts .n-hide', 'click', function(e) {
            var j_t = $(this).closest('tr');

            if(!j_t.hasClass(n.C_CUR)) {
                j_mainls.find(n.S_CUR).removeClass(n.C_CUR);
                j_t.addClass(n.C_CUR);
            }

            j_t.trigger(n.E_COLLAPSE);
        }).
        delegate('.n-oprts .n-mute', 'click', function(e) {
            $(this).closest('tr').trigger(n.E_MUTE);
        }).
        delegate('.n-oprts .n-block', 'click', function(e) {
            $(this).closest('tr').trigger(n.E_BLOCK);
        });
        
        n.bind_handlers(j_mainls);
            
        n.j_doc.bind(n.E_RELOAD, reload);    
    }
    
    function init(){
        j_mainls = $('.olt');
        
        bind_handlers();
        process_ls(j_mainls);
        j_mainls.find(n.S_CUR).trigger(n.E_SCROLL);
        
        n.j_doc.trigger(n.E_INIT_TOPIC_DONE);
    }
    
    if(n.is_initialized){
        init();
    } else {
        n.j_doc.bind(n.E_INIT_DONE, init);
    }
})(jQuery);
