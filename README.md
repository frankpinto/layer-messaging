# LayerMessaging

This is a Javascript library to interface with Layer.com's client API from the browser. As of right now there's no way use Layer.com's from the browser, this offers the beginning of way to do that. Currently supports the following:

* Listing conversations
* Creating a conversation
* Retrieving a conversation
* Retrieving a list of messages
* Adding a message to an existing conversation

## Setup
Just include it on your site with `<script src="/path/to/layer-messaging.js"></script>`

## Usage
Here's quick example usage, will add more soon. Check out the code if you want to see how to use the functions mentioned above. First, setup:

```javascript
LayerMessaging.init(YOUR_LAYER_APP_KEY);
```

Then, create a conversation:

```javascript
LayerMessaging.createConversation(profile_id, message, function(conversation_data) {
  if (!conversation_data.id) {
    console.log('Couldn\'t send message');
    return;
  }

  console.log('Layer UUID for created conversation is ' + conversation_data.id);

  // Here you would follow up with adding message to conversation,
  // updating view, resetting input field, viewIf message wasn't successfully
});
```

## TODO
* Add support for WebSocket API
* Add RequireJS define
* Add to bower registry
