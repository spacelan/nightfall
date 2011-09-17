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
    
    // dom templates 
    $oprtsTpl = $('<div class="ntf-oprts"><a class="ntf-preview" href="javascript:void(0)">preview</a>'+      
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
    
    if(-1 === $.inArray(id, muteTopic))
    {
      chrome.extension.sendRequest({
        "action" : 'muteTopic',
        "objectId" : id
      });
    }
  }
  
  function removeTopic($li)
  {
    $li.next('tr.ntf-preview').remove();
    $li.remove();        
  }
  
  //  let's jean!
  // -------------
  chrome.extension.sendRequest({"action": 'getMutedTopics'},
    function(response) {
      if(response.done)
      {
        mutedTopics = response.mutedTopics;
      }
      else
      {
        console && console.log('failed to load muted topics');
      }
      
      //  process topic list
      // --------------------
      $topicLs.find('tr.pl').each(function(idx, el)
      {
        var $li = $(this),
          uri = $li.find('td:first a').attr('href'),
          id = extractTopicId(uri);
        
        if(-1 === $.inArray(id, mutedTopics))
        {
          $li.find('td:nth-child(5)').
            append( $oprtsTpl.clone() ).end().after( $previewTpl.clone() );
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
    });
  
  // inject new member tab
  // ----------------------
  var $tabNav = $('.zbar>div'),
    $pgMain = $topicLs.closest('.indent'),
    
    $memberTabHandler = $tabNav.find('a:first').clone().
      attr('href','javascript:void(0)').attr('id','#ntf-memberTabHandler').text('Members').
      appendTo($tabNav),
      
    $topicTabHandler = $memberTabHandler.clone().
      addClass('on').attr('id','#ntf-topicTabHandler').text('Topics').
      replaceAll($tabNav.find('.now')),
    
    // dom templates
    $memberTabCtn = $('<div id="ntf-memberCtn" class="ntf-empty">loading</div>'),
    $groupLiTpl = $('<div class="ntf-groupLi">'+
        '<div class="hd"><a target="_blank" /></div>'+
        '<div class="bd ntf-empty" />'+
      '</div>'),
    $userLiTpl = false;
      
  //function       
  
  function loadGroupLs()
  {
    $('<div />').load('/group/mine .indent:last', function()
    {
      $memberTabCtn.empty().removeClass('ntf-empty');
      
      $.each($(this).find('dl'), function(idx, groupLi)
      {
        var $groupLink = $('dd a', this),
          groupName = $groupLink.text();
          uri = $groupLink.attr('href');
        
        $groupLiTpl.clone().
          find('a').text(groupName).attr('href', uri).
          end().appendTo($memberTabCtn) ;
      });
    });
  }
  
  function loadMemberLs($ctn, url)
  {
    if($ctn.hasClass('ntf-ing')) {return;}
    
    $ctn.text('loading...').addClass('ntf-ing ntf-empty').load(url+' .obss:last, .paginator', function()
    {
      $ctn.removeClass('ntf-ing ntf-empty');
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
    $memberTabHandler.addClass('on');
    $topicTabHandler.removeClass('on');
    
    if($memberTabCtn.hasClass('ntf-empty'))
    {
      loadGroupLs();
    }
  });    
  
  $topicTabHandler.click(function()
  {
    $memberTabCtn.detach();
    $topicLs.appendTo($pgMain);
    $topicTabHandler.addClass('on');
    $memberTabHandler.removeClass('on');
  });  
  
  $memberTabCtn.delegate('.ntf-groupLi .hd', 'click', function(e)
  {
    // avoid toggle by clicking the "enter" link 
    if($(e.target).is('a')) {return};
    
    var $groupLi = $(this).closest('.ntf-groupLi');
    
    if($groupLi.hasClass('on'))
    {
      $groupLi.removeClass('on').find('.bd').hide();
    }
    else
    {      
      var $bd = $groupLi.addClass('on').find('.bd').show();
      if($bd.hasClass('ntf-empty'))
      {
        loadMemberLs($bd, $groupLi.find('.hd a').attr('href')+'members');
      }
    }
  }).
  delegate('.ntf-groupLi .paginator a', 'click', function(e)
  {
    e.preventDefault();
    
    var $t = $(this);
    loadMemberLs($t.closest('.bd'), $t.attr('href'));
  });
  
})(jQuery);
