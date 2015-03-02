angular.module('starter.auth', ['underscore']).factory('AuthzService',['$http','$q','_',function ($http,$q,_){
   
    var authConfig = {};
    
    return {
            authenticate: function (username,password){
                //simulate a external request
                var deferred = $q.defer();
                setTimeout (function (){
                     deferred.resolve(true);   
                },1000);
                
                return deferred.promise;   
            },
            init: function (authServiceDef){
                authConfig = authServiceDef.config;
                console.log (authServiceDef.name + ' initialized');  

            }
    }

}]);