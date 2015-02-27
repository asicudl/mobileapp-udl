angular.module('starter.messages', [])
.service('MessagesService',['AppConfigService',function (AppConfigService){
 
    this.getMessages = function (){
        var items = [
                {from:'10001-1415', source:'cv', subject: 'Nova activitat publicada', id: '2', body:'qweip' },
                {from:'rectorat',  source:'cv', subject: 'Ja teniu les notes del primer parcial', id: '3', body:'qweip' },
                {from:'11223-1415', source:'cv', subject: 'Aplaçada la classe del dimarts', id: '4', body:'qweip'},
                {from:'11221-1415', source:'cv', subject: 'totes les coses van com a sempre', id: '5', body:'qweip' },
        ];
        return items;
    };
            
    this.init = function (){
        var config = AppConfigService.getConfig('dev');
        //TODO
    }
            
}]);