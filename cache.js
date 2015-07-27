window.NtfCache = (function(){
  TTL = 1000 * 60 * 60; // one hour
  NS = 'ntf.cache';

  function _prefix_key(key) {
    return NS + '.' + key;
  }

  function _is_expired(record) {
    return (new Date() - record['updated_at']) > TTL;
  }

  return {
    set: function(key, value){
      var record = {};
      record[_prefix_key(key)] = {
        value: value,
        updated_at: new Date()
      }
      chrome.storage.sync.set(record);
    },

    get: function(key, callback){
      var pk = _prefix_key(key);
      chrome.storage.sync.get(pk, function(items){
        var record = items[pk];
        if(undefined == record || _is_expired(record)) {
          callback(null);

        } else {
          callback(record['value']);
        }
      });
    },

    fetch: function(key, onGenerate, onValue){
      var pk = _prefix_key(key);
      chrome.storage.sync.get(pk, function(items){
        var record = items[pk];
        if(undefined == record || _is_expired(record)) {
          var value = onGenerate();

          var record = {};
          record[pk] = {
            value: value,
            updated_at: new Date()
          }
          chrome.storage.sync.set(record, function(){
            onValue(value);
          });

        } else {
          onValue(record['value']);
        }
      });
    },

    fetchAsync: function(key, onGenerate, onValue){
      var pk = _prefix_key(key);
      chrome.storage.sync.get(pk, function(items){
        var record = items[pk];
        if(undefined == record || _is_expired(record)) {
          onGenerate(function(value){
            var record = {};
            record[pk] = {
              value: value,
              updated_at: new Date()
            }
            chrome.storage.sync.set(record, function(){
              onValue(value);
            });
          });

        } else {
          onValue(record['value']);
        }
      })
    }

  };
})();
