angular.module('starter.auth', ['underscore']).factory('AuthService',['$http','$q','_',function ($http,$q,_){
   
    var authConfig = {};
    var auth = this;
    auth.apiToken = $q.defer();
    
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
    
    var factoryObject = {
            
            authenticateByCredentials: function (username,password){
                return auth.authenticate (authConfig.auth_api_url +  authConfig.credentialsEP,{
                    "username":username,
                    "password": password
                });
            },
            authenticateByToken: function (username,device,token){
                return auth.authenticate (authConfig.auth_api_url +  authConfig.tokenEP,{
                    "username":username,
                    "device":device,
                    "token": token
                });
            },
            requestNewToken: function (username,device){
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
            },
            logout: function (){
                    delete window.sessionStorage.apiToken;
                    delete window.localStorage.token;
                    delete window.localStorage.username;
                    delete window.localStorage.device;
            },
            init: function (authServiceDef){
                authConfig = authServiceDef.config;
                
                //Look for a token
                var token = window.localStorage['authtoken'];
                var username = window.localStorage['username'];
                var device = window.localStorage['device'];
                
                if (token && username && device){
                    /*Don't confuse apitoken with token . The last one is one stored 
                    as mobile device password to auth and apitoken used to execute api*/
                    
                    this.authenticateByToken(username,device,token).then (
                        function (data){
                            
                            //In the case of token validation we can store apitoken directly here
                            window.sessionStorage.apiToken = data.token;
                            auth.apiToken.resolve(true);
                        }
                    ).catch (function(data) {
                        //Auth error implies that this token is no valid
                        if (data.status === 400 || data.status === 401){
                            delete window.sessionStorage.apiToken;
                            delete window.localStorage.token;
                        }
                        //maybe we have not connection here, we have to choose what to do
                        auth.apiToken.reject(data);
                    });
                }else{
                    delete window.sessionStorage.apiToken;
                    auth.apiToken.reject({'msg':'no auth token','status': 0});
                }
            },
            
            isTokenAuth: function (){
                return auth.apiToken.promise;
            }
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
        // handle the case where the user is not authenticated
      }
      return response || $q.when(response);
    }
  };

}).config (function ($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
});

