# Jarvis Google Talk Adapter

Provides channels for chatting to the bot over Google Talk.

## Configuration

An example configuration can be seen below.

	"google-talk": {
		connections: [
			{
				jid: 'jid@host.com',
				password: 'password',
				host: 'server.hostname.com',
				port: 5222,
				keepalive: 1500
			}
		]
	}

### connections

An array of connection settings.

#### jid

Jabber ID to connect with.

#### password

Password for Jabber ID.

#### [host]

Hostname of the chat server.  Only required if the hostname isn't part of the Jabber ID.

#### [port]

Port of the chat server.  Defaults to 5222.

#### [keepAlive]

The interval in milliseconds to ping the chat server.  Defaults to 15 seconds.