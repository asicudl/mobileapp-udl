angular.module('starter.agendaevents',[])
    .factory('AgendaService',function (AppConfigService, $rootScope, $q, DBService, $http) {
 
    var agendaConfig = {};

    //Load queries and errorCodes
   var  errorCodes = {
        // Local DB Errors
        'ERROR_READING_LOCAL_ITEM': 10,
        'ERROR_WRITING_ITEM' : 11,
        'ERROR_MODIFYING_ITEM' : 13,
        'ERROR_CREATING_TABLE': 14,
        'ERROR_PURGING_ITEMS': 15,

        // Remote agenda error
        'ERROR_RETRIEVING_AGENDA_ITEMS': 20,
        'ALREADY_RETRIEVING': 21,

        //Network accessing problems
        'USER_NOT_ALLOWED': 40
    };

    var queries = {
        'CREATE_TABLE' : 'CREATE TABLE IF NOT EXISTS agenda_items (id text primary key, title text, content text, location text,period text, eventdate date,state text)',
        'SELECT_ITEMS' : 'SELECT * FROM agenda_items order by eventdate',
        'INSERT_ITEM' : 'INSERT INTO agenda_items (title, content, location, period, eventdate, state, id) VALUES (?,?,?,?,?,?,?)',
        'UPDATE_ITEM' : 'UPDATE agenda_items SET title=?, content=?, location=?, period=?, eventdate=?, state=? WHERE id=?',
        'PURGE_ITEMS' :'DELETE FROM agenda_items WHERE state=? and eventDate ',
        'DELETE_ALL_ITEMS' :'DELETE FROM agenda_items'
    };
    
    var agndSrv = this;
    agndSrv.ready = $q.defer();
    agndSrv.retrieving = false;

    var loadAll = function (success,failure){
        var defered = $q.defer();

        DBService.getDb().then (function (db){
            db.transaction(
                function(tx) {

                    //load the list of agenda items
                    tx.executeSql (queries.SELECT_ITEMS,[],
                                   function(tx,res){
                        var agendaItems =[];

                        for (var i=0;i < res.rows.length; i++){
                            var row = res.rows.item(i);
                           
                            var itemDate = moment(row.eventdate);
                            
                            var item = {
                                _id: row.id,
                                title: row.title,
                                content: row.content,
                                location: row.location,
                                period: row.period,
                                state: row.state,
                                eventDate: row.eventdate,
                                hour: itemDate.format('HH:mm'),
                                dayMonth: itemDate.format('D MMM'),
                                dayOfWeek: itemDate.format ('dddd'),
                                numDayOfWeek: itemDate.format('E'),
                                eventDayStamp: itemDate.startOf('day').format ('x'),
                            };

                            agendaItems.unshift (item);
                        }
                        defered.resolve (agendaItems);
                    },function (error){
                        defered.reject (errorCodes.ERROR_READING_LOCAL_ITEMS);
                    });
                }, 
                function (txerror){
                    console.log ('Error getting the transaction for loading agenda items: ' + txerror.message);    
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
                tx.executeSql(create ? queries.INSERT_ITEM : queries.UPDATE_ITEM , [item.title, item.content, item.location,item.period, item.eventDate,  item.state, item._id ], 
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

    
    this.add = function(agendaItem) {
        var added = $q.defer();

        //TODO: Check for a validation instead of just exist
        if (agendaItem){
            //We ensure that we load all the agenda items before to add it
            factoryObject.getAgendaItems().then (function (){
                
                //Look if already exists, so update it
                var foundItem = _.findWhere(agndSrv.agendaItems,{_id: agendaItem._id});
                
                //Add the item into the array and save it to the db
                agndSrv.saveItem (agendaItem, (foundItem===undefined)).then (function (item){
                    var itemDate = moment(item.eventDate);
                    
                    item.dayMonth =  itemDate.format('D MMM');
                    item.dayOfWeek = itemDate.format ('dddd');
                    item.numDayOfWeek = itemDate.format('E');

                    item.hour = itemDate.format('HH:mm');
                    item.eventDayStamp = itemDate.startOf('day').format ('x');
                    
                    if (foundItem!==undefined){
                        angular.extend (foundItem,item);
                    }else if (item.state === 'active') {
                        agndSrv.agendaItems.unshift (item);   
                    }
                     
                    added.resolve();
                }).catch (function (error){
                    //Push up the error, nothing else to do
                    added.reject (error);
                });
            }).catch (function (error){
                console.log ('Error retrieving the agendaItems, so insertion can\'t be processed '); 
                added.reject (errorCodes.ERROR_WRITING_ITEM); 
            });
        }else{
            added.reject (errorCodes.ERROR_WRITING_ITEM); 
        }

        return added.promise;
    };

    
    var factoryObject = {
        init: function (agendaDef){
            agendaConfig = agendaDef.config;

            //Create agenda Table
            DBService.getDb().then (function (db){
                db.transaction(function(tx) {
                    //create a table it doesn't exist
                    tx.executeSql(queries.CREATE_TABLE, [], 
                                  function (tx,res) {
                        console.log (agendaDef.name + ' initialized');
                        agndSrv.ready.resolve();
                    },
                                  function (tx,err){
                        console.log ('Error creating the table' + err.message);
                        agndSrv.ready.reject (errorCodes.ERROR_CREATING_TABLE);
                    }
                                 );
                },
                               function (txerror){
                    console.log ('Error getting the transaction for creting table' + txerror.message);    
                    agndSrv.ready.reject (errorCodes.ERROR_CREATING_TABLE);
                });
            }).catch (function (error){
                agndSrv.ready.reject (errorCodes.ERROR_CREATING_TABLE);
            });
        },

        isReady : function (){
            return agndSrv.ready.promise;   
        },

        //get all agenda items from db
        getAgendaItems: function () {
            var defered =  $q.defer();
            if (agndSrv.agendaItems === undefined){
                loadAll().then (function (agendaItems){
                    agndSrv.agendaItems = agendaItems;
                    defered.resolve(agndSrv.agendaItems);
                }).catch (function (error){
                    console.log ('Error retrieving agenda items: ' + error);
                    defered.reject(error);
                });
            }else{
                defered.resolve(agndSrv.agendaItems);  
            }
            return defered.promise;
        },

        //get an stored item
        getAgendaItem : function(agendaItemId) {
            // Simple index lookup
            var deferred = $q.defer();

            this.getAgendaItems().then(function (agendaItems){
                deferred.resolve (_.findWhere (agendaItems, {_id: agendaItemId}));    
            }).catch (function (err){
                //Push up the error in case of error
                deferred.reject (err);
            });

            return deferred.promise;
        },

        //Look at the server for new messages
        retrieveNewItems: function (isRetry) {
            var updatedAgendaItems = $q.defer();

            //First prevent executing more than one retrieves 
            if (agndSrv.retrieving) {
                updatedAgendaItems.reject (errorCodes.ALREADY_RETRIEVING);
            }else{
                agndSrv.retrieving = true;

                var lastDate = window.localStorage['lastAgendaDate'];
                var lastDateParam;

                if (lastDate){
                    lastDateParam = {'lastAgendaDate' : new Date(lastDate)};
                }

                $http.post (agendaConfig.agenda_api_url + agendaConfig.agendaEP, lastDateParam)
                    .success(function (data){
                    var agendaInfo = data;
                    var allAdds = [];
                    
                    for (agendaIdx in agendaInfo.agendaItems){
                        allAdds.push (agndSrv.add (agendaInfo.agendaItems[agendaIdx]));
                    }
                    
                    //If there are changes just remove the discarded ones and update the list
                    if (allAdds.length > 0){
                        $q.all (allAdds).then (function(){
                            window.localStorage.lastAgendaDate = agendaInfo.currentDate;
                            agndSrv.retrieving = false;

                            factoryObject.purgeOld().then (function (){
                                updatedAgendaItems.resolve (agndSrv.agendaItems)
                            }).
                            catch (function (error){
                                updatedAgendaItems.reject (errorCodes.ERROR_PURGING_ITEMS);
                            });
                        });
                    }else{
                        window.localStorage.lastAgendaDate = agendaInfo.currentDate;
                        agndSrv.retrieving = false;
                        updatedAgendaItems.resolve (agndSrv.agendaItems);
                    }

                }).error (function (status){
                    updatedAgendaItems.reject(errorCodes.ERROR_RETRIEVING_ITEMS);
                    agndSrv.retrieving = false;
                });

                
            }

            return updatedAgendaItems.promise;
        },
                
        purgeOld: function () {
            var deleted = $q.defer();

            DBService.getDb().then(function (db){
                db.transaction(
                    function(tx) {
                        tx.executeSql (queries.PURGE_ITEMS,['deleted'],
                                       function(tx,res){ //Deletion success
                            
                            agndSrv.agendaItems = _.reject(agndSrv.agendaItems,function (item) {
                                return (item.state === 'deleted');
                            });
                            
                            deleted.resolve();
                            $rootScope.$apply ();
                        },
                        function (tx,error){ //Deletion error
                            console.log ('Error purgin  agenda items: ' + error.message);
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
