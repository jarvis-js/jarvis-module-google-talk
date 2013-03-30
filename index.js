/*global module*/

var xmpp = require('node-xmpp');

module.exports = function(jarvis, module) {
	var adaptors = [];

	module.config.connections.forEach(function(connection) {
		adaptors.push(new GoogleTalkAdaptor(jarvis, connection));
	});

	module.unload = function() {
		for (var i = 0; i < adaptors.length; i++) {
			adaptors[i].disconnect();
		}
	};
};

/**
 * Google Talk constructor
 * @param  {object} jarvis obect
 * @param  {object} google talk config
 */
function GoogleTalkAdaptor(jarvis, config) {
	var self = this;

	this.jarvis = jarvis;
	this.config = config;
	this.users  = [];

	this.client = new xmpp.Client(config);

	this.client.on('online', function() {
		self.presence('Available');
	});
	this.client.on('error', function(error) {
		self.error(error);
	});
	this.client.on('stanza', function(stanza) {
		self.handle(stanza);
	});
}

/**
 * Send a presence stanza with the passed status
 * @param  {string} availibilty status
 */
GoogleTalkAdaptor.prototype.presence = function(status) {
	var self = this;

	var presence = new xmpp.Element('presence', {})
	.c('show')
	.t('chat')
	.c('status')
	.t(status);

	this.client.send(presence);
	this.keepAlive = setInterval(function() { 
		self.roster(); 
	}, self.config.keepAlive || 1500);
};

/**
 * Send a message
 * @param  {string} jid of the recipient
 * @param  {string} message to send
 */
GoogleTalkAdaptor.prototype.send = function(recipient, message) {
	var reply = new xmpp.Element('message', {
		to: recipient,
		type: 'chat'
	})
	.c('body')
	.t(message);

	this.client.send(reply);
};

/**
 * Setup the channel for sending/receiving message
 * @param  {string} identifier for the channel
 */
GoogleTalkAdaptor.prototype.channel = function(identifier) {
	var self = this;

	var channelIdentifier = 'googletalk:' + identifier;
	var channel = this.jarvis.getChannel(channelIdentifier);
	if ( ! channel) {
		channel = this.jarvis.createChannel(channelIdentifier);

		channel.say = function(message, response) {
			self.send(message.user.jid, response);
		};
	}
	return channel;
};

/**
 * Send a roster query to see the availbility of others
 */
GoogleTalkAdaptor.prototype.roster = function() {
	var query = new xmpp.Element('iq', {
		type: 'get',
		id: (new Date()).getTime()
	})
	.c('query', { xmlns: 'jabber:iq:roster' });

	this.client.send(query);
};

/**
 * Handle any incoming stanzas
 * @param  {string} incoming stanza
 */
GoogleTalkAdaptor.prototype.handle = function(stanza) {
	var self = this;
	if (stanza.is('message') && stanza.attrs.type !== 'error') {
		if (stanza.attrs.type === 'chat') {
			var channel = self.channel(stanza.attrs.to);
			channel.received(new channel.Message({
				body: stanza.getChild('body').getText(),
				direct: true,
				user: {
					identifier: 'googletalk:' + stanza.attrs.from,
					jid: stanza.attrs.from
				}
			}));
		}
	}
	else if (stanza.is('iq') && stanza.attrs.type == 'result') {
		stanza
		.getChild('query', 'jabber:iq:roster')
		.children
		.forEach(function(child) {
			if (self.users.indexOf(child.attrs.jid) === -1) {
				self.users.push(child.attrs.jid);
			}
		});
	}
};

/**
 * Close the connection
 */
GoogleTalkAdaptor.prototype.end = function() {
	if (this.keepAlive) {
		clearInterval(this.keepAlive);
	}
	this.client.end();
};

/**
 * Handle any errors
 * @param  {string} error
 */
GoogleTalkAdaptor.prototype.error = function(error) {
	this.jarvis.log.error(error);
};

/**
 * Handle a disconnect
 */
GoogleTalkAdaptor.prototype.disconnect = function() {
	this.end();
};
