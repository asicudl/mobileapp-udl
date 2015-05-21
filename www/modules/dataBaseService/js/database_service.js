angular.module('starter.db', [])
.factory('DBService',function ($q){

    var db;
    var deferred = $q.defer();
    var ready = $q.defer();
    return {
            
        init: function (dbServiceConfig){
           
            console.log (dbServiceConfig.name + ' initialized');
            //This call is syncron

            if(window.cordova) {
                db = window.sqlitePlugin.openDatabase({name: dbServiceConfig.config.filename, location: 1});
            } else {
                db = window.openDatabase(dbServiceConfig.config.filename, '1', 'my database', 5 * 1024 * 1024);
            }
            
            //Announce service is ready
            ready.resolve();
            
            //Announce service is read
            deferred.resolve (db);
            
        },
        isReady: function(){
            return ready.promise;   
        },
        getDb: function (){
            return deferred.promise;
        }
    };
});