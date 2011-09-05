/*
 * Copyright (c) 2010 The Chromium Authors. All rights reserved.  Use of this
 * source code is governed by a BSD-style license that can be found in the
 * LICENSE file.
 */
/*var regex = /sandwich/;

// Test the text of the body element against our regular expression.
if (regex.test(document.body.innerText)) {
  // The regular expression produced a match, so notify the background page.
  chrome.extension.sendRequest({}, function(response) {});
} else {
  // No match was found.
}*/

(function($)
{
  var $topicLs = $('.olt'),
    muteBtnClass = 'ntf-mute',
    blackList = localStorage['snowhs/nightfall'];
    
  function extractTopicId(uri)
  {
    return uri.slice(34, -1);
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
      id = extractTopicId($li.find('td:first a').attr('href'));
    
    if(-1 === $.inArray(id, blackList))
    {
      $li.find('td:nth-child(5)').append('<a class="'+muteBtnClass+'">mute</a>');
    }
    else
    {
      $li.remove();
    }
  });
  
  $topicLs.delegate('.'+muteBtnClass, 'click', function()
  {
    var $t = $(this),      
      $li = $t.closest('tr'),
      id = extractTopicId($li.find('td:first a').attr('href'));
      
    $li.remove();
      
    if(-1 === $.inArray(id, blackList))
    {
      blackList.push(id);
      localStorage['snowhs/nightfall'] = blackList;
    }
  });
})(jQuery);
