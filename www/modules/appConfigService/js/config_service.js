angular.module('starter.config', ['underscore']).factory('AppConfigService',['$http','$q','_',function ($http,$q,_){

     var confLoader = $q.defer();    
     
    
     var loadConfig = function (){
        
        var referenceURL = (window.cordova) ? '' : '/'; 
         
        $http.get(referenceURL + 'modules/appConfigService/config.json').success(function(data) {
             confLoader.resolve(data);
        }).error (function (msg,code) {
            $http.get(referenceURL + 'modules/appConfigService/default-config.json').success(function(data) {
                confLoader.resolve(data);
            }).error (function(msg2,code2){
                console.log ("Error loading data");
                confLoader.reject();
            });
        });
         
        return confLoader.promise;
    };
    
    var configData = loadConfig();
    
    return {
        getConfig : function (profilename){
            var deferred = $q.defer();
            
            configData.then (function (response){
                var dataProfile = _.findWhere(response.profiles,{id:profilename});
                deferred.resolve(dataProfile);
            });
            
            return deferred.promise;   
        },
        getUserConfig: function (){
         
            
        }
    };
    
}]); 