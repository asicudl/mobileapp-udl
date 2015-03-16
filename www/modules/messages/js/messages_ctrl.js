angular.module('starter.messages')

.controller('MessagesCtrl',['$scope','$ionicModal','$timeout','MessagesService','$stateParams','_','$location', function($scope, $ionicModal, $timeout,MessagesService,$stateParams,_,$location) {
    
    $scope.title = "Messages"; 
    $scope.currentMessage = {};
    
    $scope.initList = function (onmessages){
        MessagesService.getMessages().then(function (messagesList){
           $scope.messagesList  = messagesList; 
            if (onmessages){
                onmessages();   
            }
        
            
        });
        
    };
    
    $scope.initMessage = function (){
        
        //In the case we access directly from event 
        if ($scope.messagesList===undefined || $scope.messagesList.lenght <= 0){
            $scope.initList(function (){
                //Look for the agenda Event
                $scope.currentMessage = _.findWhere($scope.messagesList,{id: $stateParams.messageId});
            });
        }
    };
    
    $scope.deleteMessage = function (index){
       
        if (typeof index ==='string'){
            var index = _.findIndex($scope.messagesList,{id: $scope.currentMessage.id});
        }
        
        var messageId = $scope.messagesList[index].id;
        $scope.messagesList[index].hide = true;
        
        setTimeout (function (){
            MessagesService.delete(messageId);
        },300);
        
        $location.path ('/app/messages');
    }
    
}]);

