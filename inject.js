/*
 * 
 */

(function($)
{
  var blackList = localStorage['snowhs/nightfall'],
    
    // constants
    
    // dom elements
    $topicLs = $('.olt'),
    
    // dom templates 
    $oprtsTpl = $('<div class="ntf-oprts"><a class="ntf-preview">preview</a>'+
      '<a class="ntf-hide">hide</a><a class="ntf-mute">mute</a></div>'),
    $previewTpl = $('<tr class="ntf-preview"><td colspan="5"></td></tr>');
    
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
    
  if('string' === typeof blackList)
  {
    blackList = blackList.split(',');
  }
  else
  {
    blackList = [];
  }
  
  $topicLs.find('tr.pl').each(function(idx, el)
  {
    var $li = $(this),
      uri = $li.find('td:first a').attr('href'),
      id = extractTopicId(uri);
    
    if(-1 === $.inArray(id, blackList))
    {
      $li.find('td:nth-child(5)').append($oprtsTpl.clone()).
        end().after($previewTpl.clone().find('td').load(uri+' .topic-content').end());
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
      $li.addClass('on').next('tr.ntf-preview').show('fast');
    } 
    else if($t.hasClass('ntf-hide'))
    {
      $li.removeClass('on').next('tr.ntf-preview').hide('fast');
    }       
  });
})(jQuery);
