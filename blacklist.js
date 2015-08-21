;(function($){
  // TODO refactor
  function runAfterRandomTimeout(callback) {
    // 501 ~ 800
    var timeout = Math.floor((Math.random() * 10) + 1) * 30 + 500;
    setTimeout(callback, timeout);
  }

  function clear(evt){
    $('.article .obu').each(function(idx, el){
      var jEl = $(el);
      var jLink = jEl.find('dd a');
      if(jLink.text() == '[已注销]') {
        runAfterRandomTimeout(function(){
          $.ajax(jLink.attr('href'), {
            dataType: 'html',
            success: function(dom){
              var jProfile = $(dom);
              if(jProfile.find('.article > .infobox').length > 0) {
                runAfterRandomTimeout(function(){
                  // yes it's a fucking GET!
                  $.get(jEl.find('dt [href^="/contacts/blacklist?remove"]').attr('href'), function(){
                    console.log('done');
                  });
                });
              }
            }
          }); // ajax
        }); // runAfterRandomTimeout
      }
    }); // each
  } // clear

  $('<p class="pl2">&gt;&nbsp;<a href="javascript:;">clear</a></p>').
    on('click', 'a', clear).
    prependTo($('.aside'));
})(jQuery);
