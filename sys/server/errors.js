'use strict';

module.exports = {
	'100': "Endpoint not specified",
	'103': "Could not find endpoint",

	'200': "Username and/or password missing",
	'201': "A user with the same username already exists",
	'202': "Could not save user to the database",
	'203': "Could not retrieve user from the database",

	'212': "Could not log user in",
	'213': "Could not get logged-in user",


	'300': "Role name missing",
	'301': "A role with the same name already exists",
	'302': "Could not save role to the database",
	'303': "Could not retrieve role from the database",

	'310': "Username and/or role name missing",
	'311': "A user-role with the same user and role already exists",
	'312': "Could not save user-role to the database",
	'313': "Could not retrieve user-role from the database",

	'320': "App name and/or role name missing",
	'321': "An app-role with the same app and role already exists",
	'322': "Could not save app-role to the database",
	'323': "Could not retrieve app-role from the database",


	'400': "App name missing",
	'401': "An app with the same name already exists",
	'402': "Could not save app to the database",
	'403': "Could not retrieve app from the database",
	'404': "Could not start app due to security concerns",

	'410': "App path missing",
	'414': "Could not install app due to unsupported target version",

	'420': "App port missing",

	'432': "Could not save plugin to the database",
	'433': "Could not retrieve plugin from the database",


	'504': "This app is not a system app",

	'510': "Object to tokenize missing",


	'600': "File name missing",
	'601': "A file with the same name already exists",
	'602': "Could not save file",
	'603': "Could not retrieve file"
};