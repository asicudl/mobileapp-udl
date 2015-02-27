angular.module('starter.messages')

.controller('MessagesCtrl',['$scope','$ionicModal','$timeout','MessagesService','$stateParams', function($scope, $ionicModal, $timeout,MessagesService,$stateParams) {
    
    $scope.title = "Messages"; 
    MessagesService.init ();
    
    
    $scope.initList = function (){
         $scope.messagesList  = MessagesService.getMessages();
    };
    
    $scope.initMessage = function (){
        
        //In the case we access directly from event 
        if ($scope.messagesList===undefined || $scope.messagesList.lenght <= 0){
            $scope.initList();
        }
        
        //Look for the agenda Event
        for (var i = 0; i < $scope.messagesList.length; i++){
            if ($scope.messagesList[i].id ===  $stateParams.messageId){
                $scope.currentMessage = $scope.messagesList [i];
                break;
            }
        }
    };
    
}]);

