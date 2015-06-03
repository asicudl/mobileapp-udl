angular.module('starter.messages', [])
.factory('MessagesService', function (AppConfigService, $rootScope, AuthService, $q, DBService, $http){

    var pushConfig = {};
    
    //Load queries and errorCodes
    
    var  errorCodes = {
        // Local DB Errors
        'ERROR_READING_LOCAL_MSGS': 10,
        'ERROR_WRITING_MSG' : 11,
        'ERROR_DELETING_MSG': 12,
        'ERROR_MODIFYING_MSG' : 13,
        'ERROR_CREATING_TABLE': 14,
        'ERROR_DELETING_ALL_MSGS': 15,
        
        // Remote messages error
        'ERROR_RETRIEVING_MSGS': 20,
        
        // Push Service Registration
        'ERROR_REGISTERING_DEVICE': 30,
        'ERROR_UNASSOCIATING_DEVICE': 31,
        'ERROR_UNREGISTERING_DEVICE': 32,
        'ERROR_SETTING_UP_REGISTRATION': 33,
        'PUSH_FEATURE_NOT_PRESENT': 34,

        //Network accessing problems
        'USER_NOT_ALLOWED': 40
    };
    
    var registrationState = {
        'REGISTRATION_OK' : 10,
        'REGISTRATION_FAILED': 11,
        
        'UNASSOCIATION_OK': 20,
        'UNASSOCIATION_FAILED': 21,
        
        'UNREGISTRATION_OK': 30,
        'UNREGISTRATION_FAILED': 31
    };
    
    var queries = {
        'CREATE_TABLE' : 'CREATE TABLE IF NOT EXISTS messages (id text primary key, subject text, body text, site text, sitename text,author text, date date,category text,url text,state text)',
        'SELECT_MESSAGES' : 'SELECT * FROM messages',
        'INSERT_MESSAGE' : 'INSERT INTO messages (id,subject,body,site,sitename,author,date,category,url,state) VALUES (?,?,?,?,?,?,?,?,?,?)',
        'DELETE_MESSAGE' :'DELETE FROM messages WHERE id=?',
        'DELETE_ALL_MESSAGES' :'DELETE FROM messages',
        'CHANGE_STATE' : 'UPDATE messages set state=? WHERE id=?'
    };
    
    var prettyDates = [
            {name:'Today',order:0},
            {name:'Yesterday',order:1},
            {name:'This Week',order:2},
            {name:'Last Week',order:3},
            {name:'This Month',order:4},
            {name:'Later',order:5}
    ];
    
    this.messages = undefined;
    
    var msg = this;
    msg.ready = $q.defer();

    
    var loadAll = function (success,failure){
        var defered = $q.defer();
        
        DBService.getDb().then (function (db){
            db.transaction(
                function(tx) {
            
                    //load the list of messages
                    tx.executeSql (queries.SELECT_MESSAGES,[],
                        function(tx,res){
                            var messages =[];

                            for (var i=0;i < res.rows.length; i++){
                                var row = res.rows.item(i);
                                var pdate = getPrettyDate(row.date);

                                var message = {
                                    id: row.id,
                                    subject: row.subject,
                                    body: row.body,
                                    site: row.site,
                                    sitename: row.sitename,
                                    author: row.author,
                                    action: 'open',
                                    category: row.category,
                                    url: row.url,
                                    date: row.date,
                                    prettyDateFormat: pdate.name,
                                    prettyDateOrder : pdate.order,
                                    state: row.state
                                };

                                messages.unshift (message);
                            }
                            defered.resolve (messages);
                    },function (error){
                        defered.reject (errorCodes.ERROR_READING_LOCAL_MSGS);
                    });
            }, 
            function (txerror){
                console.log ('Error getting the transaction for loading messages: ' + txerror.message);    
                defered.reject (errorCodes.ERROR_READING_LOCAL_MSGS);
            });
        }).catch (function (error){
            defered.reject (errorCodes.ERROR_READING_LOCAL_MSGS); 
        });
    
        return defered.promise;
    };
    
    //A hard time consuming function. It must be improved and see how is called
    var getPrettyDate = function (date){
        var nowdate = moment();
        var yesterday = moment().subtract(1,'days');
        var lastweek = moment().subtract(1,'weeks');
        var mdate = moment(date);
        
        if (mdate.isSame(nowdate,'month')){
            if (mdate.isSame(nowdate,'week')){
                if (mdate.isSame(nowdate,'day')){
                       return prettyDates[0];
                }else if (mdate.isSame (yesterday,'day')){
                    return prettyDates[1];   
                }
                return prettyDates[2];
            }else if (mdate.isSame(lastweek,'day')){
                return prettyDates[3];
            }
            return prettyDates[4];
        }else{
            return prettyDates[5];  
        }
    };

    var onNotification = function(event) {
            factoryObject.retrieveNewMessages().then (function (numMessages){
                $rootScope.$apply ();  
            });
    };
    
    var setRegistrationState = function (status){
        window.localStorage.registrationStatus = status;
    }
    
    this.createMessage = function (data){
       
        var defered = $q.defer();
        
        if (!data.created){
            data.created = new Date (data.created);
        }
        
        var pdate = getPrettyDate(data.created);
        
        var message = {
            id: '' + Math.floor(Math.random()* 10000),
            subject: data.subject,
            body: data.content,
            site: data.siteId,
            sitename: data.siteTitle,
            category: 'cv',
            url: data.notiURL,
            author: data.author,
            date: data.created,
            prettyDateFormat: pdate.name,
            prettyDateOrder : pdate.order,
            state: 'new'
        };

        DBService.getDb().then (function (db){
            db.transaction(function(tx) {
                    tx.executeSql(queries.INSERT_MESSAGE, [message.id,message.subject,message.body,message.site,message.sitename,message.author,message.date,message.category,message.url,message.state],
                      function (tx,res) {
                          defered.resolve (message);
                      },
                      function (tx,error){
                          defered.reject (errorCodes.ERROR_WRITING_MSG); 
                      });
                },
                function (txerror){
                    console.log ('Error getting the transaction for creating messages: ' + txerror.message);      
                    defered.reject (errorCodes.ERROR_WRITING_MSG); 
            });
        }).catch (function (error){
            defered.reject (errorCodes.ERROR_WRITING_MSG); 
        });
        
        return defered.promise;     
    };

    this.add = function(messageIn) {
        var added = $q.defer();
        
        //TODO: Check for a validation instead of just exist
        if (messageIn){
            //We ensure that we load all the messages before to add it
            factoryObject.getMessages().then (function (){
            
                //Add the message into the array and save it to the db
                msg.createMessage (messageIn).then (function (message){
                    msg.messages.unshift (message);
                    added.resolve();
                }).catch (function (error){
                    //Push up the error, nothing else to do
                    added.reject (error);
                });
            }).catch (function (error){
                console.log ('Error retrieving the messages, so insertion can\'t be processed '); 
                added.reject (errorCodes.ERROR_WRITING_MSG); 
            });
        }else{
             added.reject (errorCodes.ERROR_WRITING_MSG); 
        }
        
        return added.promise;
    };

    /** 
    * Return the exposed methods
    **/
    
    var factoryObject = {
        init: function (pushServiceDef){
            pushConfig = pushServiceDef.config;

            //Create messages Table
            DBService.getDb().then (function (db){
                db.transaction(function(tx) {
                    //create a table it doesn't exist
                    tx.executeSql(queries.CREATE_TABLE, [], 
                        function (tx,res) {
                            console.log (pushServiceDef.name + ' initialized');
                            msg.ready.resolve();
                        },
                        function (tx,err){
                            console.log ('Error creating the table' + err.message);
                            msg.ready.reject (errorCodes.ERROR_CREATING_TABLE);
                        }
                    );
                },
                function (txerror){
                    console.log ('Error getting the transaction for creting table' + txerror.message);    
                    msg.ready.reject (errorCodes.ERROR_CREATING_TABLE);
                });
            }).catch (function (error){
                msg.ready.reject (errorCodes.ERROR_CREATING_TABLE);
            });
        },
        
        isReady : function (){
            return msg.ready.promise;   
        },
        
        registerDevice : function (){
            var registered  = $q.defer();
            
            var successRegisterHandler = function () {
                console.log ('Registration to PUSH service was success');
                setRegistrationState (registrationState.REGISTRATION_OK);
                registered.resolve(); 
            };

            var errorRegisterHandler = function (message) {
                console.log ('Error registering device to push service' + message);
                setRegistrationState (registrationState.REGISTRATION_FAILED);
                registered.reject(errorCodes.ERROR_REGISTERING_DEVICE);
            };
            
            
            AuthService.isTokenAuth().then(function (profile){
                 //setup the push service
                try{
                    // Set the alias name to the pushConfig
                    var token = window.localStorage['authtoken'];
                    var username = window.localStorage['username'];
                    var device = window.localStorage['device'];

                    //We don't use the real username and password for authentication
                    pushConfig.android.variantID =  username + ';;' + device;
                    pushConfig.android.variantSecret = token; 
                    pushConfig.alias = username;

                    // We delegate the registration to the cordova plugin ...
                    push.register(onNotification, successRegisterHandler, errorRegisterHandler, pushConfig);

                }catch (err) {
                    console.log ('Push service undefined or invalid, can\'t register: ' + err);        
                    //Something went wrong
                    setRegistrationState (registrationState.REGISTRATION_FAILED);
                    registered.reject(errorCodes.ERROR_SETTING_UP_REGISTRATION);
                }
            }).catch (function (error){
                console.log ('Registrations was called but it was not authenticated: ' + error);
                setRegistrationState (registrationState.REGISTRATION_FAILED);
                registered.reject(errorCodes.USER_NOT_ALLOWED);
            });
            
            return registered.promise;
        },
       
        unassociateDevice : function (success,failure) {
            var unassociated = $q.defer();
         
            var successUnassociateHandler = function () {
                console.log ('Unassociation to PUSH service was success');
                setRegistrationState (registrationState.UNASSOCIATION_OK);
                unassociated.resolve(); 
            };

            var errorUnassociateHandler = function (message) {
                console.log ('Error unassociating device to push service' + message);
                setRegistrationState (registrationState.UNASSOCIACIATION_FAILED);
                unassociated.reject(errorCodes.ERROR_UNASSOCIATING_DEVICE);
            };

            //That way we announce to aerogear to unsubcribe from notigications
            AuthService.isTokenAuth().then(function (profile){
                try{
                    pushConfig.alias = 'unregister';
                    push.register(onNotification, successUnassociateHandler, errorUnassociateHandler, pushConfig);
                }catch (err){
                    console.log ('Push service undefined or invalid, can\'t unassociate' + err);
                    setRegistrationState (registrationState.UNASSOCIACIATION_FAILED);
                    unassociated.reject(errorCodes.ERROR_SETTING_UP_REGISTRATION);
                }
            }).catch (function (error){
                    console.log ('Unassociation was called but it was not authenticated: ' + error);
                    setRegistrationState (registrationState.UNASSOCIACIATION_FAILED);
                    unassociated.reject(errorCodes.USER_NOT_ALLOWED);
            });  
            
            return unassociated.promise;
        },
        
        unregisterDevice : function (success,failure) {
            var unregistered = $q.defer();
            
            var successUnregisterHandler = function () {
                console.log ('Unregistration to PUSH service was success');
                setRegistrationState (registrationState.UNREGISTRATION_OK);
                unregistered.resolve(); 
            };

            var errorUnregisterHandler = function (message) {
                console.log ('Error Unregistering device to push service' + message);
                setRegistrationState (registrationState.UNREGISTRATION_FAILED);
                unregistered.reject(errorCodes.ERROR_UNASSOCIATING_DEVICE);
            };
             
            //That way we announce to aerogear to unsubcribe from notigications
            AuthService.isTokenAuth().then(function (profile){
                try{
                    push.unregister (successUnregisterHandler,errorUnregisterHandler);
                }catch (err){
                    console.log ('Push service undefined or invalid, can\'t unregister: ' + err);
                    setRegistrationState (registrationState.UNREGISTRATION_FAILED);
                    unregistered.reject(errorCodes.ERROR_SETTING_UP_REGISTRATION);
                }
            }).catch (function (error){
                    console.log ('Unregister was called but it was not authenticated: ' + error);
                    setRegistrationState (registrationState.UNREGISTRATION_FAILED);
                    registered.reject(errorCodes.USER_NOT_ALLOWED);
            });
            
            return unregistered.promise;
        },
        
        //Get the current registration status
        getRegistrationStatus: function (){
            return window.localStorage.registrationStatus;
        },
        
        //get all messages from db
        getMessages: function () {
            var deferred = $q.defer();

            if (msg.messages === undefined){
                loadAll().then (function (messages){
                    msg.messages = messages;
                    deferred.resolve(msg.messages);
                }).catch (function (error){
                    console.log ('Error retrieving messages: ' + error);
                    deferred.reject(error);
                });
            }else{
                deferred.resolve(msg.messages);  
            }
            return deferred.promise;
        },
        //get an stored message
        getMessage : function(messageid) {
            // Simple index lookup
            var deferred = $q.defer();

            this.getMessages().then(function (messages){
                deferred.resolve (_.findWhere (messages, {id:messageid}));    
            }).catch (function (err){
                //Push up the error in case of error
                deferred.reject (err);
            });

            return deferred.promise;
        },
        
        //Look at the server for new messages
        retrieveNewMessages: function () {
            var numMessages = $q.defer();
            var lastDate = window.localStorage['lastMessageDate'];
            var lastDateParam;
            
            if (lastDate){
                lastDateParam = {'lastMessageDate' : new Date(lastDate)};
            }
            
            $http.post (pushConfig.msg_api_url + pushConfig.messagesEP, lastDateParam)
                .success(function (data){
                    var messagesInfo = data;
                    for (messageIdx in messagesInfo.messages){
                        msg.add (messagesInfo.messages[messageIdx]);
                    }
                    
                    window.localStorage['lastMessageDate'] = messagesInfo.currentDate;

                    var messagNum = messagesInfo.messages ? messagesInfo.messages.length : 0;
                    numMessages.resolve(messagNum);
                    
            }).error (function (msg,status){
                    numMessages.reject(errorCodes.ERROR_RETRIEVING_MSGS);   
            });

            return numMessages.promise;
        },
        
        askToDelete: function (messageid) {
            //Not necessary to handle errors here
            
            this.getMessage(messageid).then(function (message){
                 //We assume that is in the list  
                 message.todelete =true;
             });
            
        },

        delete: function (messageid) {
            var deleted = $q.defer();
            
            var index = _.findIndex(msg.messages,{id:messageid});

            if (index > -1){
                 DBService.getDb().then(function (db){
                    db.transaction(
                        function(tx) {
                            tx.executeSql (queries.DELETE_MESSAGE,[messageid],
                                function(tx,res){ //Deletion success
                                    msg.messages.splice (index,1);
                                    deleted.resolve();
                                    $rootScope.$apply ();
                                },
                                function (tx,error){ //Deletion error
                                    console.log ('Error deleting a message: ' + error.message);
                                    deleted.reject(errorCodes.ERROR_DELETING_MSG);
                                }
                            );
                        },
                        function (txerror){
                            console.log ('Error getting a transaction to delete a message: ' + txerror.message);
                            deleted.reject(errorCodes.ERROR_DELETING_MSG);
                        }
                    );
                }).catch (function (error){
                     deleted.reject(errorCodes.ERROR_DELETING_MSG);
                });
            }else {
                console.log ('Message not found, not ready to be deleted');
                deleted.reject(errorCodes.ERROR_DELETING_MSG);
            }
            
            return deleted.promise;
        },
        deleteAll: function (){
            var deleted = $q.defer();
            
             DBService.getDb().then(function (db){
                db.transaction(
                    function(tx) {
                        tx.executeSql (queries.DELETE_ALL_MESSAGES,[],
                            function(tx,res){ //Deletion success
                                msg.messages = [];
                                if (window.localStorage.lastMessageDate){
                                    delete window.localStorage.lastMessageDate;   
                                }
                                deleted.resolve();
                                $rootScope.$apply ();
                            },
                            function (tx,error){ //Deletion error
                                console.log ('Error deleting all messages: ' + error.message);
                                deleted.reject(errorCodes.ERROR_DELETING_ALL_MSGS);
                            }
                        );
                    },
                    function (txerror){
                        console.log ('Error getting a transaction to delete all messages: ' + txerror.message);
                        deleted.reject(errorCodes.ERROR_DELETING_ALL_MSGS);
                    }
                );
            }).catch (function (error){
                 deleted.reject(errorCodes.ERROR_DELETING_ALL_MSGS);
            });
            
            return deleted.promise;
        },
        changeState : function (messageid,state) {
            var changed = $q.defer();
            
            this.getMessage(messageid).then(function (message){
                DBService.getDb().then(function (db){
                    db.transaction(
                        function(tx) {
                            tx.executeSql (queries.CHANGE_STATE,[state,messageid],
                                function(tx,res){
                                    message.state = state;
                                    changed.resolve();
                                },function (tx,error){
                                    console.log (" Error changing the state of the message: " + error.message);   
                                    changed.reject (errorCodes.ERROR_MODIFYING_MSG);
                                });
                        },function (txerror){
                            console.log ("Error getting the transaction for modifying the message" + txerror.message);   
                            changed.reject (errorCodes.ERROR_MODIFYING_MSG);
                        }
                    );
                }).catch (function (error){
                    changed.reject (errorCodes.ERROR_MODIFYING_MSG);
                });
            });
            
            return changed.promise;
        },
        
        undoMessage: {
            'show': false,
            'currentMessage': undefined
        },
        
        setToUndo: function (currentMessage) {
            if (currentMessage){
                this.undoMessage.currentMessage = currentMessage;
                this.undoMessage.show= true;
            }else{
                this.undoMessage.currentMessage = undefined;
                this.undoMessage.show= false;
            }
        },
        errorCodes: errorCodes
    };
    return factoryObject;
});