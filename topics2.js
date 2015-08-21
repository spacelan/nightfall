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

  var blockedIds = [];

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
              jAuthorLink = jPreview.find('.from a');

            if(0 == jAuthorLink.length){
              // load faield
              return;
            }

            var author = {
                uri: jAuthorLink.attr('href'),
                name: jAuthorLink.text()
              },
              locationCache = author.uri + '/location';

            author.id = author.uri.match(/\/people\/([\w\.-]+)\//)[1];

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
        jTr.find('td:eq(1)').html('<a data-uid="'+author.id+'" href="'+author.uri+'">'+author.name+'</a>');

        if(highlightLocations) {
          var found = false
          if (author.location.length > 0) {
            $.each(highlightLocations, function(idx, loc){
              if(author.location.indexOf(loc) > -1) {
                found = true;
                return false;
              }

              if(jTr.find('td:eq(3)').text().indexOf(loc) > -1) {
                found = true;
                return false;
              }
            });
          }

          if(!found) {
            jTr.addClass('ntf-quiet');
          }
        }

        if($.contains(blockedIds, author.id)) {
          jTr.addClass('ntf-quiet');
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

  function loadBlacklist(){
    $.ajax('/contacts/blacklist', {
      dataType: 'html',
      success: function(dom){
        var jBlDoc = $(dom);

        jBlDoc.find('.article .obu dd a').each(function(idx, el){
          try{
            blockedIds.push($(el).attr('href').match(/\/people\/([\w\.-]+)\//)[1]);
          } catch(TypeError) {
            console.log($(el));
          }
        });

        jDoc.trigger('ntf.blacklistLoaded');

        $.each(blockedIds, function(idx, el){
          $('.article .olt [data-uid="'+el+'"]').each(function(idx, el){
            $(el).closest('tr').addClass('ntf-quiet');
          });
        });
      }
    });
  }

  var jDoc = $(document);

  jDoc.on('ntf.init', function(argument) {
    $('.article, .aside').addClass('ntf');
    loadBlacklist();

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
