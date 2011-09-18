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
  var mutedTopics = [];
    
    // constants
    
    // dom elements
    $topicLs = $('.olt'),
    $topicPaginator = $('.paginator'),
    $restoreMuted = $('<a class="unmute" href="javascript:void(0)">'+
      'restore muted</a>').appendTo($('.aside')).click(function()
      {
        if(confirm('This will release all muted topics, sure?'))
        {
          chrome.extension.sendRequest({"action" : 'clearMutedTopics'},
            function(response)
            {
              if(response.done)
              {
                location.reload();
              }
              else
              {
                console && console.log('failed to clear muted topics');
              }
            });
        }
      }),
    
    // dom templates 
    $oprtsTpl = $('<div class="n-oprts">'+
      '<a class="n-preview" href="javascript:void(0)">preview</a>'+      
      '<a class="n-hide" href="javascript:void(0)">hide</a>'+
      '<a class="n-mute" href="javascript:void(0)">mute</a></div>'),
    $previewTpl = $('<tr class="n-preview n-empty"><td colspan="5">loading...</td></tr>'),
    $lsLoadingTpl = $('<tr class="n-lsLoading n-empty"><td colspan="5">loading</td></tr>');
  
  
  function extractTopicId(uri)
  {
    return uri.slice(34, -1);
  }
  
  function processTopicLs($container)
  {
    $container.find('tr.pl').each(function(idx, el)
    {
      var $li = $(this),
        uri = $li.find('td:first a').attr('href'),
        id = extractTopicId(uri);
      
      $li.find('td:nth-child(5)').append($oprtsTpl.clone()).
          end().after($previewTpl.clone());
    });
    
    $container.find('tr.pl:first').addClass('n-cur');
  }
  
  function removeMutedTopics($container)
  {
    $container.find('tr.pl').each(function(idx, el)
    {
      var $li = $(this),
        uri = $li.find('td:first a').attr('href'),
        id = extractTopicId(uri);
      
      if(-1 < $.inArray(id, mutedTopics))
      {
        removeTopic($li);
      }
    });
  }
  
  function removeTopic($li)
  {
    $li.next('tr.n-preview').remove();
    $li.remove();        
  }
  
  // bind event handlers of topic ls
  $topicLs.delegate('tr.pl', 'expand', function()
  {
    var $t = $(this),
      $preview = $t.next('tr.n-preview');
    
    $t.siblings('.n-on').trigger('collapse').
      end().addClass('n-on').trigger('tweakScroll');
    $preview.show('fast');
          
    if($preview.hasClass('n-empty'))
    {
      $preview.find('td').load($t.find('td:first a').attr('href')+' .topic-content', function()
      {
        $(this).find('.topic-opt, .sns-bar').remove();
        $preview.removeClass('n-empty');
      });
    }
  }).
  delegate('tr.pl', 'collapse', function()
  {
    var $t = $(this);
    $t.removeClass('n-on').next('tr.n-preview').hide();
  }).
  delegate('tr.pl', 'toggle', function()
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
  }).
  delegate('tr.pl', 'next', function()
  {
    var $t = $(this),
      $next = $t.nextAll('tr.pl:first');
      
    if($next.length)
    {
      $t.removeClass('n-cur');
      $next.addClass('n-cur');
      $next.trigger('tweakScroll');
    }
  }).
  delegate('tr.pl', 'prev', function()
  {
    var $t = $(this),
      $prev = $t.prevAll('tr.pl:first');
      
    if($prev.length)
    {
      $t.removeClass('n-cur');
      $prev.addClass('n-cur');
      $prev.trigger('tweakScroll');
    }
  }).
  delegate('tr.pl', 'tweakScroll', function()
  {
    var $t = $(this);
      
    $(document).scrollTop($t.offset().top-100);
  }).
  delegate('tr.pl', 'mute', function()
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
  }).
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
  });
  
  // keyboard shortcuts
  $(document).keyup(function(e)
  {
    // u for refresh
    switch(e.which)
    {
      // u for refresh
      case 85:
        // avoid windfury
        if($topicLs.find('.n-lsLoading.n-empty').length) {return;}
        
        $lsLoadingTpl.clone().appendTo($topicLs.find('tbody').empty());
        $('<div />').load('/group/ .olt', function()
        {
          var $t = $(this);
          processTopicLs($t);
          removeMutedTopics($t);
          $t.find('tbody').replaceAll($topicLs.find('tbody'));
        });
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
    }    
  });
  
  //  let's jean!
  // -------------
  processTopicLs($topicLs);
  
  chrome.extension.sendRequest({"action": 'getMutedTopics'},
    function(response)
    {
      if(response.done)
      {
        mutedTopics = response.mutedTopics;
      }
      else
      {
        console && console.log('failed to load muted topics');
      }
      
      removeMutedTopics($topicLs);
    });
  
  // inject new member tab
  // ----------------------
  var $tabNav = $('.zbar>div'),
    $pgMain = $topicLs.closest('.indent'),
    
    $memberTabHandler = $tabNav.find('a:first').clone().
      attr('href','javascript:void(0)').attr('id','#n-memberTabHandler').text('Members').
      appendTo($tabNav),
      
    $topicTabHandler = $memberTabHandler.clone().
      addClass('n-on').attr('id','#n-topicTabHandler').text('Topics').
      replaceAll($tabNav.find('.now')),
    
    // dom templates
    $memberTabCtn = $('<div id="n-memberCtn" class="n-empty">loading</div>'),
    $groupLiTpl = $('<div class="n-groupLi">'+
        '<div class="hd"><a target="_blank" /></div>'+
        '<div class="bd n-empty" />'+
      '</div>'),
    $userLiTpl = false;
      
  //function       
  
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
          find('a').text(groupName).attr('href', uri).
          end().appendTo($memberTabCtn) ;
      });
      
      $memberTabCtn.find('.n-groupLi:first').addClass('n-cur');
    });
  }
  
  function loadMemberLs($ctn, url)
  {
    if($ctn.hasClass('n-ing')) {return;}
    
    $ctn.text('loading...').addClass('n-ing n-empty').load(url+' .obss:last, .paginator', function()
    {
      $ctn.removeClass('n-ing n-empty');
    });
  }
  
  function extractUid(uri)
  {
    return uri.slice(29, -1);
  }
      
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
  
  $memberTabCtn.delegate('.n-groupLi', 'expand', function()
  {
    var $t = $(this),
      $bd = $t.addClass('n-on').find('.bd').show();
      
    $t.trigger('tweakScroll');
    if($bd.hasClass('n-empty'))
    {
      loadMemberLs($bd, $t.find('.hd a').attr('href')+'members');
    }
  }).
  delegate('.n-groupLi', 'collapse', function()
  {
    $(this).removeClass('n-on').find('.bd').hide();
  }).
  delegate('.n-groupLi', 'toggle', function()
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
  }).
  delegate('.n-groupLi', 'next', function()
  {
    var $t = $(this),
      $next = $t.nextAll('.n-groupLi:first');
      
    if($next.length)
    {
      $t.removeClass('n-cur');
      $next.addClass('n-cur');
      $next.trigger('tweakScroll');
    }
  }).
  delegate('.n-groupLi', 'prev', function()
  {
    var $t = $(this),
      $prev = $t.prevAll('.n-groupLi:first');
      
    if($prev.length)
    {
      $t.removeClass('n-cur');
      $prev.addClass('n-cur');
      $prev.trigger('tweakScroll');
    }
  }).
  delegate('.n-groupLi', 'tweakScroll', function()
  {
    var $t = $(this);
      
    $(document).scrollTop($t.offset().top);
  }).
  delegate('.n-groupLi .hd', 'click', function(e)
  {
    // avoid toggle by clicking the "enter" link 
    if($(e.target).is('a')) {return};
    
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
  
})(jQuery);
