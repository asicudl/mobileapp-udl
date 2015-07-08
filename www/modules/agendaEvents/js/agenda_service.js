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
        'ERROR_DELETING_ALL_ITEMS': 15,

        // Remote agenda error
        'ERROR_RETRIEVING_AGENDA_ITEMS': 20,
        'ALREADY_RETRIEVING': 21,

        //Network accessing problems
        'USER_NOT_ALLOWED': 40
    };

    var queries = {
        'CREATE_TABLE' : 'CREATE TABLE IF NOT EXISTS agenda_items (id text primary key, title text, content text, location text,period text, eventdate date,state text)',
        'SELECT_ITEMS' : 'SELECT * FROM agenda_items',
        'INSERT_ITEM' : 'INSERT INTO agenda_items (title, content, location, period, eventdate, state, id) VALUES (?,?,?,?,?,?,?)',
        'UPDATE_ITEM' : 'UPDATE agenda_items SET title=?, content=?, location=?, period=?, eventdate=?, state=? WHERE id=?',
        'PURGE_ITEMS' :'DELETE FROM agenda_items WHERE eventdate < ? OR state=\'deleted\'',
        'DELETE_ALL_ITEMS' :'DELETE FROM agenda_items'
    };
    
    var agenda = this;
    agenda.ready = $q.defer();
    agenda.retrieving = false;

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
                                eventDay: itemDate.startOf('day'),
                                dayMonth: itemDate.format('D MMM'),
                                dayOfWeek: itemDate.format ('dddd')
                                
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
                var foundItem = _.findWhere(agenda.agendaItems,{_id: agendaItem._id});
                
                //Add the item into the array and save it to the db
                agenda.saveItem (agendaItem, (foundItem===undefined)).then (function (item){
                    var itemDate = moment(item.eventdate);
                    
                    item.dayMonth =  itemDate.format('D MMM');
                    item.dayOfWeek = itemDate.format ('dddd');
                    item.eventDay =  itemDate.startOf('day');
                    if (foundItem!==undefined){
                        angular.extend (foundItem,item);
                    }else{
                        agenda.agendaItems.unshift (item);   
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
                        agenda.ready.resolve();
                    },
                                  function (tx,err){
                        console.log ('Error creating the table' + err.message);
                        agenda.ready.reject (errorCodes.ERROR_CREATING_TABLE);
                    }
                                 );
                },
                               function (txerror){
                    console.log ('Error getting the transaction for creting table' + txerror.message);    
                    agenda.ready.reject (errorCodes.ERROR_CREATING_TABLE);
                });
            }).catch (function (error){
                agenda.ready.reject (errorCodes.ERROR_CREATING_TABLE);
            });
        },

        isReady : function (){
            return agenda.ready.promise;   
        },

        //get all agenda items from db
        getAgendaItems: function () {
            var defered =  $q.defer();
            if (agenda.agendaItems === undefined){
                loadAll().then (function (agendaItems){
                    agenda.agendaItems = agendaItems;
                    defered.resolve(agenda.agendaItems);
                }).catch (function (error){
                    console.log ('Error retrieving agenda items: ' + error);
                    defered.reject(error);
                });
            }else{
                defered.resolve(agenda.agendaItems);  
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
            var numAgendaItems = $q.defer();

            //First prevent executing more than one retrieves 
            if (agenda.retrieving) {
                q.reject (errorCodes.ALREADY_RETRIEVING);
            }else{
                agenda.retrieving = true;

                var lastDate = window.localStorage['lastAgendaDate'];
                var lastDateParam;

                if (lastDate){
                    lastDateParam = {'lastAgendaDate' : new Date(lastDate)};
                }

                $http.post (agendaConfig.agenda_api_url + agendaConfig.agendaEP, lastDateParam)
                    .success(function (data){
                    var agendaInfo = data;
                    
                    for (agendaIdx in agendaInfo.agendaItems){
                        agenda.add (agendaInfo.agendaItems[agendaIdx]);
                    }

                    window.localStorage['lastAgendaDate'] = agendaInfo.currentDate;
                    agenda.retrieving = false;

                    var agendaNum = agendaInfo.agendaItems ? agendaInfo.agendaItems.length : 0;
                    numAgendaItems.resolve(agendaNum);

                }).error (function (status){
                    numAgendaItems.reject(errorCodes.ERROR_RETRIEVING_ITEMS);
                    agenda.retrieving = false;
                });

                
            }

            return numAgendaItems.promise;
        },
                
        purgeOld: function () {
            var deleted = $q.defer();

            DBService.getDb().then(function (db){
                db.transaction(
                    function(tx) {
                        tx.executeSql (queries.PURGE_ALL,[new Date()],
                                       function(tx,res){ //Deletion success
                            
                            agenda.agedaItems = _.reject(agenda.agendaItems, function (item){
                                return item.state==='deleted';   
                            });
                            
                            if (window.localStorage.lastAgendaDate) {
                                delete window.localStorage.lastAgendaDate;   
                            }
                            
                            deleted.resolve();
                            $rootScope.$apply ();
                        },
                                       function (tx,error){ //Deletion error
                            console.log ('Error purgin  agenda items: ' + error.message);
                            deleted.reject(errorCodes.ERROR_DELETING_ALL_ITEMS);
                        }
                            );
                    },
                    function (txerror){
                        console.log ('Error getting a transaction to purge all messages: ' + txerror.message);
                        deleted.reject(errorCodes.ERROR_DELETING_ALL_ITEMS);
                    }
                );
            }).catch (function (error){
                deleted.reject(errorCodes.ERROR_DELETING_ALL_ITEMS);
            });

            return deleted.promise;
        },
        errorCodes: errorCodes
    };
    
    return factoryObject;

    
});
