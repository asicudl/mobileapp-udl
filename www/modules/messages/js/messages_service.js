angular.module('starter.messages', [])
.factory('MessagesService', function (AppConfigService, $rootScope, AuthService, $q, DBService, $http) {

    var messagesConfig = {};
    
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
        'ALREADY_RETRIEVING': 21,
        
        //Network accessing problems
        'USER_NOT_ALLOWED': 40
    };
    
       var queries = {
        'CREATE_TABLE' : 'CREATE TABLE IF NOT EXISTS messages (id text primary key, subject text, body text, site text, sitename text,author text, date date,category text,url text,state text)',
        'SELECT_MESSAGES' : 'SELECT * FROM messages order by date asc',
        'INSERT_MESSAGE' : 'INSERT INTO messages (id,subject,body,site,sitename,author,date,category,url,state) VALUES (?,?,?,?,?,?,?,?,?,?)',
        'DELETE_MESSAGE' :'DELETE FROM messages WHERE id=?',
        'DELETE_ALL_MESSAGES' :'DELETE FROM messages',
        'CHANGE_STATE' : 'UPDATE messages set state=? WHERE id=?'
    };
    
    var prettyDates = [
            {name:'pd_today',order:0},
            {name:'pd_yesterday',order:1},
            {name:'pd_thisweek',order:2},
            {name:'pd_lastweek',order:3},
            {name:'pd_thismonth',order:4},
            {name:'pd_later',order:5}
    ];
    
    this.messages = undefined;
    
    var msg = this;
    msg.ready = $q.defer();
    msg.retrieving = false;
    
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

                                messages.push (message);
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
        var period = 5;
        
        if (mdate.isSame(nowdate,'day')){
            period = 0;
        }else if (mdate.isSame (yesterday,'day')){
            period = 1;
        }else if (mdate.isSame(nowdate,'week')){
            period = 2;
        }else if (mdate.isSame(lastweek,'week')){
            period = 3;
        }else if (mdate.isSame(nowdate,'month')){
            peridod = 4;   
        }else{
            period = 5;   
        }
        
        return prettyDates[period];
    };
    
    var updatePrettyDate = function (message) {
        var pdate = getPrettyDate(message.date);
        message.prettyDateFormat = pdate.name;
        message.prettyDateOrder = pdate.order;
    };
  
    this.createMessage = function (data){
       
        var defered = $q.defer();
        
        if (!data.created){
            data.created = new Date (data.created);
        }
        
        var pdate = getPrettyDate(data.created);
        
        var message = {
            id: '' + Math.floor(Math.random()* 100000000000),
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
                    msg.messages.push (message);
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
        init: function (messageDef){
            messagesConfig = messageDef.config;

            //Create messages Table
            DBService.getDb().then (function (db){
                db.transaction(function(tx) {
                    //create a table it doesn't exist
                    tx.executeSql(queries.CREATE_TABLE, [], 
                        function (tx,res) {
                            console.log (messageDef.name + ' initialized');
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
        
        //get all messages from db
        getMessages: function () {
            var defered =  $q.defer();
            if (msg.messages === undefined){
                loadAll().then (function (messages){
                    msg.messages = messages;
                    defered.resolve(msg.messages);
                }).catch (function (error){
                    console.log ('Error retrieving messages: ' + error);
                    defered.reject(error);
                });
            }else{
                defered.resolve(msg.messages);  
            }
            return defered.promise;
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
        retrieveNewMessages: function (isRetry) {
            var numMessages = $q.defer();
            
            //First prevent executing more than one retrieves 
            if (msg.retrieving) {
                numMessages.reject (errorCodes.ALREADY_RETRIEVING);
            }else{
                msg.retrieving = true;

                var lastDate = window.localStorage['lastMessageDate'];
                var lastDateParam;

                if (lastDate){
                    lastDateParam = {'lastMessageDate' : new Date(lastDate)};
                }
                
                AuthService.hasApiToken().then (function() {
                    $http.post (messagesConfig.msg_api_url + messagesConfig.messagesEP, lastDateParam)
                    .success(function (data){
                        var messagesInfo = data;
                        for (messageIdx in messagesInfo.messages){
                            msg.add (messagesInfo.messages[messageIdx]);
                        }

                        window.localStorage['lastMessageDate'] = messagesInfo.currentDate;
                        
                        //Let's give some time to ensure that time is below in all backend servers (triky)
                        setTimeout (function (){
                            msg.retrieving = false;
                        },3000);
                       

                        var messagNum = messagesInfo.messages ? messagesInfo.messages.length : 0;
                        numMessages.resolve(messagNum);

                    }).error (function (status){
                        numMessages.reject(errorCodes.ERROR_RETRIEVING_MSGS);
                        msg.retrieving = false;
                    });

                }).catch (function (error){
                    numMessages.reject(errorCodes.ERROR_RETRIEVING_MSGS);
                    msg.retrieving = false;
                });
            }
            
            return numMessages.promise;
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
                                if (msg && msg.messages){
                                    msg.messages.splice(0,msg.messages.length);
                                }
                            
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
        recalculateDates : function () {
            factoryObject.getMessages().then (function (messages) {
                var now = new Date();
                for (var idx in messages) {
                    updatePrettyDate(messages[idx]);
                }
            });
        },
        errorCodes: errorCodes
    };
    return factoryObject;

});