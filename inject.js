/**
 * content scripts
 *
 * @author : snow@firebloom.cc
 * @license : GPLv3
 */

(function($)
{
  // show page action
  // ------------------
  chrome.extension.sendRequest({"action" : 'showPgAct'});

  // mod topic list
  // ------------------
  var mutedTopics = [],
    blockedUsers = [];

    // constants

    // dom elements
    $tabNav = $('.zbar>div'),
    $topicLs = $('.olt'),
    $pgMain = $topicLs.closest('.indent'),
    $topicPaginator = $('.paginator'),
    $restoreMuted = $('<a class="unmute" href="javascript:void(0)">'+
      'restore muted</a>'),

    $memberTabHandler = $tabNav.find('a:first').clone().
      attr('href','javascript:void(0)').
      attr('id','#n-memberTabHandler').text('Members'),
    $topicTabHandler = $memberTabHandler.clone().
      addClass('n-on').attr('id','#n-topicTabHandler').text('Topics'),

    // dom templates
    $oprtsTpl = $('<div class="n-oprts">'+
        '<a class="n-preview" href="javascript:void(0)">preview</a>'+
        '<a class="n-hide" href="javascript:void(0)">hide</a>'+
        '<a class="n-mute" href="javascript:void(0)">mute</a>'+
        '<a class="n-block" href="javascript:void(0)">block</a>'+
      '</div>'),
    $previewTpl = $('<tr class="n-preview n-empty"><td colspan="5">'+
      '<div class="n-ctn n-box">loading...</div></td></tr>'),
    $lsLoadingTpl = $('<tr class="n-lsLoading n-empty">'+
      '<td colspan="5">loading</td></tr>'),

    $memberTabCtn = $('<div id="n-memberCtn" class="n-empty">loading</div>'),
    $groupLiTpl = $('<div class="n-groupLi n-empty">'+
        '<div class="hd">'+
          '<a class="n-subject" target="_blank"/>'+
          '<div class="n-toggle">'+
            '<a class="n-expand">+</a>'+
            '<a class="n-collapse">-</a>'+
          '</div>'+
          '<div class="c" />'+
        '</div>'+
        '<div class="n-newMembers" />'+
        '<div class="bd n-box" />'+
      '</div>');


  function extractTopicId(uri)
  {
    return uri.slice(34, -1);
  }

  function processTopicLs($container)
  {
    $.each(blockedUsers, function(idx, user)
    {
      removeTopicsByAuthor(user, $container);
    });

    $container.find('tr.pl').each(function(idx, el)
    {
      var $li = $(this),
        uri = $li.find('td:first a').attr('href'),
        id = extractTopicId(uri);

      if(-1 < $.inArray(id, mutedTopics))
      {
        removeTopic($li);
      }
      else
      {
        $li.find('td:nth-child(5)').append($oprtsTpl.clone()).
          end().after($previewTpl.clone());
      }
    });

    $container.find('tr.pl:first').addClass('n-cur');
  }

  /**
   * remove li from topic ls dom
   */
  function removeTopic($li)
  {
    if($li.hasClass('n-cur'))
    {
      var $next = $li.nextAll('tr.pl:first');
      if($next.length)
      {
        $next.addClass('n-cur');
      }
      else
      {
        $prev = $li.prevAll('tr.pl:first');
        if($prev.length)
        {
          $prev.addClass('n-cur');
        }
      }
    }

    $li.next('tr.n-preview').remove();
    $li.remove();
  }

  function removeTopicsByAuthor(user, $container)
  {
    $author = $container.find('td:nth-child(3):contains("'+user+'")');
    $.each($author, function(idx, el)
    {
      removeTopic($(el).closest('tr.pl'));
    })
  }

  function expandTopic()
  {
    var $t = $(this),
      $preview = $t.next('tr.n-preview');

    $t.siblings('.n-on').trigger('collapse').
      end().addClass('n-on').trigger('tweakScroll');
    $preview.show('fast');

    if($preview.hasClass('n-empty'))
    {
      $preview.find('.n-ctn').load($t.find('td:first a').attr('href')+
        ' .topic-content, .topic-reply', function()
      {
        $(this).find('.topic-opt, .sns-bar, .topic-reply li:gt(4)').remove();
        $preview.removeClass('n-empty');
      });
    }
  }

  function collapseTopic()
  {
    var $t = $(this);
    $t.removeClass('n-on').next('tr.n-preview').hide();
  }

  function toggleTopic()
  {
    var $t = $(this);
    if($t.hasClass('n-on'))
    {
      $t.trigger('collapse');
    }
    else
    {
      $t.trigger('expand');
    }
  }

  function nextTopic()
  {
    var $t = $(this),
      $next = $t.nextAll('tr.pl:first');

    if($next.length)
    {
      $t.removeClass('n-cur');
      $next.addClass('n-cur');
      $next.trigger('tweakScroll');
    }
  }

  function prevTopic()
  {
    var $t = $(this),
      $prev = $t.prevAll('tr.pl:first');

    if($prev.length)
    {
      $t.removeClass('n-cur');
      $prev.addClass('n-cur');
      $prev.trigger('tweakScroll');
    }
  }

  function tweakTopicScroll()
  {
    var $t = $(this);

    $(document).scrollTop($t.offset().top-100);
  }

  function muteTopic()
  {
    var $t = $(this),
      id = extractTopicId($t.find('td:first a').attr('href'));

    removeTopic($t);

    if(-1 === $.inArray(id, mutedTopics))
    {
      mutedTopics.push(id);
      chrome.extension.sendRequest({
        "action" : 'muteTopic',
        "objectId" : id
      });
    }
  }

  function blockUser()
  {
    var $t = $(this),
      id = extractTopicId($t.find('td:first a').attr('href')),
      user = $t.find('td:nth-child(3)').text(),
      $next = $t.nextAll('tr.pl:first');

    removeTopicsByAuthor(user, $topicLs);

    if(-1 === $.inArray(id, blockedUsers))
    {
      blockedUsers.push(user);
      chrome.extension.sendRequest({
        "action" : 'blockUser',
        "objectId" : user
      });
    }
  }

  function reloadTopicLs()
  {
    // avoid windfury
    if($topicLs.find('.n-lsLoading.n-empty').length) {return;}

    $lsLoadingTpl.clone().appendTo($topicLs.find('tbody').empty());
    $('<div />').load('/group/ .olt', function()
    {
      var $t = $(this);
      processTopicLs($t);
      $t.find('tbody').replaceAll($topicLs.find('tbody'));
      $topicLs.find('.n-cur').trigger('tweakScroll');
    });
  }

  function loadGroupLs()
  {
    $('<div />').load('/group/mine .indent:last', function()
    {
      $memberTabCtn.empty().removeClass('n-empty');

      $.each($(this).find('dl'), function(idx, groupLi)
      {
        var $groupLink = $('dd a', this),
          groupName = $groupLink.text();
          uri = $groupLink.attr('href');

        $groupLiTpl.clone().
          find('.n-subject').text(groupName).attr('href', uri).
          end().appendTo($memberTabCtn) ;
      });

      $memberTabCtn.find('.n-groupLi:first').addClass('n-cur');

      $.each($memberTabCtn.find('.n-groupLi'), function(idx, el)
      {
        var $t = $(el),
        $bd = $t.find('.bd'),
        url = $t.find('.hd a').attr('href') + 'members';

        setTimeout(loadMemberLs, 1000 * idx, $bd, url);
      });
    });
  }

  function loadMemberLs($ctn, url)
  {
    if($ctn.hasClass('n-ing')) {return;}

    $ctn.text('loading...').addClass('n-ing').
      load(url+' .obss:last, .paginator', function()
    {
      var $groupLi = $ctn.closest('.n-groupLi');
      if($groupLi.hasClass('n-empty'))
      {
        $ctn.prev('.n-newMembers').append($ctn.find('dl.obu:lt(14)').clone()).
          append('<div class="c" />');
        $groupLi.removeClass('n-empty');
      }
    });
  }

  function extractUid(uri)
  {
    return uri.slice(29, -1);
  }

  function expandGroupLi()
  {
    var $t = $(this),
      $bd = $t.addClass('n-on').find('.bd').show().
        end().find('.n-newMembers').hide();

    $t.siblings('.n-on').trigger('collapse');
    $t.trigger('tweakScroll');
  }

  function collapseGroubLi()
  {
    $(this).removeClass('n-on').find('.bd').hide().
      end().find('.n-newMembers').show();
  }

  function toggleGroupLi()
  {
    var $t = $(this);
    if($t.hasClass('n-on'))
    {
      $t.trigger('collapse');
    }
    else
    {
      $t.trigger('expand');
    }
  }

  function nextGroupLi()
  {
    var $t = $(this),
      $next = $t.nextAll('.n-groupLi:first');

    if($next.length)
    {
      $t.removeClass('n-cur');
      $next.addClass('n-cur');
      $next.trigger('tweakScroll');
    }
  }

  function prevGroupLi()
  {
    var $t = $(this),
      $prev = $t.prevAll('.n-groupLi:first');

    if($prev.length)
    {
      $t.removeClass('n-cur');
      $prev.addClass('n-cur');
      $prev.trigger('tweakScroll');
    }
  }

  function tweakGroupLiScroll()
  {
    var $t = $(this);

    $(document).scrollTop($t.offset().top);
  }

  // bind event handlers of topic ls
  function bindKeyboradShorcut()
  {
    // keyboard shortcuts
    $(document).keydown(function(e)
    {
      // u for refresh
      switch(e.which)
      {
        // u for refresh
        case 85:
          reloadTopicLs()
        break;

        // o for toggle li
        case 79:
          $('.n-cur').trigger('toggle');
        break;

        // j for next li
        case 74:
          $('.n-cur').trigger('next');
        break;

        // k for prev li
        case 75:
          $('.n-cur').trigger('prev');
        break;

        // m for mute li
        case 77:
          $('.n-cur').trigger('mute');
        break;

        // b for block li author
        case 66:
          $('.n-cur').trigger('block');
        break;
      }
    });
  }

  function bindTopicLsHandler()
  {
    $topicLs.delegate('tr.pl', 'expand', expandTopic).
      delegate('tr.pl', 'collapse', collapseTopic).
      delegate('tr.pl', 'toggle', toggleTopic).
      delegate('tr.pl', 'next', nextTopic).
      delegate('tr.pl', 'prev', prevTopic).
      delegate('tr.pl', 'tweakScroll', tweakTopicScroll).
      delegate('tr.pl', 'mute', muteTopic).
      delegate('tr.pl', 'block', blockUser).
      delegate('.n-oprts .n-preview', 'click', function()
      {
        var $li = $(this).closest('tr');

        if(!$li.hasClass('n-cur'))
        {
          $topicLs.find('.n-cur').removeClass('n-cur');
          $li.addClass('n-cur');
        }

        $li.trigger('expand');
      }).
      delegate('.n-oprts .n-hide', 'click', function()
      {
        var $li = $(this).closest('tr');

        if(!$li.hasClass('n-cur'))
        {
          $topicLs.find('.n-cur').removeClass('n-cur');
          $li.addClass('n-cur');
        }

        $li.trigger('collapse');
      }).
      delegate('.n-oprts .n-mute', 'click', function()
      {
        $(this).closest('tr').trigger('mute');
      }).
      delegate('.n-oprts .n-block', 'click', function()
      {
        $(this).closest('tr').trigger('block');
      });
  }

  function bindTabHandler()
  {
    $memberTabHandler.click(function()
    {
      $topicLs.detach();
      $memberTabCtn.appendTo($pgMain);
      $topicPaginator.hide();
      $memberTabHandler.addClass('n-on');
      $topicTabHandler.removeClass('n-on');

      if($memberTabCtn.hasClass('n-empty'))
      {
        loadGroupLs();
      }
    });

    $topicTabHandler.click(function()
    {
      $memberTabCtn.detach();
      $topicLs.appendTo($pgMain);
      $topicPaginator.show();
      $topicTabHandler.addClass('n-on');
      $memberTabHandler.removeClass('n-on');
    });
  }

  function bindGroupLsHandler()
  {
    $memberTabCtn.delegate('.n-groupLi', 'expand', expandGroupLi).
      delegate('.n-groupLi', 'collapse', collapseGroubLi).
      delegate('.n-groupLi', 'toggle', toggleGroupLi).
      delegate('.n-groupLi', 'next', nextGroupLi).
      delegate('.n-groupLi', 'prev', prevGroupLi).
      delegate('.n-groupLi', 'tweakScroll', tweakGroupLiScroll).
      delegate('.n-groupLi .n-toggle', 'click', function(e)
      {
        var $t = $(this).closest('.n-groupLi');

        if(!$t.hasClass('n-cur'))
        {
          $memberTabCtn.find('.n-cur').removeClass('n-cur');
          $t.addClass('n-cur');
        }

        $t.trigger('toggle');
      }).
      delegate('.n-groupLi .paginator a', 'click', function(e)
      {
        e.preventDefault();

        var $t = $(this);
        loadMemberLs($t.closest('.bd'), $t.attr('href'));
      });
  }

  //  let's jean!
  // -------------
  chrome.extension.sendRequest({"action": 'getData'},
    function(response)
    {
      if(response.done)
      {
        mutedTopics = response.mutedTopics;
        blockedUsers = response.blockedUsers;
      }
      else
      {
        console && console.log('failed to load muted topics');
      }

      processTopicLs($topicLs);
      $topicLs.find('.n-cur').trigger('tweakScroll');

      bindKeyboradShorcut();
      bindTopicLsHandler();

      $memberTabHandler.appendTo($tabNav),
      $topicTabHandler.replaceAll($tabNav.find('.now')),

      bindTabHandler();
      bindGroupLsHandler();

      $restoreMuted.appendTo($('.aside')).click(function()
      {
        if(confirm('This will release all muted topics, sure?'))
        {
          chrome.extension.sendRequest({"action" : 'clearData'},
            function(response)
            {
              if(response.done)
              {
                location.reload();
              }
              else
              {
                console && console.log('failed');
              }
            });
        }
      })
    });

})(jQuery);
