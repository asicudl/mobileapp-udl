angular.module('starter.offeredservices',[])
    .factory('OfferedServicesService',function (AppConfigService, $rootScope, $q, DBService, $http) {

             var offeredServiceConfig = {};

             //Load queries and errorCodes
             var  errorCodes = {
             // Local DB Errors
             'ERROR_READING_LOCAL_ITEM': 10,
             'ERROR_WRITING_ITEM' : 11,
             'ERROR_MODIFYING_ITEM' : 13,
             'ERROR_CREATING_TABLE': 14,
             'ERROR_PURGING_ITEMS': 15,

             // Remote offered services error
             'ERROR_RETRIEVING_SERVICE_ITEMS': 20,
             'ALREADY_RETRIEVING': 21,

             //Network accessing problems
             'USER_NOT_ALLOWED': 40
             };

             var queries = {
             'CREATE_TABLE' : 'CREATE TABLE IF NOT EXISTS offeredservices_items (id text primary key, title text, content text, location text, attendingschedule text, published boolean,state text,image mediumtext,url text,gmapsurl text, phonenumber text, email text)',
             'SELECT_ITEMS' : 'SELECT * FROM offeredservices_items ORDER BY title',
             'INSERT_ITEM' : 'INSERT INTO offeredservices_items (title, content, location, attendingschedule,  published, image, url, gmapsurl, phonenumber, email, state, id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
             'UPDATE_ITEM' : 'UPDATE offeredservices_items SET title=?, content=?, location=?, attendingschedule=?,  published=?,image=?,url=?,gmapsurl=?,phonenumber=?, email=?,state=? WHERE id=?',
             'PURGE_ITEMS' :'DELETE FROM offeredservices_items WHERE state=?',
             'DELETE_ALL_ITEMS' :'DELETE FROM offeredservices_items'
             };

             var osService = this;
             osService.ready = $q.defer();
             osService.retrieving = false;

var loadAll = function (success,failure){
    var defered = $q.defer();

    DBService.getDb().then (function (db){
        db.transaction(
            function(tx) {

                //load the list of offered services items
                tx.executeSql (queries.SELECT_ITEMS,[],
                               function(tx,res){
                    var offeredServiceItems =[];

                    for (var i=0;i < res.rows.length; i++){
                        var row = res.rows.item(i);

                        var itemDate = moment(row.startDate);

                        var item = {
                            _id: row.id,
                            title: row.title,
                            content: row.content,
                            location: row.location,
                            attendingSchedule: row.attendingschedule,
                            state: row.state,
                            published: row.published,
                            image: row.image,
                            URL: row.url,
                            gmapsURL: row.gmapsurl,
                            phoneNumber: row.phonenumber,
                            email: row.email
                        };

                        offeredServiceItems.unshift (item);
                    }
                    defered.resolve (offeredServiceItems);
                },function (error){
                    defered.reject (errorCodes.ERROR_READING_LOCAL_ITEMS);
                });
            }, 
            function (txerror){
                console.log ('Error getting the transaction for loading offered services items: ' + txerror.message);    
                defered.reject (errorCodes.ERROR_READING_LOCAL_ITEMS);
            });
    }).catch (function (error){
        defered.reject (errorCodes.ERROR_READING_LOCAL_ITEMS); 
    });

    return defered.promise;
};

this.saveItem = function (item, create){

    var defered = $q.defer();

    DBService.getDb().then (function (db){
        db.transaction(function(tx) {
            tx.executeSql(create ? queries.INSERT_ITEM : queries.UPDATE_ITEM , [item.title, item.content, item.location,item.attendingSchedule,item.published,item.image,item.URL,item.gmapsURL,item.phoneNumber,item.email, item.state, item._id ], 
                          function (tx,res) {
                defered.resolve (item);
            },
                          function (tx,error){
                defered.reject (errorCodes.ERROR_WRITING_ITEM); 
            });
        },
                       function (txerror){
            console.log ('Error getting the transaction for creating item: ' + txerror.message);      
            defered.reject (errorCodes.ERROR_WRITING_ITEM); 
        });
    }).catch (function (error){
        defered.reject (errorCodes.ERROR_WRITING_ITEM); 
    });

    return defered.promise;     
};


this.add = function(offeredServiceItem) {
    var added = $q.defer();

    //TODO: Check for a validation instead of just exist
    if (offeredServiceItem){
        //We ensure that we load all the offered services items before to add it
        factoryObject.getOfferedServiceItems().then (function (){

            //Look if already exists, so update it
            var foundItem = _.findWhere(osService.offeredServiceItems,{_id: offeredServiceItem._id});

            //Add the item into the array and save it to the db
            osService.saveItem (offeredServiceItem, (foundItem===undefined)).then (function (item){

                if (foundItem!==undefined){
                    angular.extend (foundItem,item);
                }else if (item.state === 'active') {
                    osService.offeredServiceItems.unshift (item);   
                }

                added.resolve();
            }).catch (function (error){
                //Push up the error, nothing else to do
                added.reject (error);
            });
        }).catch (function (error){
            console.log ('Error retrieving the offeredServiceItems, so insertion can\'t be processed '); 
            added.reject (errorCodes.ERROR_WRITING_ITEM); 
        });
    }else{
        added.reject (errorCodes.ERROR_WRITING_ITEM); 
    }

    return added.promise;
};


var factoryObject = {
    init: function (offeredServiceDef){
        offeredServiceConfig = offeredServiceDef.config;

        //Create offered services Table
        DBService.getDb().then (function (db) {
            db.transaction(function(tx) {
                //create a table it doesn't exist
                tx.executeSql(queries.CREATE_TABLE, [], 
                              function (tx,res) {
                    console.log (offeredServiceDef.name + ' initialized');
                    osService.ready.resolve();
                },
                              function (tx,err){
                    console.log ('Error creating the table' + err.message);
                    osService.ready.reject (errorCodes.ERROR_CREATING_TABLE);
                }
                             );
            },
                           function (txerror){
                console.log ('Error getting the transaction for creting table' + txerror.message);    
                osService.ready.reject (errorCodes.ERROR_CREATING_TABLE);
            });
        }).catch (function (error){
            osService.ready.reject (errorCodes.ERROR_CREATING_TABLE);
        });
    },

    isReady : function (){
        return osService.ready.promise;   
    },

    //get all offered services items from db
    getOfferedServiceItems: function () {
        var defered =  $q.defer();
        if (osService.offeredServiceItems === undefined){
            loadAll().then (function (offeredServiceItems){
                osService.offeredServiceItems = offeredServiceItems;
                defered.resolve(osService.offeredServiceItems);
            }).catch (function (error){
                console.log ('Error retrieving offered services items: ' + error);
                defered.reject(error);
            });
        }else{
            defered.resolve(osService.offeredServiceItems);  
        }
        return defered.promise;
    },

    //get an stored item
    getOfferedServiceItem : function(offeredServiceItemId) {
        // Simple index lookup
        var deferred = $q.defer();

        this.getOfferedServiceItems().then(function (offeredServiceItems){
            deferred.resolve (_.findWhere (offeredServiceItems, {_id: offeredServiceItemId}));    
        }).catch (function (err){
            //Push up the error in case of error
            deferred.reject (err);
        });

        return deferred.promise;
    },

    //Look at the server for new messages
    retrieveNewItems: function (isRetry) {
        var updatedOfferedServiceItems = $q.defer();

        //First prevent executing more than one retrieves 
        if (osService.retrieving) {
            updatedOfferedServiceItems.reject (errorCodes.ALREADY_RETRIEVING);
        }else{
            osService.retrieving = true;

            var lastDate = window.localStorage['lastServicesUpdate'];
            var lastDateParam;

            if (lastDate){
                lastDateParam = {'lastServicesUpdate' : new Date(lastDate)};
            }

            $http.post (offeredServiceConfig.servicedirectory_api_url + offeredServiceConfig.servicedirectoryEP, lastDateParam)
                .success(function (data){
                var offeredServiceInfo = data;
                var allAdds = [];

                for (offeredServiceIdx in offeredServiceInfo.offeredServiceItems){
                    allAdds.push (osService.add (offeredServiceInfo.offeredServiceItems[offeredServiceIdx]));
                }

                //If there are changes just remove the discarded ones and update the list
                if (allAdds.length > 0){
                    $q.all (allAdds).then (function(){
                        window.localStorage.lastServicesUpdate = offeredServiceInfo.currentDate;
                        osService.retrieving = false;

                        factoryObject.purgeOld().then (function (){
                            updatedOfferedServiceItems.resolve (osService.offeredServiceItems)
                        }).
                        catch (function (error){
                            updatedOfferedServiceItems.reject (errorCodes.ERROR_PURGING_ITEMS);
                        });
                    });
                }else{
                    window.localStorage.lastServicesUpdate = offeredServiceInfo.currentDate;
                    osService.retrieving = false;
                    updatedOfferedServiceItems.resolve (osService.offeredServiceItems);
                }

            }).error (function (status){
                updatedOfferedServiceItems.reject(errorCodes.ERROR_RETRIEVING_SERVICE_ITEMS);
                osService.retrieving = false;
            });


        }

        return updatedOfferedServiceItems.promise;
    },

    purgeOld: function () {
        var deleted = $q.defer();

        DBService.getDb().then(function (db){
            db.transaction(
                function(tx) {
                    tx.executeSql (queries.PURGE_ITEMS,['deleted'],
                                   function(tx,res){ //Deletion success

                        osService.offeredServiceItems = _.reject(osService.offeredServiceItems,function (item) {
                            return (item.state === 'deleted');
                        });

                        deleted.resolve();
                        $rootScope.$apply ();
                    },
                                   function (tx,error){ //Deletion error
                        console.log ('Error purgin  offered services items: ' + error.message);
                        deleted.reject(errorCodes.ERROR_PURGING_ITEMS);
                    }
                                  );
                },
                function (txerror){
                    console.log ('Error getting a transaction to purge all messages: ' + txerror.message);
                    deleted.reject(errorCodes.ERROR_PURGING_ITEMS);
                }
            );
        }).catch (function (error){
            deleted.reject(errorCodes.ERROR_PURGING_ITEMS);
        });

        return deleted.promise;
    },
    errorCodes: errorCodes
};

return factoryObject;


});
