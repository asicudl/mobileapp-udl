angular.module('starter.messages').controller('MessagesCtrl',['$scope','$ionicPopup','$ionicListDelegate','$timeout','MessagesService','$stateParams','_','$location','$filter',function($scope, $ionicPopup,$ionicListDelegate, $timeout,MessagesService,$stateParams,_,$location,$filter) {
    
    $scope.title = "Messages"; 
    $scope.currentMessage = {};
    $scope.popover = {};

    $scope.initList = function (onmessages){
        //Clear any undo action
        
        $scope.undoMessage = MessagesService.undoMessage;
        
        MessagesService.getMessages().then(function (messagesList){
           $scope.messagesList  = messagesList; 
            if (onmessages){
                onmessages();   
            }
        });
    };
                                            
    $scope.initMessage = function (){
        //Clear any undo action
        //In the case we access directly from event 
        /*MessagesService.getMessage($stateParams.messageId).then(function (message){
            $scope.currentMessage = message;
            MessagesService.changeState($scope.currentMessage.id,'read');
        });*/
        
        //We init the list so we update the list from service
        
        //Clear any undo action
        MessagesService.setToUndo();
        
        $scope.initList(function (){
            $scope.currentMessage = _.findWhere($scope.messagesList,{id:$stateParams.messageId});
            MessagesService.changeState($scope.currentMessage.id,'read');
            }
        );
        
    };
    
    $scope.deleteMessage = function (index){
        
        if (typeof index ==='string'){ // Is an string call the main view to delete it
            var index = _.findIndex($scope.messagesList,{id: index});
        }
        
        var messageId = $scope.messagesList[index].id;

        $ionicListDelegate.closeOptionButtons();
        $scope.messagesList[index].hide = true;
        MessagesService.setToUndo($scope.messagesList[index]);

        setTimeout (function (){
            if ($scope.messagesList[index].hide){
                $scope.apply (function (){
                    //if the undo message is the current deleted message then we hide the undo button
                    if ($scope.undoMessage.currentMessage && $scope.undoMessage.currentMessage.id === $scope.messagesList[index].id){
                        MessagesService.setToUndo();
                    }
                    MessagesService.delete(messageId);
                    
                    
                });
            }
        },5000);
        
        
    };
    
    $scope.markAs = function (index,state){
       
       if (typeof index ==='string'){ // Is an string call the main view to delete it
            var index = _.findIndex($scope.messagesList,{id: index});
        }
        
        var messageId = $scope.messagesList[index].id;
        $scope.messagesList[index].state = state;

        //Save the new state
        MessagesService.changeState(messageId,state);
        $ionicListDelegate.closeOptionButtons();
        
    };
    
     $scope.openOptions = function (index){
         //Clear any undo action
        MessagesService.setToUndo();
        
         var changeButton = ($scope.messagesList[index].state==='read') ? {
                 text: '<i class="ion-eye-disabled"></i> <b>Mark as unread</b>',
                 type: 'button-energized',
                 onTap: function(e) {
                     $scope.markAs(index,'unread');
                 }
            } : 
            {
                 text: '<i class="ion-eye"></i> <b>Mark as read</b>',
                 type: 'button-balanced',
                 onTap: function(e) {
                     $scope.markAs(index,'read');
                 }
            };
        
        var buttons =  [
                {text: '<i class="ion-trash-b"></i> <b>Delete</b>',
                 type: 'button-assertive',
                 onTap: function(e) {
                     $scope.deleteMessage(index);
                    }
                },
                 changeButton,
                 {text: 'Cancel' }
        ];
         
        $scope.optionsPopup = $ionicPopup.show({
            title: '<h3>What to do?</h3>',
            scope: $scope,
            cssClass: 'udlapp-options-menu',
            buttons: buttons,
            animation: 'slide-in-up'
        });
    };
    
    $scope.closeOptions = function ($index){
        $scope.popover.hide();   
    };
    
    $scope.buttonClassNumber = function (sitename){
        var number = 0;
        
        if (sitename && sitename.length > 3){
            number =  (sitename.charCodeAt(0) + sitename.charCodeAt(1)  + sitename.charCodeAt(2)) % 10;
        }
        
        return 'btn_' + number;
    };
    
    $scope.maxdate = function(arr) {
        return $filter('min')
        ($filter('map')(arr, 'date'));
    } ;
    
    $scope.applyUndo = function (){
        if ($scope.undoMessage.currentMessage){
            delete $scope.undoMessage.currentMessage.hide;
            
            //Clear any undo action
            MessagesService.setToUndo();
        }
    };

}]);

