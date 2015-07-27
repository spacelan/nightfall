/**
 * content scripts
 *
 * @author : snow@firebloom.cc
 * @license : GPLv3
 */

;(function($){
  if(typeof(Storage) == "undefined") {
    throw 'no local storage'
  }

  function processTopics() {
    var highlightLocations = false;
    chrome.storage.sync.get('highlightLocations', function(items){
      if(items.highlightLocations) {
        highlightLocations = items.highlightLocations;
      }
    });

    $('#content .topics tr').each(function(idx, el){
      var jTr = $(el),
        jTdSubject = jTr.find('.td-subject'),
        topicUri = jTdSubject.find('a').attr('href'),
        authorCache = topicUri + '/author';

      // for better visual experience on table layout
      jTr.prepend('<td class="td-loc" /><td class="td-author" />');

      NtfCache.fetchAsync(authorCache, function(setAuthor){
        // console.log('fetching: ' + authorCache);
        runAfterRandomTimeout(function(){
          var topicPreviewUri = topicUri +
            ' #content .topic-doc > h3, #content .topic-doc .topic-content';
          $('<div />').load(topicPreviewUri, function(resp){
            var jPreview = $(this),
              jAuthorLink = jPreview.find('.from a'),
              author = {
                uri: jAuthorLink.attr('href'),
                name: jAuthorLink.text()
              },
              locationCache = author.uri + '/location';

            NtfCache.fetchAsync(locationCache, function(setLocation){
              // console.log('fetching: ' + locationCache);
              runAfterRandomTimeout(function(){
                var authorCardUri = author.uri + ' #content .user-card .info';
                $('<div />').load(authorCardUri, function(resp){
                  var loc = $.trim($(this).find('.loc').text()).
                    replace(/[\s]*常居:[\s]*/, '');
                  setLocation(loc);
                });
              });

            }, function(location){
              author.location = location;
              setAuthor(author);
            }); // fetch locationCache
          }); // load topicPreviewUri
        }); // runAfterRandomTimeout

      }, function(author){
        jTr.find('td:eq(0)').text(author.location);
        jTr.find('td:eq(1)').html('<a href="'+author.uri+'">'+author.name+'</a>');

        if(highlightLocations) {
          var found = false
          if (author.location.length > 0) {
            $.each(highlightLocations, function(idx, loc){
              if(author.location.indexOf(loc) > -1) {
                found = true;
                return false;
              }
            });
          }

          if(!found) {
            jTr.addClass('ntf-quiet');
          }
        }
      }); // fetch authorCache
    });
  }

  function reloadTopics() {
    var jTbody = $('.article .olt tbody');
    if(jTbody.hasClass('ntf-loading')){ return; }

    jTbody.empty();
    jTbody.load('/group/ .article .olt tbody', function() {
      jDoc.trigger('ntf.load');
    });
  }

  function runAfterRandomTimeout(callback) {
    // 501 ~ 800
    var timeout = Math.floor((Math.random() * 10) + 1) * 30 + 500;
    setTimeout(callback, timeout);
  }

  var jDoc = $(document);

  jDoc.on('ntf.init', function(argument) {
    $('.article, .aside').addClass('ntf');

    jDoc.trigger('ntf.load');

    jDoc.keydown(function(evt){
      switch(evt.which) {
        // u for refresh
        case 85:
        reloadTopics();
        break;
      }
    });
  });

  jDoc.on('ntf.load', processTopics);

  if(localStorage['masterOn']) {
    jDoc.trigger('ntf.init');

  } else {
    $('.profile-entry .pic a').attr('href', 'javascript:;').click(function(evt){
      localStorage['masterOn'] = true;
      jDoc.trigger('ntf.init');
    });
  }

})(jQuery);
