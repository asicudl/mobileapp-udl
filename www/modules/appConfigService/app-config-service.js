                                                                                                                                                                                                                                                                                                                                                                                                angular.module('starter.config', []).service('AppConfigService',['$http','$q',function ($http,$q){

    var configData = {};
         
    this.loadConfig = function (){
        var deferred = $q.defer();

        $http.get('/modules/appConfigService/config.json').success(function(data) {
             deferred.resolve(data);
        }).error (function (msg,code) {
            $http.get('/modules/appConfigService/default-config.json').success(function(data) {
                deferred.resolve(data);
            }).error (function(msg2,code2){
                deferred.reject(msg2); 
            });
        });

        return deferred.promise;
    };
            
    configData = this.loadConfig();
    
    this.getConfig = function (profilename){
         //return _.findWhere (configData,{id: profilename});  
        return configData;  
    };
    
}]); 