module.exports = function(RED) {

  var nforce = require('nforce');

  function Query(config) {
    RED.nodes.createNode(this,config);
    this.connection = RED.nodes.getNode(config.connection);
    var node = this;
    this.on('input', function(msg) {

      // show initial status of progress
      node.status({fill:"green",shape:"ring",text:"connecting...."});

      // use msg query if node's query is blank
      if (msg.hasOwnProperty("query") && config.query === '') {
        config.query = msg.query;
      }

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

      // auth and run query
      org.authenticate({ username: this.connection.username, password: this.connection.password }).then(function(){
        return org.query({ query: config.query })
      }).then(function(results) {
        msg.payload = {
          size: results.totalSize,
          records: results.records
        }
        node.send(msg);
        node.status({});
      }).error(function(err) {
        node.status({fill:"red",shape:"dot",text:"Error!"});
        node.error(err);
      });

    });
  }
  RED.nodes.registerType("soql",Query);
}
