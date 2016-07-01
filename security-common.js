/**
 * This contains all functions in support of security for brokers, including but not limited to:
 * 1) Credential generation on a client bind
 *      a) Credential generation directly with storage in vault
 *      b) Credential generation through approrpiate Vault secret backend
 *
 * 2) Credential generation on a client re-bind
 *      a) Credential generation directly with replacement/deletion of previous credentials in vault
 *      b) Credential generation through appropriate Vault secret backend with previous replacement/deletion
 *         of previous credentials in Vault
 *
 * 3) Credential deletion on a delete binding or delete instance call
 *      a) On service binding deletion, deletion of appropriate Vault credentials
 *
 *
 */

//Declare Imports - https://www.npmjs.com/package/vault-client
var vault = require('vault-client');

/**
 *  TODO: Need to arrive at a password generation mechanism
 *  This will be used by both original provisioning for generating root account as well as for bind/re-bind.
 *  The resulting credential will be stored in vault
 *
 */
var generatePassword = function generatePassword(passwordLength) {
    var i = 0,
        result = "",
        possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (i = 0; i < passwordLength; i += 1) {
        result += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return result;
};

/**----------------------------------------------------
 * Retrieve root password for database server instance
 * TODO: Retrieve from Vault
 -----------------------------------------------------*/
 var retrieveRootPassword = function getRootPassword(instance) {
    /**var result = getTagValue(instance, 'CF-AWS-RDS-PASSWORD');
    if (!result) {
        result = getTagValue(instance, 'CF-AWS-PASSWORD');
    }
    return result;*/
    return null;
};


/**-------------------------------------------------------------------------
 * Broker uses basic authentication to ensure the API requestor is known
 * These credentials are generated when pushing broker, are encrypted and
 * stored in Cloud Controller database and passed from Cloud Controller
 * to broker during API invocation
 *
 * @param credentials
 * @returns {Function}
 --------------------------------------------------------------------------*/

var authenticate = function authenticate(credentials) {
    return function(request, response, next) {
        if (credentials.authUser || credentials.authPassword) {
            if (!(request.authorization && request.authorization.basic && request.authorization.basic.username === credentials.authUser && request.authorization.basic.password === credentials.authPassword)) {
                response.status(401);
                response.setHeader('WWW-Authenticate', 'Basic "realm"="' + server.name + '"');
                next(new restify.InvalidCredentialsError("invalid username or password"));
            } else {
                // authenticated!
            }
        } else {
            // no authentication required.
        }
        next();
    };
};

//Export relevant elements
module.exports.generatePassword = generatePassword;
module.exports.retrieveRootPassword = retrieveRootPassword;
module.exports.authenticate = authenticate;

