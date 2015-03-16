angular.module('starter.db', [])
.factory('DBService',function ($q){

    var db;
    var deferred = $q.defer();
    
    return {
            
        init: function (dbServiceConfig){
           
            console.log (dbServiceConfig.name + ' initialized');
            //This call is syncron

            if(window.cordova) {
                db = window.sqlitePlugin.openDatabase({name: dbServiceConfig.config.filename, location: 1});
            } else {
                db = window.openDatabase(dbServiceConfig.config.filename, '1', 'my database', 5 * 1024 * 1024);
            }
            
            deferred.resolve (db);
        },
        
        getDb: function (){
            return deferred.promise;
        }
    };
});