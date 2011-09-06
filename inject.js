/*
 * 
 */

(function($)
{
  //  declearing vars and funcs
  // ------------------
  var blackList = localStorage['snowhs/nightfall'],
    
    // constants
    
    // dom elements
    $topicLs = $('.olt'),
    
    // dom templates 
    $oprtsTpl = $('<div class="ntf-oprts"><a class="ntf-preview" href="javascript:void(0)">preview</a>'+
      '<a class="ntf-enter" href="javascript:void(0)">enter</a>'+
      '<a class="ntf-hide" href="javascript:void(0)">hide</a>'+
      '<a class="ntf-mute" href="javascript:void(0)">mute</a></div>'),
    $previewTpl = $('<tr class="ntf-preview ntf-empty"><td colspan="5">loading...</td></tr>');
  
  
  function extractTopicId(uri)
  {
    return uri.slice(34, -1);
  }
  
  function muteTopic($li)
  {
    removeTopic($li);
    
    var id = extractTopicId($li.find('td:first a').attr('href'));
    
    if(-1 === $.inArray(id, blackList))
    {
      blackList.push(id);
      localStorage['snowhs/nightfall'] = blackList;
    }
  }
  
  function removeTopic($li)
  {
    $li.next('tr.ntf-preview').remove();
    $li.remove();        
  }
  
  //  let's jean!
  // -------------
  if('string' === typeof blackList)
  {
    blackList = blackList.split(',');
  }
  else
  {
    blackList = [];
  }
  
  //  process topic list
  // --------------------
  $topicLs.find('tr.pl').each(function(idx, el)
  {
    var $li = $(this),
      uri = $li.find('td:first a').attr('href'),
      id = extractTopicId(uri);
    
    if(-1 === $.inArray(id, blackList))
    {
      $li.find('td:nth-child(5)').
        append( $oprtsTpl.clone().find('.ntf-enter').attr('href', uri).end() ).
        end().after( $previewTpl.clone() );
    }
    else
    {
      removeTopic($li);
    }
  });
  
  $topicLs.delegate('.ntf-oprts a', 'click', function()
  {
    var $t = $(this),      
      $li = $t.closest('tr');
      
    if($t.hasClass('ntf-mute'))
    {
      muteTopic($li);
    }
    else if($t.hasClass('ntf-preview'))
    {
      var $preview = $li.addClass('on').next('tr.ntf-preview').show('fast');
      
      if($preview.hasClass('ntf-empty'))
      {
        $preview.find('td').load($li.find('td:first a').attr('href')+' .topic-content', function()
        {
          $(this).find('.topic-opt, .sns-bar').remove();
          $preview.removeClass('ntf-empty');
        });
      }
    } 
    else if($t.hasClass('ntf-hide'))
    {
      $li.removeClass('on').next('tr.ntf-preview').hide('fast');
    }       
  });
  
  // inject new member tab
  // ----------------------
  var $tabNav = $('.zbar>div'),
    $pgMain = $topicLs.closest('.indent'),
    $memberLs = $('<div id="ntf-memberLs">'),
    $memberTabHandler = $tabNav.find('a:first').clone().
      attr('href','javascript:void(0)').attr('id','#ntf-memberTabHandler').text('Members').
      appendTo($tabNav),
    $topicTabHandler = $memberTabHandler.clone().
      addClass('on').attr('id','#ntf-topicTabHandler').text('Topics').
      replaceAll($tabNav.find('.now'));
      
  //function     
      
  $memberTabHandler.click(function()
  {    
    $topicLs.detach();
    $memberLs.appendTo($pgMain);
    $memberTabHandler.addClass('on');
    $topicTabHandler.removeClass('on');
  });    
  
  $topicTabHandler.click(function()
  {
    $memberLs.detach();
    $topicLs.appendTo($pgMain);
    $topicTabHandler.addClass('on');
    $memberTabHandler.removeClass('on');
  });
  return;
  var members = [],
    $userLiTpl;
  
  $('<div>').load('/contacts/list .user-list', function()
  {
    var $t = $(this);
    $userLiTpl = $t.find('li:first');
    $t.empty().appendTo($memberLs);
  });
  
  $('<div />').load('/group/mine .indent:last', function()
  {
    $.each($(this).find('dl'), function(idx, groupLi)
    {
      $('<div />').load( $(groupLi).find('a:first').attr('href')+'members .obss:last', function()
      {
        $.each($(this).find('dl'), function(idx, memberLi)
        {
          var href = $(this).find('a:first').attr('href');
          console.log(href);
          if(-1 === $.inArray(href, members))
          {
            //members.push(href);
          }
        });
      });
    });
  });
})(jQuery);
