angular.module('starter.messages', [])
.factory('MessagesService',function (AppConfigService,$rootScope,AuthService,$q,DBService){

    var pushConfig = {};
    this.messages = [];
    var msg = this;

    var CREATE_TABLE = 'CREATE TABLE IF NOT EXISTS messages (id text primary key, subject text, body text, site text, sitename text,date date,category text,url text,state text)';
    var SELECT_MESSAGES = 'SELECT * FROM messages';
    var INSERT_MESSAGE = 'INSERT INTO messages (id,subject,body,site,sitename,date,category,url,state) VALUES (?,?,?,?,?,?,?,?,?)';
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
        var mdate = moment(date,'YYYYMMDD');
        
        if (mdate.isSame(nowdate,'month')){
            if (mdate.isSame(nowdate,'week')){
                if (mdate.isSame(nowdate,'day')){
                       return prettyDates[0];
                }else if (mdate.isSame (yesterday,day)){
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
    
   var successHandler = function () {
      
   };

   var errorHandler = function (message) {
       
   };

    var onNotification = function(event) {
            msg.add(event);
    };
    
    
    this.createMessage = function (data,success,failure){
        var nowdate = new Date();
        
        var message = {
            id: '' + Math.floor(Math.random()* 10000),
            subject: data["udl-noti-subject"],
            body: data["udl-noti-body"],
            site: data["udl-noti-site"],
            sitename: data["udl-noti-sitename"],
            action: 'open',
            category: data["udl-noti-category"],
            url: data["udl-noti-url"],
            date: nowdate,
            prettyDateFormat: getPrettyDate(nowdate).name,
            prettyDateOrder : getPrettyDate(nowdate).order,
            state: data["udl-noti-state"]
        };

        DBService.getDb().then (function (db){
            db.transaction(function(tx) {
                tx.executeSql(INSERT_MESSAGE, [message.id,message.subject,message.body,message.site,message.sitename,message.date,message.category,message.url,message.state],
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

    this.add = function(pushmessage) {
        if (pushmessage && pushmessage.payload){
            msg.createMessage (pushmessage.payload,function (message){
                msg.messages.unshift (message);
                $rootScope.$apply ();    
            },function (error){
                alert ("Message could not be inserted " + JSON.stringify(error)); 
            });

        }
    };
    
    this.initTable = function (){
        
    };


    /** Return the exposed methods*/
    
    return {
        
        init: function (pushServiceDef){
            pushConfig = pushServiceDef.config;
            console.log (pushServiceDef.name + ' initialized');

            //Create messages Table
            DBService.getDb().then (function (db){
                db.transaction(function(tx) {
                    //create a table it doesn't exist
                    tx.executeSql(CREATE_TABLE, [], function (tx,res) {
                        console.log ('TABLE CREATED');
                    });
                });
            });
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

            this.getMessages().then(function (messages){
                    deferred.resolve (_.findWhere (messages,{id:messageid}));    
            });

            return deferred.promise;
        },
        askToDelete : function (messageid){
             this.getMessage(messageid).then(function (message){
                 //We assume that is in the list  
                 message.todelete =true;
             });
        },
        delete : function (messageid){
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
});