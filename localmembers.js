/**
 * content scripts
 *
 * @author : snow@firebloom.cc
 * @license : GPLv3
 */

(function($) {
    // dom elements
    var j_tab_nav,
        j_topics,
        j_pg,
        j_topic_paginator,
        j_members_handle,
        j_topics_handle,
        j_members_bd = $('<div id="n-memberCtn" class="n-empty">loading</div>');
    
    // dom templates
    var tpl = {};
    
    tpl.group_li = $('<div class="n-groupLi n-li n-empty">' + 
            '<div class="hd">' + 
                '<a class="n-subject" target="_blank"/>' + 
                '<div class="n-toggle">' + 
                    '<a class="n-expand">+</a>' + 
                    '<a class="n-collapse">-</a>' + 
                '</div>' + 
                '<div class="c" />' + 
            '</div>' + 
            '<div class="n-newMembers" />' + 
            '<div class="bd n-box" />' + 
        '</div>');
        
    function load_groups(){
        $('<div />').load('/group/mine .article .indent:last', function() {
            j_members_bd.empty().removeClass(n.C_EMPTY);console.log($(this));

            $.each($(this).find('dl'), function(idx, el) {
                var j_link = $('dd a', this), 
                    name = j_link.text(),
                    uri = j_link.attr('href');

                tpl.group_li.clone().find('.n-subject').
                    text(name).attr('href', uri).end().appendTo(j_members_bd);
            });

            j_members_bd.find('.n-groupLi:first').addClass(n.C_CUR);

            $.each(j_members_bd.find('.n-groupLi'), function(idx, el) {
                var j_t = $(el), 
                    j_bd = j_t.find('.bd'), 
                    //url = j_t.find('.hd a').attr('href') + 'members';
                    url = j_t.find('.hd a').attr('href') + 
                        'member_search?search_text=' + n.LOCATION + '&cat=1005';

                setTimeout(load_members, 1000 * idx, j_bd, url);
            });
        });
    }
    
    function load_members(j_container, url){
        if(j_container.hasClass(n.C_ING)) {
            return;
        }

        j_container.text('loading...').addClass(n.C_ING);        
        j_container.load(url + ' .obss:last, .paginator', function() {
            $.each(j_container.find('dl.obu'), function(idx, el) {
                var j_t = $(el), 
                    username = j_t.find('dd a').text();

                if(-1 < $.inArray(username, n.blacklist_names)) {
                    j_t.remove();
                }
            });
            
            var j_group = j_container.closest('.n-groupLi');
            
            if(0 === j_container.find('dl.obu').length){
                j_group.remove();
            } else if(j_group.hasClass(n.C_EMPTY)) {
                j_container.prev('.n-newMembers').
                    append(j_container.find('dl.obu:lt(14)').clone()).
                    append('<div class="c" />');
                j_group.removeClass(n.C_EMPTY);
            }
            
            j_container.removeClass(n.C_ING);
        });
    }
    
    function expand(j_t) {
        var j_preview = j_t.find('.n-newMembers');
        
        j_preview.hide();
        j_t.find('.bd').show();
        j_t.siblings('.' + n.C_ON).trigger(n.E_COLLAPSE);
        j_t.addClass(n.C_ON).trigger(n.E_SCROLL);
    }

    function collapse(j_t) {
        j_t.find('.bd').hide();
        j_t.find('.n-newMembers').show();
        j_t.removeClass(n.C_ON);
    }
           
    function process_tabs()
    {
        j_members_handle = j_tab_nav.find('a:first').clone().
            attr('href','javascript:void(0)').
            attr('id','#n-memberTabHandler').text('Local Members');
        j_topics_handle = j_members_handle.clone().
            addClass(n.C_ON).attr('id','#n-topicTabHandler').text('Topics');
                
        j_members_handle.appendTo(j_tab_nav),
        j_topics_handle.replaceAll(j_tab_nav.find('.now'));
        
        j_members_handle.click(function()
        {
            j_topics.detach();
            j_members_bd.appendTo(j_pg);
            j_topic_paginator.hide();
            j_members_handle.addClass(n.C_ON);
            j_topics_handle.removeClass(n.C_ON);
        
            if(j_members_bd.hasClass(n.C_EMPTY))
            {
                load_groups();
            }
        });
    
        j_topics_handle.click(function()
        {
            j_members_bd.detach();
            j_topics.appendTo(j_pg);
            j_topic_paginator.show();
            j_topics_handle.addClass(n.C_ON);
            j_members_handle.removeClass(n.C_ON);
        });
    }
    
    function bind_handlers(){
        j_members_bd.delegate(n.S_LI, n.E_EXPAND, function(e){
            expand($(this));
        }).
        delegate(n.S_LI, n.E_COLLAPSE, function(e){
            collapse($(this));
        }).
        delegate('.n-groupLi .n-toggle', 'click', function(e) {
            var j_group = $(this).closest('.n-groupLi');

            if(!j_group.hasClass(n.C_CUR)) {
                j_members_bd.find(n.S_CUR).removeClass(n.C_CUR);
                j_group.addClass(n.C_CUR);
            }

            j_group.trigger(n.E_TOGGLE);
        }).delegate('.n-groupLi .paginator a', 'click', function(e) {
            e.preventDefault();

            var j_link = $(this);
            load_members(j_link.closest('.bd'), j_link.attr('href'));
        });
    }
    
    function init(){
        j_tab_nav = $('.zbar>div');
        j_topics = $('.olt');
        j_pg = j_topics.closest('.indent');
        j_topic_paginator = $('.paginator');
        
        process_tabs();
        bind_handlers();
        n.bind_handlers(j_members_bd);
    }
    
    if(n.is_initialized){
        init();
    } else {
        n.j_doc.bind(n.E_INIT_DONE, init);
    }
})(jQuery);
