angular.module('starter.messages', [])
.factory('MessagesService',function (AppConfigService,$rootScope,AuthService,$q,$cordovaSQLite,$window){

    var pushConfig = {};
    this.messages = [];

    this.db = undefined;
    
    this.getDb = function (){
        this.db =  $q.defer();
        return this.db.promise;
    };
    
    var msg = this;

    var CREATE_TABLE = 'CREATE TABLE IF NOT EXISTS messages (id integer primary key, header text, body text,date date,category text,url text,state text)';
    var SELECT_MESSAGES = 'SELECT * FROM messages';
    var INSERT_MESSAGE = 'INSERT INTO messages (id,header,body,category,url,state) VALUES (?,?,?,?,?,?)';
    var DELETE_MESSAGE = 'DELETE FROM messages WHERE id=?';


    var loadAll = function (success,failure){
        msg.getDb().then (function (db){
           db.transaction(function(tx) {
                //load the list of messages
                tx.executeSql (SELECT_MESSAGES,[],function(tx,res){
                    msg.messages = [];

                    for (var i=0;i < res.rows.length; i++){
                        var row = res.rows.item(i);
                        var message = {
                            id: row.id,
                            title: row.header,
                            text: row.body,
                            action: 'open',
                            category: row.category,
                            url: row.url,
                            //date: row.date,
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

    return {

        init: function (pushServiceDef){
            pushConfig = pushServiceDef.config;
            console.log (pushServiceDef.name + ' initialized');

            //Open the local app database connection
            
            //msg.db = window.sqlitePlugin.openDatabase({name: "my.db", location: 1});
            msg.db = $q.defer();
            
            var createTable =  function (){
                msg.db.transaction(function(tx) {
                    //create a table it doesn't exist
                    tx.executeSql(CREATE_TABLE, [], function (tx,res) {
                        console.log ('TABLE CREATED');
                    });
                });
            };
            
            
            if($window.cordova) {
                msg.db = $cordovaSQLite.openDB({name: "messages.db"},function (){
                    createTable();
                    msg.getDb().resolve(msg.db);
                });
            } else {
                msg.db = $window.openDatabase("messages.db", '1', 'my database', 5 * 1024 * 1024,function (){
                   //Init the database
                    createTable();
                    msg.getDb().resolve (msg.db);
                });
            }

        },
        
        registerDevice : function (username, password, success, failure){
            
            AuthService.authenticate (username,password).then(   
                function (profile){
                     //setup the push service
                    try{
                        //Set the alias name to the pushConfig
                        pushConfig.alias = username;
                                                
                        push.register(onNotification, successHandler, errorHandler, pushConfig);
                        success(profile);   
                    }catch (err) {
                        //error registering device
                        txt = "There was an error on this page.\n\n";
                        txt += "Error description: " + err.message + "\n\n";
                        failure(txt);
                    }
                }
            ).catch (function (error){
                //Error authentication
                failure(error);
            });
        },

        getMessages : function (){
            var deferred = $q.defer();

            if (msg.messages.length === 0){
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
        
        getMessage : function(messageid) {
            // Simple index lookup
            var deferred = $q.defer();
            
            var items = getMessages().then(function (){
                deferred.respolve (_.findWhere (messages,{id:messageid}));    
            });
                
            return deferred.promise;
        },
        createMessage : function (data,success,failure){
              var message = {
                id: Math.floor(Math.random()* 10000),
                title: data["udl-noti-header"],
                text: data["udl-noti-body"],
                action: 'open',
                category: data["udl-noti-category"],
                url: data["udl-noti-url"],
                date: new Date (),
                state: 'new'
            };
       
            msg.getDb().transaction(function(tx) {
                tx.executeSql(INSERT_MESSAGE, [message.id,message.title,message.text,message.category,message.url,message.state],
                          function (tx,res) {
                              success(message);
                          },
                          function (tx,error){
                              failure (error);  
                          });
            });
       
            return message;     
        },

        add :  function(pushmessage) {
            if (pushmessage && pushmessage.payload){
                msg.createMessage (pushmessage.payload,function (message){
                    msg.messages.unshift (message);
                    $rootScope.$apply ();    
                },function (error){
                    alert ("Message could not be inserted " + JSON.stringify(error)); 
                });

            }
        },

        delete : function (messageid){
            for (var i=0; i< msg.messages.length; i++){
                if (messageid == msg.messages[i].id){
                    msg.messages.splice(i,1);
                    msg.getDb().transaction(function(tx) {
                        tx.executeSql (DELETE_MESSAGE,[messageid],function(tx,res){
                        },function (tx,error){
                            alert (" error" + error);   
                        });
                    });

                    $rootScope.$apply ();
                    break;
                }
            };
        },

        successHandler : function () {

        },

        errorHandler : function (message) {
            alert('error ' + message);
        },

        onNotification: function(event) {
            console.log
            msg.add(event);
        }

    }
});