/**-------------------------------------------------------------------------------------------------------------
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
 * 4) Connection to Vault using UserID and AppID
 *      a) VAULT_ADDR
 *      b) VAULT_APPID
 *      c) VAULT_USERID
 *
 * 5) Creation/Deletion of users
 *-------------------------------------------------------------------------------------------------------------/

//Declare Imports - https://www.npmjs.com/package/vault-client
 /**var Vault = require('vault-client');
 const vault_client = new Vault({
    url: process.env.VAULT_ADDR
});*/

//var node_vault_client = require('node-vault');
//var consul = require('consul');
//configureVaultClient();
//configureNodeVaultClient();
//configureConsulClient();

'use strict';

var restify = require('restify');
var generatePassword = require('password-generator');


/**class vaultClient{
    constructor() {
        this.clientToken="";
        this.restifyClient = null;
    }
    isAuthenticated(){
        if (this.clientToken==""){
            return false;
        }
        return true;
    }
    configureRestifyClient(){
            var options = {
                url: process.env.VAULT_ADDR,
                //headers: {
                //        'X-VAULT-TOKEN':this.clientToken
                //}
            };
            this.restifyClient = restify.createJSONClient(options);
    }
}*/

/**
 *  TODO: Need to arrive at a password generation mechanism
 *  This will be used by both original provisioning for generating root account as well as for bind/re-bind.
 *  The resulting credential will be stored in vault
 *
 */
var generateDBRootCredentials = function generateDBRootCredentials(instanceID) {
    var creds = {
        userID: "",
        password: ""
    };
    creds.userID = "brokered" + instanceID;
    creds.password = generatePassword(24, false, /[\d]/);
    return creds;
};

/**-----------------------------------------------------------
 *
 *  Mount new MySQL Secret Backend
 *
 *   1) Create new MySQL Mounts
 *      for Vault, e.g. mysql-dev-<groupid>-<instanceId>
 *   2) Configure connection to new instance
 *   3) Create read and write roles
 *
 *------------------------------------*/
function createMYSQLRootAccount(instanceCredentials, groupid, instanceID, vaultClient) {

    if (!vaultClient.isAuthenticated()) {
        authenticateViaAPPID(vaultClient);
    }
    //mount a new mysql secret backend
    var mountPoint = process.env.VAULT_MYSQL_MOUNT_BASE + "-" + groupid + "-" + instanceID;
    var path = process.env.VAULT_API_VERSION + process.env.VAULT_MOUNT_URL + mountPoint;
    var options = {
        type: "mysql",
        description: "MySQL Mount for Group:" + groupid + " Instance:" + instanceID
    };
    vaultClient.configureRestifyClient();
    vaultClient.restifyClient.put(path, options, function (err, req, res, obj) {
        if (err != null) {
            console.log(err, err.stack);
        }
        else {
            //TODO:Determine different response codes
            //configure the connection to the new instance mount point, the url will have to be updated
            //once the RDS instance has been fully provisioned
            path = process.env.VAULT_API_VERSION + mountPoint + process.env.VAULT_MYSQL_CONFIG_BASE;
            options = {connection_url: instanceCredentials.userID + ":" + instanceCredentials.password + "@tcp"};
            vaultClient.restifyClient.put(path, options, function (err, req, res, obj) {
                if (err != null) {
                    console.log(err, err.stack);
                }
                else {
                    //TODO:Determine different response codes
                    console.log('%j', obj);
                    //create write and read roles for the new instance
                }
            });

        }
    });


}

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


/**-------------------------------------------------------------------------------------
 *
 * Configure the MariaDB Master Account (Not RDS Account) for vault for the DB instance
 * Vault will require to store the root credentials based on the instance id
 *     Path: secret/
 *
 *--------------------------------------------------------------------------------------/

 /**
 *
 *  Configure Vault client based on vault-client package
 */
/*function configureVaultClient(){
 //login
 vault_client.login({
 backend: 'userpass',
 options: {
 username: process.env.VAULT_USERID,
 password: process.env.VAULT_APPID
 }});

 }*/

/**
 *
 *  Authenticate using AppID & UserID backend
 *  TODO: Update once understand error messages
 */

/**function authenticateViaAPPID(vaultClient){
    //var vaultPath =  process.env.VAULT_API_VERSION+process.env.VAULT_APPID_PATH + process.env.VAULT_APPID;
    var vaultPath = '/v1/auth/app-id/login/cfd2-rds-broker';
    var payload = {user_id:process.env.VAULT_USERID };
    var options = {
        url: 'http://52.41.9.191:8200'
        //headers: {
        //        'X-VAULT-TOKEN':this.clientToken
        //}
    };
    var vaultC = restify.createJsonClient(options);
    vaultC.post(vaultPath,payload,function(err,req,res,obj){
    //vaultClient.restifyClient.post(vaultPath,payload,function(err,req,res,obj){
        if (err!=null) {
            console.log(err, err.stack);
        }
        else{
          //save the vault client token that can be used for all subsequent requests
          //vaultClient.clientToken = obj.auth.client_token;
            console.log()=obj.auth.client_token;
            //vaultC.clientToken = obj.auth.client_token;
        }
    });
}*/

/**
 *
 *  Configure Consul client
 *
 *      host (String, default: 127.0.0.1): agent address
 *      port (String, default: 8500): agent HTTP(S) port
 *      secure (Boolean, default: false): enable HTTPS
 *      ca (String[], optional): array of strings or Buffers of trusted certificates in PEM format
 *      defaults (Object, optional): default options for method calls
 *      promisify (Boolean|Function, optional): convert callback methods to promises
 */
/*function configureConsulClient(){
 const consul_client = new Consul({
 url: process.env.VAULT_ADDR
 });
 //login
 consul_client.login({
 backend: 'userpass',
 options: {
 username: process.env.VAULT_USERID,
 password: process.env.VAULT_APPID
 }});

 }*/

//Export relevant elements
//module.exports.vaultClient = vaultClient;
//module.exports.authenticateViaAPPID = authenticateViaAPPID;
module.exports.generateDBRootCredentials = generateDBRootCredentials;
module.exports.retrieveRootPassword = retrieveRootPassword;
module.exports.createMySQLRootAccount = createMYSQLRootAccount;

