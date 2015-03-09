angular.module('starter.auth', ['underscore']).factory('AuthService',['$http','$q','_',function ($http,$q,_){
   
    var authConfig = {};
    
    return {
            authenticate: function (username,password){
                //simulate a external request
                var deferred = $q.defer();
                setTimeout (function (){
                     deferred.resolve({'username':'alex',name: 'Alex'});   
                },1000);
                
                return deferred.promise;   
            },
            init: function (authServiceDef){
                authConfig = authServiceDef.config;
                console.log (authServiceDef.name + ' initialized');  

            }
    }

}]);