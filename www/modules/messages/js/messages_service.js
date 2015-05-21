angular.module('starter.messages', [])
.factory('MessagesService',function (AppConfigService,$rootScope,AuthService,$q,DBService,$http){

    var pushConfig = {};

    this.messages = undefined;
    
    var msg = this;
    msg.ready = $q.defer();

    var CREATE_TABLE = 'CREATE TABLE IF NOT EXISTS messages (id text primary key, subject text, body text, site text, sitename text, author text, date date,category text,url text,state text)';
    var SELECT_MESSAGES = 'SELECT * FROM messages';
    var INSERT_MESSAGE = 'INSERT INTO messages (id,subject,body,site,sitename,author,date,category,url,state) VALUES (?,?,?,?,?,?,?,?,?,?)';
    var DELETE_MESSAGE = 'DELETE FROM messages WHERE id=?';
    var CHANGE_STATE = 'UPDATE messages set state=? WHERE id=?';

    var loadAll = function (success,failure){
     
        DBService.getDb().then (function (db){
            db.transaction(function(tx) {
            
                //load the list of messages
                tx.executeSql (SELECT_MESSAGES,[],function(tx,res){
                    msg.messages = [];

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

                        msg.messages.unshift (message);
                    }
                    success();
                },function (error){
                    failure (error);
                });
            });

        });
    };
    
     var prettyDates = [
            {name:'Today',order:0},
            {name:'Yesterday',order:1},
            {name:'This Week',order:2},
            {name:'Last Week',order:3},
            {name:'This Month',order:4},
            {name:'Later',order:5}
        ];
    
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
    
    
    this.createMessage = function (data,success,failure){
        var msgdate;
        
        if (data.created){
            msgdate = new Date (data.created);
        }else{
            msgdate = new Date ();
        }
        
        var pdate = getPrettyDate(msgdate);
        
        var message = {
            id: '' + Math.floor(Math.random()* 10000),
            subject: data.subject,
            body: data.content,
            site: data.siteId,
            sitename: data.siteTitle,
            category: 'cv',
            url: data.notiURL,
            author: data.author,
            date: msgdate,
            prettyDateFormat: pdate.name,
            prettyDateOrder : pdate.order,
            state: 'new'
        };

        DBService.getDb().then (function (db){
            db.transaction(function(tx) {
                tx.executeSql(INSERT_MESSAGE, [message.id,message.subject,message.body,message.site,message.sitename,message.author,message.date,message.category,message.url,message.state],
                  function (tx,res) {
                      success(message);
                  },
                  function (tx,error){
                      failure (error);  
                  });
            });
        });
        
        return message;     
    };

    this.add = function(messageIn) {
        if (messageIn){
            
            //We ensure that we load all the messages before to add it
            factoryObject.getMessages().then (function (){
                msg.createMessage (messageIn,function (message){
                    msg.messages.unshift (message);   
                    $rootScope.$apply ();    
                },function (error){
                    alert ("Message could not be inserted " + JSON.stringify(error)); 
                });
            });
        }
    };
    
    this.initTable = function (){
        
    };


    /** Return the exposed methods*/
    
    var factoryObject = {
        
        init: function (pushServiceDef){
            pushConfig = pushServiceDef.config;

            //Create messages Table
            DBService.getDb().then (function (db){
                db.transaction(function(tx) {
                    //create a table it doesn't exist
                    tx.executeSql(CREATE_TABLE, [], function (tx,res) {
                        //Get a refresh 
                        console.log ('TABLE CREATED');
                        console.log (pushServiceDef.name + ' initialized');
                        msg.ready.resolve();
                    });
                });
            });
        },
        isReady : function (){
            return msg.ready.promise;   
        },
        
        
        registerDevice : function (){
            var registered  = $q.defer();
            
            
            var successHandler = function () {
                console.log ('Registration to PUSH service was success');
                registered.resolve(); 
            };

            var errorHandler = function (message) {
                console.log ('Error registering device to push service' + message);
                registered.reject();
            };
            
            AuthService.isTokenAuth().then(
                function (profile){
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
                        push.register(onNotification, successHandler, errorHandler, pushConfig);
                        
                    }catch (err) {
                        //Something went wrong 
                        registered.reject();
                    }
                }
            ).catch (function (error){
                registered.reject();
                console.log ('Registrations was called but it was not authenticated');
            });
            
            return registered.promise;
        },
        unassociateDevice : function (success,failure){
             if (typeof push !== 'undefined') {
                
                //That way we announce to aerogear to unsubcribe from notigications
                pushConfig.alias = 'unregister';
                push.register(onNotification, successHandler, errorHandler, pushConfig);
            } else {
                console.log ("Push service undefined, can't unregister");   
            }
        },
        unregisterDevice : function (success,failure){
            if (typeof push !== 'undefined') {
                push.unregister (function (){
                    console.log ("device unregistered");   
                },function (){
                    console.log ("device failed registering");   
                });   
            } else {
                console.log ("Push service undefined, can't unregister");   
            }
        },
        //get all messages from db
        getMessages: function (){
            var deferred = $q.defer();

            if (msg.messages === undefined){
                loadAll (function (){
                    deferred.resolve(msg.messages);
                },function (error){
                    console.log ("Error loading data " + error);
                    deferred.reject();
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
                    deferred.resolve (_.findWhere (messages,{id:messageid}));    
            });

            return deferred.promise;
        },
        //Look at the server for new messages
        retrieveNewMessages: function (){
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
                    numMessages.reject();   
            });

            return numMessages.promise;
        },
        askToDelete: function (messageid){
             this.getMessage(messageid).then(function (message){
                 //We assume that is in the list  
                 message.todelete =true;
             });
        },

        delete: function (messageid){
            var index = _.findIndex(msg.messages,{id:messageid});
            msg.messages.splice (index,1);

             DBService.getDb().then(function (db){
                db.transaction(function(tx) {
                    tx.executeSql (DELETE_MESSAGE,[messageid],function(tx,res){
                    },function (tx,error){
                        alert (" error" + error);   
                    });
                });
            });

            $rootScope.$apply ();

        },
        changeState : function (messageid,state){
            this.getMessage(messageid).then(function (message){
                message.state = state;
                DBService.getDb().then(function (db){
                    db.transaction(function(tx) {
                        tx.executeSql (CHANGE_STATE,[state,messageid],function(tx,res){
                        },function (tx,error){
                            alert (" error" + error);   
                        });
                    });
                });
            });
        },
        undoMessage: {
            'show': false,
            'currentMessage': undefined
        },
        setToUndo: function (currentMessage){
            if (currentMessage){
                this.undoMessage.currentMessage = currentMessage;
                this.undoMessage.show= true;
            }else{
                this.undoMessage.currentMessage = undefined;
                this.undoMessage.show= false;
            }
        }
    }
    return factoryObject;
});