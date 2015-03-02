angular.module('starter.messages', [])
.factory('MessagesService',function (AppConfigService){
 
    var pushConfig = {};
    
    return {
        
        init: function (pushServiceDef){
            pushConfig = pushServiceDef.config;
            console.log (pushServiceDef.name + ' initialized');  
        },
        getMessages : function (){
            var items = [
                    {from:'10001-1415', source:'cv', subject: 'Nova activitat publicada', id: '2', body:'qweip' },
                    {from:'rectorat',  source:'cv', subject: 'Ja teniu les notes del primer parcial', id: '3', body:'qweip' },
                    {from:'11223-1415', source:'cv', subject: 'Aplaçada la classe del dimarts', id: '4', body:'qweip'},
                    {from:'11221-1415', source:'cv', subject: 'totes les coses van com a sempre', id: '5', body:'qweip' },
            ];
            return items;
        }
    }
});