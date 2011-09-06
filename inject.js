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
    $memberContainer = $('<div id="ntf-memberLs" class="ntf-empty">loading</div>'),
    $memberLs = false,
    $memberTabHandler = $tabNav.find('a:first').clone().
      attr('href','javascript:void(0)').attr('id','#ntf-memberTabHandler').text('Members').
      appendTo($tabNav),
    $topicTabHandler = $memberTabHandler.clone().
      addClass('on').attr('id','#ntf-topicTabHandler').text('Topics').
      replaceAll($tabNav.find('.now')),
    members = [],
    $userLiTpl = false;
      
  //function     
  
  function loadMemberLs()
  {
    $('<div />').load('/contacts/list .user-list', function()
    {
      $memberLs = $(this).find('.user-list');      
      $userLiTpl = $memberLs.find('li:first').detach();
      
      $userLiTpl.find('.ban').remove();
      
      $memberLs.empty().appendTo($memberContainer.empty());
      $memberContainer.removeClass('ntf-empty');
      
      $('<div />').load('/group/mine .indent:last', function()
      {
        $.each($(this).find('dl'), function(idx, groupLi)
        {
          var $groupLi = $(groupLi),
            groupName = $groupLi.find('dd a').text();
          
          $('<div />').load( $(groupLi).find('a:first').attr('href')+'members .obss:last', function()
          {
            $.each($(this).find('dl'), function(idx, memberLi)
            {
              var $memberLi = $(this),
                href = $memberLi.find('a:first').attr('href');
              
              addMember({
                "uid" : extractUid(href),
                "username" : $memberLi.find('dd a').text(),
                "href" : href,
                "avatarUri" : $memberLi.find('img').attr('src'),
                "groupName" : groupName,
                "place" : $memberLi.find('dd span').text()
              });
            });
          });
        });
      });
    });
  }
  
  function extractUid(uri)
  {
    return uri.slice(29, -1);
  }
  
  function addMember(data)
  { console.log(data);
    if(-1 === $.inArray(data.uid, members))
    {
      var $memberLi = $userLiTpl.clone();
      
      $memberLi.find('a').attr('href', data.href).
        end().find('img').attr('src', data.avatarUri).
        end().find('h3').text(data.username).
        end().find('.info p:first').text(data.groupName).
        end().find('.info p:last').text(data.place).
        end().attr('id', data.uid);
        
      $memberLi.appendTo($memberLs);
      
      members.push(data.uid);
    }
    else
    {
      var $memberLi = $memberLs.find('#'+data.uid),
        $groups = $memberLi.find('.info p:first');
        
      $groups.text($groups.text()+', '+data.groupName);
    }
  }
      
  $memberTabHandler.click(function()
  {    
    $topicLs.detach();
    $memberContainer.appendTo($pgMain);
    $memberTabHandler.addClass('on');
    $topicTabHandler.removeClass('on');
    
    if($memberContainer.hasClass('ntf-empty'))
    {
      loadMemberLs();
    }
  });    
  
  $topicTabHandler.click(function()
  {
    $memberContainer.detach();
    $topicLs.appendTo($pgMain);
    $topicTabHandler.addClass('on');
    $memberTabHandler.removeClass('on');
  });  
})(jQuery);
