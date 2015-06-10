angular.module('starter.auth', ['underscore']).factory('AuthService',['$http','$q','_',function ($http,$q,_){
   
    var authConfig = {};
    var auth = this;
    
    auth.ready = $q.defer();
    
    auth.errorCodes = {
        'NO_VALID_CREDENTIALS' : 10,            //Credentials are not valid
        'CREDENTIALS_VALIDATION_FAILED': 11,    //Credentials validation process failed
        
        'NO_VALID_TOKEN': 20,                   //Token data is not valid
        'TOKEN_VALIDATION_FAILED': 21,          //APP stored token failed
        'ERROR_CREATING_TOKEN': 22,             //Token validation process failed
        'NO_TOKEN_DATA': 23,                     //There is no token data to try to validate
        
        'API_TOKEN_NO_VALID':   30
    };
    
    auth.authStatus = {
        apiToken : $q.defer(),
        hasToken : false,
        username: ''
    };
    
    auth.endpoint = {
        url : ''
    };
    
    auth.authenticate = function (url,authObject){
     //simulate a external request
        var deferred = $q.defer();

       $http.post(url,authObject).success(function(data){
            deferred.resolve(data);
        }).error (function (msg,status) {
           console.log ("Error authenticating data " + status);
           deferred.reject (status);
        });

        return deferred.promise;   
    };
    
    auth.authenticateByCredentials = function (username,password){
        return auth.authenticate (authConfig.auth_api_url +  authConfig.credentialsEP,{
            "username":username,
            "password": password
        });
    };
    
    auth.authenticateByToken = function (username,device,token){
        return auth.authenticate (authConfig.auth_api_url +  authConfig.tokenEP,{
            "username":username,
            "device":device,
            "token": token
        });
    };
    
    auth.requestNewToken = function (username,device){
       var token = $q.defer();

        $http.post (authConfig.auth_api_url + authConfig.createTokenEP, {
            "username":  username,
            "device": device
        }).success (function (data){
            token.resolve(data.token);
        }).error (function (msg,status){
            console.log ("Error creating the token");  
            token.reject ("token not created",0);
        });

        return token.promise;
    };
        
        
    var factoryObject = {
            
            //Initializes the service with configuration
            init: function (authServiceDef){
                authConfig = authServiceDef.config;
                auth.endpoint.url = authConfig.auth_api_url;
                auth.ready.resolve();
            },
        
            //Service is ready    
            isReady: function (){
                return auth.ready.promise;
            },
        
            //Drops all logout session
            logout: function (){
                    delete window.sessionStorage.apiToken;
                    delete window.localStorage.authtoken;
                    delete window.localStorage.username;
                    delete window.localStorage.device;
                    factoryObject.updateAuthStatus (false,'');
            },
        
            //Authentication by login and password
            authenticateByCredentials: function (username,password){
                
                var authCredentialStatus = $q.defer();
                
                auth.authenticateByCredentials(username,password).then(function (data){

                    // Store the apitoken to perform API calls
                    window.sessionStorage.apiToken = data.token;
                  
                    
                    //Get the device data information
                    var device;
                    try{
                        device = $cordovaDevice.getUUID();
                    }catch (exception){
                        device = '12345';   
                    }
                    
                    //if authentication successfull create a new token for the device
                    auth.requestNewToken(username,device).then (function (token){
                        window.localStorage.authtoken = token;
                        window.localStorage.username = username;
                        window.localStorage.device = device;
                        factoryObject.updateAuthStatus(true,username);
                        //Resolve the state here and not before to make sure that all data is stored correctly
                        auth.authStatus.apiToken.resolve(true);
                        authCredentialStatus.resolve ();
                        
                    }).catch (function (data){
                        factoryObject.updateAuthStatus(false, username);
                        
                        // Also delete apitoken to ensure nothing can be called
                        delete window.sessionStorage.apiToken;
                        auth.authStatus.apiToken.reject (auth.errorCodes.ERROR_CREATING_TOKEN);
                        authCredentialStatus.reject (auth.errorCodes.ERROR_CREATING_TOKEN);
                    });
                    
                }).catch (function (error){
                    auth.authStatus.hasToken = false;
                    delete window.sessionStorage.apiToken;
                    
                    if (error.status === 400 || error.status === 401){
                        authCredentialStatus.reject (auth.errorCodes.NO_VALID_CREDENTIALS);
                    } else{
                        authCredentialStatus.reject (auth.errorCodes.CREDENTIALS_VALIDATION_FAILED);    
                    }

                    // Also delete apitoken to ensure nothing can be called

                    delete window.sessionStorage.apiToken;
                    auth.authStatus.apiToken.reject (auth.errorCodes.ERROR_CREATING_TOKEN);
                });
                
                return authCredentialStatus.promise;
            },
        
            //Authentication by stored token, username and device
            authenticateByToken: function () {
                //Look for a token
                var token = window.localStorage['authtoken'];
                var username = window.localStorage['username'];
                var device = window.localStorage['device'];
                
                if (token && username && device){
                    /*Don't confuse apitoken with token . The last one is one stored 
                    as mobile device password to auth and apitoken used to execute api*/
                    auth.authStatus.hasToken = true;
                    auth.authStatus.username = username;
                    
                    auth.authenticateByToken(username,device,token).then (
                        function (data){
                            
                            //In the case of token validation we can store apitoken directly here
                            window.sessionStorage.apiToken = data.token;
                            auth.authStatus.apiToken.resolve(true);
                        }
                    ).catch (function(data) {
                        
                        //Auth error implies that suplied token is no valid anymore
                        if (data.status === 400 || data.status === 401){
                            delete window.sessionStorage.apiToken;
                            delete window.localStorage.token;
                            
                            //Delete also the auth token to force login/password auth
                            delete window.localStorage.authtoken;
                            auth.authStatus.apiToken.reject(auth.errorCodes.NO_VALID_TOKEN);    
                        }else{
                            //maybe we have not connection here, we have to choose what to do
                            auth.authStatus.apiToken.reject(auth.errorCodes.TOKEN_VALIDATION_FAILED);    
                        }

                        
                    });
                }else{
                    auth.authStatus.hasToken=false;
                    delete window.sessionStorage.apiToken;
                    auth.authStatus.apiToken.reject(auth.errorCodes.NO_TOKEN_DATA);
                }
                
                return auth.authStatus.apiToken.promise;
            },
            
            
            // Returns the promise corresponding to the authentication by token.
            hasApiToken: function (){
                return auth.authStatus.apiToken.promise;
            },
        
            invalidateApiToken: function (){
                delete window.sessionStorage.apiToken;
                //Re-set the promise to be able to be resolved again
                auth.authStatus.apiToken = $q.defer();
            },
            
            //Updates the auth status elements
            updateAuthStatus : function (hasToken, username){
                auth.authStatus.hasToken = hasToken;
                auth.authStatus.username = username;
            },
        
            authEndpoint: auth.endpoint,
            authStatus: auth.authStatus,
            errorCodes : auth.errorCodes
    };
    return factoryObject;
}])

.factory('authInterceptor', function ($rootScope,$injector,$q) {

     if (!String.prototype.startsWith) {
         
         String.prototype.startsWith = function(searchString, position) {
             position = position || 0;
             return this.lastIndexOf(searchString, position) === position;
         };
    };
    
    return {
        request: function (config) {
            var AuthService = $injector.get('AuthService');

            config.headers = config.headers || {};

            //Do not send the token unless the auth endpoint
            if (window.sessionStorage.apiToken && config.url.startsWith(AuthService.authEndpoint.url)) {
                config.headers.Authorization = 'Bearer ' + window.sessionStorage.apiToken;
            }

            return config;
        },
        responseError: function (rejection) {
            //injected manually to get around circular dependency problem.
            var AuthService = $injector.get('AuthService');

            //If we got an unauthorized response notify that api token auth is not valid anymore
            if ((rejection.status === 400 || rejection.status === 401) && rejection.config.url.startsWith(AuthService.authEndpoint.url)){
                AuthService.invalidateApiToken ();
            }

            return $q.reject(rejection);
        }
    };
    
}).config (function ($httpProvider) {
   $httpProvider.interceptors.push('authInterceptor');
});

