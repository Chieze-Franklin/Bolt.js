## Bolt.js

Bolt.js is a Node.js-based app runtime environment written in JavaScript.

[![Build Status](https://travis-ci.org/Chieze-Franklin/Bolt.js.svg?branch=master)](https://travis-ci.org/Chieze-Franklin/Bolt.js)

With Bolt.js you get to run your JavaScript web apps and websites in an environment rich with all the necessary support your app may need.

## Getting Started

* Bolt is built on Node.js, so ensure you have [Node](https://nodejs.org) (and npm) installed.
* Bolt also relies on MongoDB, so ensure you have [MongoDB](https://www.mongodb.com/) installed and running.
* Set the following environment variables:
	* PORT: Set this to the port on which the Bolt server will run. You do NOT set this on Heroku, as Heroku does that for you.
    * MONGODB_URI: Set this to your MongoDB URI, like 'mongodb://<user>:<password>@ds056789.mlab.com:56789/bolt' or 'mongodb://127.0.0.1:27017/bolt'
    * BOLT_ADDRESS: Set this to the host on which Bolt is to run, like 'https://my-bolt-app.herokuapp.com' or 'http://127.0.0.1:400' (no trailing slash '/', but include the http(s) protocol)
    * BOLT_SESSION_SECRET: Set this to a secret (like a password)
* Set the following optional environment variables if you want to support running apps that are not system (root) apps (Note that certain cloud services may no allow Bolt run apps this way):
    * BOLT_PROTOCOL: Set to the appropriate http/https protocol.
    * BOLT_IP: Set to the IP address on which the Bolt server will be running.
* Clone or pull the Bolt project to your repository.
* Run <code>npm install</code> to install dependencies.
* Configure Bolt as required in *sys/server/config.json*.
* Determine what should happen during setup in *sys/server/setup.json*.
* Run <code>npm start</code> or <code>node bolt</code>.
* On your browser, navigate to <code>{{BOLT_ADDRESS}}</code> (or, if you set the optional environment variables, <code>{{BOLT_PROTOCOL}}://{{BOLT_IP}}:{{PORT}}</code>) to start working in the Bolt environment.

## Building a Distributable Version

To build a version of Bolt that is focused on your end users, run <code>npm run build</code>.  
This will fetch relevant files from various places (including the *_docs* folder) and assemble a distributable build in the *dist* folder.

## Resources
Get up to speed on the whole Bolt thingy on the official [Bolt.js book](https://chieze-franklin.gitbooks.io/bolt-js/content/).

## Contribute

You can contribute to the project on [Github](https://github.com/Chieze-Franklin/Bolt.js).