module.exports = function(RED) {

  var nforce = require('nforce');

  function Streaming(config) {
    RED.nodes.createNode(this,config);
    this.connection = RED.nodes.getNode(config.connection);
    var node = this;

    // get credentials from msg.sf if present and config values are blank
    if (msg.hasOwnProperty("sf")) {
      if (msg.sf.consumerKey && this.connection.consumerKey === '') {
        this.connection.consumerKey = msg.sf.consumerKey;
      }
      if (msg.sf.consumerSecret && this.connection.consumerSecret === '') {
        this.connection.consumerSecret = msg.sf.consumerSecret;
      }
      if (msg.sf.username && this.connection.username === '') {
        this.connection.username = msg.sf.username;
      }
      if (msg.sf.password && this.connection.password === '') {
        this.connection.password = msg.sf.password;
      }
    }
    
    // create connection object
    var org = nforce.createConnection({
      clientId: this.connection.consumerKey,
      clientSecret: this.connection.consumerSecret,
      redirectUri: this.connection.callbackUrl,
      environment: this.connection.environment,
      mode: 'single'
    });

    org.authenticate({ username: this.connection.username, password: this.connection.password }, function(err, oauth) {

      if(err) node.err(err);

      var client = org.createStreamClient();
      var stream = client.subscribe({ topic: config.pushTopic });
      node.log("Subscribing to topic: " + config.pushTopic );

      stream.on('error', function(err) {
        node.log('Subscription error!!!');
        node.log(err);
        client.disconnect();
      });

      stream.on('data', function(data) {
        node.send({
          payload: data
        });
      });

    });

  }
  RED.nodes.registerType("streaming",Streaming);
}
