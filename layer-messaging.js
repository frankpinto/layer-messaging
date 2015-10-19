/** @module LayerMessaging */
LayerMessaging = (function($, window) {

  /**
   * APP_ID given by Layer.com. Used to authenticate any user.
   *
   * @var {string} APP_ID
   */
  var APP_ID = null;

  /**
   * Session token used to sign all requests to Layer.com, gets populated after
   * authentication.
   *
   * @var {string} session_token
   */
  var session_token = null;

  /**
   * Layer.com API host.
   *
   * @var {string} server_url
   */
  var server_url = 'https://api.layer.com';

  /**
   * Layer.com endpoint to generate a new nonce at the start of the
   * authentication handshake.
   *
   * @var {string} nonces_endpoint
   */
  var nonces_endpoint = server_url + '/nonces';

  /**
   * Layer.com endpoint to generate a token to be used with every request in
   * this session.
   *
   * @var {string} sessions_endpoint
   */
  var sessions_endpoint = server_url + '/sessions';

  /**
   * Object that holds endpoints for the different Layer.com resources
   * including nonces, conversations, and messages. Populated after handshake
   *
   * @var {object} links
   */
  var links = null;


  /*
   * Public functions
   */

  var init = function(app_id, token) {
    APP_ID = app_id;

    if (token)
      session_token = token;
  };

  /*
   * Public functions - Authentication
   */

  var authenticate = function(callback) {
    post(nonces_endpoint, {}, getIdentityToken(function(identity_service_reply) {
      var token = identity_service_reply.response.token;

      createSession(token, callback);
    }));
  };

  /*
   * Public functions - Conversations
   */

  var listConversations = function(callback) {
    if (!session_token)
      throw new Error('Authentication required before sending messages.');

    get(server_url + '/conversations', function(data, textStatus, jqXHR) {
      var count = jqXHR.getResponseHeader('Layer-Count');

      callback(data);
    });
  };

  var getConversation = function(uuid, callback) {
    uuid = beforeChecks(uuid);

    get(links.conversations + '/' + uuid, function(data) {
      console.log(data);
      if (callback)
        callback(data);
    });
  };

  var createConversation = function(uuid, user_id, message, callback) {
    var data = JSON.stringify({participants: [user_id], distinct: true, metadata: {}});

    post(links.conversations, data, function(conversation_creation) {

      sendMessage(conversation_creation.id, user_id, message, function(message_addition) {
        messageHandler = sendMessage;
        callback(message_addition);
      });

    });
  };

  var messageHandler = createConversation;

  /*
   * Public functions - Messages
   */

  var getAllMessages = function(uuid, callback) {
    uuid = beforeChecks(uuid);

    get(links.conversations + '/' + uuid + '/messages', function(data) {
      if (callback)
        callback(data);
    });
  };

  var sendMessage = function(uuid, user_id, message, callback) {
    uuid = beforeChecks(uuid);

    var data = JSON.stringify({parts: [{mime_type: 'text/plain', body: message}]});

    post(links.conversations + '/' + uuid + '/messages', data, function(data) {
      callback(data);
    });
  };


  /*
   * Private functions
   */
  var getIdentityToken = function(callback) {
    return function(layer_response) {
      var nonce_data = {nonce: layer_response.nonce};

      $.post('/api/2/layer_tokens', nonce_data, callback);
    };
  };

  var createSession = function(token, callback) {
    var data = JSON.stringify({app_id: APP_ID, identity_token: token});

    post(sessions_endpoint, data, function(sessions_reply, status, jqXHR) {
      // Set state variables
      session_token = sessions_reply.session_token;
      links = parseLinkHeader(jqXHR.getResponseHeader('link'));

      callback(session_token);
    });
  };

  var beforeChecks = function(uuid) {
    if (!session_token)
      throw new Error('Authentication required before sending messages.');

    if (!uuid)
      throw new Error('Provided conversation UUID is empty.');

    return extractUUID(uuid);
  };

  var extractUUID = function(uuid) {
    if (uuid.indexOf('layer://') != -1) {
      var parts = uuid.split('/');
      uuid = parts[parts.length - 1];
    }

    return uuid;
  };

  var errorHandler = function(jqXHR, textStatus, errorThrown) {
    console.log(errorThrown);
  };

  var request = function(type, endpoint, data, callback) {
    var headers = {
      Accept: 'application/vnd.layer+json; version=1.0',
      "Content-Type": 'application/json'
    };

    if (session_token)
      headers.Authorization = 'Layer session-token="' + session_token + '"';

    $.ajax(endpoint, {
      type: type,
      data: data,
      headers: headers,
      timeout: 800,
      success: callback,
      error: errorHandler
    });
  };

  var get = function(endpoint, data, callback) {
    if (typeof data == 'function') {
      callback = data;
      data = {};
    }

    request('GET', endpoint, data, callback);
  };

  var post = function(endpoint, data, callback) {
    request('POST', endpoint, data, callback);
  };


  /*
   * Setup
   */

  if (window.conversation_uuid)
    messageHandler = sendMessage;


  /**
   * Public API
   * @exports LayerMessaging
   */
  return {
    init: init,
    authenticate: authenticate,
    listConversations: listConversations,
    getAllMessages: getAllMessages,
    messageHandler: messageHandler
  };
})(jQuery, window);
