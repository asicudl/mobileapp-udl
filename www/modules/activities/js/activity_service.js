angular.module('starter.activities',[])
    .factory('ActivityService',function (AppConfigService, $rootScope, $q, DBService, $http) {

    var activityConfig = {};

    //Load queries and errorCodes
    var  errorCodes = {
        // Local DB Errors
        'ERROR_READING_LOCAL_ITEM': 10,
        'ERROR_WRITING_ITEM' : 11,
        'ERROR_MODIFYING_ITEM' : 13,
        'ERROR_CREATING_TABLE': 14,
        'ERROR_PURGING_ITEMS': 15,

        // Remote activity error
        'ERROR_RETRIEVING_ACTIVITY_ITEMS': 20,
        'ALREADY_RETRIEVING': 21,

        //Network accessing problems
        'USER_NOT_ALLOWED': 40
    };

    var queries = {
        'DROP_TABLE': 'DROP TABLE IF EXISTS activity_items',
        'CREATE_TABLE' : 'CREATE TABLE IF NOT EXISTS activity_items (id text primary key, title text, content text, location text,period text, duedate date, published boolean,state text,image mediumtext, eventurl text)',
        'SELECT_ITEMS' : 'SELECT * FROM activity_items ORDER BY date(duedate)',
        'INSERT_ITEM' : 'INSERT INTO activity_items (title, content, location, period, duedate, published, image, eventurl, state, id) VALUES (?,?,?,?,?,?,?,?,?,?)',
        'UPDATE_ITEM' : 'UPDATE activity_items SET title=?, content=?, location=?, period=?, duedate=?, published=?,image=?,eventurl=?,state=? WHERE id=?',
        'PURGE_ITEMS' :'DELETE FROM activity_items WHERE state=? or  published = 0',
        'DELETE_ALL_ITEMS' :'DELETE FROM activity_items'
    };

    var activityTableSchemaVersion = '1.1';
    
    var actService = this;
    actService.ready = $q.defer();
    actService.retrieving = false;

    var loadAll = function (success,failure){
        var defered = $q.defer();

        DBService.getDb().then (function (db){
            db.transaction(
                function(tx) {

                    //load the list of activity items
                    tx.executeSql (queries.SELECT_ITEMS,[],
                                   function(tx,res){
                        var activityItems =[];

                        for (var i=0;i < res.rows.length; i++){
                            var row = res.rows.item(i);

                            var item = {
                                _id: row.id,
                                title: row.title,
                                content: row.content,
                                location: row.location,
                                period: row.period,
                                state: row.state,
                                published: row.published,
                                dueDate: row.duedate,
                                image: row.image,
                                eventURL: row.eventurl,
                            };

                            activityItems.unshift (item);
                        }
                        defered.resolve (activityItems);
                    },function (error){
                        defered.reject (errorCodes.ERROR_READING_LOCAL_ITEMS);
                    });
                }, 
                function (txerror){
                    console.log ('Error getting the transaction for loading activity items: ' + txerror.message);    
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
                tx.executeSql(create ? queries.INSERT_ITEM : queries.UPDATE_ITEM , [item.title, item.content, item.location,item.period,item.dueDate,item.published,item.image,item.eventURL, item.state, item._id ], 
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

    this.add = function(activityItem) {
        var added = $q.defer();

        //TODO: Check for a validation instead of just exist
        if (activityItem){
            //We ensure that we load all the activity items before to add it
            factoryObject.getActivityItems().then (function (){

                //Look if already exists, so update it
                var foundItem = _.findWhere(actService.activityItems,{_id: activityItem._id});
                
                //We look for items we want "unpublish" or "delete".
                var discarded = activityItem.published === false || activityItem.state === "deleted";
                
                if(foundItem!==undefined && discarded){
                    //afegim totes les propietats per defecte per tenir un objecte sencer...
                    activityItem.created = Date.now;
                    activityItem.lastUpdate = Date.now;
                    activityItem.dueDate = {};
                    activityItem.title = "";
                    activityItem.period = "";
                    activityItem.content = "";
                    activityItem.location = "";
                    activityItem.eventURL = "";
                    activityItem.image = "";
                    activityItem.published = false;
                    activityItem.state = "deleted";
                }
                
                //We don't save 'new' items that in the server are marked as "unpublished" or "deleted" items.
                if(foundItem!==undefined || (foundItem===undefined && !discarded)){                    
                    //Add the item into the array and save it to the db
                    actService.saveItem (activityItem, (foundItem===undefined)).then (function (item){
                        if (foundItem!==undefined){
                            angular.extend (foundItem,item);
                        }else if (!discarded) {
                            actService.activityItems.unshift (item);   
                        }
                        
                        //true if new item, false if updated or deleted
                        added.resolve(foundItem===undefined);
                    }).catch (function (error){
                        //Push up the error, nothing else to do
                        added.reject (error);
                    });
                }else{
                    added.resolve(false);
                }
            }).catch (function (error){
                console.log ('Error retrieving the activityItems, so insertion can\'t be processed '); 
                added.reject (errorCodes.ERROR_WRITING_ITEM); 
            });
        }else{
            added.reject (errorCodes.ERROR_WRITING_ITEM); 
        }

        return added.promise;
    };


    var factoryObject = {
        init: function (activityDef){
            activityConfig = activityDef.config;

            //Create activity Table
            DBService.getDb().then (function (db){
                db.transaction(function(tx) {
                    
                    var createTable = function (){
                        tx.executeSql(queries.CREATE_TABLE, [], 
                            function (tx,res) {
                                    console.log (activityDef.name + ' initialized');
                                    localStorage.activityTableSchemaVersion = activityTableSchemaVersion;
                                   
                                    actService.ready.resolve();
                                    
                            },
                            function (tx,err){
                                    console.log ('Error creating the table' + err.message);
                                    actService.ready.reject (errorCodes.ERROR_CREATING_TABLE);
                        });
                    };
                    
                    var dropAndCreateTable = function (){
                        tx.executeSql(queries.DROP_TABLE, [], 
                        
                        function (tx,res) {
                            console.log (activityDef.name + ' table dropped');
                            //We trigger the table creation
                            createTable();
                            //Delete the date to force all items reload
                            if (localStorage.lastActivityDate){
                                delete localStorage.lastActivityDate;
                            }
                        },
                        function (tx,err){
                            console.log ('Error dropping the table' + err.message);
                            actService.ready.reject (errorCodes.ERROR_CREATING_TABLE);
                        });
                    };
                    
                    //create a table it doesn't exist
                    if (localStorage.activityTableSchemaVersion === undefined || localStorage.activityTableSchemaVersion !== activityTableSchemaVersion){
                        dropAndCreateTable();
                    } else {
                        //Try to create for the case for any reason it's not already created and 
                        createTable();
                    }
                },
                     function (txerror){
                    console.log ('Error getting the transaction for creting table' + txerror.message);    
                    actService.ready.reject (errorCodes.ERROR_CREATING_TABLE);
                });
            }).catch (function (error){
                actService.ready.reject (errorCodes.ERROR_CREATING_TABLE);
            });
        },

        isReady : function (){
            return actService.ready.promise;   
        },

        //get all activity items from db
        getActivityItems: function () {
            var defered =  $q.defer();
            if (actService.activityItems === undefined){
                loadAll().then (function (activityItems){
                    actService.activityItems = activityItems;
                    defered.resolve(actService.activityItems);
                }).catch (function (error){
                    console.log ('Error retrieving activity items: ' + error);
                    defered.reject(error);
                });
            }else{
                defered.resolve(actService.activityItems);  
            }
            return defered.promise;
        },

        //get an stored item
        getActivityItem : function(activityItemId) {
            // Simple index lookup
            var deferred = $q.defer();

            this.getActivityItems().then(function (activityItems){
                deferred.resolve (_.findWhere (activityItems, {_id: activityItemId}));    
            }).catch (function (err){
                //Push up the error in case of error
                deferred.reject (err);
            });

            return deferred.promise;
        },

        //Look at the server for new messages
        retrieveNewItems: function (isRetry) {
            var updatedActivityItems = $q.defer();

            //First prevent executing more than one retrieves 
            if (actService.retrieving) {
                updatedActivityItems.reject (errorCodes.ALREADY_RETRIEVING);
            }else{
                actService.retrieving = true;

                var lastDate = window.localStorage['lastActivityDate'];
                var lastDateParam;

                if (lastDate){
                    lastDateParam = {'lastActivityDate' : new Date(lastDate)};
                }
                $http.post (activityConfig.activity_api_url + activityConfig.activityEP, lastDateParam)
                    .success(function (data){
                    var activityInfo = data;
                    var allAdds = [];
                    for (activityIdx in activityInfo.activityItems){
                        allAdds.push(actService.add(activityInfo.activityItems[activityIdx]));
                    }

                    //If there are changes just remove the discarded ones and update the list
                    if (allAdds.length > 0){

                        $q.all (allAdds).then (function(results){
                            window.localStorage.lastActivityDate = activityInfo.currentDate;
                            actService.retrieving = false;
                            
                            var updateStatus = _.countBy(results, function(isNew) {
                                return isNew ? 'new': 'updated';
                            });

                            updateStatus.new = updateStatus.new ? updateStatus.new : 0;

                            
                            factoryObject.purgeOld().then (function (){
                                updatedActivityItems.resolve ({'activityItems': actService.activityItems,'numNewItems': updateStatus.new});
                            }).
                            catch (function (error){
                                updatedActivityItems.reject (errorCodes.ERROR_PURGING_ITEMS);
                            });
                        });
                    }else{
                        window.localStorage.lastActivityDate = activityInfo.currentDate;
                        actService.retrieving = false;
                        updatedActivityItems.resolve ({'activityItems': actService.activityItems,'numNewItems': 0});
                    }

                }).error (function (status){
                    
                    updatedActivityItems.reject(errorCodes.ERROR_RETRIEVING_ITEMS);
                    actService.retrieving = false;
                });


            }

            return updatedActivityItems.promise;
        },

        
        purgeOld: function () {
            var deleted = $q.defer();

            DBService.getDb().then(function (db){
                db.transaction(
                    function(tx) {
                        tx.executeSql (queries.PURGE_ITEMS,['deleted'],
                                       function(tx,res){ //Deletion success

                            actService.activityItems = _.reject(actService.activityItems,function (item) {
                                return (item.state === 'deleted');
                            });
                            
                            deleted.resolve();
                            $rootScope.$apply ();
                        },
                                       function (tx,error){ //Deletion error
                            console.log ('Error purgin  activity items: ' + error.message);
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
