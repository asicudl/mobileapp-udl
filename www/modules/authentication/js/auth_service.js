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
        'NO_TOKEN_DATA': 23                     //There is no token data to try to validate
    };
    
    auth.authStatus = {
        apiToken : $q.defer(),
        hasToken : false,
        username: ''
    };
    
    auth.authenticate = function (url,authObject){
     //simulate a external request
        var deferred = $q.defer();

       $http.post(url,authObject).success(function(data){
            deferred.resolve(data);
        }).error (function (msg,status) {
           console.log ("Error authenticating data " + status);
           deferred.reject ({'msg':msg,'status':status});
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
                auth.ready.resolve();
            },
        
            //Service is ready    
            isReady: function (){
                return auth.ready.promise;
            },
        
            //Drops all logout session
            logout: function (){
                    delete window.sessionStorage.apiToken;
                    delete window.localStorage.token;
                    delete window.localStorage.username;
                    delete window.localStorage.device;
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
                        authCredentialStatus.resolve ();
                        
                    }).catch (function (data){
                        factoryObject.updateAuthStatus(false, username);
                        authCredentialStatus.reject (auth.errorCodes.ERROR_CREATING_TOKEN);
                    });
                    
                }).catch (function (data){
                    auth.authStatus.hasToken = false;
                    delete window.sessionStorage.apiToken;
                    
                    if (data.status === 400 || data.status === 401){
                        authCredentialStatus.reject (auth.errorCodes.NO_VALID_CREDENTIALS);
                    } else{
                        authCredentialStatus.reject (auth.errorCodes.CREDENTIALS_VALIDATION_FAILED);    
                    }
                    
                    

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
            isTokenAuth: function (){
                return auth.authStatus.apiToken.promise;
            },
            
            //Updates the auth status elements
            updateAuthStatus :function (hasToken, username){
                auth.authStatus.hasToken = hasToken;
                auth.authStatus.username = username;
            },
        
            authStatus: auth.authStatus,
            errorCodes : auth.errorCodes
    };
    return factoryObject;
}])

.factory('authInterceptor', function ($rootScope, $q) {
  return {
    
    request: function (config) {
      config.headers = config.headers || {};
      if (window.sessionStorage.apiToken) {
        config.headers.Authorization = 'Bearer ' + window.sessionStorage.apiToken;
      }
      return config;
    },
    
    response: function (response) {
      if (response.status === 401) {

      }
      return response || $q.when(response);
    }
  };

}).config (function ($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
});

